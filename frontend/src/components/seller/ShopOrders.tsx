import React, { useState, useEffect } from 'react'
import type { Order } from '../../models/order.model'
import { orderService } from '../../services/order.service'
import { formatOrderId } from '../../utils/orderUtils'

interface ShopOrdersProps {
  user: any
  token: string
  activeSubMenu?: string
}

export const ShopOrders: React.FC<ShopOrdersProps> = ({ user, token, activeSubMenu }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const shopId = user?.shopId

  useEffect(() => {
    if (activeSubMenu === 'cancelled-orders') {
      setActiveTab('CANCELLED')
    } else if (activeSubMenu === 'all-orders') {
      setActiveTab('all')
    } else if (activeSubMenu === 'bulk-delivery') {
      setActiveTab('PROCESSING')
    } else if (activeSubMenu === 'refunds') {
      setActiveTab('REFUND_PENDING')
    }
  }, [activeSubMenu])

  const fetchOrders = async () => {
    if (!shopId) {
      setError('Không tìm thấy thông tin Shop của bạn!')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await orderService.fetchSellerOrders(shopId, token)
      setOrders(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Có lỗi xảy ra khi tải đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [shopId])

  const handleApproveRefund = async (order: Order) => {
    if (!window.confirm(`Bạn có đồng ý hoàn trả ${formatVND(order.totalAmount)} cho khách hàng không?`)) return
    setUpdatingOrderId(order.id)
    try {
      // 1. Cập nhật status đơn hàng thành REFUNDED
      await orderService.updateOrderStatus(order.id, 'REFUNDED', undefined, token)
      
      // 2. Gọi API hoàn tiền cho khách nếu thanh toán online (không phải cod)
      if (order.paymentMethod !== 'cod') {
        const res = await fetch('http://localhost:8000/payments/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            buyerId: order.buyerId,
            amount: order.totalAmount
          })
        })
        if (!res.ok) {
          console.error('Failed to trigger auto wallet refund for buyer')
        }
      }
      
      alert('Đã chấp nhận yêu cầu và hoàn tiền thành công!')
      await fetchOrders()
    } catch (err: any) {
      alert(err.message || 'Lỗi xử lý hoàn tiền')
    } finally {
      setUpdatingOrderId(null)
    }
  }



  const handleRequestReturn = async (order: Order) => {
    if (!window.confirm(`Yêu cầu Người mua phải trả lại hàng trước khi được hoàn tiền ${formatVND(order.totalAmount)}?`)) return
    setUpdatingOrderId(order.id)
    try {
      await orderService.updateOrderStatus(order.id, 'RETURN_PENDING', undefined, token)
      alert('Đã yêu cầu Trả Hàng! Đơn hàng chuyển sang trạng thái chờ Người mua gửi hàng lại cho Shop.')
      await fetchOrders()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi yêu cầu trả hàng.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDisputeRefund = async (order: Order) => {
    if (!window.confirm('Bạn từ chối hoàn tiền và muốn chuyển đơn hàng này sang Tranh chấp để nhờ Admin ZeroMall phân xử?')) return
    setUpdatingOrderId(order.id)
    try {
      await orderService.updateOrderStatus(order.id, 'REFUND_DISPUTED', undefined, token)
      alert('Đã gửi yêu cầu từ chối khiếu nại! Admin ZeroMall sẽ xem xét và đưa ra phán quyết.')
      await fetchOrders()
    } catch (err: any) {
      alert(err.message || 'Lỗi khi chuyển tranh chấp.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    try {
      const order = orders.find((o) => o.id === orderId)
      let ghnOrderCode: string | undefined = undefined

      if (newStatus === 'SHIPPING' && order) {
        // Safe Simulation Mode: Tạo mã vận đơn giả lập chuẩn định dạng GHN, không gửi request thật lên hệ thống GHN thật
        const randomNum = Math.floor(100000000 + Math.random() * 900000000)
        ghnOrderCode = `GHN-VN-${randomNum}`
        alert(`📦 Đã tạo mã vận đơn giả lập GHN thành công: ${ghnOrderCode}\n(Hệ thống đang ở chế độ Simulation an toàn, KHÔNG tạo đơn thật trên GHN).`)
      }

      await orderService.updateOrderStatus(orderId, newStatus, ghnOrderCode, token)

      // Refresh orders list
      await fetchOrders()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Lỗi khi cập nhật đơn hàng.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Define tabs configuration
  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { id: 'PROCESSING', label: 'Chờ xử lý' },
    { id: 'SHIPPING', label: 'Đang giao' },
    { id: 'COMPLETED', label: 'Đã hoàn thành' },
    { id: 'REFUND_PENDING', label: 'Yêu cầu hoàn tiền' },
    { id: 'RETURN_PENDING', label: 'Chờ trả hàng' },
    { id: 'RETURN_SHIPPED', label: 'Đang trả hàng' },
    { id: 'REFUND_DISPUTED', label: 'Tranh chấp' },
    { id: 'REFUNDED', label: 'Đã hoàn tiền' },
    { id: 'CANCELLED', label: 'Đơn Hủy' }
  ]

  // Filter orders by active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  // Format currencies
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  // Get status badge colors
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold">Chờ thanh toán</span>
      case 'PROCESSING':
        return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Chờ chuẩn bị hàng</span>
      case 'SHIPPING':
        return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Đang giao hàng</span>
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Đã giao thành công</span>
      case 'REFUND_PENDING':
        return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Yêu cầu hoàn tiền</span>
      case 'RETURN_PENDING':
        return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Chờ người mua trả hàng</span>
      case 'RETURN_SHIPPED':
        return <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Người mua đang trả hàng</span>
      case 'REFUND_DISPUTED':
        return <span className="bg-red-105 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Tranh chấp khiếu nại</span>
      case 'REFUNDED':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Đã hoàn tiền</span>
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold">Đã hủy</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">Quản Lý Đơn Hàng</h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
            Theo dõi, xử lý và cập nhật tiến độ vận chuyển cho các đơn hàng của shop bạn.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="bg-white border border-slate-200 hover:border-emerald-500/20 hover:bg-emerald-50/10 text-slate-600 hover:text-emerald-600 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔄</span> Làm Mới
        </button>
      </div>



      {/* Tabs */}
      <div className="bg-white border border-slate-200/50 rounded-2xl p-1.5 flex gap-1 overflow-x-auto shadow-xs">
        {tabs.map((tab) => {
          const count = tab.id === 'all' 
            ? orders.length 
            : orders.filter(o => o.status === tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] text-center py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {tab.label} <span className={`ml-1 text-[10px] ${activeTab === tab.id ? 'text-emerald-100' : 'text-slate-400'}`}>({count})</span>
            </button>
          )
        })}
      </div>

      {/* Main Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-bold mt-4">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm text-center">
          <span className="text-4xl">❌</span>
          <p className="text-sm font-bold text-rose-600 mt-3">Đã xảy ra lỗi</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
          <button
            onClick={fetchOrders}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm text-center">
          <span className="text-5xl mb-4">📦</span>
          <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Không tìm thấy đơn hàng</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Hiện tại shop không có đơn hàng nào thuộc trạng thái này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            // Calculate shop's item subtotal for this order
            const itemSubtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

            return (
              <div 
                key={order.id} 
                className="bg-white border border-slate-200/60 hover:border-emerald-500/10 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between"
              >
                {/* Order Header info */}
                <div className="bg-slate-50/60 border-b border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-slate-800">#{formatOrderId(order.id)}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </span>
                    {order.ghnOrderCode && (
                      <>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          🚛 GHN: {order.ghnOrderCode}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-sm uppercase">
                      {order.paymentMethod === 'cod' ? 'Thanh toán COD' : 'Thanh toán ZeroPay'}
                    </span>
                  </div>
                </div>

                {/* Buyer / Shipping details */}
                <div className="px-5 py-3.5 bg-emerald-50/10 border-b border-slate-100/50 text-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium">Khách hàng nhận:</p>
                    <p className="font-bold text-slate-700">{order.buyerName} ({order.buyerPhone})</p>
                    <p className="text-[11px] text-slate-500">{order.buyerEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium">Địa chỉ giao hàng:</p>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{order.shippingAddress}</p>
                  </div>
                </div>

                {/* Items details */}
                <div className="divide-y divide-slate-100/60 px-5">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-3.5 flex items-start gap-3.5">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-14 h-14 object-cover rounded-xl border border-slate-100 shrink-0" 
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">{item.name}</h4>
                        {item.variant && item.variant.trim() !== '' && item.variant !== 'Mặc định' && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Default' && (
                          <p className="text-[10px] text-slate-400 font-semibold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md inline-block">
                            Phân loại hàng: {item.variant}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 font-medium">x{item.quantity}</span>
                          <span className="font-bold text-slate-700">{formatVND(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refund info details & proof images gallery if present */}
                {(order.refundReason || order.refundDescription || order.refundEmail) && (
                  <div className="px-5 py-4 bg-rose-50/20 border-t border-slate-100 text-xs space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-[#ee4d2d] font-extrabold flex items-center gap-1.5">
                        <span>⚠️ Thông tin Trả hàng/Hoàn tiền từ Người Mua:</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold">
                        Bấm vào ảnh để xem phóng to
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3.5 rounded-2xl border border-rose-100 shadow-3xs">
                      <div className="space-y-1.5">
                        {order.refundReason && (
                          <p className="text-slate-800 font-bold">
                            <span className="text-slate-400 font-semibold">Lý do khiếu nại:</span> {order.refundReason}
                          </p>
                        )}
                        {order.refundDescription && (
                          <p className="text-slate-650 leading-relaxed text-[11px]">
                            <span className="text-slate-400 font-semibold">Mô tả chi tiết:</span> {order.refundDescription}
                          </p>
                        )}
                        {order.refundEmail && (
                          <p className="text-[11px] text-slate-500">
                            <span className="text-slate-400 font-semibold">Email liên hệ:</span> {order.refundEmail}
                          </p>
                        )}
                      </div>

                      {/* Proof Images Gallery */}
                      <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                        <p className="text-[10px] uppercase font-extrabold text-slate-400">📷 Hình ảnh minh chứng sản phẩm lỗi</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(() => {
                            let images: string[] = []
                            if (order.refundProofImages) {
                              try { images = JSON.parse(order.refundProofImages) } catch (e) { images = [order.refundProofImages] }
                            }
                            if (images.length === 0 && order.items?.length) {
                              images = order.items.map(i => i.image)
                            }
                            return images.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                onClick={() => setPreviewImage(imgUrl)}
                                className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-3xs hover:border-emerald-500 transition"
                              >
                                <img src={imgUrl} alt={`bằng chứng ${imgIdx}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                                  🔍
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Footer & Actions */}
                <div className="bg-slate-50/20 border-t border-slate-100 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Financial summary */}
                  <div className="flex items-baseline gap-4 w-full sm:w-auto">
                    <div className="text-left">
                      <p className="text-[10px] text-slate-400 font-semibold">Doanh thu tạm tính (chưa ship)</p>
                      <p className="text-sm font-black text-emerald-600 mt-0.5">{formatVND(itemSubtotal)}</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                    {order.status === 'PROCESSING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                        disabled={updatingOrderId !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs hover:shadow-md transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {updatingOrderId === order.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>🚚</span>
                        )}
                        Xác nhận & Giao hàng
                      </button>
                    )}

                    {order.status === 'SHIPPING' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        disabled={updatingOrderId !== null}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-300/30 font-bold px-4 py-2 rounded-xl text-xs shadow-xs hover:shadow-md transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {updatingOrderId === order.id ? (
                          <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <span>✅</span>
                        )}
                        Giao thành công (Test)
                      </button>
                    )}

                    {order.status === 'REFUND_PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRefund(order)}
                          disabled={updatingOrderId !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
                        >
                          Đồng ý hoàn tiền ngay
                        </button>
                        <button
                          onClick={() => handleRequestReturn(order)}
                          disabled={updatingOrderId !== null}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
                        >
                          Yêu cầu trả hàng
                        </button>
                        <button
                          onClick={() => handleDisputeRefund(order)}
                          disabled={updatingOrderId !== null}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
                        >
                          Khiếu nại / Từ chối
                        </button>
                      </div>
                    )}

                    {order.status === 'RETURN_SHIPPED' && (
                      <button
                        onClick={() => handleApproveRefund(order)}
                        disabled={updatingOrderId !== null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs hover:shadow-md transition duration-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span>✅</span> Đã nhận hàng trả & Đồng ý hoàn tiền
                      </button>
                    )}

                    {order.status === 'REFUNDED' && (
                      <span className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                        <span>🔄</span> Đã hoàn tiền cho khách
                      </span>
                    )}

                    {order.status === 'PENDING_PAYMENT' && (
                      <span className="text-[11px] text-slate-400 font-bold italic">
                        Đang chờ khách thanh toán qua cổng online...
                      </span>
                    )}

                    {order.status === 'COMPLETED' && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <span>🎉</span> Đơn hàng đã hoàn tất
                      </span>
                    )}

                    {order.status === 'CANCELLED' && (
                      <span className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                        <span>🚫</span> Đơn hàng đã hủy
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 cursor-pointer transition"
            >
              ✕
            </button>
            <img src={previewImage} alt="Hình ảnh bằng chứng phóng to" className="max-h-[80vh] w-auto object-contain p-2" />
            <div className="p-3 bg-slate-900 w-full text-center text-xs text-slate-300 font-bold border-t border-slate-800">
              📷 Hình ảnh minh chứng sản phẩm từ phía Người Mua
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
