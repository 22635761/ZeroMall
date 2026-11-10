export interface TrackingLog {
  id: string
  status: string
  title: string
  description: string
  location?: string
  timestamp: string
}

export interface PackageInfo {
  weight: number
  itemsSummary?: string
  fragile?: boolean
  liquid?: boolean
}

export interface PickupAddress {
  id?: string
  name?: string
  contactName?: string
  phone?: string
  address?: string
  ward?: string
  district?: string
  province?: string
}

export interface Assignment {
  id: string
  type: string
  status: string
  driver: {
    id?: string
    name: string
    phone: string
    vehicleNumber?: string
  }
}

export interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  sellerId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  pickupAddress?: PickupAddress
  declaredValue: number
  codAmount: number
  shippingFee: number
  status: string
  createdAt: string
  currentHubId?: string
  currentHub?: { id?: string; name: string; code: string }
  package?: PackageInfo
  assignments?: Assignment[]
  trackingLogs: TrackingLog[]
  podImageUrl?: string
  deliveryNote?: string
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  vehicleType: string
  status: string
  hubId?: string
  hub?: { id?: string; name: string; code?: string }
}

export interface Hub {
  id: string
  code: string
  name: string
  type: string
  address: string
  province: string
  district: string
}

export type AdminActiveNav =
  | 'TOWER'      // 📊 Tháp Điều Hành (Control Tower)
  | 'SHIPMENTS'  // 📦 Quản Lý Vận Đơn (Shipment Data Grid)
  | 'HUBS'       // 🏢 Mạng Lưới Bưu Cục & Hubs
  | 'LINEHAUL'   // 🚛 Đội Xe Tải Tuyến Chính (Linehaul Trucks)
  | 'DRIVERS'    // 🛵 Đội Ngũ Shipper & Tuyến
  | 'COD'        // 💵 Đối Soát Dòng Tiền COD & Thu Ngân
  | 'FINANCE'    // 📈 Báo Cáo Tài Chính & P&L
