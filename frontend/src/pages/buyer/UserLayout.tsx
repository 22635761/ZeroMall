import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

interface UserLayoutProps {
  user: any
}

export const UserLayout: React.FC<UserLayoutProps> = ({ user }) => {
  const location = useLocation()
  const currentPath = location.pathname

  const isProfileActive = currentPath === '/user/account/profile'
  const isPurchaseActive = currentPath === '/user/purchase'
  const isVoucherActive = currentPath === '/user/voucher'
  const isWalletActive = currentPath === '/user/wallet'

  const userAvatar = user?.avatar || 'https://placehold.co/100x100?text=User'
  const userName = user?.email || 'cuonggquoc'

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-left selection:bg-[#ee4d2d] selection:text-white mt-4">
      {/* Left Sidebar Menu */}
      <aside className="w-full lg:w-[180px] shrink-0 space-y-6">
        
        {/* User Brief Card */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60">
          <img 
            src={userAvatar} 
            alt="avatar" 
            className="w-[50px] h-[50px] rounded-full border border-slate-200 object-cover shrink-0"
          />
          <div className="overflow-hidden space-y-0.5">
            <h4 className="font-bold text-[13px] text-slate-800 truncate">{userName}</h4>
            <Link 
              to="/user/account/profile" 
              className="text-xs text-slate-400 font-medium hover:text-[#ee4d2d] flex items-center gap-1 transition"
            >
              ✏️ <span className="text-[11px]">Sửa Hồ Sơ</span>
            </Link>
          </div>
        </div>

        {/* Menu Navigation Group */}
        <nav className="space-y-4 text-xs font-normal text-slate-700">
          
          {/* Thông báo */}
          <div className="flex items-center gap-2.5 px-1 py-1 hover:text-[#ee4d2d] cursor-pointer transition">
            <span className="text-[14px]">🔔</span>
            <span>Thông Báo</span>
          </div>

          {/* Tài Khoản Của Tôi */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-1 py-1 font-semibold text-slate-800">
              <span className="text-[14px]">👤</span>
              <span>Tài Khoản Của Tôi</span>
            </div>
            
            {/* Submenus */}
            <ul className="pl-6 space-y-2.5 border-l border-slate-100 ml-2">
              <li>
                <Link 
                  to="/user/account/profile" 
                  className={`block transition font-medium ${isProfileActive ? 'text-[#ee4d2d]' : 'text-slate-500 hover:text-[#ee4d2d]'}`}
                >
                  Hồ Sơ
                </Link>
              </li>
              <li>
                <span className="block text-slate-400 cursor-not-allowed">Địa Chỉ</span>
              </li>
              <li>
                <span className="block text-slate-400 cursor-not-allowed">Đổi Mật Khẩu</span>
              </li>
            </ul>
          </div>

          {/* Đơn Mua */}
          <div className="flex items-center gap-2.5 px-1 py-1 transition">
            <span className="text-[14px]">📋</span>
            <Link 
              to="/user/purchase" 
              className={`font-semibold transition ${isPurchaseActive ? 'text-[#ee4d2d]' : 'text-slate-800 hover:text-[#ee4d2d]'}`}
            >
              Đơn Mua
            </Link>
          </div>

          {/* Kho Voucher */}
          <div className="flex items-center gap-2.5 px-1 py-1 transition">
            <span className="text-[14px]">🏷️</span>
            <Link 
              to="/user/voucher" 
              className={`font-semibold transition ${isVoucherActive ? 'text-[#ee4d2d]' : 'text-slate-800 hover:text-[#ee4d2d]'}`}
            >
              Kho Voucher
            </Link>
          </div>

          {/* Ví ZeroMall */}
          <div className="flex items-center gap-2.5 px-1 py-1 transition">
            <span className="text-[14px]">💳</span>
            <Link 
              to="/user/wallet" 
              className={`font-semibold transition ${isWalletActive ? 'text-[#ee4d2d]' : 'text-slate-800 hover:text-[#ee4d2d]'}`}
            >
              Ví ZeroMall
            </Link>
          </div>

        </nav>
      </aside>

      {/* Right Main Content */}
      <main className="flex-1 bg-white min-h-[550px] rounded-sm shadow-xs border border-slate-200/50 p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
