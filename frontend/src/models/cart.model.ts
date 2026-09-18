export interface CartItem {
  product: {
    id: string
    name: string
    flashPrice: string
    image: string
    shopId?: string
    price?: number | string
    originalPrice?: string
    weight?: number | string
    length?: number | string
    width?: number | string
    height?: number | string
  }
  quantity: number
  selectedVariant?: string
}
