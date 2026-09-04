import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface DeliveryAuthFormProps {
  onAuthSuccess: (user: any, token: string) => void
  onBackToHome: () => void
}

export const DeliveryAuthForm: React.FC<DeliveryAuthFormProps> = ({
  onAuthSuccess,
  onBackToHome
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.')
      }

      // Kiểm tra quyền hạn: Chỉ DRIVER, HUB_OPERATOR, LOGISTICS_OPERATOR, hoặc ADMIN mới được vào
      const allowedRoles = ['DRIVER', 'HUB_OPERATOR', 'LOGISTICS_OPERATOR', 'ADMIN', 'PLATFORM_SUPPORT']
      if (!allowedRoles.includes(data.user.role)) {
        throw new Error('Từ chối truy cập: Tài khoản không có quyền hạn trong hệ thống Logistics/Giao vận!')
      }

      onAuthSuccess(data.user, data.accessToken)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillAccount = (accEmail: string) => {
    setEmail(accEmail)
    setPassword('123456')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sm:px-12 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl shadow-xs font-black">
              🚚
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">Zero<span className="text-emerald-600">Express</span></span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wide">SPX Logistics Portal</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Shopee Express Clone Platform</p>
            </div>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl"
          >
            <span>🛍️</span> Đến Sàn Mua Sắm
          </button>
        </div>
      </header>

      {/* 2. Main 2-Column Split Hero Layout */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Branding Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left hidden lg:block">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-3xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Cổng Điều Phối Vận Tải & App Tài Xế Giao Hàng
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Hạ Tầng Giao Vận Nhanh Chóng & Chuẩn Xác Cho <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">ZeroMall</span>
            </h1>

            <p className="text-slate-500 text-sm leading-relaxed max-w-lg font-normal">
              Đăng nhập để nhận lệnh lấy hàng từ Shop, điều phối mạng lưới trạm phân loại SOC, giao hàng tận tay khách và quản lý đối soát dòng tiền thu hộ COD.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1">
                <span className="text-xl">🛵</span>
                <h4 className="font-bold text-slate-800 text-xs">Dành Cho Tài Xế (Shipper)</h4>
                <p className="text-[11px] text-slate-400">Xem tuyến lấy hàng, gọi khách, chụp ảnh xác nhận và thu tiền COD an toàn.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1">
                <span className="text-xl">🏢</span>
                <h4 className="font-bold text-slate-800 text-xs">Dành Cho Điều Phối Kho (Hub)</h4>
                <p className="text-[11px] text-slate-400">Quản lý mạng lưới kho Tân Bình SOC, phân luồng xe tải và kết toán bảng kê.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
              
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Đăng Nhập Giao Vận</h3>
                <p className="text-xs text-slate-400 font-medium">Hệ thống phân quyền tự động theo vai trò tài khoản</p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold animate-in fade-in duration-200 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Email Tài Khoản</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="VD: shipper1@zeromall.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Mật Khẩu</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-3xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xác thực quyền hạn...</span>
                    </>
                  ) : (
                    <span>Đăng Nhập Vào Hệ Thống</span>
                  )}
                </button>
              </form>

              {/* Quick Fill Demo Accounts */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-500">⚡ Chọn nhanh vai trò để trải nghiệm:</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => fillAccount('hub_hcm@zeromall.com')}
                    className="w-full text-left p-2 rounded-lg bg-sky-50/70 hover:bg-sky-100 border border-sky-200 text-slate-800 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>🏭 <b>Kho Tân Bình SOC</b> (Trần Văn Kho)</span>
                    <span className="text-[10px] text-sky-700 font-black">NHÂN VIÊN KHO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('hub_bienhoa@zeromall.com')}
                    className="w-full text-left p-2 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-slate-800 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>🏢 <b>Kho Biên Hòa Hub</b> (Lê Thị Thu)</span>
                    <span className="text-[10px] text-indigo-700 font-black">NHÂN VIÊN KHO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('shipper2@zeromall.com')}
                    className="w-full text-left p-2 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 text-slate-800 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>🛵 <b>Shipper Biên Hòa</b> (Trần Đình Phát)</span>
                    <span className="text-[10px] text-emerald-700 font-black">SHIPPER</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillAccount('operator@zeromall.com')}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer text-xs flex justify-between items-center"
                  >
                    <span>👑 <b>Điều Phối Toàn Quốc</b> (Operator)</span>
                    <span className="text-[10px] text-slate-600 font-black">ADMIN ĐIỀU PHỐI</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 font-medium">
        © 2026 ZeroExpress (ZMX) Logistics System • Nền tảng điều phối vận tải TMĐT chuẩn ZeroMall
      </footer>
    </div>
  )
}
