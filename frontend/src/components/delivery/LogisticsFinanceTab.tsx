import React, { useState } from 'react'

export interface Hub {
  id: string
  code: string
  name: string
  type: string
  address: string
  province: string
  district: string
  drivers?: any[]
  _count?: { shipments?: number; drivers?: number }
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicleNumber: string
  vehicleType: string
  status: string
  hubId?: string
  hub?: { id?: string; name: string; code?: string }
}

export interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  sellerId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  pickupAddress?: {
    name?: string
    contactName?: string
    phone?: string
    province?: string
    district?: string
  }
  declaredValue: number
  codAmount: number
  shippingFee: number
  status: string
  createdAt: string
  currentHubId?: string
  currentHub?: { id?: string; name: string; code: string }
  assignments?: Array<{
    id: string
    type: string
    status: string
    driver?: { id?: string; name: string; phone: string; vehicleNumber?: string }
  }>
}

export interface LogisticsFinanceTabProps {
  shipments: Shipment[]
  hubs?: Hub[]
  drivers?: Driver[]
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

// Helper xác định cụm Mega SOC chủ quản
const getParentSoc = (hub: { province?: string; code?: string }) => {
  const p = (hub.province || '').toLowerCase()
  if (p.includes('hồ chí minh') || p.includes('đồng nai') || p.includes('bình dương')) {
    return { id: 'hub-hcm-01', code: 'HCM01', name: 'Trung Tâm Phân Loại Bắc Củ Chi SOC' }
  }
  if (p.includes('hà nội') || p.includes('hoà bình') || p.includes('hòa bình') || p.includes('bắc ninh')) {
    return { id: 'hub-hn-01', code: 'HN01', name: 'Trung Tâm Phân Loại Mê Linh SOC' }
  }
  if (p.includes('đà nẵng') || p.includes('quảng nam') || p.includes('huế')) {
    return { id: 'hub-dng-soc', code: 'DNG01', name: 'Trung Tâm Phân Loại Hòa Cầm SOC' }
  }
  return { id: 'hub-ct-soc', code: 'CT01', name: 'Trung Tâm Phân Loại Trà Nóc SOC' }
}

// Helper phân tích bưu kiện vào đúng Hub đích dựa trên địa chỉ thực tế và tài xế
const matchShipmentToHub = (s: Shipment, allHubs: Hub[]): Hub | undefined => {
  const destHubs = allHubs.filter((h) => h.type !== 'SORTING_CENTER')
  if (destHubs.length === 0) return undefined

  if (s.currentHubId) {
    const direct = destHubs.find((h) => h.id === s.currentHubId)
    if (direct) return direct
  }
  if (s.currentHub?.code) {
    const directCode = destHubs.find((h) => h.code === s.currentHub?.code)
    if (directCode) return directCode
  }

  const driverName = (s.assignments?.[0]?.driver?.name || '').toLowerCase()
  if (driverName.includes('hòa bình')) return destHubs.find((h) => h.code === 'HB01')
  if (driverName.includes('biên hòa')) return destHubs.find((h) => h.code === 'DN01')
  if (driverName.includes('ninh kiều')) return destHubs.find((h) => h.code === 'NK01')
  if (driverName.includes('quận 1')) return destHubs.find((h) => h.code === 'Q01')
  if (driverName.includes('cầu giấy')) return destHubs.find((h) => h.code === 'CG01')

  const addr = (s.deliveryAddress || '').toLowerCase()
  if (addr.includes('hòa bình')) return destHubs.find((h) => h.code === 'HB01')
  if (addr.includes('biên hòa') || addr.includes('đồng nai')) return destHubs.find((h) => h.code === 'DN01')
  if (addr.includes('quận 1') || addr.includes('hai bà trưng') || addr.includes('phạm ngũ lão')) return destHubs.find((h) => h.code === 'Q01')
  if (addr.includes('thủ đức')) return destHubs.find((h) => h.code === 'TD01')
  if (addr.includes('an giang') || addr.includes('cần thơ') || addr.includes('ninh kiều')) return destHubs.find((h) => h.code === 'NK01')
  if (addr.includes('cầu giấy')) return destHubs.find((h) => h.code === 'CG01')
  if (addr.includes('đống đa')) return destHubs.find((h) => h.code === 'DD01')
  if (addr.includes('thanh xuân')) return destHubs.find((h) => h.code === 'TX01')
  if (addr.includes('đà nẵng') || addr.includes('hải châu')) return destHubs.find((h) => h.code === 'HC01')

  return destHubs.find((h) => h.code === 'TB01') || destHubs[0]
}

export const LogisticsFinanceTab: React.FC<LogisticsFinanceTabProps> = ({
  shipments,
  hubs = [],
  drivers = [],
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [activeFinanceView, setActiveFinanceView] = useState<'OVERVIEW' | 'BRANCH_PL' | 'LEDGER'>(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const fview = params?.get('fview') as any
    if (fview && ['OVERVIEW', 'BRANCH_PL', 'LEDGER'].includes(fview)) return fview
    return 'OVERVIEW'
  })

  // Đơn hợp lệ (không bị hủy)
  const validShipments = shipments.filter((s) => s.status !== 'CANCELLED')

  // Tổng doanh thu cước vận chuyển (nếu không có cước thì tính định mức 25.000đ)
  const totalShippingFeeCollected = validShipments.reduce(
    (sum, s) => sum + (s.shippingFee > 0 ? s.shippingFee : 25000),
    0
  )

  // 1. Phân bổ cơ cấu 3 nguồn tiền thu vào theo thực tế TMĐT cấp cao (Shopee / SPX):
  // - 40% cước Khách hàng trả trực tiếp
  // - 35% Sàn tài trợ Freeship (Ngân sách Marketing & Voucher Platform)
  // - 25% Quỹ Gói Dịch Vụ Shop Freeship Xtra (Trích 6% hoa hồng người bán đăng ký)
  const buyerPaidRevenue = Math.round(totalShippingFeeCollected * 0.4)
  const platformFreeshipSubsidy = Math.round(totalShippingFeeCollected * 0.35)
  const shopXtraServiceFeePool = Math.round(totalShippingFeeCollected * 0.25)

  // 2. Chi phí First Mile: Lấy hàng từ kho người bán (8.000đ/đơn đã lấy)
  const pickedUpShipments = validShipments.filter((s) =>
    ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalFirstMileCost = pickedUpShipments.length * 8000

  // 3. Chi phí Middle Mile: Xe tải thùng Linehaul liên tỉnh & Chi phí điện/máy móc trung tâm Mega SOC
  const middleMileShipments = validShipments.filter((s) =>
    ['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalMiddleMileCost = middleMileShipments.length * 10000

  // 4. Chi phí Last Mile: Công Shipper giao tận cửa (8.000đ công giao + 1.500đ thưởng KPI)
  const deliveredShipments = validShipments.filter((s) =>
    ['DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalLastMileCost = deliveredShipments.length * 9500

  // 5. Chi phí rủi ro đơn hoàn & bom hàng (RTO)
  const failedShipments = validShipments.filter((s) =>
    ['DELIVERY_FAILED', 'RETURNING', 'RETURNED'].includes(s.status)
  )
  const totalReturnCost = failedShipments.length * 12000

  // 6. Lợi nhuận ròng của Sàn (Net Margin / EBITDA Logistics)
  const totalLogisticsCost = totalFirstMileCost + totalMiddleMileCost + totalLastMileCost + totalReturnCost
  const platformLogisticsProfit = totalShippingFeeCollected - totalLogisticsCost
  const profitMarginPercent = totalShippingFeeCollected > 0
    ? Math.round((platformLogisticsProfit / totalShippingFeeCollected) * 100)
    : 0

  // Danh sách các Hub bưu cục vệ tinh và tính toán P&L từng chi nhánh
  const destinationHubs = hubs.filter((h) => h.type !== 'SORTING_CENTER')
  const branchPerformance = destinationHubs.map((hub) => {
    const parentSoc = getParentSoc(hub)
    const hubDrivers = drivers.filter((d) => d.hubId === hub.id)
    const hubShipments = validShipments.filter((s) => {
      const matched = matchShipmentToHub(s, hubs)
      return matched?.id === hub.id
    })

    const hubDelivered = hubShipments.filter((s) => ['DELIVERED', 'COMPLETED'].includes(s.status))
    const hubPicked = hubShipments.filter((s) =>
      ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
    )

    // Doanh thu cước tại Hub
    const hubRevenue = hubShipments.reduce((sum, s) => sum + (s.shippingFee > 0 ? s.shippingFee : 25000), 0)
    
    // Chi phí hoạt động của Hub: Công lấy + Công giao + Xe tải phân bổ (5.000đ/đơn)
    const hubCost = (hubPicked.length * 8000) + (hubDelivered.length * 9500) + (hubShipments.length * 5000)
    const hubProfit = hubRevenue - hubCost
    const hubMargin = hubRevenue > 0 ? Math.round((hubProfit / hubRevenue) * 100) : 0

    return {
      hub,
      parentSoc,
      driverCount: hubDrivers.length,
      shipmentCount: hubShipments.length,
      deliveredCount: hubDelivered.length,
      revenue: hubRevenue,
      cost: hubCost,
      profit: hubProfit,
      margin: hubMargin,
    }
  }).sort((a, b) => b.profit - a.profit) // Sắp xếp theo chi nhánh có lợi nhuận đóng góp cao nhất

  // Lọc bảng sổ cái chi tiết
  const filteredShipments = validShipments.filter((s) => {
    if (filterStatus === 'ALL') return true
    if (filterStatus === 'DELIVERED') return ['DELIVERED', 'COMPLETED'].includes(s.status)
    if (filterStatus === 'IN_TRANSIT') return ['IN_TRANSIT', 'SORTING', 'AT_DESTINATION_HUB'].includes(s.status)
    if (filterStatus === 'PICKED_UP') return ['PICKED_UP', 'AT_ORIGIN_HUB'].includes(s.status)
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* 1. Header Khẳng Định Góc Nhìn Tài Chính Doanh Nghiệp (C-Level Executive View) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-black tracking-tight">
              Báo Cáo Tài Chính & P&L Sàn TMĐT (Executive P&L Dashboard)
            </h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Doanh Thu Thuần & Lợi Nhuận Ròng
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Màn hình quản trị dòng tiền cốt lõi dành cho <b>Ban Giám Đốc (C-Level)</b>: Phân bổ 3 nguồn doanh thu thực tế (Khách trả, Sàn trợ giá, Quỹ Shop Freeship Xtra) trừ đi Chi phí vận tải 3 chặng (First - Middle - Last Mile) để xác định <b>Lợi Nhuận Ròng Thu Về</b> và <b>Hiệu Quả Sinh Lời Của Từng Chi Nhánh Hub</b>.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl text-right shrink-0">
          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
            Tỷ Suất Lợi Nhuận Ròng (Net Margin)
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {profitMarginPercent}%
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
            Biên lợi nhuận gộp toàn sàn
          </span>
        </div>
      </div>

      {/* 2. 3 Thẻ Chỉ Số P&L Trọng Yếu Dành Cho Admin Sàn */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Doanh thu cước */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-3xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <span>💰</span> 1. Tổng Doanh Thu Cước ({validShipments.length} đơn)
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">Thu Vào</span>
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">
            {formatMoney(totalShippingFeeCollected)}
          </p>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>• Người mua trả trực tiếp (40%):</span>
              <b className="font-mono text-emerald-700">{formatMoney(buyerPaidRevenue)}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Sàn bù mã Freeship (35%):</span>
              <b className="font-mono text-amber-700">{formatMoney(platformFreeshipSubsidy)}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Quỹ dịch vụ Shop Xtra (25%):</span>
              <b className="font-mono text-purple-700">{formatMoney(shopXtraServiceFeePool)}</b>
            </div>
          </div>
        </div>

        {/* Tổng chi phí vận hành */}
        <div className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-3xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase flex items-center gap-1.5">
              <span>💸</span> 2. Chi Phí Vận Hành Toàn Tuyến
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-bold">Chi Ra</span>
          </div>
          <p className="text-3xl font-black text-rose-600 font-mono">
            {formatMoney(totalLogisticsCost)}
          </p>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>• Lương Shipper lấy hàng (First Mile):</span>
              <b className="font-mono text-slate-800">{formatMoney(totalFirstMileCost)}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Xe tải liên tỉnh & Kho Mega SOC:</span>
              <b className="font-mono text-slate-800">{formatMoney(totalMiddleMileCost)}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Lương Shipper giao tận tay (Last Mile):</span>
              <b className="font-mono text-slate-800">{formatMoney(totalLastMileCost)}</b>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Dự phòng hoàn hàng & bom hàng:</span>
              <b className="font-mono text-rose-600">{formatMoney(totalReturnCost)}</b>
            </div>
          </div>
        </div>

        {/* Lợi nhuận ròng của Sàn */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300 p-5 rounded-3xl shadow-3xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1.5">
              <span>🏆</span> 3. Lợi Nhuận Ròng Sàn Thu Về (P&L)
            </span>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">Net Profit</span>
          </div>
          <p className="text-3xl font-black text-emerald-700 font-mono">
            {formatMoney(platformLogisticsProfit)}
          </p>
          <div className="space-y-1.5 pt-2 border-t border-emerald-200/60 text-xs text-emerald-950">
            <p className="text-[11px] leading-relaxed">
              Số tiền thực tế Sàn kiếm được sau khi lấy <b>Tổng Doanh Thu Cước</b> trừ đi <b>Toàn Bộ Chi Phí Shipper & Xe Tải Vận Hành</b>.
            </p>
            <div className="flex justify-between font-bold pt-1 text-emerald-900">
              <span>Biên lợi nhuận ròng:</span>
              <span className="font-mono text-sm">{profitMarginPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thanh Điều Hướng Chế Độ Xem Báo Cáo */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFinanceView('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeFinanceView === 'OVERVIEW'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📊</span> Tổng Quan Kinh Tế Đơn Vị (Unit Economics)
          </button>

          <button
            onClick={() => setActiveFinanceView('BRANCH_PL')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeFinanceView === 'BRANCH_PL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🏢</span> Báo Cáo P&L Theo Từng Chi Nhánh Hub ({destinationHubs.length})
          </button>

          <button
            onClick={() => setActiveFinanceView('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeFinanceView === 'LEDGER'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📋</span> Sổ Cái Tra Cứu Vận Đơn ({validShipments.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Dữ liệu tài chính hợp nhất từ mạng lưới ZeroExpress
        </span>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: TỔNG QUAN KINH TẾ ĐƠN VỊ & CƠ CẤU NGUỒN TIỀN */}
      {/* ========================================================================= */}
      {activeFinanceView === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Cơ Cấu Nguồn Tiền Thu Vào (3 Nguồn) */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">💰</span>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Cơ Cấu 3 Nguồn Tiền Thu Vào Của Cước Vận Chuyển ({formatMoney(totalShippingFeeCollected)})
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Hạch toán dòng tiền chuẩn Shopee Express
              </span>
            </div>

            {/* Thanh tỷ lệ 3 màu */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div style={{ width: '40%' }} className="bg-emerald-500" title="Khách trả: 40%" />
              <div style={{ width: '35%' }} className="bg-amber-500" title="Sàn Freeship: 35%" />
              <div style={{ width: '25%' }} className="bg-purple-500" title="Quỹ Shop Xtra: 25%" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">1. Người Mua Trả Trực Tiếp (40%)</span>
                  <span className="font-mono font-black text-emerald-700">{formatMoney(buyerPaidRevenue)}</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                  Khách hàng thanh toán cước gốc khi không áp mã giảm giá hoặc vượt định mức cước tối đa của đơn hàng.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/50 border border-amber-200/70 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900">2. Sàn Tài Trợ Freeship (35%)</span>
                  <span className="font-mono font-black text-amber-700">{formatMoney(platformFreeshipSubsidy)}</span>
                </div>
                <p className="text-[11px] text-amber-800/80 leading-relaxed">
                  Ngân sách Marketing sàn bù tiền cước cho Delivery khi người mua áp mã Miễn Phí Vận Chuyển của sàn.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 border border-purple-200/70 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900">3. Quỹ Gói Shop Freeship Xtra (25%)</span>
                  <span className="font-mono font-black text-purple-700">{formatMoney(shopXtraServiceFeePool)}</span>
                </div>
                <p className="text-[11px] text-purple-800/80 leading-relaxed">
                  Trích từ phí dịch vụ gói 6% giá trị đơn hàng thu từ các Shop có đăng ký huy hiệu Freeship Xtra.
                </p>
              </div>
            </div>
          </div>

          {/* Sơ đồ minh họa dòng tiền 3 chặng thực tế */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  💡
                </span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Sơ Đồ Phân Bổ Chi Phí 1 Đơn Hàng Mẫu (Cước Chuẩn 25.000đ - 30.000đ)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Quy chuẩn hạch toán Shopee Express / SPX
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-700">1. First Mile (Lấy hàng)</span>
                  <span className="font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[10px]">
                    8.000đ
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tài xế nhận đơn, đến tận kho của Shop nhận bưu kiện và chở về Hub gốc (Bưu Cục gửi).
                </p>
                <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
                  Ghi nhận vào ví tài xế khi: <b>PICKED_UP</b>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sky-700">2. Middle Mile (Trung chuyển)</span>
                  <span className="font-mono font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md text-[10px]">
                    10.000đ
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Xe tải lớn vận chuyển liên tỉnh giữa các Hub + Phân loại tự động tại trung tâm Mega SOC.
                </p>
                <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
                  Chi phí xăng dầu, khấu hao & nhân công kho
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-orange-700">3. Last Mile (Giao khách)</span>
                  <span className="font-mono font-bold bg-orange-100 text-orange-900 px-2 py-0.5 rounded-md text-[10px]">
                    8.000đ - 9.500đ
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Shipper bưu cục đích nhận hàng, đi xe máy phát tận tay người mua và thu tiền COD (nếu có).
                </p>
                <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
                  Ghi nhận vào ví tài xế khi: <b>DELIVERED</b>
                </div>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-800">4. Lợi Nhuận Gộp Sàn</span>
                  <span className="font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[10px]">
                    ~4.000đ (13% - 18%)
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Doanh thu ròng của dịch vụ ZeroExpress sau khi bù trừ chi phí 3 chặng, dự phòng rủi ro và vận hành máy chủ.
                </p>
                <div className="text-[10px] text-emerald-700 border-t border-emerald-200/60 pt-1.5 font-bold">
                  Kết chuyển vào Quỹ Lợi Nhuận Sàn
                </div>
              </div>
            </div>
          </div>

          {/* Cẩm Nang Giải Trình Nghiệp Vụ & Nguồn Tiền Cho Admin Quản Trị */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-sm border border-indigo-800/40 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h3 className="text-sm font-black text-indigo-300 uppercase tracking-wide">
                Cẩm Nang Giải Trình Dòng Tiền & Nghiệp Vụ TMĐT Dành Cho Admin Sàn
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <span>🎟️</span>
                  <span>1. Khách mua thấy Freeship (0đ), tiền cước Delivery lấy từ đâu?</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <b>Delivery vẫn thu đủ 100% cước (ví dụ 25.000đ)</b>. Khoản tiền này được <b>Sàn bù tiền nội bộ từ Quỹ Marketing & Trợ Giá Sàn (Platform Subsidy)</b>. Tiền từ tài khoản doanh nghiệp Sàn sẽ tự động kết chuyển sang tài khoản doanh thu của ZeroExpress.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <span>⚡</span>
                  <span>2. Shop đăng ký Freeship Xtra, tiền đó có về Delivery không?</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <b>Có, và về theo tỷ lệ phân bổ!</b> Khi Shop đăng ký gói Xtra, Sàn thu <b>6% giá trị mỗi đơn hàng</b>. Số tiền này được hạch toán:
                  <br/>• <b>~70% đổ vào Quỹ Trợ Giá Cước Delivery:</b> Dùng để trả cước cho ZeroExpress khi khách áp voucher.
                  <br/>• <b>~30% giữ lại Sàn:</b> Phí nền tảng, quảng bá nhãn Xtra và ưu tiên hiển thị sản phẩm trên App.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-sky-300 font-bold">
                  <span>🚛</span>
                  <span>3. Trả lương Shipper và tiền xe tải Linehaul hạch toán ra sao?</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <b>Shipper xe máy:</b> Hưởng theo biến phí (8.000đ/đơn lấy + 8.000đ/đơn giao) cộng với <b>Thưởng năng suất ngày theo bậc thang</b>.
                  <br/>• <b>Xe tải liên tỉnh:</b> Hạch toán theo chuyến xe tải 8T - 15T chạy giữa các Mega SOC (Củ Chi ↔ Mê Linh ↔ Hòa Cầm ↔ Trà Nóc), chia bình quân ~4.000đ - 6.000đ/bưu kiện.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <span>🔄</span>
                  <span>4. Khách bom hàng / giao không thành công thì lỗ bao nhiêu?</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Đơn hoàn tốn <b>gấp 1.5 lần chi phí</b> (mất công giao 3 lần + xe tải chở ngược bưu kiện về Shop).
                  <br/>• Nếu lỗi do <b>Khách bom hàng</b>: Trích từ <b>Quỹ Rủi Ro & Đền Bù Logistics (0.5% cước tích lũy)</b>.
                  <br/>• Nếu lỗi do <b>Shop gửi sai / hàng cấm</b>: Sàn tự động khấu trừ cước hoàn 2 chiều vào Ví Doanh Thu của Shop.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BẢNG BÁO CÁO P&L & HIỆU QUẢ KINH DOANH THEO TỪNG CHI NHÁNH HUB */}
      {/* ========================================================================= */}
      {activeFinanceView === 'BRANCH_PL' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
            <span className="text-xl">🏢</span>
            <div className="space-y-1">
              <span className="font-black text-emerald-950 block">
                Bảng Cân Đối P&L & Hiệu Quả Sinh Lời Theo Từng Chi Nhánh Bưu Cục (Branch Contribution Margin):
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Đánh giá trực tiếp hiệu quả tài chính của từng bưu cục: <b>Doanh Thu Cước Đóng Góp</b> (tổng cước từ đơn hàng phát sinh trên địa bàn) trừ đi <b>Chi Phí Vận Hành Hub</b> (lương shipper lấy/giao và chi phí vận tải phân bổ) ➔ <b>Lợi Nhuận Ròng Đóng Góp Cho Sàn</b>.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Chi Nhánh Hub & Địa Bàn</th>
                    <th className="py-3.5 px-4">Cụm Mega SOC Chủ Quản</th>
                    <th className="py-3.5 px-4 text-center">Sản Lượng Đơn</th>
                    <th className="py-3.5 px-4 text-right">Doanh Thu Cước (1)</th>
                    <th className="py-3.5 px-4 text-right">Chi Phí Vận Hành (2)</th>
                    <th className="py-3.5 px-4 text-right">Lợi Nhuận Ròng (1 - 2)</th>
                    <th className="py-3.5 px-4 text-center">Tỷ Suất Margin</th>
                    <th className="py-3.5 px-4 text-center">Đánh Giá Hiệu Quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branchPerformance.map((item) => (
                    <tr key={item.hub.id} className="hover:bg-slate-50/80 transition">
                      {/* Chi nhánh Hub */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{item.hub.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                            {item.hub.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.hub.district}, {item.hub.province} • {item.driverCount} Shipper
                        </div>
                      </td>

                      {/* Mega SOC */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <span>🏭</span> {item.parentSoc.name.replace('Trung Tâm Phân Loại ', '')}
                        </span>
                      </td>

                      {/* Sản lượng */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-xs">
                          {item.shipmentCount} đơn
                        </span>
                        <div className="text-[10px] text-emerald-600 font-medium">
                          {item.deliveredCount} đã giao
                        </div>
                      </td>

                      {/* Doanh thu cước */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatMoney(item.revenue)}
                      </td>

                      {/* Chi phí */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        {formatMoney(item.cost)}
                      </td>

                      {/* Lợi nhuận ròng */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                        <span className={item.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {item.profit >= 0 ? '+' : ''}{formatMoney(item.profit)}
                        </span>
                      </td>

                      {/* Tỷ suất Margin */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-xs">
                        <span className={item.margin >= 15 ? 'text-emerald-600' : item.margin > 0 ? 'text-amber-600' : 'text-slate-400'}>
                          {item.margin}%
                        </span>
                      </td>

                      {/* Đánh giá hiệu quả */}
                      <td className="py-3.5 px-4 text-center">
                        {item.shipmentCount === 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                            Chờ phát sinh đơn
                          </span>
                        ) : item.profit > 50000 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>🏆</span> Sinh Lời Xuất Sắc
                          </span>
                        ) : item.profit >= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <span>✅</span> Vận Hành Hiệu Quả
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span>⚠️</span> Cần Tối Ưu Tuyến
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
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SỔ CÁI TRA CỨU VẬN ĐƠN CHI TIẾT */}
      {/* ========================================================================= */}
      {activeFinanceView === 'LEDGER' && (
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Sổ Cái Hạch Toán Từng Bưu Kiện ({filteredShipments.length} đơn)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chi tiết cước thu khách, công lấy hàng, phí trung chuyển và lợi nhuận sàn từng đơn
              </p>
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'DELIVERED', label: 'Đã phát giao' },
                { id: 'IN_TRANSIT', label: 'Đang trung chuyển' },
                { id: 'PICKED_UP', label: 'Đã lấy từ shop' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterStatus === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bảng dữ liệu */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-3xs max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-600">
                <tr>
                  <th className="text-left p-3">Mã Vận Đơn</th>
                  <th className="text-left p-3">Bưu Cục Hub Phụ Trách</th>
                  <th className="text-right p-3">Cước Vận Chuyển</th>
                  <th className="text-right p-3">Công Lấy (First Mile)</th>
                  <th className="text-right p-3">Công Giao (Last Mile)</th>
                  <th className="text-right p-3">Xe Tải Linehaul & Kho</th>
                  <th className="text-right p-3">Lợi Nhuận Sàn</th>
                  <th className="text-center p-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredShipments.map((s) => {
                  const fee = s.shippingFee > 0 ? s.shippingFee : 25000
                  const isPicked = ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
                  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(s.status)
                  const isMiddle = ['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)

                  const firstMile = isPicked ? 8000 : 0
                  const lastMile = isDelivered ? 9500 : 0
                  const middleMile = isMiddle ? 10000 : 0
                  const profit = isDelivered ? fee - 8000 - 9500 - 5000 : 0
                  const matchedHub = matchShipmentToHub(s, hubs)

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        <div>{s.trackingNumber}</div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal">
                          #{s.orderId}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-slate-800">
                          {matchedHub?.name.replace('Bưu Cục Giao Hàng ', '') || 'Bưu Cục Hub'}
                        </span>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{s.deliveryAddress}</div>
                      </td>

                      <td className="text-right p-3 font-mono font-bold text-slate-900">
                        {formatMoney(fee)}
                      </td>

                      <td className="text-right p-3 font-mono text-amber-700">
                        {firstMile > 0 ? formatMoney(firstMile) : '-'}
                      </td>

                      <td className="text-right p-3 font-mono text-orange-700">
                        {lastMile > 0 ? formatMoney(lastMile) : '-'}
                      </td>

                      <td className="text-right p-3 font-mono text-sky-700">
                        {middleMile > 0 ? formatMoney(middleMile) : '-'}
                      </td>

                      <td className="text-right p-3 font-mono font-bold">
                        {isDelivered ? (
                          <span className={profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal text-[11px]">Đang hạch toán</span>
                        )}
                      </td>

                      <td className="text-center p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'IN_TRANSIT'
                            ? 'bg-sky-100 text-sky-800'
                            : s.status === 'PICKED_UP'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
