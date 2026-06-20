import React, { useState, useEffect } from 'react'

interface OrderItem {
  id: string
  productId: string
  shopId: string
  name: string
  image: string
  variant: string | null
  price: number
  quantity: number
}

interface Order {
  id: string
  buyerId: string
  buyerEmail: string
  buyerName: string
  buyerPhone: string
  shippingAddress: string
  totalAmount: number
  shippingFee: number
  paymentMethod: string
  status: string // "PENDING_PAYMENT" | "PROCESSING" | "SHIPPING" | "COMPLETED" | "CANCELLED"
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

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
      const res = await fetch(`http://localhost:8000/orders/buyer/${buyerId}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchWallet = async () => {
    try {
      const res = await fetch(`http://localhost:8000/payments/wallet/${buyerId}`)
      if (res.ok) {
        const data = await res.json()
        setWalletBalance(data.balance)
      }
    } catch (e) {
      console.error('Error fetching wallet balance:', e)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchWallet()
  }, [user])

  const handleUpdateStatus = async (orderId: string, newStatus: string, actionName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} đơn hàng này?`)) return

    try {
      const res = await fetch(`http://localhost:8000/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        alert(`${actionName} đơn hàng thành công!`)
        fetchOrders()
      } else {
        alert('Cập nhật đơn hàng thất bại. Vui lòng thử lại.')
      }
    } catch (e) {
      console.error('Error updating order status:', e)
      alert('Lỗi hệ thống. Vui lòng thử lại.')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { label: 'Chờ Thanh Toán', color: 'text-amber-600 bg-amber-50 border-amber-100' }
      case 'PROCESSING':
        return { label: 'Đang Xử Lý', color: 'text-sky-600 bg-sky-50 border-sky-100' }
      case 'SHIPPING':
        return { label: 'Đang Giao Hàng', color: 'text-orange-600 bg-orange-50 border-orange-100' }
      case 'COMPLETED':
        return { label: 'Đã Hoàn Thành', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
      case 'CANCELLED':
        return { label: 'Đã Hủy', color: 'text-rose-600 bg-rose-50 border-rose-100' }
      default:
        return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100' }
    }
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ'
  }

  const filteredOrders = activeTab === 'ALL'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { id: 'PROCESSING', label: 'Đang xử lý' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Hoàn thành' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ]

  return (
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
              <p className="text-xs text-slate-400 font-semibold">Đang tải danh sách đơn hàng...</p>
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
                      <div className="flex items-center gap-2.5 font-bold text-slate-600">
                        <span>Đơn hàng:</span>
                        <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {order.id.substring(0, 8).toUpperCase()}...
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
                              {item.variant && (
                                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Phân loại: {item.variant}</p>
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
                          {(order.status === 'COMPLETED' || order.status === 'CANCELLED') && (
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
  )
}
