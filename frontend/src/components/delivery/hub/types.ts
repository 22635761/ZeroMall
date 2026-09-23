import type { ReturnData } from '../../../services/return.service'
import type { LinehaulTrip } from '../LinehaulInboundReconciliationModal'
import type { DockTruck, LinehaulShipment } from '../LinehaulDispatchModal'

export interface Assignment {
  id: string
  type: string
  status: string
  driverId?: string
  driver?: { name: string; phone: string; vehicleNumber?: string; licensePlate?: string; vehicleType?: string }
  assignedAt?: string
  completedAt?: string
  proofImage?: string
}

export interface TrackingLog {
  id?: string
  title: string
  description: string
  location?: string
  timestamp: string
}

export interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  pickupAddress?: {
    id?: string
    name?: string
    contactName?: string
    phone?: string
    address?: string
    ward?: string
    district?: string
    province?: string
  }
  codAmount: number
  status: string
  currentHubId?: string
  currentHub?: { id?: string; name: string; code?: string }
  package?: { weight: number; itemsSummary?: string }
  assignments?: Assignment[]
  trackingLogs?: TrackingLog[]
  createdAt?: string
  pickedUpAt?: string
  isReturn?: boolean
  returnData?: ReturnData
}

export interface Hub {
  id: string
  code: string
  name: string
  type: string
  province: string
  district: string
}

export type StationTab = 'INBOUND_PICKUP' | 'SORTING_LINEHAUL' | 'INBOUND_RECEIVING' | 'DISPATCH_LASTMILE'

export interface HubOperatorStationProps {
  currentUser: any
  hubs: Hub[]
  drivers?: any[]
  shipments: Shipment[]
  returns?: ReturnData[]
  onRefresh: () => void
  onUpdateStatus: (
    shipmentId: string,
    status: string,
    failureReason?: string,
    hubId?: string,
    note?: string,
    linehaulData?: {
      truckNumber?: string
      truckDriver?: string
      truckDriverPhone?: string
      sealNumber?: string
      targetHubId?: string
    }
  ) => Promise<void>
  actionLoading: boolean
  assignedHubId?: string
}

export type { ReturnData, LinehaulTrip, DockTruck, LinehaulShipment }
