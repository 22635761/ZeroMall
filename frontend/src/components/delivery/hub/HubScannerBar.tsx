import React from 'react'
import type { StationTab, DockTruck } from './types'
import { BarcodeCameraScanner } from '../BarcodeCameraScanner'

interface HubScannerBarProps {
  stationTab: StationTab
  dockTrucks: DockTruck[]
  activeScanDockTruckId: string | null
  setActiveScanDockTruckId: (id: string) => void
  directScanMode: boolean
  setDirectScanMode: (val: boolean) => void
  scannedCode: string
  setScannedCode: (code: string) => void
  onScanSubmit: (e: React.FormEvent) => void
  scanMessage: { type: 'success' | 'error' | 'info'; text: string } | null
  isCameraScannerOpen: boolean
  setIsCameraScannerOpen: React.Dispatch<React.SetStateAction<boolean>>
  actionLoading: boolean
  onScanCode: (code: string) => void
}

const SCAN_CONFIG = {
  INBOUND_PICKUP: {
    title: '1. Nhận Từ Shipper',
    placeholder: 'Quét mã vận đơn để NHẬP KHO từ Shipper bàn giao...',
    buttonLabel: '📥 Quét Nhập Kho',
    buttonColor: 'bg-amber-600 hover:bg-amber-500',
  },
  SORTING_LINEHAUL: {
    title: '2. Phân Loại & Đóng Xe Tải',
    placeholder: 'Quét mã vận đơn để MỞ PHIÊN ĐÓNG XE TẢI LINEHAUL...',
    buttonLabel: '🚛 Quét & Đóng Xe',
    buttonColor: 'bg-sky-600 hover:bg-sky-500',
  },
  INBOUND_RECEIVING: {
    title: '3. Tiếp Nhận Xe Tải Đến',
    placeholder: 'Quét mã vận đơn để CẮT SEAL & NHẬP BƯU CỤC PHÁT...',
    buttonLabel: '🏢 Quét Nhận Hàng',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-500',
  },
  DISPATCH_LASTMILE: {
    title: '4. Chia Tuyến Giao',
    placeholder: 'Quét mã vận đơn để GÁN SHIPPER giao tận nhà...',
    buttonLabel: '🛵 Quét Gán Tuyến',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-500',
  },
}

export const HubScannerBar: React.FC<HubScannerBarProps> = ({
  stationTab,
  dockTrucks,
  activeScanDockTruckId,
  setActiveScanDockTruckId,
  directScanMode,
  setDirectScanMode,
  scannedCode,
  setScannedCode,
  onScanSubmit,
  scanMessage,
  isCameraScannerOpen,
  setIsCameraScannerOpen,
  actionLoading,
  onScanCode,
}) => {
  const currentCfg = SCAN_CONFIG[stationTab]
  const targetTruck = dockTrucks.find((t) => t.id === activeScanDockTruckId) || dockTrucks[0]

  const dynamicPlaceholder =
    stationTab === 'SORTING_LINEHAUL' && dockTrucks.length > 0 && directScanMode && targetTruck
      ? `🔫 Bắn súng quét PDA liên thanh nạp thẳng vào Xe [${targetTruck.truckNumber}]...`
      : currentCfg.placeholder

  const dynamicButtonLabel =
    stationTab === 'SORTING_LINEHAUL' && dockTrucks.length > 0 && directScanMode && targetTruck
      ? `⚡ Bắn Lên Xe [${targetTruck.truckNumber}]`
      : currentCfg.buttonLabel

  const dynamicButtonColor =
    stationTab === 'SORTING_LINEHAUL' && dockTrucks.length > 0 && directScanMode
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
      : currentCfg.buttonColor

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-600">
          <span>📟</span>
          <span>Máy Quét Mã Vạch — Khâu:</span>
          <span className="text-emerald-700">{currentCfg.title}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCameraScannerOpen((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm border shrink-0 ${
            isCameraScannerOpen
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span>{isCameraScannerOpen ? '✕' : '📷'}</span>
          <span>{isCameraScannerOpen ? 'Tắt Camera Quét' : 'Bật Camera Quét Mã'}</span>
        </button>
      </div>

      {/* Live Camera Scanner Viewfinder */}
      {isCameraScannerOpen && (
        <div className="pt-2">
          <BarcodeCameraScanner
            isInline
            onScanSuccess={(code) => {
              onScanCode(code)
            }}
            onClose={() => setIsCameraScannerOpen(false)}
          />
        </div>
      )}

      {/* Chế độ Bắn Hàng Trực Tiếp Lên Xe Tuyến (Tab 2: SORTING_LINEHAUL) */}
      {stationTab === 'SORTING_LINEHAUL' && dockTrucks.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border-2 border-sky-300 rounded-2xl space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-sky-950">
              <span className="text-base">🎯</span>
              <span>Mục Tiêu Bắn Hàng Trực Tiếp Lên Xe (Scan-to-Truck):</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold">Chế độ súng quét:</span>
              <button
                type="button"
                onClick={() => setDirectScanMode(!directScanMode)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black cursor-pointer transition flex items-center gap-1.5 border shadow-xs ${
                  directScanMode
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{directScanMode ? '⚡ Nạp Thẳng Vào Xe (Không Popup)' : '⚙️ Mở Modal Xác Nhận'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            <span className="text-[10px] text-slate-500 font-bold">Chọn xe nhận hàng:</span>
            {dockTrucks.map((dt) => {
              const isActive = (activeScanDockTruckId || dockTrucks[0].id) === dt.id
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setActiveScanDockTruckId(dt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? 'bg-sky-600 text-white border-sky-700 shadow-sm ring-2 ring-sky-400/40'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🚛 [{dt.truckNumber}]</span>
                  <span className="text-[10px] font-sans font-normal opacity-90">➔ {dt.targetHubName}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] rounded-md font-bold ${
                      isActive ? 'bg-sky-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {dt.shipments.length} kiện
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <form onSubmit={onScanSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-4 top-3 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            placeholder={dynamicPlaceholder}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={actionLoading || !scannedCode.trim()}
          className={`px-6 py-3 ${dynamicButtonColor} text-white font-black rounded-xl text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40`}
        >
          {dynamicButtonLabel}
        </button>
      </form>

      {scanMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-bold ${
            scanMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-700'
              : scanMessage.type === 'info'
              ? 'bg-sky-50 border border-sky-300 text-sky-700'
              : 'bg-rose-50 border border-rose-300 text-rose-700'
          }`}
        >
          {scanMessage.text}
        </div>
      )}
    </div>
  )
}
