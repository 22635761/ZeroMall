export interface ShippingAddress {
  id: string
  name: string
  phone: string
  region: string
  details: string
  isDefault: boolean
  province?: string
  district?: string
  ward?: string
  lat?: number
  lng?: number
}

export const DEFAULT_ADDRESSES: ShippingAddress[] = []
