import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChargePaymentDto, DepositDto } from './payment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.startEscrowScanner();
  }

  private startEscrowScanner() {
    // Quét mỗi 10 giây trong môi trường test/demo
    setInterval(async () => {
      try {
        await this.scanAndReleaseEscrows();
      } catch (err) {
        console.error('[EscrowScanner] Error scanning escrows:', err);
      }
    }, 10000);
  }

  async scanAndReleaseEscrows() {
    const now = new Date();
    const escrowsToRelease = await this.prisma.escrowTransaction.findMany({
      where: {
        status: 'HELD',
        releaseAt: {
          lte: now
        }
      }
    });

    if (escrowsToRelease.length > 0) {
      console.log(`[EscrowScanner] Found ${escrowsToRelease.length} escrows ready for release. Processing...`);
      for (const escrow of escrowsToRelease) {
        try {
          await this.releaseEscrow(escrow.orderId);
          // Tự động chuyển đơn sang COMPLETED bên order-service sau khi hết hạn 3 ngày tạm giữ Escrow
          try {
            await fetch(`http://order-service:3002/orders/${escrow.orderId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'COMPLETED' })
            });
            console.log(`[EscrowScanner] Order ${escrow.orderId} status auto-updated to COMPLETED`);
          } catch (e) {
            console.error(`[EscrowScanner] Failed to sync order ${escrow.orderId} status:`, e);
          }
        } catch (err) {
          console.error(`[EscrowScanner] Failed to release escrow for order ${escrow.orderId}:`, err);
        }
      }
    }
  }

  async getWallet(buyerId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { buyerId },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          buyerId,
          balance: 5000000, // 5.000.000đ mặc định để test
        },
      });
    }

    return wallet;
  }

  async deposit(dto: DepositDto) {
    const wallet = await this.getWallet(dto.buyerId);

    const updatedWallet = await this.prisma.wallet.update({
      where: { buyerId: dto.buyerId },
      data: {
        balance: {
          increment: dto.amount,
        },
      },
    });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: dto.amount,
        type: 'DEPOSIT',
        description: dto.description || 'Nạp tiền vào ví qua cổng VietQR',
        status: 'SUCCESS',
      },
    });

    return updatedWallet;
  }

  // Tạo pending WalletTransaction để tracking khi quét QR nạp ví
  async createDepositPending(buyerId: string, amount: number, memo: string) {
    const wallet = await this.getWallet(buyerId);
    const tx = await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'DEPOSIT',
        description: `Đang chờ chuyển khoản QR (Memo: ${memo})`,
        status: 'PENDING',
      },
    });
    return { transactionId: tx.id, walletId: wallet.id };
  }

  // Polling trạng thái WalletTransaction theo ID (dùng để frontend poll)
  async getWalletTransactionStatus(txId: string) {
    const tx = await this.prisma.walletTransaction.findUnique({ where: { id: txId } });
    if (!tx) return { status: 'NOT_FOUND' };
    return { status: tx.status };
  }

  // Hủy / Xóa WalletTransaction PENDING khi người dùng bấm ✕ đóng modal nạp tiền
  async cancelWalletTransaction(txId: string) {
    try {
      const tx = await this.prisma.walletTransaction.findUnique({ where: { id: txId } });
      if (tx && tx.status === 'PENDING') {
        await this.prisma.walletTransaction.delete({ where: { id: txId } });
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async chargePayment(dto: ChargePaymentDto) {
    // 1. Khởi tạo transaction ghi nhận thanh toán ở trạng thái PENDING
    let txRecord = await this.prisma.transaction.create({
      data: {
        orderId: dto.orderId,
        buyerId: dto.buyerId,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        status: 'PENDING',
      },
    });

    try {
      if (dto.paymentMethod === 'cod') {
        // Đối với COD, giữ trạng thái giao dịch PENDING và đơn hàng PENDING chờ người bán bấm xác nhận đơn hàng
        return txRecord;
      }

      if (dto.paymentMethod === 'zeropay') {
        // Ví điện tử giả lập
        const wallet = await this.getWallet(dto.buyerId);

        if (wallet.balance < dto.amount) {
          // Cập nhật giao dịch thất bại
          await this.prisma.transaction.update({
            where: { id: txRecord.id },
            data: { status: 'FAILED' },
          });
          throw new BadRequestException('Số dư ví ZeroPay không đủ để thanh toán đơn hàng này!');
        }

        // Thực hiện trừ tiền ví và cập nhật transaction thành công
        await this.prisma.$transaction(async (prismaTx) => {
          const updatedWallet = await prismaTx.wallet.update({
            where: { buyerId: dto.buyerId },
            data: {
              balance: {
                decrement: dto.amount,
              },
            },
          });

          await prismaTx.walletTransaction.create({
            data: {
              walletId: updatedWallet.id,
              amount: dto.amount,
              type: 'PAYMENT',
              description: `Thanh toán đơn hàng #${dto.orderId}`,
              status: 'SUCCESS',
            },
          });

          txRecord = await prismaTx.transaction.update({
            where: { id: txRecord.id },
            data: {
              status: 'SUCCESS',
              providerTxId: `ZPAY-${randomUUID()}`,
            },
          });
        });

        // Gọi order-service để cập nhật đơn hàng thành PROCESSING (đã thanh toán)
        await this.updateOrderStatusOnOrderService(dto.orderId, 'PROCESSING');
        return txRecord;
      }

      if (dto.paymentMethod === 'sepay') {
        // Đối với Sepay, giữ trạng thái giao dịch PENDING cho đến khi nhận được Webhook ngân hàng
        return txRecord;
      }

      // Đối với các phương thức online khác (napas, card, gpay)
      // Giả lập thanh toán online thành công ngay lập tức
      txRecord = await this.prisma.transaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'SUCCESS',
          providerTxId: `ONLINE-${randomUUID()}`,
        },
      });

      await this.updateOrderStatusOnOrderService(dto.orderId, 'PROCESSING');
      return txRecord;

    } catch (error) {
      // Đảm bảo cập nhật transaction thành FAILED nếu có bất kì lỗi logic nghiệp vụ nào xảy ra
      if (dto.paymentMethod !== 'cod') {
        try {
          await this.prisma.transaction.update({
            where: { orderId: dto.orderId },
            data: { status: 'FAILED' },
          });
        } catch (e) {
          // ignore
        }
      }
      throw error;
    }
  }

  private async updateOrderStatusOnOrderService(orderId: string, status: string) {
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
      const url = `${orderServiceUrl}/orders/${orderId}/status`;
      console.log(`PaymentService: Calling order-service to update status to ${status} for order ${orderId} at ${url}`);
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        console.error(`Failed to update order status on order-service: ${res.statusText}`);
      } else {
        console.log(`PaymentService: Successfully updated order ${orderId} to ${status}`);
      }
    } catch (e) {
      console.error('Error calling order-service to update status:', e);
    }
  }

  async getTransactionStatus(orderId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { orderId },
    });
    if (!tx) {
      return { status: 'NOT_FOUND' };
    }
    return { status: tx.status };
  }

  async processSepayWebhook(body: any) {
    console.log('PaymentService: Received Sepay webhook payload:', JSON.stringify(body));

    // Sepay có thể gửi nội dung ở nhiều field khác nhau tùy nguồn (API test vs bank thật vs MoMo)
    const transactionContent = body.transaction_content || body.transactionContent
      || body.content || body.description || '';
    const code = body.code || '';
    const amountIn = parseFloat(body.amount_in || body.amountIn || body.transferAmount) || 0;
    const referenceNumber = body.reference_number || body.referenceNumber
      || body.referenceCode || `SEPAY-${Date.now()}`;

    console.log(`PaymentService: Parsed content="${transactionContent}", amount=${amountIn}, ref=${referenceNumber}`);

    // ------------------------------------------------------------------
    // A. KIỂM TRA GIAO DỊCH GIẢI NGÂN RÚT TIỀN (OUTBOUND PAYOUT WEBHOOK)
    // Nội dung: RUTTIEN ZM WR100234 hoặc RUTTIEN ZM WR-100234
    // ------------------------------------------------------------------
    let withdrawCode = '';
    const withdrawMatch = transactionContent.match(/RUTTIEN\s*(?:ZM)?\s*(?:WR-?)?([a-zA-Z0-9]+)/i);
    if (withdrawMatch && withdrawMatch[1]) {
      withdrawCode = withdrawMatch[1].toUpperCase();
    }

    if (withdrawCode) {
      console.log(`PaymentService: Detected withdrawal payout webhook with code: ${withdrawCode}`);
      
      const pendingWithdrawals = await this.prisma.withdrawRequest.findMany({
        where: { status: 'PENDING' },
      });

      const matchedRequest = pendingWithdrawals.find(req => {
        const numericId = req.id.replace(/-/g, '').substring(0, 8);
        const hexNum = String((parseInt(numericId, 16) % 899999) + 100000);
        return req.id.toLowerCase().includes(withdrawCode.toLowerCase()) || 
               hexNum === withdrawCode ||
               `WR${hexNum}` === withdrawCode ||
               `WR-${hexNum}` === withdrawCode;
      });

      if (matchedRequest) {
        console.log(`PaymentService: Auto-approving withdraw request ${matchedRequest.id} via Sepay webhook`);
        await this.approveWithdrawRequest(matchedRequest.id, 'APPROVED');
        return { success: true, message: `Tự động phê duyệt giải ngân lệnh rút tiền #${matchedRequest.id} thành công` };
      } else {
        console.warn(`PaymentService: No pending withdraw request matched payout code ${withdrawCode}`);
      }
    }
    let walletShortId = '';
    const walletMatch = transactionContent.match(/ZMWALLET([a-zA-Z0-9]+)/i);
    if (walletMatch && walletMatch[1]) {
      walletShortId = walletMatch[1];
    }

    if (walletShortId) {
      console.log(`PaymentService: Detected wallet deposit webhook for user short ID: ${walletShortId}, amount: ${amountIn}`);
      // Tìm ví của user có ID bắt đầu bằng walletShortId
      const wallet = await this.prisma.wallet.findFirst({
        where: {
          buyerId: {
            startsWith: walletShortId.toLowerCase(),
          },
        },
      });

      if (!wallet) {
        console.error(`PaymentService: No wallet matches user short ID: ${walletShortId}`);
        return { success: false, message: `Không tìm thấy ví của người dùng với mã ${walletShortId}` };
      }

      // Kiểm tra xem giao dịch này đã được xử lý chưa để tránh cộng tiền trùng lặp (Idempotency Check)
      const existingTx = await this.prisma.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          description: {
            contains: `Ref: ${referenceNumber}`,
          },
        },
      });

      if (existingTx) {
        console.log(`PaymentService: Deposit reference ${referenceNumber} already processed for wallet ${wallet.id}`);
        return { success: true, message: 'Giao dịch đã được xử lý trước đó' };
      }

      // Tìm pending WalletTransaction của ví này để update thành SUCCESS
      const pendingTx = await this.prisma.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          status: 'PENDING',
          type: 'DEPOSIT',
        },
        orderBy: { createdAt: 'desc' },
      });

      // Cộng tiền vào ví
      await this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountIn } },
      });

      if (pendingTx) {
        // Update pending tx thành SUCCESS và ghi đúng số tiền thực tế
        await this.prisma.walletTransaction.update({
          where: { id: pendingTx.id },
          data: {
            amount: amountIn,
            status: 'SUCCESS',
            description: `Nạp tiền thành công qua QR (Ref: ${referenceNumber})`,
          },
        });
        console.log(`PaymentService: Updated pending tx ${pendingTx.id} to SUCCESS for wallet ${wallet.id}`);
      } else {
        // Không có pending tx → tạo mới
        await this.prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: amountIn,
            type: 'DEPOSIT',
            description: `Nạp tiền tự động qua QR Ngân hàng (Ref: ${referenceNumber})`,
            status: 'SUCCESS',
          },
        });
      }

      console.log(`PaymentService: Successfully credited ${amountIn} to wallet of user ${wallet.buyerId}`);
      return { success: true, message: 'Nạp tiền ví thành công' };
    }

    // Tìm mã đơn hàng từ trường code hoặc transactionContent (Regex ZM[A-Z0-9]+)
    let orderShortId = code ? code.replace(/^ZM/i, '') : '';
    if (!orderShortId && transactionContent) {
      const match = transactionContent.match(/ZM([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        orderShortId = match[1];
      }
    }

    if (!orderShortId) {
      console.error('PaymentService: Cannot extract Order ID from content:', transactionContent);
      return { success: false, message: 'Nội dung chuyển khoản không hợp lệ' };
    }

    // Tìm transaction tương ứng (hỗ trợ cả khớp toàn bộ orderId hoặc bắt đầu bằng short ID)
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        OR: [
          { orderId: { equals: orderShortId, mode: 'insensitive' } },
          { orderId: { startsWith: orderShortId, mode: 'insensitive' } },
        ],
      },
    });

    if (!transaction) {
      console.error(`PaymentService: No transaction matching short order ID: ${orderShortId}`);
      return { success: false, message: `Không tìm thấy đơn hàng với mã ${orderShortId}` };
    }

    if (transaction.status === 'SUCCESS') {
      console.log(`PaymentService: Transaction ${transaction.id} already processed`);
      return { success: true, message: 'Giao dịch đã được xử lý trước đó' };
    }

    // Cập nhật trạng thái transaction thành SUCCESS
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'SUCCESS',
        providerTxId: referenceNumber,
      },
    });

    // Gọi order-service cập nhật trạng thái đơn hàng thành PROCESSING
    await this.updateOrderStatusOnOrderService(transaction.orderId, 'PROCESSING');

    console.log(`PaymentService: Successfully verified and updated payment for order: ${transaction.orderId}`);
    return { success: true, message: 'Thanh toán thành công' };
  }

  async getWalletTransactions(buyerId: string) {
    const wallet = await this.getWallet(buyerId);
    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWithdrawRequest(shopId: string, amount: number, bankName: string, bankAccount: string, accountName: string) {
    const wallet = await this.getWallet(shopId);
    if (wallet.balance < amount) {
      throw new BadRequestException('Số dư ví doanh thu không đủ để rút!');
    }

    return this.prisma.$transaction(async (prismaTx) => {
      await prismaTx.wallet.update({
        where: { buyerId: shopId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      const request = await prismaTx.withdrawRequest.create({
        data: {
          shopId,
          amount,
          bankName,
          bankAccount,
          accountName,
          status: 'PENDING',
        },
      });

      await prismaTx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount,
          type: 'WITHDRAW',
          description: `Rút tiền về tài khoản ngân hàng ${bankName} (${bankAccount}) - Mã yêu cầu: ${request.id}`,
          status: 'PENDING',
        },
      });

      return request;
    });
  }

  async approveWithdrawRequest(id: string, status: 'APPROVED' | 'REJECTED') {
    const request = await this.prisma.withdrawRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu rút tiền');
    }

    if (request.status !== 'PENDING') {
      if (request.status === status) {
        return request;
      }
      throw new BadRequestException('Yêu cầu rút tiền này đã được xử lý trước đó!');
    }

    return this.prisma.$transaction(async (prismaTx) => {
      const updatedRequest = await prismaTx.withdrawRequest.update({
        where: { id },
        data: { status },
      });

      const wallet = await prismaTx.wallet.findUnique({
        where: { buyerId: request.shopId },
      });

      if (wallet) {
        if (status === 'APPROVED') {
          await prismaTx.walletTransaction.updateMany({
            where: {
              walletId: wallet.id,
              type: 'WITHDRAW',
              description: { contains: id },
            },
            data: { status: 'SUCCESS' },
          });
        } else if (status === 'REJECTED') {
          await prismaTx.wallet.update({
            where: { buyerId: request.shopId },
            data: {
              balance: {
                increment: request.amount,
              },
            },
          });

          await prismaTx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: request.amount,
              type: 'REFUND',
              description: `Hoàn tiền rút về tài khoản ngân hàng do yêu cầu bị từ chối - Mã: ${id}`,
              status: 'SUCCESS',
            },
          });

          await prismaTx.walletTransaction.updateMany({
            where: {
              walletId: wallet.id,
              type: 'WITHDRAW',
              description: { contains: id },
            },
            data: { status: 'FAILED' },
          });
        }
      }

      return updatedRequest;
    });
  }

  async getWithdrawRequests(shopId?: string) {
    if (shopId) {
      return this.prisma.withdrawRequest.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.withdrawRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWithdrawRequestById(id: string) {
    return this.prisma.withdrawRequest.findUnique({
      where: { id },
    });
  }

  // Hoàn tiền đơn hàng vào ví người mua
  async refundOrder(orderId: string, buyerId: string, amount: number) {
    const wallet = await this.getWallet(buyerId);

    const updatedWallet = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: amount,
        },
      },
    });

    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: 'REFUND',
        description: `Hoàn tiền trả hàng cho đơn hàng #${orderId}`,
        status: 'SUCCESS',
      },
    });

    console.log(`PaymentService: Refunded ${amount} for order ${orderId} to user ${buyerId} wallet`);
    return updatedWallet;
  }

  async getCommissionRate(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: 'commission_rate' },
    });
    if (!config) {
      return 5.0; // Mặc định chiết khấu sàn 5.0%
    }
    return parseFloat(config.value);
  }

  async updateCommissionRate(rate: number) {
    return this.prisma.systemConfig.upsert({
      where: { key: 'commission_rate' },
      update: { value: rate.toString() },
      create: { key: 'commission_rate', value: rate.toString() },
    });
  }

  async creditShopRevenue(payload: { orderId: string; totalAmount: number; items: { shopId: string; amount: number }[] }) {
    const rate = await this.getCommissionRate();
    
    // Kiểm tra trùng lặp
    const existingTx = await this.prisma.walletTransaction.findFirst({
      where: {
        description: {
          contains: `đơn hàng #${payload.orderId}`
        }
      }
    });
    if (existingTx) {
      console.log(`PaymentService: Revenue already credited for order ${payload.orderId}`);
      return { success: true, message: 'Revenue already credited' };
    }

    return this.prisma.$transaction(async (prismaTx) => {
      for (const item of payload.items) {
        const shopItemsTotal = item.amount;
        const commissionFee = shopItemsTotal * (rate / 100);
        const netRevenue = shopItemsTotal - commissionFee;

        // 1. Cộng tiền ví Shop
        let shopWallet = await prismaTx.wallet.findUnique({
          where: { buyerId: item.shopId }
        });
        if (!shopWallet) {
          shopWallet = await prismaTx.wallet.create({
            data: { buyerId: item.shopId, balance: 5000000 }
          });
        }

        const updatedShopWallet = await prismaTx.wallet.update({
          where: { id: shopWallet.id },
          data: {
            balance: {
              increment: netRevenue
            }
          }
        });

        await prismaTx.walletTransaction.create({
          data: {
            walletId: updatedShopWallet.id,
            amount: netRevenue,
            type: 'REVENUE',
            description: `Nhận doanh thu đơn hàng #${payload.orderId} (Đã khấu trừ chiết khấu sàn ${rate}%: -${Math.round(commissionFee).toLocaleString('vi-VN')}đ)`,
            status: 'SUCCESS'
          }
        });

        // 2. Cộng tiền chiết khấu về ví Sàn
        let platformWallet = await prismaTx.wallet.findUnique({
          where: { buyerId: 'PLATFORM' }
        });
        if (!platformWallet) {
          platformWallet = await prismaTx.wallet.create({
            data: { buyerId: 'PLATFORM', balance: 0 }
          });
        }

        const updatedPlatformWallet = await prismaTx.wallet.update({
          where: { id: platformWallet.id },
          data: {
            balance: {
              increment: commissionFee
            }
          }
        });

        await prismaTx.walletTransaction.create({
          data: {
            walletId: updatedPlatformWallet.id,
            amount: commissionFee,
            type: 'COMMISSION',
            description: `Chiết khấu sàn đơn hàng #${payload.orderId} từ Shop ${item.shopId}`,
            status: 'SUCCESS'
          }
        });
      }

      return { success: true };
    });
  }

  // ─── ESCROW MANAGEMENT ───────────────────────────────────────────────────

  async createEscrow(orderId: string, shopId: string, amount: number, customCommissionRate?: number) {
    // Idempotency check: Đã có escrow cho đơn này chưa?
    const existing = await this.prisma.escrowTransaction.findUnique({
      where: { orderId_shopId: { orderId, shopId } }
    });
    if (existing) {
      console.log(`[Escrow] Escrow for order ${orderId} already exists (status: ${existing.status}). Skip.`);
      return existing;
    }

    // Ưu tiên tỷ lệ chiết khấu được truyền vào (bảo lưu tại thời điểm đặt hàng), nếu không có thì lấy tỷ lệ hiện tại của sàn
    let commissionRate = customCommissionRate;
    if (commissionRate === undefined || commissionRate === null) {
      const config = await this.prisma.systemConfig.findUnique({ where: { key: 'commission_rate' } });
      commissionRate = config ? parseFloat(config.value) : 5;
    }

    // Thời gian tạm giữ 3 ngày chuẩn sàn TMĐT
    const HOLD_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
    const releaseAt = new Date(Date.now() + HOLD_DURATION_MS);

    return await this.prisma.$transaction(async (tx) => {
      // Tạo bản ghi Escrow
      const escrow = await tx.escrowTransaction.create({
        data: {
          orderId,
          shopId,
          amount,
          commissionRate,
          status: 'HELD',
          releaseAt
        }
      });

      // Cộng vào onHoldBalance của Shop
      let shopWallet = await tx.wallet.findUnique({ where: { buyerId: shopId } });
      if (!shopWallet) {
        shopWallet = await tx.wallet.create({ data: { buyerId: shopId, balance: 0, onHoldBalance: 0 } });
      }
      await tx.wallet.update({
        where: { id: shopWallet.id },
        data: { onHoldBalance: { increment: amount } }
      });

      console.log(`[Escrow] Created escrow for order ${orderId}: ${amount}đ, shopId=${shopId}, releaseAt=${releaseAt.toISOString()}`);
      return escrow;
    });
  }

  async releaseEscrow(orderId: string) {
    let escrow = await this.prisma.escrowTransaction.findFirst({ where: { orderId } });
    if (!escrow) {
      console.log(`[Escrow] Escrow record not found for order ${orderId}, attempting auto-creation...`);
      try {
        const orderRes = await fetch(`http://order-service:3002/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const shopId = orderData.shopId || (orderData.items && orderData.items[0]?.shopId) || 'default-shop-id';
          const amount = orderData.totalAmount || 0;
          escrow = await this.createEscrow(orderId, shopId, amount);
        }
      } catch (err) {
        console.error(`[Escrow] Error fetching order ${orderId} for auto-creation:`, err);
      }
    }

    if (!escrow) {
      console.log(`[Escrow] Could not resolve escrow for order ${orderId}. Skipping.`);
      return { success: true, skipped: true };
    }

    if (escrow.status !== 'HELD') {
      console.log(`[Escrow] Order ${orderId} escrow already ${escrow.status}. Skip release.`);
      return { success: true, skipped: true };
    }

    const commission = escrow.amount * (escrow.commissionRate / 100);
    const netRevenue = escrow.amount - commission;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái escrow
      await tx.escrowTransaction.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED' }
      });

      // 2. Trừ onHoldBalance và cộng balance của Shop
      let shopWallet = await tx.wallet.findUnique({ where: { buyerId: escrow.shopId } });
      if (!shopWallet) {
        shopWallet = await tx.wallet.create({
          data: { buyerId: escrow.shopId, balance: 0, onHoldBalance: 0 },
        });
      }
      await tx.wallet.update({
        where: { id: shopWallet.id },
        data: {
          onHoldBalance: { decrement: escrow.amount },
          balance: { increment: netRevenue },
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: shopWallet.id,
          amount: netRevenue,
          type: 'REVENUE',
          description: `Giải ngân doanh thu đơn hàng #${orderId} (sau chiết khấu ${escrow.commissionRate}%)`,
          status: 'SUCCESS',
        },
      });

      // 3. Cộng chiết khấu vào ví sàn
      let platformWallet = await tx.wallet.findUnique({ where: { buyerId: 'PLATFORM' } });
      if (!platformWallet) {
        platformWallet = await tx.wallet.create({ data: { buyerId: 'PLATFORM', balance: 0, onHoldBalance: 0 } });
      }
      await tx.wallet.update({
        where: { id: platformWallet.id },
        data: { balance: { increment: commission } }
      });
      await tx.walletTransaction.create({
        data: {
          walletId: platformWallet.id,
          amount: commission,
          type: 'COMMISSION',
          description: `Chiết khấu sàn ${escrow.commissionRate}% đơn hàng #${orderId} từ Shop ${escrow.shopId}`,
          status: 'SUCCESS'
        }
      });

      console.log(`[Escrow] Released order ${orderId}: shopNet=${netRevenue}đ, commission=${commission}đ`);
      return { success: true, netRevenue, commission };
    });
  }

  async cancelEscrow(orderId: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({ where: { orderId } });
    if (!escrow) {
      console.log(`[Escrow] No escrow found for order ${orderId}. Nothing to cancel.`);
      return { success: true, skipped: true };
    }
    if (escrow.status !== 'HELD') {
      console.log(`[Escrow] Order ${orderId} escrow already ${escrow.status}. Skip cancel.`);
      return { success: true, skipped: true };
    }

    return await this.prisma.$transaction(async (tx) => {
      // Cập nhật escrow sang CANCELLED
      await tx.escrowTransaction.update({
        where: { id: escrow.id },
        data: { status: 'CANCELLED' }
      });

      // Trừ onHoldBalance của Shop (tiền sẽ được hoàn cho người mua riêng)
      const shopWallet = await tx.wallet.findUnique({ where: { buyerId: escrow.shopId } });
      if (shopWallet) {
        await tx.wallet.update({
          where: { id: shopWallet.id },
          data: { onHoldBalance: { decrement: escrow.amount } }
        });
      }

      console.log(`[Escrow] Cancelled escrow for order ${orderId}: ${escrow.amount}đ released from onHold of shop ${escrow.shopId}`);
      return { success: true };
    });
  }

  async getEscrowStatus(orderId: string) {
    const escrow = await this.prisma.escrowTransaction.findFirst({ where: { orderId } });
    return escrow || null;
  }
}
