import React from 'react'
import type { AdminActiveNav } from './types'

interface AdminSidebarProps {
  activeNav: AdminActiveNav
  onChangeNav: (nav: AdminActiveNav) => void
  totalShipments: number
  totalHubs: number
  totalDrivers: number
  currentUser: any
  onLogout: () => void
  onBackToHome?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeNav,
  onChangeNav,
  totalShipments,
  totalHubs,
  totalDrivers,
  currentUser,
  onLogout,
  onBackToHome,
}) => {
  const navItems = [
    {
      id: 'TOWER' as AdminActiveNav,
      icon: '📊',
      label: 'Tháp Điều Hành',
      sublabel: 'Control Tower',
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'SHIPMENTS' as AdminActiveNav,
      icon: '📦',
      label: 'Quản Lý Vận Đơn',
      sublabel: 'Waybills & Parcels',
      badge: totalShipments.toString(),
      badgeColor: 'bg-sky-500/20 text-sky-300',
    },
    {
      id: 'HUBS' as AdminActiveNav,
      icon: '🏢',
      label: 'Mạng Lưới Bưu Cục',
      sublabel: 'Hubs & SOC Centers',
      badge: totalHubs.toString(),
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      id: 'LINEHAUL' as AdminActiveNav,
      icon: '🚛',
      label: 'Đội Xe Tải Tuyến',
      sublabel: 'Linehaul Fleet',
    },
    {
      id: 'DRIVERS' as AdminActiveNav,
      icon: '🛵',
      label: 'Đội Ngũ Shipper',
      sublabel: 'Last-Mile Fleet',
      badge: totalDrivers.toString(),
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
    },
    {
      id: 'COD' as AdminActiveNav,
      icon: '💵',
      label: 'Đối Soát Tiền COD',
      sublabel: 'Escrow & Hub Cashier',
    },
    {
      id: 'FINANCE' as AdminActiveNav,
      icon: '📈',
      label: 'Tài Chính & P&L',
      sublabel: 'Unit Economics',
    },
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-left h-screen sticky top-0 z-40">
      {/* 1. Header Branding */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-lg shadow-md font-black">
              🚚
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white">
                  Zero<span className="text-emerald-400">Express</span>
                </span>
                <span className="text-[9px] font-black text-amber-300 bg-amber-950/80 border border-amber-600/60 px-1.5 py-0.2 rounded uppercase">
                  SPX
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Control Tower • 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Menu Navigation Links */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Phân Hệ Điều Hành
          </div>
          {navItems.map((item) => {
            const isActive = activeNav === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeNav(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <div className="text-left">
                    <div className="leading-tight">{item.label}</div>
                    <div
                      className={`text-[9px] font-normal leading-none mt-0.5 ${
                        isActive ? 'text-emerald-100' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* 3. Footer: Profile & Actions */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 space-y-2">
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs">
            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
          </div>
          <div className="flex-1 truncate">
            <div className="text-xs font-bold text-slate-200 truncate">
              {currentUser?.name || 'Admin Quản Trị'}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentUser?.email || 'admin@zeromall.vn'}
            </div>
          </div>
        </div>

        <div className="flex gap-1.5">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              title="Quay lại sàn mua sắm"
            >
              <span>🛍️</span> Sàn
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 py-1.5 px-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>🚪</span> Đăng Xuất
          </button>
        </div>
      </div>
    </aside>
  )
}
