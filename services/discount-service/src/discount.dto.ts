export class CreateVoucherDto {
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount?: number | null;
  usageLimit: number;
  startDate: string;
  endDate: string;
}

export class UseVouchersDto {
  voucherIds: string[];
}
