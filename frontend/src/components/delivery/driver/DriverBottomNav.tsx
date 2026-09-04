import React from 'react'

export interface DriverBottomNavProps {
  activeTab: 'HOME' | 'ORDERS' | 'SCAN' | 'WALLET' | 'ACCOUNT'
  onTabChange: (tab: 'HOME' | 'ORDERS' | 'SCAN' | 'WALLET' | 'ACCOUNT') => void
  ordersBadge?: number
}

/**
 * Bottom navigation bar for the driver mobile app (max-w-md container).
 * Features 5 main navigation tabs with a raised hero SCAN action button in the center.
 */
export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onTabChange,
  ordersBadge,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 px-2 pt-1 pb-safe pb-2"
      aria-label="Thanh điều hướng tài xế"
    >
      <div className="grid grid-cols-5 items-end">
        {/* 1. HOME TAB */}
        <button
          type="button"
          onClick={() => onTabChange('HOME')}
          className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
            activeTab === 'HOME'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
          aria-label="Trang Chủ"
        >
          <span className="text-xl leading-none mb-1">🏠</span>
          <span className="text-[10px] leading-tight">Trang Chủ</span>
        </button>

        {/* 2. ORDERS TAB */}
        <button
          type="button"
          onClick={() => onTabChange('ORDERS')}
          className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 relative ${
            activeTab === 'ORDERS'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
          aria-label="Đơn Hàng"
        >
          <div className="relative">
            <span className="text-xl leading-none mb-1 inline-block">📦</span>
            {typeof ordersBadge === 'number' && ordersBadge > 0 && (
              <span className="absolute -top-1 -right-2.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full px-1 flex items-center justify-center shadow-sm">
                {ordersBadge > 99 ? '99+' : ordersBadge}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">Đơn Hàng</span>
        </button>

        {/* 3. SCAN TAB (HERO RAISED CIRCULAR BUTTON) */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            type="button"
            onClick={() => onTabChange('SCAN')}
            className={`w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-90 text-white shadow-lg shadow-emerald-600/30 border-4 border-white flex flex-col items-center justify-center transition-all duration-150 ${
              activeTab === 'SCAN' ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
            }`}
            aria-label="Quét Mã"
          >
            <span className="text-2xl leading-none">📷</span>
          </button>
          <span
            className={`text-[10px] mt-0.5 leading-tight ${
              activeTab === 'SCAN'
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500 font-medium'
            }`}
          >
            Quét Mã
          </span>
        </div>

        {/* 4. WALLET TAB */}
        <button
          type="button"
          onClick={() => onTabChange('WALLET')}
          className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
            activeTab === 'WALLET'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
          aria-label="Ví COD"
        >
          <span className="text-xl leading-none mb-1">💰</span>
          <span className="text-[10px] leading-tight">Ví COD</span>
        </button>

        {/* 5. ACCOUNT TAB */}
        <button
          type="button"
          onClick={() => onTabChange('ACCOUNT')}
          className={`flex flex-col items-center justify-center py-1 transition-colors duration-150 active:scale-95 ${
            activeTab === 'ACCOUNT'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600 font-normal'
          }`}
          aria-label="Tài Khoản"
        >
          <span className="text-xl leading-none mb-1">👤</span>
          <span className="text-[10px] leading-tight">Tài Khoản</span>
        </button>
      </div>
    </nav>
  )
}
