import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ShopDetailModalProps {
  isOpen: boolean
  shop: any | null
  onClose: () => void
  onSuccess: () => void
  triggerAuditLog: (action: string) => Promise<void>
  onOpenLockModal?: (shop: any) => void
}

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  isOpen,
  shop,
  onClose,
  onSuccess,
  triggerAuditLog,
  onOpenLockModal,
}) => {
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [rejectReason, setRejectReason] = useState<string>('')
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false)

  if (!isOpen || !shop) return null

  // 1. Phân tích địa chỉ lấy hàng động
  const parsePickupAddress = () => {
    if (!shop.pickupAddress) return null
    try {
      if (typeof shop.pickupAddress === 'string') {
        const parsed = JSON.parse(shop.pickupAddress)
        if (typeof parsed === 'object' && parsed !== null) return parsed
      }
      return shop.pickupAddress
    } catch {
      return shop.pickupAddress
    }
  }

  const pickupData = parsePickupAddress()

  // 2. Phân tích cấu hình vận chuyển động
  const parseShippingSettings = () => {
    if (!shop.shippingSettings) return null
    try {
      if (typeof shop.shippingSettings === 'string') {
        return JSON.parse(shop.shippingSettings)
      }
      return shop.shippingSettings
    } catch {
      return null
    }
  }

  const shippingData = parseShippingSettings()

  const handleApproveOrReject = async (newStatus: 'APPROVED' | 'REJECTED') => {
    setActionLoading(true)
    try {
      const payload: any = { status: newStatus }
      if (newStatus === 'REJECTED' && rejectReason.trim()) {
        payload.blockReason = rejectReason.trim()
      }

      const res = await fetch(`${API_BASE_URL}/auth/shops/${shop.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Lỗi khi cập nhật trạng thái cửa hàng')
      }

      const actionText = newStatus === 'APPROVED' ? 'Phê duyệt kích hoạt' : 'Từ chối hồ sơ'
      await triggerAuditLog(`${actionText} cửa hàng "${shop.name}" (Mã: ${shop.id})`)

      onSuccess()
      onClose()
    } catch (e: any) {
      alert(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl border border-emerald-100 shrink-0">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-850 text-base">{shop.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    shop.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : shop.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : shop.status === 'BLOCKED'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {shop.status === 'APPROVED'
                    ? '● Đang hoạt động'
                    : shop.status === 'PENDING_APPROVAL'
                    ? '⏳ Chờ phê duyệt'
                    : shop.status === 'BLOCKED'
                    ? '🔒 Đang bị khóa'
                    : shop.status === 'REJECTED'
                    ? '❌ Bị từ chối'
                    : shop.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Mã Shop: {shop.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Section 1: Thông tin liên hệ & Chủ sở hữu */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <span>👤</span> Thông tin chủ sở hữu & Liên hệ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Họ và tên chủ shop</div>
                <div className="font-bold text-slate-800 mt-0.5">{shop.owner?.name || 'Chưa cập nhật'}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {shop.ownerId}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Số điện thoại liên hệ</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  📞 {shop.phoneNumber || shop.owner?.phoneNumber || 'Chưa cung cấp'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Email đăng ký</div>
                <div className="font-medium text-slate-700 mt-0.5">
                  ✉️ {shop.email || shop.owner?.email || 'Chưa cung cấp'}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Ngày đăng ký tạo shop</div>
                <div className="font-medium text-slate-700 mt-0.5">
                  📅 {shop.createdAt ? new Date(shop.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Địa chỉ lấy hàng */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <span>📦</span> Địa chỉ lấy hàng (Kho / Bưu cục)
            </h4>

            {pickupData && typeof pickupData === 'object' ? (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>👤</span> {pickupData.fullName || pickupData.name || 'Người liên hệ nhận/lấy hàng'}
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                    📞 {pickupData.phoneNumber || pickupData.phone || shop.phoneNumber || 'N/A'}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <span className="shrink-0 text-rose-500 font-bold">📍</span>
                  <span className="leading-relaxed">
                    {[
                      pickupData.detailAddress || pickupData.details,
                      pickupData.ward,
                      pickupData.district,
                      pickupData.province || pickupData.city || pickupData.region,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Chưa có chi tiết địa chỉ'}
                  </span>
                </div>

                {pickupData.coordinates && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-indigo-600 font-bold">🌐 Tọa độ GPS:</span>
                    <span>Lat: {pickupData.coordinates.lat?.toFixed(5) || 'N/A'}</span>
                    <span>•</span>
                    <span>Lng: {pickupData.coordinates.lng?.toFixed(5) || 'N/A'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 italic">
                {typeof shop.pickupAddress === 'string' && shop.pickupAddress.trim()
                  ? `📍 ${shop.pickupAddress}`
                  : 'Chưa thiết lập địa chỉ lấy hàng'}
              </div>
            )}
          </div>

          {/* Section 3: Cấu hình vận chuyển */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <h4 className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <span>🚚</span> Kênh vận chuyển đã kích hoạt
            </h4>

            {(() => {
              const isArray = Array.isArray(shippingData)
              const channels = [
                {
                  key: 'express',
                  name: 'ZMX Hỏa Tốc',
                  icon: '⚡',
                  desc: 'Giao siêu tốc trong 2h',
                  enabled: isArray
                    ? shippingData.includes('EXPRESS') || shippingData.includes('express') || shippingData.includes('ZMX')
                    : !!shippingData?.express,
                },
                {
                  key: 'fast',
                  name: 'Giao Nhanh (ZMX Fast)',
                  icon: '🚀',
                  desc: 'Giao tiêu chuẩn 1-2 ngày',
                  enabled: isArray
                    ? shippingData.includes('FAST') || shippingData.includes('fast') || shippingData.includes('ZMX')
                    : !!shippingData?.fast,
                },
                {
                  key: 'saver',
                  name: 'Tiết Kiệm (Saver)',
                  icon: '📦',
                  desc: 'Tối ưu chi phí vận chuyển',
                  enabled: isArray
                    ? shippingData.includes('SAVER') || shippingData.includes('saver')
                    : !!shippingData?.saver,
                },
                {
                  key: 'bulky',
                  name: 'Hàng Cồng Kềnh',
                  icon: '🚛',
                  desc: 'Vận chuyển hàng quá khổ',
                  enabled: isArray
                    ? shippingData.includes('BULKY') || shippingData.includes('bulky')
                    : !!shippingData?.bulky,
                },
              ]

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {channels.map((ch) => (
                    <div
                      key={ch.key}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        ch.enabled
                          ? 'bg-white text-slate-800 border-emerald-200 shadow-2xs'
                          : 'bg-slate-100/60 text-slate-400 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{ch.icon}</span>
                        <div>
                          <div className="font-bold text-xs">{ch.name}</div>
                          <div className="text-[10px] text-slate-400">{ch.desc}</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          ch.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {ch.enabled ? 'Đã bật' : 'Tắt'}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* Section 4: Nếu đang bị từ chối hoặc đang bị khóa */}
          {shop.status === 'BLOCKED' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-1.5 text-rose-800">
              <div className="font-extrabold flex items-center gap-1.5">
                <span>🔒</span> Cửa hàng đang trong trạng thái bị khóa
              </div>
              {shop.blockedUntil && (
                <div className="text-[11px] font-medium">
                  Thời hạn khóa đến: <strong>{new Date(shop.blockedUntil).toLocaleString('vi-VN')}</strong>
                </div>
              )}
              {shop.blockReason && (
                <div className="text-[11px] font-medium">
                  Lý do kỷ luật: <strong>{shop.blockReason}</strong>
                </div>
              )}
            </div>
          )}

          {/* Reject Reason input if clicking Reject */}
          {showRejectInput && shop.status === 'PENDING_APPROVAL' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="font-bold text-amber-900 text-xs">
                Nhập lý do từ chối hồ sơ đăng ký (để chủ shop biết và sửa lại):
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Địa chỉ lấy hàng chưa đầy đủ số nhà/tên đường, hoặc số điện thoại không liên lạc được..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {shop.status === 'PENDING_APPROVAL' && (
              <>
                {!showRejectInput ? (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>✕</span> Từ Chối Hồ Sơ
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleApproveOrReject('REJECTED')}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    {actionLoading ? 'Đang gửi...' : 'Xác Nhận Từ Chối'}
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApproveOrReject('APPROVED')}
                  className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Đang duyệt...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Phê Duyệt Mở Shop</span>
                    </>
                  )}
                </button>
              </>
            )}

            {shop.status === 'APPROVED' && onOpenLockModal && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenLockModal(shop)
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>🔒</span> Khóa Shop Này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
