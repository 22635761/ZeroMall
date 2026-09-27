import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LockUserModal } from './LockUserModal'
import { DeleteUserModal } from './DeleteUserModal'

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
        className: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: '🔒',
      }
    }

    const target = new Date(blockedUntil).getTime()
    const diff = target - currentTime

    if (diff <= 0) {
      return {
        text: 'Đã hết hạn khóa (Có thể mở)',
        type: 'expired',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
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
      className: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
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
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối')
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchQuery) return false

    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false

    return true
  })

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
            <span>👥</span> Quản lý người dùng hệ thống
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý quyền hạn, khóa tài khoản kèm bộ đếm ngày và xóa tài khoản người dùng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-56"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
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
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái ({users.length})</option>
            <option value="ACTIVE">Hoạt động ({users.filter((u) => u.status === 'ACTIVE').length})</option>
            <option value="BLOCKED">Đang bị khóa ({users.filter((u) => u.status === 'BLOCKED').length})</option>
          </select>
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3 px-2">Mã User</th>
              <th className="pb-3 px-2">Họ và Tên</th>
              <th className="pb-3 px-2">Email & Điện Thoại</th>
              <th className="pb-3 px-2">Vai Trò</th>
              <th className="pb-3 px-2">Trạng Thái & Hạn Khóa</th>
              <th className="pb-3 px-2 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Không tìm thấy người dùng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isBlocked = u.status === 'BLOCKED'
                const banCountdown = isBlocked ? getBanCountdown(u.blockedUntil) : null

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">
                      <span title={u.id} className="cursor-help">
                        {u.id.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-850 text-xs">{u.name}</div>
                      {u.birthday && (
                        <div className="text-[10px] text-slate-400">🎂 {u.birthday}</div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-2">
                      <div className="font-mono text-slate-700 font-medium">{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.phoneNumber || 'Chưa cập nhật SĐT'}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                          u.role === 'ADMIN'
                            ? 'bg-red-50 text-red-655 border-red-200'
                            : u.role === 'PLATFORM_SUPPORT'
                            ? 'bg-indigo-50 text-indigo-655 border-indigo-200'
                            : u.role === 'SHOP_OWNER'
                            ? 'bg-blue-50 text-blue-655 border-blue-200'
                            : 'bg-slate-50 text-slate-655 border-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Status & Ban details */}
                    <td className="py-3 px-2">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? '● Hoạt động' : '● Đang bị Khóa'}
                        </span>

                        {isBlocked && banCountdown && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border ${banCountdown.className}`}
                              title={banCountdown.endDate ? `Mở khóa lúc: ${banCountdown.endDate}` : undefined}
                            >
                              <span>{banCountdown.icon}</span>
                              <span>{banCountdown.text}</span>
                            </span>

                            {u.blockReason && (
                              <span className="text-[10px] text-slate-500 font-medium line-clamp-1 max-w-xs" title={`Lý do: ${u.blockReason}`}>
                                🛑 {u.blockReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      {u.role === 'ADMIN' ? (
                        <span className="text-[10px] text-slate-400 font-medium italic">Hệ thống</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          {isBlocked ? (
                            <>
                              <button
                                onClick={() => handleUnblockUser(u)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                                title="Mở khóa tài khoản"
                              >
                                <span>🔓</span> Mở Khóa
                              </button>
                              <button
                                onClick={() => setSelectedLockUser(u)}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-0.5"
                                title="Thay đổi thời hạn hoặc lý do khóa"
                              >
                                <span>⏱️</span> Đổi Hạn
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedLockUser(u)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                              title="Khóa tài khoản kèm bộ đếm ngày"
                            >
                              <span>🔒</span> Khóa TK
                            </button>
                          )}

                          {/* Delete User Button */}
                          <button
                            onClick={() => setSelectedDeleteUser(u)}
                            className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                            title="Xóa vĩnh viễn tài khoản người dùng"
                          >
                            <span>🗑️</span> Xóa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
    </div>
  )
}
