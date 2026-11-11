import React from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { ConfirmDestructiveDialog, type SummaryItem } from '../common/ConfirmDestructiveDialog'

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
  if (!user) return null

  const handleDelete = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Lỗi khi xóa tài khoản người dùng')
    }

    await triggerAuditLog(`Xóa vĩnh viễn tài khoản người dùng "${user.email}" (Mã: ${user.id}, Tên: ${user.name})`)
    onSuccess()
  }

  const summaryItems: SummaryItem[] = [
    { label: 'Họ và tên', value: user.name },
    { label: 'Email', value: <span className="font-mono">{user.email}</span> },
    { label: 'Vai trò', value: <span className="font-bold text-primary">{user.role}</span> },
    { label: 'Mã User (ID)', value: <span className="font-mono text-[11px]">{user.id}</span> },
  ]

  return (
    <ConfirmDestructiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Xác Nhận Xóa Tài Khoản"
      subtitle="Cảnh báo: Hành động không thể hoàn tác"
      warningText="Mọi thông tin cá nhân, sổ địa chỉ, các liên kết theo dõi và quyền truy cập của người dùng này sẽ bị hủy hoàn toàn."
      summaryItems={summaryItems}
      confirmKeyword="XÓA"
      confirmIdentifier={user.email}
      confirmButtonText="Xác Nhận Xóa TK"
      loadingText="Đang xóa..."
      onConfirm={handleDelete}
    />
  )
}
