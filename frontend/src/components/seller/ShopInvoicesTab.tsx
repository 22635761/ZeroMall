import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { orderService } from '../../services/order.service'
import type { Order } from '../../models/order.model'
import { InvoiceDetailModal } from './InvoiceDetailModal'

interface ShopInvoicesTabProps {
  user: any
  token: string
  shopDetails?: any
}

export const ShopInvoicesTab: React.FC<ShopInvoicesTabProps> = ({ user, token, shopDetails }) => {
  const shopId = user?.shopId || ''
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [commissionRate, setCommissionRate] = useState<number>(5)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(`Q${currentQuarter}`) // 'ALL_YEAR', 'Q1', 'Q2', 'Q3', 'Q4', 'M1'...'M12'
  const [statusFilter, setStatusFilter] = useState<string>('ALL') // 'ALL', 'COMPLETED', 'DELIVERED', 'IN_TRANSIT', 'CANCELLED'
  const [searchQuery, setSearchQuery] = useState('')

  // Shop created date
  const shopCreatedDate = useMemo(() => {
    const raw = shopDetails?.createdAt || user?.createdAt
    if (raw) {
      const p = new Date(raw)
      if (!isNaN(p.getTime())) return p
    }
    return now
  }, [shopDetails?.createdAt, user?.createdAt])

  const startYear = shopCreatedDate.getFullYear()

  // Available Years
  const availableYears = useMemo(() => {
    const years: number[] = []
    for (let y = startYear; y <= currentYear; y++) {
      years.push(y)
    }
    return years
  }, [startYear, currentYear])

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
          fetch(`${API_BASE_URL}/payments/commission-rate`).then(r => r.json()).catch(() => ({ commissionRate: 5 }))
        ])
        setOrders(ordersData || [])
        if (commRes && typeof commRes.commissionRate === 'number') {
          setCommissionRate(commRes.commissionRate)
        }
      } catch (err) {
        console.error('Error fetching shop invoices and orders:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [shopId, token])

  // Filter orders by Selected Year and Period (Quarter / Month / Full Year)
  const periodFilteredOrders = useMemo(() => {
    return orders.filter(order => {
      const d = new Date(order.createdAt)
      const orderYear = d.getFullYear()
      const orderMonth = d.getMonth() + 1 // 1-12

      if (orderYear !== selectedYear) return false

      if (selectedPeriod === 'ALL_YEAR') return true
      if (selectedPeriod === 'Q1') return [1, 2, 3].includes(orderMonth)
      if (selectedPeriod === 'Q2') return [4, 5, 6].includes(orderMonth)
      if (selectedPeriod === 'Q3') return [7, 8, 9].includes(orderMonth)
      if (selectedPeriod === 'Q4') return [10, 11, 12].includes(orderMonth)
      if (selectedPeriod.startsWith('M')) {
        const targetMonth = Number(selectedPeriod.replace('M', ''))
        return orderMonth === targetMonth
      }
      return true
    })
  }, [orders, selectedYear, selectedPeriod])

  // Calculate Financial Aggregations for the Selected Period
  const financialSummary = useMemo(() => {
    let totalGMV = 0 // Tổng giá trị tiền hàng (chưa trừ voucher, chưa tính ship)
    let totalShopDiscount = 0
    let totalPlatformFee = 0
    let totalNetPayout = 0
    let totalCOGS = 0 // Giá vốn hàng bán (Cost of Goods Sold)
    let totalGrossProfit = 0 // Lợi nhuận gộp = Thực thu - Giá vốn
    let totalInvoices = 0
    let completedInvoices = 0
    let cancelledInvoices = 0

    periodFilteredOrders.forEach(order => {
      totalInvoices++
      const isCancelled = ['CANCELLED', 'REFUNDED', 'RETURNED', 'PENDING', 'PENDING_PAYMENT', 'UNPAID'].includes(order.status)
      if (isCancelled) {
        cancelledInvoices++
        return
      }

      completedInvoices++
      const itemSubtotal = order.items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
      const itemCOGS = order.items.reduce((sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1), 0)
      const shopDiscount = (order as any).shopDiscountAmount || 0
      const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
      const commRate = (order as any).commissionRate ?? commissionRate
      const commAmount = Math.round(netSubtotal * (commRate / 100))
      const netPayout = Math.max(0, netSubtotal - commAmount)

      totalGMV += itemSubtotal
      totalShopDiscount += shopDiscount
      totalPlatformFee += commAmount
      totalNetPayout += netPayout
      totalCOGS += itemCOGS
      totalGrossProfit += (netPayout - itemCOGS)
    })

    return {
      totalInvoices,
      completedInvoices,
      cancelledInvoices,
      totalGMV,
      totalShopDiscount,
      totalPlatformFee,
      totalNetPayout,
      totalCOGS,
      totalGrossProfit
    }
  }, [periodFilteredOrders, commissionRate])

  // Filter for display in table
  const displayedOrders = useMemo(() => {
    return periodFilteredOrders.filter(order => {
      // Status filter
      if (statusFilter === 'COMPLETED' && order.status !== 'COMPLETED') return false
      if (statusFilter === 'DELIVERED' && order.status !== 'DELIVERED') return false
      if (statusFilter === 'IN_TRANSIT' && !['SHIPPING', 'SHIPPED', 'IN_TRANSIT', 'PROCESSING', 'PREPARING', 'CONFIRMED'].includes(order.status)) return false
      if (statusFilter === 'CANCELLED' && !['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)) return false

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const invoiceNo = `hd-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase()}`
        const matchInvoice = invoiceNo.includes(q)
        const matchId = order.id.toLowerCase().includes(q)
        const matchBuyer = (order.buyerName || '').toLowerCase().includes(q)
        const matchPhone = (order.buyerPhone || '').includes(q)
        const matchItem = order.items.some(i => i.name.toLowerCase().includes(q))
        return matchInvoice || matchId || matchBuyer || matchPhone || matchItem
      }

      return true
    })
  }, [periodFilteredOrders, statusFilter, searchQuery])

  const formatVND = (amount: number) => {
    return Math.round(amount || 0).toLocaleString('vi-VN') + 'đ'
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  // Export Financial & Invoice Report to CSV (UTF-8 with BOM for Excel compatibility)
  const handleExportCSV = () => {
    if (periodFilteredOrders.length === 0) {
      alert('Không có dữ liệu hóa đơn nào trong kỳ đã chọn để xuất file.')
      return
    }

    const headers = [
      'Mã Hóa Đơn (E-Invoice)',
      'Mã Đơn Hàng',
      'Thời Gian Đặt',
      'Người Mua',
      'Số Điện Thoại',
      'Địa Chỉ Giao Hàng',
      'Danh Sách Sản Phẩm (Snapshot)',
      'Tổng Số Lượng',
      'Tổng Tiền Hàng (GMV)',
      'Voucher Shop Giảm',
      'Doanh Thu Thuần',
      'Chiết Khấu Sàn (%)',
      'Phí Chiết Khấu Sàn (VNĐ)',
      'Thực Thu Về Ví Shop',
      'Tổng Giá Vốn (COGS)',
      'Lợi Nhuận Gộp',
      'Trạng Thái Đơn Hàng',
      'Hình Thức Thanh Toán'
    ]

    const rows = periodFilteredOrders.map(order => {
      const invoiceNo = `HD-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`
      const totalQty = order.items.reduce((sum, i) => sum + (i.quantity || 1), 0)
      const itemSubtotal = order.items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
      const itemCOGS = order.items.reduce((sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1), 0)
      const shopDiscount = (order as any).shopDiscountAmount || 0
      const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
      const commRate = (order as any).commissionRate ?? commissionRate
      const commAmount = Math.round(netSubtotal * (commRate / 100))
      const isCancelled = ['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)
      const netPayout = isCancelled ? 0 : Math.max(0, netSubtotal - commAmount)
      const grossProfit = isCancelled ? 0 : (netPayout - itemCOGS)

      const itemsSummary = order.items.map(it => {
        const variantText = it.variant ? ` [${it.variant}]` : ''
        return `${it.name}${variantText} (x${it.quantity}, Giá: ${it.price.toLocaleString('vi-VN')}đ, Vốn: ${(it.costPrice || 0).toLocaleString('vi-VN')}đ)`
      }).join('; ')

      return [
        `"${invoiceNo}"`,
        `"${order.id}"`,
        `"${formatDate(order.createdAt)}"`,
        `"${order.buyerName || ''}"`,
        `"${order.buyerPhone || ''}"`,
        `"${(order.shippingAddress || '').replace(/"/g, '""')}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        totalQty,
        itemSubtotal,
        shopDiscount,
        netSubtotal,
        `${commRate}%`,
        commAmount,
        netPayout,
        itemCOGS,
        grossProfit,
        `"${order.status}"`,
        `"${order.paymentMethod}"`
      ].join(',')
    })

    // UTF-8 BOM
    const BOM = '\uFEFF'
    const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Bao_Cao_Tai_Chinh_Hoa_Don_ZeroMall_${selectedYear}_${selectedPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Top Banner & Quarter / Year Period Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-3xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <span>📑</span> Hóa Đơn Bán Hàng & Báo Cáo Tài Chính (Theo Quý / Năm)
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Dữ liệu giá bán, giá vốn và chiết khấu được bảo lưu bất biến tại thời điểm phát sinh giao dịch, hỗ trợ quyết toán thuế & tài chính kế toán.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
          
          {/* Year selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Năm:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-700 shadow-3xs cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          {/* Period (Quarter / Month) selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">Kỳ Báo Cáo:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-emerald-700 shadow-3xs cursor-pointer focus:outline-none focus:border-emerald-600"
            >
              <optgroup label="Tổng Hợp Theo Kỳ">
                <option value="ALL_YEAR">🌟 Cả Năm {selectedYear}</option>
                <option value="Q1">🌸 Quý 1 (Tháng 1 - Tháng 3)</option>
                <option value="Q2">☀️ Quý 2 (Tháng 4 - Tháng 6)</option>
                <option value="Q3">🍂 Quý 3 (Tháng 7 - Tháng 9)</option>
                <option value="Q4">❄️ Quý 4 (Tháng 10 - Tháng 12)</option>
              </optgroup>
              <optgroup label="Chi Tiết Theo Từng Tháng">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={`M${m}`}>Tháng {m < 10 ? `0${m}` : m}/{selectedYear}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-3xs transition flex items-center gap-1.5 cursor-pointer ml-1"
            title="Xuất file báo cáo tài chính định dạng Excel / CSV tương thích kế toán"
          >
            <span>📥</span> Xuất Báo Cáo (Excel/CSV)
          </button>

        </div>
      </div>

      {/* Financial KPIs for the selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Số Hóa Đơn */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Hóa Đơn Kỳ Này</span>
            <span className="text-base">🧾</span>
          </div>
          <div>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{financialSummary.totalInvoices}</p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              {financialSummary.completedInvoices} hợp lệ • {financialSummary.cancelledInvoices} đã hủy
            </p>
          </div>
        </div>

        {/* Card 2: Doanh Số GMV */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Doanh Số Hàng (GMV)</span>
            <span className="text-base">💵</span>
          </div>
          <div>
            <p className="text-lg font-black text-slate-800 tracking-tight">{formatVND(financialSummary.totalGMV)}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Giá bán niêm yết snapshot</p>
          </div>
        </div>

        {/* Card 3: Chiết Khấu Sàn */}
        <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Phí Chiết Khấu Sàn</span>
            <span className="text-base">🏷️</span>
          </div>
          <div>
            <p className="text-lg font-black text-amber-600 tracking-tight">-{formatVND(financialSummary.totalPlatformFee)}</p>
            <p className="text-[10px] text-amber-700/80 font-bold mt-0.5">Tỷ lệ chiết khấu: {commissionRate}%</p>
          </div>
        </div>

        {/* Card 4: Thực Thu Về Ví Shop */}
        <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Doanh Thu Thực Thu</span>
            <span className="text-base">✨</span>
          </div>
          <div>
            <p className="text-lg font-black text-emerald-600 tracking-tight">{formatVND(financialSummary.totalNetPayout)}</p>
            <p className="text-[10px] text-emerald-700/80 font-bold mt-0.5">Tiền về ví của Shop</p>
          </div>
        </div>

        {/* Card 5: Giá Vốn Hàng Bán (COGS) */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Giá Vốn Hàng (COGS)</span>
            <span className="text-base">📦</span>
          </div>
          <div>
            <p className="text-lg font-black text-slate-700 tracking-tight">{formatVND(financialSummary.totalCOGS)}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Tổng giá vốn sản phẩm</p>
          </div>
        </div>

        {/* Card 6: Lợi Nhuận Gộp (Gross Profit) */}
        <div className="bg-sky-50/50 border border-sky-200/60 rounded-2xl p-4 shadow-3xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">Lợi Nhuận Gộp</span>
            <span className="text-base">📈</span>
          </div>
          <div>
            <p className={`text-lg font-black tracking-tight ${financialSummary.totalGrossProfit >= 0 ? 'text-sky-600' : 'text-rose-600'}`}>
              {formatVND(financialSummary.totalGrossProfit)}
            </p>
            <p className="text-[10px] text-sky-700/80 font-bold mt-0.5">
              {financialSummary.totalNetPayout > 0 ? `Biên LN: ${((financialSummary.totalGrossProfit / financialSummary.totalNetPayout) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>

      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-3xs p-5 space-y-4">
        
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-3">
          
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { id: 'ALL', label: `Tất Cả (${periodFilteredOrders.length})` },
              { id: 'COMPLETED', label: '🟢 Hoàn Tất' },
              { id: 'DELIVERED', label: '🔒 Đã Giao (Tạm Giữ)' },
              { id: 'IN_TRANSIT', label: '🚚 Đang Vận Chuyển / Xử Lý' },
              { id: 'CANCELLED', label: '❌ Đã Hủy' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                  statusFilter === tab.id
                    ? 'bg-slate-800 text-white border-slate-800 shadow-3xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Tìm số HĐ (HD-XXXX), mã đơn, khách, SP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
            />
          </div>

        </div>

        {/* Invoices List Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Đang tải danh sách hóa đơn và đối soát tài chính...</p>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs space-y-2">
              <span className="text-3xl">📭</span>
              <p>Không có hóa đơn bán hàng nào trong kỳ này hoặc theo bộ lọc hiện tại.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200/80">
                  <th className="py-3 px-3">Số HĐ & Ngày Lập</th>
                  <th className="py-3 px-3">Người Mua Hàng</th>
                  <th className="py-3 px-3">Danh Mục Sản Phẩm (Snapshot)</th>
                  <th className="py-3 px-3 text-right">Tổng Tiền Hàng</th>
                  <th className="py-3 px-3 text-right">Chiết Khấu Sàn</th>
                  <th className="py-3 px-3 text-right">Thực Thu Về Ví</th>
                  <th className="py-3 px-3 text-right">Lợi Nhuận Gộp</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {displayedOrders.map(order => {
                  const invoiceNo = `HD-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`
                  const itemSubtotal = order.items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
                  const itemCOGS = order.items.reduce((sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1), 0)
                  const shopDiscount = (order as any).shopDiscountAmount || 0
                  const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
                  const commRate = (order as any).commissionRate ?? commissionRate
                  const commAmount = Math.round(netSubtotal * (commRate / 100))
                  const isCancelled = ['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status)
                  const netPayout = isCancelled ? 0 : Math.max(0, netSubtotal - commAmount)
                  const grossProfit = isCancelled ? 0 : (netPayout - itemCOGS)

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      
                      {/* Số Hóa Đơn & Ngày */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-black text-rose-600 text-xs block">
                          {invoiceNo}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">#{order.id.slice(-8)}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{formatDate(order.createdAt)}</p>
                      </td>

                      {/* Người Mua */}
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-800 text-xs">{order.buyerName || 'Khách Vãng Lai'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{order.buyerPhone || 'N/A'}</p>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm font-semibold">
                          {order.paymentMethod}
                        </span>
                      </td>

                      {/* Danh mục sản phẩm với đơn giá bất biến */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                              <span className="truncate max-w-[160px] font-medium text-slate-700" title={it.name}>
                                • {it.name} {it.variant ? `(${it.variant})` : ''}
                              </span>
                              <span className="font-mono text-slate-500 shrink-0 font-bold">
                                x{it.quantity} ({formatVND(it.price)})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Tổng Tiền Hàng */}
                      <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                        {formatVND(itemSubtotal)}
                      </td>

                      {/* Chiết khấu sàn */}
                      <td className="py-3.5 px-3 text-right font-semibold text-amber-600">
                        -{formatVND(commAmount)}
                        <span className="block text-[9px] text-slate-400 font-normal">({commRate}%)</span>
                      </td>

                      {/* Thực thu */}
                      <td className="py-3.5 px-3 text-right font-black text-emerald-600 text-xs">
                        {isCancelled ? <span className="text-slate-400 italic font-normal">0đ</span> : formatVND(netPayout)}
                      </td>

                      {/* Lợi nhuận gộp */}
                      <td className="py-3.5 px-3 text-right font-black text-sky-700 text-xs">
                        {isCancelled ? (
                          <span className="text-slate-400 italic font-normal">0đ</span>
                        ) : (
                          <span className={grossProfit >= 0 ? 'text-sky-700' : 'text-rose-600'}>
                            {formatVND(grossProfit)}
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-3 text-center">
                        {order.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black">
                            ✓ Hoàn Tất
                          </span>
                        ) : order.status === 'DELIVERED' ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black">
                            🔒 Tạm Giữ
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[9px] font-black">
                            ✕ Đã Hủy
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-[9px] font-black">
                            🚚 Đang Xử Lý
                          </span>
                        )}
                      </td>

                      {/* Thao tác Xem & In Hóa Đơn */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrderForInvoice(order)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[10px] font-extrabold cursor-pointer transition flex items-center gap-1 mx-auto shadow-3xs"
                          title="Xem bản thể hiện Hóa đơn điện tử và In ấn"
                        >
                          <span>📄</span> Xem Hóa Đơn
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

      {/* E-Invoice Modal */}
      {selectedOrderForInvoice && (
        <InvoiceDetailModal
          order={selectedOrderForInvoice}
          shopDetails={shopDetails}
          shopName={shopDetails?.name}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}

    </div>
  )
}
