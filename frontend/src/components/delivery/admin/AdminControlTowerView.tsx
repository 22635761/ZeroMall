import React from 'react'
import type { Shipment, Hub, Driver } from './types'

interface AdminControlTowerViewProps {
  shipments: Shipment[]
  hubs: Hub[]
  drivers: Driver[]
  onSelectShipment: (shipment: Shipment) => void
  onNavigateToShipmentsWithFilter?: (statusFilter: string) => void
  onNavigateToDrivers?: () => void
  onNavigateToCod?: () => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const AdminControlTowerView: React.FC<AdminControlTowerViewProps> = ({
  shipments,
  hubs,
  drivers,
  onSelectShipment,
  onNavigateToShipmentsWithFilter,
  onNavigateToCod,
}) => {
  const validShipments = shipments.filter((s) => s.status !== 'CANCELLED')

  // 1. Phân loại bưu kiện theo phễu vận hành 5 chặng
  const pickupParcels = validShipments.filter((s) =>
    ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status)
  )
  const sortingParcels = validShipments.filter((s) =>
    ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING'].includes(s.status)
  )
  const linehaulParcels = validShipments.filter((s) =>
    ['IN_TRANSIT', 'AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status)
  )
  const outForDeliveryParcels = validShipments.filter((s) => s.status === 'OUT_FOR_DELIVERY')
  const deliveredParcels = validShipments.filter((s) =>
    ['DELIVERED', 'COMPLETED'].includes(s.status)
  )
  const failedParcels = validShipments.filter((s) =>
    ['DELIVERY_FAILED', 'RETURNING', 'RETURNED'].includes(s.status)
  )

  // 2. Thống kê tiền COD
  const totalCodAmount = validShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0)
  const collectingCodAmount = outForDeliveryParcels.reduce((sum, s) => sum + (s.codAmount || 0), 0)
  const settledCodAmount = deliveredParcels.reduce((sum, s) => sum + (s.codAmount || 0), 0)

  // 3. Tỷ lệ hoàn thành (Delivery Success Rate) & SLA
  const totalFinished = deliveredParcels.length + failedParcels.length
  const successRate = totalFinished > 0 ? ((deliveredParcels.length / totalFinished) * 100).toFixed(1) : '98.5'
  const slaRate = 97.8

  // 4. Danh sách cảnh báo rủi ro (Urgent Operational Alerts)
  const alerts: Array<{ type: 'danger' | 'warning' | 'info'; title: string; desc: string; actionText?: string; onAction?: () => void }> = []

  if (failedParcels.length > 0) {
    alerts.push({
      type: 'danger',
      title: `Có ${failedParcels.length} vận đơn giao không thành công / bom hàng`,
      desc: 'Cần liên hệ người nhận để tái phát (Re-attempt) hoặc tạo lệnh chuyển hoàn về Shop (RTO).',
      actionText: 'Xử lý đơn hoàn',
      onAction: () => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('FAILED'),
    })
  }

  if (collectingCodAmount > 0) {
    alerts.push({
      type: 'warning',
      title: `Đang có ${formatMoney(collectingCodAmount)} tiền mặt COD đang trên đường giao`,
      desc: 'Giám sát hành trình shipper thu COD và nhắc nhở nộp tiền về quầy bưu cục cuối ca.',
      actionText: 'Kiểm tra két COD',
      onAction: onNavigateToCod,
    })
  }

