import React from 'react'
import type { LinehaulTrip } from './types'

interface HubLinehaulTripsBannerProps {
  linehaulTrips: LinehaulTrip[]
  inTransitTotalCount: number
  onOpenReconciliation: (trip: LinehaulTrip) => void
}

export const HubLinehaulTripsBanner: React.FC<HubLinehaulTripsBannerProps> = ({
  linehaulTrips,
  inTransitTotalCount,
  onOpenReconciliation,
}) => {
  return (
    <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-b border-indigo-900/60 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-lg">
            🚛
          </div>
          <div>
            <h4 className="font-black text-sm text-white">
              Bảng Kê Chuyến Xe Tuyến Đang Cập Bến ({linehaulTrips.length} chuyến)
            </h4>
            <p className="text-[11px] text-slate-300">
              Đối soát Seal chì & kiểm đếm bưu kiện khi dỡ xe để tránh thất lạc
            </p>
          </div>
        </div>

        <div className="text-[11px] text-indigo-300 font-mono">
          Tổng cộng: <b>{inTransitTotalCount} kiện</b> đang trên đường đến
        </div>
      </div>

      {linehaulTrips.length === 0 ? (
        <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-800/40 rounded-xl border border-slate-700/60">
          Chưa có chuyến xe tải nào đang trung chuyển đến bưu cục này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {linehaulTrips.map((trip) => (
            <div
              key={trip.tripKey}
              className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3.5 space-y-2.5 transition shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-mono font-black text-sm text-sky-400 flex items-center gap-1.5">
                    <span>🚛</span>
                    <span>[{trip.truckNumber}]</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">
                    Bác tài: <b>{trip.truckDriver}</b>
                    {trip.truckDriverPhone && (
                      <span className="text-slate-400 font-mono"> ({trip.truckDriverPhone})</span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-mono font-bold shrink-0">
                  🔒 {trip.sealNumber}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                <span className="text-slate-400 text-[11px]">
                  Quy mô: <b className="text-white font-mono">{trip.shipments.length} kiện</b>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenReconciliation(trip)}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>📋</span>
                  <span>Mở Bảng Kê Đối Soát</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
