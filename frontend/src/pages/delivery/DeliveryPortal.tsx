import React, { useState, useEffect } from 'react'

interface TrackingLog {
  id: string
  stage: string
  title: string
  description: string
  location?: string
  timestamp: string
}

interface DeliveryOrder {
  id: string
  orderId: string
  trackingNumber: string
  shopName?: string
  buyerName: string
  buyerPhone: string
  shippingAddress: string
  totalAmount: number
  codAmount: number
  paymentMethod: string
  currentStage: 'PICKING' | 'IN_HUB' | 'IN_TRANSIT' | 'DELIVERING' | 'DELIVERED' | 'FAILED'
  hubName?: string
  shipperName?: string
  shipperPhone?: string
  itemsSummary?: string
  createdAt: string
  logs: TrackingLog[]
}

interface DeliveryPortalProps {
  onBackToHome?: () => void
}

export const DeliveryPortal: React.FC<DeliveryPortalProps> = ({ onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PICKING' | 'IN_HUB' | 'IN_TRANSIT' | 'DELIVERING' | 'DELIVERED'>('ALL')
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchDeliveryOrders = async () => {
    setLoading(true)
    try {
      const url = activeTab === 'ALL' 
        ? 'http://localhost:8000/delivery/orders' 
        : `http://localhost:8000/delivery/orders?stage=${activeTab}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDeliveryOrders(data)
      }
    } catch (e) {
      console.error('Error fetching delivery orders:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeliveryOrders()
  }, [activeTab])

  const handleAdvanceStage = async (orderId: string, nextStage: string, failedReason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/delivery/${orderId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage,
          failedReason,
        }),
      })
      if (res.ok) {
        alert('Cập nhật trạng thái vận chuyển thành công!')
        await fetchDeliveryOrders()
        if (selectedOrder && selectedOrder.id === orderId) {
          const updated = await res.json()
          setSelectedOrder(updated)
        }
      }
    } catch (e) {
      console.error('Error updating stage:', e)
      alert('Lỗi cập nhật chặng vận chuyển')
    } finally {
      setActionLoading(false)
    }
  }

  const formatMoney = (val: number) => val.toLocaleString('vi-VN') + 'đ'

  const filteredOrders = deliveryOrders.filter((o) => {
    const q = searchQuery.toLowerCase()
    return (
      o.trackingNumber.toLowerCase().includes(q) ||
      o.orderId.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.buyerPhone.includes(q) ||
      o.shippingAddress.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-orange-600 selection:text-white flex flex-col justify-between">
      {/* 1. Header Bar (SPX Express Style) */}
      <header className="bg-slate-950 border-b border-slate-800 py-3.5 px-6 sm:px-12 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-xl shadow-lg shadow-orange-950 font-black">
              🚚
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black tracking-tight text-white">Zero<span className="text-orange-500">Express</span></span>
                <span className="text-[10px] font-black text-orange-400 bg-orange-950 border border-orange-800/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  ZMX Logistics & Station Hub
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Hệ thống điều phối tài xế & trạm khai thác phân loại bưu kiện</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDeliveryOrders()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔄</span> Làm Mới
            </button>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                🛍️ Đến Sàn Mua Sắm
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Body Container */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        
        {/* Top Summary Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><span>📦</span> Chờ Lấy Hàng (Pickup)</span>
            <p className="text-2xl font-black text-amber-400">
              {deliveryOrders.filter(o => o.currentStage === 'PICKING').length}
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><span>🏢</span> Trong Kho Phân Loại (Hub)</span>
            <p className="text-2xl font-black text-sky-400">
              {deliveryOrders.filter(o => o.currentStage === 'IN_HUB' || o.currentStage === 'IN_TRANSIT').length}
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><span>🛵</span> Đang Giao Khách (Delivering)</span>
            <p className="text-2xl font-black text-orange-400">
              {deliveryOrders.filter(o => o.currentStage === 'DELIVERING').length}
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5"><span>✅</span> Đã Giao Thành Công</span>
            <p className="text-2xl font-black text-emerald-400">
              {deliveryOrders.filter(o => o.currentStage === 'DELIVERED').length}
            </p>
          </div>
        </div>

        {/* Tabs & Search Bar */}
        <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            {/* Stage Tabs */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { id: 'ALL', label: 'Tất Cả' },
                { id: 'PICKING', label: '📦 Chờ Lấy' },
                { id: 'IN_HUB', label: '🏢 Tại Kho SOC' },
                { id: 'IN_TRANSIT', label: '🚚 Đang Trung Chuyển' },
                { id: 'DELIVERING', label: '🛵 Đang Phát' },
                { id: 'DELIVERED', label: '✅ Đã Giao' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã ZMX, mã đơn, tên, sđt..."
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          {/* Orders List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã Vận Đơn (Tracking)</th>
                  <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                  <th className="py-3 px-4">Gói Hàng / COD</th>
                  <th className="py-3 px-4">Trạng Thái Vận Chuyển</th>
                  <th className="py-3 px-4 text-right">Thao Tác Điều Phối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      Đang tải danh sách bưu kiện...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                      Không có đơn hàng nào trong phân đoạn này.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-400 space-y-0.5">
                        <div>{order.trackingNumber}</div>
                        <div className="text-[10px] text-slate-500 font-normal">Đơn: #{order.orderId.slice(0, 12)}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{order.buyerName}</span>
                          <span className="text-slate-400 text-[11px]">({order.buyerPhone})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{order.shippingAddress}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-300 font-medium line-clamp-1 max-w-xs">{order.itemsSummary}</div>
                        <div className="text-[11px] font-bold text-emerald-400">
                          {order.paymentMethod === 'cod' ? `Thu COD: ${formatMoney(order.codAmount)}` : 'Đã thanh toán Online'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-extrabold ${
                          order.currentStage === 'PICKING' ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' :
                          order.currentStage === 'IN_HUB' ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60' :
                          order.currentStage === 'IN_TRANSIT' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60' :
                          order.currentStage === 'DELIVERING' ? 'bg-orange-950/80 text-orange-400 border border-orange-800/60 animate-pulse' :
                          order.currentStage === 'DELIVERED' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' :
                          'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                        }`}>
                          {order.currentStage === 'PICKING' && '📦 Chờ Lấy Hàng'}
                          {order.currentStage === 'IN_HUB' && '🏢 Đã Nhập Kho SOC'}
                          {order.currentStage === 'IN_TRANSIT' && '🚚 Đang Trung Chuyển'}
                          {order.currentStage === 'DELIVERING' && '🛵 Đang Giao Hàng'}
                          {order.currentStage === 'DELIVERED' && '✅ Giao Thành Công'}
                          {order.currentStage === 'FAILED' && '❌ Giao Thất Bại'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          📜 Lịch Sử
                        </button>

                        {/* Fast stage transition buttons */}
                        {order.currentStage === 'PICKING' && (
                          <button
                            onClick={() => handleAdvanceStage(order.id, 'PICKED_UP')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-md"
                          >
                            Đã Lấy Hàng
                          </button>
                        )}
                        {order.currentStage === 'IN_HUB' && (
                          <button
                            onClick={() => handleAdvanceStage(order.id, 'IN_TRANSIT')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-md"
                          >
                            Xuất Kho Đi
                          </button>
                        )}
                        {(order.currentStage === 'IN_TRANSIT' || order.currentStage === 'PICKING') && (
                          <button
                            onClick={() => handleAdvanceStage(order.id, 'DELIVERING')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-md"
                          >
                            Bắt Đầu Giao
                          </button>
                        )}
                        {order.currentStage === 'DELIVERING' && (
                          <button
                            onClick={() => handleAdvanceStage(order.id, 'DELIVERED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer shadow-md"
                          >
                            ✅ Giao Xong
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* 3. Modal: Chi Tiết Hành Trình Vận Đơn (Tracking Milestones) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span>🚚</span> Hành Trình Vận Đơn {selectedOrder.trackingNumber}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Đơn hàng: #{selectedOrder.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white font-bold text-xl cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions in Modal */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">Chuyển Chặng Tiếp Theo:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleAdvanceStage(selectedOrder.id, 'PICKED_UP')}
                  className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  1. Đã Lấy Hàng
                </button>
                <button
                  onClick={() => handleAdvanceStage(selectedOrder.id, 'IN_HUB')}
                  className="px-2.5 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  2. Nhập Kho SOC
                </button>
                <button
                  onClick={() => handleAdvanceStage(selectedOrder.id, 'IN_TRANSIT')}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  3. Trung Chuyển
                </button>
                <button
                  onClick={() => handleAdvanceStage(selectedOrder.id, 'DELIVERING')}
                  className="px-2.5 py-1 bg-orange-600/30 hover:bg-orange-600 text-orange-300 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  4. Đang Giao
                </button>
                <button
                  onClick={() => handleAdvanceStage(selectedOrder.id, 'DELIVERED')}
                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold rounded-lg transition"
                >
                  5. Giao Thành Công
                </button>
              </div>
            </div>

            {/* Vertical Milestones Timeline */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {selectedOrder.logs.map((log, index) => (
                <div key={log.id} className="flex gap-3 relative">
                  {/* Timeline connector line */}
                  {index !== selectedOrder.logs.length - 1 && (
                    <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-800"></div>
                  )}

                  {/* Dot icon */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-black ${
                    index === 0 ? 'bg-orange-500 text-white shadow-md shadow-orange-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index === 0 ? '●' : '○'}
                  </div>

                  {/* Log Content */}
                  <div className="flex-1 space-y-0.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-bold ${index === 0 ? 'text-orange-400' : 'text-slate-300'}`}>
                        {log.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed font-normal">{log.description}</p>
                    {log.location && (
                      <p className="text-[10px] text-slate-500 font-medium">📍 Địa điểm: {log.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-3 text-center text-xs text-slate-500 font-medium">
        © 2026 ZeroMall Express (ZMX) Logistics System. Nền tảng điều phối vận tải TMĐT chuẩn Shopee.
      </footer>
    </div>
  )
}