  if (pickupParcels.length > 0) {
    alerts.push({
      type: 'info',
      title: `Có ${pickupParcels.length} kiện hàng mới từ Shop đang chờ lấy`,
      desc: 'Cần điều phối shipper First-Mile đến kho người bán lấy hàng trước giờ cắt hàng (Cut-off time 16:00).',
      actionText: 'Điều phối lấy hàng',
      onAction: () => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('PICKUP'),
    })
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-150">
      {/* 1. THANH PHỄU VẬN HÀNH BƯU KIỆN (OPERATIONAL PIPELINE FUNNEL) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <div>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Phễu Luồng Bưu Kiện Vận Hành Toàn Quốc (Operational Pipeline)
              </h2>
              <p className="text-[10px] text-slate-400">
                Theo dõi tiến độ di chuyển từng chặng của {validShipments.length} bưu kiện trong hệ thống
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Tỷ lệ phát thành công: {successRate}%
          </span>
        </div>

        {/* 5 Bước phễu liên hoàn */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {/* Bước 1 */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('PICKUP')}
            className="p-3 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
              <span>1. Chờ Lấy Hàng</span>
              <span className="text-amber-600 font-mono font-black">{pickupParcels.length}</span>
            </div>
            <div className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition">
              {pickupParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Từ kho Người Bán</div>
          </button>

          {/* Bước 2 */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('SORTING')}
            className="p-3 bg-sky-50/60 hover:bg-sky-100/60 border border-sky-200 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-sky-800 mb-1">
              <span>2. Tại Hub & SOC</span>
              <span className="text-sky-600 font-mono font-black">{sortingParcels.length}</span>
            </div>
            <div className="text-xl font-black text-sky-950 group-hover:text-sky-700 transition">
              {sortingParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-sky-700/80 mt-1">Phân loại & đóng bao</div>
          </button>

          {/* Bước 3 */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('LINEHAUL')}
            className="p-3 bg-indigo-50/60 hover:bg-indigo-100/60 border border-indigo-200 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-indigo-800 mb-1">
              <span>3. Xe Tải Tuyến</span>
              <span className="text-indigo-600 font-mono font-black">{linehaulParcels.length}</span>
            </div>
            <div className="text-xl font-black text-indigo-950 group-hover:text-indigo-700 transition">
              {linehaulParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-indigo-700/80 mt-1">Trung chuyển liên tỉnh</div>
          </button>

          {/* Bước 4 */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('OUT_FOR_DELIVERY')}
            className="p-3 bg-orange-50/60 hover:bg-orange-100/60 border border-orange-200 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-orange-800 mb-1">
              <span>4. Đang Đi Giao</span>
              <span className="text-orange-600 font-mono font-black">{outForDeliveryParcels.length}</span>
            </div>
            <div className="text-xl font-black text-orange-950 group-hover:text-orange-700 transition">
              {outForDeliveryParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-orange-700/80 mt-1">Shipper phát tận nhà</div>
          </button>

          {/* Bước 5 */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('DELIVERED')}
            className="p-3 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-300 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
              <span>5. Giao Xong</span>
              <span className="text-emerald-600 font-mono font-black">{deliveredParcels.length}</span>
            </div>
            <div className="text-xl font-black text-emerald-950 group-hover:text-emerald-700 transition">
              {deliveredParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-emerald-700/80 mt-1">Đã ký nhận POD</div>
          </button>

          {/* Cảnh Báo Hoàn */}
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('FAILED')}
            className="p-3 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-300 rounded-2xl text-left transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 mb-1">
              <span>⚠️ Thất Bại / Hoàn</span>
              <span className="text-rose-600 font-mono font-black">{failedParcels.length}</span>
            </div>
            <div className="text-xl font-black text-rose-950 group-hover:text-rose-700 transition">
              {failedParcels.length} <span className="text-xs font-normal text-slate-400">kiện</span>
            </div>
            <div className="text-[10px] text-rose-700/80 mt-1">Hẹn lại / Trả về Shop</div>
          </button>
        </div>
      </div>

      {/* 2. CẢNH BÁO NGHẼN VẬN HÀNH TỨC THÌ (URGENT ALERTS) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                a.type === 'danger'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                  : a.type === 'warning'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                  : 'bg-sky-50/80 border-sky-200 text-sky-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">
                  {a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div>
                  <h4 className="text-xs font-black">{a.title}</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">{a.desc}</p>
                </div>
              </div>

              {a.actionText && (
                <button
                  type="button"
                  onClick={a.onAction}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-3xs ${
                    a.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : a.type === 'warning'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  {a.actionText} ➔
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. 4 THẺ CHỈ SỐ SLA & TÀI CHÍNH CỐT LÕI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* SLA Rate */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>🎯</span> Tỷ Lệ Giao Đúng Hạn (SLA)
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
              Mục tiêu &gt; 95%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{slaRate}%</span>
            <span className="text-xs font-bold text-emerald-600">🟢 Đạt chuẩn</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Thời gian giao hàng trung bình toàn trình: <b>1.4 ngày</b>
          </p>
        </div>

        {/* Tiền COD trên đường */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>🛵</span> COD Đang Giao Trên Đường
            </span>
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
              {outForDeliveryParcels.length} đơn
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              {formatMoney(collectingCodAmount)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Shipper đang giữ tiền mặt, hạn mức an toàn 10M/tài xế
          </p>
        </div>

        {/* Tiền COD đã chốt két */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>💵</span> COD Đã Nộp & Giải Ngân
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
              {deliveredParcels.length} đơn
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {formatMoney(settledCodAmount)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            Tổng COD toàn mạng lưới: {formatMoney(totalCodAmount)}
          </p>
        </div>

        {/* Đội ngũ và mạng lưới */}
        <div className="bg-white border border-slate-200/90 p-4.5 rounded-3xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span>🏢</span> Mạng Lưới & Đội Xe
            </span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md text-[10px]">
              SPX Network
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{hubs.length} Hubs</span>
            <span className="text-slate-300">/</span>
            <span className="text-2xl font-black text-indigo-600">{drivers.length} Shipper</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Tỷ lệ tài xế online sẵn sàng nhận chuyến: <b>100%</b>
          </p>
        </div>
      </div>

      {/* 4. PHÂN BỔ TẢI TRỌNG TỪNG BƯU CỤC (HUB WORKLOAD BALANCE) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🏢</span>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Tải Trọng & Tình Trạng Khai Thác Tại Từng Bưu Cục ({hubs.length} Hubs & Mega SOC)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">Tự động đồng bộ thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hubs.map((hub) => {
            const hubParcels = validShipments.filter((s) => s.currentHubId === hub.id || s.currentHub?.code === hub.code)
            const hubDrivers = drivers.filter((d) => d.hubId === hub.id || d.hub?.code === hub.code)
            const deliveringCount = hubParcels.filter((s) => s.status === 'OUT_FOR_DELIVERY').length

            return (
              <div
                key={hub.id}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-black bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {hub.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{hub.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{hub.address}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {hub.type}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/70 text-center">
                  <div className="p-1.5 bg-white rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Tồn kho</span>
                    <span className="font-mono font-black text-xs text-sky-700">{hubParcels.length}</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Đang giao</span>
                    <span className="font-mono font-black text-xs text-orange-600">{deliveringCount}</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-xl">
                    <span className="text-[9px] text-slate-400 block">Shipper</span>
                    <span className="font-mono font-black text-xs text-indigo-700">{hubDrivers.length}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. DANH SÁCH BƯU KIỆN MỚI CẦN XỬ LÝ (QUICK ACTION LIST) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Vận Đơn Đang Hoạt Động Cần Chú Ý ({validShipments.slice(0, 5).length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToShipmentsWithFilter && onNavigateToShipmentsWithFilter('ALL')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            Xem Tất Cả Vận Đơn ➔
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Mã Vận Đơn ZMX</th>
                <th className="py-2.5 px-3">Khách Nhận</th>
                <th className="py-2.5 px-3">COD</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Lộ Trình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validShipments.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                    {s.trackingNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800">{s.buyerName}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({s.buyerPhone})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {s.codAmount > 0 ? formatMoney(s.codAmount) : <span className="text-slate-300">0đ</span>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      s.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      s.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' :
                      s.status === 'DELIVERY_FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectShipment(s)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Chi Tiết ➔
                    </button>
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
