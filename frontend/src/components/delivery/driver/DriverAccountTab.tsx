import React from 'react'

export interface DriverAccountTabProps {
  currentUser: any
  driverProfile: any
  completedCount: number
  totalOrders: number
  onLogout: () => void
}

/**
 * DriverAccountTab - Thông tin tài xế và hiệu suất giao hàng
 * Hiển thị thẻ hồ sơ tài xế, thông tin chi tiết xe & bưu cục, các chỉ số KPI và nút đăng xuất.
 */
export const DriverAccountTab: React.FC<DriverAccountTabProps> = ({
  currentUser,
  driverProfile,
  completedCount,
  totalOrders,
  onLogout,
}) => {
  const driverName = currentUser?.name || currentUser?.fullName || ''
  const driverPhone = driverProfile?.phone || currentUser?.phoneNumber || ''
  const vehicleNumber = driverProfile?.vehicleNumber || ''
  const vehicleType = driverProfile?.vehicleType || 'Xe máy'
  const hubName = driverProfile?.hub?.name || ''
  const email = currentUser?.email || ''

  const safeTotal = totalOrders || 0
  const safeCompleted = completedCount || 0
  const successRate = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0

  return (
    <div className="space-y-4">
      {/* 1. Thẻ hồ sơ tài xế (Profile Card) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl shrink-0 border-2 border-emerald-500/30">
          🛵
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="font-black text-slate-800 text-base leading-tight truncate">
            {driverName}
          </h3>
          {driverPhone && (
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span>📞</span> {driverPhone}
            </p>
          )}
          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md uppercase">
            Tài Xế ZeroExpress
          </span>
        </div>
      </div>

      {/* 2. Phần chỉ số hiệu suất (KPI Section) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <span>📈</span> Chỉ Số Hiệu Suất (KPI)
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Tổng hoàn thành</span>
            <p className="text-lg font-black text-emerald-600">{safeCompleted}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Tổng được gán</span>
            <p className="text-lg font-black text-slate-700">{safeTotal}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-500 font-medium block">Tỷ lệ thành công</span>
            <p className="text-lg font-black text-emerald-700">{successRate}%</p>
          </div>
        </div>
      </div>

      {/* 3. Bảng thông tin chi tiết (Info Rows) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <span>📋</span> Thông Tin Chi Tiết
        </h4>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Biển Số Xe:</span>
            <span className="font-bold font-mono text-slate-800">{vehicleNumber}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Loại Xe:</span>
            <span className="font-bold text-slate-800">{vehicleType}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Bưu Cục:</span>
            <span className="font-bold text-slate-800">{hubName}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Email:</span>
            <span className="font-bold text-slate-800 truncate max-w-[200px]">{email}</span>
          </div>
        </div>
      </div>

      {/* 4. Nút Đăng Xuất */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
      >
        <span>🚪</span> Đăng Xuất
      </button>
    </div>
  )
}
