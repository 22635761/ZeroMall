import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { orderService } from '../../services/order.service'
import type { Order } from '../../models/order.model'
import { SepayPaymentModal } from '../../components/buyer/SepayPaymentModal'
import { ReviewModal } from '../../components/buyer/ReviewModal'
import type { ReviewSubmitData } from '../../components/buyer/ReviewModal'
import { LiveMapTracking } from '../../components/delivery/LiveMapTracking'
import { BuyerOrderDetail } from '../../components/buyer/BuyerOrderDetail'

interface UserPurchaseTabProps {
  user: any
}

export const UserPurchaseTab: React.FC<UserPurchaseTabProps> = ({ user }) => {
  const { orderId: routeOrderId } = useParams<{ orderId?: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('type') || 'ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null)

  // Sync routeOrderId with selectedOrderForDetail
  useEffect(() => {
    if (routeOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === routeOrderId)
      if (found) {
        setSelectedOrderForDetail(found)
      } else {
        // Fetch single order if not in list
        orderService.fetchOrderById(routeOrderId).then(o => {
          if (o) setSelectedOrderForDetail(o)
        }).catch(() => {})
      }
    } else if (!routeOrderId) {
      setSelectedOrderForDetail(null)
    }
  }, [routeOrderId, orders])

  // Refund wizard states
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null)
  const [showRefundWizard, setShowRefundWizard] = useState(false)
  const [refundOption, setRefundOption] = useState<'OPTION_1' | 'OPTION_2'>('OPTION_1')
  const [refundReason, setRefundReason] = useState('')
  const [refundDesc, setRefundDesc] = useState('')
  const [refundEmail, setRefundEmail] = useState(user?.email || '')

  // Track rated orders in localStorage so state persists across page refresh
  const [ratedOrders, setRatedOrders] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('zeromall_rated_orders')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('zeromall_rated_orders', JSON.stringify(Array.from(ratedOrders)))
    } catch (e) { console.error(e) }
  }, [ratedOrders])

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null)

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('Muốn thay đổi địa chỉ nhận hàng')
  const [isCancelling, setIsCancelling] = useState(false)

  // Live Tracking modal state
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

  const handleOpenTrackingModal = async (orderId: string) => {
    setTrackingLoading(true)
    setShowTrackingModal(true)
    try {
      const res = await fetch(`http://localhost:8000/delivery/tracking/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setTrackingData(data)
      } else {
        setTrackingData(null)
      }
    } catch (e) {
      console.error('Error fetching live tracking:', e)
      setTrackingData(null)
    } finally {
      setTrackingLoading(false)
    }
  }

  // Detail modal state for refund / cancel orders
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null)

  const [shopsInfo, setShopsInfo] = useState<{ [key: string]: string }>({})

  const fetchOrders = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await orderService.fetchBuyerOrders(user.id)
      const now = Date.now()
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000

      const processedOrders = data.map((order: Order) => {
        if (order.status === 'DELIVERED') {
          const updatedTime = new Date(order.updatedAt || (order as any).createdAt).getTime()
          if (now - updatedTime >= twoDaysMs) {
            orderService.updateOrderStatus(order.id, 'COMPLETED').catch(() => {})
            return { ...order, status: 'COMPLETED' }
          }
        }
        return order
      })

      setOrders(processedOrders)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  useEffect(() => {
    const fetchShopNames = async () => {
      const uniqueShopIds = Array.from(new Set(orders.flatMap(o => o.items.map((i: any) => i.shopId)).filter(Boolean)))
      for (const shopId of uniqueShopIds) {
        if (shopId && !shopsInfo[shopId]) {
          try {
            const res = await fetch(`http://localhost:8000/auth/shops/${shopId}`)
            if (res.ok) {
              const data = await res.json()
              if (data.name) {
                setShopsInfo(prev => ({ ...prev, [shopId]: data.name }))
              }
            }
          } catch (e) { console.error(e) }
        }
      }
    }
    if (orders.length > 0) {
      fetchShopNames()
    }
  }, [orders])

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

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'UNPAID':
        return 'CHỜ XÁC NHẬN'
      case 'PROCESSING':
      case 'PREPARING':
      case 'CONFIRMED':
      case 'AWAITING_SHIPMENT':
        return 'CHỜ LẤY HÀNG'
      case 'SHIPPED':
      case 'SHIPPING':
      case 'DELIVERING':
      case 'IN_TRANSIT':
        return 'CHỜ GIAO HÀNG'
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'ĐÃ GIAO'
      case 'CANCELLED':
      case 'CANCELED':
        return 'ĐÃ HỦY'
      case 'REFUND_PENDING':
        return 'TRẢ HÀNG (CHỜ DUYỆT)'
      case 'RETURN_PENDING':
        return 'TRẢ HÀNG (CHỜ TRẢ)'
      case 'RETURN_SHIPPED':
        return 'TRẢ HÀNG (ĐANG TRẢ)'
      case 'REFUND_DISPUTED':
        return 'TRẢ HÀNG (TRANH CHẤP)'
      case 'REFUNDED':
      case 'RETURNED':
        return 'TRẢ HÀNG (ĐÃ HOÀN TIỀN)'
      default:
        return status
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
      case 'UNPAID':
        return 'text-amber-600 font-extrabold'
      case 'PROCESSING':
      case 'PREPARING':
      case 'CONFIRMED':
        return 'text-blue-600 font-extrabold'
      case 'SHIPPED':
      case 'SHIPPING':
      case 'DELIVERING':
      case 'IN_TRANSIT':
        return 'text-purple-600 font-extrabold'
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SUCCESS':
        return 'text-emerald-600 font-extrabold'
      case 'CANCELLED':
      case 'CANCELED':
        return 'text-slate-400 font-semibold'
      default:
        return 'text-[#ee4d2d] font-bold'
    }
  }

  // Mở lại QR thanh toán cho đơn PENDING
  const [rePayOrder, setRePayOrder] = useState<Order | null>(null)
  const [rePayQrUrl, setRePayQrUrl] = useState('')
  const [rePayMemo, setRePayMemo] = useState('')
  const [rePayBankInfo, setRePayBankInfo] = useState<any>(null)
  const [showRePayModal, setShowRePayModal] = useState(false)

  // Polling trạng thái thanh toán lại
  useEffect(() => {
    let intervalId: any
    if (showRePayModal && rePayOrder) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/payments/status/${rePayOrder.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'SUCCESS') {
              clearInterval(intervalId)
              setShowRePayModal(false)
              setRePayOrder(null)
              fetchOrders() // reload danh sách đơn
            }
          }
        } catch (e) { console.error(e) }
      }, 3000)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [showRePayModal, rePayOrder])

  const handleRePaySepay = async (order: Order) => {
    try {
      const configRes = await fetch('http://localhost:8000/payments/sepay-config')
      if (!configRes.ok) throw new Error('Không lấy được config')
      const config = await configRes.json()
      const memo = `ZM${order.id.substring(0, 8).toUpperCase()}`
      const qr = `https://img.vietqr.io/image/${config.bankId}-${config.bankAcc}-compact2.jpg?amount=${order.totalAmount}&addInfo=${memo}&accountName=${encodeURIComponent(config.bankName)}`
      setRePayMemo(memo)
      setRePayQrUrl(qr)
      setRePayBankInfo(config)
      setRePayOrder(order)
      setShowRePayModal(true)
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    }
  }

  const handleRequestRefundClick = (order: Order) => {
    setSelectedOrderForRefund(order)
    setShowRefundModal(true)
  }

  const handleOpenCancelModal = (order: Order) => {
    setSelectedOrderForCancel(order)
    setCancelReason('Muốn thay đổi địa chỉ nhận hàng')
    setShowCancelModal(true)
  }

  const handleCancelOrderSubmit = async () => {
    if (!selectedOrderForCancel) return
    setIsCancelling(true)
    try {
      await orderService.updateOrderStatus(
        selectedOrderForCancel.id,
        'CANCELLED',
        undefined,
        undefined,
        cancelReason,
        `Người mua hủy đơn: ${cancelReason}`
      )
      alert('Đã hủy đơn hàng thành công! ' + (selectedOrderForCancel.paymentMethod === 'zeropay' || selectedOrderForCancel.status === 'PROCESSING' ? 'Tiền đã được hoàn về Ví ZeroPay của bạn.' : ''))
      setShowCancelModal(false)
      setSelectedOrderForCancel(null)
      fetchOrders()
    } catch (err: any) {
      alert('Lỗi khi hủy đơn hàng: ' + err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleOpenReviewModal = (order: Order) => {
    setSelectedOrderForReview(order)
    setShowReviewModal(true)
  }

  const handleReviewSubmit = async (data: ReviewSubmitData) => {
    if (!selectedOrderForReview) return
    const order = selectedOrderForReview
    const allMediaUrls = [...data.images, ...data.videos]

    // Gửi đánh giá sản phẩm lên database qua API
    for (const item of order.items) {
      await fetch(`http://localhost:8000/products/${item.productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.name || 'Khách hàng',
          rating: data.rating,
          comment: data.comment,
          variant: item.variant || 'Tiêu chuẩn',
          images: allMediaUrls.length > 0 ? JSON.stringify(allMediaUrls) : undefined,
          orderId: order.id
        })
      })
    }

    // Giải ngân Escrow sớm cho Shop & Ví Sàn thu chiết khấu vì khách đã đánh giá
    await fetch(`http://localhost:8000/payments/escrow/${order.id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    // Đổi trạng thái đơn hàng thành COMPLETED (Hoàn tất)
    try {
      await orderService.updateOrderStatus(order.id, 'COMPLETED')
    } catch (e) {
      console.error('Error updating order to COMPLETED:', e)
    }

    setRatedOrders(prev => new Set([...prev, order.id]))
    setShowReviewModal(false)
    setSelectedOrderForReview(null)
    alert('Đã gửi đánh giá thành công! Tiền hàng đã được giải ngân cho Shop và chiết khấu đã về Ví Sàn.')
    fetchOrders()
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

  // Filter orders based on status tab and search query
  const filteredOrders = orders.filter(order => {
    const tabMatch = activeTab === 'ALL' || mapStatusToTab(order.status) === activeTab
    
    if (!tabMatch) return false
    
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const idMatch = order.id.toLowerCase().includes(query)
    const itemMatch = order.items.some((item: any) => 
      (item.name || item.productName || '').toLowerCase().includes(query) || 
      (item.variant && item.variant.toLowerCase().includes(query))
    )
    
    return idMatch || itemMatch
  })

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  const handleConfirmReceived = async (order: Order) => {
    if (window.confirm('Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn từ Shop?')) {
      try {
        await orderService.updateOrderStatus(order.id, 'COMPLETED')
        alert('Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn tất. Vui lòng đánh giá sản phẩm.')
        fetchOrders()
        if (selectedOrderForDetail?.id === order.id) {
          setSelectedOrderForDetail({ ...selectedOrderForDetail, status: 'COMPLETED' })
        }
      } catch (err: any) {
        alert('Lỗi khi xác nhận nhận hàng: ' + err.message)
      }
    }
  }

  const handleOpenRefund = (order: Order) => {
    handleRequestRefundClick(order)
  }

  const getShopeeTypeNumber = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return '1'
      case 'PROCESSING':
      case 'PREPARING':
        return '2'
      case 'SHIPPING':
      case 'IN_TRANSIT':
      case 'DELIVERING':
        return '3'
      case 'DELIVERED':
        return '4'
      case 'COMPLETED':
        return '6'
      case 'CANCELLED':
        return '7'
      case 'REFUND_PENDING':
      case 'RETURN_PENDING':
      case 'RETURN_SHIPPED':
      case 'REFUNDED':
        return '8'
      default:
        return '6'
    }
  }

  if (selectedOrderForDetail) {
    const firstItem = selectedOrderForDetail.items?.[0]
    const targetShopId = firstItem?.shopId || 'zeromall-official'
    const shopName = shopsInfo[targetShopId] || (firstItem as any)?.shopName || 'ZeroMall Official Store'

    return (
      <>
        <BuyerOrderDetail
          order={selectedOrderForDetail}
          onBack={() => {
            setSelectedOrderForDetail(null)
            navigate('/user/purchase')
          }}
          onOpenReview={(order) => {
            setSelectedOrderForReview(order)
            setShowReviewModal(true)
          }}
          onCancelOrder={(order) => handleOpenCancelModal(order)}
          onRePaySepay={(order) => handleRePaySepay(order)}
          onConfirmReceived={(order) => handleConfirmReceived(order)}
          onOpenRefund={(order) => handleOpenRefund(order)}
          isRated={ratedOrders.has(selectedOrderForDetail.id)}
          shopName={shopName}
        />

        {/* Review Modal */}
        {selectedOrderForReview && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            order={selectedOrderForReview}
            onSubmit={handleReviewSubmit}
            user={user}
          />
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedOrderForCancel && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl overflow-hidden text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <h3 className="font-black text-slate-900">Xác Nhận Hủy Đơn Hàng</h3>
                </div>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Bạn có chắc chắn muốn hủy đơn hàng <strong>#{selectedOrderForCancel.id}</strong>?
                </p>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Lý do hủy đơn:</label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="Muốn thay đổi địa chỉ nhận hàng">Muốn thay đổi địa chỉ nhận hàng</option>
                    <option value="Muốn thay đổi mã giảm giá/voucher">Muốn thay đổi mã giảm giá/voucher</option>
                    <option value="Muốn đổi phương thức thanh toán">Muốn đổi phương thức thanh toán</option>
                    <option value="Đổi ý không muốn mua nữa">Đổi ý không muốn mua nữa</option>
                    <option value="Tìm thấy giá rẻ hơn ở nơi khác">Tìm thấy giá rẻ hơn ở nơi khác</option>
                    <option value="Khác">Lý do khác</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCancelOrderSubmit}
                  disabled={isCancelling}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isCancelling ? 'Đang xử lý...' : 'Xác Nhận Hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
    <div className="space-y-4 text-left selection:bg-[#ee4d2d] selection:text-white">
      
      {/* Purchase Status Tab Menu Header */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-700 bg-white">
        {[
          { label: 'Tất cả', id: 'ALL' },
          { label: 'Chờ xác nhận', id: 'PENDING_CONFIRMATION' },
          { label: 'Chờ lấy hàng', id: 'PROCESSING' },
          { label: 'Chờ giao hàng', id: 'SHIPPED' },
          { label: 'Đã giao', id: 'DELIVERED' },
          { label: 'Trả hàng', id: 'REFUND' },
          { label: 'Đã hủy', id: 'CANCELLED' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === tab.id 
                ? 'border-[#ee4d2d] text-[#ee4d2d]' 
                : 'border-transparent hover:text-[#ee4d2d] cursor-pointer'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input Filter */}
      <div className="bg-slate-100/60 p-2.5 flex items-center rounded-sm">
        <span className="text-slate-400 text-sm px-2">🔍</span>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Bạn có thể tìm kiếm theo ID đơn hàng hoặc Tên sản phẩm"
          className="flex-1 bg-transparent text-xs text-slate-700 focus:outline-none placeholder-slate-400/80"
        />
      </div>

      {/* Main orders list container */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#ee4d2d] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Đang tải lịch sử đơn mua...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-24 bg-white text-center rounded-sm border border-slate-150 space-y-4">
          <span className="text-5xl block">📭</span>
          <p className="text-xs text-slate-500 font-medium">Chưa có đơn hàng nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white border border-slate-200/65 rounded-sm p-4 sm:p-5 shadow-3xs space-y-4">
              
              {(() => {
                const firstItem = order.items?.[0];
                const targetShopId = firstItem?.shopId || 'zeromall-official';
                const fetchedShopName = shopsInfo[targetShopId];
                const itemShopName = (firstItem as any)?.shopName;
                const shopName = fetchedShopName || (itemShopName && !itemShopName.includes('-') ? itemShopName : (targetShopId.startsWith('Shop') ? targetShopId : `Shop ${targetShopId.substring(0, 8)}`));

                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-[#ee4d2d] text-white px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider">Yêu thích</span>
                      <span className="font-bold text-slate-800">{shopName}</span>
                      
                      {/* Hiển thị Mã Đơn Hàng rõ ràng */}
                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Mã đơn: #{order.id}
                      </span>

                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('open_chat_with_shop', {
                              detail: { shopId: targetShopId, shopName: shopName },
                            })
                          );
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
                        onClick={() => handleOpenTrackingModal(order.id)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🚚</span> Tra Cứu Vận Chuyển ZMX
                      </button>
                      <div className={`font-bold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Order Items List - Bấm vào xem chi tiết đơn hàng */}
              <div 
                onClick={() => {
                  setSelectedOrderForDetail(order)
                  navigate(`/user/purchase/order/${order.id}?type=${getShopeeTypeNumber(order.status)}`)
                }}
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
                      <h4 className="font-semibold text-slate-800 line-clamp-1 hover:text-[#ee4d2d] transition">{item.name || item.productName}</h4>
                      {item.variant && item.variant.trim() !== '' && item.variant !== 'Mặc định' && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Default' && (
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

              {/* Order total amount summary and actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                
                {/* Total section (right aligned in shopee, but space-between looks neat on mobile too) */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-slate-500">Thành tiền:</span>
                  <span className="text-base font-extrabold text-[#ee4d2d]">{formatMoney(order.totalAmount)}</span>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="flex justify-end gap-2 pt-2">
                {/* 1. CHỜ THANH TOÁN (PENDING Sepay) & CHỜ XÁC NHẬN (PENDING) & CHỜ LẤY HÀNG (PROCESSING) -> Khách được hủy đơn */}
                {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT' || order.status === 'PROCESSING' || order.status === 'PREPARING' || order.status === 'CONFIRMED') && (
                  <>
                    <button
                      onClick={() => handleOpenCancelModal(order)}
                      className="px-4 py-2 border border-slate-300 hover:border-rose-400 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-sm font-semibold transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      ❌ Hủy Đơn Hàng
                    </button>

                    {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT') && order.paymentMethod === 'sepay' && (
                      <button
                        onClick={() => handleRePaySepay(order)}
                        className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                      >
                        📲 Thanh toán ngay
                      </button>
                    )}
                  </>
                )}

                {/* 2. ĐÃ GIAO (DELIVERED) — người bán đã báo giao thành công */}
                {order.status === 'DELIVERED' && (
                  <>
                    {!ratedOrders.has(order.id) && (
                      <button
                        onClick={async () => {
                          if (window.confirm('Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn từ Shop?')) {
                            try {
                              await orderService.updateOrderStatus(order.id, 'COMPLETED')
                              alert('Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn tất. Vui lòng đánh giá sản phẩm.')
                              fetchOrders()
                            } catch (err: any) {
                              alert('Lỗi khi xác nhận nhận hàng: ' + err.message)
                            }
                          }
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                      >
                        ✅ Đã nhận được hàng
                      </button>
                    )}

                    {!ratedOrders.has(order.id) && (
                      <button
                        onClick={() => handleOpenReviewModal(order)}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                        title="Đánh giá ngay để chia sẻ trải nghiệm mua hàng!"
                      >
                        ⭐ Đánh giá sản phẩm
                      </button>
                    )}

                    <button
                      onClick={() => handleRequestRefundClick(order)}
                      className="px-4 py-2 border border-rose-200 hover:border-rose-450 hover:bg-rose-50 text-rose-600 rounded-sm font-semibold transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      🔄 Yêu cầu Trả hàng/Hoàn tiền
                    </button>
                  </>
                )}

                {/* 2b. HOÀN TẤT (COMPLETED) hoặc DELIVERED+rated */}
                {(order.status === 'COMPLETED' || (order.status === 'DELIVERED' && ratedOrders.has(order.id))) && (
                  <>
                    {!ratedOrders.has(order.id) && (
                      <button
                        onClick={() => handleOpenReviewModal(order)}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                      >
                        ⭐ Đánh giá sản phẩm
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      Mua lại
                    </button>
                  </>
                )}

                {/* 3. ĐANG GIAO HÀNG (SHIPPED / SHIPPING / DELIVERING / IN_TRANSIT) */}
                {(order.status === 'SHIPPED' || order.status === 'SHIPPING' || order.status === 'DELIVERING' || order.status === 'IN_TRANSIT') && (
                  <>
                    <button
                      onClick={() => handleOpenTrackingModal(order.id)}
                      className="px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-700 font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px] flex items-center gap-1"
                    >
                      🚚 Xem Hành Trình (ZMX)
                    </button>

                    <button
                      onClick={async () => {
                        if (window.confirm('Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn?')) {
                          try {
                            await orderService.updateOrderStatus(order.id, 'DELIVERED')
                            alert('Cảm ơn bạn đã xác nhận! Đơn hàng đã chuyển sang trạng thái Đã Giao.')
                            fetchOrders()
                          } catch (err: any) {
                            alert('Lỗi khi xác nhận nhận hàng: ' + err.message)
                          }
                        }
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      ✅ Đã nhận được hàng
                    </button>
                  </>
                )}

                {/* 4. TRẢ HÀNG (REFUND_PENDING, RETURN_PENDING, RETURN_SHIPPED, REFUND_DISPUTED, REFUNDED, RETURNED) -> Chỉ hiện Xem chi tiết */}
                {(order.status === 'REFUND_PENDING' || order.status === 'RETURN_PENDING' || order.status === 'RETURN_SHIPPED' || order.status === 'REFUND_DISPUTED' || order.status === 'REFUNDED' || order.status === 'RETURNED') && (
                  <>
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
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                      >
                        📦 Xác nhận Đã gửi trả hàng
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrderDetail(order)}
                      className="px-4 py-2 border border-slate-200 rounded-sm font-semibold hover:bg-slate-50 text-slate-700 transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      📄 Xem chi tiết
                    </button>
                  </>
                )}

                {/* 5. ĐÃ HỦY (CANCELLED, CANCELED) -> Chỉ hiện Xem chi tiết đơn hủy & Mua lại */}
                {(order.status === 'CANCELLED' || order.status === 'CANCELED') && (
                  <>
                    <button
                      onClick={() => setSelectedOrderDetail(order)}
                      className="px-4 py-2 border border-slate-200 rounded-sm font-semibold hover:bg-slate-50 text-slate-700 transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      📄 Xem chi tiết đơn hủy
                    </button>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                    >
                      Mua lại
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>

    {/* Re-Pay QR Modal cho đơn PENDING */}
    {showRePayModal && rePayOrder && rePayBankInfo && (
      <SepayPaymentModal
        isOpen={showRePayModal}
        onClose={() => {
          setShowRePayModal(false)
          setRePayOrder(null)
        }}
        bankInfo={rePayBankInfo}
        qrUrl={rePayQrUrl}
        memo={rePayMemo}
        amount={rePayOrder.totalAmount}
      />
    )}

    {/* Review Modal */}
    {showReviewModal && selectedOrderForReview && (
      <ReviewModal
        isOpen={showReviewModal}
        order={selectedOrderForReview}
        user={user}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedOrderForReview(null)
        }}
        onSubmit={handleReviewSubmit}
      />
    )}

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
                      {item.variant && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Mặc định' && (
                        <p className="text-[10px] text-slate-400 mt-1">Phân loại hàng: {item.variant}</p>
                      )}
                      <p className="font-medium text-slate-450 mt-0.5">Số lượng: x{item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-slate-700">{formatMoney(item.price * item.quantity)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Đơn giá: {formatMoney(item.price)}</p>
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
            <h3 className="font-extrabold text-sm text-slate-800 pb-2.5 border-b border-slate-100">Thông tin hoàn tiền</h3>
            
            <div className="text-xs space-y-4">
              <div className="flex justify-between items-baseline py-1">
                <span className="text-slate-450 font-semibold">Phương án:</span>
                <span className="font-bold text-slate-700">Hoàn tiền vào ví ZeroMall</span>
              </div>

              <div className="flex justify-between items-baseline py-1 border-t border-slate-50 pt-3">
                <span className="text-slate-450 font-semibold">Số tiền hoàn lại:</span>
                <span className="font-extrabold text-slate-800 text-sm">{formatMoney(selectedOrderForRefund.totalAmount)}</span>
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
                  Số tiền có thể hoàn lại: {formatMoney(selectedOrderForRefund.totalAmount)}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-slate-500 font-bold text-xs">Số tiền hoàn nhận được</span>
                  <span className="text-xl font-black text-[#ee4d2d]">{formatMoney(selectedOrderForRefund.totalAmount)}</span>
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

    {/* Modal: Xem Chi Tiết Đơn Hàng / Đơn Hủy / Đơn Trả Hàng */}
    {selectedOrderDetail && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-800 text-base">
                Chi Tiết Đơn Hàng #{selectedOrderDetail.id.slice(0, 12)}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Ngày đặt: {new Date(selectedOrderDetail.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          {/* Status info box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 uppercase text-[10px]">Trạng Thái:</span>
              <span className={`font-black ${getStatusColor(selectedOrderDetail.status)}`}>
                {getStatusText(selectedOrderDetail.status)}
              </span>
            </div>
            {(selectedOrderDetail.refundReason || (selectedOrderDetail as any).cancelReason || selectedOrderDetail.refundDescription) && (
              <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Lý do & Mô tả:</p>
                <p className="text-slate-700 font-medium text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                  {selectedOrderDetail.refundReason || (selectedOrderDetail as any).cancelReason || selectedOrderDetail.refundDescription || 'Không có mô tả chi tiết'}
                </p>
              </div>
            )}
          </div>

          {/* Items list */}
          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh Sách Sản Phẩm</p>
            {selectedOrderDetail.items.map((item: any) => (
              <div key={item.id} className="flex gap-3 text-xs border-b border-slate-100 pb-2.5">
                <img
                  src={item.image || item.productImage || 'https://placehold.co/100x100?text=No+Image'}
                  alt={item.name || item.productName}
                  className="w-12 h-12 object-cover border border-slate-200 rounded-lg shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 line-clamp-1">{item.name || item.productName}</h4>
                  <p className="text-[10px] text-slate-400">x{item.quantity} {item.variant ? `(${item.variant})` : ''}</p>
                </div>
                <div className="text-right font-extrabold text-slate-700">
                  {formatMoney(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Total */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Thành Tiền</p>
              <p className="text-lg font-black text-[#ee4d2d]">{formatMoney(selectedOrderDetail.totalAmount)}</p>
            </div>
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Modal Hủy Đơn Hàng Chuẩn Shopee */}
    {showCancelModal && selectedOrderForCancel && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>❌</span> Hủy Đơn Hàng #{selectedOrderForCancel.id.slice(0, 12)}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Vui lòng chọn lý do hủy đơn hàng của bạn
              </p>
            </div>
            <button
              onClick={() => { setShowCancelModal(false); setSelectedOrderForCancel(null); }}
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
              {selectedOrderForCancel.paymentMethod === 'zeropay' || (selectedOrderForCancel.paymentMethod === 'sepay' && selectedOrderForCancel.status === 'PROCESSING')
                ? '• Đơn hàng đã được thanh toán trực tuyến. Sau khi hủy, 100% số tiền sẽ được hoàn ngay lập tức về Ví ZeroPay của bạn.'
                : '• Đơn hàng thanh toán khi nhận hàng (COD) hoặc chưa thanh toán sẽ được hủy ngay lập tức.'}
              <br />• Các Voucher giảm giá đã dùng sẽ được tự động hoàn lại vào kho voucher của bạn.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-bold text-slate-700">Lý do hủy đơn:</label>
            {[
              'Muốn thay đổi địa chỉ nhận hàng',
              'Muốn thay đổi mã giảm giá / Voucher',
              'Muốn thay đổi sản phẩm trong đơn (kích cỡ, màu sắc, số lượng)',
              'Tìm thấy giá rẻ hơn ở nơi khác',
              'Đổi ý, không muốn mua nữa',
              'Lý do khác'
            ].map((reason) => (
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
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="accent-emerald-600 w-4 h-4"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              onClick={() => { setShowCancelModal(false); setSelectedOrderForCancel(null); }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Không Hủy Nữa
            </button>
            <button
              onClick={handleCancelOrderSubmit}
              disabled={isCancelling}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCancelling ? 'Đang xử lý...' : 'Xác Nhận Hủy Đơn'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Modal: Xem Hành Trình Vận Chuyển Realtime (Shopee Xpress Style) */}
    {showTrackingModal && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-4 p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>🚚</span> Thông Tin Vận Chuyển ZeroExpress (ZMX)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                {trackingData ? `Mã vận đơn: ${trackingData.trackingNumber}` : 'Đang tra cứu hệ thống ZMX...'}
              </p>
            </div>
            <button
              onClick={() => { setShowTrackingModal(false); setTrackingData(null); }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          {trackingLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-bold">Đang kết nối vệ tinh trạm bưu cục ZMX...</p>
            </div>
          ) : !trackingData ? (
            <div className="py-8 text-center space-y-2">
              <span className="text-3xl">📦</span>
              <p className="text-xs text-slate-600 font-bold">Người bán đang đóng gói kiện hàng</p>
              <p className="text-[11px] text-slate-400">Đơn vị vận chuyển ZMX đang điều phối tài xế đến lấy hàng.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 🗺️ BẢN ĐỒ HÀNH TRÌNH TƯƠNG TÁC GOONG MAP / OSM LIVE */}
              <LiveMapTracking
                trackingData={trackingData}
                goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
              />

              {/* Stepper Status Box */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-950">Trạng thái hiện tại:</span>
                  <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    {trackingData.status === 'CREATED' && 'Đang chuẩn bị hàng'}
                    {trackingData.status === 'WAITING_PICKUP' && 'Chờ Shipper đến lấy'}
                    {trackingData.status === 'PICKUP_ASSIGNED' && 'Shipper đang đến lấy'}
                    {trackingData.status === 'PICKED_UP' && 'Đã lấy hàng'}
                    {trackingData.status === 'AT_ORIGIN_HUB' && 'Tại Bưu cục gửi'}
                    {trackingData.status === 'SORTING' && 'Đang phân loại tại Kho SOC'}
                    {trackingData.status === 'IN_TRANSIT' && 'Xe tải đang trung chuyển'}
                    {trackingData.status === 'AT_DESTINATION_HUB' && 'Đã đến Bưu cục phát'}
                    {trackingData.status === 'OUT_FOR_DELIVERY' && 'Shipper đang giao tận nhà'}
                    {trackingData.status === 'DELIVERED' && 'Giao thành công'}
                    {trackingData.status === 'DELIVERY_FAILED' && 'Giao không thành công'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p>• <b>Đơn vị vận chuyển:</b> ZeroMall Express (ZMX Logistics)</p>
                  {trackingData.assignments && trackingData.assignments[0] && (
                    <p>• <b>Tài xế phụ trách:</b> {trackingData.assignments[0].driver?.name} (SĐT: {trackingData.assignments[0].driver?.phone} - Biển số: {trackingData.assignments[0].driver?.vehicleNumber})</p>
                  )}
                  {trackingData.currentHub && (
                    <p>• <b>Kho/Bưu cục hiện tại:</b> {trackingData.currentHub.name} ({trackingData.currentHub.province})</p>
                  )}
                </div>
              </div>

              {/* Vertical Milestones */}
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chi Tiết Lịch Sử Hành Trình</p>
                {trackingData.trackingLogs && trackingData.trackingLogs.map((log: any, idx: number) => (
                  <div key={log.id} className="flex gap-3 relative text-xs">
                    {idx !== trackingData.trackingLogs.length - 1 && (
                      <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200"></div>
                    )}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold z-10 ${
                      idx === 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {idx === 0 ? '●' : '○'}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className={`font-bold ${idx === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{log.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed font-normal">{log.description}</p>
                      {log.location && (
                        <p className="text-[10px] text-slate-400 font-medium">📍 {log.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => { setShowTrackingModal(false); setTrackingData(null); }}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>)
}
