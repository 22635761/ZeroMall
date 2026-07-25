import React, { useState } from 'react'

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
      const response = await fetch(`http://localhost:8000/auth/${endpoint}`, {
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 py-4 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <span className="text-2xl">🌱</span>
            <span className="text-lg font-black tracking-tight text-slate-800">
              Zero<span className="text-emerald-600">Mall</span> <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
            </span>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            🏠 Quay lại Trang Chủ
          </button>
        </div>
      </header>

      {/* Auth Forms */}
      <main className="flex-1 flex items-center justify-center p-4 py-16">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200/60 flex flex-col justify-between">
          {/* Mode selection */}
          <div className="flex border-b border-slate-100 relative">
            <button 
              onClick={() => { setAuthMode('login'); setError(null); }}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all cursor-pointer ${
                authMode === 'login' ? 'text-emerald-600 bg-slate-55/20' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng Nhập Người Bán
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setError(null); }}
              className={`flex-1 py-4 text-center font-bold text-sm transition-all cursor-pointer ${
                authMode === 'register' ? 'text-emerald-600 bg-slate-55/20' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng Ký Bán Hàng
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="p-6 space-y-4 text-left">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-3 rounded-r-lg text-xs font-semibold">
                ✅ {success}
              </div>
            )}

            {authMode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ và Tên</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nhập họ và tên của bạn..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên Shop Của Bạn</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Shop Gia Dụng ABC..."
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Đăng Nhập</label>
              <input 
                type="email" 
                required
                placeholder="seller@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm shadow-md transition duration-150 mt-6 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng Nhập Kênh Người Bán' : 'Đăng Ký & Tạo Shop')}
            </button>
          </form>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 rounded-b-3xl">
            Đăng ký bán hàng cực nhanh, quản lý đơn hàng & sản phẩm tức thì.
          </div>
        </div>
      </main>

      <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
        © 2026 ZeroMall Seller Centre. Hệ Thống Quản Lý Bán Hàng Chuyên Nghiệp.
      </footer>
    </div>
  )
}
