import { useState } from 'react'
import { API_BASE_URL } from '../../../config/api.config'
import type { Shipment, LinehaulShipment, LinehaulTrip, Hub, DockTruck } from './types'

export function useHubDispatchModals(
  sortingList: Shipment[],
  destinationList: Shipment[],
  currentHub: Hub | null,
  drivers: any[],
  dockTrucks: DockTruck[],
  saveDockTrucks: (trucks: DockTruck[]) => void,
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
  ) => Promise<void>,
  onRefresh: () => void,
  setScanMessage: (msg: { type: 'success' | 'error' | 'info'; text: string } | null) => void
) {
  // Checkboxes
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set())
  const [selectedLastMileIds, setSelectedLastMileIds] = useState<Set<string>>(new Set())

  // Linehaul Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [modalShipments, setModalShipments] = useState<LinehaulShipment[]>([])

  // Last-Mile Modal
  const [isLastMileModalOpen, setIsLastMileModalOpen] = useState(false)
  const [lastMileModalShipments, setLastMileModalShipments] = useState<Shipment[]>([])

  // Inbound Trip Reconciliation Modal
  const [reconcilingTrip, setReconcilingTrip] = useState<LinehaulTrip | null>(null)

  const handleToggleSelectShipment = (id: string) => {
    const next = new Set(selectedShipmentIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedShipmentIds(next)
  }

  const handleSelectAllSorting = () => {
    if (selectedShipmentIds.size === sortingList.length) setSelectedShipmentIds(new Set())
    else setSelectedShipmentIds(new Set(sortingList.map((s) => s.id)))
  }

  const handleToggleSelectLastMile = (id: string) => {
    const next = new Set(selectedLastMileIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedLastMileIds(next)
  }

  const handleSelectAllLastMile = () => {
    if (selectedLastMileIds.size === destinationList.length) setSelectedLastMileIds(new Set())
    else setSelectedLastMileIds(new Set(destinationList.map((s) => s.id)))
  }

  const handleOpenLastMileSingle = (shipment: Shipment) => {
    setLastMileModalShipments([shipment])
    setIsLastMileModalOpen(true)
  }

  const handleOpenLastMileBatch = () => {
    const selected = destinationList.filter((s) => selectedLastMileIds.has(s.id))
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kiện hàng để phân tuyến cho Shipper!')
      return
    }
    setLastMileModalShipments(selected)
    setIsLastMileModalOpen(true)
  }

  const handleConfirmLastMileDispatch = async (shipmentIds: string[], driverId: string) => {
    for (const shipmentId of shipmentIds) {
      const res = await fetch(`${API_BASE_URL}/delivery/shipments/${shipmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, type: 'DELIVERY' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Lỗi phân tuyến đơn ${shipmentId}`)
      }
    }
    const matchedDriver = drivers.find((d: any) => d.id === driverId)
    setIsLastMileModalOpen(false)
    setLastMileModalShipments([])
    setSelectedLastMileIds(new Set())
    setScanMessage({
      type: 'success',
      text: `🛵 Đã phân tuyến thành công ${shipmentIds.length} kiện cho Shipper [${matchedDriver?.name || 'phụ trách'}]. Chờ Shipper quét nhận tại bưu cục!`,
    })
    onRefresh()
  }

  const handleOpenDispatchSingle = (shipment: Shipment) => {
    setModalShipments([shipment])
    setIsDispatchModalOpen(true)
  }

  const handleOpenDispatchBatch = () => {
    const selected = sortingList.filter((s) => selectedShipmentIds.has(s.id))
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kiện hàng để đóng xe!')
      return
    }
    setModalShipments(selected)
    setIsDispatchModalOpen(true)
  }

  const handleConfirmLinehaulDispatch = async (data: any) => {
    if (!data.isSealAndDispatch) {
      const selectedShipmentObjects: LinehaulShipment[] = data.shipmentIds.map((id: string) => {
        const found = sortingList.find((s) => s.id === id)
        return {
          id,
          trackingNumber: found?.trackingNumber || id,
          orderId: found?.orderId || '',
          buyerName: found?.buyerName || '',
          buyerPhone: found?.buyerPhone || '',
          deliveryAddress: found?.deliveryAddress || '',
          package: found?.package,
          codAmount: found?.codAmount || 0,
          status: 'SORTING',
        }
      })

      for (const shipmentId of data.shipmentIds) {
        await onUpdateStatus(
          shipmentId,
          'SORTING',
          undefined,
          currentHub?.id,
          `Đã xếp lên xe tải [${data.truckNumber}] tại cửa Dock (Tuyến đi ${data.targetHubName}). Thùng xe mở chờ gom đủ tải.`
        )
      }

      const existingTruckIndex = dockTrucks.findIndex(
        (t) => t.truckNumber === data.truckNumber && t.targetHubId === data.targetHubId
      )

      let updatedTrucks: any[]
      if (existingTruckIndex >= 0) {
        const existing = dockTrucks[existingTruckIndex]
        const mergedShipments = [...existing.shipments]
        for (const item of selectedShipmentObjects) {
          if (!mergedShipments.some((s) => s.id === item.id)) mergedShipments.push(item)
        }
        updatedTrucks = [...dockTrucks]
        updatedTrucks[existingTruckIndex] = {
          ...existing,
          truckDriver: data.truckDriver || existing.truckDriver,
          truckDriverPhone: data.truckDriverPhone || existing.truckDriverPhone,
          truckType: data.truckType || existing.truckType,
          shipments: mergedShipments,
        }
      } else {
        const newTruck = {
          id: `dock_${Date.now()}`,
          truckNumber: data.truckNumber,
          truckDriver: data.truckDriver,
          truckDriverPhone: data.truckDriverPhone,
          truckType: data.truckType,
          targetHubId: data.targetHubId,
          targetHubName: data.targetHubName,
          shipments: selectedShipmentObjects,
          createdAt: new Date().toISOString(),
        }
        updatedTrucks = [newTruck, ...dockTrucks]
      }

      saveDockTrucks(updatedTrucks)
      setIsDispatchModalOpen(false)
      setModalShipments([])
      setSelectedShipmentIds(new Set())
      setScanMessage({
        type: 'success',
        text: `📦 Đã xếp thành công ${data.shipmentIds.length} kiện lên Xe tải [${data.truckNumber}] tại Cửa Dock (${data.targetHubName}). Thùng xe vẫn mở để tiếp tục gom thêm hàng!`,
      })
      onRefresh()
    } else {
      for (const shipmentId of data.shipmentIds) {
        await onUpdateStatus(
          shipmentId,
          'IN_TRANSIT',
          undefined,
          currentHub?.id,
          undefined,
          {
            truckNumber: data.truckNumber,
            truckDriver: data.truckDriver,
            truckDriverPhone: data.truckDriverPhone,
            sealNumber: data.sealNumber,
            targetHubId: data.targetHubId,
          }
        )
      }

      const remainingTrucks = dockTrucks.filter((t) => t.truckNumber !== data.truckNumber)
      saveDockTrucks(remainingTrucks)

      setIsDispatchModalOpen(false)
      setModalShipments([])
      setSelectedShipmentIds(new Set())
      setScanMessage({
        type: 'success',
        text: `🚚 Đã niêm phong khóa Seal [${data.sealNumber}] & xuất bến ${data.shipmentIds.length} kiện lên Xe tải [${data.truckNumber}] đi ${data.targetHubName}!`,
      })
      onRefresh()
    }
  }

  return {
    selectedShipmentIds,
    setSelectedShipmentIds,
    selectedLastMileIds,
    setSelectedLastMileIds,
    isDispatchModalOpen,
    setIsDispatchModalOpen,
    modalShipments,
    setModalShipments,
    isLastMileModalOpen,
    setIsLastMileModalOpen,
    lastMileModalShipments,
    setLastMileModalShipments,
    reconcilingTrip,
    setReconcilingTrip,
    handleToggleSelectShipment,
    handleSelectAllSorting,
    handleToggleSelectLastMile,
    handleSelectAllLastMile,
    handleOpenLastMileSingle,
    handleOpenLastMileBatch,
    handleConfirmLastMileDispatch,
    handleOpenDispatchSingle,
    handleOpenDispatchBatch,
    handleConfirmLinehaulDispatch,
  }
}
