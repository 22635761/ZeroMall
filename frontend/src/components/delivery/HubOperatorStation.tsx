import React, { useState, useMemo, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LinehaulDispatchModal, type LinehaulDispatchData, type LinehaulShipment, type DockTruck } from './LinehaulDispatchModal'
import { BarcodeCameraScanner } from './BarcodeCameraScanner'
import { LinehaulInboundReconciliationModal, type LinehaulTrip } from './LinehaulInboundReconciliationModal'
import { LastMileDispatchModal } from './LastMileDispatchModal'

interface Assignment {
  id: string
  type: string
  status: string
  driverId?: string
  driver?: { name: string; phone: string; vehicleNumber?: string; licensePlate?: string; vehicleType?: string }
  assignedAt?: string
  completedAt?: string
  proofImage?: string
}

interface TrackingLog {
  id?: string
  title: string
  description: string
  location?: string
  timestamp: string
}

interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  codAmount: number
  status: string
  currentHubId?: string
  currentHub?: { id?: string; name: string; code: string }
  package?: { weight: number; itemsSummary?: string }
  assignments?: Assignment[]
  trackingLogs?: TrackingLog[]
  createdAt?: string
  pickedUpAt?: string
}

interface Hub {
  id: string
  code: string
  name: string
  type: string
  province: string
  district: string
}

