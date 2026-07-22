export interface OrderItem {
  id: string
  productId: string
  shopId: string
  name: string
  image: string
  variant: string | null
  price: number
  quantity: number
}

export interface Order {
  id: string
  buyerId: string
  buyerEmail: string
  buyerName: string
  buyerPhone: string
  shippingAddress: string
  totalAmount: number
  shippingFee: number
  paymentMethod: string
  status: string // "PENDING_PAYMENT" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  ghnDistrictId?: number
  ghnWardCode?: string
  ghnOrderCode?: string
  refundReason?: string
  refundDescription?: string
  refundEmail?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}
