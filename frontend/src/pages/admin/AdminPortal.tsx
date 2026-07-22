import React from 'react'
import { AdminPage } from './AdminPage'
import { CsSupportPage } from './CsSupportPage'

interface AdminPortalProps {
  user: any
  onLogout: () => void
  onBackToHome: () => void
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onLogout,
  onBackToHome
}) => {
  if (user?.role === 'ADMIN') {
    return <AdminPage user={user} onLogout={onLogout} onBackToHome={onBackToHome} />
  }

  if (user?.role === 'PLATFORM_SUPPORT') {
    return <CsSupportPage user={user} onLogout={onLogout} onBackToHome={onBackToHome} />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800 font-sans select-none">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 max-w-sm space-y-4">
        <span className="text-4xl animate-bounce inline-block">⚠️</span>
        <h2 className="text-lg font-black text-slate-850">Từ Chối Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
          Tài khoản của bạn không có quyền hạn truy cập vào Kênh Quản trị & CSKH ZeroMall.
        </p>
        <button
          onClick={onBackToHome}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition duration-150 active:scale-95"
        >
          Quay lại trang mua sắm
        </button>
      </div>
    </div>
  )
}
