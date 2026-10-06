import React, { useState } from 'react'

interface Shipment {
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
  currentHub?: { name: string; code: string }
  assignments?: Array<{
    id: string
    type: string
    status: string
    driver?: { name: string; phone: string; vehicleNumber?: string }
  }>
}

interface LogisticsFinanceTabProps {
  shipments: Shipment[]
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const LogisticsFinanceTab: React.FC<LogisticsFinanceTabProps> = ({ shipments }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Đơn cước vận chuyển chuẩn (nếu đơn không ghi nhận thì tính mặc định 22k hoặc 30k)
  const validShipments = shipments.filter((s) => s.status !== 'CANCELLED')

  // Thống kê Unit Economics
  const totalShippingFeeCollected = validShipments.reduce(
    (sum, s) => sum + (s.shippingFee > 0 ? s.shippingFee : 30000),
    0
  )

  // 1. First Mile: Các đơn đã được tài xế lấy hàng thành công (PICKED_UP trở đi)
  const pickedUpShipments = validShipments.filter((s) =>
    ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalFirstMileCost = pickedUpShipments.length * 8000

  // 2. Last Mile: Các đơn đã được tài xế phát thành công tới người nhận
  const deliveredShipments = validShipments.filter((s) =>
    ['DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalLastMileCost = deliveredShipments.length * 8000

  // 3. Middle Mile: Các đơn đã nhập kho trung chuyển hoặc vận chuyển liên tỉnh
  const middleMileShipments = validShipments.filter((s) =>
    ['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const totalMiddleMileCost = middleMileShipments.length * 10000

  // 4. Lợi nhuận gộp vận tải của Sàn
  const totalLogisticsCost = totalFirstMileCost + totalLastMileCost + totalMiddleMileCost
  const platformLogisticsProfit = totalShippingFeeCollected - totalLogisticsCost

  // Lọc bảng chi tiết
  const filteredShipments = validShipments.filter((s) => {
    if (filterStatus === 'ALL') return true
    if (filterStatus === 'DELIVERED') return ['DELIVERED', 'COMPLETED'].includes(s.status)
    if (filterStatus === 'IN_TRANSIT') return ['IN_TRANSIT', 'SORTING', 'AT_DESTINATION_HUB'].includes(s.status)
    if (filterStatus === 'PICKED_UP') return ['PICKED_UP', 'AT_ORIGIN_HUB'].includes(s.status)
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-left">
      {/* 1. Header & Giới thiệu mô hình kinh tế vận tải */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-black tracking-tight">
              Báo Cáo Hạch Toán Cước & Lợi Nhuận Logistics (SPX Unit Economics)
            </h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Khóa Luận Tốt Nghiệp
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Mô hình hóa dòng tiền vận tải 3 chặng độc lập: <b>First Mile (8.000đ)</b> $\rightarrow$ <b>Middle Mile & Kho SOC (~10.000đ)</b> $\rightarrow$ <b>Last Mile (8.000đ)</b> $\rightarrow$ <b>Lợi nhuận sàn</b>.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl text-right shrink-0">
          <span className="text-[10px] text-slate-300 font-medium uppercase tracking-wider block">
            Tỷ suất lợi nhuận gộp Logistics
          </span>
          <span className="text-xl font-black text-emerald-400">
            {totalShippingFeeCollected > 0
              ? `${Math.round((platformLogisticsProfit / totalShippingFeeCollected) * 100)}%`
              : '0%'}
          </span>
        </div>
      </div>

      {/* 2. 5 Thẻ Thống Kê Tài Chính Tổng Hợp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Tổng thu cước */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>💵</span> Tổng Cước Thu Khách
          </span>
          <p className="text-2xl font-black text-slate-800">
            {formatMoney(totalShippingFeeCollected)}
          </p>
          <p className="text-[10px] text-slate-400">
            {validShipments.length} bưu kiện vận chuyển
          </p>
        </div>

        {/* First Mile: Công lấy hàng */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>📦</span> Chi Shipper Lấy Hàng
          </span>
          <p className="text-2xl font-black text-amber-600">
            {formatMoney(totalFirstMileCost)}
          </p>
          <p className="text-[10px] text-amber-700/80 font-medium">
            {pickedUpShipments.length} lượt lấy × 8.000đ
          </p>
        </div>

        {/* Last Mile: Công giao hàng */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>🛵</span> Chi Shipper Giao Khách
          </span>
          <p className="text-2xl font-black text-orange-600">
            {formatMoney(totalLastMileCost)}
          </p>
          <p className="text-[10px] text-orange-700/80 font-medium">
            {deliveredShipments.length} lượt giao × 8.000đ
          </p>
        </div>

        {/* Middle Mile: Xe tải & Kho SOC */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>🚛</span> Vận Chuyển Liên Hub
          </span>
          <p className="text-2xl font-black text-sky-600">
            {formatMoney(totalMiddleMileCost)}
          </p>
          <p className="text-[10px] text-sky-700/80 font-medium">
            {middleMileShipments.length} chặng xe tải × 10.000đ
          </p>
        </div>

        {/* Lợi nhuận gộp của Sàn */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 p-4 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
            <span>🏆</span> Lợi Nhuận Gộp Sàn
          </span>
          <p className="text-2xl font-black text-emerald-700">
            {formatMoney(platformLogisticsProfit)}
          </p>
          <p className="text-[10px] text-emerald-800/80 font-medium">
            Doanh thu ròng từ mảng vận chuyển
          </p>
        </div>
      </div>

      {/* 3. Sơ đồ minh họa dòng tiền 3 chặng thực tế */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
              💡
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Sơ Đồ Phân Bổ Chi Phí 1 Đơn Hàng Mẫu (Cước 30.000đ)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Quy chuẩn hạch toán Shopee Express / SPX
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Chặng 1 */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-amber-700">1. First Mile (Lấy hàng)</span>
              <span className="font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[10px]">
                8.000đ
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Tài xế nhận đơn, đến tận kho của Shop nhận bưu kiện và chở về Hub gốc (Tân Bình SOC).
            </p>
            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
              Ghi nhận vào ví tài xế khi: <b>PICKED_UP</b>
            </div>
          </div>

          {/* Chặng 2 */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-sky-700">2. Middle Mile (Trung chuyển)</span>
              <span className="font-mono font-bold bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md text-[10px]">
                10.000đ
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Xe tải lớn vận chuyển liên tỉnh giữa các Hub + Chi phí phân loại tự động tại trung tâm khai thác.
            </p>
            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
              Chi phí xăng dầu, khấu hao & nhân công kho
            </div>
          </div>

          {/* Chặng 3 */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-orange-700">3. Last Mile (Giao khách)</span>
              <span className="font-mono font-bold bg-orange-100 text-orange-900 px-2 py-0.5 rounded-md text-[10px]">
                8.000đ
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Shipper bưu cục đích nhận hàng, đi xe máy phát tận tay người mua và thu tiền COD (nếu có).
            </p>
            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-1.5 font-medium">
              Ghi nhận vào ví tài xế khi: <b>DELIVERED</b>
            </div>
          </div>

          {/* Lợi nhuận sàn */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-800">4. Lợi Nhuận Sàn</span>
              <span className="font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[10px]">
                4.000đ (13.3%)
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Doanh thu ròng của dịch vụ ZeroExpress, quỹ bảo hiểm rủi ro hàng hóa thất lạc & vận hành máy chủ.
            </p>
            <div className="text-[10px] text-emerald-700 border-t border-emerald-200/60 pt-1.5 font-bold">
              Kết chuyển vào Quỹ Lợi Nhuận Sàn
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bảng Kê Chi Tiết Từng Vận Đơn (Shipment Financial Ledger) */}
      <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Sổ Cái Đối Soát Vận Đơn Chi Tiết ({filteredShipments.length})
            </h3>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DELIVERED', label: 'Đã giao thành công' },
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
                <th className="text-left p-3">Tuyến Vận Chuyển</th>
                <th className="text-right p-3">Cước Ship Thu Khách</th>
                <th className="text-right p-3">Công Lấy (First Mile)</th>
                <th className="text-right p-3">Công Giao (Last Mile)</th>
                <th className="text-right p-3">Xe Tải & Hub SOC</th>
                <th className="text-right p-3">Lợi Nhuận Sàn</th>
                <th className="text-center p-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredShipments.map((s) => {
                const fee = s.shippingFee > 0 ? s.shippingFee : 30000
                const isPicked = ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)
                const isDelivered = ['DELIVERED', 'COMPLETED'].includes(s.status)
                const isMiddle = ['AT_ORIGIN_HUB', 'SORTING', 'IN_TRANSIT', 'AT_DESTINATION_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(s.status)

                const firstMile = isPicked ? 8000 : 0
                const lastMile = isDelivered ? 8000 : 0
                const middleMile = isMiddle ? 10000 : 0
                const profit = isDelivered ? fee - 8000 - 8000 - 10000 : 0

                const pickupDriver = s.assignments?.find((a) => a.type === 'PICKUP')?.driver?.name || 'Tài xế lấy'
                const deliveryDriver = s.assignments?.find((a) => a.type === 'DELIVERY')?.driver?.name || 'Tài xế giao'

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div>{s.trackingNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Đơn: #{s.orderId.slice(-8)}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-800 font-semibold truncate max-w-[200px]">
                        {s.pickupAddress?.name || 'Kho Người Bán'} $\rightarrow$ {s.buyerName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {s.deliveryAddress}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatMoney(fee)}
                    </td>
                    <td className="p-3 text-right">
                      {firstMile > 0 ? (
                        <div>
                          <span className="font-bold text-amber-700">+{formatMoney(firstMile)}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[100px] ml-auto">{pickupDriver}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">0đ (chờ lấy)</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {lastMile > 0 ? (
                        <div>
                          <span className="font-bold text-orange-700">+{formatMoney(lastMile)}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[100px] ml-auto">{deliveryDriver}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300">0đ (chờ giao)</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium text-sky-700">
                      {middleMile > 0 ? formatMoney(middleMile) : '0đ'}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-700">
                      {isDelivered ? `+${formatMoney(profit)}` : 'Chờ hoàn tất'}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
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
    </div>
  )
}
