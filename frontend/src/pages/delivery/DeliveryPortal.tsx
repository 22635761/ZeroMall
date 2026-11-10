import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import type { ReturnData } from '../../services/return.service'

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
import { AdminPortalLayout } from '../../components/delivery/admin/AdminPortalLayout'

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

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [returns, setReturns] = useState<ReturnData[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [hubs, setHubs] = useState<Hub[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [shipmentsRes, driversRes, hubsRes, returnsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/delivery/shipments`),
        fetch(`${API_BASE_URL}/delivery/drivers`),
        fetch(`${API_BASE_URL}/delivery/hubs`),
        fetch(`${API_BASE_URL}/delivery/returns`),
      ])

      if (shipmentsRes.ok) setShipments(await shipmentsRes.json())
      if (driversRes.ok) setDrivers(await driversRes.json())
      if (hubsRes.ok) setHubs(await hubsRes.json())
      if (returnsRes.ok) setReturns(await returnsRes.json())
    } catch (e) {
      console.error('Error loading logistics database:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleUpdateStatus = async (
    shipmentId: string,
    status: string,
    failureReason?: string,
    proofImage?: string,
    hubId?: string,
    note?: string,
    linehaulData?: {
      truckNumber?: string
      truckDriver?: string
      truckDriverPhone?: string
      sealNumber?: string
      targetHubId?: string
    }
  ) => {
    setActionLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          failureReason,
          proofImage,
          hubId,
          note,
          ...(linehaulData || {}),
        }),
      })
      if (res.ok) {
        alert('Cập nhật trạng thái bưu kiện thành công!')
        await fetchAllData()
        if (selectedShipment && selectedShipment.id === shipmentId) {
          const updated = await res.json()
          setSelectedShipment(updated)
        }
      }
    } catch (e) {
      console.error(e)
      alert('Lỗi cập nhật chặng vận chuyển')
    } finally {
      setActionLoading(false)
    }
  }

  // If not logged in as delivery staff/driver, show login form
  if (!currentUser) {
    return <DeliveryAuthForm onAuthSuccess={handleLoginSuccess} onBackToHome={onBackToHome || (() => {})} />
  }

  const isDriver = currentUser.role === 'DRIVER'

  // Tìm Driver profile tương ứng trong CSDL
  const currentDriver = drivers.find((d) => (d as any).userId === currentUser.id || d.phone === currentUser.phoneNumber)

  // Bộ lọc dữ liệu theo Tab & Vai trò (DRIVER chỉ thấy đơn của mình và các đơn tại Hub của mình, OPERATOR/ADMIN thấy toàn sàn)
  const roleBaseShipments = isDriver
    ? shipments.filter((s) => {
        if (s.status === 'CANCELLED') return false
        return (
          // 1. Đơn đã gán cho tài xế này
          s.assignments?.some((a) => 
            (a.driver?.phone === currentUser.phoneNumber || 
            (currentDriver && (a.driver?.phone === currentDriver.phone || (a as any).driverId === currentDriver.id))) &&
            a.status !== 'CANCELLED'
          ) ||
          // 2. Đơn tại bưu cục đích của tài xế này (chờ quét nhận đi giao)
          (currentDriver && ['AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED', 'IN_TRANSIT'].includes(s.status) && (s.currentHubId === currentDriver.hubId || !s.currentHubId)) ||
          // 3. Đơn cần lấy hàng thuộc bưu cục của tài xế này
          (currentDriver && ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status) && (s.currentHubId === currentDriver.hubId || !s.currentHubId))
        )
      })
    : shipments

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
    const email = (currentUser?.email || '').toLowerCase()
    const assignedHub = email.includes('bienhoa')
      ? hubs.find((h) => h.code === 'DN01') || hubs[0]
      : email.includes('melinh')
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
                  Nhân viên kho: <b>{currentUser?.name || currentUser?.email || 'Nhân viên'}</b> ({currentUser?.email || ''})
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
            hubs={hubs}
            drivers={drivers}
            shipments={shipments}
            returns={returns}
            onRefresh={fetchAllData}
            onUpdateStatus={(shipmentId, status, failureReason, hubId, note, linehaulData) =>
              handleUpdateStatus(shipmentId, status, failureReason, undefined, hubId, note, linehaulData)
            }
            actionLoading={actionLoading}
            assignedHubId={assignedHub?.id}
          />
        </main>

        <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 font-medium">
          © 2026 ZeroExpress (ZMX) Logistics • Trạm Khai Thác & Phân Loại Bưu Cục {assignedHub?.name}
        </footer>
      </div>
    )
  }

  // 3. NẾU LÀ ĐIỀU PHỐI VIÊN CẤP CAO / ADMIN (LOGISTICS_OPERATOR / ADMIN) -> HIỂN THỊ CỔNG THÁP ĐIỀU HÀNH CHUYÊN NGHIỆP SPX CONTROL TOWER
  return (
    <AdminPortalLayout
      currentUser={currentUser}
      shipments={shipments as any}
      hubs={hubs as any}
      drivers={drivers as any}
      loading={loading}
      onRefresh={fetchAllData}
      onLogout={handleDeliveryLogout}
      onBackToHome={onBackToHome}
      onUpdateStatus={handleUpdateStatus}
    />
  )
}
