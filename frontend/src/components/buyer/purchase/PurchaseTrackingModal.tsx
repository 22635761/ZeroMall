import React from 'react'
import { ShipmentTrackingDialog } from '../../common/ShipmentTrackingDialog'

interface PurchaseTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  trackingData: any
  trackingLoading: boolean
  orderId?: string
}

export const PurchaseTrackingModal: React.FC<PurchaseTrackingModalProps> = ({
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
      title="Thông Tin Vận Chuyển ZeroExpress (ZMX)"
      showPortalLink={false}
    />
  )
}
