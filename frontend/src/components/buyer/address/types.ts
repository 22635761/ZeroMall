import type { ShippingAddress } from '../../../models/address.model'

export interface WardItem {
  name: string
  code: number
}

export interface DistrictItem {
  name: string
  code: number
  wards: WardItem[]
}

export interface ProvinceItem {
  name: string
  code: number
  districts: DistrictItem[]
}

export interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  addresses: ShippingAddress[]
  setAddresses: React.Dispatch<React.SetStateAction<ShippingAddress[]>>
  activeAddressId: string
  setActiveAddressId: (id: string) => void
  goongApiKey: string
  VIETNAM_PROVINCES?: string[]
  removeVietnameseTones?: (str: string) => string
  user?: any
}

export interface LatLngCoords {
  lat: number
  lng: number
}
