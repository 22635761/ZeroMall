import { useState, useEffect } from 'react'
import type { Hub, DockTruck, LinehaulShipment, Shipment } from './types'

export function useHubDockTrucks(
  currentHub: Hub | null,
  hubs: Hub[],
  sortingList: Shipment[],
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
  const [dockTrucks, setDockTrucks] = useState<DockTruck[]>(() => {
    try {
      const saved = localStorage.getItem(`zeromall_dock_trucks_${currentHub?.id || 'default'}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (currentHub?.id) {
      try {
        const saved = localStorage.getItem(`zeromall_dock_trucks_${currentHub.id}`)
        setDockTrucks(saved ? JSON.parse(saved) : [])
      } catch {
        setDockTrucks([])
      }
    }
  }, [currentHub?.id])

  const saveDockTrucks = (trucks: DockTruck[]) => {
    setDockTrucks(trucks)
    try {
      localStorage.setItem(`zeromall_dock_trucks_${currentHub?.id || 'default'}`, JSON.stringify(trucks))
    } catch (e) {
      console.error(e)
    }
  }

  // Modal Niêm phong chì nhanh
  const [sealingDockTruck, setSealingDockTruck] = useState<DockTruck | null>(null)
  const [quickSealNumber, setQuickSealNumber] = useState<string>('')

  // PDA gun direct scan
  const [activeScanDockTruckId, setActiveScanDockTruckId] = useState<string | null>(null)
  const [directScanMode, setDirectScanMode] = useState<boolean>(true)

  useEffect(() => {
    if (dockTrucks.length > 0 && (!activeScanDockTruckId || !dockTrucks.some((t) => t.id === activeScanDockTruckId))) {
      setActiveScanDockTruckId(dockTrucks[0].id)
    }
  }, [dockTrucks, activeScanDockTruckId])

  const handleOpenSealModal = (truck: DockTruck) => {
    const destHub = hubs.find((h) => h.id === truck.targetHubId)
    const destCode = destHub?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    setQuickSealNumber(`SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`)
    setSealingDockTruck(truck)
  }

  const handleConfirmSealFromDock = async () => {
    if (!sealingDockTruck || !quickSealNumber.trim()) return
    const seal = quickSealNumber.trim().toUpperCase()

    for (const s of sealingDockTruck.shipments) {
      await onUpdateStatus(
        s.id,
        'IN_TRANSIT',
        undefined,
        currentHub?.id,
        undefined,
        {
          truckNumber: sealingDockTruck.truckNumber,
          truckDriver: sealingDockTruck.truckDriver,
          truckDriverPhone: sealingDockTruck.truckDriverPhone,
          sealNumber: seal,
          targetHubId: sealingDockTruck.targetHubId,
        }
      )
    }

    const remainingTrucks = dockTrucks.filter((t) => t.id !== sealingDockTruck.id)
    saveDockTrucks(remainingTrucks)
    setSealingDockTruck(null)
    setScanMessage({
      type: 'success',
      text: `🚚 Đã niêm phong khóa Seal [${seal}] & xuất bến Xe tải [${sealingDockTruck.truckNumber}] (${sealingDockTruck.shipments.length} kiện) đi ${sealingDockTruck.targetHubName}!`,
    })
    onRefresh()
  }

  const handleUnloadEntireDockTruck = async (truck: DockTruck) => {
    const confirm = window.confirm(
      `Bạn có chắc muốn dỡ toàn bộ ${truck.shipments.length} kiện trên xe tải [${truck.truckNumber}] quay trở lại sàn kho không?`
    )
    if (!confirm) return

    for (const s of truck.shipments) {
      await onUpdateStatus(
        s.id,
        'AT_ORIGIN_HUB',
        undefined,
        currentHub?.id,
        `Đã dỡ kiện hàng khỏi xe tải [${truck.truckNumber}] quay trở lại sàn kho bưu cục ${currentHub?.name}`
      )
    }

    const remaining = dockTrucks.filter((t) => t.id !== truck.id)
    saveDockTrucks(remaining)
    setScanMessage({
      type: 'info',
      text: `↩️ Đã dỡ toàn bộ hàng trên xe tải [${truck.truckNumber}] trở lại sàn kho bưu cục.`,
    })
    onRefresh()
  }

  const handleUnloadSingleShipmentFromDock = async (truckId: string, shipmentId: string, truckNumber: string) => {
    await onUpdateStatus(
      shipmentId,
      'AT_ORIGIN_HUB',
      undefined,
      currentHub?.id,
      `Đã dỡ kiện hàng khỏi xe tải [${truckNumber}] quay trở lại sàn kho bưu cục`
    )

    const updated = dockTrucks
      .map((t) => {
        if (t.id === truckId) {
          return { ...t, shipments: t.shipments.filter((s) => s.id !== shipmentId) }
        }
        return t
      })
      .filter((t) => t.shipments.length > 0)
    saveDockTrucks(updated)
    setScanMessage({
      type: 'info',
      text: `↩️ Đã dỡ bưu kiện khỏi xe tải [${truckNumber}] quay lại sàn kho.`,
    })
    onRefresh()
  }

  const getMatchingUnloadedParcelsForTruck = (truck: DockTruck) => {
    const loadedIds = new Set(dockTrucks.flatMap((t) => t.shipments.map((s) => s.id)))
    const targetHub = hubs.find((h) => h.id === truck.targetHubId)
    const targetProv = (targetHub?.province || '').toLowerCase()

    return sortingList.filter((s) => {
      if (loadedIds.has(s.id)) return false
      const addr = (s.deliveryAddress || '').toLowerCase()
      if (targetProv.includes('hồ chí minh') || targetProv.includes('hcm')) {
        return (
          addr.includes('hồ chí minh') ||
          addr.includes('tp.hcm') ||
          addr.includes('tp hcm') ||
          addr.includes('sài gòn') ||
          addr.includes('tân bình') ||
          addr.includes('gò vấp') ||
          addr.includes('bình thạnh') ||
          addr.includes('quận 1') ||
          addr.includes('quận 2') ||
          addr.includes('quận 3') ||
          addr.includes('quận 7') ||
          addr.includes('quận 12') ||
          addr.includes('thủ đức') ||
          addr.includes('bình tân') ||
          addr.includes('tân phú') ||
          addr.includes('phú nhuận') ||
          addr.includes('nhà bè') ||
          addr.includes('bình chánh') ||
          addr.includes('hóc môn') ||
          addr.includes('củ chi') ||
          addr.includes('bình dương') ||
          addr.includes('đồng nai')
        )
      }
      if (targetProv.includes('hà nội') || targetProv.includes('mê linh')) {
        return (
          addr.includes('hà nội') ||
          addr.includes('mê linh') ||
          addr.includes('cầu giấy') ||
          addr.includes('ba đình') ||
          addr.includes('đống đa') ||
          addr.includes('hoàn kiếm') ||
          addr.includes('hà đông') ||
          addr.includes('long biên') ||
          addr.includes('hoàng mai') ||
          addr.includes('thanh xuân') ||
          addr.includes('nam từ liêm') ||
          addr.includes('bắc từ liêm') ||
          addr.includes('tây hồ') ||
          addr.includes('gia lâm') ||
          addr.includes('đông anh') ||
          addr.includes('sóc sơn')
        )
      }
      return false
    })
  }

  const handleBatchLoadRouteToTruck = async (truck: DockTruck) => {
    const matchingParcels = getMatchingUnloadedParcelsForTruck(truck)
    if (matchingParcels.length === 0) {
      alert(`Hiện không còn kiện hàng nào trong kho chờ xuất đi tuyến ${truck.targetHubName}!`)
      return
    }

    const confirm = window.confirm(
      `⚡ GOM HÀNG HÀNG LOẠT THEO TUYẾN:\nBạn có chắc muốn nạp toàn bộ ${matchingParcels.length} kiện hàng cùng tuyến [${truck.targetHubName}] lên xe tải [${truck.truckNumber}] không?`
    )
    if (!confirm) return

    const newItems: LinehaulShipment[] = matchingParcels.map((s) => ({
      id: s.id,
      trackingNumber: s.trackingNumber,
      orderId: s.orderId,
      buyerName: s.buyerName,
      buyerPhone: s.buyerPhone,
      deliveryAddress: s.deliveryAddress,
      package: s.package,
      codAmount: s.codAmount,
      status: 'SORTING',
    }))

    for (const s of matchingParcels) {
      await onUpdateStatus(
        s.id,
        'SORTING',
        undefined,
        currentHub?.id,
        `Gom hàng loạt theo tuyến: Đã xếp lên xe tải [${truck.truckNumber}] tại cửa Dock (Tuyến ${truck.targetHubName})`
      )
    }

    const updated = dockTrucks.map((t) => {
      if (t.id === truck.id) {
        return { ...t, shipments: [...t.shipments, ...newItems] }
      }
      return t
    })
    saveDockTrucks(updated)

    setScanMessage({
      type: 'success',
      text: `⚡ Đã gom thành công ${matchingParcels.length} kiện hàng lên Xe tải [${truck.truckNumber}]! (Hiện có: ${truck.shipments.length + matchingParcels.length} kiện trên xe)`,
    })
    onRefresh()
  }

  return {
    dockTrucks,
    saveDockTrucks,
    sealingDockTruck,
    setSealingDockTruck,
    quickSealNumber,
    setQuickSealNumber,
    activeScanDockTruckId,
    setActiveScanDockTruckId,
    directScanMode,
    setDirectScanMode,
    handleOpenSealModal,
    handleConfirmSealFromDock,
    handleUnloadEntireDockTruck,
    handleUnloadSingleShipmentFromDock,
    getMatchingUnloadedParcelsForTruck,
    handleBatchLoadRouteToTruck,
  }
}
