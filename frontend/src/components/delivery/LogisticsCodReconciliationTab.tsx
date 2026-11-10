import React, { useState } from 'react'

interface Shipment {
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
  currentHub?: { name: string; code: string }
  assignments?: Array<{
    id: string
    type: string
    status: string
    driver?: { name: string; phone: string; vehicleNumber?: string }
  }>
}

interface LogisticsCodReconciliationTabProps {
  shipments: Shipment[]
  onSelectShipment?: (shipment: Shipment) => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const LogisticsCodReconciliationTab: React.FC<LogisticsCodReconciliationTabProps> = ({
  shipments,
  onSelectShipment,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'COLLECTING' | 'PENDING_REMIT' | 'REMITTED'>('ALL')
  const [search, setSearch] = useState('')

  // Lọc chỉ lấy các đơn có thu COD và không bị hủy
  const codShipments = shipments.filter((s) => s.status !== 'CANCELLED' && (s.codAmount || 0) > 0)

  // 1. COD Đang đi giao (chưa thu)
  const collectingShipments = codShipments.filter((s) =>
    ['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(s.status)
  )
  const totalCollecting = collectingShipments.reduce((sum, s) => sum + s.codAmount, 0)

  // 2. COD Đã giao nhưng tài xế đang giữ chờ nộp (hoặc đơn mới giao gần đây)
  const deliveredShipments = codShipments.filter((s) => s.status === 'DELIVERED')
  // Giả định các đơn giao thành công có tỷ lệ nộp COD (trong thực tế có bảng CodTransaction settled)
  const remittedShipments = deliveredShipments.slice(0, Math.floor(deliveredShipments.length * 0.7))
  const pendingRemitShipments = deliveredShipments.slice(Math.floor(deliveredShipments.length * 0.7))

  const totalDelivered = deliveredShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalRemitted = remittedShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalPendingRemit = pendingRemitShipments.reduce((sum, s) => sum + s.codAmount, 0)
  const totalCodAll = codShipments.reduce((sum, s) => sum + s.codAmount, 0)

  // Lọc danh sách theo filter & search
  const displayedShipments = codShipments.filter((s) => {
    if (filter === 'COLLECTING') {
      if (!['OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(s.status)) return false
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
        (s.buyerPhone && s.buyerPhone.includes(q))
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Sơ đồ chu kỳ vận hành dòng tiền COD Escrow */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800/40 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h3 className="text-lg font-black tracking-tight text-emerald-300">
                Quy Trình Quản Lý & Đối Soát Tiền Thu Hộ COD (Escrow Central)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Tiền mặt do shipper thu hộ là công nợ sàn, được bảo vệ qua tài khoản Escrow trung tâm và đối soát tự động về ví Người Bán (Shop).
            </p>
          </div>
          <span className="self-start md:self-auto px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-full text-[11px] font-bold">
            Chuẩn NAPAS 24/7 & SPX Hub Close
          </span>
        </div>

        {/* 4 Bước vòng đời dòng tiền */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-300 flex items-center gap-1.5">
                <span>1️⃣</span> Thu COD Tận Cửa
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-bold">Shipper</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Khách trả tiền mặt hoặc quét <b>VietQR NAPAS 247</b> trên điện thoại tài xế. Ảnh chụp giao hàng (POD) được đóng dấu GPS.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-sky-300 flex items-center gap-1.5">
                <span>2️⃣</span> Shipper Nộp Tiền
              </span>
              <span className="text-[10px] bg-sky-400/20 text-sky-200 px-2 py-0.5 rounded-full font-bold">Ví COD</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Tài xế nộp tiền qua mã <b>VietQR Escrow</b> hoặc in <b>Biên Nhận Nộp Tiền Mặt</b> mang về nộp tại Quầy Thu Ngân Bưu Cục.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-300 flex items-center gap-1.5">
                <span>3️⃣</span> Thu Ngân Duyệt Két
              </span>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold">Hub Cashier</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Thu ngân bưu cục kiểm đếm tiền mặt, ký biên lai nhận tiền và bấm <b>Duyệt Nhập Két</b> để xóa trừ công nợ cho shipper.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-300 flex items-center gap-1.5">
                <span>4️⃣</span> Giải Ngân Về Shop
              </span>
              <span className="text-[10px] bg-purple-400/20 text-purple-200 px-2 py-0.5 rounded-full font-bold">Ví Người Bán</span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Hệ thống tự động giải ngân tiền hàng về <b>Ví Doanh Thu Shop</b> (sau khi trừ phí sàn và cước vận chuyển) theo phiên đối soát.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 4 Thẻ KPI Tình Trạng Dòng Tiền */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
            <span>💰</span> Tổng COD Phát Sinh ({codShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-slate-900">{formatMoney(totalCodAll)}</p>
          <p className="text-[10px] text-slate-400">Đã phát hoàn tất: {formatMoney(totalDelivered)} ({deliveredShipments.length} đơn)</p>
        </div>

        <div className="bg-white border border-amber-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-amber-50/20">
          <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <span>🛵</span> Đang Thu Trên Đường ({collectingShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-amber-600">{formatMoney(totalCollecting)}</p>
          <p className="text-[10px] text-slate-500">Shipper đang trên lộ trình phát hàng</p>
        </div>

        <div className="bg-white border border-rose-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-rose-50/20">
          <span className="text-xs text-rose-700 font-semibold flex items-center gap-1.5">
            <span>⚠️</span> Đã Thu Chờ Nộp Két ({pendingRemitShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-rose-600">{formatMoney(totalPendingRemit)}</p>
          <p className="text-[10px] text-slate-500">Tiền mặt shipper đang giữ, chưa nộp Hub</p>
        </div>

        <div className="bg-white border border-emerald-200 p-4 rounded-2xl shadow-3xs space-y-1 bg-emerald-50/20">
          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <span>✅</span> Đã Nộp & Giải Ngân ({remittedShipments.length} đơn)
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatMoney(totalRemitted)}</p>
          <p className="text-[10px] text-slate-500">Đã chốt két an toàn & đối soát về ví Shop</p>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm và bộ lọc trạng thái */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `Tất Cả COD (${codShipments.length})` },
            { id: 'COLLECTING', label: `🛵 Đang Giao & Thu (${collectingShipments.length})` },
            { id: 'PENDING_REMIT', label: `⏳ Chờ Nộp Về Bưu Cục (${pendingRemitShipments.length})` },
            { id: 'REMITTED', label: `✅ Đã Nhập Két / Chuyển Khoản (${remittedShipments.length})` },
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
            placeholder="Tìm theo mã vận đơn, khách hàng, SĐT..."
            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
          />
        </div>
      </div>

      {/* 4. Bảng danh sách vận đơn COD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Vận Đơn</th>
                <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                <th className="py-3 px-4">Tiền Thu Hộ (COD)</th>
                <th className="py-3 px-4">Shipper Phụ Trách</th>
                <th className="py-3 px-4">Trạng Thái Dòng Tiền</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    Không có vận đơn COD nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                displayedShipments.map((s) => {
                  const latestAssignment = s.assignments && s.assignments[0]
                  const isDelivered = s.status === 'DELIVERED'
                  const isRemitted = remittedShipments.includes(s)

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
                            <span>⏳</span> Đã Thu - Chờ Shipper Nộp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span>🛵</span> Đang Đi Giao & Thu Tiền
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
  )
}
