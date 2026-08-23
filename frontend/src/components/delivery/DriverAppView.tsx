import React, { useState } from 'react'

interface Shipment {
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
}

interface DriverAppViewProps {
  currentUser: any
  driverProfile: any
  shipments: Shipment[]
  onRefresh: () => void
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string) => Promise<void>
  actionLoading: boolean
  onLogout: () => void
  onBackToHome?: () => void
}

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
  // Trạng thái tài xế: OFFLINE -> ONLINE / AVAILABLE -> BUSY
  const [driverState, setDriverState] = useState<'ONLINE' | 'OFFLINE'>(() => {
    return driverProfile?.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'
  })
  const [activeTab, setActiveTab] = useState<'PENDING_REQUESTS' | 'PICKUP' | 'HANDOVER' | 'DELIVERY' | 'HISTORY' | 'WALLET'>('PENDING_REQUESTS')
  const [failModalShipment, setFailModalShipment] = useState<Shipment | null>(null)
  const [failReason, setFailReason] = useState('Khách không nghe máy (gọi 3 cuộc)')

  const toggleOnlineStatus = async () => {
    const next = driverState === 'ONLINE' ? 'OFFLINE' : 'ONLINE'
    setDriverState(next)
    if (driverProfile?.id) {
      try {
        await fetch(`http://localhost:8000/delivery/drivers/${driverProfile.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next === 'ONLINE' ? 'AVAILABLE' : 'OFFLINE' }),
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  // Phân loại các đơn gán CHÍNH XÁC cho tài xế hiện tại
  const myShipments = shipments.filter((s) =>
    s.assignments?.some((a) => a.driver?.phone === driverProfile?.phone || a.driver?.phone === currentUser.phoneNumber || (driverProfile?.id && (a as any).driverId === driverProfile.id))
  )

  const pendingRequests = myShipments.filter((s) =>
    s.assignments?.some((a) => a.status === 'ASSIGNED' && (a.driver?.phone === driverProfile?.phone || a.driver?.phone === currentUser.phoneNumber || (driverProfile?.id && (a as any).driverId === driverProfile.id)))
  )

  const pickupTasks = myShipments.filter((s) =>
    ['PICKUP_ASSIGNED', 'PICKING_UP'].includes(s.status)
  )

  const handoverTasks = myShipments.filter((s) =>
    s.status === 'PICKED_UP'
  )

  const deliveryTasks = myShipments.filter((s) =>
    s.status === 'OUT_FOR_DELIVERY' && s.assignments?.some((a) => a.type === 'DELIVERY' && a.status === 'ASSIGNED')
  )

  const completedTasks = myShipments.filter((s) =>
    ['DELIVERED', 'COMPLETED'].includes(s.status)
  )

  // Tổng tiền COD tài xế đang giữ từ các đơn đã giao thành công
  const codInWallet = completedTasks.reduce((sum, s) => sum + (s.codAmount || 0), 0)
  // Ước tính thu nhập của tài xế (15.000đ / cuốc giao)
  const driverEarnings = completedTasks.length * 15000

  const handleRespond = async (assignmentId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch(`http://localhost:8000/delivery/assignments/${assignmentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        alert(action === 'ACCEPT' ? 'Đã nhận đơn giao hàng!' : 'Đã từ chối đơn hàng.')
        onRefresh()
      }
    } catch (e) {
      console.error(e)
      alert('Lỗi phản hồi đơn hàng')
    }
  }

  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Mobile Simulation Container (Shopee Driver App Style) */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col justify-between shadow-2xl border-x border-slate-200">
        
        {/* 1. App Header */}
        <div className="bg-emerald-600 text-white p-4 space-y-3 sticky top-0 z-30 shadow-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-black">
                🛵
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{currentUser?.name || 'Tài Xế ZeroExpress'}</h3>
                <p className="text-[11px] text-emerald-100 font-medium">
                  {driverProfile?.vehicleNumber || '59-A1 123.45'} • {driverProfile?.hub?.name || 'Kho Tân Bình SOC'}
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
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-xs transition cursor-pointer"
                title="Đăng xuất"
              >
                🚪
              </button>
            </div>
          </div>

          {/* Online / Offline Toggle Banner */}
          <div className="bg-emerald-700/80 rounded-2xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${driverState === 'ONLINE' ? 'bg-emerald-300 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{driverState === 'ONLINE' ? 'SẴN SÀNG NHẬN ĐƠN (ONLINE)' : 'TẠM NGHỈ (OFFLINE)'}</span>
            </div>
            <button
              onClick={toggleOnlineStatus}
              className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer shadow-3xs ${
                driverState === 'ONLINE' ? 'bg-white text-emerald-800' : 'bg-emerald-500 text-white'
              }`}
            >
              {driverState === 'ONLINE' ? 'Nghỉ' : 'Bật Online'}
            </button>
          </div>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-medium">Cần Giao</span>
              <p className="text-base font-black text-orange-600">{deliveryTasks.length}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-medium">Đã Giao</span>
              <p className="text-base font-black text-emerald-600">{completedTasks.length}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-medium">Tiền COD</span>
              <p className="text-xs font-black text-emerald-700 mt-1">{formatMoney(codInWallet)}</p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('PENDING_REQUESTS')}
              className={`flex-1 py-2 text-center border-b-2 transition cursor-pointer relative ${
                activeTab === 'PENDING_REQUESTS' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              Yêu Cầu Mới
              {pendingRequests.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PICKUP')}
              className={`flex-1 py-2 text-center border-b-2 transition cursor-pointer ${
                activeTab === 'PICKUP' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              Lấy Hàng ({pickupTasks.length})
            </button>

            <button
              onClick={() => setActiveTab('HANDOVER')}
              className={`flex-1 py-2 text-center border-b-2 transition cursor-pointer relative ${
                activeTab === 'HANDOVER' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              Bàn Giao Kho
              {handoverTasks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full">
                  {handoverTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('DELIVERY')}
              className={`flex-1 py-2 text-center border-b-2 transition cursor-pointer ${
                activeTab === 'DELIVERY' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              Giao Hàng ({deliveryTasks.length})
            </button>

            <button
              onClick={() => setActiveTab('WALLET')}
              className={`flex-1 py-2 text-center border-b-2 transition cursor-pointer ${
                activeTab === 'WALLET' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              Ví COD
            </button>
          </div>

          {/* TAB 1: YÊU CẦU GIAO HÀNG MỚI (RECEIVE DELIVERY REQUEST -> ACCEPT / REJECT) */}
          {activeTab === 'PENDING_REQUESTS' && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <span className="text-4xl">📭</span>
                  <p className="text-xs font-bold">Không có yêu cầu đơn hàng mới nào</p>
                  <p className="text-[11px]">Hệ thống sẽ rung chuông khi Điều phối viên gán đơn cho bạn.</p>
                </div>
              ) : (
                pendingRequests.map((s) => {
                  const assignment = s.assignments?.find((a) => a.status === 'ASSIGNED')
                  const isPickup = assignment?.type === 'PICKUP'
                  const shopName = s.pickupAddress?.name || 'Kho Người Bán'
                  const shopContact = s.pickupAddress?.contactName ? `${s.pickupAddress.contactName} - ${s.pickupAddress.phone}` : (s.pickupAddress?.phone || 'Chủ Shop')
                  const pickupAddressText = s.pickupAddress?.address || 'Địa chỉ kho của Shop'

                  return (
                    <div key={s.id} className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 space-y-3 shadow-md animate-in zoom-in-95 duration-150">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md uppercase">
                          {isPickup ? '📦 NHIỆM VỤ: LẤY HÀNG TẠI SHOP' : '🛵 NHIỆM VỤ: GIAO ĐẾN KHÁCH'}
                        </span>
                        <span className="font-mono text-xs font-black text-slate-900">{s.trackingNumber}</span>
                      </div>

                      {isPickup ? (
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-900 text-sm">🏪 {shopName} ({shopContact})</p>
                          <p className="text-emerald-800 font-semibold text-xs leading-relaxed">📍 Điểm Đến Lấy: {pickupAddressText}</p>
                          <p className="text-[11px] text-slate-500">🏠 Giao đến: {s.buyerName} ({s.deliveryAddress})</p>
                          <p className="text-[11px] text-slate-600">📦 {s.package?.itemsSummary || 'Sản phẩm ZeroMall'} ({s.package?.weight || 0.5}kg)</p>
                          <p className="text-xs font-bold text-slate-700">
                            Trạng thái cước: {s.codAmount > 0 ? `Thu COD khi giao: ${formatMoney(s.codAmount)}` : 'Đã thanh toán Online (0đ)'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-900 text-sm">{s.buyerName} - {s.buyerPhone}</p>
                          <p className="text-slate-700 text-xs leading-relaxed">📍 Điểm Giao Tận Nhà: {s.deliveryAddress}</p>
                          <p className="text-[11px] text-slate-600">📦 {s.package?.itemsSummary || 'Sản phẩm ZeroMall'} ({s.package?.weight || 0.5}kg)</p>
                          <p className="text-xs font-bold text-emerald-700">
                            {s.codAmount > 0 ? `Tiền COD cần thu: ${formatMoney(s.codAmount)}` : 'Đã thanh toán Online (0đ)'}
                          </p>
                        </div>
                      )}

                      {/* Nút Accept / Reject */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => assignment && handleRespond(assignment.id, 'REJECT')}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          ❌ Từ Chối
                        </button>
                        <button
                          onClick={() => assignment && handleRespond(assignment.id, 'ACCEPT')}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                        >
                          ✅ Nhận Đơn
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2: TUYẾN LẤY HÀNG TẠI SHOP (PICKUP) */}
          {activeTab === 'PICKUP' && (
            <div className="space-y-3">
              {pickupTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <span className="text-4xl">🏪</span>
                  <p className="text-xs font-bold">Không có đơn cần đi lấy</p>
                </div>
              ) : (
                pickupTasks.map((s) => {
                  const shopName = s.pickupAddress?.name || 'Kho Người Bán ZeroMall'
                  const shopPhone = s.pickupAddress?.phone || s.buyerPhone
                  const pickupAddressText = s.pickupAddress?.address || 'Địa chỉ kho của Shop'

                  return (
                    <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-emerald-700">{s.trackingNumber}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">
                          {s.status === 'PICKUP_ASSIGNED' ? 'Đã gán' : 'Đang đến lấy'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-900 text-sm">🏪 {shopName} - {shopPhone}</p>
                        <p className="text-emerald-800 font-semibold text-xs leading-relaxed">📍 Điểm Đến Lấy: {pickupAddressText}</p>
                        <p className="text-[11px] text-slate-500">📦 Kiện hàng: {s.package?.itemsSummary || 'Sản phẩm ZeroMall'} ({s.package?.weight || 0.5}kg)</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={`tel:${shopPhone}`}
                          className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1"
                        >
                          📞 Gọi Shop
                        </a>
                        <button
                          onClick={() => onUpdateStatus(s.id, 'PICKED_UP')}
                          disabled={actionLoading}
                          className="py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-3xs"
                        >
                          📦 Đã Lấy Xong
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* TAB 2.5: BÀN GIAO KIỆN HÀNG VỀ KHO (HANDOVER TO HUB) */}
          {activeTab === 'HANDOVER' && (
            <div className="space-y-3">
              {handoverTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <span className="text-4xl">🏢</span>
                  <p className="text-xs font-bold">Không có kiện hàng nào cần bàn giao</p>
                  <p className="text-[11px]">Tất cả các đơn đã lấy từ Shop đã được nhập kho an toàn.</p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <span>🚚</span> Bạn có {handoverTasks.length} kiện hàng trong túi đã lấy từ Shop:
                    </p>
                    <p className="text-amber-700">
                      Vui lòng mang về <b>{driverProfile?.hub?.name || 'Kho Tân Bình SOC'}</b> để nhân viên kho quét nhận bàn giao.
                    </p>
                  </div>

                  {handoverTasks.map((s) => (
                    <div key={s.id} className="bg-white border-2 border-amber-400/80 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono font-bold text-amber-700">{s.trackingNumber}</span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                          Đã lấy • Chờ nộp kho
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-800">{s.package?.itemsSummary || 'Sản phẩm ZeroMall'}</p>
                        <p className="text-slate-500 text-xs">📍 Điểm phát: {s.deliveryAddress}</p>
                      </div>

                      <button
                        onClick={() => onUpdateStatus(s.id, 'AT_ORIGIN_HUB')}
                        disabled={actionLoading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
                      >
                        <span>🏢 Bàn Giao Nhập Kho {driverProfile?.hub?.name || 'Bưu Cục'}</span>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB 3: TUYẾN PHÁT HÀNG TẬN TAY (DELIVERY) */}
          {activeTab === 'DELIVERY' && (
            <div className="space-y-3">
              {deliveryTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <span className="text-4xl">🛵</span>
                  <p className="text-xs font-bold">Không có đơn đang phát</p>
                </div>
              ) : (
                deliveryTasks.map((s) => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-emerald-700">{s.trackingNumber}</span>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-md animate-pulse">
                        Đang giao khách
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-900 text-sm">{s.buyerName} - {s.buyerPhone}</p>
                      <p className="text-slate-600 text-xs leading-relaxed">📍 {s.deliveryAddress}</p>
                      <div className="p-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800 flex justify-between">
                        <span>Thu Tiền COD:</span>
                        <span>{formatMoney(s.codAmount)}</span>
                      </div>
                    </div>

                    {/* Action buttons: Gọi khách, Maps dẫn đường, Giao thành công, Báo thất bại */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${s.buyerPhone}`}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1"
                      >
                        📞 Gọi Khách
                      </a>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(s.deliveryAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1"
                      >
                        🗺️ Dẫn Đường
                      </a>
                      <button
                        onClick={() => onUpdateStatus(s.id, 'DELIVERED')}
                        disabled={actionLoading}
                        className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md"
                      >
                        ✅ Xác Nhận Giao Thành Công & Thu COD
                      </button>
                      <button
                        onClick={() => setFailModalShipment(s)}
                        disabled={actionLoading}
                        className="col-span-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer border border-rose-200"
                      >
                        ❌ Báo Giao Thất Bại (Hẹn lại / Không nghe máy)
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: VÍ COD & THU NHẬP (VIEW INCOME & COD WALLET) */}
          {activeTab === 'WALLET' && (
            <div className="space-y-4 text-xs">
              <div className={`p-5 rounded-3xl space-y-3 shadow-lg text-white ${
                codInWallet >= 10000000 
                  ? 'bg-gradient-to-tr from-rose-700 to-red-600 animate-pulse' 
                  : codInWallet >= 8000000 
                  ? 'bg-gradient-to-tr from-amber-700 to-orange-600'
                  : 'bg-gradient-to-tr from-emerald-700 to-teal-600'
              }`}>
                <div className="flex justify-between items-start">
                  <span className="text-[11px] uppercase tracking-wider text-white/80 font-bold">Ví Thu Hộ COD Đang Giữ</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black/25">
                    Hạn mức: 10.000.000đ
                  </span>
                </div>
                <p className="text-3xl font-black">{formatMoney(codInWallet)}</p>

                {/* Thanh tiến độ hạn mức COD */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        codInWallet >= 10000000 ? 'bg-white' : codInWallet >= 8000000 ? 'bg-amber-300' : 'bg-emerald-300'
                      }`}
                      style={{ width: `${Math.min(100, (codInWallet / 10000000) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-white/80 font-medium">
                    <span>Đã dùng: {Math.round((codInWallet / 10000000) * 100)}%</span>
                    <span>Còn lại: {formatMoney(Math.max(0, 10000000 - codInWallet))}</span>
                  </div>
                </div>

                {codInWallet >= 10000000 ? (
                  <div className="p-2.5 bg-black/30 rounded-xl text-[11px] font-bold text-rose-100 border border-rose-400">
                    ⚠️ BẠN ĐÃ VƯỢT HẠN MỨC COD 10 TRIỆU. Hệ thống tạm ngưng phân công đơn mới cho đến khi bạn nộp tiền về Bưu Cục.
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Vui lòng nộp số tiền này về <b>{driverProfile?.hub?.name || 'Bưu Cục'}</b> trước 18:00 mỗi ngày.
                  </p>
                )}

                {codInWallet > 0 && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Xác nhận nộp toàn bộ ${formatMoney(codInWallet)} tiền COD về Bưu Cục?`)) {
                        try {
                          const res = await fetch(`http://localhost:8000/delivery/drivers/${driverProfile?.id || 'driver-02'}/remit-cod`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount: codInWallet, paymentMethod: 'CASH' }),
                          })
                          if (res.ok) {
                            alert('Đã nộp tiền COD thành công về bưu cục! Hạn mức đã được làm mới.')
                            onRefresh()
                          }
                        } catch (e: any) {
                          alert('Lỗi nộp COD: ' + e.message)
                        }
                      }
                    }}
                    className="w-full py-2.5 bg-white text-slate-900 font-black rounded-xl text-xs transition cursor-pointer shadow-md hover:bg-slate-100 flex items-center justify-center gap-1.5"
                  >
                    <span>🏦 Nộp Tiền COD Về Bưu Cục & Mở Khóa Đơn</span>
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <span className="text-slate-500 font-bold">Ước Tính Thu Nhập Của Bạn:</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-700 text-xs">Tổng {completedTasks.length} đơn hoàn thành:</span>
                  <span className="text-base font-black text-emerald-700">+{formatMoney(driverEarnings)}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                <span className="text-slate-700 font-bold">Lịch Sử Giao Hàng Gần Nhất:</span>
                <div className="space-y-2 divide-y divide-slate-100">
                  {completedTasks.slice(0, 5).map((s) => (
                    <div key={s.id} className="pt-2 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-mono font-bold text-slate-800">{s.trackingNumber}</p>
                        <p className="text-[10px] text-slate-400">{s.buyerName}</p>
                      </div>
                      <span className="font-bold text-emerald-600">+{formatMoney(s.codAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 3. Modal: Ghi Nhận Giao Thất Bại */}
        {failModalShipment && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left border border-slate-100">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>❌</span> Giao Hàng Không Thành Công
              </h3>
              <p className="text-xs text-slate-500">Mã đơn: <b className="text-emerald-700">{failModalShipment.trackingNumber}</b></p>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Chọn lý do thất bại:</label>
                {[
                  'Khách không nghe máy (đã gọi 3 lần)',
                  'Khách hẹn giao lại vào ngày mai',
                  'Địa chỉ không tìm thấy / Sai số nhà',
                  'Khách từ chối nhận (hàng không đúng ý)',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl text-xs cursor-pointer border border-slate-200">
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
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => onUpdateStatus(failModalShipment.id, 'DELIVERY_FAILED', failReason)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Xác Nhận Lưu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
