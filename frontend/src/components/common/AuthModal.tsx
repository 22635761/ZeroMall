import React, { useState, useEffect } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: any, token: string) => void
  initialTab?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab)
  
  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  
  // Status states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sync tab state when initialTab or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab)
      setError(null)
      setSuccessMsg(null)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setError(null)
    setSuccessMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    const endpoint = tab === 'login' ? 'login' : 'register'
    const payload = tab === 'login' 
      ? { email, password }
      : { 
          email, 
          password, 
          name, 
          role: 'BUYER' // Mặc định đăng ký luôn là người dùng (BUYER)
        }

    try {
      const response = await fetch(`http://localhost:8000/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.')
      }

      if (tab === 'login') {
        onAuthSuccess(data.user, data.accessToken)
        resetForm()
        onClose()
      } else {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển sang Đăng nhập...')
        setTimeout(() => {
          setTab('login')
          setError(null)
          setSuccessMsg(null)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (No tabs, only clear title) */}
        <div className="p-6 border-b border-slate-100 relative text-center">
          <h2 className="font-extrabold text-lg text-slate-800">
            {tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
          </h2>
          {/* Close button */}
          <button 
            onClick={() => { resetForm(); onClose(); }}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-semibold animate-shake">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-3 rounded-r-lg text-xs font-semibold">
              ✅ {successMsg}
            </div>
          )}

          {tab === 'register' && (
            <div className="space-y-1 animate-in fade-in duration-200">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Họ và Tên</label>
              <input 
                type="text" 
                required
                placeholder="Nhập họ và tên của bạn..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition duration-150 mt-6 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-sm">⏳</span> Đang xử lý...
              </span>
            ) : (
              tab === 'login' ? 'Đăng Nhập' : 'Tạo Tài Khoản'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 rounded-b-3xl">
          {tab === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <span 
                onClick={() => { setTab('register'); setError(null); }}
                className="text-emerald-600 hover:text-emerald-500 font-bold cursor-pointer transition"
              >
                Đăng ký ngay
              </span>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <span 
                onClick={() => { setTab('login'); setError(null); }}
                className="text-emerald-600 hover:text-emerald-500 font-bold cursor-pointer transition"
              >
                Đăng nhập
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
