import React from 'react'

interface MenuSubItem {
  id: string
  title: string
  badge?: string
}

interface MenuItem {
  id: string
  title: string
  icon: string
  subMenus: MenuSubItem[]
}

interface SellerSidebarProps {
  user: any
  activeMenu: string
  activeSubMenu: string
  menuConfig: MenuItem[]
  selectSubMenu: (menuId: string, subMenuId: string) => void
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  user,
  activeMenu,
  activeSubMenu,
  menuConfig,
  selectSubMenu
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 overflow-y-auto z-10 select-none shrink-0 flex flex-col justify-between font-sans text-left">
      <div className="divide-y divide-slate-100">
        {/* Overview / Dashboard Tab */}
        <div className="p-2">
          <button 
            onClick={() => selectSubMenu('dashboard', 'summary')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeMenu === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>📊</span> Tổng quan Shop
          </button>
        </div>

        {/* Sidebar menu groups */}
        {menuConfig.map((menu) => (
          <div key={menu.id} className="p-3 space-y-1 text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 flex items-center gap-1.5">
              <span>{menu.icon}</span> {menu.title}
            </span>
            
            <div className="space-y-0.5 pt-1">
              {menu.subMenus.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => selectSubMenu(menu.id, sub.id)}
                  className={`w-full text-left px-7 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                    activeMenu === menu.id && activeSubMenu === sub.id
                      ? 'bg-slate-100 text-emerald-600 font-bold'
                      : sub.id === 'bank-accounts'
                        ? 'text-[#ee4d2d] hover:bg-slate-50'
                        : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{sub.title}</span>
                  {sub.badge && (
                    <span className="bg-red-55 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full scale-90 uppercase">
                      {sub.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
        Đăng nhập: {user?.email}
      </div>
    </aside>
  )
}
