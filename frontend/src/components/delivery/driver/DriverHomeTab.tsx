import React from 'react'

export interface DriverHomeTabProps {
  currentUser: any
  driverProfile: any
  pickupCount: number
  deliveryCount: number
  completedCount: number
  codInWallet: number
  onToggleOnline: () => void
  driverState: 'ONLINE' | 'OFFLINE'
  onOpenCheckIn?: () => void
  onCheckOut?: () => void
  attendanceToday?: any
  onDrainQueue?: () => void
}

/**
 * DriverHomeTab - Dashboard / Trang chủ cho tài xế ZeroMall
 * Bao gồm trạng thái Online/Offline, điểm danh ca làm việc (Check-in camera & GPS), thẻ thống kê và cảnh báo.
 */
export const DriverHomeTab: React.FC<DriverHomeTabProps> = ({
  currentUser,
  driverProfile,
  pickupCount,
  deliveryCount,
  completedCount,
  codInWallet,
  onToggleOnline,
  driverState,
  onOpenCheckIn,
  onCheckOut,
  attendanceToday,
  onDrainQueue,
}) => {
  // Định dạng tiền tệ VND
  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  const isOnline = driverState === 'ONLINE'
  const isCodCritical = (codInWallet || 0) >= 10000000
  const isCodWarning = !isCodCritical && (codInWallet || 0) >= 8000000

  // Thời gian điểm danh định dạng giờ:phút
  const checkInTime = attendanceToday?.checkInAt
    ? new Date(attendanceToday.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="space-y-4">
      {/* 1. Thẻ Điểm Danh & Trạng Thái Ca Làm Việc Chuẩn SPX */}
      <div
        className={`rounded-3xl p-4 text-white transition-all duration-300 shadow-md ${
          isOnline
            ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
            : 'bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-4 w-4 ${
                  isOnline ? 'bg-emerald-300 ring-2 ring-emerald-100' : 'bg-rose-400'
                }`}
              ></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-black text-sm tracking-wide">
                  {isOnline ? `ĐÃ VÀO CA LÀM VIỆC (${currentUser?.name || 'ONLINE'})` : `CHƯA VÀO CA (OFFLINE - ${currentUser?.name || 'Tài xế'})`}
                </p>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-semibold">
                  {driverProfile?.hub?.code || 'SPX Hub'}
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium mt-0.5">
                {isOnline
                  ? `Điểm danh lúc: ${checkInTime || 'Hôm nay'} • Trạm: ${driverProfile?.hub?.name || 'Khai thác'}`
                  : '⚠️ Bạn đang Offline. Hệ thống KHÔNG gán đơn lấy hàng khi chưa điểm danh.'}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <button
                type="button"
                onClick={onCheckOut || onToggleOnline}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30 transition cursor-pointer shadow-xs"
              >
                Kết Thúc Ca
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCheckIn}
                className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-lg flex items-center gap-1.5 animate-bounce"
              >
                <span>📸</span> Điểm Danh Ngay
              </button>
            )}
          </div>
        </div>

        {/* Nút quét đơn bưu cục nếu đang Online */}
        {isOnline && onDrainQueue && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-white/80 text-[11px]">
              Khu vực phụ trách: <span className="font-semibold text-white">{driverProfile?.operatingArea || driverProfile?.assignedDistrict || 'Nội thành'}</span>
            </span>
            <button
              type="button"
              onClick={onDrainQueue}
              className="text-[11px] bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>⚡</span> Quét đơn chờ tại Hub
            </button>
          </div>
        )}
      </div>

      {/* 2. Thẻ cảnh báo hạn mức COD */}
      {isCodCritical && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 space-y-1.5 shadow-xs text-rose-900 animate-pulse">
          <div className="flex items-center gap-2 font-black text-xs text-rose-700">
            <span className="text-base">🚨</span>
            <span>CẢNH BÁO: VƯỢT HẠN MỨC COD (10.000.000đ)</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            Bạn đang giữ <span className="font-bold">{formatMoney(codInWallet)}</span> tiền COD. Hệ thống đã tạm dừng gán đơn mới. Vui lòng nộp tiền về Bưu cục để tiếp tục nhận đơn.
          </p>
        </div>
      )}

      {isCodWarning && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-1.5 shadow-xs text-amber-900">
          <div className="flex items-center gap-2 font-black text-xs text-amber-700">
            <span className="text-base">⚠️</span>
            <span>CẢNH BÁO: SẮP ĐẠT HẠN MỨC COD</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Tiền COD đang giữ hiện tại là <span className="font-bold">{formatMoney(codInWallet)}</span>, sắp chạm hạn mức 10.000.000đ. Vui lòng chuẩn bị nộp tiền về Bưu cục.
          </p>
        </div>
      )}

      {/* 3. Lưới 3 thẻ thống kê (Stat Cards) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Cần Lấy */}
        <div
          className={`border p-3 rounded-2xl text-center space-y-1 shadow-xs transition ${
            isOnline
              ? 'bg-amber-50/70 border-amber-200/80'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <span className="text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700">
            <span>{isOnline ? '📦' : '🔒'}</span> Cần Lấy
          </span>
          <p className={`text-2xl font-black ${isOnline ? 'text-amber-600' : 'text-slate-400'}`}>
            {isOnline ? (pickupCount ?? 0) : 0}
          </p>
        </div>

        {/* Cần Giao */}
        <div
          className={`border p-3 rounded-2xl text-center space-y-1 shadow-xs transition ${
            isOnline
              ? 'bg-orange-50/70 border-orange-200/80'
              : 'bg-slate-50 border-slate-200 opacity-60'
          }`}
        >
          <span className="text-[11px] font-semibold flex items-center justify-center gap-1 text-slate-700">
            <span>{isOnline ? '🛵' : '🔒'}</span> Cần Giao
          </span>
          <p className={`text-2xl font-black ${isOnline ? 'text-orange-600' : 'text-slate-400'}`}>
            {isOnline ? (deliveryCount ?? 0) : 0}
          </p>
        </div>

        {/* COD Đang Giữ */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl text-center space-y-1 shadow-xs">
          <span className="text-[11px] text-emerald-800 font-semibold flex items-center justify-center gap-1">
            <span>💰</span> COD Đang Giữ
          </span>
          <p className="text-xs font-black text-emerald-700 mt-1 truncate" title={formatMoney(codInWallet)}>
            {formatMoney(codInWallet)}
          </p>
        </div>
      </div>

      {/* Thông báo chế độ Ngoại Tuyến */}
      {!isOnline && (
        <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900 shadow-xs">
          <span className="text-xl">🔒</span>
          <div className="flex-1">
            <p className="font-bold text-[11px] text-amber-950">Chế độ Ngoại Tuyến (Offline)</p>
            <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
              Danh sách đơn lấy và giao hàng đang tạm khóa. Vui lòng bấm <strong>"Điểm Danh Ngay"</strong> để vào ca làm việc và mở khóa nhiệm vụ trong ngày.
            </p>
          </div>
        </div>
      )}

      {/* 4. Tổng kết nhanh */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <span>📊</span> Tổng kết ca làm việc
          </h4>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
            Hôm nay
          </span>
        </div>
        <p className="text-xs text-slate-700 font-medium">
          Hôm nay đã hoàn thành <span className="font-black text-emerald-600 text-sm">{completedCount ?? 0}</span> đơn
        </p>
      </div>
    </div>
  )
}
