export interface CartItem {
  product: {
    id: string
    name: string
    flashPrice: string
    image: string
    shopId?: string
  }
  quantity: number
  selectedVariant?: string
}
