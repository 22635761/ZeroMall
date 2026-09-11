import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

// Child components
import { DriverBottomNav } from './DriverBottomNav'
import { DriverHomeTab } from './DriverHomeTab'
import { DriverOrdersTab } from './DriverOrdersTab'
import { DriverScanTab } from './DriverScanTab'
import { DriverWalletTab } from './DriverWalletTab'
import { DriverAccountTab } from './DriverAccountTab'
import { DriverDeliveryFailModal } from './DriverDeliveryFailModal'
import { DriverCheckInModal } from './DriverCheckInModal'

// Re-export Shipment type for external consumers
export type { Shipment } from './DriverOrdersTab'

/* ──────────────────────────────────────────────
 * Shared types
 * ──────────────────────────────────────────────*/
export interface DriverAppViewProps {
  currentUser: any
  driverProfile: any
  shipments: Array<{
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
    currentHub?: { name: string }
    package?: { weight: number; itemsSummary?: string }
    assignments?: Array<{
      id: string
      type: string
      status: string
      driverId?: string
      driver?: {
        id?: string
        name?: string
        phone?: string
        vehicleNumber?: string
      }
    }>
    trackingLogs: Array<{ status: string; title: string; description: string; timestamp: string }>
  }>
  onRefresh: () => void
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string, proofImage?: string) => Promise<void>
  actionLoading: boolean
  onLogout: () => void
  onBackToHome?: () => void
}

type TabKey = 'HOME' | 'ORDERS' | 'SCAN' | 'WALLET' | 'ACCOUNT'

/* ──────────────────────────────────────────────
 * DriverAppView — Orchestrator chính
 * Chỉ quản lý state, phân luồng tab,
 * và compose các child component.
 * ──────────────────────────────────────────────*/
