import React, { useState, useEffect } from 'react'
import type { Order } from '../../models/order.model'
import { orderService } from '../../services/order.service'
import { paymentService } from '../../services/payment.service'
import { formatOrderId } from '../../utils/orderUtils'

interface BuyerOrdersPageProps {
  user: any
  onBackToHome: () => void
}

export const BuyerOrdersPage: React.FC<BuyerOrdersPageProps> = ({ user, onBackToHome }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('ALL') // 'ALL' | 'PENDING_PAYMENT' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const buyerId = user?.id || 'guest-buyer-id'

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await orderService.fetchBuyerOrders(buyerId)
      setOrders(data)
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchWallet = async () => {
    try {
      const data = await paymentService.fetchWalletBalance(buyerId)
      setWalletBalance(data.balance)
    } catch (e) {
      console.error('Error fetching wallet balance:', e)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchWallet()
  }, [user])

  // Refund wizard states
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null)
  const [showRefundWizard, setShowRefundWizard] = useState(false)
  const [refundOption, setRefundOption] = useState<'OPTION_1' | 'OPTION_2'>('OPTION_1')
  const [refundReason, setRefundReason] = useState('')
  const [refundDesc, setRefundDesc] = useState('')
  const [refundEmail, setRefundEmail] = useState(user?.email || '')

  const handleRequestRefundClick = (order: Order) => {
    setSelectedOrderForRefund(order)
    setShowRefundModal(true)
  }

  const handleSelectRefundOption = (option: 'OPTION_1' | 'OPTION_2') => {
    setRefundOption(option)
    setShowRefundModal(false)
    setShowRefundWizard(true)
    setRefundReason('')
    setRefundDesc('')
    setRefundEmail(user?.email || '')
  }

  const handleSubmitRefund = async () => {
    if (!selectedOrderForRefund) return
    if (!refundReason) {
      alert('Vui lòng chọn lý do trả hàng/hoàn tiền!')
      return
    }
    if (!refundEmail.trim()) {
      alert('Vui lòng nhập địa chỉ email của bạn!')
      return
    }

    try {
      const situationText = refundOption === 'OPTION_1' 
        ? "Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về"
        : "Chưa nhận hàng hoặc nhận thiếu hàng"

      const fullReason = `[${situationText}] Lý do: ${refundReason}`

      await orderService.updateOrderStatus(
        selectedOrderForRefund.id, 
        'REFUND_PENDING', 
        undefined, 
        undefined, 
        fullReason, 
        refundDesc, 
        refundEmail
      )

      alert('Đã gửi yêu cầu Trả hàng/Hoàn tiền thành công! Vui lòng chờ shop phản hồi.')
      setShowRefundWizard(false)
      setSelectedOrderForRefund(null)
      fetchOrders()
    } catch (e: any) {
      alert('Gửi yêu cầu thất bại: ' + e.message)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string, actionName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} đơn hàng này?`)) return

    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      alert(`${actionName} đơn hàng thành công!`)
      fetchOrders()
    } catch (e) {
      console.error('Error updating order status:', e)
      alert('Cập nhật đơn hàng thất bại. Vui lòng thử lại.')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { label: 'Chờ Thanh Toán', color: 'text-amber-600 bg-amber-50 border-amber-100' }
      case 'PROCESSING':
        return { label: 'Chờ Chuẩn Bị Hàng', color: 'text-sky-600 bg-sky-50 border-sky-100' }
      case 'SHIPPING':
        return { label: 'Đang Giao Hàng', color: 'text-orange-600 bg-orange-50 border-orange-100' }
      case 'COMPLETED':
        return { label: 'Đã Hoàn Thành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
      case 'CANCELLED':
        return { label: 'Đã Hủy', color: 'text-rose-600 bg-rose-50 border-rose-100' }
      case 'REFUND_PENDING':
        return { label: 'Trả Hàng/Hoàn Tiền Chờ Duyệt', color: 'text-orange-600 bg-orange-50 border-orange-200' }
      case 'RETURN_PENDING':
        return { label: 'Chờ Trả Hàng', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' }
      case 'RETURN_SHIPPED':
        return { label: 'Đang Trả Hàng', color: 'text-purple-600 bg-purple-50 border-purple-200' }
      case 'REFUND_DISPUTED':
        return { label: 'Tranh Chấp Khiếu Nại', color: 'text-rose-650 bg-rose-50 border-rose-200' }
      case 'REFUNDED':
        return { label: 'Đã Hoàn Tiền', color: 'text-rose-600 bg-rose-50 border-rose-200' }
      default:
        return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100' }
    }
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ'
  }

  const mapStatusToTab = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'UNPAID':
        return 'PENDING_CONFIRMATION'
      case 'PROCESSING':
      case 'PREPARING':
      case 'CONFIRMED':
      case 'AWAITING_SHIPMENT':
        return 'PROCESSING'
      case 'SHIPPED':
      case 'SHIPPING':
      case 'DELIVERING':
      case 'IN_TRANSIT':
        return 'SHIPPED'
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'DELIVERED'
      case 'REFUND_PENDING':
      case 'RETURN_PENDING':
      case 'RETURN_SHIPPED':
      case 'REFUND_DISPUTED':
      case 'REFUNDED':
      case 'RETURNED':
        return 'REFUND'
      case 'CANCELLED':
      case 'CANCELED':
        return 'CANCELLED'
      default:
        return 'ALL'
    }
  }

  const filteredOrders = activeTab === 'ALL'
    ? orders
    : orders.filter(o => mapStatusToTab(o.status) === activeTab)

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { id: 'PROCESSING', label: 'Chờ lấy hàng' },
    { id: 'SHIPPED', label: 'Chờ giao hàng' },
    { id: 'DELIVERED', label: 'Đã giao' },
    { id: 'REFUND', label: 'Trả hàng' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ]

  return (
    <>
      <div className="w-full pb-20 text-slate-800 text-left">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-3xs space-y-4.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-lg border border-emerald-100 shrink-0">
                👤
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-800 truncate">{user?.name || 'Người dùng'}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">{user?.email}</p>
              </div>
            </div>
            
            <hr className="border-slate-100" />

            <div className="space-y-1">
              <button 
                onClick={onBackToHome}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition flex items-center gap-2 cursor-pointer"
              >
                <span>🏠</span> Trang Chủ ZeroMall
              </button>
              <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100/55 transition flex items-center gap-2 cursor-default">
                <span>📋</span> Đơn Mua Của Tôi
              </button>
            </div>
          </div>

          {/* Wallet widget */}
          {walletBalance !== null && (
            <div className="bg-white rounded-2xl border border-slate-200/50 p-5 shadow-3xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>⚡ Ví ZeroPay</span>
                <span className="text-emerald-600 font-extrabold text-xs">Active</span>
              </div>
              <div className="text-2xl font-black text-[#ee4d2d]">
                {formatPrice(walletBalance)}
              </div>
              <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                Số dư ví điện tử dùng để mua sắm thanh toán nhanh không cần tiền mặt tại ZeroMall.
              </p>
            </div>
          )}
        </div>

        {/* Orders List Container */}
        <div className="md:col-span-3 space-y-5">
          
          {/* Header tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
            <div className="flex overflow-x-auto divide-x divide-slate-100">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 text-center py-3.5 px-4 text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-[#ee4d2d] bg-[#feeee9]/15 border-b-2 border-b-[#ee4d2d]'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders content */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/50 p-20 text-center shadow-3xs space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-405 font-semibold">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/50 p-24 text-center shadow-3xs flex flex-col items-center gap-4.5">
              <span className="text-5xl">📄</span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">Chưa có đơn hàng nào</h4>
                <p className="text-xs text-slate-400 font-medium">Không tìm thấy đơn hàng nào ở trạng thái này.</p>
              </div>
              <button 
                onClick={onBackToHome}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition duration-200 cursor-pointer"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => {
                const statusInfo = getStatusLabel(order.status)
                
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
                    
                    {/* Order Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-[#fafafa]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-slate-600 flex-wrap">
                        <span>Đơn hàng:</span>
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          #{formatOrderId(order.id)}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {order.ghnOrderCode && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded">
                              🚛 GHN: {order.ghnOrderCode}
                            </span>
                          </>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-14 h-14 object-cover border border-slate-200/60 rounded-lg shrink-0 shadow-3xs"
                            />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                                {item.name}
                              </h5>
                              {item.variant && item.variant.trim() !== '' && item.variant !== 'Mặc định' && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Default' && (
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Phân loại hàng: {item.variant}</p>
                              )}
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Số lượng: x{item.quantity}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs text-slate-405 font-medium mr-2">Đơn giá: {formatPrice(item.price)}</span>
                            <p className="font-extrabold text-slate-800 text-sm sm:text-base mt-0.5">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer & Actions */}
                    <div className="px-6 py-5 bg-[#fafafa]/20 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                      <div className="text-xs text-slate-500 font-semibold space-y-1">
                        <p>Phương thức: <span className="font-bold uppercase text-slate-700">{order.paymentMethod}</span></p>
                        <p className="truncate max-w-md">Địa chỉ nhận: <span className="font-bold text-slate-700">{order.shippingAddress}</span></p>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 font-semibold">Tổng thanh toán:</span>
                          <span className="text-lg font-black text-[#ee4d2d]">{formatPrice(order.totalAmount)}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {order.status === 'PENDING_PAYMENT' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED', 'Hủy đơn hàng')}
                              className="px-4 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50/50 hover:border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Hủy Đơn Hàng
                            </button>
                          )}
                          {order.status === 'SHIPPING' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED', 'Xác nhận Đã nhận hàng')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                            >
                              Đã Nhận Được Hàng
                            </button>
                          )}
                          {order.status === 'COMPLETED' && (
                            <button
                              onClick={() => handleRequestRefundClick(order)}
                              className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Yêu Cầu Trả Hàng/Hoàn Tiền
                            </button>
                          )}
                          {order.status === 'RETURN_PENDING' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Bạn xác nhận đã đóng gói và gửi hàng trả lại cho Shop?')) {
                                  try {
                                    await orderService.updateOrderStatus(order.id, 'RETURN_SHIPPED')
                                    alert('Xác nhận đã gửi trả hàng thành công!')
                                    fetchOrders()
                                  } catch (err: any) {
                                    alert('Lỗi: ' + err.message)
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              📦 Xác nhận Đã gửi trả hàng
                            </button>
                          )}
                          {(order.status === 'COMPLETED' || order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                            <button
                              onClick={onBackToHome}
                              className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Mua Lại
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>
    </div>

    {/* 1. Modal: Tình huống bạn đang gặp? (Bước 1) */}
    {showRefundModal && selectedOrderForRefund && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="font-extrabold text-slate-800 text-base sm:text-lg">Tình huống bạn đang gặp?</span>
            <button
              onClick={() => { setShowRefundModal(false); setSelectedOrderForRefund(null) }}
              className="text-slate-400 hover:text-slate-600 transition text-xl font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
          {/* Body Options */}
          <div className="p-6 space-y-4">
            {/* Option 1 */}
            <div
              onClick={() => handleSelectRefundOption('OPTION_1')}
              className="border border-slate-200 hover:border-[#ee4d2d] hover:bg-[#feeee9]/10 p-4.5 rounded-2xl cursor-pointer transition flex gap-3.5 items-start group"
            >
              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 group-hover:scale-105 transition">
                ⚡
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[12.5px] text-slate-800 leading-snug group-hover:text-[#ee4d2d] transition">
                  Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Lưu ý: Trường hợp yêu cầu Trả Hàng Hoàn Tiền của bạn được chấp nhận, Voucher có thể sẽ không được hoàn lại.
                </p>
              </div>
            </div>

            {/* Option 2 */}
            <div
              onClick={() => handleSelectRefundOption('OPTION_2')}
              className="border border-slate-200 hover:border-[#ee4d2d] hover:bg-[#feeee9]/10 p-4.5 rounded-2xl cursor-pointer transition flex gap-3.5 items-start group"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 group-hover:scale-105 transition">
                📦
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[12.5px] text-slate-800 leading-snug group-hover:text-[#ee4d2d] transition">
                  Chưa nhận hàng hoặc nhận thiếu hàng
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Lưu ý: Trong trường hợp yêu cầu Trả Hàng Hoàn Tiền của bạn được chấp nhận, Shopee Xu, Voucher, Phí vận chuyển có thể không được hoàn lại.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 2. Full-Screen Wizard Page: Yêu Cầu Trả Hàng/Hoàn Tiền (Bước 2) */}
    {showRefundWizard && selectedOrderForRefund && (
      <div className="fixed inset-0 bg-[#f5f5f5] z-50 overflow-y-auto text-left font-sans flex flex-col">
        {/* Header Red Brand Bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-3xs py-4.5 px-6 sm:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-[#ee4d2d] tracking-tight">ZeroMall</span>
              <span className="text-slate-350 font-light text-base">|</span>
              <span className="text-sm sm:text-base font-extrabold text-[#ee4d2d]">Yêu Cầu Trả Hàng/Hoàn Tiền</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Hủy bỏ yêu cầu trả hàng hoàn tiền này?')) {
                setShowRefundWizard(false)
                setSelectedOrderForRefund(null)
              }
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-lg transition"
          >
            Hủy Yêu Cầu
          </button>
        </header>

        {/* Content Container */}
        <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-5 flex-1 pb-24">
          
          {/* Card 1: Tình huống bạn đang gặp */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-extrabold text-sm text-slate-800">Tình huống bạn đang gặp?</h3>
              <span
                onClick={() => { setShowRefundWizard(false); setShowRefundModal(true) }}
                className="text-xs font-bold text-sky-600 hover:text-sky-500 cursor-pointer hover:underline"
              >
                Thay đổi
              </span>
            </div>
            <p className="text-xs text-slate-550 font-semibold bg-slate-50 border border-slate-100 rounded-xl p-3.5 max-w-2xl leading-relaxed">
              {refundOption === 'OPTION_1' 
                ? "Đã nhận hàng nhưng hàng có vấn đề (bể vỡ, sai mẫu, hàng lỗi, khác mô tả...) - Miễn ship hoàn về"
                : "Chưa nhận hàng hoặc nhận thiếu hàng"}
            </p>
          </section>

          {/* Card 2: Sản phẩm đã chọn */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 pb-2.5 border-b border-slate-100">Sản phẩm đã chọn</h3>
            <div className="divide-y divide-slate-100">
              {selectedOrderForRefund.items.map((item, idx) => (
                <div key={idx} className="py-4 flex gap-4 text-xs items-center justify-between">
                  <div className="flex gap-3.5 items-center min-w-0 flex-1">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover border border-slate-200 rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-800 truncate">{item.name}</h4>
                      {item.variant && (
                        <p className="text-[10px] text-slate-400 mt-1">Phân loại hàng: {item.variant}</p>
                      )}
                      <p className="font-medium text-slate-450 mt-0.5">Số lượng: x{item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-700">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Đơn giá: {formatPrice(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: Chọn sản phẩm cần Trả hàng và Hoàn tiền */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-5">
            <h3 className="font-extrabold text-sm text-slate-800 pb-2.5 border-b border-slate-100">Chọn lý do Trả hàng và Hoàn tiền</h3>
            
            {/* Lý do Dropdown */}
            <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
              <label className="block text-slate-500"><span className="text-rose-500">*</span> Lý do:</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full max-w-md bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#ee4d2d] transition"
              >
                <option value="">Chọn Lý Do</option>
                {refundOption === 'OPTION_1' ? (
                  <>
                    <option value="Hàng bể vỡ / hư hỏng do vận chuyển">Hàng bể vỡ / hư hỏng do vận chuyển</option>
                    <option value="Gửi sai hàng / khác phân loại đã đặt">Gửi sai hàng / khác phân loại đã đặt</option>
                    <option value="Hàng lỗi / không hoạt động được">Hàng lỗi / không hoạt động được</option>
                    <option value="Hàng khác mô tả của Shop">Hàng khác mô tả của Shop</option>
                    <option value="Thiếu sản phẩm / phụ kiện">Thiếu sản phẩm / phụ kiện</option>
                    <option value="Khác (Mô tả chi tiết bên dưới)">Khác (Mô tả chi tiết bên dưới)</option>
                  </>
                ) : (
                  <>
                    <option value="Chưa nhận được hàng sau thời gian dài">Chưa nhận được hàng sau thời gian dài</option>
                    <option value="Thiếu kiện hàng / Shop giao thiếu">Thiếu kiện hàng / Shop giao thiếu</option>
                    <option value="Khác (Mô tả chi tiết bên dưới)">Khác (Mô tả chi tiết bên dưới)</option>
                  </>
                )}
              </select>
            </div>

            {/* Mô tả Textarea */}
            <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
              <label className="block text-slate-500">Mô tả:</label>
              <div className="relative">
                <textarea
                  value={refundDesc}
                  onChange={(e) => setRefundDesc(e.target.value.slice(0, 2000))}
                  placeholder="Chi tiết vấn đề bạn gặp phải..."
                  rows={4}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-[#ee4d2d] transition placeholder-slate-400"
                ></textarea>
                <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-bold">
                  {refundDesc.length}/2000
                </span>
              </div>
            </div>
          </section>

          {/* Card 4: Thông tin hoàn tiền */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-6">
            <h3 className="font-extrabold text-sm text-slate-805 pb-2.5 border-b border-slate-100">Thông tin hoàn tiền</h3>
            
            <div className="text-xs space-y-4">
              <div className="flex justify-between items-baseline py-1">
                <span className="text-slate-450 font-semibold">Phương án:</span>
                <span className="font-bold text-slate-700">Hoàn tiền vào ví ZeroMall</span>
              </div>

              <div className="flex justify-between items-baseline py-1 border-t border-slate-50 pt-3">
                <span className="text-slate-450 font-semibold">Số tiền hoàn lại:</span>
                <span className="font-extrabold text-slate-800 text-sm">{formatPrice(selectedOrderForRefund.totalAmount)}</span>
              </div>

              <div className="flex justify-between items-baseline py-1 border-t border-slate-50 pt-3">
                <span className="text-slate-450 font-semibold">Hoàn tiền vào:</span>
                <span className="font-bold text-slate-805">Ví ZeroMall (ZeroPay)</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-t border-slate-50 pt-3">
                <span className="text-slate-450 font-semibold"><span className="text-rose-500">*</span> Email:</span>
                <input
                  type="email"
                  value={refundEmail}
                  onChange={(e) => setRefundEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email của bạn"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full max-w-sm text-xs font-semibold focus:outline-none focus:border-[#ee4d2d] transition"
                />
              </div>

              {/* Total Summary */}
              <div className="border-t border-slate-100 pt-5 text-right space-y-2">
                <p className="text-[10px] text-slate-400 font-bold">
                  Số tiền có thể hoàn lại: {formatPrice(selectedOrderForRefund.totalAmount)}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500 font-bold text-xs">Số tiền hoàn nhận được</span>
                  <span className="text-xl font-black text-[#ee4d2d]">{formatPrice(selectedOrderForRefund.totalAmount)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Action buttons at bottom */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmitRefund}
              className="bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-extrabold px-12 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
            >
              Hoàn thành
            </button>
          </div>

        </main>
      </div>
    )}
  </>
  )
}
