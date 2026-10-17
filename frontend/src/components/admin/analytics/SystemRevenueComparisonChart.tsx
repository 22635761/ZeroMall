import React, { useState, useMemo } from 'react'

interface SystemRevenueComparisonChartProps {
  allOrders: any[]
  commissionRate: number
}

interface DataPoint {
  label: string
  subLabel?: string
  gmv: number
  commission: number
  orderCount: number
  completedOrderCount: number
  gmvGrowth?: number | null
  commissionGrowth?: number | null
}

export const SystemRevenueComparisonChart: React.FC<SystemRevenueComparisonChartProps> = ({
  allOrders
}) => {
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [metricMode, setMetricMode] = useState<'BOTH' | 'GMV' | 'COMMISSION'>('BOTH')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // 1. Phân tích danh sách năm thực tế từ CSDL
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear()
    const years = allOrders
      .map(o => {
        try {
          const y = new Date(o.createdAt).getFullYear()
          return isNaN(y) ? null : y
        } catch {
          return null
        }
      })
      .filter((y): y is number => y !== null)

    const unique = Array.from(new Set([currentY, ...years])).sort((a, b) => b - a)
    return unique.length > 0 ? unique : [currentY]
  }, [allOrders])

  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (allOrders.length > 0 && allOrders[0]?.createdAt) {
      const d = new Date(allOrders[0].createdAt)
      if (!isNaN(d.getTime())) return d.getFullYear()
    }
    return new Date().getFullYear()
  })

  // 2. Helpers tính toán GMV và Doanh thu hoa hồng
  const getOrderItemSubtotal = (o: any) => {
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
    }
    return Math.max(0, (Number(o.totalAmount) || 0) - (Number(o.shippingFee) || 0))
  }

  const isValidGmvOrder = (o: any) => {
    const invalidStatuses = ['CANCELLED', 'REFUNDED', 'RETURNED', 'REFUND_PENDING', 'RETURN_PENDING', 'PENDING', 'PENDING_PAYMENT', 'UNPAID']
    return !invalidStatuses.includes(o.status)
  }

  const getOrderCommAmount = (o: any) => {
    const itemSubtotal = getOrderItemSubtotal(o)
    const shopDiscount = Number(o.shopDiscountAmount) || 0
    const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
    const rate = Number(o.commissionRate) || 5
    return Math.round(netSubtotal * (rate / 100))
  }

  // 3. Chuẩn bị tập dữ liệu theo Tháng hoặc theo Năm
  const chartData: DataPoint[] = useMemo(() => {
    if (viewMode === 'MONTHLY') {
      // 12 Tháng của năm selectedYear
      const points: DataPoint[] = []
      for (let m = 1; m <= 12; m++) {
        const monthOrders = allOrders.filter(o => {
          if (!o.createdAt) return false
          const d = new Date(o.createdAt)
          return d.getFullYear() === selectedYear && d.getMonth() + 1 === m
        })

        const validOrders = monthOrders.filter(isValidGmvOrder)
        const completedOrders = monthOrders.filter(o => o.status === 'COMPLETED')

        const gmv = validOrders.reduce((sum, o) => sum + getOrderItemSubtotal(o), 0)
        const commission = completedOrders.reduce((sum, o) => sum + getOrderCommAmount(o), 0)

        points.push({
          label: `Tháng ${m < 10 ? '0' + m : m}`,
          subLabel: `T${m}/${selectedYear}`,
          gmv,
          commission,
          orderCount: validOrders.length,
          completedOrderCount: completedOrders.length
        })
      }

      // Tính % tăng trưởng so với tháng trước
      return points.map((p, idx, arr) => {
        if (idx === 0) return { ...p, gmvGrowth: null, commissionGrowth: null }
        const prev = arr[idx - 1]
        const gmvGrowth = prev.gmv > 0 ? ((p.gmv - prev.gmv) / prev.gmv) * 100 : p.gmv > 0 ? 100 : 0
        const commGrowth = prev.commission > 0 ? ((p.commission - prev.commission) / prev.commission) * 100 : p.commission > 0 ? 100 : 0
        return { ...p, gmvGrowth, commissionGrowth: commGrowth }
      })
    } else {
      // THEO TỪNG NĂM (sắp xếp tăng dần theo thời gian)
      const sortedYears = [...availableYears].sort((a, b) => a - b)
      const points: DataPoint[] = sortedYears.map(year => {
        const yearOrders = allOrders.filter(o => {
          if (!o.createdAt) return false
          const d = new Date(o.createdAt)
          return d.getFullYear() === year
        })

        const validOrders = yearOrders.filter(isValidGmvOrder)
        const completedOrders = yearOrders.filter(o => o.status === 'COMPLETED')

        const gmv = validOrders.reduce((sum, o) => sum + getOrderItemSubtotal(o), 0)
        const commission = completedOrders.reduce((sum, o) => sum + getOrderCommAmount(o), 0)

        return {
          label: `Năm ${year}`,
          subLabel: `${year}`,
          gmv,
          commission,
          orderCount: validOrders.length,
          completedOrderCount: completedOrders.length
        }
      })

      // Tính % tăng trưởng năm (YoY)
      return points.map((p, idx, arr) => {
        if (idx === 0) return { ...p, gmvGrowth: null, commissionGrowth: null }
        const prev = arr[idx - 1]
        const gmvGrowth = prev.gmv > 0 ? ((p.gmv - prev.gmv) / prev.gmv) * 100 : p.gmv > 0 ? 100 : 0
        const commGrowth = prev.commission > 0 ? ((p.commission - prev.commission) / prev.commission) * 100 : p.commission > 0 ? 100 : 0
        return { ...p, gmvGrowth, commissionGrowth: commGrowth }
      })
    }
  }, [allOrders, viewMode, selectedYear, availableYears])

  // 4. Tìm giá trị lớn nhất để làm tỉ lệ chiều cao cột (Max Value)
  const maxGmv = Math.max(...chartData.map(d => d.gmv), 1000)
  const maxComm = Math.max(...chartData.map(d => d.commission), 1000)

  // Làm tròn trần số đẹp cho trục Y
  const roundCeil = (val: number) => {
    if (val <= 1000) return 1000
    const magnitude = Math.pow(10, Math.floor(Math.log10(val)))
    return Math.ceil(val / magnitude) * magnitude
  }

  // Thang đo trục trái & trục phải (Dual-Axis Pattern)
  const leftMax = metricMode === 'COMMISSION' ? roundCeil(maxComm) : roundCeil(maxGmv)
  const rightMax = metricMode === 'BOTH' ? roundCeil(maxComm) : null

  // Format tiền tệ rút gọn cho trục Y (5Tr, 500k, 0đ...)
  const formatCompactMoney = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}Tỷ`
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Tr`
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
    return `${val}đ`
  }

  const formatVND = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  // Tính tổng kỳ hiện tại
  const totalGmvInView = chartData.reduce((sum, d) => sum + d.gmv, 0)
  const totalCommInView = chartData.reduce((sum, d) => sum + d.commission, 0)
  const totalOrdersInView = chartData.reduce((sum, d) => sum + d.orderCount, 0)

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
      {/* 1. Header Toolbar: Bộ chọn Mốc thời gian & Bộ chọn Chỉ số */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h3 className="text-base font-black text-slate-800 tracking-tight">
              TRỰC QUAN HÓA SO SÁNH DOANH THU & THU NHẬP SÀN
            </h3>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              {viewMode === 'MONTHLY' ? `12 Tháng / Năm ${selectedYear}` : `So Sánh Giữa Các Năm`}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Biểu đồ trực quan so sánh GMV Toàn Sàn và Doanh Thu Chiết Khấu Sàn theo từng chu kỳ
          </p>
        </div>

        {/* Cụm Nút Điều Khiển */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc Chỉ Số (Metric Mode) */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMetricMode('BOTH')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer select-none ${
                metricMode === 'BOTH'
                  ? 'bg-white text-slate-900 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả hai
            </button>
            <button
              onClick={() => setMetricMode('GMV')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 ${
                metricMode === 'GMV'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Chỉ GMV
            </button>
            <button
              onClick={() => setMetricMode('COMMISSION')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 ${
                metricMode === 'COMMISSION'
                  ? 'bg-indigo-600 text-white shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Chỉ Chiết Khấu Sàn
            </button>
          </div>

          {/* Chọn Mốc Thời Gian: Theo Tháng vs Theo Năm */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setViewMode('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1 ${
                viewMode === 'MONTHLY'
                  ? 'bg-slate-900 text-white font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📅</span> Theo Từng Tháng
            </button>
            <button
              onClick={() => setViewMode('YEARLY')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1 ${
                viewMode === 'YEARLY'
                  ? 'bg-slate-900 text-white font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🗓️</span> Theo Từng Năm
            </button>
          </div>

          {/* Nếu ở chế độ Theo Tháng: Cho phép chọn Năm xem 12 tháng */}
          {viewMode === 'MONTHLY' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-800 shadow-2xs focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 2. Top Banner Tóm Tắt Nhanh Kỳ Đang Xem */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg text-emerald-600 shrink-0 font-bold">
            🌱
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {viewMode === 'MONTHLY' ? `Tổng GMV Cả Năm ${selectedYear}` : `Tổng GMV Các Năm`}
            </div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              {formatVND(totalGmvInView)}
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg text-indigo-600 shrink-0 font-bold">
            💰
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {viewMode === 'MONTHLY' ? `Doanh Thu Chiết Khấu Sàn ${selectedYear}` : `Tổng Chiết Khấu Các Năm`}
            </div>
            <div className="text-lg font-black text-indigo-700 mt-0.5">
              {formatVND(totalCommInView)}
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-lg text-sky-600 shrink-0 font-bold">
            📦
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Tổng Đơn Hàng Thành Công
            </div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {totalOrdersInView} đơn
            </div>
          </div>
        </div>
      </div>

      {/* 3. Giao Diện Biểu Đồ Cột Đôi (Interactive SVG Bar Chart) */}
      <div className="p-6 relative select-none">
        {/* Chú thích màu sắc (Legend) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs font-bold text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            {(metricMode === 'BOTH' || metricMode === 'GMV') && (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500 shadow-2xs"></span>
                <span>
                  Tổng GMV Toàn Sàn{' '}
                  {metricMode === 'BOTH' && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Trục Trái
                    </span>
                  )}
                </span>
              </div>
            )}
            {(metricMode === 'BOTH' || metricMode === 'COMMISSION') && (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-indigo-600 shadow-2xs"></span>
                <span>
                  Doanh Thu Chiết Khấu Sàn{' '}
                  {metricMode === 'BOTH' && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Trục Phải
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
          {metricMode === 'BOTH' && (
            <span className="text-[11px] text-slate-400 font-medium italic hidden sm:inline">
              * Biểu đồ sử dụng Trục Kép (Dual-Axis) cân đối trực quan giữa 2 thang đo
            </span>
          )}
        </div>

        {/* Khung Biểu Đồ SVG Cố Định Tỉ Lệ */}
        <div className="h-64 sm:h-72 w-full flex items-end gap-2 pt-6 pb-6 relative border-b border-slate-200">
          {/* Đường lưới nền nét đứt (Horizontal Grid Lines & Dual Axes) */}
          <div className="absolute inset-x-0 inset-y-6 flex flex-col justify-between pointer-events-none">
            {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
              <div key={ratio} className="w-full flex items-center justify-between border-b border-slate-200/80 border-dashed">
                {/* Trục Y Bên Trái */}
                <span className="text-[10px] font-mono text-slate-400 font-semibold -mt-2 w-12 text-left shrink-0">
                  {formatCompactMoney(leftMax * ratio)}
                </span>
                {/* Trục Y Bên Phải (Khi xem Cả hai) */}
                {metricMode === 'BOTH' && rightMax !== null && (
                  <span className="text-[10px] font-mono text-indigo-400 font-semibold -mt-2 w-12 text-right shrink-0">
                    {formatCompactMoney(rightMax * ratio)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Các cụm cột dữ liệu */}
          <div className={`w-full h-full flex items-end justify-around ${metricMode === 'BOTH' ? 'pl-14 pr-14' : 'pl-14 pr-4'} relative z-10`}>
            {chartData.map((item, idx) => {
              // Chiều cao tương đối tính theo % (tối đa 85% chiều cao)
              const gmvHeight = leftMax > 0 ? (item.gmv / leftMax) * 85 : 0
              // Khi metricMode === 'BOTH': commHeight tính theo rightMax (thang đo hoa hồng độc lập). Khi chỉ xem COMMISSION: tính theo leftMax (vì leftMax = maxComm)
              const commTargetMax = (metricMode === 'BOTH' && rightMax) ? rightMax : leftMax
              const commHeight = commTargetMax > 0 ? (item.commission / commTargetMax) * 85 : 0

              const isHovered = hoveredIndex === idx
              const isSingleMode = metricMode !== 'BOTH'

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex-1 max-w-[56px] h-full flex flex-col justify-end items-center group cursor-pointer relative"
                >
                  {/* Tooltip Nổi Chi Tiết Khi Rê Chuột */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-3 z-50 bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl text-xs w-60 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-left">
                      <div className="font-black text-emerald-400 text-sm border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{item.orderCount} đơn</span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> GMV Toàn Sàn:
                          </span>
                          <span className="font-extrabold text-white">{formatVND(item.gmv)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Chiết Khấu Sàn:
                          </span>
                          <span className="font-extrabold text-indigo-300">{formatVND(item.commission)}</span>
                        </div>

                        {item.gmvGrowth !== null && item.gmvGrowth !== undefined && (
                          <div className="pt-1.5 mt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Tăng trưởng GMV:</span>
                            <span className={`font-bold ${item.gmvGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.gmvGrowth >= 0 ? `+${item.gmvGrowth.toFixed(1)}% ↗` : `${item.gmvGrowth.toFixed(1)}% ↘`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cụm Cột Song Song */}
                  <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                    {/* Cột 1: GMV Toàn Sàn */}
                    {(metricMode === 'BOTH' || metricMode === 'GMV') && (
                      <div
                        style={{ height: `${Math.max(gmvHeight, item.gmv > 0 ? 4 : 0)}%` }}
                        className={`${isSingleMode ? 'w-5 sm:w-6' : 'w-2.5 sm:w-3.5'} rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-emerald-400 shadow-md ring-2 ring-emerald-300/40'
                            : 'bg-emerald-500/90 hover:bg-emerald-400'
                        }`}
                      ></div>
                    )}

                    {/* Cột 2: Doanh Thu Chiết Khấu Sàn */}
                    {(metricMode === 'BOTH' || metricMode === 'COMMISSION') && (
                      <div
                        style={{ height: `${Math.max(commHeight, item.commission > 0 ? 4 : 0)}%` }}
                        className={`${isSingleMode ? 'w-5 sm:w-6' : 'w-2.5 sm:w-3.5'} rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-indigo-500 shadow-md ring-2 ring-indigo-300/40'
                            : 'bg-indigo-600/90 hover:bg-indigo-500'
                        }`}
                      ></div>
                    )}
                  </div>

                  {/* Nhãn trục X phía dưới (T01, T02... hoặc 2025, 2026...) */}
                  <div className="text-[11px] font-bold text-slate-500 mt-2 truncate max-w-full text-center">
                    {item.subLabel || item.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. Bảng Đối Soát Chi Tiết Tăng Trưởng Đi Kèm (Data Breakdown Table) */}
      <div className="border-t border-slate-100 bg-slate-50/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>📋</span> Bảng Đối Soát Chi Tiết & Tỷ Lệ Tăng Trưởng
          </h4>
          <span className="text-[11px] font-bold text-slate-400">
            Dữ liệu kết xuất từ CSDL thời gian thực
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Kỳ Báo Cáo</th>
                <th className="py-3 px-4">Số Đơn Hàng</th>
                <th className="py-3 px-4">Tổng GMV Toàn Sàn</th>
                <th className="py-3 px-4">Doanh Thu Chiết Khấu Sàn</th>
                <th className="py-3 px-4 text-right">Tăng Trưởng GMV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {chartData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    {row.label}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800">{row.orderCount}</span> đơn
                  </td>
                  <td className="py-3 px-4 font-black text-emerald-700">
                    {formatVND(row.gmv)}
                  </td>
                  <td className="py-3 px-4 font-black text-indigo-700">
                    {formatVND(row.commission)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {row.gmvGrowth === null || row.gmvGrowth === undefined ? (
                      <span className="text-slate-400 font-bold">—</span>
                    ) : row.gmvGrowth >= 0 ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{row.gmvGrowth.toFixed(1)}% ↗
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        {row.gmvGrowth.toFixed(1)}% ↘
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
