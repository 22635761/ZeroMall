import React, { useState } from 'react'

export interface DriverDeliveryFailModalProps {
  trackingNumber: string
  shipmentId: string
  onClose: () => void
  onSubmit: (shipmentId: string, reason: string) => void
  actionLoading: boolean
}

const FAILURE_REASONS = [
  'Khách không nghe máy (đã gọi 3 lần)',
  'Khách hẹn giao lại vào ngày mai',
  'Địa chỉ không tìm thấy / Sai số nhà',
  'Khách từ chối nhận (hàng không đúng ý)',
]

/**
 * Modal component for recording delivery failure reasons in the ZeroMall Shipper app.
 */
export const DriverDeliveryFailModal: React.FC<DriverDeliveryFailModalProps> = ({
  trackingNumber,
  shipmentId,
  onClose,
  onSubmit,
  actionLoading,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(FAILURE_REASONS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!actionLoading && selectedReason) {
      onSubmit(shipmentId, selectedReason)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fail-modal-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-slate-100 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2
            id="fail-modal-title"
            className="text-base font-bold text-slate-800 flex items-center gap-2"
          >
            <span>❌</span> Giao Hàng Không Thành Công
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none transition-colors disabled:opacity-50"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Tracking info */}
        <div className="my-3 px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
          <span>Mã vận đơn:</span>
          <span className="font-semibold text-slate-800 font-mono text-xs">
            {trackingNumber}
          </span>
        </div>

        {/* Reason selection form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
              Lý do giao thất bại:
            </label>
            <div className="space-y-2">
              {FAILURE_REASONS.map((reason) => {
                const isSelected = selectedReason === reason
                return (
                  <label
                    key={reason}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/50 text-slate-800 font-medium'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="failureReason"
                      value={reason}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason)}
                      disabled={actionLoading}
                      className="mt-0.5 h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300 accent-rose-600"
                    />
                    <span className="text-xs leading-snug">{reason}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {actionLoading ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  <span>Đang lưu...</span>
                </>
              ) : (
                'Xác Nhận Lưu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
