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
  ghnDistrictId?: number;
  ghnWardCode?: string;
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  status: string;
  ghnOrderCode?: string;
  refundReason?: string;
  refundDescription?: string;
  refundEmail?: string;
}
