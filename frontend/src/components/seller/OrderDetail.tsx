import React from 'react'
import type { Order } from '../../models/order.model'
import { formatOrderId } from '../../utils/orderUtils'

interface OrderDetailProps {
  order: Order
  token: string
  onBack: () => void
  onStatusUpdate: (orderId: string, newStatus: string) => Promise<void>
  updatingOrderId: string | null
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Chờ Xác Nhận', icon: '⏳', desc: 'Đơn hàng mới tạo, đang chờ Shop xác nhận và chuẩn bị hàng.' },
  { key: 'PROCESSING', label: 'Đang Chuẩn Bị Hàng', icon: '📦', desc: 'Shop đang đóng gói và chuẩn bị giao cho đơn vị vận chuyển.' },
  { key: 'SHIPPING', label: 'Bàn Giao Vận Chuyển', icon: '🚛', desc: 'Đơn hàng đã bàn giao cho đơn vị vận chuyển, đang trên đường giao.' },
  { key: 'DELIVERED', label: 'Giao Thành Công', icon: '✅', desc: 'Đã giao hàng thành công đến Khách hàng.' },
  { key: 'COMPLETED', label: 'Đã Hoàn Tất', icon: '🎉', desc: 'Khách hàng đã bấm xác nhận nhận hàng. Đơn hàng hoàn tất.' },
]

const getStepIndex = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'UNPAID':
      return 0
    case 'PROCESSING':
    case 'PREPARING':
    case 'CONFIRMED':
      return 1
    case 'SHIPPING':
    case 'SHIPPED':
    case 'IN_TRANSIT':
      return 2
    case 'DELIVERED':
      return 3
    case 'COMPLETED':
    case 'SUCCESS':
      return 4
    default:
      return -1
  }
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order, onBack, onStatusUpdate, updatingOrderId
}) => {
  const currentStep = getStepIndex(order.status)
  const itemSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const getNextAction = () => {
    switch (order.status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'UNPAID':
        return {
          label: '✅ Xác Nhận Đơn Hàng',
          status: 'PROCESSING',
          className: 'bg-[#ee4d2d] hover:bg-[#d03d20] text-white'
        }
      case 'PROCESSING':
      case 'PREPARING':
      case 'CONFIRMED':
        return {
          label: '🚛 Chuẩn Bị Xong & Bàn Giao ĐVVC',
          status: 'SHIPPING',
          className: 'bg-blue-600 hover:bg-blue-700 text-white'
        }
      case 'SHIPPING':
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return {
          label: '✅ Xác Nhận Giao Hàng Thành Công',
          status: 'DELIVERED',
          className: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }
      default:
        return null
    }
  }

  const nextAction = getNextAction()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-600 transition cursor-pointer group"
      >
        <span className="group-hover:-translate-x-1 transition">←</span>
        Quay lại danh sách đơn hàng
      </button>

      {/* Order Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-800">Chi Tiết Đơn Hàng #{formatOrderId(order.id)}</h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
            Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        {nextAction && (
          <button
            onClick={() => onStatusUpdate(order.id, nextAction.status)}
            disabled={updatingOrderId !== null}
            className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2 ${nextAction.className}`}
          >
            {updatingOrderId === order.id ? (
              <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang cập nhật...</>
            ) : nextAction.label}
          </button>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-5">Tiến Trình Đơn Hàng</h3>
        <div className="relative">
          {/* Progress bar */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-100">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }}
            />
          </div>

          <div className="grid grid-cols-5 gap-2 relative z-10">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx === currentStep
              const isPast = idx < currentStep
              const isFuture = idx > currentStep

              return (
                <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                    isPast ? 'bg-emerald-500 border-emerald-500 text-white' :
                    isActive ? 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-4 ring-emerald-100' :
                    'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {isPast ? '✓' : <span className={isFuture ? 'opacity-40' : ''}>{step.icon}</span>}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    {isActive && <p className="text-[9px] text-slate-400 mt-0.5 leading-tight max-w-[80px] mx-auto">{step.desc}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Items + Buyer Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items list */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Sản Phẩm Đặt Mua</h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-start">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">{item.name}</h4>
                    {item.variant && item.variant.trim() && item.variant !== 'Mặc định' && (
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        Phân loại: {item.variant}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-700">{formatVND(item.price)}</p>
                    <p className="text-[10px] text-slate-400">× {item.quantity}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">{formatVND(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buyer Info */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4">Thông Tin Giao Hàng</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Người nhận:</span>
                <span className="font-bold text-slate-700">{order.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Số điện thoại:</span>
                <span className="font-bold text-slate-700">{order.buyerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Email:</span>
                <span className="font-bold text-slate-700">{order.buyerEmail}</span>
              </div>
              <div className="flex gap-2 justify-between items-start">
                <span className="text-slate-400 font-semibold shrink-0">Địa chỉ giao:</span>
                <span className="font-semibold text-slate-700 text-right leading-relaxed">{order.shippingAddress}</span>
              </div>
              {order.ghnOrderCode && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Mã vận đơn GHN:</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{order.ghnOrderCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Invoice Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-xs space-y-4 sticky top-6">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Tổng Kết Đơn Hàng</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Tạm tính ({order.items.length} sp):</span>
                <span className="font-bold text-slate-700">{formatVND(itemSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Phí vận chuyển:</span>
                <span className="font-bold text-slate-700">{formatVND(order.shippingFee || 0)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="font-extrabold text-slate-800">Tổng thanh toán:</span>
                <span className="font-black text-emerald-600 text-base">{formatVND(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Phương thức TT:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                  order.paymentMethod === 'cod' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {order.paymentMethod === 'cod' ? 'Thanh toán COD' :
                   order.paymentMethod === 'zeropay' ? 'ZeroPay' : order.paymentMethod}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund info if any */}
      {(order.refundReason || order.refundDescription) && (
        <div className="bg-rose-50/30 border border-rose-200/60 rounded-3xl p-6 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-2">
            ⚠️ Thông Tin Yêu Cầu Hoàn Tiền
          </h3>
          <div className="space-y-2 text-xs">
            {order.refundReason && (
              <p><span className="text-slate-400 font-semibold">Lý do: </span><span className="font-bold text-slate-700">{order.refundReason}</span></p>
            )}
            {order.refundDescription && (
              <p><span className="text-slate-400 font-semibold">Mô tả: </span><span className="text-slate-600">{order.refundDescription}</span></p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
