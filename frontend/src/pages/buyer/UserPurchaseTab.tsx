import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { orderService } from '../../services/order.service'
import type { Order } from '../../models/order.model'
import { SepayPaymentModal } from '../../components/buyer/SepayPaymentModal'
import { ReviewModal } from '../../components/buyer/ReviewModal'
import type { ReviewSubmitData } from '../../components/buyer/ReviewModal'
import { BuyerOrderDetail } from '../../components/buyer/BuyerOrderDetail'
import { ReturnRequestModal } from '../../components/buyer/ReturnRequestModal'
import {
  mapStatusToTab,
  getShopeeTypeNumber
} from '../../components/buyer/purchase/types'
import { PurchaseStatusTabs } from '../../components/buyer/purchase/PurchaseStatusTabs'
import { PurchaseOrderCard } from '../../components/buyer/purchase/PurchaseOrderCard'
import { PurchaseCancelModal } from '../../components/buyer/purchase/PurchaseCancelModal'
import { PurchaseTrackingModal } from '../../components/buyer/purchase/PurchaseTrackingModal'
import { PurchaseOrderDetailModal } from '../../components/buyer/purchase/PurchaseOrderDetailModal'

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
  const [shopsInfo, setShopsInfo] = useState<{ [key: string]: string }>({})

  // Modals state
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<Order | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null)

  // Re-pay Sepay state
  const [rePayOrder, setRePayOrder] = useState<Order | null>(null)
  const [rePayQrUrl, setRePayQrUrl] = useState('')
  const [rePayMemo, setRePayMemo] = useState('')
  const [rePayBankInfo, setRePayBankInfo] = useState<any>(null)
  const [showRePayModal, setShowRePayModal] = useState(false)

  // Rated orders local persistence
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

  // Sync routeOrderId with selectedOrderForDetail
  useEffect(() => {
    if (routeOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === routeOrderId)
      if (found) {
        setSelectedOrderForDetail(found)
      } else {
        orderService.fetchOrderById(routeOrderId).then(o => {
          if (o) setSelectedOrderForDetail(o)
        }).catch(() => {})
      }
    } else if (!routeOrderId) {
      setSelectedOrderForDetail(null)
    }
  }, [routeOrderId, orders])

  // Fetch shop names
  useEffect(() => {
    const fetchShopNames = async () => {
      const uniqueShopIds = Array.from(new Set(orders.flatMap(o => o.items.map((i: any) => i.shopId)).filter(Boolean)))
      for (const shopId of uniqueShopIds) {
        if (shopId && !shopsInfo[shopId]) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/shops/${shopId}`)
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

  // Polling re-pay status
  useEffect(() => {
    let intervalId: any
    if (showRePayModal && rePayOrder) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/payments/status/${rePayOrder.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'SUCCESS') {
              clearInterval(intervalId)
              setShowRePayModal(false)
              setRePayOrder(null)
              fetchOrders()
            }
          }
        } catch (e) { console.error(e) }
      }, 3000)
    }
    return () => { if (intervalId) clearInterval(intervalId) }
  }, [showRePayModal, rePayOrder])

  // Action Handlers
  const handleOpenTrackingModal = async (orderId: string) => {
    setTrackingLoading(true)
    setShowTrackingModal(true)
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/tracking/${orderId}`)
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

  const handleRePaySepay = async (order: Order) => {
    try {
      const configRes = await fetch(`${API_BASE_URL}/payments/sepay-config`)
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

  const handleCancelOrderSubmit = async (order: Order, reason: string) => {
    setIsCancelling(true)
    try {
      await orderService.updateOrderStatus(
        order.id,
        'CANCELLED',
        undefined,
        undefined,
        reason,
        `Người mua hủy đơn: ${reason}`
      )
      alert('Đã hủy đơn hàng thành công! ' + (order.paymentMethod === 'zeropay' || order.status === 'PROCESSING' ? 'Tiền đã được hoàn về Ví ZeroPay của bạn.' : ''))
      setShowCancelModal(false)
      setSelectedOrderForCancel(null)
      fetchOrders()
    } catch (err: any) {
      alert('Lỗi khi hủy đơn hàng: ' + err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleReviewSubmit = async (data: ReviewSubmitData) => {
    if (!selectedOrderForReview) return
    const order = selectedOrderForReview
    const allMediaUrls = [...data.images, ...data.videos]

    for (const item of order.items) {
      await fetch(`${API_BASE_URL}/products/${item.productId}/reviews`, {
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

    await fetch(`${API_BASE_URL}/payments/escrow/${order.id}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

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

  const handleConfirmReceived = async (order: Order, isCompleted = true) => {
    const targetStatus = isCompleted ? 'COMPLETED' : 'DELIVERED'
    const confirmMsg = isCompleted
      ? 'Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn từ Shop?'
      : 'Bạn xác nhận đã nhận được hàng đầy đủ và nguyên vẹn?'

    if (window.confirm(confirmMsg)) {
      try {
        await orderService.updateOrderStatus(order.id, targetStatus)
        alert(isCompleted ? 'Cảm ơn bạn đã xác nhận! Đơn hàng đã hoàn tất. Vui lòng đánh giá sản phẩm.' : 'Cảm ơn bạn đã xác nhận! Đơn hàng đã chuyển sang trạng thái Đã Giao.')
        fetchOrders()
        if (selectedOrderForDetail?.id === order.id) {
          setSelectedOrderForDetail({ ...selectedOrderForDetail, status: targetStatus })
        }
      } catch (err: any) {
        alert('Lỗi khi xác nhận nhận hàng: ' + err.message)
      }
    }
  }

  const handleConfirmReturnShipped = async (order: Order) => {
    if (window.confirm('Bạn xác nhận đã đóng gói và gửi hàng trả lại cho Shop?')) {
      try {
        await orderService.updateOrderStatus(order.id, 'RETURN_SHIPPED')
        alert('Xác nhận đã gửi trả hàng thành công!')
        fetchOrders()
      } catch (err: any) {
        alert('Lỗi: ' + err.message)
      }
    }
  }

  // Filter orders
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

  // Detail View Mode
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
          onCancelOrder={(order) => {
            setSelectedOrderForCancel(order)
            setShowCancelModal(true)
          }}
          onRePaySepay={(order) => handleRePaySepay(order)}
          onConfirmReceived={(order) => handleConfirmReceived(order, true)}
          onOpenRefund={(order) => {
            setSelectedOrderForReturn(order)
            setShowReturnModal(true)
          }}
          isRated={ratedOrders.has(selectedOrderForDetail.id)}
          shopName={shopName}
        />

        {/* Reusable Modals */}
        {selectedOrderForReview && (
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            order={selectedOrderForReview}
            onSubmit={handleReviewSubmit}
            user={user}
          />
        )}

        <PurchaseCancelModal
          isOpen={showCancelModal}
          order={selectedOrderForCancel}
          onClose={() => {
            setShowCancelModal(false)
            setSelectedOrderForCancel(null)
          }}
          onSubmit={handleCancelOrderSubmit}
          isCancelling={isCancelling}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4 text-left selection:bg-[#ee4d2d] selection:text-white">
        <PurchaseStatusTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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
              <PurchaseOrderCard
                key={order.id}
                order={order}
                shopsInfo={shopsInfo}
                isRated={ratedOrders.has(order.id)}
                onViewDetail={(o) => {
                  setSelectedOrderForDetail(o)
                  navigate(`/user/purchase/order/${o.id}?type=${getShopeeTypeNumber(o.status)}`)
                }}
                onOpenTracking={handleOpenTrackingModal}
                onOpenCancel={(o) => {
                  setSelectedOrderForCancel(o)
                  setShowCancelModal(true)
                }}
                onRePaySepay={handleRePaySepay}
                onConfirmReceived={handleConfirmReceived}
                onOpenReview={(o) => {
                  setSelectedOrderForReview(o)
                  setShowReviewModal(true)
                }}
                onRequestRefund={(o) => {
                  setSelectedOrderForReturn(o)
                  setShowReturnModal(true)
                }}
                onOpenSimpleDetail={setSelectedOrderDetail}
                onConfirmReturnShipped={handleConfirmReturnShipped}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals Container */}
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

      {showReturnModal && selectedOrderForReturn && (
        <ReturnRequestModal
          order={selectedOrderForReturn}
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false)
            setSelectedOrderForReturn(null)
          }}
          onSuccess={fetchOrders}
        />
      )}

      <PurchaseOrderDetailModal
        order={selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
      />

      <PurchaseCancelModal
        isOpen={showCancelModal}
        order={selectedOrderForCancel}
        onClose={() => {
          setShowCancelModal(false)
          setSelectedOrderForCancel(null)
        }}
        onSubmit={handleCancelOrderSubmit}
        isCancelling={isCancelling}
      />

      <PurchaseTrackingModal
        isOpen={showTrackingModal}
        onClose={() => {
          setShowTrackingModal(false)
          setTrackingData(null)
        }}
        trackingData={trackingData}
        trackingLoading={trackingLoading}
      />
    </>
  )
}
