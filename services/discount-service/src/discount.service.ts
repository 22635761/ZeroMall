import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateVoucherDto } from './discount.dto';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async createVoucher(shopId: string, dto: CreateVoucherDto) {
    const code = dto.code.toUpperCase().trim();

    // Validations
    if (!dto.name.trim()) {
      throw new BadRequestException('Tên chương trình không được để trống!');
    }
    if (!code || code.length < 3 || code.length > 8 || !/^[A-Z0-9]+$/.test(code)) {
      throw new BadRequestException('Mã giảm giá phải từ 3-8 ký tự viết hoa và số!');
    }
    if (dto.value <= 0) {
      throw new BadRequestException('Mức giảm giá phải lớn hơn 0!');
    }
    if (dto.type === 'percentage' && dto.value > 100) {
      throw new BadRequestException('Phần trăm giảm giá không được lớn hơn 100%!');
    }
    if (dto.minSpend < 0) {
      throw new BadRequestException('Giá trị đơn tối thiểu không được âm!');
    }
    if (dto.usageLimit <= 0) {
      throw new BadRequestException('Lượt sử dụng tối đa phải lớn hơn 0!');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu!');
    }

    // Check duplicate code for this shop
    const existing = await this.prisma.voucher.findUnique({
      where: {
        shopId_code: {
          shopId,
          code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Mã giảm giá ${code} đã tồn tại trong cửa hàng của bạn!`);
    }

    return this.prisma.voucher.create({
      data: {
        shopId,
        name: dto.name.trim(),
        code,
        type: dto.type,
        value: Number(dto.value),
        minSpend: Number(dto.minSpend),
        maxDiscount: dto.type === 'percentage' && dto.maxDiscount ? Number(dto.maxDiscount) : null,
        usageLimit: Number(dto.usageLimit),
        startDate: start,
        endDate: end,
      },
    });
  }

  async getShopVouchers(shopId: string) {
    if (!shopId) return [];
    return this.prisma.voucher.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveShopVouchers(shopId: string) {
    if (!shopId) return [];
    const now = new Date();
    return this.prisma.voucher.findMany({
      where: {
        shopId,
        startDate: { lte: now },
        endDate: { gte: now },
        usedCount: { lt: this.prisma.voucher.fields.usageLimit },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteVoucher(id: string) {
    try {
      return await this.prisma.voucher.delete({
        where: { id },
      });
    } catch (e) {
      throw new BadRequestException('Không tìm thấy mã giảm giá để xóa.');
    }
  }

  async useVouchers(voucherIds: string[]) {
    if (!voucherIds || voucherIds.length === 0) return { success: true };

    try {
      await Promise.all(
        voucherIds.map((id) =>
          this.prisma.voucher.update({
            where: { id },
            data: { usedCount: { increment: 1 } },
          }),
        ),
      );
      return { success: true };
    } catch (e) {
      throw new BadRequestException('Lỗi khi ghi nhận sử dụng mã giảm giá.');
    }
  }
}
