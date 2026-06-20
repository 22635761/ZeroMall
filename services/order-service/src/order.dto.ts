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
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  status: string;
}
