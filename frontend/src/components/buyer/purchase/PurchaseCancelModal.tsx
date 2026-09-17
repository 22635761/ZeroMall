import React, { useState } from 'react'
import type { Order } from '../../../models/order.model'

interface PurchaseCancelModalProps {
  isOpen: boolean
  order: Order | null
  onClose: () => void
  onSubmit: (order: Order, reason: string) => Promise<void>
  isCancelling: boolean
}

export const PurchaseCancelModal: React.FC<PurchaseCancelModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
  isCancelling
}) => {
  const [cancelReason, setCancelReason] = useState('Muốn thay đổi địa chỉ nhận hàng')

  if (!isOpen || !order) return null

  const cancelReasons = [
    'Muốn thay đổi địa chỉ nhận hàng',
    'Muốn thay đổi mã giảm giá / Voucher',
    'Muốn thay đổi sản phẩm trong đơn (kích cỡ, màu sắc, số lượng)',
    'Tìm thấy giá rẻ hơn ở nơi khác',
    'Đổi ý, không muốn mua nữa',
    'Lý do khác'
  ]

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-left">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>❌</span> Hủy Đơn Hàng #{order.id.slice(0, 12)}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Vui lòng chọn lý do hủy đơn hàng của bạn
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> Lưu ý khi hủy đơn hàng:
          </p>
          <p className="text-amber-700 leading-relaxed font-normal">
            {order.paymentMethod === 'zeropay' ||
            (order.paymentMethod === 'sepay' && order.status === 'PROCESSING')
              ? '• Đơn hàng đã được thanh toán trực tuyến. Sau khi hủy, 100% số tiền sẽ được hoàn ngay lập tức về Ví ZeroPay của bạn.'
              : '• Đơn hàng thanh toán khi nhận hàng (COD) hoặc chưa thanh toán sẽ được hủy ngay lập tức.'}
            <br />• Các Voucher giảm giá đã dùng sẽ được tự động hoàn lại vào kho voucher của bạn.
          </p>
        </div>

        {/* Reason Selection */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-bold text-slate-700">Lý do hủy đơn:</label>
          {cancelReasons.map(reason => (
            <label
              key={reason}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                cancelReason === reason
                  ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="radio"
                name="cancelReason"
                value={reason}
                checked={cancelReason === reason}
                onChange={e => setCancelReason(e.target.value)}
                className="accent-emerald-600 w-4 h-4"
              />
              <span>{reason}</span>
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Không Hủy Nữa
          </button>
          <button
            onClick={() => onSubmit(order, cancelReason)}
            disabled={isCancelling}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCancelling ? 'Đang xử lý...' : 'Xác Nhận Hủy Đơn'}
          </button>
        </div>
      </div>
    </div>
  )
}
