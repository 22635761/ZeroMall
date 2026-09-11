import React, { useState, useMemo } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LinehaulDispatchModal, type LinehaulDispatchData, type LinehaulShipment } from './LinehaulDispatchModal'
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
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false)

  // State cho Modal Đóng Xe Tải Linehaul & Niêm Phong Seal (Tab 2)
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false)
  const [modalShipments, setModalShipments] = useState<LinehaulShipment[]>([])
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<string>>(new Set())

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

  // Xử lý xác nhận niêm phong & xuất xe từ Modal
  const handleConfirmLinehaulDispatch = async (data: LinehaulDispatchData) => {
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
    setIsDispatchModalOpen(false)
    setModalShipments([])
    setSelectedShipmentIds(new Set())
    setScanMessage({
      type: 'success',
      text: `🚚 Đã xuất bến thành công ${data.shipmentIds.length} kiện lên Xe tải [${data.truckNumber}] (Seal: ${data.sealNumber}) đi ${data.targetHubName}!`,
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
      placeholder: 'Quét mã vận đơn để MỞ PHIÊN ĐÓNG XE TẢI LINEHAUL...',
      buttonLabel: '🚛 Quét & Đóng Xe',
      buttonColor: 'bg-sky-600 hover:bg-sky-500',
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
        // Mở Modal đóng xe cho kiện hàng vừa quét
        handleOpenDispatchSingle(targetShipment)
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
              : 'bg-rose-50 border border-rose-300 text-rose-700'
          }`}>
            {scanMessage.text}
          </div>
        )}
      </div>

      {/* ====== SECTION 4: PARCEL TABLE ====== */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
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

                        {stationTab === 'SORTING_LINEHAUL' && (
                          <button
                            onClick={() => handleOpenDispatchSingle(s)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-sm disabled:opacity-40 flex items-center gap-1 ml-auto"
                          >
                            <span>🚛</span> Đóng Xe Tải
                          </button>
                        )}

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
        actionLoading={actionLoading}
      />

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
