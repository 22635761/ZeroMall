import React from 'react'
import type { Order } from '../../../models/order.model'
import { getStatusText, getStatusColor, formatMoney } from './types'

interface PurchaseOrderCardProps {
  order: Order
  shopsInfo: { [key: string]: string }
  isRated: boolean
  onViewDetail: (order: Order) => void
  onOpenTracking: (orderId: string) => void
  onOpenCancel: (order: Order) => void
  onRePaySepay: (order: Order) => void
  onConfirmReceived: (order: Order, isCompleted?: boolean) => void
  onOpenReview: (order: Order) => void
  onRequestRefund: (order: Order) => void
  onOpenSimpleDetail: (order: Order) => void
  onConfirmReturnShipped: (order: Order) => void
}

export const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  order,
  shopsInfo,
  isRated,
  onViewDetail,
  onOpenTracking,
  onOpenCancel,
  onRePaySepay,
  onConfirmReceived,
  onOpenReview,
  onRequestRefund,
  onOpenSimpleDetail,
  onConfirmReturnShipped
}) => {
  const firstItem = order.items?.[0]
  const targetShopId = firstItem?.shopId || 'zeromall-official'
  const fetchedShopName = shopsInfo[targetShopId]
  const itemShopName = (firstItem as any)?.shopName
  const shopName =
    fetchedShopName ||
    (itemShopName && !itemShopName.includes('-')
      ? itemShopName
      : targetShopId.startsWith('Shop')
      ? targetShopId
      : `Shop ${targetShopId.substring(0, 8)}`)

  return (
    <div className="bg-white border border-slate-200/65 rounded-sm p-4 sm:p-5 shadow-3xs space-y-4">
      {/* Header shop & status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-[#ee4d2d] text-white px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider">
            Yêu thích
          </span>
          <span className="font-bold text-slate-800">{shopName}</span>

          {/* Hiển thị Mã Đơn Hàng rõ ràng */}
          <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Mã đơn: #{order.id}
          </span>

          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('open_chat_with_shop', {
                  detail: {
                    shopId: targetShopId,
                    shopName: shopName,
                    order: {
                      id: order.id,
                      totalAmount: order.totalAmount,
                      status: order.status,
                      itemsCount: order.items?.length || 1,
                      firstItemName: order.items?.[0]?.name,
                      firstItemImage: order.items?.[0]?.image || (order.items?.[0] as any)?.productImage
                    }
                  }
                })
              )
            }}
            className="border border-slate-200 hover:bg-slate-50 text-[10px] px-2 py-0.5 rounded-sm text-slate-500 font-medium cursor-pointer transition flex items-center gap-1"
          >
            <span>💬</span> Chat
          </button>
          <a
            href={`/shop/${targetShopId}`}
            className="border border-slate-200 hover:bg-slate-50 text-[10px] px-2 py-0.5 rounded-sm text-slate-500 font-medium cursor-pointer transition flex items-center gap-1"
          >
            <span>🏪</span> Xem Shop
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTracking(order.id)}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
          >
            <span>🚚</span> Tra Cứu Vận Chuyển ZMX
          </button>
          <div className={`font-bold ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </div>
        </div>
      </div>

      {/* Order Items List - Bấm vào xem chi tiết đơn hàng */}
      <div
        onClick={() => onViewDetail(order)}
        className="space-y-3 cursor-pointer hover:bg-slate-50/70 p-2 -mx-2 rounded-lg transition group"
        title="Bấm để xem chi tiết đơn hàng"
      >
        {order.items.map((item: any) => (
          <div key={item.id} className="flex gap-3 text-xs">
            <img
              src={item.image || item.productImage || 'https://placehold.co/100x100?text=No+Image'}
              alt={item.name || item.productName}
              className="w-[70px] h-[70px] border border-slate-200 rounded-sm object-cover shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="font-semibold text-slate-800 line-clamp-1 hover:text-[#ee4d2d] transition">
                {item.name || item.productName}
              </h4>
              {item.variant &&
                item.variant.trim() !== '' &&
                item.variant !== 'Mặc định' &&
                item.variant !== 'Tiêu chuẩn' &&
                item.variant !== 'Default' && (
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Phân loại hàng: <span className="font-semibold text-slate-600">{item.variant}</span>
                  </p>
                )}
              <p className="font-medium text-slate-700">x{item.quantity}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[#ee4d2d] font-bold">{formatMoney(item.price)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order total amount summary */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-slate-500">Thành tiền:</span>
          <span className="text-base font-extrabold text-[#ee4d2d]">{formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      {/* Action buttons footer */}
      <div className="flex justify-end gap-2 pt-2">
        {/* 1. CHỜ THANH TOÁN & CHỜ XÁC NHẬN & CHỜ LẤY HÀNG -> Hủy đơn */}
        {(order.status === 'PENDING' ||
          order.status === 'PENDING_PAYMENT' ||
          order.status === 'PROCESSING' ||
          order.status === 'PREPARING' ||
          order.status === 'CONFIRMED') && (
          <>
            <button
              onClick={() => onOpenCancel(order)}
              className="px-4 py-2 border border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-sm font-semibold transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              ❌ Hủy Đơn Hàng
            </button>

            {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT') && order.paymentMethod === 'sepay' && (
              <button
                onClick={() => onRePaySepay(order)}
                className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
              >
                📲 Thanh toán ngay
              </button>
            )}
          </>
        )}

        {/* 2. ĐÃ GIAO (DELIVERED) */}
        {order.status === 'DELIVERED' && (
          <>
            {!isRated && (
              <button
                onClick={() => onConfirmReceived(order, true)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
              >
                ✅ Đã nhận được hàng
              </button>
            )}

            {!isRated && (
              <button
                onClick={() => onOpenReview(order)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                title="Đánh giá ngay để chia sẻ trải nghiệm mua hàng!"
              >
                ⭐ Đánh giá sản phẩm
              </button>
            )}

            <button
              onClick={() => onRequestRefund(order)}
              className="px-4 py-2 border border-rose-200 hover:border-rose-450 hover:bg-rose-50 text-rose-600 rounded-sm font-semibold transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              🔄 Yêu cầu Trả hàng/Hoàn tiền
            </button>
          </>
        )}

        {/* 2b. HOÀN TẤT (COMPLETED) hoặc DELIVERED+isRated */}
        {(order.status === 'COMPLETED' || (order.status === 'DELIVERED' && isRated)) && (
          <>
            {!isRated && (
              <button
                onClick={() => onOpenReview(order)}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
              >
                ⭐ Đánh giá sản phẩm
              </button>
            )}
            <button
              onClick={() => (window.location.href = '/')}
              className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              Mua lại
            </button>
          </>
        )}

        {/* 3. ĐANG GIAO HÀNG */}
        {(order.status === 'SHIPPED' ||
          order.status === 'SHIPPING' ||
          order.status === 'DELIVERING' ||
          order.status === 'IN_TRANSIT') && (
          <>
            <button
              onClick={() => onOpenTracking(order.id)}
              className="px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-700 font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px] flex items-center gap-1"
            >
              🚚 Xem Hành Trình (ZMX)
            </button>

            <button
              onClick={() => onConfirmReceived(order, false)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              ✅ Đã nhận được hàng
            </button>
          </>
        )}

        {/* 4. TRẢ HÀNG */}
        {(order.status === 'REFUND_PENDING' ||
          order.status === 'RETURN_PENDING' ||
          order.status === 'RETURN_SHIPPED' ||
          order.status === 'REFUND_DISPUTED' ||
          order.status === 'REFUNDED' ||
          order.status === 'RETURNED') && (
          <>
            {order.status === 'RETURN_PENDING' && (
              <button
                onClick={() => onConfirmReturnShipped(order)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
              >
                📦 Xác nhận Đã gửi trả hàng
              </button>
            )}
            <button
              onClick={() => onOpenSimpleDetail(order)}
              className="px-4 py-2 border border-slate-200 rounded-sm font-semibold hover:bg-slate-50 text-slate-700 transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              📄 Xem chi tiết
            </button>
          </>
        )}

        {/* 5. ĐÃ HỦY */}
        {(order.status === 'CANCELLED' || order.status === 'CANCELED') && (
          <>
            <button
              onClick={() => onOpenSimpleDetail(order)}
              className="px-4 py-2 border border-slate-200 rounded-sm font-semibold hover:bg-slate-50 text-slate-700 transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              📄 Xem chi tiết đơn hủy
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
            >
              Mua lại
            </button>
          </>
        )}
      </div>
    </div>
  )
}
