import React from 'react'
import type { DockTruck } from './types'

interface DockTruckQuickSealModalProps {
  sealingDockTruck: DockTruck | null
  onClose: () => void
  quickSealNumber: string
  setQuickSealNumber: (val: string) => void
  onConfirmSeal: () => void
  actionLoading: boolean
}

export const DockTruckQuickSealModal: React.FC<DockTruckQuickSealModalProps> = ({
  sealingDockTruck,
  onClose,
  quickSealNumber,
  setQuickSealNumber,
  onConfirmSeal,
  actionLoading,
}) => {
  if (!sealingDockTruck) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔒</span>
            <div>
              <h4 className="font-black text-sm text-white">Niêm Phong Seal Chì Xuất Bến</h4>
              <p className="text-[10px] text-amber-100 font-mono">
                Xe: [{sealingDockTruck.truckNumber}] • Tuyến: {sealingDockTruck.targetHubName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Quy mô xuất bến:</span>
              <span className="font-black text-slate-800">{sealingDockTruck.shipments.length} bưu kiện</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Tài xế phụ trách:</span>
              <span className="font-bold text-slate-800">
                {sealingDockTruck.truckDriver} ({sealingDockTruck.truckDriverPhone || 'Không có SĐT'})
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Bưu cục tiếp nhận:</span>
              <span className="font-bold text-indigo-700">{sealingDockTruck.targetHubName}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-black text-amber-950 block text-xs">
              Mã Khóa Chì Niêm Phong (Security Seal Number) <span className="text-rose-500">*</span>:
            </label>
            <div className="relative">
              <input
                type="text"
                value={quickSealNumber}
                onChange={(e) => setQuickSealNumber(e.target.value.toUpperCase())}
                placeholder="VD: SEAL-HN-HCM-9821"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-amber-400 rounded-xl font-mono font-black text-amber-900 text-xs tracking-wider uppercase focus:outline-none focus:border-amber-600"
                required
              />
              <span className="absolute right-2.5 top-2 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                ZMX CHÍNH HÃNG
              </span>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Dập khóa Seal vào cửa thùng xe trước khi tài xế nổ máy xuất bến.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              onClick={onConfirmSeal}
              disabled={actionLoading || !quickSealNumber.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
            >
              {actionLoading ? (
                <span>Đang Xuất Bến...</span>
              ) : (
                <>
                  <span>🔒</span>
                  <span>Chốt Seal & Xuất Bến ({sealingDockTruck.shipments.length} Kiện)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
