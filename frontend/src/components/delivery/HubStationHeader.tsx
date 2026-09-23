import React from 'react'

export interface Hub {
  id: string
  code: string
  name: string
  type: string
  province: string
  district: string
}

interface HubStationHeaderProps {
  currentHub: Hub | null
  pickupInboundCount: number
  sortingCount: number
  inTransitCount: number
  destinationCount: number
  completedTodayCount: number
}

export const HubStationHeader: React.FC<HubStationHeaderProps> = ({
  currentHub,
  pickupInboundCount,
  sortingCount,
  inTransitCount,
  destinationCount,
  completedTodayCount,
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg space-y-5">
      {/* Hub Identity Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xl shadow-md">
              🏭
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Trạm Khai Thác Bưu Cục
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Sorting Hub Station • Đóng xe Linehaul & Niêm phong Seal chì
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-600">
          <span className="text-emerald-400 text-lg">🏢</span>
          <div>
            <div className="text-xs font-black text-emerald-400 leading-tight">
              {currentHub?.name || 'Bưu Cục Chưa Xác Định'}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Mã: {currentHub?.code} • {currentHub?.province}
            </div>
          </div>
          <span className="ml-2 px-1.5 py-0.5 bg-emerald-900/60 border border-emerald-600/50 rounded text-[9px] font-black text-emerald-400 uppercase">
            🔒 Cố Định
          </span>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Chờ Nhận Từ Shipper', value: pickupInboundCount, icon: '📥', color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30', textColor: 'text-amber-400' },
          { label: 'Chờ Đóng Xe Tải', value: sortingCount, icon: '📦', color: 'from-sky-500/20 to-sky-600/10 border-sky-500/30', textColor: 'text-sky-400' },
          { label: 'Xe Tải Đang Đến', value: inTransitCount, icon: '🚛', color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30', textColor: 'text-indigo-400' },
          { label: 'Chờ Chia Tuyến Giao', value: destinationCount, icon: '🛵', color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30', textColor: 'text-emerald-400' },
          { label: 'Đã Xử Lý (Tổng)', value: completedTodayCount, icon: '✅', color: 'from-green-500/20 to-green-600/10 border-green-500/30', textColor: 'text-green-400' },
        ].map((kpi, i) => (
          <div key={i} className={`bg-gradient-to-br ${kpi.color} border rounded-2xl p-3.5 space-y-1.5`}>
            <div className="flex justify-between items-start">
              <span className="text-lg">{kpi.icon}</span>
              <span className={`text-2xl font-black ${kpi.textColor}`}>{kpi.value}</span>
            </div>
            <p className="text-[10px] text-slate-300 font-bold leading-tight">{kpi.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
