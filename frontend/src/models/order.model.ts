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
  status: string // "PENDING" | "PENDING_PAYMENT" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED"
  shopDiscountAmount?: number
  platformDiscountAmount?: number
  shopVoucherCode?: string | null
  platformVoucherCode?: string | null
  appliedVoucherIds?: string | null
  commissionRate?: number
  ghnDistrictId?: number
  ghnWardCode?: string
  ghnOrderCode?: string
  refundReason?: string
  refundDescription?: string
  refundEmail?: string
  refundProofImages?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}
