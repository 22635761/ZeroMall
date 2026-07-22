import { Controller, Post, Get, Put, Param, Body, Req, Headers, Query, UnauthorizedException } from '@nestjs/common';
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

  @Get('wallet/:buyerId/transactions')
  async getWalletTransactions(@Param('buyerId') buyerId: string) {
    return this.paymentService.getWalletTransactions(buyerId);
  }

  // Tạo pending deposit transaction — frontend gọi trước khi hiển thị QR
  @Post('wallet/deposit-pending')
  async createDepositPending(@Body() body: { buyerId: string; amount: number; memo: string }) {
    return this.paymentService.createDepositPending(body.buyerId, body.amount, body.memo);
  }

  // Polling trạng thái WalletTransaction — frontend poll sau khi tạo pending tx
  @Get('wallet/tx/:txId/status')
  async getWalletTxStatus(@Param('txId') txId: string) {
    return this.paymentService.getWalletTransactionStatus(txId);
  }

  @Get('withdraw')
  async getWithdrawRequests(@Query('shopId') shopId?: string) {
    return this.paymentService.getWithdrawRequests(shopId);
  }

  @Post('withdraw')
  async createWithdrawRequest(
    @Body() dto: { shopId: string; amount: number; bankName: string; bankAccount: string; accountName: string }
  ) {
    return this.paymentService.createWithdrawRequest(
      dto.shopId,
      dto.amount,
      dto.bankName,
      dto.bankAccount,
      dto.accountName
    );
  }

  @Put('withdraw/:id/approve')
  async approveWithdrawRequest(@Param('id') id: string, @Body('status') status: 'APPROVED' | 'REJECTED') {
    return this.paymentService.approveWithdrawRequest(id, status);
  }

  @Get('status/:orderId')
  async getTransactionStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getTransactionStatus(orderId);
  }

  @Get('sepay-config')
  async getSepayConfig() {
    return {
      bankId: process.env.SEPAY_BANK_ID || 'MBBank',
      bankAcc: process.env.SEPAY_BANK_ACC || '970422',
      bankName: process.env.SEPAY_BANK_NAME || 'CONG TY ZEROMALL',
    };
  }

  @Post('sepay-webhook')
  async sepayWebhook(@Headers('authorization') authHeader: string, @Body() body: any) {
    const secretKey = process.env.SEPAY_SECRET_KEY || 'spsk_live_ardGMMETTMTVqW8sR5aFKtJyDVawHbmH';
    console.log('PaymentController: Received Webhook from Sepay!');
    console.log('Headers Authorization:', authHeader);
    console.log('Payload body:', JSON.stringify(body));

    // Xác thực webhook từ Sepay
    if (authHeader) {
      const cleanToken = authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim();
      if (cleanToken !== secretKey) {
        console.error(`Lỗi xác thực Sepay Token: Nhận được "${cleanToken}", mong đợi "${secretKey}"`);
        throw new UnauthorizedException('Token bảo mật Sepay không hợp lệ!');
      }
    } else {
      console.warn('Cảnh báo: Sepay Webhook gọi không kèm header Authorization!');
    }

    return this.paymentService.processSepayWebhook(body);
  }

  @Post('refund')
  async refundOrder(@Body() body: { orderId: string; buyerId: string; amount: number }) {
    return this.paymentService.refundOrder(body.orderId, body.buyerId, body.amount);
  }
}
