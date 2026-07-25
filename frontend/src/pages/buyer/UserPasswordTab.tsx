import React, { useState } from 'react'

interface UserPasswordTabProps {
  user: any
}

export const UserPasswordTab: React.FC<UserPasswordTabProps> = ({ user }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword.length < 6) {
      setMessage({ text: 'Mật khẩu mới phải có ít nhất 6 ký tự!', type: 'error' })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Mật khẩu mới và Nhập lại mật khẩu không trùng khớp!', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('zm_token') || ''
      const res = await fetch(`http://localhost:8000/auth/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (res.ok) {
        setMessage({ text: '🎉 Đổi mật khẩu tài khoản thành công!', type: 'success' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setMessage({ text: data.message || 'Lỗi khi đổi mật khẩu.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Lỗi kết nối mạng khi đổi mật khẩu.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800">Đổi Mật Khẩu</h2>
        <p className="text-xs text-slate-500 mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-sm text-xs font-semibold border ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form Wrapper */}
      <form onSubmit={handleSubmit} className="space-y-5 max-w-[550px] text-xs pt-2">
        {/* Current Password */}
        <div className="flex items-center gap-4">
          <label className="w-[140px] text-right text-slate-500 shrink-0 font-medium">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition font-medium"
            required
          />
        </div>

        {/* New Password */}
        <div className="flex items-center gap-4">
          <label className="w-[140px] text-right text-slate-500 shrink-0 font-medium">Mật khẩu mới</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition font-medium"
            required
            minLength={6}
          />
        </div>

        {/* Confirm Password */}
        <div className="flex items-center gap-4">
          <label className="w-[140px] text-right text-slate-500 shrink-0 font-medium">Xác nhận mật khẩu</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="flex-1 px-3 py-2 rounded-sm border border-slate-200 focus:outline-none focus:border-[#ee4d2d] transition font-medium"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <div className="w-[140px] shrink-0" />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-bold rounded-sm text-xs transition duration-150 cursor-pointer shadow-3xs disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang Cập Nhật...
              </>
            ) : (
              'Xác Nhận Đổi Mật Khẩu'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
