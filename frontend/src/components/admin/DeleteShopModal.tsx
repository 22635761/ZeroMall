import React from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { ConfirmDestructiveDialog, type SummaryItem } from '../common/ConfirmDestructiveDialog'

interface DeleteShopModalProps {
  isOpen: boolean
  shop: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const DeleteShopModal: React.FC<DeleteShopModalProps> = ({
  isOpen,
  shop,
  onClose,
  onSuccess,
  triggerAuditLog,
}) => {
  if (!shop) return null

  const handleDelete = async () => {
    const res = await fetch(`${API_BASE_URL}/auth/shops/${shop.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Lỗi khi xóa cửa hàng')
    }

    await triggerAuditLog(`Xóa vĩnh viễn cửa hàng "${shop.name}" (Mã: ${shop.id}) khỏi hệ thống`)
    onSuccess()
  }

  const summaryItems: SummaryItem[] = [
    { label: 'Tên gian hàng', value: shop.name },
    { label: 'Mã Shop (ID)', value: <span className="font-mono text-[11px]">{shop.id}</span> },
    { label: 'Chủ sở hữu', value: shop.owner?.name || shop.ownerId || 'N/A' },
    { label: 'Số điện thoại', value: shop.phoneNumber || 'N/A' },
  ]

  return (
    <ConfirmDestructiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Xác Nhận Xóa Shop"
      subtitle="Cảnh báo: Hành động không thể hoàn tác"
      warningText="Mọi liên kết nhân viên, theo dõi shop và thông tin thiết lập gian hàng sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu."
      summaryItems={summaryItems}
      confirmKeyword="XÓA"
      confirmIdentifier={shop.name}
      confirmButtonText="Xác Nhận Xóa Shop"
      loadingText="Đang xóa..."
      onConfirm={handleDelete}
    />
  )
}
