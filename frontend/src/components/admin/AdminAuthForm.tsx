import React, { useState } from 'react'

interface AdminAuthFormProps {
  onAuthSuccess: (user: any, token: string) => void
  onBackToHome: () => void
}

export const AdminAuthForm: React.FC<AdminAuthFormProps> = ({
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
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đăng nhập không thành công.')
      }

      if (data.user.role !== 'ADMIN' && data.user.role !== 'PLATFORM_SUPPORT') {
        throw new Error('Từ chối truy cập: Tài khoản không thuộc Ban Quản Trị hoặc Đội Ngũ CSKH Sàn!')
      }

      onAuthSuccess(data.user, data.accessToken)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 py-3.5 px-6 sm:px-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-950">
              🛡️
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black tracking-tight text-white">Zero<span className="text-emerald-400">Mall</span></span>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Admin & CS Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Trung Tâm Quản Trị & Vận Hành Sàn TMĐT</p>
            </div>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3.5 py-2 rounded-xl"
          >
            <span>🛍️</span> Về Sàn Mua Sắm
          </button>
        </div>
      </header>

      {/* 2. Main Hero Split */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Security & Operations Hero Details */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-950/70 border border-emerald-800/70 rounded-full text-emerald-300 text-xs font-bold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Cổng Điều Hành & Bảo Mật Doanh Nghiệp
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Quản trị toàn diện, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">vận hành & chăm sóc khách hàng</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Khu vực dành riêng cho Quản Trị Viên (Admin) và Nhân Viên Hỗ Trợ (CS Support) để quản lý phê duyệt cửa hàng, giám sát dòng tiền Escrow, giải quyết tranh chấp và phân tích chỉ số kinh doanh.
            </p>

            {/* Enterprise Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center text-base font-bold border border-emerald-800/50">
                  🏪
                </div>
                <h4 className="font-extrabold text-xs text-white">Kiểm Duyệt Shop</h4>
                <p className="text-[11px] text-slate-400 leading-snug font-medium">Xét duyệt hồ sơ, địa chỉ lấy hàng và xác minh giấy phép cửa hàng.</p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center text-base font-bold border border-teal-800/50">
                  💰
                </div>
                <h4 className="font-extrabold text-xs text-white">Đối Soát & Hoa Hồng</h4>
                <p className="text-[11px] text-slate-400 leading-snug font-medium">Thu phí sàn 5%, giám sát ví thanh toán và giải ngân an toàn.</p>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-950 text-sky-400 flex items-center justify-center text-base font-bold border border-sky-800/50">
                  🎧
                </div>
                <h4 className="font-extrabold text-xs text-white">Hỗ Trợ & Khiếu Nại</h4>
                <p className="text-[11px] text-slate-400 leading-snug font-medium">Tiếp nhận yêu cầu Trả hàng/Hoàn tiền và xử lý đơn hàng toàn sàn.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Secure Admin Login Form Box */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-slate-900/95 rounded-3xl overflow-hidden shadow-2xl border border-slate-800/90 p-6 sm:p-8 text-left backdrop-blur-xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="mb-6 space-y-1">
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>🔒</span> Đăng Nhập Quản Trị Sàn
                </h3>
                <p className="text-xs text-slate-400 font-medium">Nhập thông tin tài khoản được cấp quyền để tiếp tục.</p>
              </div>

              {/* Alert Feedback */}
              {error && (
                <div className="mb-4 bg-rose-950/80 border border-rose-800/80 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Form Input Fields */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Quản Trị / CSKH</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cskh_1@gmail.com hoặc admin@zeromall.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">Mật Khẩu Xác Thực</label>
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs transition duration-200 cursor-pointer shadow-lg shadow-emerald-950 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xác thực bảo mật...</span>
                    </>
                  ) : (
                    <span>Đăng Nhập Cổng Điều Hành</span>
                  )}
                </button>
              </form>

              {/* Demo Account Helper Hint */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-center space-y-1">
                <p className="text-[11px] text-slate-400 font-medium">
                  Tài khoản CSKH Sàn: <span className="font-bold text-emerald-400">cskh_1@gmail.com</span> / <span className="font-bold text-emerald-400">123456</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Hệ thống tự động điều hướng: Admin Dashboard hoặc CS Support Portal.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 font-medium">
        © 2026 ZeroMall Operations System. Bảo mật cấp doanh nghiệp.
      </footer>
    </div>
  )
}
