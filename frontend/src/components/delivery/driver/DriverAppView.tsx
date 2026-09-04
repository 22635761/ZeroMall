import React, { useState } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

// Child components
import { DriverBottomNav } from './DriverBottomNav'
import { DriverHomeTab } from './DriverHomeTab'
import { DriverOrdersTab } from './DriverOrdersTab'
import { DriverScanTab } from './DriverScanTab'
import { DriverWalletTab } from './DriverWalletTab'
import { DriverAccountTab } from './DriverAccountTab'
import { DriverDeliveryFailModal } from './DriverDeliveryFailModal'

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
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string) => Promise<void>
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

  // ── Online / Offline toggle ──
  const [driverState, setDriverState] = useState<'ONLINE' | 'OFFLINE'>(() =>
    driverProfile?.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'
  )

  const toggleOnlineStatus = async () => {
    const next = driverState === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    setDriverState(next)
    if (driverProfile?.id) {
      try {
        await fetch(`${API_BASE_URL}/delivery/drivers/${driverProfile.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE' }),
        })
      } catch (e) {
        console.error(e)
      }
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

  // Đơn đã quét xuất kho, đang trên xe đi giao (Last-Mile)
  const deliveryTasks = myShipments.filter(
    (s) =>
      s.status === 'OUT_FOR_DELIVERY' &&
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

  // Badge cho tab Đơn Hàng
  const ordersBadge = pickupTasks.length + deliveryTasks.length

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
              <h3 className="font-bold text-sm leading-tight">{currentUser?.name || 'Tài Xế ZMX'}</h3>
              <p className="text-[10px] text-emerald-100 font-medium">
                {driverProfile?.vehicleNumber || ''} • {driverProfile?.hub?.name || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition cursor-pointer"
                title="Về sàn mua sắm"
              >
                🛍️
              </button>
            )}
            <button
              onClick={onRefresh}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs transition cursor-pointer"
              title="Làm mới"
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
            />
          )}

          {activeTab === 'ORDERS' && (
            <DriverOrdersTab
              pickupTasks={pickupTasks}
              deliveryTasks={deliveryTasks}
              onUpdateStatus={onUpdateStatus}
              actionLoading={actionLoading}
              onShowFailModal={(s) => setFailModal({ id: s.id, trackingNumber: s.trackingNumber })}
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
    </div>
  )
}
