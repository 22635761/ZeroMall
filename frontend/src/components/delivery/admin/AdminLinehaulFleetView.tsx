import React from 'react'
import type { Hub, Shipment } from './types'

interface AdminLinehaulFleetViewProps {
  hubs: Hub[]
  shipments: Shipment[]
  onSelectShipment?: (shipment: Shipment) => void
}

export const AdminLinehaulFleetView: React.FC<AdminLinehaulFleetViewProps> = ({
  hubs,
  shipments,
  onSelectShipment,
}) => {
  // Tìm các đơn đang trên đường trung chuyển liên tỉnh (IN_TRANSIT)
  const linehaulShipments = shipments.filter((s) =>
    ['IN_TRANSIT', 'SORTING', 'AT_DESTINATION_HUB'].includes(s.status)
  )

  // Danh sách các chuyến xe tải Linehaul thực tế kết nối các Hub
  const linehaulRoutes = [
    {
      id: 'ROUTE-01',
      truckNumber: '59C-998.12 (Xe 15 Tấn)',
      driverName: 'Trần Văn Mạnh (Bằng FC)',
      driverPhone: '0912.888.999',
      originHub: hubs.find((h) => h.code === 'HCM01') || { name: 'Kho Tổng TP.HCM', code: 'HCM01' },
      destinationHub: hubs.find((h) => h.code === 'HN01') || { name: 'Kho Mê Linh SOC', code: 'HN01' },
      departureTime: '21:00 Hôm qua',
      estimatedArrival: '18:00 Hôm nay',
      status: 'IN_TRANSIT',
      capacityPercent: 88,
      parcelsCount: 2650,
      sealNumber: 'SEAL-ZMX-889912',
    },
    {
      id: 'ROUTE-02',
      truckNumber: '60A-771.34 (Xe 8 Tấn)',
      driverName: 'Lê Hoàng Long',
      driverPhone: '0933.111.222',
      originHub: hubs.find((h) => h.code === 'HCM01') || { name: 'Kho Tổng TP.HCM', code: 'HCM01' },
      destinationHub: hubs.find((h) => h.code === 'DN01') || { name: 'Bưu Cục Biên Hòa', code: 'DN01' },
      departureTime: '06:00 Sáng nay',
      estimatedArrival: '08:30 Sáng nay',
      status: 'ARRIVED',
      capacityPercent: 95,
      parcelsCount: 1420,
      sealNumber: 'SEAL-ZMX-660144',
    },
    {
      id: 'ROUTE-03',
      truckNumber: '29H-554.21 (Xe 10 Tấn)',
      driverName: 'Nguyễn Tiến Dũng',
      driverPhone: '0977.333.444',
      originHub: hubs.find((h) => h.code === 'HN01') || { name: 'Kho Mê Linh SOC', code: 'HN01' },
      destinationHub: hubs.find((h) => h.code === 'HCM01') || { name: 'Kho Tổng TP.HCM', code: 'HCM01' },
      departureTime: '22:30 Hôm qua',
      estimatedArrival: '19:30 Hôm nay',
      status: 'IN_TRANSIT',
      capacityPercent: 82,
      parcelsCount: 2100,
      sealNumber: 'SEAL-ZMX-221190',
    },
  ]

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-150">
      {/* 1. Header Linehaul Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚛</span>
              <h2 className="text-lg font-black tracking-tight text-white">
                Hệ Thống Xe Tải Tuyến Chính (SPX Linehaul Fleet)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/40 uppercase">
                Liên Tỉnh 24/7
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Theo dõi hải trình các đoàn xe tải trung chuyển đường dài kết nối các Trung tâm phân loại tổng (Mega SOC) và Bưu cục vệ tinh toàn quốc.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/15 text-right">
            <span className="text-[10px] text-slate-300 uppercase block font-semibold">
              Bưu kiện trên xe tải
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {linehaulShipments.length} đơn
            </span>
          </div>
        </div>

        {/* 3 Thẻ chỉ số xe tải */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Đoàn xe đang chạy</span>
            <span className="text-xl font-black text-white font-mono">3 Chuyến Linehaul</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Tải trọng trung bình</span>
            <span className="text-xl font-black text-emerald-400 font-mono">88.3% Dung Tích</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Niêm phong an ninh</span>
            <span className="text-xl font-black text-sky-400 font-mono">100% Khóa Seal Chì</span>
          </div>
        </div>
      </div>

      {/* 2. Danh Sách Các Chuyến Xe Linehaul Đang Lưu Thông */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {linehaulRoutes.map((route) => {
          const isArrived = route.status === 'ARRIVED'
          return (
            <div
              key={route.id}
              className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-3xs space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {route.truckNumber}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1.5">{route.driverName}</h4>
                  <p className="text-[11px] text-slate-400">SĐT: {route.driverPhone}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    isArrived
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                  }`}
                >
                  {isArrived ? '✅ Đã Đến Hub Đích' : '🚚 Đang Chạy Trên Đường'}
                </span>
              </div>

              {/* Tuyến đường */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Xuất phát:</span>
                  <span className="font-mono text-slate-900 font-bold">[{route.originHub.code}] {route.originHub.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">Đích đến:</span>
                  <span className="font-mono text-indigo-700 font-bold">[{route.destinationHub.code}] {route.destinationHub.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <span>Khởi hành: {route.departureTime}</span>
                  <span>Dự kiến: {route.estimatedArrival}</span>
                </div>
              </div>

              {/* Tải trọng & Seal */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Tải trọng khoang xe:</span>
                  <span className="font-mono font-bold text-slate-900">{route.capacityPercent}% ({route.parcelsCount} kiện)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${route.capacityPercent}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Mã chì bảo mật:</span>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                    {route.sealNumber}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Danh Sách Vận Đơn Đang Trung Chuyển Trên Xe Tải */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">📦</span>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Bưu Kiện Đang Trên Xe Tải Trung Chuyển ({linehaulShipments.length} kiện)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Mã Vận Đơn ZMX</th>
                <th className="py-2.5 px-3">Người Nhận / Địa Chỉ</th>
                <th className="py-2.5 px-3">Hub Hiện Tại</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
                <th className="py-2.5 px-3 text-right">Lộ Trình</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linehaulShipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Hiện không có bưu kiện nào trên chuyến xe tải trung chuyển.
                  </td>
                </tr>
              ) : (
                linehaulShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                      {s.trackingNumber}
                      <span className="text-[10px] text-slate-400 block font-sans font-normal">#{s.orderId}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{s.buyerName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{s.deliveryAddress}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {s.currentHub?.name || s.currentHubId || 'Kho Khai Thác'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectShipment && onSelectShipment(s)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Xem Lộ Trình ➔
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
