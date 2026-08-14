export interface CartItem {
  product: {
    id: string
    name: string
    flashPrice: string
    image: string
    shopId?: string
    price?: number | string
    originalPrice?: string
  }
  quantity: number
  selectedVariant?: string
}
