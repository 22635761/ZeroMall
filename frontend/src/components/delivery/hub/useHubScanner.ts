import { useState } from 'react'
import type { Shipment, Hub, StationTab, DockTruck, LinehaulShipment } from './types'
import { playBeepSound } from './helpers'
import { returnService } from '../../../services/return.service'

export function useHubScanner(
  stationTab: StationTab,
  currentHub: Hub | null,
  currentUser: any,
  hubs: Hub[],
  shipments: Shipment[],
  returnInboundAsShipments: Shipment[],
  dockTrucks: DockTruck[],
  activeScanDockTruckId: string | null,
  directScanMode: boolean,
  saveDockTrucks: (trucks: DockTruck[]) => void,
  onUpdateStatus: (
    shipmentId: string,
    status: string,
    failureReason?: string,
    hubId?: string,
    note?: string
  ) => Promise<void>,
  onRefresh: () => void,
  onOpenDispatchSingle: (s: Shipment) => void,
  onOpenLastMileSingle: (s: Shipment) => void
) {
  const [scannedCode, setScannedCode] = useState('')
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false)

  const handleScanCode = async (rawCode: string) => {
    if (!rawCode.trim()) return
    const code = rawCode.trim().toUpperCase()

    // 1. Kiện hàng hoàn (Reverse Logistics)
    const targetReturn = returnInboundAsShipments.find(
      (r) =>
        r.trackingNumber.toUpperCase() === code ||
        r.orderId.toUpperCase() === code ||
        (r.returnData?.returnNumber && r.returnData.returnNumber.toUpperCase() === code)
    )

    if (targetReturn && stationTab === 'INBOUND_PICKUP') {
      try {
        await returnService.hubInboundReturn(targetReturn.id, {
          hubId: currentHub?.id || '',
          staffName: currentUser.name,
          note: `Nhân viên kho [${currentUser.name}] quét súng nhận kiện hàng hoàn tại ${currentHub?.name}`,
        })
        setScanMessage({
          type: 'success',
          text: `✅ Đã nhập kho: Kiện hàng hoàn ${targetReturn.trackingNumber} — Bàn giao từ Shipper thành công!`,
        })
        setScannedCode('')
        onRefresh()
        return
      } catch (e: any) {
        setScanMessage({ type: 'error', text: `❌ Lỗi nhập kho hàng hoàn: ${e.message || 'Lỗi xử lý'}` })
        setScannedCode('')
        return
      }
    }

    // 2. Tìm trong danh sách vận đơn gửi đi
    const targetShipment = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === code || s.orderId.toUpperCase() === code
    )

    if (!targetShipment) {
      setScanMessage({ type: 'error', text: `❌ Không tìm thấy vận đơn khớp với mã [${code}]` })
      setScannedCode('')
      return
    }

    if (stationTab !== 'INBOUND_RECEIVING' && targetShipment.currentHubId !== currentHub?.id) {
      setScanMessage({
        type: 'error',
        text: `⚠️ Vận đơn ${code} thuộc bưu cục khác (${targetShipment.currentHub?.name || targetShipment.currentHubId}), không thể xử lý tại ${currentHub?.name}`,
      })
      setScannedCode('')
      return
    }

    try {
      if (stationTab === 'INBOUND_PICKUP') {
        await onUpdateStatus(
          targetShipment.id,
          'AT_ORIGIN_HUB',
          undefined,
          currentHub?.id,
          `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`
        )
        setScanMessage({
          type: 'success',
          text: `✅ Đã nhập kho: ${targetShipment.trackingNumber} — Bàn giao từ Shipper thành công`,
        })
      } else if (stationTab === 'SORTING_LINEHAUL') {
        const targetTruck = dockTrucks.find((t) => t.id === activeScanDockTruckId) || dockTrucks[0]

        if (directScanMode && targetTruck) {
          const targetHub = hubs.find((h) => h.id === targetTruck.targetHubId)
          const targetProv = (targetHub?.province || '').toLowerCase()
          const addr = (targetShipment.deliveryAddress || '').toLowerCase()
          let isMisroute = false

          if (targetProv.includes('hồ chí minh') || targetProv.includes('hcm')) {
            isMisroute =
              !addr.includes('hồ chí minh') &&
              !addr.includes('hcm') &&
              !addr.includes('sài gòn') &&
              !addr.includes('tân bình') &&
              !addr.includes('gò vấp') &&
              !addr.includes('bình thạnh') &&
              !addr.includes('quận 1') &&
              !addr.includes('bình dương') &&
              !addr.includes('long an') &&
              !addr.includes('đồng nai')
          } else if (targetProv.includes('hà nội') || targetProv.includes('mê linh')) {
            isMisroute =
              !addr.includes('hà nội') &&
              !addr.includes('mê linh') &&
              !addr.includes('bắc ninh') &&
              !addr.includes('vĩnh phúc') &&
              !addr.includes('hải phòng')
          }

          if (isMisroute) {
            setScanMessage({
              type: 'error',
              text: `🚨 CẢNH BÁO BẮN NHẦM XE: Đơn [${targetShipment.trackingNumber}] giao tại (${targetShipment.deliveryAddress}), không thuộc tuyến xe [${targetTruck.truckNumber}] đi ${targetTruck.targetHubName}!`,
            })
            setScannedCode('')
            return
          }

          if (targetTruck.shipments.some((s) => s.id === targetShipment.id)) {
            setScanMessage({
              type: 'info',
              text: `ℹ️ Kiện hàng [${targetShipment.trackingNumber}] đã có sẵn trên xe [${targetTruck.truckNumber}]!`,
            })
            setScannedCode('')
            return
          }

          const shipmentItem: LinehaulShipment = {
            id: targetShipment.id,
            trackingNumber: targetShipment.trackingNumber,
            orderId: targetShipment.orderId,
            buyerName: targetShipment.buyerName,
            buyerPhone: targetShipment.buyerPhone,
            deliveryAddress: targetShipment.deliveryAddress,
            package: targetShipment.package,
            codAmount: targetShipment.codAmount,
            status: 'SORTING',
          }

          await onUpdateStatus(
            targetShipment.id,
            'SORTING',
            undefined,
            currentHub?.id,
            `Bắn súng quét PDA: Đã xếp lên xe tải [${targetTruck.truckNumber}] tại cửa Dock (Tuyến đi ${targetTruck.targetHubName})`
          )

          const updatedTrucks = dockTrucks.map((t) => {
            if (t.id === targetTruck.id) {
              return { ...t, shipments: [...t.shipments, shipmentItem] }
            }
            return t
          })
          saveDockTrucks(updatedTrucks)
          playBeepSound()

          setScanMessage({
            type: 'success',
            text: `🎯 BẮN THÀNH CÔNG: [${targetShipment.trackingNumber}] ➔ Xe [${targetTruck.truckNumber}] (Tổng: ${targetTruck.shipments.length + 1} kiện trên xe)`,
          })
        } else {
          onOpenDispatchSingle(targetShipment)
        }
      } else if (stationTab === 'INBOUND_RECEIVING') {
        await onUpdateStatus(
          targetShipment.id,
          'AT_DESTINATION_HUB',
          undefined,
          currentHub?.id,
          `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`
        )
        setScanMessage({ type: 'success', text: `🏢 Đã kiểm tra Seal & nhập bưu cục phát: ${targetShipment.trackingNumber}` })
      } else if (stationTab === 'DISPATCH_LASTMILE') {
        onOpenLastMileSingle(targetShipment)
      }
      setScannedCode('')
    } catch (e: any) {
      setScanMessage({ type: 'error', text: `⚠️ Lỗi xử lý: ${e.message || 'Không thể cập nhật'}` })
    }
  }

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleScanCode(scannedCode)
  }

  return {
    scannedCode,
    setScannedCode,
    scanMessage,
    setScanMessage,
    isCameraScannerOpen,
    setIsCameraScannerOpen,
    handleScanCode,
    handleScanSubmit,
  }
}
