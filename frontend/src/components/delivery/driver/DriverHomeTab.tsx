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
}

/**
 * DriverHomeTab - Dashboard / Trang chủ cho tài xế ZeroMall
 * Bao gồm trạng thái Online/Offline, thẻ thống kê (Cần lấy, Cần giao, COD), cảnh báo hạn mức COD và tổng kết trong ngày.
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
}) => {
  // Định dạng tiền tệ VND
  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  const isOnline = driverState === 'ONLINE'
  const isCodCritical = (codInWallet || 0) >= 10000000
  const isCodWarning = !isCodCritical && (codInWallet || 0) >= 8000000

  return (
    <div className="space-y-4">
      {/* 1. Banner chuyển đổi trạng thái Online / Offline */}
      <div
        className={`rounded-2xl p-4 flex items-center justify-between text-white transition-colors duration-200 shadow-sm ${
          isOnline ? 'bg-emerald-600' : 'bg-slate-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isOnline ? 'bg-emerald-200' : 'bg-slate-400'
              }`}
            ></span>
          </span>
          <div>
            <p className="font-bold text-sm leading-tight">
              {isOnline ? `SẴN SÀNG NHẬN ĐƠN (${currentUser?.name || 'ONLINE'})` : 'TẠM NGHỈ (OFFLINE)'}
            </p>
            <p className="text-[11px] text-emerald-100/90 font-medium">
              {driverProfile?.hub?.name ? `Bưu cục: ${driverProfile.hub.name}` : (isOnline ? 'Hệ thống đang điều phối đơn hàng' : 'Đang tạm ngưng nhận các yêu cầu mới')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleOnline}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
            isOnline
              ? 'bg-white text-emerald-800 hover:bg-emerald-50'
              : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}
        >
          {isOnline ? 'Tạm Nghỉ' : 'Bật Online'}
        </button>
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
        {/* Cần Lấy - Màu hổ phách (Amber) */}
        <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-2xl text-center space-y-1 shadow-xs">
          <span className="text-[11px] text-amber-800 font-semibold flex items-center justify-center gap-1">
            <span>📦</span> Cần Lấy
          </span>
          <p className="text-2xl font-black text-amber-600">{pickupCount ?? 0}</p>
        </div>

        {/* Cần Giao - Màu cam (Orange) */}
        <div className="bg-orange-50/70 border border-orange-200/80 p-3 rounded-2xl text-center space-y-1 shadow-xs">
          <span className="text-[11px] text-orange-800 font-semibold flex items-center justify-center gap-1">
            <span>🛵</span> Cần Giao
          </span>
          <p className="text-2xl font-black text-orange-600">{deliveryCount ?? 0}</p>
        </div>

        {/* COD Đang Giữ - Màu xanh ngọc (Emerald) */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl text-center space-y-1 shadow-xs">
          <span className="text-[11px] text-emerald-800 font-semibold flex items-center justify-center gap-1">
            <span>💰</span> COD Đang Giữ
          </span>
          <p className="text-xs font-black text-emerald-700 mt-1 truncate" title={formatMoney(codInWallet)}>
            {formatMoney(codInWallet)}
          </p>
        </div>
      </div>

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
