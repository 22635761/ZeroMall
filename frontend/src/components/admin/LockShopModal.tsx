import React from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { EntityLockDialog } from '../common/EntityLockDialog'

interface LockShopModalProps {
  isOpen: boolean
  shop: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

const SHOP_REASONS = [
  'Vi phạm quy định đăng bán sản phẩm cấm / hạn chế',
  'Sản phẩm chứa từ khóa vi phạm pháp luật / chính sách ZeroMall',
  'Gian lận đơn hàng / Tạo đánh giá ảo',
  'Chậm giao hàng hoặc tỷ lệ hủy đơn quá cao',
  'Bị khiếu nại nhiều lần từ người mua',
  'Khóa tạm thời để kiểm tra xác minh tài khoản',
]

export const LockShopModal: React.FC<LockShopModalProps> = ({
  isOpen,
  shop,
  onClose,
  onSuccess,
  triggerAuditLog,
}) => {
  if (!shop) return null

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

    const res = await fetch(`${API_BASE_URL}/auth/shops/${shop.id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || 'Lỗi khi khóa cửa hàng')
    }

    await triggerAuditLog(
      `Khóa cửa hàng "${shop.name}" (Mã: ${shop.id}, Thời hạn: ${durationText}, Lý do: ${blockReason})`
    )
    onSuccess()
  }

  return (
    <EntityLockDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Khóa Cửa Hàng"
      subtitle="Thiết lập thời hạn khóa và lý do kỷ luật"
      entityInfo={{
        leftLabel: 'Tên Cửa Hàng',
        leftTitle: shop.name,
        leftSub: `ID: ${shop.id}`,
        rightLabel: 'Chủ sở hữu',
        rightTitle: <span className="font-bold text-foreground">{shop.owner?.name || shop.ownerId}</span>,
        rightSub: shop.phoneNumber || shop.email || 'N/A',
      }}
      reasons={SHOP_REASONS}
      submitButtonText="Xác nhận Khóa Shop"
      onSubmit={handleLock}
    />
  )
}
