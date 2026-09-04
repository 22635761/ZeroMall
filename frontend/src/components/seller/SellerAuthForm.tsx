import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface SellerAuthFormProps {
  onAuthSuccess: (user: any, token: string) => void
  onBackToHome: () => void
}

export const SellerAuthForm: React.FC<SellerAuthFormProps> = ({
  onAuthSuccess,
  onBackToHome
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Auth Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [shopName, setShopName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const endpoint = authMode === 'login' ? 'login' : 'register'
    const payload = authMode === 'login'
      ? { email, password }
      : { 
          email, 
          password, 
          name, 
          role: 'SHOP_OWNER',
          shopName 
        }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đã có lỗi xảy ra.')
      }

      if (authMode === 'login') {
        if (data.user.role !== 'SHOP_OWNER' && data.user.role !== 'SHOP_STAFF') {
          throw new Error('Tài khoản của bạn không phải là Chủ shop hoặc Nhân viên shop!')
        }
        onAuthSuccess(data.user, data.accessToken)
      } else {
        setSuccess('Đăng ký Kênh Người Bán thành công! Đang chuyển sang Đăng nhập...')
        setTimeout(() => {
          setAuthMode('login')
          setError(null)
          setSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between text-slate-800 font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sm:px-12 shadow-xs">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl shadow-xs">
              🌱
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900">Zero<span className="text-emerald-600">Mall</span></span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wide">Kênh Người Bán</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Shopee-Style Seller Centre Platform</p>
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
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Rich Brand Hero Banner */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 text-xs font-bold shadow-3xs">
              <span>🚀</span> Bứt phá doanh thu cùng sàn thương mại điện tử ZeroMall
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Quản lý gian hàng chuyên nghiệp, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">tiếp cận triệu khách hàng</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Tham gia mạng lưới đối tác bán lẻ ZeroMall để tận hưởng hệ thống vận hành tự động, chiết khấu cạnh tranh, đối soát dòng tiền minh bạch và chăm sóc khách hàng 24/7.
            </p>

            {/* Value Props 3 Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-bold">
                  ⚡
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">Miễn Phí Mở Shop</h4>
                <p className="text-[11px] text-slate-500 leading-snug font-medium">Khởi tạo gian hàng nhanh trong 1 phút, không phí duy trì cố định.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-base font-bold">
                  📦
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">Tự Động Vận Hành</h4>
                <p className="text-[11px] text-slate-500 leading-snug font-medium">Tích hợp giao hàng GHN, in phiếu gửi hàng & quản lý kho tự động.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-base font-bold">
                  💳
                </div>
                <h4 className="font-extrabold text-xs text-slate-800">Đối Soát Tiền Nhanh</h4>
                <p className="text-[11px] text-slate-500 leading-snug font-medium">Hệ thống Escrow tạm giữ an toàn, tự động rút tiền về ngân hàng 24/7.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Seller Auth Form Box */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/70 p-6 sm:p-8 text-left">
              {/* Tab Switcher */}
              <div className="flex border-b border-slate-100 mb-6 relative">
                <button 
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  className={`flex-1 pb-3.5 text-center font-black text-sm transition-all cursor-pointer ${
                    authMode === 'login' 
                      ? 'text-emerald-600 border-b-2 border-emerald-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Đăng Nhập Shop
                </button>
                <button 
                  onClick={() => { setAuthMode('register'); setError(null); }}
                  className={`flex-1 pb-3.5 text-center font-black text-sm transition-all cursor-pointer ${
                    authMode === 'register' 
                      ? 'text-emerald-600 border-b-2 border-emerald-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Đăng Ký Mở Shop
                </button>
              </div>

              {/* Alert Feedback */}
              {error && (
                <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
                  <span>✅</span>
                  <span>{success}</span>
                </div>
              )}

              {/* Form Input Fields */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên Cửa Hàng / Thương Hiệu</label>
                      <input 
                        type="text" 
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="VD: Cửa Hàng Thời Trang Zero"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ Tên Chủ Gian Hàng</label>
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Nguyễn Văn A"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Đăng Nhập Kênh Bán</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@zeromall.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">Mật Khẩu</label>
                    {authMode === 'login' && (
                      <span className="text-[11px] font-semibold text-emerald-600 hover:underline cursor-pointer">Quên mật khẩu?</span>
                    )}
                  </div>
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs transition duration-200 cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : authMode === 'login' ? (
                    <span>Đăng Nhập Kênh Người Bán</span>
                  ) : (
                    <span>Hoàn Tất Đăng Ký Mở Shop</span>
                  )}
                </button>
              </form>

              {/* Demo Account Helper Hint */}
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <p className="text-[11px] text-slate-400 font-medium">
                  Tài khoản Seller mẫu: <span className="font-bold text-slate-700">seller1@zeromall.com</span> / <span className="font-bold text-slate-700">123456</span>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400 font-medium">
        © 2026 ZeroMall Seller Centre. Nền tảng thương mại điện tử dành cho Đối Tác Bán Lẻ.
      </footer>
    </div>
  )
}
