import React from 'react'
import { ShipmentTrackingDialog } from '../common/ShipmentTrackingDialog'

interface ShopTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  trackingData: any
  trackingLoading: boolean
  orderId?: string
}

export const ShopTrackingModal: React.FC<ShopTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingData,
  trackingLoading,
  orderId,
}) => {
  return (
    <ShipmentTrackingDialog
      isOpen={isOpen}
      onClose={onClose}
      trackingData={trackingData}
      trackingLoading={trackingLoading}
      orderId={orderId}
      title="Hành Trình Vận Chuyển ZMX"
      showPortalLink={true}
    />
  )
}
