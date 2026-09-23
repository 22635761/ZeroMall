import React from 'react'
import type { DockTruck } from './LinehaulDispatchModal'

interface HubDockTruckListProps {
  dockTrucks: DockTruck[]
  activeScanDockTruckId: string | null
  setActiveScanDockTruckId: (id: string) => void
  actionLoading: boolean
  getMatchingUnloadedParcelsForTruck: (truck: DockTruck) => any[]
  handleBatchLoadRouteToTruck: (truck: DockTruck) => void
  handleOpenSealModal: (truck: DockTruck) => void
  handleUnloadEntireDockTruck: (truck: DockTruck) => void
}

export const HubDockTruckList: React.FC<HubDockTruckListProps> = ({
  dockTrucks,
  activeScanDockTruckId,
  setActiveScanDockTruckId,
  actionLoading,
  getMatchingUnloadedParcelsForTruck,
  handleBatchLoadRouteToTruck,
  handleOpenSealModal,
  handleUnloadEntireDockTruck,
}) => {
  if (dockTrucks.length === 0) return null

  return (
    <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white border-b border-sky-900/60 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-600/60 border border-sky-400/40 flex items-center justify-center text-lg">
            🚛
          </div>
          <div>
            <h4 className="font-black text-sm text-white flex items-center gap-2">
              <span>Các Chuyến Xe Tải Đang Mở Tại Cửa Dock</span>
              <span className="px-2 py-0.5 bg-sky-500/30 border border-sky-400/50 rounded-full text-[10px] font-mono font-bold text-sky-300">
                {dockTrucks.length} xe đang chờ gom
              </span>
            </h4>
            <p className="text-[11px] text-slate-300">
              Thùng xe vẫn đang mở. Bạn có thể tiếp tục bắn bưu kiện lên xe hoặc chốt khóa Seal chì để xuất bến.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {dockTrucks.map((dt) => {
          const isSelectedForScan = activeScanDockTruckId === dt.id
          return (
            <div
              key={dt.id}
              onClick={() => setActiveScanDockTruckId(dt.id)}
              className={`rounded-2xl p-4 space-y-3 transition cursor-pointer relative border-2 ${
                isSelectedForScan
                  ? 'bg-gradient-to-br from-slate-800 to-sky-950/80 border-sky-400 shadow-lg shadow-sky-950/50 ring-2 ring-sky-400/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {isSelectedForScan && (
                <span className="absolute -top-2.5 right-3 px-2 py-0.5 bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1">
                  <span>⚡</span> Mục Tiêu Bắn
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-mono font-black text-base text-sky-400 flex items-center gap-1.5">
                    <span>🚛</span>
                    <span>[{dt.truckNumber}]</span>
                  </div>
                  <div className="text-xs text-slate-200 font-bold flex items-center gap-1">
                    <span>Tuyến:</span>
                    <span className="text-teal-300 font-extrabold">{dt.targetHubName}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-black shrink-0">
                  {dt.shipments.length} kiện
                </span>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between items-center">
                <span>Tài xế: <b className="text-slate-200">{dt.truckDriver}</b></span>
                {dt.truckDriverPhone && <span className="font-mono text-slate-400">{dt.truckDriverPhone}</span>}
              </div>

              {/* 1-Click: Gom toàn bộ kiện hàng cùng tuyến còn lại trong kho */}
              {(() => {
                const matchingUnloaded = getMatchingUnloadedParcelsForTruck(dt)
                if (matchingUnloaded.length > 0) {
                  return (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBatchLoadRouteToTruck(dt)
                      }}
                      disabled={actionLoading}
                      className="w-full py-2 px-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <span>⚡</span>
                      <span>Gom Toàn Bộ {matchingUnloaded.length} Kiện Cùng Tuyến Vào Xe</span>
                    </button>
                  )
                }
                return (
                  <div className="text-[10px] text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 rounded-xl px-2.5 py-1 text-center font-bold">
                    ✓ Đã gom hết kiện hàng chờ xuất tuyến này trong kho
                  </div>
                )
              })()}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenSealModal(dt)
                  }}
                  className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>🔒</span>
                  <span>Niêm Phong Seal & Xuất Bến</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnloadEntireDockTruck(dt)
                  }}
                  title="Dỡ toàn bộ kiện hàng trở lại sàn kho"
                  className="px-2.5 py-2 bg-slate-700/80 hover:bg-rose-900/60 hover:border-rose-500 border border-slate-600 text-slate-300 hover:text-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Dỡ xe
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
