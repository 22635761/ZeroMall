export class CreateOrderItemDto {
  productId: string;
  shopId: string;
  name: string;
  image: string;
  variant?: string;
  price: number;
  quantity: number;
}

export class CreateOrderDto {
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  shippingFee: number;
  paymentMethod: string;
  shopDiscountAmount?: number;
  platformDiscountAmount?: number;
  shopVoucherCode?: string;
  platformVoucherCode?: string;
  appliedVoucherIds?: string;
  ghnDistrictId?: number;
  ghnWardCode?: string;
  items: CreateOrderItemDto[];
  shopId?: string;
  checkoutGroupId?: string;
}

export class UpdateOrderStatusDto {
  status: string;
  ghnOrderCode?: string;
  refundReason?: string;
  refundDescription?: string;
  refundEmail?: string;
}
