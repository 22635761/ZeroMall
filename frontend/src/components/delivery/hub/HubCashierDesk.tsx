import React, { useState, useEffect } from 'react'
import type { Hub, Shipment } from './types'

export interface HubCashierDeskProps {
  currentHub: Hub
  drivers: any[]
  shipments: Shipment[]
  onRefresh: () => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const HubCashierDesk: React.FC<HubCashierDeskProps> = ({
  currentHub,
  drivers = [],
  shipments,
  onRefresh
}) => {
  const [slips, setSlips] = useState<any[]>([])
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Tải danh sách phiếu nộp tiền COD từ localStorage
  const loadSlips = () => {
    const raw = localStorage.getItem('zm_hub_cashier_slips') || '[]'
    try {
      const parsed = JSON.parse(raw)
      setSlips(parsed)
    } catch {
      setSlips([])
    }
  }

  useEffect(() => {
    loadSlips()
  }, [])

  // Lọc các tài xế thuộc bưu cục này
  const hubDrivers = drivers.filter(d => d.hubId === currentHub.id || d.hub?.id === currentHub.id || !d.hubId)

  // Tính số tiền COD các tài xế của bưu cục đang giữ
  const driverCodMap: Record<string, number> = {}
  shipments.forEach(s => {
    if (s.status === 'DELIVERED' && s.codAmount > 0) {
      const d = s.assignments?.find(a => a.type === 'DELIVERY')?.driver
      if (d && (d as any).phone) {
        const p = (d as any).phone
        driverCodMap[p] = (driverCodMap[p] || 0) + s.codAmount
      }
    }
  })

  // Duyệt phiếu nộp tiền mặt
  const handleApproveSlip = (slipCode: string) => {
    setActionLoading(true)
    setTimeout(() => {
      const updated = slips.map(s => {
        if (s.code === slipCode) {
          return {
            ...s,
            status: 'ĐÃ DUYỆT & NHẬP KÉT BƯU CỤC',
            approvedAt: new Date().toLocaleString('vi-VN'),
            cashierName: 'Thủ quỹ Bưu Cục ' + currentHub.name
          }
        }
        return s
      })
      localStorage.setItem('zm_hub_cashier_slips', JSON.stringify(updated))
      setSlips(updated)
      setActionLoading(false)
      alert(`✅ Đã xác nhận thu tiền mặt cho phiếu ${slipCode}! Đã nhập quỹ bưu cục ${currentHub.name}.`)
      onRefresh()
    }, 400)
  }

  // Tổng tiền mặt đã duyệt nhập quỹ hôm nay
  const totalSettledToday = slips
    .filter(s => s.status.includes('ĐÃ DUYỆT') || s.status.includes('ĐÃ ĐỐI SOÁT'))
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  // Tổng tiền chờ duyệt
  const totalPendingApproval = slips
    .filter(s => s.status.includes('CHỜ'))
    .reduce((sum, s) => sum + (s.amount || 0), 0)

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header & Thống Kê Quỹ Bưu Cục */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <span>🏦</span> Tiền Mặt Đã Nhập Két Bưu Cục
          </span>
          <p className="text-2xl font-black text-emerald-600">{formatMoney(totalSettledToday)}</p>
          <p className="text-[10px] text-slate-400">Đã kiểm đếm & đối soát chuẩn xác</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <span>⏳</span> Tiền Chờ Thủ Quỹ Đếm & Duyệt
          </span>
          <p className="text-2xl font-black text-amber-600">{formatMoney(totalPendingApproval)}</p>
          <p className="text-[10px] text-slate-400">Từ các phiếu nộp cuối ca của Shipper</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <span>🛵</span> Đội Ngũ Shipper Trực Thuộc
          </span>
          <p className="text-2xl font-black text-sky-600">{hubDrivers.length} Tài xế</p>
          <p className="text-[10px] text-slate-400">Thuộc {currentHub.name}</p>
        </div>
      </div>

      {/* 2. Danh Sách Phiếu Nộp Tiền Chờ Duyệt (Remittance Slips) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <span>🧾</span> Bàn Thu Ngân & Duyệt Nộp Tiền COD Cuối Ca
            </h3>
            <p className="text-xs text-slate-400">
              Kiểm đếm tiền mặt thực tế từ tài xế trước khi bấm xác nhận nhập quỹ
            </p>
          </div>
          <button
            type="button"
            onClick={loadSlips}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
          >
            🔄 Làm Mới Danh Sách
          </button>
        </div>

        {slips.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
            <span>💡</span> Hiện chưa có phiếu nộp tiền COD nào được gửi từ các tài xế.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Mã Biên Lai</th>
                  <th className="py-3 px-3">Tài Xế Nộp Tiền</th>
                  <th className="py-3 px-3">Hình Thức Nộp</th>
                  <th className="py-3 px-3">Số Tiền Nộp</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác Thủ Quỹ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slips.map((slip, idx) => {
                  const isPending = slip.status.includes('CHỜ')
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700">
                        {slip.code}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{slip.driverName}</div>
                        <div className="text-[10px] text-slate-400">{slip.driverPhone}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {slip.method}
                      </td>
                      <td className="py-3 px-3 font-black text-rose-600 text-sm">
                        {formatMoney(slip.amount)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {slip.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleApproveSlip(slip.code)}
                            disabled={actionLoading}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-3xs cursor-pointer transition disabled:opacity-50"
                          >
                            ✓ Đã Thu Đủ Tiền
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSlip(slip)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                          >
                            📄 Xem Biên Nhận
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Bảng Giám Sát Công Nợ COD Tài Xế Trực Thuộc Bưu Cục */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <span>🛵</span> Giám Sát Hạn Mức & Công Nợ COD Tài Xế Tuyến Phát
        </h3>
        <p className="text-xs text-slate-400">
          Các tài xế giữ trên 8.000.000đ sẽ nhận cảnh báo và bị khóa nhận đơn nếu vượt 10.000.000đ
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Tài Xế</th>
                <th className="py-3 px-3">Phương Tiện / Biển Số</th>
                <th className="py-3 px-3">Tuyến Phụ Trách</th>
                <th className="py-3 px-3">COD Đang Giữ</th>
                <th className="py-3 px-3 text-right">Trạng Thái Nhận Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hubDrivers.map(driver => {
                const heldCod = driverCodMap[driver.phone] || 0
                const isBlocked = heldCod >= 10000000
                const isNear = heldCod >= 8000000 && !isBlocked
                return (
                  <tr key={driver.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{driver.name}</div>
                      <div className="text-[10px] text-slate-400">{driver.phone}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">
                      {driver.vehicleNumber} ({driver.vehicleType || 'Xe máy'})
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {driver.operatingArea || `${currentHub.district}, ${currentHub.province}`}
                    </td>
                    <td className="py-3 px-3 font-black text-sm">
                      <span className={isBlocked ? 'text-rose-600' : isNear ? 'text-amber-600' : 'text-slate-800'}>
                        {formatMoney(heldCod)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800'
                            : isNear
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isBlocked ? 'Khóa nhận đơn (Vượt hạn mức)' : isNear ? 'Cảnh báo hạn mức' : 'Hoạt động bình thường'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT BIÊN LAI */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 text-xs shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                <span>📄</span> Biên Nhận Thu Tiền Mặt COD
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-500">Mã biên lai:</span><b className="font-mono text-indigo-700">{selectedSlip.code}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Bưu cục tiếp nhận:</span><b>{selectedSlip.hubName}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Người nộp (Shipper):</span><b>{selectedSlip.driverName} ({selectedSlip.driverPhone})</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Số tiền:</span><b className="text-rose-600 text-sm">{formatMoney(selectedSlip.amount)}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Thời gian duyệt:</span><b>{selectedSlip.approvedAt || selectedSlip.remittedAt}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">Người duyệt (Thủ quỹ):</span><b className="text-emerald-700">{selectedSlip.cashierName || 'Đã ký điện tử'}</b></div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSlip(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition cursor-pointer"
            >
              Đóng Biên Lai
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
