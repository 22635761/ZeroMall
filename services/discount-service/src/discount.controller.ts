import { Controller, Get, Post, Delete, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateVoucherDto, UseVouchersDto } from './discount.dto';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  async createVoucher(@Body() dto: CreateVoucherDto, @Query('shopId') queryShopId?: string) {
    // If shopId is passed as query or in body
    const shopId = queryShopId || (dto as any).shopId;
    if (!shopId) {
      throw new BadRequestException('Mã ShopId không được để trống!');
    }
    return this.discountService.createVoucher(shopId, dto);
  }

  @Get()
  async getShopVouchers(@Query('shopId') shopId: string) {
    if (!shopId) {
      throw new BadRequestException('Mã ShopId không được để trống!');
    }
    return this.discountService.getShopVouchers(shopId);
  }

  @Get('active')
  async getActiveShopVouchers(@Query('shopId') shopId: string, @Query('userId') userId?: string) {
    if (!shopId) {
      throw new BadRequestException('Mã ShopId không được để trống!');
    }
    return this.discountService.getActiveShopVouchers(shopId, userId);
  }

  @Delete(':id')
  async deleteVoucher(@Param('id') id: string) {
    return this.discountService.deleteVoucher(id);
  }

  @Get('all-active')
  async getAllActiveVouchers(@Query('userId') userId?: string) {
    return this.discountService.getAllActiveVouchers(userId);
  }

  @Post('use')
  async useVouchers(@Body() dto: UseVouchersDto) {
    return this.discountService.useVouchers(dto.voucherIds);
  }

  @Post('rollback')
  async rollbackVouchers(@Body('voucherIds') voucherIds: string[]) {
    return this.discountService.rollbackVouchers(voucherIds);
  }
}
