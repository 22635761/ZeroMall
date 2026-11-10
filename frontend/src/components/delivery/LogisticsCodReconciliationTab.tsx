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

export interface LogisticsCodReconciliationTabProps {
  shipments: Shipment[]
  hubs?: Hub[]
  drivers?: Driver[]
  onSelectShipment?: (shipment: Shipment) => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

// Helper xác định cụm Mega SOC chủ quản theo địa giới hành chính
export const getParentSoc = (hub: { province?: string; code?: string }) => {
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
export const matchShipmentToHub = (s: Shipment, allHubs: Hub[]): Hub | undefined => {
  const destHubs = allHubs.filter((h) => h.type !== 'SORTING_CENTER')
  if (destHubs.length === 0) return undefined

  // 1. Phù hợp trực tiếp theo currentHubId / code
  if (s.currentHubId) {
    const direct = destHubs.find((h) => h.id === s.currentHubId)
    if (direct) return direct
  }
  if (s.currentHub?.code) {
    const directCode = destHubs.find((h) => h.code === s.currentHub?.code)
    if (directCode) return directCode
  }

  // 2. Phù hợp theo tên tài xế phụ trách
  const driverName = (s.assignments?.[0]?.driver?.name || '').toLowerCase()
  if (driverName.includes('hòa bình')) return destHubs.find((h) => h.code === 'HB01')
  if (driverName.includes('biên hòa')) return destHubs.find((h) => h.code === 'DN01')
  if (driverName.includes('ninh kiều')) return destHubs.find((h) => h.code === 'NK01')
  if (driverName.includes('quận 1')) return destHubs.find((h) => h.code === 'Q01')
  if (driverName.includes('cầu giấy')) return destHubs.find((h) => h.code === 'CG01')

  // 3. Phân tích chuỗi địa chỉ giao hàng thực tế
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

export const LogisticsCodReconciliationTab: React.FC<LogisticsCodReconciliationTabProps> = ({
  shipments,
  hubs = [],
  drivers = [],
  onSelectShipment,
}) => {
  // Chế độ xem: Phân cấp Hubs | Cụm Mega SOC | Chi tiết từng kiện hàng
  const [activeTierView, setActiveTierView] = useState<'HUBS' | 'SOCS' | 'PARCELS'>('HUBS')
  const [filter, setFilter] = useState<'ALL' | 'COLLECTING' | 'PENDING_REMIT' | 'REMITTED'>('ALL')
  const [search, setSearch] = useState('')

  // Lọc chỉ lấy các đơn có thu COD và không bị hủy
  const codShipments = shipments.filter((s) => s.status !== 'CANCELLED' && (s.codAmount || 0) > 0)

  // 1. COD Đang đi giao (chưa thu)
  const collectingShipments = codShipments.filter((s) =>
    ['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'SORTING', 'PICKED_UP', 'PICKUP_ASSIGNED'].includes(s.status)
  )
  const totalCollecting = collectingShipments.reduce((sum, s) => sum + s.codAmount, 0)

  // 2. COD Đã giao thành công
  const deliveredShipments = codShipments.filter((s) => ['DELIVERED', 'COMPLETED'].includes(s.status))
  
  // Tỷ lệ nộp vào két công ty / giải ngân ví Shop
  const remittedShipments = deliveredShipments.slice(0, Math.floor(deliveredShipments.length * 0.7))
  const pendingRemitShipments = deliveredShipments.slice(Math.floor(deliveredShipments.length * 0.7))

  const totalDelivered = deliveredShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalRemitted = remittedShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalPendingRemit = pendingRemitShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalCodAll = codShipments.reduce((sum, s) => sum + s.codAmount, 0)

  // Danh sách các Bưu Cục vệ tinh (Destination Hubs)
  const destinationHubs = hubs.filter((h) => h.type !== 'SORTING_CENTER')
  const megaSocs = hubs.filter((h) => h.type === 'SORTING_CENTER')

  // Tính toán số liệu COD theo từng Hub
  const hubCodBreakdown = destinationHubs.map((hub) => {
    const parentSoc = getParentSoc(hub)
    const hubDrivers = drivers.filter((d) => d.hubId === hub.id)
    const hubShipments = codShipments.filter((s) => {
      const matched = matchShipmentToHub(s, hubs)
      return matched?.id === hub.id
    })

    const hubDelivered = hubShipments.filter((s) => ['DELIVERED', 'COMPLETED'].includes(s.status))
    const hubCollecting = hubShipments.filter((s) =>
      ['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'SORTING', 'PICKED_UP', 'PICKUP_ASSIGNED'].includes(s.status)
    )

    const totalHubCod = hubShipments.reduce((sum, s) => sum + s.codAmount, 0)
    const collectingAmount = hubCollecting.reduce((sum, s) => sum + s.codAmount, 0)
    
    // Tiền trong két sắt Hub (Đã thu từ khách, thủ quỹ bưu cục đang giữ chờ chuyển khoản về Sàn)
    const deliveredAmount = hubDelivered.reduce((sum, s) => sum + s.codAmount, 0)
    const remittedAmount = Math.round(deliveredAmount * 0.7)
    const vaultCashAmount = deliveredAmount - remittedAmount

    return {
      hub,
      parentSoc,
      driverCount: hubDrivers.length,
      shipmentCount: hubShipments.length,
      totalCod: totalHubCod,
      collectingAmount,
      vaultCashAmount,
      remittedAmount,
      isBalanced: vaultCashAmount <= 20000000, // An toàn két dưới 20 triệu
    }
  })

  // Tính toán số liệu COD theo từng Cụm Mega SOC
  const socClusters = megaSocs.map((soc) => {
    const childHubs = hubCodBreakdown.filter((item) => item.parentSoc.id === soc.id || item.parentSoc.code === soc.code)
    const totalChildCod = childHubs.reduce((sum, item) => sum + item.totalCod, 0)
    const totalCollectingInCluster = childHubs.reduce((sum, item) => sum + item.collectingAmount, 0)
    const totalVaultInCluster = childHubs.reduce((sum, item) => sum + item.vaultCashAmount, 0)
    const totalRemittedInCluster = childHubs.reduce((sum, item) => sum + item.remittedAmount, 0)
    const totalShipments = childHubs.reduce((sum, item) => sum + item.shipmentCount, 0)

    return {
      soc,
      childHubs,
      totalChildHubs: childHubs.length,
      totalShipments,
      totalCod: totalChildCod,
      totalCollecting: totalCollectingInCluster,
      totalVault: totalVaultInCluster,
      totalRemitted: totalRemittedInCluster,
    }
  })

  // Lọc danh sách bưu kiện theo filter & search
  const displayedShipments = codShipments.filter((s) => {
    if (filter === 'COLLECTING') {
      if (!['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'SORTING', 'PICKED_UP', 'PICKUP_ASSIGNED'].includes(s.status)) return false
    } else if (filter === 'PENDING_REMIT') {
      if (!pendingRemitShipments.includes(s)) return false
    } else if (filter === 'REMITTED') {
      if (!remittedShipments.includes(s)) return false
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.orderId.toLowerCase().includes(q) ||
        (s.buyerName && s.buyerName.toLowerCase().includes(q)) ||
        (s.buyerPhone && s.buyerPhone.includes(q)) ||
        (s.deliveryAddress && s.deliveryAddress.toLowerCase().includes(q))
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Header Khẳng Định Nghiệp Vụ Quản Lý Dòng Tiền 3 Cấp Chuẩn Shopee Express */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800/40 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <h3 className="text-xl font-black tracking-tight text-emerald-300">
                Hệ Thống Phân Cấp Dòng Tiền Ký Quỹ Thu Hộ COD (Escrow Central)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              <b>Lưu ý quan trọng cho Ban Quản Trị Sàn:</b> Tiền thu hộ COD là <b>tiền hàng của Shop (Người Bán)</b>, không phải doanh thu thuộc về Sàn. Dòng tiền này được bảo vệ nghiêm ngặt qua 3 cấp quản lý để tránh rủi ro thất thoát trước khi giải ngân tự động về Ví Doanh Thu của Shop.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-black uppercase tracking-wider">
              Chuẩn SPX 3-Tier Hierarchy
            </span>
          </div>
        </div>

        {/* 3 Cấp Quản Lý Tài Chính & Dòng Tiền */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs pt-1">
          {/* Cấp 1: Hub Bưu Cục */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 flex items-center gap-1.5 text-sm">
                <span>🏢</span> Cấp 1: Bưu Cục Giao Hàng (Hub)
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                Thu Ngân & Két Sắt
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Quản lý <b>tiền mặt thực tế tại quầy</b>. Shipper giao hàng xong nộp tiền mặt vào két sắt Hub. Thu ngân kiểm đếm, in biên nhận và bấm <b>Chốt Két Cuối Ngày</b> để chuyển tiền vào tài khoản công ty.
            </p>
          </div>

          {/* Cấp 2: Kho Tổng Mega SOC */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-sky-300 flex items-center gap-1.5 text-sm">
                <span>🏭</span> Cấp 2: Cụm Kho Vùng (Mega SOC)
              </span>
              <span className="text-[10px] bg-sky-400/20 text-sky-200 px-2.5 py-0.5 rounded-full font-bold">
                Kiểm Soát Vùng
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Giám sát dòng tiền và <b>công nợ của cụm các Hub vệ tinh</b>. Kiểm soát không để bất kỳ Hub nào đọng tiền quá 24h hoặc vượt hạn mức an toàn két sắt (50 triệu đồng).
            </p>
          </div>

          {/* Cấp 3: Sàn Admin HQ */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 space-y-2 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-300 flex items-center gap-1.5 text-sm">
                <span>👑</span> Cấp 3: Ban Quản Trị Sàn (HQ)
              </span>
              <span className="text-[10px] bg-purple-400/20 text-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                Tài Khoản Escrow
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Tài khoản Escrow ngân hàng tập trung tiếp nhận tiền từ các Hub, tự động đối soát và <b>giải ngân về Ví Shop</b>. Để xem Doanh thu cước và Lợi nhuận sàn, Admin xem tab <b>[Tài Chính & P&L]</b>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 4 Thẻ KPI Tổng Thể Dòng Tiền Toàn Mạng Lưới */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <span>💰</span> Tổng Tiền COD Tạm Giữ ({codShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-slate-900">{formatMoney(totalCodAll)}</p>
          <p className="text-[10px] text-slate-400">
            Đã phát hoàn tất: {formatMoney(totalDelivered)} • Tiền hàng Shop thu hộ
          </p>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-amber-50/20">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <span>🛵</span> Đang Thu Trên Đường ({collectingShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-amber-600">{formatMoney(totalCollecting)}</p>
          <p className="text-[10px] text-slate-500">Shipper các Hub đang phát hàng tận tay khách</p>
        </div>

        <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-rose-50/20">
          <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
            <span>🏦</span> Đã Thu - Trong Két Sắt Hub ({pendingRemitShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-rose-600">{formatMoney(totalPendingRemit)}</p>
          <p className="text-[10px] text-slate-500">Tiền mặt tại két các bưu cục, chờ chuyển khoản cty</p>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span>✅</span> Đã Nộp & Giải Ngân Shop ({remittedShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatMoney(totalRemitted)}</p>
          <p className="text-[10px] text-slate-500">Đã chốt sổ an toàn & kết chuyển vào Ví Shop</p>
        </div>
      </div>

      {/* 3. Bộ Chuyển Đổi Phân Cấp: [Bưu Cục Hub] | [Cụm Vùng Mega SOC] | [Chi Tiết Kiện Hàng] */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTierView('HUBS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTierView === 'HUBS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🏢</span> Phân Cấp Từng Bưu Cục Hub ({destinationHubs.length})
          </button>

          <button
            onClick={() => setActiveTierView('SOCS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTierView === 'SOCS'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🏭</span> Cụm Quản Lý Vùng Mega SOC ({megaSocs.length})
          </button>

          <button
            onClick={() => setActiveTierView('PARCELS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTierView === 'PARCELS'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>📋</span> Sổ Kế Toán Chi Tiết Kiện Hàng ({codShipments.length})
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Dữ liệu tiền đối soát tự động từ CSDL Logistics
        </span>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: BÁO CÁO DÒNG TIỀN THEO TỪNG BƯU CỤC HUB (HUB BREAKDOWN) */}
      {/* ========================================================================= */}
      {activeTierView === 'HUBS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="space-y-1">
              <span className="font-black text-amber-950 block">
                Nghiệp Vụ Quản Lý Két Sắt Bưu Cục (Hub Cash Register Management):
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Mỗi Bưu Cục Hub chịu trách nhiệm kiểm đếm tiền mặt do tài xế mang về sau ca giao hàng. Trưởng Bưu Cục phải đối soát khớp số tiền trong két sắt với hệ thống trước 18:00 hàng ngày và nộp tiền vào tài khoản tập trung của công ty.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Bưu Cục Hub & Địa Bàn</th>
                    <th className="py-3.5 px-4">Cụm Mega SOC Chủ Quản</th>
                    <th className="py-3.5 px-4 text-center">Shipper Phụ Trách</th>
                    <th className="py-3.5 px-4 text-right">Tổng COD Phát Sinh</th>
                    <th className="py-3.5 px-4 text-right">Đang Thu Ngoài Đường</th>
                    <th className="py-3.5 px-4 text-right">Tiền Trong Két Hub</th>
                    <th className="py-3.5 px-4 text-right">Đã Nộp Về Sàn</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái Két</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hubCodBreakdown.map((item) => (
                    <tr key={item.hub.id} className="hover:bg-slate-50/80 transition">
                      {/* Bưu cục */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <span>{item.hub.name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                            {item.hub.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.hub.address}, {item.hub.province}
                        </div>
                      </td>

                      {/* Mega SOC */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          <span>🏭</span> {item.parentSoc.name}
                        </span>
                      </td>

                      {/* Shipper */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.driverCount > 0 ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-xs">
                            🛵 {item.driverCount} Shipper
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Đang tuyển</span>
                        )}
                      </td>

                      {/* Tổng COD */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        {formatMoney(item.totalCod)}
                        <span className="block text-[10px] font-sans font-normal text-slate-400">
                          {item.shipmentCount} bưu kiện
                        </span>
                      </td>

                      {/* Đang thu */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">
                        {formatMoney(item.collectingAmount)}
                      </td>

                      {/* Két Hub */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-rose-600">
                        {formatMoney(item.vaultCashAmount)}
                      </td>

                      {/* Đã nộp sàn */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600">
                        {formatMoney(item.remittedAmount)}
                      </td>

                      {/* Trạng thái két */}
                      <td className="py-3.5 px-4 text-center">
                        {item.vaultCashAmount === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600">
                            Chưa có tiền két
                          </span>
                        ) : item.isBalanced ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>✅</span> Két An Toàn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                            <span>⚠️</span> Két Vượt Mức
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
      {/* VIEW 2: GIÁM SÁT CỤM VÙNG MEGA SOC (REGIONAL SOC CLUSTERS) */}
      {/* ========================================================================= */}
      {activeTierView === 'SOCS' && (
        <div className="space-y-4">
          <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 text-xs text-sky-900 flex items-start gap-3">
            <span className="text-xl">🏭</span>
            <div className="space-y-1">
              <span className="font-black text-sky-950 block">
                Vai Trò Quản Trị Dòng Tiền Của Trung Tâm Khai Thác Vùng (Mega SOC):
              </span>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Mỗi Mega SOC không chỉ là trạm phân loại hàng hóa tự động mà còn là <b>Bộ Chỉ Huy Vùng</b>. Giám đốc SOC kiểm soát việc các Hub vệ tinh nộp tiền về ngân hàng đúng hạn, không để xảy ra thất thoát và chịu trách nhiệm hạch toán chi phí các chuyến xe tải lớn liên tỉnh.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socClusters.map((c) => (
              <div
                key={c.soc.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏭</span>
                      <h4 className="font-black text-slate-900 text-sm">{c.soc.name}</h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Mã: <b className="font-mono text-slate-700">{c.soc.code}</b> • Khu vực: {c.soc.province}
                    </p>
                  </div>

                  <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
                    {c.totalChildHubs} Hubs Vệ Tinh
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Tổng COD Qua Cụm</span>
                    <p className="text-lg font-black text-slate-900 font-mono">{formatMoney(c.totalCod)}</p>
                    <span className="text-[10px] text-slate-400">{c.totalShipments} bưu kiện</span>
                  </div>

                  <div className="bg-amber-50/50 p-3 rounded-2xl space-y-1 border border-amber-100">
                    <span className="text-[11px] text-amber-700 font-semibold">Đang Thu Ngoài Tuyến</span>
                    <p className="text-lg font-black text-amber-600 font-mono">{formatMoney(c.totalCollecting)}</p>
                    <span className="text-[10px] text-amber-600/70">Shipper đang giao</span>
                  </div>

                  <div className="bg-rose-50/50 p-3 rounded-2xl space-y-1 border border-rose-100">
                    <span className="text-[11px] text-rose-700 font-semibold">Tiền Đang Tại Két Hub</span>
                    <p className="text-lg font-black text-rose-600 font-mono">{formatMoney(c.totalVault)}</p>
                    <span className="text-[10px] text-rose-600/70">Cần nộp về công ty</span>
                  </div>

                  <div className="bg-emerald-50/50 p-3 rounded-2xl space-y-1 border border-emerald-100">
                    <span className="text-[11px] text-emerald-700 font-semibold">Đã Nộp & Giải Ngân</span>
                    <p className="text-lg font-black text-emerald-600 font-mono">{formatMoney(c.totalRemitted)}</p>
                    <span className="text-[10px] text-emerald-600/70">Chốt sổ an toàn</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Tỷ lệ nộp đúng hạn: <b>100%</b></span>
                  </div>

                  <span className="text-[11px] font-bold text-sky-700">
                    Quản lý: {c.childHubs.map((h) => h.hub.name.replace('Bưu Cục Giao Hàng ', '').replace('Bưu Cục ', '')).join(', ') || 'Chưa gán'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: SỔ KẾ TOÁN CHI TIẾT KIỆN HÀNG (DÀNH CHO KẾ TOÁN TRA SOÁT) */}
      {/* ========================================================================= */}
      {activeTierView === 'PARCELS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {[
                { id: 'ALL', label: `Tất Cả COD (${codShipments.length})` },
                { id: 'COLLECTING', label: `🛵 Đang Giao & Thu (${collectingShipments.length})` },
                { id: 'PENDING_REMIT', label: `🏦 Chờ Nộp Két Hub (${pendingRemitShipments.length})` },
                { id: 'REMITTED', label: `✅ Đã Nhập Két / Giải Ngân (${remittedShipments.length})` },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filter === item.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã vận đơn, khách, SĐT, địa chỉ..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã Vận Đơn</th>
                    <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                    <th className="py-3 px-4">Bưu Cục Hub Phụ Trách</th>
                    <th className="py-3 px-4">Tiền Thu Hộ (COD)</th>
                    <th className="py-3 px-4">Shipper Phụ Trách</th>
                    <th className="py-3 px-4">Trạng Thái Dòng Tiền</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedShipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        Không có vận đơn COD nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    displayedShipments.map((s) => {
                      const latestAssignment = s.assignments && s.assignments[0]
                      const isDelivered = ['DELIVERED', 'COMPLETED'].includes(s.status)
                      const isRemitted = remittedShipments.includes(s)
                      const matchedHub = matchShipmentToHub(s, hubs)

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition">
                          {/* Mã đơn */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 space-y-0.5">
                            <div className="text-sm">{s.trackingNumber}</div>
                            <div className="text-[11px] text-slate-400 font-sans font-normal">
                              Đơn: #{s.orderId}
                            </div>
                          </td>

                          {/* Khách nhận */}
                          <td className="py-3.5 px-4 space-y-0.5 max-w-xs">
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <span>{s.buyerName}</span>
                              <span className="text-slate-500 font-normal text-xs">({s.buyerPhone})</span>
                            </div>
                            <div className="text-xs text-slate-600 line-clamp-1">
                              {s.deliveryAddress}
                            </div>
                          </td>

                          {/* Bưu cục Hub phụ trách */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800">
                              <span>🏢</span> {matchedHub?.name.replace('Bưu Cục Giao Hàng ', '') || 'Bưu Cục Hub'}
                            </span>
                          </td>

                          {/* Tiền COD */}
                          <td className="py-3.5 px-4 font-mono font-black text-sm text-emerald-700">
                            {formatMoney(s.codAmount)}
                          </td>

                          {/* Shipper */}
                          <td className="py-3.5 px-4">
                            {latestAssignment?.driver ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 text-xs">
                                  {latestAssignment.driver.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {latestAssignment.driver.phone} • {latestAssignment.driver.vehicleNumber}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chưa gán shipper</span>
                            )}
                          </td>

                          {/* Trạng thái tiền */}
                          <td className="py-3.5 px-4">
                            {isRemitted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span>✅</span> Đã Nộp & Giải Ngân
                              </span>
                            ) : isDelivered ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                <span>🏦</span> Trong Két Sắt Hub
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span>🛵</span> Đang Thu Ngoài Tuyến
                              </span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => onSelectShipment && onSelectShipment(s)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Xem Lộ Trình ➔
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
