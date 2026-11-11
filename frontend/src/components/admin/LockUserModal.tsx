import React from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { EntityLockDialog } from '../common/EntityLockDialog'

interface LockUserModalProps {
  isOpen: boolean
  user: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

const USER_REASONS = [
  'Vi phạm tiêu chuẩn cộng đồng ZeroMall',
  'Hành vi gian lận đặt đơn / Bom hàng / Đánh giá ảo',
  'Sử dụng ngôn từ xúc phạm / Đe dọa / Quấy rối',
  'Đăng tải nội dung, hình ảnh hoặc từ khóa cấm',
  'Khóa tạm thời để kiểm tra xác minh danh tính',
]

export const LockUserModal: React.FC<LockUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  triggerAuditLog,
}) => {
  if (!user) return null

  const handleLock = async ({
    status,
    blockedUntil,
    blockReason,
    durationText,
  }: {
    status: string
    blockedUntil: string | null
    blockReason: string
    durationText: string
  }) => {
    const payload = {
      status,
      blockedUntil,
      blockReason,
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

    await triggerAuditLog(
      `Khóa tài khoản "${user.email}" (Mã: ${user.id}, Thời hạn: ${durationText}, Lý do: ${blockReason})`
    )
    onSuccess()
  }

  return (
    <EntityLockDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Khóa Tài Khoản Người Dùng"
      subtitle="Thiết lập thời hạn kỷ luật và bộ đếm ngày khóa"
      entityInfo={{
        leftLabel: 'Người dùng',
        leftTitle: user.name,
        leftSub: user.email,
        rightLabel: 'Vai trò',
        rightTitle: (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary/10 text-primary">
            {user.role}
          </span>
        ),
        rightSub: `ID: ${user.id.slice(0, 8)}...`,
      }}
      reasons={USER_REASONS}
      submitButtonText="Xác nhận Khóa TK"
      onSubmit={handleLock}
    />
  )
}
