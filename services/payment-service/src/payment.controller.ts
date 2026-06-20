import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ChargePaymentDto, DepositDto } from './payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('charge')
  async chargePayment(@Body() dto: ChargePaymentDto) {
    return this.paymentService.chargePayment(dto);
  }

  @Get('wallet/:buyerId')
  async getWallet(@Param('buyerId') buyerId: string) {
    return this.paymentService.getWallet(buyerId);
  }

  @Post('wallet/deposit')
  async deposit(@Body() dto: DepositDto) {
    return this.paymentService.deposit(dto);
  }
}
