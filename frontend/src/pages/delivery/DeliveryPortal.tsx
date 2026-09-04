import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface TrackingLog {
  id: string
  status: string
  title: string
  description: string
  location?: string
  timestamp: string
}

interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  sellerId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  declaredValue: number
  codAmount: number
  shippingFee: number
  status: string
  createdAt: string
  currentHubId?: string
  currentHub?: { id?: string; name: string; code: string }
  package?: {
    weight: number
    itemsSummary?: string
    fragile: boolean
    liquid: boolean
  }
  assignments?: Array<{
    id: string
    type: string
    status: string
    driver: { name: string; phone: string; vehicleNumber: string }
  }>
  trackingLogs: TrackingLog[]
}

interface Driver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  vehicleType: string
  status: string
  hubId?: string
  hub?: { id?: string; name: string; code?: string }
}

interface Hub {
  id: string
  code: string
  name: string
  type: string
  address: string
  province: string
  district: string
}

import { DeliveryAuthForm } from '../../components/delivery/DeliveryAuthForm'
import { DriverAppView } from '../../components/delivery/driver/DriverAppView'
import { HubOperatorStation } from '../../components/delivery/HubOperatorStation'
import { LiveMapTracking } from '../../components/delivery/LiveMapTracking'

interface DeliveryPortalProps {
  user?: any
  token?: string | null
  onAuthSuccess?: (user: any, token: string) => void
  onLogout?: () => void
  onBackToHome?: () => void
}

