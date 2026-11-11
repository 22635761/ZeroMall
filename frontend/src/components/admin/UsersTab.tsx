import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LockUserModal } from './LockUserModal'
import { DeleteUserModal } from './DeleteUserModal'
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

interface UsersTabProps {
  users: any[]
  fetchUsers: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, fetchUsers, triggerAuditLog }) => {
  const [selectedLockUser, setSelectedLockUser] = useState<any | null>(null)
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<any | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(Date.now())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Cập nhật bộ đếm thời gian thực mỗi giây để đếm ngược chính xác
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Hàm tính toán và định dạng thời gian khóa tài khoản còn lại
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

  // Mở khóa trực tiếp cho người dùng
  const handleUnblockUser = async (user: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn mở khóa cho tài khoản "${user.email}"?`)) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      })

      if (res.ok) {
        await triggerAuditLog(`Mở khóa tài khoản người dùng "${user.email}" (Mã: ${user.id})`)
        fetchUsers()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Lỗi khi mở khóa tài khoản')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối khi mở khóa tài khoản')
    }
  }

  // Lọc danh sách theo từ khóa tìm kiếm, vai trò và trạng thái
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q) ||
      u.id?.toLowerCase().includes(q)

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter

    return matchQuery && matchRole && matchStatus
  })

  return (
    <Card className="p-6 flex flex-col gap-5">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-extrabold text-foreground uppercase flex items-center gap-2">
            <span>👥</span> Quản lý người dùng hệ thống
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý quyền hạn, khóa tài khoản kèm bộ đếm ngày và xóa tài khoản người dùng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="text"
            placeholder="Tìm theo tên, email, SĐT, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 text-xs"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="PLATFORM_SUPPORT">CSKH Platform</option>
            <option value="SHOP_OWNER">Chủ Shop</option>
            <option value="SHOP_STAFF">Nhân viên Shop</option>
            <option value="BUYER">Người Mua</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái ({users.length})</option>
            <option value="ACTIVE">Hoạt động ({users.filter((u) => u.status === 'ACTIVE').length})</option>
            <option value="BLOCKED">Đang bị khóa ({users.filter((u) => u.status === 'BLOCKED').length})</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Mã User</TableHead>
              <TableHead>Họ và Tên</TableHead>
              <TableHead>Email & Điện Thoại</TableHead>
              <TableHead>Vai Trò</TableHead>
              <TableHead>Trạng Thái & Hạn Khóa</TableHead>
              <TableHead className="text-center">Hành Động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground font-medium">
                  Không tìm thấy người dùng nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isBlocked = u.status === 'BLOCKED'
                const banCountdown = isBlocked ? getBanCountdown(u.blockedUntil) : null

                return (
                  <TableRow key={u.id}>
                    {/* ID */}
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      <span title={u.id} className="cursor-help">
                        {u.id.slice(0, 8)}...
                      </span>
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <div className="font-bold text-foreground text-xs">{u.name}</div>
                      {u.birthday && (
                        <div className="text-[10px] text-muted-foreground">🎂 {u.birthday}</div>
                      )}
                    </TableCell>

                    {/* Contact */}
                    <TableCell>
                      <div className="font-mono text-foreground font-medium">{u.email}</div>
                      <div className="text-[10px] text-muted-foreground">{u.phoneNumber || 'Chưa cập nhật SĐT'}</div>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge
                        variant={
                          u.role === 'ADMIN'
                            ? 'destructive'
                            : u.role === 'PLATFORM_SUPPORT'
                            ? 'info'
                            : u.role === 'SHOP_OWNER'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[9px]"
                      >
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* Status & Ban details */}
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant={u.status === 'ACTIVE' ? 'success' : 'destructive'}
                          className="text-[9px]"
                        >
                          {u.status === 'ACTIVE' ? '● Hoạt động' : '● Đang bị Khóa'}
                        </Badge>

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

                            {u.blockReason && (
                              <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-xs" title={`Lý do: ${u.blockReason}`}>
                                🛑 {u.blockReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center">
                      {u.role === 'ADMIN' ? (
                        <span className="text-[10px] text-muted-foreground font-medium italic">Hệ thống</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {isBlocked ? (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUnblockUser(u)}
                                className="h-7 text-[10px] px-2.5"
                                title="Mở khóa tài khoản"
                              >
                                <span>🔓</span> Mở Khóa
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedLockUser(u)}
                                className="h-7 text-[10px] px-2"
                                title="Thay đổi thời hạn hoặc lý do khóa"
                              >
                                <span>⏱️</span> Đổi Hạn
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSelectedLockUser(u)}
                              className="h-7 text-[10px] px-2.5"
                              title="Khóa tài khoản kèm bộ đếm ngày"
                            >
                              <span>🔒</span> Khóa TK
                            </Button>
                          )}

                          {/* Delete User Button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSelectedDeleteUser(u)}
                            className="h-7 text-[10px] px-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                            title="Xóa vĩnh viễn tài khoản người dùng"
                          >
                            <span>🗑️</span> Xóa
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lock User Modal */}
      {selectedLockUser && (
        <LockUserModal
          isOpen={!!selectedLockUser}
          user={selectedLockUser}
          onClose={() => setSelectedLockUser(null)}
          onSuccess={() => {
            fetchUsers()
          }}
          triggerAuditLog={triggerAuditLog}
        />
      )}

      {/* Delete User Modal */}
      {selectedDeleteUser && (
        <DeleteUserModal
          isOpen={!!selectedDeleteUser}
          user={selectedDeleteUser}
          onClose={() => setSelectedDeleteUser(null)}
          onSuccess={() => {
            fetchUsers()
          }}
          triggerAuditLog={triggerAuditLog}
        />
      )}
    </Card>
  )
}
