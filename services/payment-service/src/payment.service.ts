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

    return this.prisma.wallet.update({
      where: { buyerId: dto.buyerId },
      data: {
        balance: {
          increment: dto.amount,
        },
      },
    });
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
          await prismaTx.wallet.update({
            where: { buyerId: dto.buyerId },
            data: {
              balance: {
                decrement: dto.amount,
              },
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
}
