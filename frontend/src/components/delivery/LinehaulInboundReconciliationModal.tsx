import React, { useState, useMemo } from 'react'

export interface LinehaulTripShipment {
  id: string
  trackingNumber: string
  orderId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  package?: { weight: number; itemsSummary?: string }
  codAmount: number
  status: string
  isScanned?: boolean
  receivedAt?: string
}

export interface LinehaulTrip {
  tripKey: string
  truckNumber: string
  sealNumber: string
  truckDriver: string
  truckDriverPhone: string
  originHubName?: string
  dispatchedAt?: string
  shipments: LinehaulTripShipment[]
}

interface LinehaulInboundReconciliationModalProps {
  isOpen: boolean
  onClose: () => void
  trip: LinehaulTrip | null
  currentHubName: string
  onReceiveShipment: (shipmentId: string) => Promise<void>
  onReceiveAllShipments: (shipmentIds: string[]) => Promise<void>
  onReportDiscrepancy: (trip: LinehaulTrip, missingShipmentIds: string[], reason: string) => Promise<void>
  actionLoading: boolean
}

export const LinehaulInboundReconciliationModal: React.FC<LinehaulInboundReconciliationModalProps> = ({
  isOpen,
  onClose,
  trip,
  currentHubName,
  onReceiveShipment,
  onReceiveAllShipments,
  onReportDiscrepancy,
  actionLoading,
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'SCANNED'>('ALL')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanNotice, setScanNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isDiscrepancyFormOpen, setIsDiscrepancyFormOpen] = useState(false)
  const [discrepancyReason, setDiscrepancyReason] = useState('Thùng xe dỡ hết nhưng không tìm thấy kiện hàng')
  const [localScannedIds, setLocalScannedIds] = useState<Set<string>>(new Set())

  // Đồng bộ danh sách kiện đã quét (hoặc đã chuyển sang AT_DESTINATION_HUB)
  const allShipments = useMemo(() => {
    if (!trip) return []
    return trip.shipments.map((s) => ({
      ...s,
      isScanned: localScannedIds.has(s.id) || s.status === 'AT_DESTINATION_HUB' || s.status === 'OUT_FOR_DELIVERY' || s.status === 'DELIVERED',
    }))
  }, [trip, localScannedIds])

  const scannedShipments = useMemo(() => allShipments.filter((s) => s.isScanned), [allShipments])
  const pendingShipments = useMemo(() => allShipments.filter((s) => !s.isScanned), [allShipments])

  const totalCount = allShipments.length
  const scannedCount = scannedShipments.length
  const pendingCount = pendingShipments.length
  const progressPercent = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0
  const isComplete = totalCount > 0 && scannedCount === totalCount

  const displayList = useMemo(() => {
    if (filterTab === 'SCANNED') return scannedShipments
    if (filterTab === 'PENDING') return pendingShipments
    return allShipments
  }, [filterTab, scannedShipments, pendingShipments, allShipments])

  // Xử lý quét mã trong modal
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = barcodeInput.trim().toUpperCase()
    if (!code) return

    // Tìm kiếm trong chuyến xe này
    const matched = allShipments.find(
      (s) => s.trackingNumber.toUpperCase() === code || s.orderId.toUpperCase() === code
    )

    if (!matched) {
      setScanNotice({
        type: 'error',
        message: `❌ BÁO ĐỘNG LẠC TUYẾN: Kiện [${code}] KHÔNG thuộc chuyến xe [${trip?.truckNumber || 'này'}]! Kiểm tra ngay tránh chất nhầm hàng.`,
      })
      setBarcodeInput('')
      return
    }

    if (matched.isScanned) {
      setScanNotice({
        type: 'error',
        message: `⚠️ Kiện [${matched.trackingNumber}] đã được quét nhận trước đó rồi!`,
      })
      setBarcodeInput('')
      return
    }

    try {
      await onReceiveShipment(matched.id)
      setLocalScannedIds((prev) => new Set(prev).add(matched.id))
      setScanNotice({
        type: 'success',
        message: `✅ Đã quét nhận: ${matched.trackingNumber} (${scannedCount + 1}/${totalCount})`,
      })
      setBarcodeInput('')
    } catch (err: any) {
      setScanNotice({
        type: 'error',
        message: `Lỗi cập nhật: ${err.message || 'Không thể quét nhận'}`,
      })
    }
  }

  // Quét nhận từng dòng
  const handleSingleReceive = async (s: LinehaulTripShipment) => {
    try {
      await onReceiveShipment(s.id)
      setLocalScannedIds((prev) => new Set(prev).add(s.id))
      setScanNotice({
        type: 'success',
        message: `✅ Đã nhận bưu kiện: ${s.trackingNumber}`,
      })
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể cập nhật'}`)
    }
  }

  // Nhận nhanh toàn bộ
  const handleReceiveAllClick = async () => {
    if (pendingShipments.length === 0) return
    const confirm = window.confirm(
      `Xác nhận bạn đã kiểm đếm vật lý đủ ${pendingShipments.length} kiện còn lại trên xe và muốn nhập kho toàn bộ?`
    )
    if (!confirm) return

    try {
      const ids = pendingShipments.map((s) => s.id)
      await onReceiveAllShipments(ids)
      setLocalScannedIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.add(id))
        return next
      })
      setScanNotice({
        type: 'success',
        message: `🎉 Đã nhập kho thành công toàn bộ ${totalCount} kiện của chuyến xe!`,
      })
    } catch (err: any) {
      alert(`Lỗi: ${err.message || 'Không thể nhận toàn bộ'}`)
    }
  }

  // Xác nhận lập biên bản thiếu hàng
  const handleConfirmDiscrepancy = async () => {
    if (!trip || pendingShipments.length === 0) return
    try {
      const missingIds = pendingShipments.map((s) => s.id)
      await onReportDiscrepancy(trip, missingIds, discrepancyReason)
      setIsDiscrepancyFormOpen(false)
      onClose()
    } catch (err: any) {
      alert(`Lỗi lập biên bản: ${err.message || 'Không thể xử lý'}`)
    }
  }

  if (!isOpen || !trip) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* ====== 1. MODAL HEADER ====== */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 border-b border-indigo-950/50 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black tracking-wide shadow-sm flex items-center gap-1.5">
                <span>🚛</span>
                <span>CHUYẾN XE LINEHAUL</span>
              </span>
              <span className="text-xl font-black font-mono tracking-tight text-white">
                [{trip.truckNumber}]
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1">
                <span>🔒 Mã Seal:</span>
                <b>{trip.sealNumber || 'N/A'}</b>
              </span>
            </div>

            <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap pt-0.5">
              <span>Bác tài: <b>{trip.truckDriver || 'Chưa cập nhật'}</b></span>
              {trip.truckDriverPhone && (
                <span>• 📞 <a href={`tel:${trip.truckDriverPhone}`} className="text-sky-300 underline font-mono">{trip.truckDriverPhone}</a></span>
              )}
              {trip.originHubName && (
                <span>• 🏭 Xuất phát từ: <b>{trip.originHubName}</b></span>
              )}
              <span>➔ Đích đến: <b className="text-emerald-300">{currentHubName}</b></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* ====== 2. TIẾN ĐỘ ĐỐI SOÁT THỜI GIAN THỰC ====== */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Tiến Độ Đối Soát & Dỡ Hàng (Reconciliation)
              </div>
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Đã Quét:</span>
                <span className={isComplete ? 'text-emerald-600' : 'text-indigo-600'}>
                  {scannedCount} / {totalCount} kiện
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Chỉ báo trạng thái */}
            <div>
              {isComplete ? (
                <div className="px-3.5 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-black flex items-center gap-1.5">
                  <span>✅</span>
                  <span>ĐÃ NHẬP ĐỦ 100% SỐ KIỆN TRÊN XE</span>
                </div>
              ) : (
                <div className="px-3.5 py-1.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-black flex items-center gap-1.5">
                  <span className="animate-pulse">⏳</span>
                  <span>CÒN THIẾU {pendingCount} KIỆN CHƯA QUÉT DỠ</span>
                </div>
              )}
            </div>
          </div>

          {/* Thanh progress bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
            <div
              className={`transition-all duration-300 rounded-full ${
                isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ====== 3. KHUNG QUÉT MÃ TRỰC TIẾP ====== */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-2 shrink-0">
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Bắn súng quét barcode hoặc gõ mã vận đơn (ZMX...) trên xe..."
                autoFocus
                disabled={actionLoading}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading || !barcodeInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm disabled:opacity-40 shrink-0 flex items-center gap-1"
            >
              <span>⚡</span>
              <span>Quét Nhận</span>
            </button>
          </form>

          {scanNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                scanNotice.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border border-rose-300 text-rose-700'
              }`}
            >
              <span>{scanNotice.message}</span>
              <button
                type="button"
                onClick={() => setScanNotice(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ====== 4. TABS BỘ LỌC KIỆN HÀNG ====== */}
        <div className="px-5 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              📦 Tất Cả ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filterTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              ⏳ Chưa Quét ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('SCANNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                filterTab === 'SCANNED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              ✅ Đã Quét ({scannedCount})
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Hiển thị <b>{displayList.length}</b> kiện
          </span>
        </div>

        {/* ====== 5. DANH SÁCH BẢNG KÊ CHI TIẾT ====== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl">📭</span>
              <p className="text-xs font-bold">Không có kiện hàng nào trong danh mục này</p>
            </div>
          ) : (
            displayList.map((s) => (
              <div
                key={s.id}
                className={`pt-2 pb-2 px-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  s.isScanned
                    ? 'bg-emerald-50/50 border border-emerald-200/60'
                    : 'bg-white hover:bg-slate-50 border border-slate-200/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-indigo-700">
                      {s.trackingNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{s.orderId.slice(0, 8)}...
                    </span>
                    {s.isScanned ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                        <span>✓</span>
                        <span>ĐÃ NHẬP KHO</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black border border-amber-200 flex items-center gap-1">
                        <span>⏳</span>
                        <span>CHỜ DỠ HÀNG</span>
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-600 flex items-center gap-3 flex-wrap">
                    <span>Người nhận: <b>{s.buyerName}</b> ({s.buyerPhone})</span>
                    <span>• 📍 <span className="text-slate-500 truncate max-w-xs inline-block align-bottom">{s.deliveryAddress}</span></span>
                    {s.package?.weight && (
                      <span>• ⚖️ <b>{s.package.weight} kg</b></span>
                    )}
                    {s.codAmount > 0 && (
                      <span className="text-rose-600 font-bold">• 💰 COD: {s.codAmount.toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!s.isScanned ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleSingleReceive(s)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      Quét Nhận
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold px-2 py-1">
                      Đã Kiểm Đếm
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ====== 6. FORM LẬP BIÊN BẢN BẤT THƯỜNG (NẾU THIẾU HÀNG) ====== */}
        {isDiscrepancyFormOpen && (
          <div className="p-4 bg-rose-50 border-t-2 border-rose-300 space-y-3 shrink-0 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                <span>⚠️</span>
                <span>BIÊN BẢN ĐỐI SOÁT THIẾU HÀNG CHUYẾN XE [{trip.truckNumber}]</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscrepancyFormOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕ Hủy bỏ
              </button>
            </div>

            <div className="text-xs text-rose-700">
              Phát hiện <b>{pendingCount} kiện hàng</b> có tên trong bảng kê chuyến xe của Kho gửi nhưng <b>KHÔNG TÌM THẤY TRONG THÙNG XE</b> khi dỡ tại {currentHubName}.
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">
                Lý do ghi nhận biên bản đối soát:
              </label>
              <select
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 font-medium focus:outline-none"
              >
                <option value="Thùng xe dỡ hết nhưng không tìm thấy kiện hàng">
                  Thùng xe dỡ hết nhưng không tìm thấy kiện hàng (Nghi vấn bỏ quên tại kho gửi)
                </option>
                <option value="Seal thùng xe có dấu hiệu bị rách / hỏng / mở trước khi đến">
                  Seal thùng xe có dấu hiệu bị rách / hỏng / mở trước khi đến bưu cục
                </option>
                <option value="Kiện hàng bị rơi mất / thất lạc dọc đường trung chuyển">
                  Kiện hàng bị rơi mất / thất lạc dọc đường trung chuyển
                </option>
                <option value="Tài xế xác nhận giao nhầm sang bưu cục dọc tuyến">
                  Tài xế xác nhận giao nhầm sang bưu cục dọc tuyến
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDiscrepancyFormOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Quay Lại
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDiscrepancy}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>📝</span>
                <span>Xác Nhận Ký Biên Bản & Gắn Cờ Thất Lạc ({pendingCount} kiện)</span>
              </button>
            </div>
          </div>
        )}

        {/* ====== 7. FOOTER ACTIONS ====== */}
        {!isDiscrepancyFormOpen && (
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              {isComplete ? (
                <span className="text-emerald-700 font-bold">
                  ✓ Toàn bộ {totalCount} kiện hàng đã được dỡ và đối soát đầy đủ.
                </span>
              ) : (
                <span>
                  Chưa quét: <b className="text-rose-600">{pendingCount} kiện</b> còn lại trên xe.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
              {/* Nút lập biên bản thiếu hàng nếu chưa nhận hết */}
              {!isComplete && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setIsDiscrepancyFormOpen(true)}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>⚠️</span>
                  <span>Lập Biên Bản Thiếu Hàng ({pendingCount} kiện)</span>
                </button>
              )}

              {/* Nút nhận đủ nhanh nếu muốn xác nhận toàn bộ */}
              {!isComplete && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleReceiveAllClick}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200 flex items-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Nhận Nhanh Tất Cả ({pendingCount})</span>
                </button>
              )}

              {/* Nút đóng / hoàn tất */}
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 ${
                  isComplete
                    ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <span>{isComplete ? '🎉' : '✕'}</span>
                <span>{isComplete ? 'Hoàn Tất Tiếp Nhận Chuyến Xe' : 'Đóng Bảng Kê'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
