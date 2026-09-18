import React, { useState, useEffect } from 'react'
import type { Order } from '../../models/order.model'
import { orderService } from '../../services/order.service'
import { paymentService } from '../../services/payment.service'
import { formatOrderId } from '../../utils/orderUtils'
import { ReturnRequestModal } from '../../components/buyer/ReturnRequestModal'

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

  // Refund states
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null)
  const [showReturnModal, setShowReturnModal] = useState(false)

  const handleRequestRefundClick = (order: Order) => {
    setSelectedOrderForReturn(order)
    setShowReturnModal(true)
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
      case 'PENDING':
        return { label: 'Chờ Người Bán Xác Nhận', color: 'text-amber-600 bg-amber-50 border-amber-100' }
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
      case 'RETURN_REQUESTED':
        return { label: 'Trả Hàng Chờ Shop Duyệt', color: 'text-amber-700 bg-amber-50 border-amber-200' }
      case 'RETURN_PENDING':
      case 'RETURN_APPROVED':
        return { label: 'Shop Đã Đồng Ý • Chờ Gửi Hàng', color: 'text-blue-700 bg-blue-50 border-blue-200' }
      case 'RETURN_SHIPPING':
      case 'RETURN_IN_TRANSIT':
        return { label: 'Đang Gửi Hàng Hoàn', color: 'text-purple-700 bg-purple-50 border-purple-200' }
      case 'RETURN_RECEIVED':
      case 'DELIVERED_TO_SELLER':
        return { label: 'Shop Đang Kiểm Hàng Hoàn', color: 'text-orange-700 bg-orange-50 border-orange-200' }
      case 'REFUND_DISPUTED':
      case 'RETURN_DISPUTED':
      case 'SELLER_DISPUTED':
      case 'CS_ARBITRATING':
        return { label: 'Tranh Chấp Khiếu Nại • CS Phân Xử', color: 'text-rose-700 bg-rose-50 border-rose-200' }
      case 'REFUNDED':
        return { label: 'Đã Hoàn Tiền Thành Công', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      case 'RETURN_REJECTED':
      case 'REJECTED':
        return { label: 'Bị Từ Chối Trả Hàng', color: 'text-slate-700 bg-slate-100 border-slate-300' }
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
                              🚚 ZMX: {order.ghnOrderCode}
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

    {/* Return / Refund Request Modal (Chuẩn Shopee) */}
    {showReturnModal && selectedOrderForReturn && (
      <ReturnRequestModal
        order={selectedOrderForReturn}
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false)
          setSelectedOrderForReturn(null)
        }}
        onSuccess={() => {
          fetchOrders()
        }}
      />
    )}
  </>
  )
}
