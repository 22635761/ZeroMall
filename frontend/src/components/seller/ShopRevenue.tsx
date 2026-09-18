import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { orderService } from '../../services/order.service'
import type { Order } from '../../models/order.model'

interface ShopRevenueProps {
  user: any
  token: string
  shopDetails?: any
}

export const ShopRevenue: React.FC<ShopRevenueProps> = ({ user, token, shopDetails }) => {
  const shopId = user?.shopId || ''

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState<number>(5)
  const now = new Date()
  
  // Mặc định tự động vào trang là xem "TẤT CẢ" (ALL)
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL')
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear())
  const [activeTab, setActiveTab] = useState<'ALL' | 'RELEASED' | 'HELD' | 'IN_TRANSIT' | 'CANCELLED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null)

  // Xác định ngày Shop tạo tài khoản để giới hạn dải Tháng/Năm
  const shopCreatedDate = useMemo(() => {
    const rawDate = shopDetails?.createdAt || user?.createdAt
    if (rawDate) {
      const parsed = new Date(rawDate)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return now
  }, [shopDetails?.createdAt, user?.createdAt])

  const startYear = shopCreatedDate.getFullYear()
  const startMonth = shopCreatedDate.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Danh sách các Năm hợp lệ từ năm tạo shop đến năm hiện tại
  const availableYears = useMemo(() => {
    const years: number[] = []
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y)
    }
    return years
  }, [startYear, currentYear])

  // Danh sách các Tháng hợp lệ theo Năm đang chọn
  const availableMonths = useMemo(() => {
    const months: number[] = []
    const minM = selectedYear === startYear ? startMonth : 1
    const maxM = selectedYear === currentYear ? currentMonth : 12

    for (let m = minM; m <= maxM; m++) {
      months.push(m)
    }
    return months
  }, [selectedYear, startYear, startMonth, currentYear, currentMonth])

  // Fetch orders and commission rate
  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const [ordersData, commRes] = await Promise.all([
          orderService.fetchSellerOrders(shopId, token),
          fetch(`${API_BASE_URL}/payments/commission-rate`).then(res => res.json()).catch(() => ({ commissionRate: 5 }))
        ])
        setOrders(ordersData || [])
        if (commRes && typeof commRes.commissionRate === 'number') {
          setCommissionRate(commRes.commissionRate)
        }
      } catch (err) {
        console.error('Error fetching shop revenue data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [shopId, token])

  // Filter orders: 'ALL' -> Toàn bộ; hoặc theo tháng & năm đã chọn
  const dateFilteredOrders = useMemo(() => {
    if (selectedMonth === 'ALL') return orders
    const monthNum = Number(selectedMonth)
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate.getMonth() + 1 === monthNum && orderDate.getFullYear() === Number(selectedYear)
    })
  }, [orders, selectedMonth, selectedYear])

  // Compute Revenue Dashboard Metrics for current filter
  const metrics = useMemo(() => {
    let totalGMV = 0
    let totalOrdersCount = 0
    let totalCommission = 0
    let releasedRevenue = 0
    let releasedCount = 0
    let heldRevenue = 0
    let heldCount = 0
    let inTransitRevenue = 0
    let inTransitCount = 0
    let cancelledCount = 0

    dateFilteredOrders.forEach(order => {
      const isCancelledOrRefunded = ['CANCELLED', 'REFUNDED', 'RETURNED', 'PENDING', 'PENDING_PAYMENT', 'UNPAID'].includes(order.status)
      if (isCancelledOrRefunded) {
        cancelledCount++
        return
      }

      totalOrdersCount++
      // GMV = Tổng tiền hàng bán (tiền SP của Shop)
      const itemSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const shopDiscount = (order as any).shopDiscountAmount || 0
      const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
      totalGMV += itemSubtotal

      // Chiết khấu sàn (%) tính trên giá trị tiền hàng SP của Shop (không tính phí ship)
      const commRate = (order as any).commissionRate ?? commissionRate
      const commAmount = Math.round(netSubtotal * (commRate / 100))
      totalCommission += commAmount

      // Doanh thu thực nhận về ví Shop
      const netRevenue = netSubtotal - commAmount

      if (order.status === 'COMPLETED') {
        releasedRevenue += netRevenue
        releasedCount++
      } else if (order.status === 'DELIVERED') {
        heldRevenue += netRevenue
        heldCount++
      } else {
        inTransitRevenue += netRevenue
        inTransitCount++
      }
    })

    const netEstimatedRevenue = releasedRevenue + heldRevenue + inTransitRevenue

    return {
      totalGMV,
      totalOrdersCount,
      totalCommission,
      netEstimatedRevenue,
      releasedRevenue,
      releasedCount,
      heldRevenue,
      heldCount,
      inTransitRevenue,
      inTransitCount,
      cancelledCount
    }
  }, [dateFilteredOrders, commissionRate])

  // Filter orders by active tab & search query
  const displayedOrders = useMemo(() => {
    return dateFilteredOrders.filter(order => {
      // Tab filter
      if (activeTab === 'RELEASED' && order.status !== 'COMPLETED') return false
      if (activeTab === 'HELD' && order.status !== 'DELIVERED') return false
      if (activeTab === 'IN_TRANSIT' && ['COMPLETED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)) return false
      if (activeTab === 'CANCELLED' && !['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchId = order.id.toLowerCase().includes(q)
        const matchItem = order.items.some(i => i.name.toLowerCase().includes(q))
        const matchBuyer = order.buyerName.toLowerCase().includes(q)
        return matchId || matchItem || matchBuyer
      }

      return true
    })
  }, [dateFilteredOrders, activeTab, searchQuery])

  const formatPrice = (val: number) => {
    return Math.round(val).toLocaleString('vi-VN') + 'đ'
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Header Title & Month Picker Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-3xs">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span>📈</span> Tổng Quan Doanh Thu Shop (Chuẩn TMĐT)
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Quản lý doanh số bán hàng, chiết khấu sàn, tiền tạm giữ 3 ngày và giải ngân thực tế về Ví Shop.
          </p>
        </div>

        {/* Month & Year Selector Filter */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl shrink-0">
          <span className="text-xs font-bold text-slate-600 pl-1">📅 Lọc theo thời gian:</span>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value)
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 focus:outline-hidden cursor-pointer shadow-3xs"
          >
            <option value="ALL">🌟 Tất Cả Thời Gian</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
            ))}
          </select>

          {selectedMonth !== 'ALL' && (
            <select
              value={selectedYear}
              onChange={(e) => {
                const newY = Number(e.target.value)
                setSelectedYear(newY)
                // Đảm bảo nếu chọn năm bắt đầu mà tháng hiện tại nhỏ hơn startMonth thì reset
                const minM = newY === startYear ? startMonth : 1
                const maxM = newY === currentYear ? currentMonth : 12
                if (Number(selectedMonth) < minM || Number(selectedMonth) > maxM) {
                  setSelectedMonth(String(minM))
                }
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-slate-700 focus:outline-hidden cursor-pointer shadow-3xs"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          )}

          {selectedMonth !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedMonth('ALL')}
              className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
              title="Xem lại tất cả đơn hàng"
            >
              ✕ Bỏ lọc
            </button>
          )}
        </div>
      </div>

      {/* Shopee-style 5 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Card 1: Số Đơn Bán Được */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              {selectedMonth === 'ALL' ? 'Tất Cả Đơn Hàng' : `Đơn Hàng T${selectedMonth}/${selectedYear}`}
            </span>
            <span className="text-lg">📦</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{metrics.totalOrdersCount}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Đơn thành công & phát sinh</p>
          </div>
        </div>

        {/* Card 2: Tổng Doanh Số Tiền Hàng (GMV) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tổng Doanh Số Tiền Hàng</span>
            <span className="text-lg">💵</span>
          </div>
          <div>
            <p className="text-xl font-black text-slate-800 tracking-tight">{formatPrice(metrics.totalGMV)}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Tiền SP trước chiết khấu (không gồm ship)</p>
          </div>
        </div>

        {/* Card 3: Doanh Thu Thực Nhận (Net Revenue) */}
        <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Doanh Thu Thực Thu</span>
            <span className="text-lg">✨</span>
          </div>
          <div>
            <p className="text-xl font-black text-emerald-600 tracking-tight">{formatPrice(metrics.netEstimatedRevenue)}</p>
            <p className="text-[10px] text-emerald-700/80 font-bold mt-1">
              Đã trừ {commissionRate}% chiết khấu sàn (-{formatPrice(metrics.totalCommission)})
            </p>
          </div>
        </div>

        {/* Card 4: Tiền Đang Tạm Giữ (Held Escrow) */}
        <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Đang Tạm Giữ 3 Ngày</span>
            <span className="text-lg">🔒</span>
          </div>
          <div>
            <p className="text-xl font-black text-amber-600 tracking-tight">{formatPrice(metrics.heldRevenue)}</p>
            <p className="text-[10px] text-amber-700/80 font-bold mt-1">
              {metrics.heldCount} đơn Đã Giao (Chờ giải ngân)
            </p>
          </div>
        </div>

        {/* Card 5: Tiền Đã Giải Ngân về Ví */}
        <div className="bg-sky-50/40 border border-sky-200/70 rounded-2xl p-4.5 shadow-3xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider">Đã Giải Ngân Về Ví</span>
            <span className="text-lg">🟢</span>
          </div>
          <div>
            <p className="text-xl font-black text-sky-600 tracking-tight">{formatPrice(metrics.releasedRevenue)}</p>
            <p className="text-[10px] text-sky-700/80 font-bold mt-1">
              {metrics.releasedCount} đơn đã hoàn tất thanh toán
            </p>
          </div>
        </div>

      </div>

      {/* Tab Navigation Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-3xs p-5 space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { id: 'ALL', label: `Tất Cả Đơn (${dateFilteredOrders.length})` },
              { id: 'RELEASED', label: `🟢 Đã Giải Ngân (${metrics.releasedCount})` },
              { id: 'HELD', label: `🔒 Đang Tạm Giữ 3 Ngày (${metrics.heldCount})` },
              { id: 'IN_TRANSIT', label: `🚚 Đang Vận Chuyển (${metrics.inTransitCount})` },
              { id: 'CANCELLED', label: `❌ Đã Hủy / Hoàn Tiền (${metrics.cancelledCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer border ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Tìm theo Mã đơn / Tên SP / Khách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Detailed Orders Revenue Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Đang tải dữ liệu báo cáo doanh thu từ database...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs space-y-2">
              <span className="text-3xl">📭</span>
              <p>Không tìm thấy đơn hàng nào trong danh mục này.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-3">Mã Đơn & Ngày Đặt</th>
                  <th className="py-3 px-3">Sản Phẩm & Phân Loại</th>
                  <th className="py-3 px-3 text-right">Tiền Hàng SP</th>
                  <th className="py-3 px-3 text-right">Voucher Shop</th>
                  <th className="py-3 px-3 text-right">Chiết Khấu Sàn</th>
                  <th className="py-3 px-3 text-right">Thực Thu Về Ví</th>
                  <th className="py-3 px-3 text-center">Trạng Thái Giải Ngân</th>
                  <th className="py-3 px-3 text-center">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedOrders.map(order => {
                  const itemSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
                  const shopDiscount = (order as any).shopDiscountAmount || 0
                  const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
                  const commRate = (order as any).commissionRate ?? commissionRate
                  const commAmount = Math.round(netSubtotal * (commRate / 100))
                  const netRevenue = netSubtotal - commAmount

                  let statusBadge = (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200">
                      {order.status}
                    </span>
                  )

                  if (order.status === 'COMPLETED') {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                        <span>🟢</span> Đã Giải Ngân
                      </span>
                    )
                  } else if (order.status === 'DELIVERED') {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                        <span>🔒</span> Tạm Giữ 3 Ngày
                      </span>
                    )
                  } else if (['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)) {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                        <span>❌</span> Đã Hủy / Hoàn Tiền
                      </span>
                    )
                  } else {
                    statusBadge = (
                      <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                        <span>🚚</span> Đang Giao Hàng
                      </span>
                    )
                  }

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      
                      {/* Mã đơn & Ngày */}
                      <td className="py-3.5 px-3">
                        <p className="font-mono font-black text-slate-800 text-xs">#{order.id}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
                        <p className="text-[10px] text-slate-500 font-bold">Khách: {order.buyerName}</p>
                      </td>

                      {/* Sản Phẩm */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="space-y-1.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={item.image || 'https://placehold.co/40x40?text=SP'}
                                alt={item.name}
                                className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0"
                              />
                              <div className="truncate">
                                <p className="font-bold text-slate-700 text-xs truncate" title={item.name}>
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  {item.variant ? `Phân loại: ${item.variant} | ` : ''}x{item.quantity} ({formatPrice(item.price)})
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Tiền Hàng SP */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-800 text-xs">
                        {formatPrice(itemSubtotal)}
                      </td>

                      {/* Voucher Shop */}
                      <td className="py-3.5 px-3 text-right font-semibold text-rose-500 text-xs">
                        {shopDiscount > 0 ? `-${formatPrice(shopDiscount)}` : '0đ'}
                      </td>

                      {/* Chiết khấu sàn */}
                      <td className="py-3.5 px-3 text-right font-semibold text-amber-600 text-xs">
                        -{formatPrice(commAmount)}
                        <span className="block text-[9px] text-slate-400 font-normal">({commRate}%)</span>
                      </td>

                      {/* Thực thu về ví */}
                      <td className="py-3.5 px-3 text-right font-black text-emerald-600 text-xs">
                        {['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status) ? (
                          <span className="text-slate-400 font-normal italic">0đ</span>
                        ) : (
                          formatPrice(netRevenue)
                        )}
                      </td>

                      {/* Trạng thái giải ngân */}
                      <td className="py-3.5 px-3 text-center">
                        {statusBadge}
                      </td>

                      {/* Chi tiết */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrderForDetail(order)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer transition"
                        >
                          Chi Tiết
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Shopee Order Financial Breakdown Lightbox Modal */}
      {selectedOrderForDetail && (() => {
        const itemSubtotal = selectedOrderForDetail.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const shopDiscount = (selectedOrderForDetail as any).shopDiscountAmount || 0
        const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
        const commRate = (selectedOrderForDetail as any).commissionRate ?? commissionRate
        const commAmount = Math.round(netSubtotal * (commRate / 100))
        const netRevenue = netSubtotal - commAmount

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-left">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">
                    📄 Bóc Tách Doanh Thu Đơn Hàng #{selectedOrderForDetail.id}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Thời gian đặt: {formatDate(selectedOrderForDetail.createdAt)}</p>
                </div>
                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Product items list */}
                <div className="space-y-2 border-b border-slate-100 pb-3">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase">Sản Phẩm Trong Đơn</p>
                  {selectedOrderForDetail.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="truncate max-w-[240px] font-bold text-slate-800">{item.name} (x{item.quantity})</span>
                      <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-2.5 border-b border-slate-100 pb-3">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tổng tiền hàng SP của Shop:</span>
                    <span className="font-bold text-slate-800">{formatPrice(itemSubtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 text-[11px]">
                    <span>Phí vận chuyển (Do Đơn Vị Vận Chuyển thu, không vào Ví Shop):</span>
                    <span>{formatPrice(selectedOrderForDetail.shippingFee)}</span>
                  </div>
                  {shopDiscount > 0 && (
                    <div className="flex justify-between items-center text-rose-500">
                      <span>Voucher Shop tài trợ:</span>
                      <span>-{formatPrice(shopDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-amber-600">
                    <span>Phí chiết khấu Sàn TMĐT ({commRate}% tiền hàng):</span>
                    <span>-{formatPrice(commAmount)}</span>
                  </div>
                </div>

                {/* Net Payout Amount */}
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-extrabold text-emerald-800 uppercase">Tiền Về Ví Shop Thực Thu</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Trạng thái: {selectedOrderForDetail.status === 'COMPLETED' ? '🟢 Đã Giải Ngân' : selectedOrderForDetail.status === 'DELIVERED' ? '🔒 Đang Tạm Giữ 3 Ngày' : '🚚 Đang Giao / Xử Lý'}
                    </p>
                  </div>
                  <p className="text-xl font-black text-emerald-600">
                    {['CANCELLED', 'REFUNDED', 'RETURNED'].includes(selectedOrderForDetail.status)
                      ? '0đ'
                      : formatPrice(netRevenue)}
                  </p>
                </div>

              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
