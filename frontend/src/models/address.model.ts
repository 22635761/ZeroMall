export interface ShippingAddress {
  id: string
  name: string
  phone: string
  region: string
  details: string
  isDefault: boolean
  lat?: number
  lng?: number
  ghnDistrictId?: number
  ghnWardCode?: string
}

export const DEFAULT_ADDRESSES: ShippingAddress[] = []
