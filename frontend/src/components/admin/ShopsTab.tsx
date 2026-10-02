import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { LockShopModal } from './LockShopModal'
import { DeleteShopModal } from './DeleteShopModal'
import { ShopDetailModal } from './ShopDetailModal'

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
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối')
    }
  }

  const filteredShops = shops.filter((s) => {
    const matchQuery =
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchQuery) return false

    if (statusFilter === 'ALL') return true
    return s.status === statusFilter
  })

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-5">
      {/* Header & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
            <span>🏪</span> Quản lý & Khóa cửa hàng
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quản lý trạng thái, đặt bộ đếm ngày khóa và xóa cửa hàng trên hệ thống ZeroMall
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            placeholder="Tìm theo tên shop, ID, chủ shop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 w-56"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
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
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3 px-2">Mã Shop</th>
              <th className="pb-3 px-2">Cửa Hàng</th>
              <th className="pb-3 px-2">Chủ Sở Hữu</th>
              <th className="pb-3 px-2">Điện Thoại / Email</th>
              <th className="pb-3 px-2">Trạng Thái & Hạn Khóa</th>
              <th className="pb-3 px-2 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredShops.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  Không tìm thấy cửa hàng nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredShops.map((s) => {
                const isBlocked = s.status === 'BLOCKED'
                const banCountdown = isBlocked ? getBanCountdown(s.blockedUntil) : null

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-2 font-mono text-[10px] text-slate-400">
                      <span title={s.id} className="cursor-help">
                        {s.id.slice(0, 8)}...
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailShop(s)}
                        className="font-black text-slate-850 text-xs hover:text-emerald-600 transition-colors text-left cursor-pointer flex items-center gap-1 group"
                        title="Bấm để xem đầy đủ hồ sơ cửa hàng"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-500 opacity-70">🔍</span>
                      </button>
                      {s.pickupAddress && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-0.5" title={s.pickupAddress}>
                          📍 {s.pickupAddress}
                        </div>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-2">
                      <div className="font-bold text-slate-700 text-[11px]">{s.owner?.name || 'N/A'}</div>
                      <div className="font-mono text-[9px] text-slate-400">{s.ownerId}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-2">
                      <div className="text-[11px] text-slate-700">{s.phoneNumber || s.owner?.phoneNumber || 'Chưa có'}</div>
                      <div className="text-[10px] text-slate-400">{s.email || s.owner?.email || ''}</div>
                    </td>

                    {/* Status & Ban Countdown */}
                    <td className="py-3 px-2">
                      <div className="flex flex-col gap-1 items-start">
                        {/* Status badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'BLOCKED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : s.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
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
                        </span>

                        {/* Ban Details & Live Countdown */}
                        {isBlocked && banCountdown && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black border ${banCountdown.className}`}
                              title={banCountdown.endDate ? `Mở khóa lúc: ${banCountdown.endDate}` : undefined}
                            >
                              <span>{banCountdown.icon}</span>
                              <span>{banCountdown.text}</span>
                            </span>

                            {s.blockReason && (
                              <span className="text-[10px] text-slate-500 font-medium line-clamp-1 max-w-xs" title={`Lý do: ${s.blockReason}`}>
                                🛑 {s.blockReason}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Detail Modal Button */}
                        <button
                          onClick={() => setSelectedDetailShop(s)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                          title="Xem chi tiết hồ sơ cửa hàng, địa chỉ kho & kênh giao hàng"
                        >
                          <span>👁️</span> Chi Tiết
                        </button>

                        {isBlocked ? (
                          <>
                            <button
                              onClick={() => handleUnblockShop(s)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1"
                              title="Mở khóa cho gian hàng hoạt động trở lại"
                            >
                              <span>🔓</span> Mở Khóa
                            </button>
                            <button
                              onClick={() => setSelectedLockShop(s)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-0.5"
                              title="Thay đổi thời hạn hoặc lý do khóa"
                            >
                              <span>⏱️</span> Đổi Hạn
                            </button>
                          </>
                        ) : s.status === 'APPROVED' ? (
                          <button
                            onClick={() => setSelectedLockShop(s)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1"
                            title="Khóa gian hàng kèm bộ đếm ngày"
                          >
                            <span>🔒</span> Khóa Shop
                          </button>
                        ) : null}

                        {/* Delete Shop Button */}
                        <button
                          onClick={() => setSelectedDeleteShop(s)}
                          className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                          title="Xóa vĩnh viễn gian hàng này khỏi hệ thống"
                        >
                          <span>🗑️</span> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
    </div>
  )
}
