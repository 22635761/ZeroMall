export class CreateVoucherDto {
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minSpend: number;
  maxDiscount?: number | null;
  usageLimit: number;
  targetUserId?: string | null;
  startDate: string;
  endDate: string;
}

export class UseVouchersDto {
  voucherIds: string[];
}
