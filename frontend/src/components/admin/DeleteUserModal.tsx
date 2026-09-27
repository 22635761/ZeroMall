import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface DeleteUserModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  triggerAuditLog,
}) => {
  const [confirmInput, setConfirmInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  if (!isOpen || !user) return null

  const handleDeleteUser = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Lỗi khi xóa tài khoản người dùng')
      }

      await triggerAuditLog(`Xóa vĩnh viễn tài khoản người dùng "${user.email}" (Mã: ${user.id}, Tên: ${user.name})`)
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi xóa tài khoản')
    } finally {
      setLoading(false)
    }
  }

  const isConfirmed =
    confirmInput.trim().toUpperCase() === 'XÓA' ||
    confirmInput.trim().toUpperCase() === 'XOA' ||
    confirmInput.trim().toLowerCase() === user.email.toLowerCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
              🗑️
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-850">Xác Nhận Xóa Tài Khoản</h3>
              <p className="text-[11px] text-red-600 font-semibold">Cảnh báo: Hành động không thể hoàn tác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Warning Alert */}
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-red-700">
            <span>⚠️</span> Bạn đang thực hiện xóa vĩnh viễn tài khoản này!
          </div>
          <p className="text-[11px] text-red-600/90 leading-relaxed">
            Mọi thông tin cá nhân, sổ địa chỉ, các liên kết theo dõi và quyền truy cập của người dùng này sẽ bị hủy hoàn toàn.
          </p>
        </div>

        {/* User Info Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Họ và tên:</span>
            <span className="font-black text-slate-800">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Email:</span>
            <span className="font-mono text-slate-700 font-semibold">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Vai trò:</span>
            <span className="font-bold text-indigo-700">{user.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-medium">Mã User (ID):</span>
            <span className="font-mono text-[11px] text-slate-600">{user.id}</span>
          </div>
        </div>

        {/* Type to confirm */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-600">
            Nhập <span className="text-red-600 font-mono font-bold">XÓA</span> hoặc email <span className="font-mono text-slate-800">"{user.email}"</span> để mở nút xóa:
          </label>
          <input
            type="text"
            placeholder={`Nhập "XÓA" hoặc "${user.email}"`}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
          />
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleDeleteUser}
            disabled={loading || !isConfirmed}
            className="px-5 py-2 text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Xác Nhận Xóa TK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
