import React from 'react'
import type { Hub } from './types'

interface AdminTopBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  onSearchSubmit?: () => void
  selectedHubId: string
  onSelectHub: (hubId: string) => void
  hubs: Hub[]
  onRefresh: () => void
  loading?: boolean
  slaRate?: number
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedHubId,
  onSelectHub,
  hubs,
  onRefresh,
  loading = false,
  slaRate = 97.8,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 py-2.5 px-6 sticky top-0 z-30 shadow-2xs text-left">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Left: Global Search Box */}
        <div className="w-full md:w-96 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearchSubmit) {
                onSearchSubmit()
              }
            }}
            placeholder="Tra cứu nhanh mã ZMX, mã đơn #, tên khách, SĐT..."
            className="w-full pl-9 pr-16 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-600 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition font-medium"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">
              Enter
            </span>
          )}
        </div>

        {/* Right: Hub Selector & SLA Health Indicator & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* SLA Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-950 font-bold">SLA Giao Hàng:</span>
            <span className="font-black text-emerald-700 font-mono">{slaRate}%</span>
            <span className="text-[10px] text-emerald-600">Đạt chuẩn</span>
          </div>

          {/* Hub Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Khu vực:</span>
            <select
              value={selectedHubId}
              onChange={(e) => onSelectHub(e.target.value)}
              aria-label="Chọn bưu cục / khu vực khai thác"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="ALL">🌐 Toàn Quốc (Tất Cả Hubs)</option>
              {hubs.map((hub) => (
                <option key={hub.id} value={hub.id}>
                  🏢 [{hub.code}] {hub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
            <span className="hidden sm:inline">Làm Mới</span>
          </button>
        </div>
      </div>
    </header>
  )
}
