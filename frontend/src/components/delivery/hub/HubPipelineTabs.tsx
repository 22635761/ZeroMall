import React from 'react'
import type { StationTab } from './types'

interface TabConfig {
  id: StationTab
  title: string
  desc: string
  count: number
  icon: string
  activeColor: string
  countColor: string
}

interface HubPipelineTabsProps {
  currentTab: StationTab
  onSelectTab: (tab: StationTab) => void
  pickupCount: number
  returnCount: number
  sortingCount: number
  inTransitCount: number
  destinationCount: number
}

export const HubPipelineTabs: React.FC<HubPipelineTabsProps> = ({
  currentTab,
  onSelectTab,
  pickupCount,
  returnCount,
  sortingCount,
  inTransitCount,
  destinationCount,
}) => {
  const tabs: TabConfig[] = [
    {
      id: 'INBOUND_PICKUP',
      title: '1. Nhận Từ Shipper',
      desc:
        returnCount > 0
          ? `Tiếp nhận ${pickupCount} đơn Shop, ${returnCount} đơn Thu Hồi`
          : 'Tiếp nhận bưu kiện Shipper First-Mile bàn giao',
      count: pickupCount + returnCount,
      icon: '📥',
      activeColor: 'border-amber-500 bg-amber-50 ring-amber-200',
      countColor: 'text-amber-700 bg-amber-100 border-amber-300',
    },
    {
      id: 'SORTING_LINEHAUL',
      title: '2. Phân Loại & Đóng Xe Tải',
      desc: 'Phân luồng, chọn xe tải & niêm phong Seal chì',
      count: sortingCount,
      icon: '🚛',
      activeColor: 'border-sky-500 bg-sky-50 ring-sky-200',
      countColor: 'text-sky-700 bg-sky-100 border-sky-300',
    },
    {
      id: 'INBOUND_RECEIVING',
      title: '3. Tiếp Nhận Xe Tải Đến',
      desc: 'Cắt Seal & nhận kiện từ xe tải về bưu cục phát',
      count: inTransitCount,
      icon: '🏢',
      activeColor: 'border-indigo-500 bg-indigo-50 ring-indigo-200',
      countColor: 'text-indigo-700 bg-indigo-100 border-indigo-300',
    },
    {
      id: 'DISPATCH_LASTMILE',
      title: '4. Chia Tuyến Giao',
      desc: 'Bàn giao Shipper Last-Mile đi phát tận nhà',
      count: destinationCount,
      icon: '🛵',
      activeColor: 'border-emerald-500 bg-emerald-50 ring-emerald-200',
      countColor: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
              isActive
                ? `${tab.activeColor} shadow-sm ring-2`
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xl">{tab.icon}</span>
              <span
                className={`text-lg font-black px-2.5 py-0.5 rounded-lg border ${
                  isActive ? tab.countColor : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}
              >
                {tab.count}
              </span>
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-800 leading-tight">{tab.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{tab.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