export const DeliveryPortal: React.FC<DeliveryPortalProps> = ({
  user: initialUser,
  token: initialToken,
  onAuthSuccess,
  onLogout,
  onBackToHome
}) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (initialUser) return initialUser
    const saved = localStorage.getItem('delivery_user')
    return saved ? JSON.parse(saved) : null
  })
  const [_token, setToken] = useState<string | null>(() => {
    return initialToken || localStorage.getItem('delivery_token') || null
  })

  const handleLoginSuccess = (usr: any, tok: string) => {
    setCurrentUser(usr)
    setToken(tok)
    localStorage.setItem('delivery_user', JSON.stringify(usr))
    localStorage.setItem('delivery_token', tok)
    if (onAuthSuccess) onAuthSuccess(usr, tok)
  }

  const handleDeliveryLogout = () => {
    setCurrentUser(null)
    setToken(null)
    localStorage.removeItem('delivery_user')
    localStorage.removeItem('delivery_token')
    if (onLogout) onLogout()
  }

  // Navigation Tabs: Đơn cần lấy, Đơn tại kho, Tuyến giao khách, Quản lý COD, Trạm Hub & Tài xế
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY_TASKS' | 'PICKUP' | 'HUB' | 'DELIVERY' | 'COD' | 'HUBS_DRIVERS'>('ALL')
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [hubs, setHubs] = useState<Hub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [assignModalShipment, setAssignModalShipment] = useState<Shipment | null>(null)
  const [assignType, setAssignType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Failed modal state
  const [failModalShipment, setFailModalShipment] = useState<Shipment | null>(null)
  const [failReason, setFailReason] = useState('Khách không nghe máy (gọi 3 cuộc)')

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [shipmentsRes, driversRes, hubsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/delivery/shipments`),
        fetch(`${API_BASE_URL}/delivery/drivers`),
        fetch(`${API_BASE_URL}/delivery/hubs`),
      ])

      if (shipmentsRes.ok) setShipments(await shipmentsRes.json())
      if (driversRes.ok) setDrivers(await driversRes.json())
      if (hubsRes.ok) setHubs(await hubsRes.json())
    } catch (e) {
      console.error('Error loading logistics database:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleUpdateStatus = async (shipmentId: string, status: string, failureReason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          failureReason,
        }),
      })
      if (res.ok) {
        alert('Cập nhật trạng thái bưu kiện thành công!')
        await fetchAllData()
        if (selectedShipment && selectedShipment.id === shipmentId) {
          const updated = await res.json()
          setSelectedShipment(updated)
        }
        setFailModalShipment(null)
      }
    } catch (e) {
      console.error(e)
      alert('Lỗi cập nhật chặng vận chuyển')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignDriver = async () => {
    if (!assignModalShipment || !selectedDriverId) return
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/shipments/${assignModalShipment.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriverId,
          type: assignType,
        }),
      })
      if (res.ok) {
        alert(`Đã phân công tài xế ${assignType === 'PICKUP' ? 'lấy hàng' : 'giao hàng'} thành công!`)
        await fetchAllData()
        setAssignModalShipment(null)
      }
    } catch (e) {
      console.error(e)
      alert('Lỗi phân công tài xế')
    } finally {
      setActionLoading(false)
    }
  }

  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  // If not logged in as delivery staff/driver, show login form
  if (!currentUser) {
    return <DeliveryAuthForm onAuthSuccess={handleLoginSuccess} onBackToHome={onBackToHome || (() => {})} />
  }

  const isDriver = currentUser.role === 'DRIVER'

  // Tìm Driver profile tương ứng trong CSDL
  const currentDriver = drivers.find((d) => (d as any).userId === currentUser.id || d.phone === currentUser.phoneNumber)

  // Bộ lọc dữ liệu theo Tab & Vai trò (DRIVER chỉ thấy đơn của mình và các đơn tại Hub của mình, OPERATOR/ADMIN thấy toàn sàn)
  const roleBaseShipments = isDriver
    ? shipments.filter((s) => 
        // 1. Đơn đã gán cho tài xế này
        s.assignments?.some((a) => 
          a.driver?.phone === currentUser.phoneNumber || 
          (currentDriver && (a.driver?.phone === currentDriver.phone || (a as any).driverId === currentDriver.id))
        ) ||
        // 2. Đơn tại bưu cục đích của tài xế này (chờ quét nhận đi giao)
        (currentDriver && ['AT_DESTINATION_HUB', 'IN_TRANSIT'].includes(s.status) && (s.currentHubId === currentDriver.hubId || !s.currentHubId)) ||
        // 3. Đơn cần lấy hàng thuộc bưu cục của tài xế này
        (currentDriver && ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status) && (s.currentHubId === currentDriver.hubId || !s.currentHubId))
      )
    : shipments

  const filteredShipments = roleBaseShipments.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(q) ||
      s.orderId.toLowerCase().includes(q) ||
      (s.buyerName && s.buyerName.toLowerCase().includes(q)) ||
      (s.buyerPhone && s.buyerPhone.includes(q)) ||
      (s.deliveryAddress && s.deliveryAddress.toLowerCase().includes(q))

    if (!matchesSearch) return false

    if (activeTab === 'PICKUP') {
      return ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED', 'PICKING_UP'].includes(s.status)
    }
    if (activeTab === 'HUB') {
      return ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(s.status)
    }
    if (activeTab === 'DELIVERY') {
      return ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'RETURNING'].includes(s.status)
    }
    if (activeTab === 'COD') {
      return s.codAmount > 0
    }
    return true
  })

  // Thống kê số liệu thật từ CSDL cho Điều Phối Viên
  const stats = {
    total: shipments.length,
    pickup: shipments.filter((s) => ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status)).length,
    hub: shipments.filter((s) => ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(s.status)).length,
    delivering: shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    failed: shipments.filter((s) => s.status === 'DELIVERY_FAILED' || s.status === 'RETURNING').length,
    totalCod: shipments.filter((s) => s.status === 'DELIVERED').reduce((acc, cur) => acc + (cur.codAmount || 0), 0),
    pendingCod: shipments.filter((s) => s.status !== 'DELIVERED').reduce((acc, cur) => acc + (cur.codAmount || 0), 0),
  }

  // 1. NẾU LÀ TÀI XẾ (DRIVER) -> HIỂN THỊ TRỰC TIẾP APP TÀI XẾ MOBILE
  if (currentUser.role === 'DRIVER') {
    return (
      <DriverAppView
        currentUser={currentUser}
        driverProfile={currentDriver}
        shipments={roleBaseShipments}
        onRefresh={fetchAllData}
        onUpdateStatus={handleUpdateStatus}
        actionLoading={actionLoading}
        onLogout={handleDeliveryLogout}
        onBackToHome={onBackToHome}
      />
    )
  }

  // 2. NẾU LÀ NHÂN VIÊN KHO (HUB_OPERATOR) -> HIỂN THỊ TRẠM PHÂN LOẠI & MÁY QUÉT CỦA BƯU CỤC ĐÓ
  if (currentUser.role === 'HUB_OPERATOR') {
    // Tự động tìm Hub phù hợp theo email/tên nhân viên
    const assignedHub = currentUser.email.includes('bienhoa')
      ? hubs.find((h) => h.code === 'DN01') || hubs[0]
      : currentUser.email.includes('melinh')
      ? hubs.find((h) => h.code === 'HN01') || hubs[0]
      : hubs.find((h) => h.code === 'HCM01') || hubs[0]

    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between text-left">
        <header className="bg-slate-900 text-white py-3.5 px-6 sm:px-12 sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-xs font-black">
                🏭
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black tracking-tight text-white">
                    ZMX <span className="text-sky-400">Hub Station</span>
                  </span>
                  <span className="text-[10px] font-black text-sky-300 bg-sky-950 border border-sky-600 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    {assignedHub?.name || 'Bưu Cục Khai Thác'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Nhân viên kho: <b>{currentUser.name}</b> ({currentUser.email})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchAllData()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔄</span> Làm Mới
              </button>
              <button
                onClick={handleDeliveryLogout}
                className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                🚪 Đăng Xuất
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <HubOperatorStation
            currentUser={currentUser}
            hubs={assignedHub ? [assignedHub, ...hubs.filter(h => h.id !== assignedHub.id)] : hubs}
            shipments={shipments}
            onRefresh={fetchAllData}
            onUpdateStatus={handleUpdateStatus}
            actionLoading={actionLoading}
          />
        </main>

        <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 font-medium">
          © 2026 ZeroExpress (ZMX) Logistics • Trạm Khai Thác & Phân Loại Bưu Cục {assignedHub?.name}
        </footer>
      </div>
    )
  }

  // 3. NẾU LÀ ĐIỀU PHỐI VIÊN CẤP CAO / ADMIN (LOGISTICS_OPERATOR / ADMIN) -> HIỂN THỊ CỔNG QUẢN TRỊ TOÀN SÀN
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between text-left">
      
      {/* 1. Header Bar: Tone Màu Trắng & Xanh Emerald Chuẩn ZeroMall */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sm:px-12 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl shadow-xs font-black">
              🚚
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Zero<span className="text-emerald-600">Express</span>
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {currentUser.role === 'DRIVER' ? '📱 App Tài Xế Giao Hàng' : '🏢 Cổng Điều Phối & Quản Trị Hub'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Xin chào, <b>{currentUser.name}</b> ({currentUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAllData()}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <span>🔄</span> Làm Mới
            </button>
            <button
              onClick={handleDeliveryLogout}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              🚪 Đăng Xuất
            </button>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
              >
                🛍️ Sàn Mua Sắm
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>📦</span> Chờ Lấy Hàng
            </span>
            <p className="text-2xl font-black text-amber-600">{stats.pickup}</p>
            <p className="text-[10px] text-slate-400">Đơn Shop vừa đóng gói</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>🏢</span> Trong Kho SOC / Hub
            </span>
            <p className="text-2xl font-black text-sky-600">{stats.hub}</p>
            <p className="text-[10px] text-slate-400">Đang phân loại & luân chuyển</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>🛵</span> Đang Giao Khách
            </span>
            <p className="text-2xl font-black text-orange-600">{stats.delivering}</p>
            <p className="text-[10px] text-slate-400">Shipper đang trên đường giao</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>✅</span> Giao Thành Công
            </span>
            <p className="text-2xl font-black text-emerald-600">{stats.delivered}</p>
            <p className="text-[10px] text-slate-400">Đã phát tận tay người nhận</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <span>💰</span> COD Đã Thu Thực Tế
            </span>
            <p className="text-2xl font-black text-emerald-700">{formatMoney(stats.totalCod)}</p>
            <p className="text-[10px] text-slate-400">Chờ đối soát về Shop: {formatMoney(stats.pendingCod)}</p>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {isDriver ? (
                [
                  { id: 'ALL', label: `Tất Cả Tuyến Giao (${stats.total})` },
                  { id: 'PICKUP', label: `📦 Đơn Cần Đi Lấy Tại Shop (${stats.pickup})` },
                  { id: 'DELIVERY', label: `🛵 Đơn Đang Phát Khách (${stats.delivering})` },
                  { id: 'COD', label: `💵 Ví Thu Hộ COD Của Tôi` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              ) : (
                [
                  { id: 'ALL', label: `Tất Cả Vận Đơn (${stats.total})` },
                  { id: 'PICKUP', label: `📦 Tuyến Lấy Hàng (${stats.pickup})` },
                  { id: 'HUB', label: `🏢 Quản Lý Hub (${stats.hub})` },
                  { id: 'DELIVERY', label: `🛵 Tuyến Giao Hàng (${stats.delivering})` },
                  { id: 'COD', label: `💵 Đối Soát COD` },
                  { id: 'HUBS_DRIVERS', label: `📍 Trạm Hubs & Shipper (${hubs.length}/${drivers.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))
              )}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã ZMX, mã đơn, tên khách, SĐT..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition"
              />
            </div>
          </div>

          {/* VIEW 0: TRẠM PHÂN LOẠI & KHAI THÁC KHO (HUB OPERATOR WORKSTATION) */}
          {activeTab === 'HUB' ? (
            <HubOperatorStation
              currentUser={currentUser}
              hubs={hubs}
              shipments={shipments}
              onRefresh={fetchAllData}
              onUpdateStatus={handleUpdateStatus}
              actionLoading={actionLoading}
            />
          ) : activeTab === 'HUBS_DRIVERS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Danh sách Hub */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <span>🏢</span> Mạng Lưới Trạm Khai Thác & Hub Vận Tải ({hubs.length} Hubs)
                </h3>
                <div className="space-y-2.5">
                  {hubs.map((hub) => (
                    <div key={hub.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-1 text-xs shadow-3xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-700 text-sm">{hub.code} - {hub.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{hub.type}</span>
                      </div>
                      <p className="text-slate-600 text-xs">{hub.address}</p>
                      <p className="text-[11px] text-slate-400 font-medium">Khu vực: {hub.district}, {hub.province}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danh sách Tài Xế */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                  <span>🛵</span> Đội Ngũ Tài Xế & Shipper ({drivers.length} Tài Xế)
                </h3>
                <div className="space-y-2.5">
                  {drivers.map((d) => (
                    <div key={d.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex justify-between items-center text-xs shadow-3xs">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{d.name}</span>
                          <span className="text-slate-500 font-normal text-xs">({d.phone})</span>
                        </p>
                        <p className="text-slate-500 text-xs">Biển số: <b className="text-slate-700">{d.vehicleNumber}</b> ({d.vehicleType})</p>
                        <p className="text-[11px] text-emerald-600 font-medium">Trực thuộc: {d.hub?.name || 'Kho Tân Bình SOC'}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
                        {d.status === 'AVAILABLE' ? 'Sẵn Sàng' : d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: BẢNG DANH SÁCH VẬN ĐƠN (LẤY DỮ LIỆU THẬT 100% TỪ DATABASE) */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Vận Đơn ZMX</th>
                    <th className="py-3 px-4">Khách Hàng / Điểm Nhận</th>
                    <th className="py-3 px-4">Kiện Hàng / COD</th>
                    <th className="py-3 px-4">Trạng Thái & Shipper</th>
                    <th className="py-3 px-4 text-right">Điều Phối Chuyển Chặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                        Đang truy vấn dữ liệu vận đơn từ PostgreSQL...
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                        Không tìm thấy vận đơn nào phù hợp trong danh mục này.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => {
                      const latestAssignment = s.assignments && s.assignments[0]
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          {/* Mã vận đơn & Mã đơn hàng */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 space-y-0.5">
                            <div className="text-sm">{s.trackingNumber}</div>
                            <div className="text-[11px] text-slate-400 font-normal font-sans">
                              Đơn: #{s.orderId}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal font-sans">
                              {new Date(s.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </td>

                          {/* Người nhận & Địa chỉ */}
                          <td className="py-3.5 px-4 space-y-0.5 max-w-xs">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{s.buyerName}</span>
                              <span className="text-slate-500 font-normal text-xs">({s.buyerPhone})</span>
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {s.deliveryAddress}
                            </div>
                          </td>

                          {/* Kiện hàng & COD */}
                          <td className="py-3.5 px-4 space-y-0.5">
                            <div className="text-slate-800 font-semibold line-clamp-1">
                              {s.package?.itemsSummary || 'Sản phẩm ZeroMall'}
                            </div>
                            <div className="text-xs text-slate-500">
                              Trọng lượng: {s.package?.weight || 0.5}kg
                            </div>
                            <div className="text-xs font-bold text-emerald-600">
                              {s.codAmount > 0 ? `Thu COD: ${formatMoney(s.codAmount)}` : 'Đã thanh toán trước'}
                            </div>
                          </td>

                          {/* Trạng thái vận đơn */}
                          <td className="py-3.5 px-4 space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              s.status.includes('PICK') ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              s.status.includes('HUB') || s.status.includes('SORT') ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                              s.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              s.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' :
                              s.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {s.status === 'CREATED' && 'Mới Tạo'}
                              {s.status === 'WAITING_PICKUP' && 'Chờ Lấy Hàng'}
                              {s.status === 'PICKUP_ASSIGNED' && 'Đã Gán Lấy Hàng'}
                              {s.status === 'PICKED_UP' && 'Đã Lấy Hàng'}
                              {s.status === 'AT_ORIGIN_HUB' && 'Tại Kho Xuất Phát'}
                              {s.status === 'SORTING' && 'Đang Phân Loại'}
                              {s.status === 'IN_TRANSIT' && 'Đang Trung Chuyển'}
                              {s.status === 'AT_DESTINATION_HUB' && 'Đã Đến Kho Phát'}
                              {s.status === 'OUT_FOR_DELIVERY' && 'Đang Giao Hàng'}
                              {s.status === 'DELIVERED' && 'Giao Thành Công'}
                              {s.status === 'DELIVERY_FAILED' && 'Giao Thất Bại'}
                            </span>
                            {latestAssignment && (
                              <div className="text-[11px] text-slate-500">
                                🛵 Shipper: <b>{latestAssignment.driver.name}</b> ({latestAssignment.driver.vehicleNumber})
                              </div>
                            )}
                          </td>

                          {/* Thao tác chuyển chặng */}
                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedShipment(s)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                            >
                              📜 Timeline
                            </button>

                            {/* Gán tài xế lấy hàng */}
                            {(s.status === 'CREATED' || s.status === 'WAITING_PICKUP') && (
                              <button
                                onClick={() => { setAssignModalShipment(s); setAssignType('PICKUP'); setSelectedDriverId(drivers[0]?.id || ''); }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Gán Shipper Lấy
                              </button>
                            )}

                            {/* Shipper xác nhận lấy hàng */}
                            {s.status === 'PICKUP_ASSIGNED' && (
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'PICKED_UP')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Đã Lấy Hàng
                              </button>
                            )}

                            {/* Nhập kho & phân loại */}
                            {s.status === 'PICKED_UP' && (
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'AT_ORIGIN_HUB')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Nhập Kho SOC
                              </button>
                            )}

                            {s.status === 'AT_ORIGIN_HUB' && (
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'SORTING')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Quét & Phân Loại
                              </button>
                            )}

                            {s.status === 'SORTING' && (
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'IN_TRANSIT')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Xe Trung Chuyển
                              </button>
                            )}

                            {s.status === 'IN_TRANSIT' && (
                              <button
                                onClick={() => handleUpdateStatus(s.id, 'AT_DESTINATION_HUB')}
                                disabled={actionLoading}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Đến Bưu Cục Phát
                              </button>
                            )}

                            {/* Gán tài xế giao */}
                            {s.status === 'AT_DESTINATION_HUB' && (
                              <button
                                onClick={() => { setAssignModalShipment(s); setAssignType('DELIVERY'); setSelectedDriverId(drivers[1]?.id || drivers[0]?.id || ''); }}
                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                              >
                                Gán Shipper Giao
                              </button>
                            )}

                            {/* Giao hàng & Thu COD */}
                            {s.status === 'OUT_FOR_DELIVERY' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(s.id, 'DELIVERED')}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                                >
                                  ✅ Giao Xong & Thu COD
                                </button>
                                <button
                                  onClick={() => setFailModalShipment(s)}
                                  disabled={actionLoading}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                                >
                                  ❌ Thất Bại
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* 3. MODAL: PHÂN CÔNG TÀI XẾ (DRIVER ASSIGNMENT) */}
      {assignModalShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>🛵</span> Phân Công Tài Xế ({assignType === 'PICKUP' ? 'Lấy Hàng Tại Shop' : 'Giao Tận Tay Khách'})
            </h3>
            <p className="text-xs text-slate-500">
              Vận đơn: <b className="text-emerald-700">{assignModalShipment.trackingNumber}</b> (Đơn #{assignModalShipment.orderId})
            </p>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn Tài Xế Trực Thuộc Tuyến:</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone} - {d.vehicleNumber}) - {d.hub?.name || 'Kho Tân Bình SOC'}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setAssignModalShipment(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={actionLoading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-3xs cursor-pointer"
              >
                {actionLoading ? 'Đang phân công...' : 'Xác Nhận Phân Công'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: GIAO THẤT BẠI (DELIVERY ATTEMPTS) */}
      {failModalShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>❌</span> Ghi Nhận Giao Hàng Thất Bại
            </h3>
            <p className="text-xs text-slate-500">
              Vận đơn: <b className="text-emerald-700">{failModalShipment.trackingNumber}</b>
            </p>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Lý Do Giao Thất Bại:</label>
              {[
                'Khách không nghe máy (gọi 3 cuộc)',
                'Khách hẹn giao lại vào ngày mai',
                'Địa chỉ giao hàng không chính xác',
                'Khách từ chối nhận hàng (không đồng kiểm)',
                'Khách đổi ý không mua nữa',
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs cursor-pointer border border-slate-200 hover:border-emerald-600">
                  <input
                    type="radio"
                    name="failReason"
                    value={reason}
                    checked={failReason === reason}
                    onChange={(e) => setFailReason(e.target.value)}
                    className="accent-emerald-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setFailModalShipment(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => handleUpdateStatus(failModalShipment.id, 'DELIVERY_FAILED', failReason)}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-3xs cursor-pointer"
              >
                Lưu Thất Bại & Chuyển Hoàn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: TIMELINE TRACKING */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <span>🚚</span> Hành Trình Vận Đơn {selectedShipment.trackingNumber}
                </h3>
                <p className="text-[11px] text-slate-400">Đơn hàng ZeroMall: #{selectedShipment.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* 🗺️ BẢN ĐỒ HÀNH TRÌNH TƯƠNG TÁC GOONG MAP / OSM LIVE */}
            <LiveMapTracking
              trackingData={selectedShipment}
              goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
            />

            {/* Stepper Status Box */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-950">Trạng Thái:</span>
                <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                  {selectedShipment.status}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">Người nhận: <b>{selectedShipment.buyerName}</b> ({selectedShipment.buyerPhone})</p>
              <p className="text-slate-600 text-[11px]">Địa chỉ: {selectedShipment.deliveryAddress}</p>
            </div>

            {/* Timeline Milestones */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {selectedShipment.trackingLogs.map((log, index) => (
                <div key={log.id || index} className="flex gap-3 relative text-xs">
                  {index !== selectedShipment.trackingLogs.length - 1 && (
                    <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200"></div>
                  )}

                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] font-bold ${
                    index === 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index === 0 ? '●' : '○'}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-bold ${index === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{log.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-normal leading-relaxed">{log.description}</p>
                    {log.location && (
                      <p className="text-[10px] text-slate-400 font-medium">📍 {log.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-500 font-medium">
        © 2026 ZeroExpress (ZMX Logistics) Platform • Nền tảng điều phối vận tải TMĐT chuyên nghiệp chuẩn ZeroMall
      </footer>
    </div>
  )
}
