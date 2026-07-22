import React, { useState, useEffect } from 'react'
import { orderService } from '../../services/order.service'
import type { Order } from '../../models/order.model'

interface UserPurchaseTabProps {
  user: any
}

export const UserPurchaseTab: React.FC<UserPurchaseTabProps> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ALL') // ALL, PENDING, SHIPPING, COMPLETED, CANCELLED
  const [searchQuery, setSearchQuery] = useState('')

  // Refund wizard states
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null)
  const [showRefundWizard, setShowRefundWizard] = useState(false)
  const [refundOption, setRefundOption] = useState<'OPTION_1' | 'OPTION_2'>('OPTION_1')
  const [refundReason, setRefundReason] = useState('')
  const [refundDesc, setRefundDesc] = useState('')
  const [refundEmail, setRefundEmail] = useState(user?.email || '')

  const fetchOrders = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const data = await orderService.fetchBuyerOrders(user.id)
      setOrders(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [user])

  const mapStatusToTab = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'PENDING'
      case 'PROCESSING':
      case 'SHIPPED':
        return 'SHIPPING'
      case 'DELIVERED':
      case 'COMPLETED':
        return 'COMPLETED'
      case 'REFUND_PENDING':
      case 'REFUNDED':
        return 'REFUND'
      case 'CANCELLED':
        return 'CANCELLED'
      default:
        return 'ALL'
    }
  }

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'CHỜ THANH TOÁN'
      case 'PROCESSING':
        return 'CHỜ CHUẨN BỊ HÀNG'
      case 'SHIPPED':
        return 'ĐANG GIAO HÀNG'
      case 'DELIVERED':
      case 'COMPLETED':
        return 'HOÀN THÀNH'
      case 'CANCELLED':
        return 'ĐÃ HỦY'
      case 'REFUND_PENDING':
        return 'TRẢ HÀNG/HOÀN TIỀN CHỜ DUYỆT'
      case 'RETURN_PENDING':
        return 'CHỜ TRẢ HÀNG'
      case 'RETURN_SHIPPED':
        return 'ĐANG TRẢ HÀNG'
      case 'REFUND_DISPUTED':
        return 'TRANH CHẤP KHIẾU NẠI'
      case 'REFUNDED':
        return 'ĐÃ HOÀN TIỀN'
      default:
        return status
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return 'text-amber-600'
      case 'PROCESSING':
        return 'text-blue-600'
      case 'SHIPPED':
        return 'text-purple-600'
      case 'DELIVERED':
      case 'COMPLETED':
        return 'text-emerald-600'
      case 'CANCELLED':
        return 'text-slate-400'
      case 'REFUND_PENDING':
        return 'text-orange-500 font-extrabold'
      case 'RETURN_PENDING':
        return 'text-yellow-600 font-extrabold'
      case 'RETURN_SHIPPED':
        return 'text-purple-600 font-extrabold'
      case 'REFUND_DISPUTED':
        return 'text-rose-600 font-extrabold'
      case 'REFUNDED':
        return 'text-rose-500 font-extrabold'
      default:
        return 'text-[#ee4d2d]'
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
      item.productName.toLowerCase().includes(query) || 
      (item.variant && item.variant.toLowerCase().includes(query))
    )
    
    return idMatch || itemMatch
  })

  // Format currency
  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  return (
    <>
    <div className="space-y-4 text-left selection:bg-[#ee4d2d] selection:text-white">
      
      {/* Purchase Status Tab Menu Header */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-700 bg-white">
        {[
          { label: 'Tất cả', id: 'ALL' },
          { label: 'Chờ thanh toán', id: 'PENDING' },
          { label: 'Vận chuyển', id: 'SHIPPING' },
          { label: 'Hoàn thành', id: 'COMPLETED' },
          { label: 'Trả hàng/Hoàn tiền', id: 'REFUND' },
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
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-[#ee4d2d] text-white px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider">Yêu thích</span>
                  <span className="font-bold text-slate-800">ZeroMall Official Store</span>
                  <button className="border border-slate-200 hover:bg-slate-50 text-[10px] px-2 py-0.5 rounded-sm text-slate-500 font-medium cursor-pointer transition">Chat</button>
                  <button className="border border-slate-200 hover:bg-slate-50 text-[10px] px-2 py-0.5 rounded-sm text-slate-500 font-medium cursor-pointer transition">Xem Shop</button>
                </div>
                <div className={`font-bold ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-3 text-xs">
                    <img 
                      src={item.productImage || 'https://placehold.co/100x100?text=No+Image'} 
                      alt={item.productName} 
                      className="w-[70px] h-[70px] border border-slate-200 rounded-sm object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-semibold text-slate-800 line-clamp-1">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400">Phân loại hàng: {item.variant || 'Tiêu chuẩn'}</p>
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
                {/* Nút Thanh toán ngay cho đơn PENDING Sepay */}
                {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT') && order.paymentMethod === 'sepay' && (
                  <button
                    onClick={() => handleRePaySepay(order)}
                    className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                  >
                    📲 Thanh toán ngay
                  </button>
                )}

                {/* Nút yêu cầu Trả hàng/Hoàn tiền (chỉ khi đã nhận hàng thành công) */}
                {(order.status === 'COMPLETED' || order.status === 'DELIVERED') && (
                  <button
                    onClick={() => handleRequestRefundClick(order)}
                    className="px-4 py-2 border border-rose-200 hover:border-rose-450 hover:bg-rose-50 text-rose-600 rounded-sm font-semibold transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                  >
                    🔄 Yêu cầu Trả hàng/Hoàn tiền
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
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                  >
                    📦 Xác nhận Đã gửi trả hàng
                  </button>
                )}
                <button
                  onClick={() => fetchOrders()}
                  className="px-4 py-2 border border-slate-200 rounded-sm font-semibold hover:bg-slate-50 text-slate-600 transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                >
                  Liên Hệ Người Bán
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm transition duration-150 cursor-pointer shadow-3xs text-[11px]"
                >
                  Mua Lại
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>

    {/* Re-Pay QR Modal cho đơn PENDING */}
    {showRePayModal && rePayOrder && rePayBankInfo && (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="bg-[#feeee9]/30 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📲</span>
              <span className="font-extrabold text-slate-800 text-sm">Thanh Toán Đơn Hàng</span>
            </div>
            <button
              onClick={() => { setShowRePayModal(false); setRePayOrder(null) }}
              className="text-slate-400 hover:text-slate-600 transition text-lg font-bold"
            >✕</button>
          </div>
          <div className="p-6 space-y-5 text-center">
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl w-fit mx-auto">
              <img src={rePayQrUrl} alt="VietQR" className="w-52 h-52 mx-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
              <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Hệ thống đang chờ chuyển khoản...</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 text-left space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Ngân hàng:</span><span className="font-bold">{rePayBankInfo.bankId}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Số tài khoản:</span><span className="font-bold">{rePayBankInfo.bankAcc}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Chủ tài khoản:</span><span className="font-bold uppercase">{rePayBankInfo.bankName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Số tiền:</span><span className="font-bold text-[#ee4d2d]">{rePayOrder.totalAmount.toLocaleString('vi-VN')}đ</span></div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nội dung CK:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">{rePayMemo}</span>
                  <button onClick={() => { navigator.clipboard.writeText(rePayMemo); alert('Copied!') }} className="text-sky-600 text-[10px] font-bold cursor-pointer">Copy</button>
                </div>
              </div>
            </div>
            <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-3 text-[10px] text-amber-700 text-left">
              ⚠️ Nhập đúng <strong>Nội dung chuyển khoản ({rePayMemo})</strong>. Hệ thống tự động xác nhận sau vài giây.
            </div>
          </div>
        </div>
      </div>
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
                      {item.variant && (
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
  </>)
}
