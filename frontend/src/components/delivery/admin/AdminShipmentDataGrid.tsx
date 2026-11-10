import React, { useState } from 'react'
import type { Shipment } from './types'

interface AdminShipmentDataGridProps {
  shipments: Shipment[]
  onSelectShipment: (shipment: Shipment) => void
  initialStatusFilter?: string
  loading?: boolean
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const AdminShipmentDataGrid: React.FC<AdminShipmentDataGridProps> = ({
  shipments,
  onSelectShipment,
  initialStatusFilter = 'ALL',
  loading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter)
  const [codFilter, setCodFilter] = useState<'ALL' | 'COD_ONLY' | 'PREPAID'>('ALL')
  const [search, setSearch] = useState('')

  // Lọc dữ liệu
  const filtered = shipments.filter((s) => {
    if (s.status === 'CANCELLED') return false

    // Lọc theo trạng thái phễu
    if (statusFilter === 'PICKUP') {
      if (!['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status)) return false
    } else if (statusFilter === 'SORTING') {
      if (!['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING'].includes(s.status)) return false
    } else if (statusFilter === 'LINEHAUL') {
      if (!['IN_TRANSIT', 'AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status)) return false
    } else if (statusFilter === 'DELIVERING') {
      if (s.status !== 'OUT_FOR_DELIVERY') return false
    } else if (statusFilter === 'DELIVERED') {
      if (!['DELIVERED', 'COMPLETED'].includes(s.status)) return false
    } else if (statusFilter === 'FAILED') {
      if (!['DELIVERY_FAILED', 'RETURNING', 'RETURNED'].includes(s.status)) return false
    }

    // Lọc theo COD
    if (codFilter === 'COD_ONLY' && (s.codAmount || 0) <= 0) return false
    if (codFilter === 'PREPAID' && (s.codAmount || 0) > 0) return false

    // Lọc theo từ khóa tìm kiếm
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

  const statusPills = [
    { id: 'ALL', label: 'Tất Cả', count: shipments.filter((s) => s.status !== 'CANCELLED').length },
    { id: 'PICKUP', label: '1. Chờ Lấy Hàng', count: shipments.filter((s) => ['CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(s.status)).length },
    { id: 'SORTING', label: '2. Tại Hub/SOC', count: shipments.filter((s) => ['PICKED_UP', 'AT_ORIGIN_HUB', 'SORTING'].includes(s.status)).length },
    { id: 'LINEHAUL', label: '3. Xe Tải Tuyến', count: shipments.filter((s) => ['IN_TRANSIT', 'AT_DESTINATION_HUB', 'DELIVERY_ASSIGNED'].includes(s.status)).length },
    { id: 'DELIVERING', label: '4. Đang Đi Giao', count: shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length },
    { id: 'DELIVERED', label: '5. Đã Giao Xong', count: shipments.filter((s) => ['DELIVERED', 'COMPLETED'].includes(s.status)).length },
    { id: 'FAILED', label: '⚠️ Thất Bại / Hoàn', count: shipments.filter((s) => ['DELIVERY_FAILED', 'RETURNING', 'RETURNED'].includes(s.status)).length },
  ]

  return (
    <div className="space-y-4 text-left animate-in fade-in duration-150">
      {/* 1. Header Toolbar: Filters & Search */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4.5 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          {/* Quick Filter Status Pills */}
          <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
            {statusPills.map((pill) => {
              const active = statusFilter === pill.id
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search box & COD filter */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
            <select
              value={codFilter}
              onChange={(e) => setCodFilter(e.target.value as any)}
              aria-label="Lọc theo hình thức thanh toán"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">💵 Tất Cả COD</option>
              <option value="COD_ONLY">Thu Tiền COD</option>
              <option value="PREPAID">Đã Thanh Toán Trước</option>
            </select>

            <div className="w-full sm:w-64 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Lọc mã đơn, người nhận, SĐT..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Data Grid (Bảng dữ liệu mật độ cao chuẩn Enterprise) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Vận Đơn</th>
                <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                <th className="py-3 px-4">Kiện Hàng / Cước</th>
                <th className="py-3 px-4">Tiền COD</th>
                <th className="py-3 px-4">Trạng Thái & Shipper</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Đang tải danh sách bưu kiện...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Không tìm thấy vận đơn nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const latestAssignment = s.assignments && s.assignments[0]
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectShipment(s)}
                      className="hover:bg-slate-50/90 transition cursor-pointer group"
                    >
                      {/* Cột 1: Mã Vận Đơn */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 space-y-0.5">
                        <div className="text-sm group-hover:underline">{s.trackingNumber}</div>
                        <div className="text-[11px] text-slate-400 font-normal font-sans">
                          Đơn: #{s.orderId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal font-sans">
                          {new Date(s.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>

                      {/* Cột 2: Người Nhận */}
                      <td className="py-3 px-4 space-y-0.5 max-w-xs">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{s.buyerName}</span>
                          <span className="text-slate-500 font-normal text-xs">({s.buyerPhone})</span>
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
                          {s.deliveryAddress}
                        </div>
                      </td>

                      {/* Cột 3: Kiện hàng & Cước */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="text-slate-800 font-semibold line-clamp-1">
                          {s.package?.itemsSummary || 'Sản phẩm ZeroMall'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {s.package?.weight || 0.5}kg • Cước: {formatMoney(s.shippingFee || 30000)}
                        </div>
                      </td>

                      {/* Cột 4: COD */}
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        {s.codAmount > 0 ? (
                          <span className="text-emerald-700">{formatMoney(s.codAmount)}</span>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">Đã TT</span>
                        )}
                      </td>

                      {/* Cột 5: Trạng Thái */}
                      <td className="py-3 px-4 space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            s.status.includes('PICK')
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : s.status.includes('HUB') || s.status.includes('SORT')
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : s.status === 'IN_TRANSIT'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : s.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                              : s.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.status === 'CREATED' && 'Mới Tạo'}
                          {s.status === 'WAITING_PICKUP' && 'Chờ Lấy Hàng'}
                          {s.status === 'PICKUP_ASSIGNED' && 'Đã Gán Lấy Hàng'}
                          {s.status === 'PICKED_UP' && 'Đã Lấy Hàng'}
                          {s.status === 'AT_ORIGIN_HUB' && 'Tại Kho Xuất Phát'}
                          {s.status === 'SORTING' && 'Đang Phân Loại'}
                          {s.status === 'IN_TRANSIT' && 'Đang Trung Chuyển'}
                          {s.status === 'AT_DESTINATION_HUB' && 'Đã Đến Kho Phát'}
                          {s.status === 'DELIVERY_ASSIGNED' && 'Chờ Shipper Nhận'}
                          {s.status === 'OUT_FOR_DELIVERY' && 'Đang Giao Hàng'}
                          {s.status === 'DELIVERED' && 'Giao Thành Công'}
                          {s.status === 'DELIVERY_FAILED' && 'Giao Thất Bại'}
                        </span>

                        {latestAssignment && (
                          <div className="text-[11px] text-slate-500">
                            🛵 Shipper: <b>{latestAssignment.driver.name}</b> ({latestAssignment.driver.vehicleNumber})
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Thao Tác */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectShipment(s)
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Lộ Trình ➔
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer số lượng */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Hiển thị <b>{filtered.length}</b> / {shipments.length} bưu kiện</span>
          <span className="text-[11px] text-slate-400">Nhấp vào dòng để xem chi tiết Drawer</span>
        </div>
      </div>
    </div>
  )
}
