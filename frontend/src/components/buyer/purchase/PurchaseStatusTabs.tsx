import React from 'react'
import { PURCHASE_TABS } from './types'

interface PurchaseStatusTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export const PurchaseStatusTabs: React.FC<PurchaseStatusTabsProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange
}) => {
  return (
    <div className="space-y-4">
      {/* Purchase Status Tab Menu Header */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-700 bg-white">
        {PURCHASE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === tab.id 
                ? 'border-[#ee4d2d] text-[#ee4d2d]' 
                : 'border-transparent hover:text-[#ee4d2d] cursor-pointer'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input Filter */}
      <div className="bg-slate-100/60 p-2.5 flex items-center rounded-sm">
        <span className="text-slate-400 text-sm px-2">🔍</span>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Bạn có thể tìm kiếm theo ID đơn hàng hoặc Tên sản phẩm"
          className="flex-1 bg-transparent text-xs text-slate-700 focus:outline-none placeholder-slate-400/80"
        />
      </div>
    </div>
  )
}