export const DriverAppView: React.FC<DriverAppViewProps> = ({
  currentUser,
  driverProfile,
  shipments,
  onRefresh,
  onUpdateStatus,
  actionLoading,
  onLogout,
  onBackToHome,
}) => {
  // ── Navigation state ──
  const [activeTab, setActiveTab] = useState<TabKey>('HOME')

  // ── Online / Offline state & Attendance ──
  const [driverState, setDriverState] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE')
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [attendanceToday, setAttendanceToday] = useState<any>(null)

  // Kiểm tra trạng thái điểm danh hôm nay từ backend
  const fetchAttendance = async () => {
    if (!driverProfile?.id) return
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/drivers/${driverProfile.id}/attendance-today`)
      if (res.ok) {
        const data = await res.json()
        setAttendanceToday(data.attendance)
        setDriverState(data.isCheckedIn ? 'ONLINE' : 'OFFLINE')
      }
    } catch (e) {
      console.error('Fetch attendance error:', e)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [driverProfile?.id])

  const toggleOnlineStatus = () => {
    if (driverState === 'OFFLINE') {
      setShowCheckInModal(true)
    } else {
      handleCheckOut()
    }
  }

  // Kết thúc ca làm việc
  const handleCheckOut = async () => {
    if (!driverProfile?.id) return
    if (!window.confirm('Bạn có chắc chắn muốn kết thúc ca làm việc hôm nay? Trạng thái sẽ chuyển về OFFLINE (Tạm nghỉ).')) return
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/drivers/${driverProfile.id}/check-out`, {
        method: 'POST',
      })
      if (res.ok) {
        setDriverState('OFFLINE')
        setAttendanceToday(null)
        onRefresh()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Điểm danh thành công
  const handleCheckInSuccess = (data: any) => {
    setDriverState('ONLINE')
    setAttendanceToday(data.attendance)
    onRefresh()
  }

  // Quét thủ công hàng đợi bưu cục
  const handleDrainQueue = async () => {
    if (!driverProfile?.id) return
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/drivers/${driverProfile.id}/drain-queue`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        alert(`Đã kiểm tra hàng đợi bưu cục: Đã phân công ${data.length || 0} đơn mới cho bạn.`)
        onRefresh()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // ── Delivery fail modal ──
  const [failModal, setFailModal] = useState<{ id: string; trackingNumber: string } | null>(null)

  // ── Phân loại đơn hàng theo trạng thái chuẩn SPX ──
  const myShipments = shipments.filter((s) =>
    s.assignments?.some(
      (a) =>
        a.driver?.phone === driverProfile?.phone ||
        a.driver?.phone === currentUser.phoneNumber ||
        (driverProfile?.id && (a as any).driverId === driverProfile.id)
    )
  )

  // Đơn cần đi lấy tại Shop (First-Mile)
  const pickupTasks = myShipments.filter((s) =>
    ['WAITING_PICKUP', 'PICKUP_ASSIGNED', 'PICKING_UP'].includes(s.status)
  )

  // Đơn giao hàng Last-Mile: Chờ lấy tại Hub (DELIVERY_ASSIGNED) hoặc Đang trên xe đi giao (OUT_FOR_DELIVERY)
  const deliveryTasks = myShipments.filter(
    (s) =>
      ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'].includes(s.status) &&
      s.assignments?.some((a) => a.type === 'DELIVERY' && ['ASSIGNED', 'IN_PROGRESS', 'ACCEPTED'].includes(a.status))
  )

  // Đơn đã giao thành công
  const completedTasks = myShipments.filter((s) =>
    ['DELIVERED', 'COMPLETED'].includes(s.status)
  )

  // Tổng tiền COD tài xế đang giữ
  const codInWallet = completedTasks.reduce((sum, s) => sum + (s.codAmount || 0), 0)
  // Ước tính thu nhập (15.000đ / cuốc giao)
  const driverEarnings = completedTasks.length * 15000

  // Badge cho tab Đơn Hàng: Khi Offline thì ẩn badge (0) theo chuẩn SPX
  const ordersBadge = driverState === 'OFFLINE' ? 0 : (pickupTasks.length + deliveryTasks.length)

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Mobile Container */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl border-x border-slate-200 relative">

        {/* ── App Header (gọn nhẹ) ── */}
        <div className="bg-emerald-600 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🛵
            </div>
            <div>
              <h2 className="font-bold text-sm leading-tight">{currentUser?.name || 'Tài Xế'}</h2>
              <p className="text-[11px] text-emerald-100 font-mono">
                {driverProfile?.vehicleNumber} • {driverProfile?.hub?.name || 'Khai Thác'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                title="Về Trang Chủ Sàn ZeroMall"
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer text-sm"
              >
                🛍️
              </button>
            )}
            <button
              onClick={onRefresh}
              title="Làm Mới Dữ Liệu"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer text-sm"
            >
              🔄
            </button>
          </div>
        </div>

        {/* ── Main Content (scrollable, trừ bottom nav) ── */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">

          {activeTab === 'HOME' && (
            <DriverHomeTab
              currentUser={currentUser}
              driverProfile={driverProfile}
              pickupCount={pickupTasks.length}
              deliveryCount={deliveryTasks.length}
              completedCount={completedTasks.length}
              codInWallet={codInWallet}
              onToggleOnline={toggleOnlineStatus}
              driverState={driverState}
              onOpenCheckIn={() => setShowCheckInModal(true)}
              onCheckOut={handleCheckOut}
              attendanceToday={attendanceToday}
              onDrainQueue={handleDrainQueue}
            />
          )}

          {activeTab === 'ORDERS' && (
            <DriverOrdersTab
              pickupTasks={pickupTasks}
              deliveryTasks={deliveryTasks}
              onUpdateStatus={onUpdateStatus}
              actionLoading={actionLoading}
              onShowFailModal={(s) => setFailModal({ id: s.id, trackingNumber: s.trackingNumber })}
              isOnline={driverState === 'ONLINE'}
              onOpenCheckIn={() => setShowCheckInModal(true)}
            />
          )}

          {activeTab === 'SCAN' && (
            <DriverScanTab
              currentUser={currentUser}
              driverProfile={driverProfile}
              shipments={shipments}
              onUpdateStatus={onUpdateStatus}
              onRefresh={onRefresh}
              actionLoading={actionLoading}
            />
          )}

          {activeTab === 'WALLET' && (
            <DriverWalletTab
              driverProfile={driverProfile}
              completedTasks={completedTasks.map((s) => ({
                id: s.id,
                trackingNumber: s.trackingNumber,
                buyerName: s.buyerName,
                codAmount: s.codAmount,
              }))}
              codInWallet={codInWallet}
              driverEarnings={driverEarnings}
              onRefresh={onRefresh}
            />
          )}

          {activeTab === 'ACCOUNT' && (
            <DriverAccountTab
              currentUser={currentUser}
              driverProfile={driverProfile}
              completedCount={completedTasks.length}
              totalOrders={myShipments.length}
              onLogout={onLogout}
            />
          )}

        </div>

        {/* ── Bottom Navigation Bar ── */}
        <DriverBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          ordersBadge={ordersBadge > 0 ? ordersBadge : undefined}
        />

      </div>

      {/* ── Modal: Giao Thất Bại ── */}
      {failModal && (
        <DriverDeliveryFailModal
          trackingNumber={failModal.trackingNumber}
          shipmentId={failModal.id}
          onClose={() => setFailModal(null)}
          onSubmit={(shipmentId, reason) => {
            onUpdateStatus(shipmentId, 'DELIVERY_FAILED', reason)
            setFailModal(null)
          }}
          actionLoading={actionLoading}
        />
      )}

      {/* ── Modal: Điểm Danh Ca Sáng (Check-in Camera & GPS) ── */}
      {showCheckInModal && (
        <DriverCheckInModal
          driverProfile={driverProfile}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleCheckInSuccess}
        />
      )}
    </div>
  )
}