interface HubOperatorStationProps {
  currentUser: any
  hubs: Hub[]
  drivers?: any[]
  shipments: Shipment[]
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CREATED: { label: 'Mới Tạo', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  WAITING_PICKUP: { label: 'Chờ Lấy Hàng', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  PICKUP_ASSIGNED: { label: 'Đã Gán Shipper Lấy', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  PICKED_UP: { label: 'Shipper Đã Lấy', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  AT_ORIGIN_HUB: { label: 'Tại Kho Gửi', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SORTING: { label: 'Đang Phân Loại', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  IN_TRANSIT: { label: 'Đang Trung Chuyển', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  AT_DESTINATION_HUB: { label: 'Tại Bưu Cục Phát', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  DELIVERY_ASSIGNED: { label: 'Chờ Shipper Nhận', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  OUT_FOR_DELIVERY: { label: 'Đang Giao', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  DELIVERED: { label: 'Đã Giao', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  DELIVERY_FAILED: { label: 'Giao Thất Bại', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  RETURNING: { label: 'Đang Hoàn', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  RETURNED: { label: 'Đã Hoàn', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

// Trích xuất thông tin chuyến xe tải & Seal từ nhật ký hành trình
function extractLinehaulInfo(s: Shipment) {
  const log = s.trackingLogs?.find(
    (l) => l.description?.includes('Xe tải') || l.description?.includes('Seal')
  )
  if (!log) return null

  const text = log.description || ''
  const truckMatch = text.match(/\[([0-9A-Z\-\.]+)\]/) || text.match(/Xe tải\s+([0-9A-Z\-\.]+)/i)
  const sealMatch = text.match(/Seal:\s*\[?([A-Z0-9\-]+)\]?/i)
  const driverMatch = text.match(/Bác tài:\s*([^\(•]+)/i)
  const phoneMatch = text.match(/SĐT:\s*([0-9\+\.]+)/i) || text.match(/\(([0-9\+\.\s]+)\)/)

  return {
    truckNumber: truckMatch ? truckMatch[1] : 'Xe Tải Linehaul',
    sealNumber: sealMatch ? sealMatch[1] : null,
    driver: driverMatch ? driverMatch[1].trim() : null,
    driverPhone: phoneMatch ? phoneMatch[1].trim() : '',
    time: log.timestamp,
  }
}

export const HubOperatorStation: React.FC<HubOperatorStationProps> = ({
  currentUser,
  hubs,
  drivers = [],
  shipments,
  onRefresh,
  onUpdateStatus,
  actionLoading,
  assignedHubId,
}) => {
  const currentHub = useMemo(() => {
    if (assignedHubId) return hubs.find((h) => h.id === assignedHubId) || hubs[0]
    const email = (currentUser?.email || '').toLowerCase()
    if (email.includes('bienhoa')) return hubs.find((h) => h.code === 'DN01') || hubs[0]
    if (email.includes('melinh')) return hubs.find((h) => h.code === 'HN01') || hubs[0]
    return hubs.find((h) => h.code === 'HCM01') || hubs[0]
  }, [assignedHubId, currentUser?.email, hubs])

  const [stationTab, setStationTab] = useState<'INBOUND_PICKUP' | 'SORTING_LINEHAUL' | 'INBOUND_RECEIVING' | 'DISPATCH_LASTMILE'>('INBOUND_PICKUP')
  const [scannedCode, setScannedCode] = useState('')
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false)

  // State cho Modal Đóng Xe Tải Linehaul & Niêm Phong Seal (Tab 2)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [modalShipments, setModalShipments] = useState<LinehaulShipment[]>([])
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set())

  // Quản lý các chuyến xe đang mở tại cửa Dock (chưa niêm phong seal)
  const [dockTrucks, setDockTrucks] = useState<DockTruck[]>(() => {
    try {
      const saved = localStorage.getItem(`zeromall_dock_trucks_${currentHub?.id || 'default'}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Cập nhật lại dockTrucks khi đổi Hub
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

  // State cho modal niêm phong nhanh từ Dock
  const [sealingDockTruck, setSealingDockTruck] = useState<DockTruck | null>(null)
  const [quickSealNumber, setQuickSealNumber] = useState<string>('')

  // Xe mục tiêu bắn hàng trực tiếp (Zero-Popup Direct Scan-to-Truck)
  const [activeScanDockTruckId, setActiveScanDockTruckId] = useState<string | null>(null)
  const [directScanMode, setDirectScanMode] = useState<boolean>(true)

  // Tự động chọn xe đầu tiên tại Dock làm mục tiêu bắn
  useEffect(() => {
    if (dockTrucks.length > 0 && (!activeScanDockTruckId || !dockTrucks.some((t) => t.id === activeScanDockTruckId))) {
      setActiveScanDockTruckId(dockTrucks[0].id)
    }
  }, [dockTrucks, activeScanDockTruckId])

  // State cho Modal Tiếp Nhận & Đối Soát Bảng Kê Chuyến Xe Tải (Tab 3)
  const [reconcilingTrip, setReconcilingTrip] = useState<LinehaulTrip | null>(null)

  // State cho Modal Chia Tuyến Shipper Last-Mile (Tab 4)
  const [isLastMileModalOpen, setIsLastMileModalOpen] = useState(false)
  const [lastMileModalShipments, setLastMileModalShipments] = useState<Shipment[]>([])
  const [selectedLastMileIds, setSelectedLastMileIds] = useState<Set<string>>(new Set())

  const isDestinedForCurrentHub = (s: Shipment) => {
    if (!currentHub) return true
    const addr = (s.deliveryAddress || '').toLowerCase()
    const hubProv = (currentHub.province || '').toLowerCase()
    const hubDist = (currentHub.district || '').toLowerCase()
    const hubCode = (currentHub.code || '').toLowerCase()

    if (hubCode === 'dn01' || hubProv.includes('đồng nai') || hubDist.includes('biên hòa')) {
      return addr.includes('đồng nai') || addr.includes('biên hòa')
    }
    if (hubCode === 'hn01' || hubProv.includes('hà nội') || hubDist.includes('mê linh')) {
      return addr.includes('hà nội') || addr.includes('mê linh')
    }
    if (hubCode === 'hcm01' || hubProv.includes('hồ chí minh') || hubDist.includes('tân bình')) {
      return addr.includes('hồ chí minh') || addr.includes('hcm') || addr.includes('sài gòn') || (!addr.includes('đồng nai') && !addr.includes('hà nội'))
    }
    return false
  }

  // 1. Nhận Từ Shipper: CHỈ đơn PICKED_UP thuộc Hub hiện tại
  const pickupInboundList = useMemo(() =>
    shipments.filter((s) => s.status === 'PICKED_UP' && s.currentHubId === currentHub?.id),
    [shipments, currentHub]
  )

  // 2. Phân Loại & Xuất Xe: Đơn đã nhập kho hiện tại
  const sortingList = useMemo(() =>
    shipments.filter((s) => ['AT_ORIGIN_HUB', 'SORTING'].includes(s.status) && s.currentHubId === currentHub?.id),
    [shipments, currentHub]
  )

  // 3. Tiếp Nhận Xe Tải Đến: Đơn IN_TRANSIT hướng về Hub đích hiện tại
  const inTransitList = useMemo(() =>
    shipments.filter((s) => s.status === 'IN_TRANSIT' && isDestinedForCurrentHub(s)),
    [shipments, currentHub]
  )

  // Gom nhóm các đơn IN_TRANSIT theo từng Chuyến xe Linehaul (Biển số xe & Mã Seal)
  const linehaulTrips = useMemo(() => {
    const map = new Map<string, LinehaulTrip>()

    inTransitList.forEach((s) => {
      const info = extractLinehaulInfo(s)
      const truck = info?.truckNumber || 'Xe Tuyến Liên Tỉnh'
      const seal = info?.sealNumber || 'Chưa gắn Seal'
      const driver = info?.driver || 'Bác tài'
      const phone = info?.driverPhone || ''
      const key = `${truck}_${seal}`

      if (!map.has(key)) {
        map.set(key, {
          tripKey: key,
          truckNumber: truck,
          sealNumber: seal,
          truckDriver: driver,
          truckDriverPhone: phone,
          originHubName: s.currentHub?.name,
          dispatchedAt: s.trackingLogs?.find((l) => l.description?.includes('Xe tải'))?.timestamp,
          shipments: [],
        })
      }
      map.get(key)!.shipments.push({
        id: s.id,
        trackingNumber: s.trackingNumber,
        orderId: s.orderId,
        buyerName: s.buyerName,
        buyerPhone: s.buyerPhone,
        deliveryAddress: s.deliveryAddress,
        package: s.package,
        codAmount: s.codAmount,
        status: s.status,
      })
    })

    return Array.from(map.values())
  }, [inTransitList])

  const activeReconcilingTrip = useMemo(() => {
    if (!reconcilingTrip) return null
    return linehaulTrips.find((t) => t.tripKey === reconcilingTrip.tripKey) || reconcilingTrip
  }, [reconcilingTrip, linehaulTrips])

  // 4. Chia Tuyến Shipper Giao: Đơn đã nhập Hub đích hiện tại (cả chờ gán và đã gán chờ shipper nhận)
  const destinationList = useMemo(() =>
    shipments.filter((s) => ['AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status) && isDestinedForCurrentHub(s)),
    [shipments, currentHub]
  )

  const completedTodayCount = useMemo(() => {
    return shipments.filter((s) =>
      ['DELIVERED', 'OUT_FOR_DELIVERY', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status)
      && s.currentHubId === currentHub?.id
    ).length
  }, [shipments, currentHub])

  const activeList = useMemo(() => {
    const raw = stationTab === 'INBOUND_PICKUP' ? pickupInboundList
      : stationTab === 'SORTING_LINEHAUL' ? sortingList
      : stationTab === 'INBOUND_RECEIVING' ? inTransitList
      : destinationList

    if (!searchFilter.trim()) return raw
    const q = searchFilter.trim().toLowerCase()
    return raw.filter((s) =>
      s.trackingNumber.toLowerCase().includes(q)
      || s.buyerName.toLowerCase().includes(q)
      || s.buyerPhone.includes(q)
      || s.orderId.toLowerCase().includes(q)
    )
  }, [stationTab, pickupInboundList, sortingList, inTransitList, destinationList, searchFilter])

  const getPickupDriver = (s: Shipment): Assignment | undefined => {
    return s.assignments?.find((a) => a.type === 'PICKUP' && a.status === 'COMPLETED')
  }

  const getDeliveryDriver = (s: Shipment): Assignment | undefined => {
    return s.assignments?.find((a) => a.type === 'DELIVERY' && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status))
  }

  // Quản lý chọn checkbox nhiều đơn ở Tab 2
  const handleToggleSelectShipment = (id: string) => {
    const next = new Set(selectedShipmentIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedShipmentIds(next)
  }

  const handleSelectAllSorting = () => {
    if (selectedShipmentIds.size === sortingList.length) {
      setSelectedShipmentIds(new Set())
    } else {
      setSelectedShipmentIds(new Set(sortingList.map((s) => s.id)))
    }
  }

  // Quản lý chọn checkbox nhiều đơn ở Tab 4 (Chia tuyến Last-Mile)
  const handleToggleSelectLastMile = (id: string) => {
    const next = new Set(selectedLastMileIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedLastMileIds(next)
  }

  const handleSelectAllLastMile = () => {
    if (selectedLastMileIds.size === destinationList.length) {
      setSelectedLastMileIds(new Set())
    } else {
      setSelectedLastMileIds(new Set(destinationList.map((s) => s.id)))
    }
  }

  // Mở modal chia tuyến lẻ hoặc hàng loạt cho Tab 4
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

  // Xử lý xác nhận phân tuyến cho Shipper Last-Mile
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

  // Mở modal đóng xe cho 1 đơn lẻ
  const handleOpenDispatchSingle = (shipment: Shipment) => {
    setModalShipments([shipment])
    setIsDispatchModalOpen(true)
  }

  // Mở modal đóng xe hàng loạt cho các đơn đã tick chọn
  const handleOpenDispatchBatch = () => {
    const selected = sortingList.filter((s) => selectedShipmentIds.has(s.id))
    if (selected.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kiện hàng để đóng xe!')
      return
    }
    setModalShipments(selected)
    setIsDispatchModalOpen(true)
  }

  // Xử lý xác nhận xếp xe / niêm phong & xuất xe từ Modal
  const handleConfirmLinehaulDispatch = async (data: LinehaulDispatchData) => {
    if (!data.isSealAndDispatch) {
      // Chế độ 1: Xếp lên xe tại Dock (thùng xe mở để gom thêm hàng)
      const selectedShipmentObjects: LinehaulShipment[] = data.shipmentIds.map((id) => {
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

      // Cập nhật tracking log cho các kiện hàng này
      for (const shipmentId of data.shipmentIds) {
        await onUpdateStatus(
          shipmentId,
          'SORTING',
          undefined,
          currentHub?.id,
          `Đã xếp lên xe tải [${data.truckNumber}] tại cửa Dock (Tuyến đi ${data.targetHubName}). Thùng xe mở chờ gom đủ tải.`
        )
      }

      // Cập nhật dockTrucks
      const existingTruckIndex = dockTrucks.findIndex(
        (t) => t.truckNumber === data.truckNumber && t.targetHubId === data.targetHubId
      )

      let updatedTrucks: DockTruck[]
      if (existingTruckIndex >= 0) {
        const existing = dockTrucks[existingTruckIndex]
        const mergedShipments = [...existing.shipments]
        for (const item of selectedShipmentObjects) {
          if (!mergedShipments.some((s) => s.id === item.id)) {
            mergedShipments.push(item)
          }
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
        const newTruck: DockTruck = {
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
      // Chế độ 2: Niêm phong Seal chì & Xuất bến ngay lập tức
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

      // Xóa xe khỏi dockTrucks nếu xe này trước đó đang mở tại dock
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

  // Mở modal niêm phong từ danh sách xe tại Dock
  const handleOpenSealModal = (truck: DockTruck) => {
    const destHub = hubs.find((h) => h.id === truck.targetHubId)
    const destCode = destHub?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    setQuickSealNumber(`SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`)
    setSealingDockTruck(truck)
  }

  // Xác nhận niêm phong & xuất bến từ Dock
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

  // Dỡ toàn bộ kiện hàng của xe tại Dock trở lại sàn kho
  const handleUnloadEntireDockTruck = async (truck: DockTruck) => {
    const confirm = window.confirm(`Bạn có chắc muốn dỡ toàn bộ ${truck.shipments.length} kiện trên xe tải [${truck.truckNumber}] quay trở lại sàn kho không?`)
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

  // Dỡ 1 kiện hàng khỏi xe tại Dock
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

  // Lọc các bưu kiện trong kho chưa lên xe nào và có địa chỉ khớp tuyến của xe này
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

  // 1-Click: Gom toàn bộ kiện hàng cùng tuyến trong kho vào chuyến xe này
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

  // Xử lý đối soát & nhận kiện từ Modal Chuyến Xe (Tab 3)
  const handleReceiveShipmentFromTrip = async (shipmentId: string) => {
    const truck = reconcilingTrip?.truckNumber || 'Xe tải tuyến'
    await onUpdateStatus(
      shipmentId,
      'AT_DESTINATION_HUB',
      undefined,
      currentHub?.id,
      `Xe tải [${truck}] đã đến. Nhân viên bưu cục [${currentUser.name}] đã đối soát & nhập bưu cục phát ${currentHub?.name}`
    )
    onRefresh()
  }

  const handleReceiveAllShipmentsFromTrip = async (shipmentIds: string[]) => {
    const truck = reconcilingTrip?.truckNumber || 'Xe tải tuyến'
    for (const id of shipmentIds) {
      await onUpdateStatus(
        id,
        'AT_DESTINATION_HUB',
        undefined,
        currentHub?.id,
        `Xe tải [${truck}] đã đến. Xác nhận nhập kho bưu cục phát ${currentHub?.name}`
      )
    }
    setScanMessage({
      type: 'success',
      text: `🏢 Đã nhập kho thành công toàn bộ ${shipmentIds.length} kiện từ chuyến xe [${truck}]!`,
    })
    onRefresh()
  }

  const handleReportTripDiscrepancy = async (
    trip: LinehaulTrip,
    missingShipmentIds: string[],
    reason: string
  ) => {
    for (const id of missingShipmentIds) {
      await onUpdateStatus(
        id,
        'DELIVERY_FAILED',
        reason,
        currentHub?.id,
        `BẤT THƯỜNG ĐỐI SOÁT CHUYẾN XE [${trip.truckNumber}]: ${reason}. Đã lập biên bản gửi Bác tài [${trip.truckDriver}] & Bưu cục gửi để truy soát camera.`
      )
    }
    setScanMessage({
      type: 'error',
      text: `⚠️ Đã lập biên bản bất thường thiếu ${missingShipmentIds.length} kiện trên chuyến xe [${trip.truckNumber}].`,
    })
    onRefresh()
  }

  const scanConfig = {
    INBOUND_PICKUP: {
      placeholder: 'Quét mã vận đơn để NHẬP KHO từ Shipper bàn giao...',
      buttonLabel: '📥 Quét Nhập Kho',
      buttonColor: 'bg-amber-600 hover:bg-amber-500',
    },
    SORTING_LINEHAUL: {
      placeholder:
        dockTrucks.length > 0 && directScanMode
          ? `🔫 Bắn súng quét PDA liên thanh nạp thẳng vào Xe [${(dockTrucks.find((t) => t.id === activeScanDockTruckId) || dockTrucks[0]).truckNumber}]...`
          : 'Quét mã vận đơn để MỞ PHIÊN ĐÓNG XE TẢI LINEHAUL...',
      buttonLabel:
        dockTrucks.length > 0 && directScanMode
          ? `⚡ Bắn Lên Xe [${(dockTrucks.find((t) => t.id === activeScanDockTruckId) || dockTrucks[0]).truckNumber}]`
          : '🚛 Quét & Đóng Xe',
      buttonColor:
        dockTrucks.length > 0 && directScanMode
          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
          : 'bg-sky-600 hover:bg-sky-500',
    },
    INBOUND_RECEIVING: {
      placeholder: 'Quét mã vận đơn để CẮT SEAL & NHẬP BƯU CỤC PHÁT...',
      buttonLabel: '🏢 Quét Nhận Hàng',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-500',
    },
    DISPATCH_LASTMILE: {
      placeholder: 'Quét mã vận đơn để GÁN SHIPPER giao tận nhà...',
      buttonLabel: '🛵 Quét Gán Tuyến',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-500',
    },
  }

  const currentScanCfg = scanConfig[stationTab]

  const handleScanCode = async (rawCode: string) => {
    if (!rawCode.trim()) return

    const code = rawCode.trim().toUpperCase()
    const targetShipment = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === code || s.orderId.toUpperCase() === code
    )

    if (!targetShipment) {
      setScanMessage({ type: 'error', text: `❌ Không tìm thấy vận đơn khớp với mã [${code}]` })
      setScannedCode('')
      return
    }

    if (stationTab !== 'INBOUND_RECEIVING' && targetShipment.currentHubId !== currentHub?.id) {
      setScanMessage({ type: 'error', text: `⚠️ Vận đơn ${code} thuộc bưu cục khác (${targetShipment.currentHub?.name || targetShipment.currentHubId}), không thể xử lý tại ${currentHub?.name}` })
      setScannedCode('')
      return
    }

    try {
      if (stationTab === 'INBOUND_PICKUP') {
        await onUpdateStatus(targetShipment.id, 'AT_ORIGIN_HUB', undefined, currentHub?.id, `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`)
        setScanMessage({ type: 'success', text: `✅ Đã nhập kho: ${targetShipment.trackingNumber} — Bàn giao từ Shipper thành công` })
      } else if (stationTab === 'SORTING_LINEHAUL') {
        const targetTruck = dockTrucks.find((t) => t.id === activeScanDockTruckId) || dockTrucks[0]

        if (directScanMode && targetTruck) {
          // CHẾ ĐỘ BẮN SÚNG PDA SIÊU TỐC: Nạp trực tiếp vào xe không bật popup
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

          // Âm thanh phản hồi bíp
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = audioCtx.createOscillator()
            osc.frequency.setValueAtTime(880, audioCtx.currentTime)
            osc.connect(audioCtx.destination)
            osc.start()
            osc.stop(audioCtx.currentTime + 0.08)
          } catch {}

          setScanMessage({
            type: 'success',
            text: `🎯 BẮN THÀNH CÔNG: [${targetShipment.trackingNumber}] ➔ Xe [${targetTruck.truckNumber}] (Tổng: ${targetTruck.shipments.length + 1} kiện trên xe)`,
          })
        } else {
          // Mở Modal đóng xe thông thường
          handleOpenDispatchSingle(targetShipment)
        }
      } else if (stationTab === 'INBOUND_RECEIVING') {
        await onUpdateStatus(targetShipment.id, 'AT_DESTINATION_HUB', undefined, currentHub?.id, `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`)
        setScanMessage({ type: 'success', text: `🏢 Đã kiểm tra Seal & nhập bưu cục phát: ${targetShipment.trackingNumber}` })
      } else if (stationTab === 'DISPATCH_LASTMILE') {
        // Mở Modal phân tuyến để người vận hành kiểm tra thông tin và chọn Shipper
        handleOpenLastMileSingle(targetShipment)
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

  const tabs = [
    {
      id: 'INBOUND_PICKUP' as const,
      title: '1. Nhận Từ Shipper',
      desc: 'Tiếp nhận bưu kiện Shipper First-Mile bàn giao',
      count: pickupInboundList.length,
      icon: '📥',
      activeColor: 'border-amber-500 bg-amber-50 ring-amber-200',
      countColor: 'text-amber-700 bg-amber-100 border-amber-300',
    },
    {
      id: 'SORTING_LINEHAUL' as const,
      title: '2. Phân Loại & Đóng Xe Tải',
      desc: 'Phân luồng, chọn xe tải & niêm phong Seal chì',
      count: sortingList.length,
      icon: '🚛',
      activeColor: 'border-sky-500 bg-sky-50 ring-sky-200',
      countColor: 'text-sky-700 bg-sky-100 border-sky-300',
    },
    {
      id: 'INBOUND_RECEIVING' as const,
      title: '3. Tiếp Nhận Xe Tải Đến',
      desc: 'Cắt Seal & nhận kiện từ xe tải về bưu cục phát',
      count: inTransitList.length,
      icon: '🏢',
      activeColor: 'border-indigo-500 bg-indigo-50 ring-indigo-200',
      countColor: 'text-indigo-700 bg-indigo-100 border-indigo-300',
    },
    {
      id: 'DISPATCH_LASTMILE' as const,
      title: '4. Chia Tuyến Giao',
      desc: 'Bàn giao Shipper Last-Mile đi phát tận nhà',
      count: destinationList.length,
      icon: '🛵',
      activeColor: 'border-emerald-500 bg-emerald-50 ring-emerald-200',
      countColor: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    },
  ]

  if (!currentHub) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
        <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 font-bold">Đang tải dữ liệu bưu cục...</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 text-left">

      {/* ====== SECTION 1: HUB IDENTITY & KPI DASHBOARD ====== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-5">

        {/* Hub Identity Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
                🏭
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight leading-tight">
                  Trạm Khai Thác Bưu Cục
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  Sorting Hub Station • Đóng xe Linehaul & Niêm phong Seal chì
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-600">
            <span className="text-emerald-400 text-lg">🏢</span>
            <div>
              <div className="text-xs font-black text-emerald-400 leading-tight">
                {currentHub?.name || 'Bưu Cục Chưa Xác Định'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Mã: {currentHub?.code} • {currentHub?.province}
              </div>
            </div>
            <span className="ml-2 px-1.5 py-0.5 bg-emerald-900/60 border border-emerald-600/50 rounded text-[9px] font-black text-emerald-400 uppercase">
              🔒 Cố Định
            </span>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Chờ Nhận Từ Shipper', value: pickupInboundList.length, icon: '📥', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30', textColor: 'text-amber-400' },
            { label: 'Chờ Đóng Xe Tải', value: sortingList.length, icon: '📦', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30', textColor: 'text-sky-400' },
            { label: 'Xe Tải Đang Đến', value: inTransitList.length, icon: '🚛', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30', textColor: 'text-indigo-400' },
            { label: 'Chờ Chia Tuyến Giao', value: destinationList.length, icon: '🛵', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30', textColor: 'text-emerald-400' },
            { label: 'Đã Xử Lý (Tổng)', value: completedTodayCount, icon: '✅', color: 'from-green-500/20 to-green-600/10 border-green-500/30', textColor: 'text-green-400' },
          ].map((kpi, i) => (
            <div key={i} className={`bg-gradient-to-br ${kpi.color} border rounded-2xl p-3.5 space-y-1.5`}>
              <div className="flex justify-between items-start">
                <span className="text-lg">{kpi.icon}</span>
                <span className={`text-2xl font-black ${kpi.textColor}`}>{kpi.value}</span>
              </div>
              <p className="text-[10px] text-slate-300 font-bold leading-tight">{kpi.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ====== SECTION 2: 4-STEP PIPELINE TABS ====== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStationTab(tab.id)
              setSearchFilter('')
              setScanMessage(null)
              setSelectedShipmentIds(new Set())
            }}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
              stationTab === tab.id
                ? `${tab.activeColor} shadow-sm ring-2`
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-lg font-black px-2.5 py-0.5 rounded-lg border ${
                stationTab === tab.id ? tab.countColor : 'text-slate-500 bg-slate-100 border-slate-200'
              }`}>
                {tab.count}
              </span>
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-800 leading-tight">{tab.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ====== SECTION 3: SCANNER BAR ====== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-black text-slate-600">
            <span>📟</span>
            <span>Máy Quét Mã Vạch — Khâu:</span>
            <span className="text-emerald-700">
              {tabs.find((t) => t.id === stationTab)?.title}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 ${
              isCameraScannerOpen
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>{isCameraScannerOpen ? '✕' : '📷'}</span>
            <span>{isCameraScannerOpen ? 'Tắt Camera Quét' : 'Bật Camera Quét Mã'}</span>
          </button>
        </div>

        {/* Live Camera Scanner Viewfinder */}
        {isCameraScannerOpen && (
          <div className="pt-2">
            <BarcodeCameraScanner
              isInline
              onScanSuccess={(code) => {
                handleScanCode(code)
              }}
              onClose={() => setIsCameraScannerOpen(false)}
            />
          </div>
        )}
        {/* Chế độ Bắn Hàng Trực Tiếp Lên Xe Tuyến (Tab 2: SORTING_LINEHAUL) */}
        {stationTab === 'SORTING_LINEHAUL' && dockTrucks.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border-2 border-sky-300 rounded-2xl space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-sky-950">
                <span className="text-base">🎯</span>
                <span>Mục Tiêu Bắn Hàng Trực Tiếp Lên Xe (Scan-to-Truck):</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold">Chế độ súng quét:</span>
                <button
                  type="button"
                  onClick={() => setDirectScanMode(!directScanMode)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center gap-1.5 border shadow-xs ${
                    directScanMode
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{directScanMode ? '⚡ Nạp Thẳng Vào Xe (Không Popup)' : '⚙️ Mở Modal Xác Nhận'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-500 font-bold">Chọn xe nhận hàng:</span>
              {dockTrucks.map((dt) => {
                const isActive = (activeScanDockTruckId || dockTrucks[0].id) === dt.id
                return (
                  <button
                    key={dt.id}
                    type="button"
                    onClick={() => setActiveScanDockTruckId(dt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition cursor-pointer flex items-center gap-2 border ${
                      isActive
                        ? 'bg-sky-600 text-white border-sky-700 shadow-sm ring-2 ring-sky-400/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🚛 [{dt.truckNumber}]</span>
                    <span className="text-[10px] font-sans font-normal opacity-90">➔ {dt.targetHubName}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded-md font-bold ${
                      isActive ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {dt.shipments.length} kiện
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleScanSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder={currentScanCfg.placeholder}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || !scannedCode.trim()}
            className={`px-6 py-3 ${currentScanCfg.buttonColor} text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40`}
          >
            {currentScanCfg.buttonLabel}
          </button>
        </form>

        {scanMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            scanMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
              : scanMessage.type === 'info'
              ? 'bg-sky-50 border border-sky-300 text-sky-700'
              : 'bg-rose-50 border border-rose-300 text-rose-700'
          }`}>
            {scanMessage.text}
          </div>
        )}
      </div>

      {/* ====== SECTION 4: PARCEL TABLE ====== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        {/* Banner Các Chuyến Xe Đang Xếp Hàng Tại Cửa Dock (Tab 2: SORTING_LINEHAUL) */}
        {stationTab === 'SORTING_LINEHAUL' && (
          <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white border-b border-sky-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-600/50 border border-sky-400/40 flex items-center justify-center text-lg shadow-inner">
                  🚚
                </div>
                <div>
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <span>Cửa Dock Xếp Xe Tuyến — Đang Mở Thùng ({dockTrucks.length} xe)</span>
                    {dockTrucks.length > 0 && (
                      <span className="px-2 py-0.5 bg-sky-500/30 border border-sky-400/50 rounded-full text-[10px] text-sky-300 font-mono animate-pulse">
                        Đang Xếp Hàng
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Thùng xe mở tại Dock để gom thêm bưu kiện. Khi xe đủ tải, bấm <b>Niêm Phong Seal & Xuất Bến</b> để hoàn tất.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-sky-300 font-mono">
                Tổng cộng: <b>{dockTrucks.reduce((sum, t) => sum + t.shipments.length, 0)} kiện</b> đã xếp lên các xe tại Dock
              </div>
            </div>

            {dockTrucks.length === 0 ? (
              <div className="py-3 px-4 text-center text-xs text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/60 flex items-center justify-center gap-2">
                <span>ℹ️</span>
                <span>Cửa Dock hiện đang trống. Chọn các bưu kiện trong danh sách bên dưới rồi bấm <b>"Đóng Xe Tuyến"</b> để bắt đầu xếp hàng lên xe.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {dockTrucks.map((dt) => {
                  const truckWeight = dt.shipments.reduce((sum, s) => sum + (s.package?.weight || 0.5), 0)
                  const truckCod = dt.shipments.reduce((sum, s) => sum + (s.codAmount || 0), 0)

                  return (
                    <div
                      key={dt.id}
                      className="bg-slate-800/95 hover:bg-slate-800 border border-sky-500/40 rounded-2xl p-3.5 space-y-3 transition shadow-sm text-left"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="font-mono font-black text-sm text-sky-300 flex items-center gap-1.5">
                            <span>🚛</span>
                            <span>[{dt.truckNumber}]</span>
                            <span className="text-[10px] text-slate-300 font-sans font-normal">({dt.truckType})</span>
                          </div>
                          <div className="text-[11px] text-slate-300 font-medium">
                            Bác tài: <b>{dt.truckDriver}</b>
                            {dt.truckDriverPhone && <span className="text-slate-400 font-mono"> ({dt.truckDriverPhone})</span>}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/40 rounded-lg text-[9px] font-bold shrink-0">
                          🟡 ĐANG XẾP
                        </span>
                      </div>

                      <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] space-y-1">
                        <div className="text-slate-300 flex items-center gap-1">
                          <span className="text-slate-400">Tuyến đến:</span>
                          <b className="text-white truncate">{dt.targetHubName}</b>
                        </div>
                        <div className="flex justify-between text-slate-300 text-[10px]">
                          <span>Quy mô: <b className="text-sky-300 font-mono">{dt.shipments.length} kiện</b></span>
                          <span>Trọng lượng: <b className="text-white font-mono">{truckWeight.toFixed(1)} kg</b></span>
                          {truckCod > 0 && <span>COD: <b className="text-emerald-400 font-mono">{truckCod.toLocaleString('vi-VN')}đ</b></span>}
                        </div>
                      </div>

                      {/* 1-Click: Gom toàn bộ kiện hàng cùng tuyến còn lại trong kho */}
                      {(() => {
                        const matchingUnloaded = getMatchingUnloadedParcelsForTruck(dt)
                        if (matchingUnloaded.length > 0) {
                          return (
                            <button
                              type="button"
                              onClick={() => handleBatchLoadRouteToTruck(dt)}
                              disabled={actionLoading}
                              className="w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 animate-pulse"
                            >
                              <span>⚡</span>
                              <span>Gom Toàn Bộ {matchingUnloaded.length} Kiện Cùng Tuyến Vào Xe</span>
                            </button>
                          )
                        }
                        return (
                          <div className="text-[10px] text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 rounded-xl px-2.5 py-1 text-center font-bold">
                            ✓ Đã gom hết kiện hàng chờ xuất tuyến này trong kho
                          </div>
                        )
                      })()}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenSealModal(dt)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span>🔒</span>
                          <span>Niêm Phong Seal & Xuất Bến</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnloadEntireDockTruck(dt)}
                          title="Dỡ toàn bộ kiện hàng trở lại sàn kho"
                          className="px-2.5 py-2 bg-slate-700/80 hover:bg-rose-900/60 hover:border-rose-500 border border-slate-600 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Dỡ xe
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Banner Đối Soát Chuyến Xe Tuyến (Tab 3: INBOUND_RECEIVING) */}
        {stationTab === 'INBOUND_RECEIVING' && (
          <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-lg">
                  🚛
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">
                    Bảng Kê Chuyến Xe Tuyến Đang Cập Bến ({linehaulTrips.length} chuyến)
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Đối soát Seal chì & kiểm đếm bưu kiện khi dỡ xe để tránh thất lạc
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-indigo-300 font-mono">
                Tổng cộng: <b>{inTransitList.length} kiện</b> đang trên đường đến
              </div>
            </div>

            {linehaulTrips.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-800/40 rounded-xl border border-slate-700/60">
                Chưa có chuyến xe tải nào đang trung chuyển đến bưu cục này.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {linehaulTrips.map((trip) => (
                  <div
                    key={trip.tripKey}
                    className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 transition shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-mono font-black text-sm text-sky-400 flex items-center gap-1.5">
                          <span>🚛</span>
                          <span>[{trip.truckNumber}]</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">
                          Bác tài: <b>{trip.truckDriver}</b>
                          {trip.truckDriverPhone && <span className="text-slate-400 font-mono"> ({trip.truckDriverPhone})</span>}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold shrink-0">
                        🔒 {trip.sealNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                      <span className="text-slate-400 text-[11px]">
                        Quy mô: <b className="text-white font-mono">{trip.shipments.length} kiện</b>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReconcilingTrip(trip)}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1"
                      >
                        <span>📋</span>
                        <span>Mở Bảng Kê Đối Soát</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table Header with Batch Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
              📋 {tabs.find((t) => t.id === stationTab)?.title}
            </h3>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md border border-slate-200">
              {activeList.length} kiện
            </span>

            {/* Batch Linehaul Dispatch Button (Tab 2) */}
            {stationTab === 'SORTING_LINEHAUL' && selectedShipmentIds.size > 0 && (
              <button
                onClick={handleOpenDispatchBatch}
                className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse"
              >
                <span>🚛</span>
                <span>Đóng Xe Tuyến ({selectedShipmentIds.size} kiện đã chọn)</span>
              </button>
            )}

            {/* Quick Route Selectors (Tab 2) */}
            {stationTab === 'SORTING_LINEHAUL' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {hubs
                  .filter((h) => !currentHub?.id || h.id !== currentHub.id)
                  .map((destHub) => {
                    const prov = (destHub.province || '').toLowerCase()
                    const loadedIds = new Set(dockTrucks.flatMap((t) => t.shipments.map((item) => item.id)))
                    const matching = sortingList.filter((s) => {
                      if (loadedIds.has(s.id)) return false
                      const addr = (s.deliveryAddress || '').toLowerCase()
                      if (prov.includes('hồ chí minh') || prov.includes('hcm')) {
                        return (
                          addr.includes('hồ chí minh') ||
                          addr.includes('tp.hcm') ||
                          addr.includes('tp hcm') ||
                          addr.includes('sài gòn') ||
                          addr.includes('tân bình') ||
                          addr.includes('gò vấp') ||
                          addr.includes('bình thạnh') ||
                          addr.includes('quận 1') ||
                          addr.includes('bình dương') ||
                          addr.includes('đồng nai')
                        )
                      }
                      if (prov.includes('hà nội') || prov.includes('mê linh')) {
                        return addr.includes('hà nội') || addr.includes('mê linh') || addr.includes('cầu giấy')
                      }
                      return addr.includes(prov)
                    })

                    if (matching.length === 0) return null

                    return (
                      <button
                        key={destHub.id}
                        type="button"
                        onClick={() => {
                          const matchingIds = matching.map((s) => s.id)
                          setSelectedShipmentIds(new Set(matchingIds))
                        }}
                        className="px-2 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1"
                        title={`Chọn toàn bộ ${matching.length} kiện chờ xuất đi ${destHub.name}`}
                      >
                        <span>⚡ Chọn Tuyến {destHub.code} ({matching.length} kiện)</span>
                      </button>
                    )
                  })}
              </div>
            )}

            {/* Batch Last-Mile Dispatch Button (Tab 4) */}
            {stationTab === 'DISPATCH_LASTMILE' && selectedLastMileIds.size > 0 && (
              <button
                onClick={handleOpenLastMileBatch}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1.5 animate-pulse"
              >
                <span>🛵</span>
                <span>Phân Tuyến Shipper ({selectedLastMileIds.size} kiện đã chọn)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm mã vận đơn, tên..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-400 w-44"
              />
            </div>
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
            >
              🔄 Làm Mới
            </button>
          </div>
        </div>

        {activeList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="text-4xl opacity-40">
              {stationTab === 'INBOUND_PICKUP' ? '📭' : stationTab === 'SORTING_LINEHAUL' ? '📦' : stationTab === 'INBOUND_RECEIVING' ? '🚛' : '🛵'}
            </div>
            <p className="text-sm font-bold text-slate-400">Không có bưu kiện nào chờ xử lý tại khâu này</p>
            <p className="text-xs text-slate-300">
              {stationTab === 'INBOUND_PICKUP'
                ? 'Các Shipper First-Mile chưa bàn giao kiện hàng nào về bưu cục.'
                : stationTab === 'SORTING_LINEHAUL'
                ? 'Chưa có kiện hàng nào tại kho cần phân loại & xuất xe.'
                : stationTab === 'INBOUND_RECEIVING'
                ? 'Chưa có xe tải trung chuyển nào đang trên đường đến.'
                : 'Chưa có kiện hàng nào chờ chia tuyến cho Shipper giao.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  {(stationTab === 'SORTING_LINEHAUL' || stationTab === 'DISPATCH_LASTMILE') && (
                    <th className="py-3 px-3 text-center w-8">
                      <input
                        type="checkbox"
                        checked={
                          stationTab === 'SORTING_LINEHAUL'
                            ? sortingList.length > 0 && selectedShipmentIds.size === sortingList.length
                            : destinationList.length > 0 && selectedLastMileIds.size === destinationList.length
                        }
                        onChange={
                          stationTab === 'SORTING_LINEHAUL'
                            ? handleSelectAllSorting
                            : handleSelectAllLastMile
                        }
                        className="rounded text-sky-600 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Mã Vận Đơn</th>
                  <th className="py-3 px-4">Người Nhận / Tuyến Đích</th>
                  {stationTab === 'INBOUND_PICKUP' && (
                    <th className="py-3 px-4">Shipper Bàn Giao</th>
                  )}
                  {stationTab === 'INBOUND_RECEIVING' && (
                    <th className="py-3 px-4">Chuyến Xe Tải & Mã Seal</th>
                  )}
                  {stationTab === 'DISPATCH_LASTMILE' && (
                    <th className="py-3 px-4">Shipper Phụ Trách</th>
                  )}
                  <th className="py-3 px-4">Kiện Hàng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeList.map((s) => {
                  const pickupAssignment = getPickupDriver(s)
                  const deliveryAssignment = getDeliveryDriver(s)
                  const linehaulInfo = stationTab === 'INBOUND_RECEIVING' ? extractLinehaulInfo(s) : null

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      {/* Checkbox chọn hàng loạt (Tab 2 hoặc Tab 4) */}
                      {stationTab === 'SORTING_LINEHAUL' && (
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedShipmentIds.has(s.id)}
                            onChange={() => handleToggleSelectShipment(s.id)}
                            className="rounded text-sky-600 cursor-pointer"
                          />
                        </td>
                      )}
                      {stationTab === 'DISPATCH_LASTMILE' && (
                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedLastMileIds.has(s.id)}
                            onChange={() => handleToggleSelectLastMile(s.id)}
                            className="rounded text-emerald-600 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Mã vận đơn */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-mono font-black text-emerald-700 text-[11px]">{s.trackingNumber}</div>
                        <div className="text-[10px] text-slate-400 font-medium">#{s.orderId.slice(0, 12)}...</div>
                        {s.codAmount > 0 && (
                          <div className="text-[10px] font-bold text-rose-600">
                            💰 COD: {s.codAmount.toLocaleString('vi-VN')}đ
                          </div>
                        )}
                        {stationTab === 'SORTING_LINEHAUL' && (() => {
                          const dt = dockTrucks.find((t) => t.shipments.some((item) => item.id === s.id))
                          if (!dt) return null
                          return (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[9px] font-bold">
                                <span>🚛</span> Trên xe: [{dt.truckNumber}]
                              </span>
                            </div>
                          )
                        })()}
                      </td>

                      {/* Người nhận */}
                      <td className="py-3.5 px-4 space-y-0.5 max-w-[200px]">
                        <div className="font-bold text-slate-800 text-[11px]">{s.buyerName}</div>
                        <div className="text-[10px] text-slate-400">{s.buyerPhone}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{s.deliveryAddress}</div>
                      </td>

                      {/* Shipper Bàn Giao (only for INBOUND_PICKUP) */}
                      {stationTab === 'INBOUND_PICKUP' && (
                        <td className="py-3.5 px-4 space-y-0.5 max-w-[180px]">
                          {pickupAssignment?.driver ? (
                            <>
                              <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                🛵 {pickupAssignment.driver.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                📞 {pickupAssignment.driver.phone} • 🏍️ {pickupAssignment.driver.vehicleNumber || pickupAssignment.driver.licensePlate || ''}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Lấy: {timeAgo(pickupAssignment.completedAt || s.pickedUpAt)}
                              </div>
                              {pickupAssignment.proofImage && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  📸 Có ảnh POP
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-300 italic">Chưa có thông tin</span>
                          )}
                        </td>
                      )}

                      {/* Chuyến Xe Tải & Seal (only for INBOUND_RECEIVING) */}
                      {stationTab === 'INBOUND_RECEIVING' && (
                        <td className="py-3.5 px-4 space-y-1 max-w-[190px]">
                          {linehaulInfo ? (
                            <>
                              <div className="font-mono font-black text-indigo-950 text-[11px] flex items-center gap-1">
                                🚛 {linehaulInfo.truckNumber}
                              </div>
                              {linehaulInfo.sealNumber && (
                                <div className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                                  🔒 {linehaulInfo.sealNumber}
                                </div>
                              )}
                              {linehaulInfo.driver && (
                                <div className="text-[10px] text-slate-500">
                                  Bác tài: {linehaulInfo.driver}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              🚛 Xe trung chuyển Linehaul
                            </div>
                          )}
                        </td>
                      )}

                      {/* Shipper Phụ Trách (only for DISPATCH_LASTMILE) */}
                      {stationTab === 'DISPATCH_LASTMILE' && (
                        <td className="py-3.5 px-4 space-y-0.5 max-w-[190px]">
                          {deliveryAssignment?.driver ? (
                            <>
                              <div className="font-bold text-teal-800 text-[11px] flex items-center gap-1">
                                🛵 {deliveryAssignment.driver.name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                📞 {deliveryAssignment.driver.phone} • 🏍️ {deliveryAssignment.driver.vehicleNumber || deliveryAssignment.driver.licensePlate || ''}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 mt-0.5">
                                ⏳ Chờ Shipper nhận
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chưa gán tuyến</span>
                          )}
                        </td>
                      )}

                      {/* Kiện Hàng */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-700 font-medium text-[11px]">{s.package?.itemsSummary || 'Bưu phẩm ZMX'}</div>
                        <div className="text-[10px] text-slate-400">{s.package?.weight || 0.5}kg</div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.status} />
                      </td>

                      {/* Thao Tác */}
                      <td className="py-3.5 px-4 text-right">
                        {stationTab === 'INBOUND_PICKUP' && (
                          <button
                            onClick={() => onUpdateStatus(s.id, 'AT_ORIGIN_HUB', undefined, currentHub?.id, `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40"
                          >
                            📥 Nhập Kho
                          </button>
                        )}

                        {stationTab === 'SORTING_LINEHAUL' && (() => {
                          const dt = dockTrucks.find((t) => t.shipments.some((item) => item.id === s.id))
                          if (dt) {
                            return (
                              <button
                                onClick={() => handleUnloadSingleShipmentFromDock(dt.id, s.id, dt.truckNumber)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg text-[10px] transition cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1 ml-auto"
                                title="Dỡ bưu kiện này khỏi xe tải quay lại sàn kho"
                              >
                                <span>↩️</span> Dỡ Khỏi Xe
                              </button>
                            )
                          }
                          return (
                            <button
                              onClick={() => handleOpenDispatchSingle(s)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1 ml-auto"
                            >
                              <span>🚛</span> Đóng Xe Tải
                            </button>
                          )
                        })()}

                        {stationTab === 'INBOUND_RECEIVING' && (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => {
                                const info = extractLinehaulInfo(s)
                                const truck = info?.truckNumber || 'Xe Tuyến Liên Tỉnh'
                                const seal = info?.sealNumber || 'Chưa gắn Seal'
                                const key = `${truck}_${seal}`
                                const foundTrip = linehaulTrips.find((t) => t.tripKey === key)
                                if (foundTrip) {
                                  setReconcilingTrip(foundTrip)
                                } else {
                                  onUpdateStatus(
                                    s.id,
                                    'AT_DESTINATION_HUB',
                                    undefined,
                                    currentHub?.id,
                                    `Xe tải [${truck}] đã đến và bàn giao bưu kiện vào ${currentHub?.name}`
                                  )
                                }
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                            >
                              <span>📋</span>
                              <span>Đối Soát Chuyến</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(s.id, 'AT_DESTINATION_HUB', undefined, currentHub?.id, `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`)}
                              disabled={actionLoading}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer border border-slate-200"
                              title="Nhập nhanh kiện này"
                            >
                              Nhập Nhanh
                            </button>
                          </div>
                        )}

                        {stationTab === 'DISPATCH_LASTMILE' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {s.status === 'DELIVERY_ASSIGNED' ? (
                              <button
                                onClick={() => handleOpenLastMileSingle(s)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                              >
                                <span>🔄</span> Đổi Shipper
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenLastMileSingle(s)}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1"
                              >
                                <span>🛵</span> Phân Tuyến Giao
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {activeList.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <span>Hiển thị {activeList.length} bưu kiện • Bưu cục: {currentHub?.name}</span>
            <span>Nhân viên: {currentUser.name}</span>
          </div>
        )}
      </div>

      {/* ====== MODAL: LINEHAUL TRUCK DISPATCH & SEAL MANIFEST (TAB 2) ====== */}
      <LinehaulDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false)
          setModalShipments([])
        }}
        onConfirm={handleConfirmLinehaulDispatch}
        currentHub={currentHub}
        availableHubs={hubs}
        selectedShipments={modalShipments}
        dockTrucks={dockTrucks}
        registeredDrivers={drivers}
        actionLoading={actionLoading}
      />

      {/* ====== MODAL: QUICK SEAL & DISPATCH FROM DOCK ====== */}
      {sealingDockTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🔒</span>
                <div>
                  <h4 className="font-black text-sm text-white">Niêm Phong Seal Chì Xuất Bến</h4>
                  <p className="text-[10px] text-amber-100 font-mono">
                    Xe: [{sealingDockTruck.truckNumber}] • Tuyến: {sealingDockTruck.targetHubName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSealingDockTruck(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Quy mô xuất bến:</span>
                  <span className="font-black text-slate-800">{sealingDockTruck.shipments.length} bưu kiện</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Tài xế phụ trách:</span>
                  <span className="font-bold text-slate-800">{sealingDockTruck.truckDriver} ({sealingDockTruck.truckDriverPhone || 'Không có SĐT'})</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Bưu cục tiếp nhận:</span>
                  <span className="font-bold text-indigo-700">{sealingDockTruck.targetHubName}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-black text-amber-950 block text-xs">
                  Mã Khóa Chì Niêm Phong (Security Seal Number) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quickSealNumber}
                    onChange={(e) => setQuickSealNumber(e.target.value.toUpperCase())}
                    placeholder="VD: SEAL-HN-HCM-9821"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-400 rounded-xl font-mono font-black text-amber-900 text-xs tracking-wider uppercase focus:outline-none focus:border-amber-600"
                    required
                  />
                  <span className="absolute right-2.5 top-2 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    ZMX CHÍNH HÃNG
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  * Dập khóa Seal vào cửa thùng xe trước khi tài xế nổ máy xuất bến.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSealingDockTruck(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSealFromDock}
                  disabled={actionLoading || !quickSealNumber.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <span>Đang Xuất Bến...</span>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>Chốt Seal & Xuất Bến ({sealingDockTruck.shipments.length} Kiện)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MODAL: LINEHAUL INBOUND MANIFEST & DISCREPANCY RECONCILIATION (TAB 3) ====== */}
      <LinehaulInboundReconciliationModal
        isOpen={!!reconcilingTrip}
        onClose={() => setReconcilingTrip(null)}
        trip={activeReconcilingTrip}
        currentHubName={currentHub?.name || 'Bưu cục phát'}
        onReceiveShipment={handleReceiveShipmentFromTrip}
        onReceiveAllShipments={handleReceiveAllShipmentsFromTrip}
        onReportDiscrepancy={handleReportTripDiscrepancy}
        actionLoading={actionLoading}
      />

      {/* ====== MODAL: LAST-MILE DISPATCH TO SHIPPER (TAB 4) ====== */}
      <LastMileDispatchModal
        isOpen={isLastMileModalOpen}
        onClose={() => {
          setIsLastMileModalOpen(false)
          setLastMileModalShipments([])
        }}
        shipments={lastMileModalShipments}
        drivers={drivers}
        currentHub={currentHub}
        onConfirm={handleConfirmLastMileDispatch}
        actionLoading={actionLoading}
      />
    </div>
  )
}
