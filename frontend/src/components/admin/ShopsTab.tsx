import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LockShopModal } from './LockShopModal'
import { DeleteShopModal } from './DeleteShopModal'
import { ShopDetailModal } from './ShopDetailModal'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ShopsTabProps {
  shops: any[]
  fetchShops: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const ShopsTab: React.FC<ShopsTabProps> = ({ shops, fetchShops, triggerAuditLog }) => {
  const [selectedDetailShop, setSelectedDetailShop] = useState<any | null>(null)
  const [selectedLockShop, setSelectedLockShop] = useState<any | null>(null)
  const [selectedDeleteShop, setSelectedDeleteShop] = useState<any | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Cập nhật bộ đếm thời gian thực mỗi giây để đếm ngược chính xác
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Hàm tính toán và định dạng thời gian khóa còn lại
  const getBanCountdown = (blockedUntil?: string | null) => {
    if (!blockedUntil) {
      return {
        text: 'Khóa vĩnh viễn',
        type: 'permanent',
        variant: 'destructive' as const,
        icon: '🔒',
      }
    }

    const target = new Date(blockedUntil).getTime()
    const diff = target - currentTime

    if (diff <= 0) {
      return {
        text: 'Đã hết hạn khóa (Có thể mở)',
        type: 'expired',
        variant: 'warning' as const,
        icon: '⚠️',
      }
    }

    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / (24 * 3600))
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    let timeString = ''
    if (days > 0) {
      timeString = `${days} ngày ${hours}h ${minutes}p`
    } else if (hours > 0) {
      timeString = `${hours}h ${minutes}p ${seconds}s`
    } else {
      timeString = `${minutes}p ${seconds}s`
    }

    return {
      text: `Còn lại: ${timeString}`,
      type: 'countdown',
      variant: 'destructive' as const,
      icon: '⏳',
      endDate: new Date(blockedUntil).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  // Mở khóa trực tiếp cho shop
  const handleUnblockShop = async (shop: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa cho cửa hàng "${shop.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/shops/${shop.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })

      if (res.ok) {
        await triggerAuditLog(`Mở khóa hoạt động cho cửa hàng "${shop.name}" (Mã: ${shop.id})`)
        fetchShops()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Lỗi khi mở khóa cửa hàng')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối khi mở khóa cửa hàng')
    }
  }

  // Lọc danh sách theo từ khóa tìm kiếm và bộ lọc trạng thái
  const filteredShops = shops.filter((s) => {
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      s.name?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q) ||
      s.owner?.name?.toLowerCase().includes(q) ||
      s.ownerId?.toLowerCase().includes(q) ||
      s.phoneNumber?.includes(q)

    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter

    return matchQuery && matchStatus
  })

  return (
    <Card className="p-6 flex flex-col gap-5">
      {/* Header & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-extrabold text-foreground uppercase flex items-center gap-2">
            <span>🏪</span> Quản lý & Khóa cửa hàng
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý trạng thái, đặt bộ đếm ngày khóa và xóa cửa hàng trên hệ thống ZeroMall
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="text"
            placeholder="Tìm theo tên shop, ID, chủ shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 text-xs"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái ({shops.length})</option>
            <option value="APPROVED">Đang hoạt động ({shops.filter((s) => s.status === 'APPROVED').length})</option>
            <option value="BLOCKED">Đang bị khóa ({shops.filter((s) => s.status === 'BLOCKED').length})</option>
            <option value="PENDING_APPROVAL">Chờ CSKH duyệt ({shops.filter((s) => s.status === 'PENDING_APPROVAL').length})</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mã Shop</TableHead>
              <TableHead>Cửa Hàng</TableHead>
              <TableHead>Chủ Sở Hữu</TableHead>
              <TableHead>Điện Thoại / Email</TableHead>
              <TableHead>Trạng Thái & Hạn Khóa</TableHead>
              <TableHead className="text-center">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground font-medium">
                  Không tìm thấy cửa hàng nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredShops.map((s) => {
                const isBlocked = s.status === 'BLOCKED'
                const banCountdown = isBlocked ? getBanCountdown(s.blockedUntil) : null

                return (
                  <TableRow key={s.id}>
                    {/* ID */}
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      <span title={s.id} className="cursor-help">
                        {s.id.slice(0, 8)}...
                      </span>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailShop(s)}
                        className="font-black text-foreground text-xs hover:text-primary transition-colors text-left cursor-pointer flex items-center gap-1 group"
                        title="Bấm để xem đầy đủ hồ sơ cửa hàng"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary opacity-70">🔍</span>
                      </button>
                      {s.pickupAddress && (
                        <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-xs mt-0.5" title={s.pickupAddress}>
                          📍 {s.pickupAddress}
                        </div>
                      )}
                    </TableCell>

                    {/* Owner */}
                    <TableCell>
                      <div className="font-bold text-foreground text-[11px]">{s.owner?.name || 'N/A'}</div>
                      <div className="font-mono text-[9px] text-muted-foreground">{s.ownerId}</div>
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="text-[11px] text-foreground">{s.phoneNumber || s.owner?.phoneNumber || 'Chưa có'}</div>
                      <div className="text-[10px] text-muted-foreground">{s.email || s.owner?.email || ''}</div>
                    </TableCell>

                    {/* Status & Ban Countdown */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {/* Status badge */}
                        <Badge
                          variant={
                            s.status === 'APPROVED'
                              ? 'success'
                              : s.status === 'BLOCKED'
                              ? 'destructive'
                              : s.status === 'PENDING_APPROVAL'
                              ? 'warning'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {s.status === 'APPROVED'
                            ? '● Đang hoạt động'
                            : s.status === 'BLOCKED'
                            ? '● Đang bị Khóa'
                            : s.status === 'PENDING_APPROVAL'
                            ? '⏳ Chờ CSKH duyệt'
                            : s.status === 'REJECTED'
                            ? '● Bị từ chối'
                            : s.status}
                        </Badge>

                        {/* Ban Details & Live Countdown */}
                        {isBlocked && banCountdown && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <Badge
                              variant={banCountdown.variant}
                              className="text-[10px] gap-1 font-mono"
                              title={banCountdown.endDate ? `Mở khóa lúc: ${banCountdown.endDate}` : undefined}
                            >
                              <span>{banCountdown.icon}</span>
                              <span>{banCountdown.text}</span>
                            </Badge>

                            {s.blockReason && (
                              <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-xs" title={`Lý do: ${s.blockReason}`}>
                                🛑 {s.blockReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Detail Modal Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetailShop(s)}
                          className="h-7 text-[10px] px-2"
                          title="Xem chi tiết hồ sơ cửa hàng, địa chỉ kho & kênh giao hàng"
                        >
                          <span>👁️</span> Chi Tiết
                        </Button>

                        {isBlocked ? (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUnblockShop(s)}
                              className="h-7 text-[10px] px-2.5"
                              title="Mở khóa cho gian hàng hoạt động trở lại"
                            >
                              <span>🔓</span> Mở Khóa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLockShop(s)}
                              className="h-7 text-[10px] px-2"
                              title="Thay đổi thời hạn hoặc lý do khóa"
                            >
                              <span>⏱️</span> Đổi Hạn
                            </Button>
                          </>
                        ) : s.status === 'APPROVED' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedLockShop(s)}
                            className="h-7 text-[10px] px-2.5"
                            title="Khóa gian hàng kèm bộ đếm ngày"
                          >
                            <span>🔒</span> Khóa Shop
                          </Button>
                        ) : null}

                        {/* Delete Shop Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSelectedDeleteShop(s)}
                          className="h-7 text-[10px] px-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                          title="Xóa vĩnh viễn gian hàng này khỏi hệ thống"
                        >
                          <span>🗑️</span> Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Shop Detail Modal */}
      {selectedDetailShop && (
        <ShopDetailModal
          isOpen={!!selectedDetailShop}
          shop={selectedDetailShop}
          onClose={() => setSelectedDetailShop(null)}
          onSuccess={() => {
            fetchShops()
          }}
          triggerAuditLog={triggerAuditLog}
          onOpenLockModal={(s) => setSelectedLockShop(s)}
        />
      )}

      {/* Lock Shop Modal */}
      {selectedLockShop && (
        <LockShopModal
          isOpen={!!selectedLockShop}
          shop={selectedLockShop}
          onClose={() => setSelectedLockShop(null)}
          onSuccess={() => {
            fetchShops()
          }}
          triggerAuditLog={triggerAuditLog}
        />
      )}

      {/* Delete Shop Modal */}
      {selectedDeleteShop && (
        <DeleteShopModal
          isOpen={!!selectedDeleteShop}
          shop={selectedDeleteShop}
          onClose={() => setSelectedDeleteShop(null)}
          onSuccess={() => {
            fetchShops()
          }}
          triggerAuditLog={triggerAuditLog}
        />
      )}
    </Card>
  )
}
