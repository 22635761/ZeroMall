import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface LockUserModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const LockUserModal: React.FC<LockUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  triggerAuditLog,
}) => {
  const [durationMode, setDurationMode] = useState<string>('7') // '1' | '3' | '7' | '14' | '30' | '90' | 'PERMANENT' | 'CUSTOM'
  const [customDays, setCustomDays] = useState<number>(5)
  const [selectedReason, setSelectedReason] = useState<string>('Vi phạm tiêu chuẩn cộng đồng ZeroMall')
  const [customReason, setCustomReason] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>('')

  if (!isOpen || !user) return null

  const calculateBlockedUntil = (): { date: Date | null; label: string } => {
    if (durationMode === 'PERMANENT') {
      return { date: null, label: 'Khóa vĩnh viễn (Không giới hạn thời gian)' }
    }

    let days = 7
    if (durationMode === 'CUSTOM') {
      days = Math.max(1, customDays || 1)
    } else {
      days = parseInt(durationMode, 10) || 7
    }

    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return {
      date: targetDate,
      label: `${days} ngày (Mở khóa vào ${targetDate.toLocaleDateString('vi-VN')} lúc ${targetDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
    }
  }

  const finalReason = selectedReason === 'KHAC' ? customReason.trim() : selectedReason
  const { date: blockedUntilDate, label: durationPreview } = calculateBlockedUntil()

  const handleLockUser = async () => {
    if (!finalReason) {
      setErrorMsg('Vui lòng nhập lý do khóa tài khoản.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const payload = {
        status: 'BLOCKED',
        blockedUntil: blockedUntilDate ? blockedUntilDate.toISOString() : null,
        blockReason: finalReason,
      }

      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Lỗi khi khóa tài khoản người dùng')
      }

      const durationText = durationMode === 'PERMANENT' ? 'Vĩnh viễn' : `${durationMode === 'CUSTOM' ? customDays : durationMode} ngày`
      await triggerAuditLog(`Khóa tài khoản "${user.email}" (Mã: ${user.id}, Thời hạn: ${durationText}, Lý do: ${finalReason})`)
      
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi khóa tài khoản')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
              🔒
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-850">Khóa Tài Khoản Người Dùng</h3>
              <p className="text-[11px] text-slate-400">Thiết lập thời hạn kỷ luật và bộ đếm ngày khóa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* User Info Box */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400">Người dùng</div>
            <div className="font-black text-slate-800 text-sm">{user.name}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{user.email}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-slate-400">Vai trò</div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700">
              {user.role}
            </span>
            <div className="text-[10px] font-mono text-slate-400 mt-1">ID: {user.id.slice(0, 8)}...</div>
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            ⏱️ Chọn Thời Hạn Khóa (Bộ đếm ngày)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: '1', label: '1 Ngày' },
              { id: '3', label: '3 Ngày' },
              { id: '7', label: '7 Ngày' },
              { id: '14', label: '14 Ngày' },
              { id: '30', label: '30 Ngày' },
              { id: '90', label: '90 Ngày' },
              { id: 'PERMANENT', label: 'Vĩnh viễn' },
              { id: 'CUSTOM', label: 'Tùy chỉnh' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDurationMode(opt.id)}
                className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  durationMode === opt.id
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs shadow-rose-200'
                    : 'bg-white text-slate-750 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {durationMode === 'CUSTOM' && (
            <div className="mt-2 flex items-center gap-2 p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg">
              <span className="text-xs font-medium text-slate-600">Khóa trong:</span>
              <input
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 px-2 py-1 bg-white border border-rose-200 rounded text-xs font-black text-rose-700 text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <span className="text-xs font-bold text-slate-600">ngày</span>
            </div>
          )}

          {/* Duration Preview Notice */}
          <div className="mt-2 text-[11px] p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex items-center gap-1.5 font-medium">
            <span>⏳</span>
            <span>{durationPreview}</span>
          </div>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">
            📋 Lý do khóa tài khoản
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
          >
            <option value="Vi phạm tiêu chuẩn cộng đồng ZeroMall">Vi phạm tiêu chuẩn cộng đồng ZeroMall</option>
            <option value="Hành vi gian lận đặt đơn / Bom hàng / Đánh giá ảo">Hành vi gian lận đặt đơn / Bom hàng / Đánh giá ảo</option>
            <option value="Sử dụng ngôn từ xúc phạm / Đe dọa / Quấy rối">Sử dụng ngôn từ xúc phạm / Đe dọa / Quấy rối</option>
            <option value="Đăng tải nội dung, hình ảnh hoặc từ khóa cấm">Đăng tải nội dung, hình ảnh hoặc từ khóa cấm</option>
            <option value="Khóa tạm thời để kiểm tra xác minh danh tính">Khóa tạm thời để kiểm tra xác minh danh tính</option>
            <option value="KHAC">Lý do khác (Tự nhập nội dung)...</option>
          </select>

          {selectedReason === 'KHAC' && (
            <textarea
              rows={2}
              placeholder="Nhập lý do cụ thể khóa tài khoản..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
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
            onClick={handleLockUser}
            disabled={loading}
            className="px-5 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Xác nhận Khóa TK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
