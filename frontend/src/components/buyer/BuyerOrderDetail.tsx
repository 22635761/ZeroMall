import React, { useState, useEffect } from 'react'
import type { Order } from '../../models/order.model'
import { formatOrderId } from '../../utils/orderUtils'
import { LiveMapTracking } from '../delivery/LiveMapTracking'

interface BuyerOrderDetailProps {
  order: Order
  onBack: () => void
  onOpenReview: (order: Order) => void
  onCancelOrder: (order: Order) => void
  onRePaySepay: (order: Order) => void
  onConfirmReceived: (order: Order) => void
  onOpenRefund: (order: Order) => void
  isRated: boolean
  shopName?: string
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateStr: string | Date | undefined) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
}

export const BuyerOrderDetail: React.FC<BuyerOrderDetailProps> = ({
  order,
  onBack,
  onOpenReview,
  onCancelOrder,
  onRePaySepay,
  onConfirmReceived,
  onOpenRefund,
  isRated,
  shopName: propShopName,
}) => {
  const [trackingData, setTrackingData] = useState<any>(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [showFullLogs, setShowFullLogs] = useState(false)
  const [showLiveMapModal, setShowLiveMapModal] = useState(false)

  // Fetch ZMX tracking info
  useEffect(() => {
    let isMounted = true
    const fetchTracking = async () => {
      setLoadingTracking(true)
      try {
        const res = await fetch(`http://localhost:8000/delivery/tracking/${order.id}`)
        if (res.ok && isMounted) {
          const data = await res.json()
          setTrackingData(data)
        }
      } catch (err) {
        console.error('Failed to fetch tracking data for order detail:', err)
      } finally {
        if (isMounted) setLoadingTracking(false)
      }
    }
    fetchTracking()
    return () => { isMounted = false }
  }, [order.id])

  // Extract shop info
  const firstItem = order.items[0]
  const shopId = firstItem?.shopId || 'default-shop'
  const shopDisplayName = propShopName || 'ZeroMall Official Store'

  // Calculations
  const itemSubtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingFee = order.shippingFee || 0
  const shopDiscount = order.shopDiscountAmount || 0
  const platformDiscount = order.platformDiscountAmount || 0
  const totalDiscount = shopDiscount + platformDiscount

  // Steps Progress Definition
  // 1: Đơn Hàng Đã Đặt
  // 2: Đã Xác Nhận Thông Tin Thanh Toán
  // 3: Đã Giao Cho ĐVVC
  // 4: Đã Nhận Được Hàng
  // 5: Đánh Giá
  const getProgressState = () => {
    const status = order.status
    const isPaid = order.paymentMethod !== 'cod' || ['DELIVERED', 'COMPLETED'].includes(status)
    const isShipped = ['SHIPPING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(status)
    const isDelivered = ['DELIVERED', 'COMPLETED'].includes(status)
    const isCompleted = status === 'COMPLETED' || isRated

    let currentStep = 1
    if (order.status === 'CANCELLED') currentStep = 0
    else if (isCompleted) currentStep = 5
    else if (isDelivered) currentStep = 4
    else if (isShipped) currentStep = 3
    else if (isPaid || status === 'PROCESSING') currentStep = 2
    else currentStep = 1

    return {
      currentStep,
      isPaid,
      isShipped,
      isDelivered,
      isCompleted,
    }
  }

  const { currentStep } = getProgressState()

  // Timeline Logs from Tracking or fallback timestamps
  const logs = trackingData?.trackingLogs || []
  const displayLogs = showFullLogs ? logs : logs.slice(0, 5)

  // Status text & color
  const getStatusDisplay = () => {
    switch (order.status) {
      case 'PENDING':
        return { text: 'CHỜ SHOP XÁC NHẬN', color: 'text-amber-600' }
      case 'PENDING_PAYMENT':
        return { text: 'CHỜ THANH TOÁN', color: 'text-amber-600' }
      case 'PROCESSING':
        return { text: 'ĐANG XỬ LÝ / CHỜ GIAO ĐVVC', color: 'text-blue-600' }
      case 'SHIPPING':
      case 'IN_TRANSIT':
        return { text: 'ĐANG VẬN CHUYỂN', color: 'text-indigo-600' }
      case 'DELIVERED':
        return { text: 'GIAO HÀNG THÀNH CÔNG', color: 'text-emerald-600' }
      case 'COMPLETED':
        return { text: 'ĐƠN HÀNG ĐÃ HOÀN THÀNH', color: 'text-[#ee4d2d]' }
      case 'CANCELLED':
        return { text: 'ĐÃ HỦY ĐƠN HÀNG', color: 'text-slate-500' }
      default:
        return { text: order.status, color: 'text-slate-700' }
    }
  }

  const statusInfo = getStatusDisplay()

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 animate-in fade-in duration-150 text-left">
      {/* 1. Header Bar: Nút Trở Lại + Mã Đơn Hàng + Trạng Thái */}
      <div className="bg-white rounded-lg shadow-xs p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#ee4d2d] transition cursor-pointer"
        >
          <span className="text-base font-bold">‹</span> TRỞ LẠI
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">MÃ ĐƠN HÀNG: <strong className="font-mono text-slate-800">{formatOrderId(order.id)}</strong></span>
          <span className="text-slate-300">|</span>
          <span className={`font-bold uppercase tracking-wide ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* 2. Timeline Step Progress Bar (Shopee 5-step Style) */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-lg shadow-xs p-6 pt-8 pb-8">
          <div className="relative flex justify-between items-start max-w-4xl mx-auto">
            {/* Background connecting line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0" />
            <div
              className="absolute top-5 left-8 h-1 bg-emerald-500 transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%`,
              }}
            />

            {/* Step 1: Đơn Hàng Đã Đặt */}
            <div className="flex flex-col items-center text-center relative z-10 w-24">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-3 transition-all ${
                currentStep >= 1 ? 'bg-emerald-500 border-white text-white shadow-md' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                <span className="text-base">📝</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2.5">Đơn Hàng Đã Đặt</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</p>
            </div>

            {/* Step 2: Đã Xác Nhận Thanh Toán / Shop Nhận Đơn */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-3 transition-all ${
                currentStep >= 2 ? 'bg-emerald-500 border-white text-white shadow-md' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                <span className="text-base">💳</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2.5 leading-tight">Đã Xác Nhận TT Thanh Toán</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentStep >= 2 ? formatDate(order.updatedAt || order.createdAt) : ''}
              </p>
            </div>

            {/* Step 3: Đã Giao Cho ĐVVC */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-3 transition-all ${
                currentStep >= 3 ? 'bg-emerald-500 border-white text-white shadow-md' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                <span className="text-base">🚛</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2.5">Đã Giao Cho ĐVVC</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentStep >= 3 ? formatDate(order.updatedAt) : ''}
              </p>
            </div>

            {/* Step 4: Đã Nhận Được Hàng */}
            <div className="flex flex-col items-center text-center relative z-10 w-28">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-3 transition-all ${
                currentStep >= 4 ? 'bg-emerald-500 border-white text-white shadow-md' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                <span className="text-base">📥</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2.5">Đã Nhận Được Hàng</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentStep >= 4 ? formatDate(order.updatedAt) : ''}
              </p>
            </div>

            {/* Step 5: Đánh Giá */}
            <div className="flex flex-col items-center text-center relative z-10 w-24">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center border-3 transition-all ${
                currentStep >= 5 ? 'bg-emerald-500 border-white text-white shadow-md' : 'bg-white border-slate-300 text-slate-400'
              }`}>
                <span className="text-base">⭐</span>
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2.5">Đánh Giá</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isRated ? 'Đã đánh giá' : ''}
              </p>
            </div>
          </div>

          {/* Prompt banner & Actions */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              {order.status === 'COMPLETED' || order.status === 'DELIVERED' ? (
                <span>Đánh giá sản phẩm để nhận <strong>200 Xu</strong> và giúp người mua khác lựa chọn tốt hơn!</span>
              ) : order.status === 'PENDING' || order.status === 'PENDING_PAYMENT' ? (
                <span className="text-amber-700">Đơn hàng đang chờ xử lý. Bạn có thể yêu cầu hủy nếu chưa được gửi đi.</span>
              ) : (
                <span className="text-slate-500">Đơn hàng đang được hệ thống ZMX vận chuyển an toàn đến bạn.</span>
              )}
            </div>

            {/* Main Action Buttons in Step Box */}
            <div className="flex items-center gap-2">
              {order.status === 'DELIVERED' && (
                <button
                  onClick={() => onConfirmReceived(order)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer"
                >
                  Đã Nhận Hàng
                </button>
              )}

              {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                <button
                  onClick={() => onOpenReview(order)}
                  className={`px-5 py-2 text-xs font-bold rounded-sm transition cursor-pointer shadow-xs ${
                    isRated 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-[#ee4d2d] hover:bg-[#d73f20] text-white'
                  }`}
                >
                  {isRated ? 'Xem Đánh Giá' : 'Đánh Giá'}
                </button>
              )}

              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('open_chat_with_shop', {
                      detail: { shopId, shopName: shopDisplayName },
                    })
                  )
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-sm transition cursor-pointer"
              >
                Liên Hệ Người Bán
              </button>

              <a
                href={`/shop/${shopId}`}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-sm transition cursor-pointer"
              >
                Mua Lại
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3. Phân Đoạn: Địa Chỉ Nhận Hàng & Lịch Sử Hành Trình ZMX (Shopee Zigzag Line Decor) */}
      <div className="bg-white rounded-lg shadow-xs overflow-hidden">
        {/* Đường viền phong bì may mắn Shopee Decor */}
        <div className="h-1 bg-[repeating-linear-gradient(45deg,#ee4d2d_0,#ee4d2d_30px,#fff_30px,#fff_40px,#00bfa5_40px,#00bfa5_70px,#fff_70px,#fff_80px)]" />

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Cột Trái: Địa Chỉ Nhận Hàng */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Địa Chỉ Nhận Hàng</h3>
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-900 text-sm">{order.buyerName}</p>
              <p className="text-slate-500">{order.buyerPhone}</p>
              <p className="text-slate-600 leading-relaxed pt-1">{order.shippingAddress}</p>
            </div>
          </div>

          {/* Cột Phải: Lịch Sử Hành Trình & Đơn Vị Vận Chuyển */}
          <div className="md:col-span-7 md:border-l md:border-slate-100 md:pl-8 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đơn Vị Vận Chuyển: </span>
                <span className="text-xs font-black text-emerald-700">ZeroExpress (ZMX Standard)</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-slate-600">
                  {trackingData?.trackingNumber || (order as any).trackingNumber || 'ZMX' + order.id.slice(0, 10)}
                </span>
              </div>
            </div>

            {/* Timeline Events List */}
            <div className="pt-2 space-y-4">
              {loadingTracking ? (
                <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                  Đang tải thông tin hành trình vận chuyển...
                </div>
              ) : logs.length > 0 ? (
                <>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {displayLogs.map((log: any, idx: number) => {
                      const isLatest = idx === 0
                      return (
                        <div key={idx} className="relative text-xs">
                          {/* Dot */}
                          <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white ${
                            isLatest ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
                          }`} />
                          
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isLatest ? 'text-emerald-700' : 'text-slate-800'}`}>
                                {log.title}
                              </span>
                              <span className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</span>
                            </div>
                            <p className="text-slate-500 text-[11px] leading-relaxed">{log.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    {logs.length > 5 && (
                      <button
                        onClick={() => setShowFullLogs(!showFullLogs)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        {showFullLogs ? 'Thu gọn lịch sử' : `Xem thêm (${logs.length - 5} sự kiện)`}
                      </button>
                    )}

                    <button
                      onClick={() => setShowLiveMapModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                    >
                      <span>🗺️</span> Xem Bản Đồ Trực Tiếp
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Đang chuẩn bị hàng tại kho người bán</p>
                  <p className="text-[11px] text-slate-400">Hệ thống ZMX sẽ cập nhật lộ trình ngay khi Shipper lấy hàng.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Danh Sách Sản Phẩm */}
      <div className="bg-white rounded-lg shadow-xs overflow-hidden">
        {/* Header Gian Hàng */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 bg-[#ee4d2d] text-white text-[10px] font-bold rounded-xs">
              Yêu Thích
            </span>
            <span className="font-bold text-slate-900">{shopDisplayName}</span>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('open_chat_with_shop', {
                    detail: { shopId, shopName: shopDisplayName },
                  })
                )
              }}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xs text-slate-600 text-[11px] cursor-pointer flex items-center gap-1"
            >
              <span>💬</span> Chat
            </button>
            <a
              href={`/shop/${shopId}`}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xs text-slate-600 text-[11px] cursor-pointer flex items-center gap-1"
            >
              <span>🏪</span> Xem Shop
            </a>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Giao Hàng Tiết Kiệm Bởi <strong>ZMX</strong>
          </div>
        </div>

        {/* Các dòng sản phẩm */}
        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="p-4 flex gap-4 text-xs items-start">
              <img
                src={item.image || 'https://placehold.co/100x100?text=No+Image'}
                alt={item.name}
                className="w-20 h-20 border border-slate-200 rounded-sm object-cover shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">
                  {item.name}
                </h4>
                {item.variant && item.variant.trim() !== '' && item.variant !== 'Mặc định' && (
                  <p className="text-[11px] text-slate-500">
                    Phân loại hàng: <span className="font-medium text-slate-700">{item.variant}</span>
                  </p>
                )}
                <p className="text-slate-600 font-medium">x{item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#ee4d2d] font-bold text-sm">{formatMoney(item.price)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Bảng Tính Tiền & Thanh Toán Chi Tiết */}
        <div className="border-t border-slate-100 bg-slate-50/40 p-6">
          <div className="max-w-md ml-auto space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tổng tiền hàng:</span>
              <span className="font-medium text-slate-800">{formatMoney(itemSubtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Phí vận chuyển:</span>
              <span className="font-medium text-slate-800">{formatMoney(shippingFee)}</span>
            </div>

            {shopDiscount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Voucher từ Shop:</span>
                <span className="font-medium text-[#ee4d2d]">-{formatMoney(shopDiscount)}</span>
              </div>
            )}

            {platformDiscount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Voucher từ ZeroMall:</span>
                <span className="font-medium text-[#ee4d2d]">-{formatMoney(platformDiscount)}</span>
              </div>
            )}

            {totalDiscount > 0 && shopDiscount === 0 && platformDiscount === 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Giảm giá khuyến mãi:</span>
                <span className="font-medium text-[#ee4d2d]">-{formatMoney(totalDiscount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Thành tiền:</span>
              <span className="text-xl font-black text-[#ee4d2d]">{formatMoney(order.totalAmount)}</span>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex justify-between border-t border-dashed border-slate-200">
              <span>Phương thức Thanh toán:</span>
              <span className="font-bold text-slate-700 uppercase">
                {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
                 order.paymentMethod === 'zeropay' ? 'Ví Số Dư ZeroPay' :
                 order.paymentMethod === 'sepay' ? 'Chuyển Khoản Ngân Hàng (VietQR / SePay)' :
                 order.paymentMethod}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Footer Action Bar */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {order.paymentMethod === 'cod' && (
              <span>⚠️ Vui lòng thanh toán <strong>{formatMoney(order.totalAmount)}</strong> khi nhận hàng.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT' || order.status === 'PROCESSING') && (
              <button
                onClick={() => onCancelOrder(order)}
                className="px-4 py-2 border border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-sm transition cursor-pointer"
              >
                Hủy Đơn Hàng
              </button>
            )}

            {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT') && order.paymentMethod === 'sepay' && (
              <button
                onClick={() => onRePaySepay(order)}
                className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d73f20] text-white text-xs font-bold rounded-sm shadow-xs transition cursor-pointer"
              >
                Thanh Toán Ngay
              </button>
            )}

            {(order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
              <button
                onClick={() => onOpenRefund(order)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-sm transition cursor-pointer"
              >
                Yêu Cầu Trả Hàng / Hoàn Tiền
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Xem Bản Đồ Trực Tiếp */}
      {showLiveMapModal && trackingData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-hidden text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h3 className="font-black text-slate-900">Bản Đồ Hành Trình Trực Tuyến ZMX</h3>
              </div>
              <button
                onClick={() => setShowLiveMapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <LiveMapTracking trackingData={trackingData} />

            <div className="text-right pt-2">
              <button
                onClick={() => setShowLiveMapModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
