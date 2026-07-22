import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChargePaymentDto, DepositDto } from './payment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

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
        // Đối với COD, giữ trạng thái giao dịch PENDING cho đến khi shipper giao hàng và thu tiền
        // Vẫn cập nhật đơn hàng thành PROCESSING (đang xử lý chuẩn bị giao hàng)
        await this.updateOrderStatusOnOrderService(dto.orderId, 'PROCESSING');
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

    // Kiểm tra xem đây có phải là giao dịch nạp tiền ví hay không
    // Nội dung: ZMWALLET[BUYER_SHORT_ID]
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

    // Tìm transaction tương ứng (orderId bắt đầu bằng short ID của UUID)
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        orderId: {
          startsWith: orderShortId.toLowerCase(),
        },
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
}
