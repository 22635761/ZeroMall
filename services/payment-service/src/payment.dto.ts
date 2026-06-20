export class ChargePaymentDto {
  orderId: string;
  buyerId: string;
  amount: number;
  paymentMethod: string;
}

export class DepositDto {
  buyerId: string;
  amount: number;
}
