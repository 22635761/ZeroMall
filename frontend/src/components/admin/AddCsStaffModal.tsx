import React, { useState } from 'react'

interface AddCsStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const AddCsStaffModal: React.FC<AddCsStaffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  triggerAuditLog
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleReset = () => {
    setName('')
    setEmail('')
    setPassword('')
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Vui lòng nhập Họ tên nhân viên CSKH!')
      return
    }
    if (!email.trim()) {
      alert('Vui lòng nhập Email nhân viên CSKH!')
      return
    }
    if (!password.trim()) {
      alert('Vui lòng nhập Mật khẩu cho tài khoản!')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:8000/auth/cs-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      if (res.ok) {
        await triggerAuditLog(`Tạo tài khoản CSKH mới cho ${email}`)
        handleReset()
        onSuccess()
        onClose()
        alert('Đã thêm nhân viên CSKH thành công!')
      } else {
        const errData = await res.json()
        alert('Lỗi thêm nhân viên CS: ' + (errData.message || 'Không xác định'))
      }
    } catch (err: any) {
      console.error(err)
      alert('Lỗi kết nối máy chủ!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform scale-100 transition-all text-left">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-850 uppercase flex items-center gap-2">
            <span>🎧</span> Thêm nhân viên CSKH mới
          </h3>
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="text-slate-400 hover:text-slate-650 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Họ và Tên</label>
            <input
              type="text"
              placeholder="Nhập họ tên nhân viên..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Email liên hệ</label>
            <input
              type="email"
              placeholder="Nhập email đăng nhập..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
            <input
              type="password"
              placeholder="Tạo mật khẩu cho tài khoản..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all text-slate-800"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => {
              handleReset()
              onClose()
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300/80 text-slate-755 font-bold rounded-lg text-xs cursor-pointer transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:bg-emerald-400 transition-colors"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận tạo'}
          </button>
        </div>
      </div>
    </div>
  )
}
