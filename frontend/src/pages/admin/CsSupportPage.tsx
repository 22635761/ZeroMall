import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

interface CsSupportPageProps {
  user: any
  onLogout: () => void
  onBackToHome: () => void
}

export const CsSupportPage: React.FC<CsSupportPageProps> = ({
  user,
  onLogout,
  onBackToHome
}) => {
  const [shops, setShops] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL') // 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [disputes, setDisputes] = useState<any[]>([])
  const [disputesLoading, setDisputesLoading] = useState(false)
  const [tickets, setTickets] = useState<any[]>([
    { id: 'TKT-101', category: 'ACCOUNT_ERROR', title: 'Lỗi khóa tài khoản nhầm', email: 'buyer@zeromall.vn', description: 'Tài khoản của tôi tự dưng báo bị khóa khi đang thanh toán ví.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'TKT-102', category: 'PAYMENT_ERROR', title: 'Đã quét mã Sepay nhưng không tự động xác nhận', email: 'buyer2@zeromall.vn', description: 'Tôi đã chuyển khoản thành công 120,000đ nhưng trạng thái đơn hàng vẫn báo Chờ thanh toán.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'TKT-103', category: 'VOUCHER_ERROR', title: 'Voucher GIAM50K báo không khả dụng', email: 'guest@zeromall.vn', description: 'Tôi áp dụng voucher giảm 50k của shop nhưng hệ thống báo lỗi không áp dụng được mặc dù đơn hàng trên 200k.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'TKT-104', category: 'SHIPPING_ERROR', title: 'Đơn hàng GHN giao quá 5 ngày chưa nhận được', email: 'hello@zeromall.vn', description: 'Đơn hàng mã GHN82736481 ghi đang giao nhưng 5 ngày rồi chưa cập nhật hành trình.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  ])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [allOrdersLoading, setAllOrdersLoading] = useState(false)
  const [orderSearchTerm, setOrderSearchTerm] = useState('')
  const [refundDestinations, setRefundDestinations] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [searchParams, setSearchParams] = useSearchParams()

  const getTabFromParam = (param: string | null): any => {
    if (!param) return null;
    switch (param.toLowerCase()) {
      case 'shops': return 'SHOPS';
      case 'withdrawals': return 'WITHDRAWALS';
      case 'disputes': return 'DISPUTES';
      case 'tickets': return 'TICKETS';
      case 'orders': return 'ORDERS';
      default: return null;
    }
  }

  const getParamFromTab = (tab: string): string => {
    switch (tab) {
      case 'SHOPS': return 'shops';
      case 'WITHDRAWALS': return 'withdrawals';
      case 'DISPUTES': return 'disputes';
      case 'TICKETS': return 'tickets';
      case 'ORDERS': return 'orders';
      default: return 'shops';
    }
  }

  const [activePortalTab, setActivePortalTab] = useState<
    'SHOPS' | 'WITHDRAWALS' | 'DISPUTES' | 'TICKETS' | 'ORDERS'
  >(() => {
    const searchParamsLocal = new URLSearchParams(window.location.search);
    const param = searchParamsLocal.get('tab');
    if (param) {
      const parsed = getTabFromParam(param);
      if (parsed) return parsed;
    }
    return 'SHOPS';
  })

  const triggerAuditLog = async (action: string) => {
    try {
      await fetch('http://localhost:8000/auth/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user?.email || 'Unknown CS', action })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const fetchShops = async () => {
    setLoading(true)
    try {
      const url = statusFilter === 'ALL' 
        ? `http://localhost:8000/auth/shops`
        : `http://localhost:8000/auth/shops?status=${statusFilter}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Không thể tải danh sách cửa hàng')
      const data = await response.json()
      setShops(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawals = async () => {
    setWithdrawLoading(true)
    try {
      const response = await fetch('http://localhost:8000/payments/withdraw')
      if (!response.ok) throw new Error('Không thể tải danh sách rút tiền')
      const data = await response.json()
      setWithdrawals(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setWithdrawLoading(false)
    }
  }

  const fetchDisputes = async () => {
    setDisputesLoading(true)
    try {
      const response = await fetch('http://localhost:8000/orders')
      if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng')
      const data = await response.json()
      // Lọc các đơn hàng ở trạng thái RETURN_DISPUTED hoặc RETURN_PENDING
      const disputedOrders = data.filter((o: any) => o.status === 'RETURN_DISPUTED' || o.status === 'RETURN_PENDING')
      setDisputes(disputedOrders)
    } catch (err: any) {
      console.error(err)
    } finally {
      setDisputesLoading(false)
    }
  }

  const handleAdminApproveDispute = async (order: any) => {
    const dest = refundDestinations[order.id] || 'WALLET';
    const destLabel = 
      dest === 'WALLET' ? 'Ví điện tử ZeroPay' :
      dest === 'BALANCE' ? 'Số dư tài khoản' :
      dest === 'ORIGINAL' ? 'Thanh toán ban đầu' : 'Chuyển khoản thủ công';

    if (!window.confirm(`Bạn phán quyết CHẤP NHẬN HOÀN TIỀN ${Number(order.totalAmount).toLocaleString('vi-VN')}đ cho Người mua?\nNguồn hoàn trả: ${destLabel}`)) return
    setActionLoadingId(order.id)
    try {
      // 1. Cập nhật status thành REFUNDED
      const updateRes = await fetch(`http://localhost:8000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REFUNDED' })
      })
      if (!updateRes.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng')

      // 2. Gọi thanh toán hoàn tiền ví/số dư/phương thức gốc cho Người mua
      const refundRes = await fetch('http://localhost:8000/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          buyerId: order.buyerId,
          amount: order.totalAmount,
          destination: dest
        })
      })
      if (!refundRes.ok) {
        console.error('Không thể hoàn tiền cho người mua')
      }

      await triggerAuditLog(`Chấp nhận hoàn tiền đơn hàng ${order.id} về [${destLabel}]`)
      alert(`Đã phán quyết hoàn tiền thành công về [${destLabel}] cho Người mua!`)
      fetchDisputes()
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleAdminRejectDispute = async (order: any) => {
    if (!window.confirm('Bạn từ chối yêu cầu của Người mua và phán quyết giải ngân tiền hàng cho Người bán?')) return
    setActionLoadingId(order.id)
    try {
      const updateRes = await fetch(`http://localhost:8000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      if (!updateRes.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng')

      await triggerAuditLog(`Từ chối yêu cầu trả hàng của đơn hàng ${order.id}. Giải ngân cho Người bán.`)
      alert('Đã bác bỏ khiếu nại! Tiền đơn hàng được giải ngân cho Người bán.')
      fetchDisputes()
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const fetchAllOrders = async () => {
    setAllOrdersLoading(true)
    try {
      const response = await fetch('http://localhost:8000/orders')
      if (!response.ok) throw new Error('Không thể tải danh sách đơn hàng')
      const data = await response.json()
      setAllOrders(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setAllOrdersLoading(false)
    }
  }

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
    alert(`Đã xử lý thành công ticket ${ticketId}! Trạng thái được cập nhật thành HOÀN THÀNH.`)
  }

  const handleApproveWithdrawal = async (reqId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(reqId)
    try {
      const response = await fetch(`http://localhost:8000/payments/withdraw/${reqId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái yêu cầu rút tiền')
      
      await fetchWithdrawals()
      alert(action === 'APPROVED' ? 'Đã duyệt yêu cầu rút tiền thành công!' : 'Đã từ chối yêu cầu rút tiền.')
    } catch (err: any) {
      alert(`Lỗi khi xử lý: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleApprove = async (shopId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(shopId)
    try {
      const response = await fetch(`http://localhost:8000/auth/shops/${shopId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })

      if (!response.ok) throw new Error('Không thể cập nhật trạng thái cửa hàng')
      await fetchShops()
      alert(action === 'APPROVED' ? 'Đã phê duyệt shop hoạt động!' : 'Đã từ chối đơn đăng ký shop.')
    } catch (err: any) {
      alert(`Lỗi khi xử lý: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  useEffect(() => {
    if (activePortalTab === 'SHOPS') {
      fetchShops()
    } else if (activePortalTab === 'WITHDRAWALS') {
      fetchWithdrawals()
    } else if (activePortalTab === 'DISPUTES') {
      fetchDisputes()
    } else if (activePortalTab === 'ORDERS') {
      fetchAllOrders()
    }
  }, [statusFilter, activePortalTab])

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      const parsed = getTabFromParam(tabParam)
      if (parsed) {
        setActivePortalTab(parsed)
      }
    }
  }, [searchParams])

  useEffect(() => {
    setSearchParams({ tab: getParamFromTab(activePortalTab) }, { replace: true })
  }, [activePortalTab, setSearchParams])

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.email && shop.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredOrders = allOrders.filter(o => 
    o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    o.buyerId.toLowerCase().includes(orderSearchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans text-left selection:bg-emerald-600 selection:text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 bg-white">
            <span className="text-2xl">🎧</span>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-0.5">
                Support & CSKH
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">CSKH & HỖ TRỢ</p>
            
            <button
              onClick={() => setActivePortalTab('SHOPS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'SHOPS' ? 'bg-emerald-50 text-emerald-660' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🏪</span>
              <span>Duyệt Đăng Ký Shop</span>
            </button>

            <button
              onClick={() => setActivePortalTab('WITHDRAWALS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'WITHDRAWALS' ? 'bg-emerald-50 text-emerald-660' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">💰</span>
              <span>Phê Duyệt Rút Tiền</span>
            </button>

            <button
              onClick={() => setActivePortalTab('DISPUTES')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'DISPUTES' ? 'bg-emerald-50 text-emerald-660' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">⚖️</span>
              <span>Tranh Chấp Khiếu Nại</span>
            </button>

            <button
              onClick={() => setActivePortalTab('TICKETS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'TICKETS' ? 'bg-emerald-50 text-emerald-660' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🎫</span>
              <span>Ticket Toàn Sàn</span>
            </button>

            <button
              onClick={() => setActivePortalTab('ORDERS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'ORDERS' ? 'bg-emerald-50 text-emerald-660' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">📋</span>
              <span>Lịch Sử Đơn Hàng</span>
            </button>
          </nav>
        </div>

        {/* Account footer */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-3xs shrink-0">
              🎧
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-extrabold text-slate-850 truncate leading-tight">{user?.name || 'Nhân viên CSKH'}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-red-600 font-bold rounded-lg text-[10px] transition cursor-pointer text-center"
          >
            Đăng Xuất Hệ Thống
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-8 z-10 sticky top-0 shadow-3xs shrink-0">
          <nav className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>🎧 Nhân viên CSKH</span>
            <span>/</span>
            <span className="text-slate-700">
              {activePortalTab === 'SHOPS' ? 'Duyệt Đăng Ký Shop' 
               : activePortalTab === 'WITHDRAWALS' ? 'Phê duyệt rút tiền' 
               : activePortalTab === 'DISPUTES' ? 'Tranh chấp khiếu nại' 
               : activePortalTab === 'TICKETS' ? 'Ticket toàn sàn' 
               : 'Lịch sử đơn hàng'}
            </span>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToHome}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-lg shadow-3xs"
            >
              🛒 Về Trang Mua Sắm
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TAB: SHOPS (Duyệt shop mới) */}
          {activePortalTab === 'SHOPS' && (
            <>
              {/* Statistics Dashboard Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng cửa hàng</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">{shops.length}</p>
                  <p className="text-[9px] text-slate-450 mt-1">Trong trạng thái lọc hiện tại</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-amber-500 font-bold uppercase">Đang chờ duyệt</p>
                  <p className="text-2xl font-black text-amber-555 mt-1">
                    {statusFilter === 'PENDING_APPROVAL' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-455 mt-1">Cần được xử lý sớm</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã kích hoạt</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {statusFilter === 'APPROVED' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-455 mt-1">Sẵn sàng bán hàng</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-rose-500 font-bold uppercase">Bị từ chối</p>
                  <p className="text-2xl font-black text-rose-555 mt-1">
                    {statusFilter === 'REJECTED' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-455 mt-1">Yêu cầu hoàn trả thông tin</p>
                </div>
              </div>

              {/* Filters and Search controls */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'PENDING_APPROVAL', label: '⏳ Chờ phê duyệt' },
                    { id: 'APPROVED', label: '✅ Đã kích hoạt' },
                    { id: 'REJECTED', label: '❌ Bị từ chối' },
                    { id: 'ALL', label: '🌐 Tất cả cửa hàng' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        statusFilter === filter.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Tìm kiếm shop..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Grid content list of shops */}
              {loading ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <p className="text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải dữ liệu cửa hàng...</p>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-2xs">
                  <p className="text-sm font-extrabold text-slate-400">Không tìm thấy yêu cầu cửa hàng nào</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredShops.map(shop => (
                    <div key={shop.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-emerald-500/30 transition duration-200">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-800 leading-tight">{shop.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {shop.id}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            shop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                            shop.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-655' : 'bg-rose-50 text-rose-650'
                          }`}>
                            {shop.status}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-b border-slate-50 py-3 text-slate-650">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Chủ sở hữu ID</span>
                            <span className="font-mono text-slate-700 truncate max-w-xs">{shop.ownerId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Email đăng ký</span>
                            <span className="font-semibold text-slate-700">{shop.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Số điện thoại</span>
                            <span className="font-semibold text-slate-700">{shop.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Địa chỉ lấy hàng</span>
                            <p className="text-slate-650 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">{shop.pickupAddress || 'Chưa cung cấp'}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-400 uppercase text-[9px]">Cấu hình vận chuyển</span>
                            <p className="text-slate-650 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">{shop.shippingSettings || 'Chưa cung cấp'}</p>
                          </div>
                        </div>
                      </div>

                      {shop.status === 'PENDING_APPROVAL' && (
                        <div className="mt-4 flex gap-2">
                          <button
                            disabled={actionLoadingId === shop.id}
                            onClick={() => handleApprove(shop.id, 'APPROVED')}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition duration-150 disabled:opacity-50"
                          >
                            {actionLoadingId === shop.id ? 'Đang duyệt...' : 'Phê Duyệt'}
                          </button>
                          <button
                            disabled={actionLoadingId === shop.id}
                            onClick={() => handleApprove(shop.id, 'REJECTED')}
                            className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg text-xs cursor-pointer border border-rose-100 transition duration-150 disabled:opacity-50"
                          >
                            {actionLoadingId === shop.id ? 'Đang từ chối...' : 'Từ Chối'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB: WITHDRAWALS (Duyệt rút tiền ví) */}
          {activePortalTab === 'WITHDRAWALS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase">💰 Phê Duyệt Yêu Cầu Rút Tiền Ví Shop</h3>
              {withdrawLoading ? (
                <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải danh sách rút tiền...</p>
              ) : withdrawals.length === 0 ? (
                <p className="text-center py-6 text-sm font-extrabold text-slate-400">Không có yêu cầu rút tiền nào cần xử lý</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã Yêu Cầu</th>
                        <th className="pb-3">Mã Shop</th>
                        <th className="pb-3 text-right">Số tiền rút</th>
                        <th className="pb-3">Thông tin Ngân hàng</th>
                        <th className="pb-3">Thời gian tạo</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{w.id}</td>
                          <td className="py-3.5 font-mono text-[10px]">{w.shopId}</td>
                          <td className="py-3.5 text-right font-black text-emerald-600">
                            {Number(w.amount).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700">
                            {w.bankName} - STK: {w.bankAccount} ({w.bankOwner})
                          </td>
                          <td className="py-3.5 font-semibold text-slate-500">
                            {new Date(w.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              w.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                              w.status === 'PENDING' ? 'bg-amber-50 text-amber-655' : 'bg-rose-50 text-rose-650'
                            }`}>
                              {w.status === 'PENDING' ? 'Đang chờ duyệt' : 
                               w.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {w.status === 'PENDING' && (
                              <div className="flex justify-center gap-1.5">
                                <button
                                  disabled={actionLoadingId === w.id}
                                  onClick={() => handleApproveWithdrawal(w.id, 'APPROVED')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[9px] cursor-pointer disabled:opacity-50"
                                >
                                  {actionLoadingId === w.id ? '...' : 'Duyệt'}
                                </button>
                                <button
                                  disabled={actionLoadingId === w.id}
                                  onClick={() => handleApproveWithdrawal(w.id, 'REJECTED')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[9px] cursor-pointer border border-rose-100 disabled:opacity-50"
                                >
                                  {actionLoadingId === w.id ? '...' : 'Từ chối'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: DISPUTES (Giải quyết tranh chấp Trả hàng/Hoàn tiền) */}
          {activePortalTab === 'DISPUTES' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase">⚖️ Giải quyết tranh chấp Trả hàng / Hoàn tiền</h3>
              {disputesLoading ? (
                <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải danh sách khiếu nại...</p>
              ) : disputes.length === 0 ? (
                <p className="text-center py-6 text-sm font-extrabold text-slate-400">Không có đơn khiếu nại tranh chấp nào cần xử lý</p>
              ) : (
                <div className="space-y-6">
                  {disputes.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-4">
                      {/* Top Meta */}
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="text-xs">
                          <p className="font-extrabold text-slate-800">Mã Đơn Hàng: <span className="font-mono text-emerald-600">{order.id}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                          {order.status === 'RETURN_DISPUTED' ? 'ĐANG TRANH CHẤP' : 'CHỜ DUYỆT HOÀN TIỀN'}
                        </span>
                      </div>

                      {/* Return Reasons and Proofs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-2 text-xs">
                          <p className="font-extrabold text-slate-400 uppercase text-[9px]">Lý do từ Người Mua</p>
                          <p className="font-black text-slate-800 text-sm">{order.returnReason || 'N/A'}</p>
                          <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                            <span className="font-extrabold text-slate-400">Số tiền yêu cầu hoàn</span>
                            <span className="font-black text-emerald-600 text-sm">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <p className="font-extrabold text-slate-400 uppercase text-[9px]">Minh chứng Hình ảnh (Người mua cung cấp)</p>
                          {order.returnProofUrl ? (
                            <div className="mt-1">
                              <a href={order.returnProofUrl} target="_blank" rel="noreferrer">
                                <img src={order.returnProofUrl} className="w-24 h-24 object-cover rounded-lg border border-slate-200 hover:border-emerald-500 transition shadow-3xs" alt="proof" />
                              </a>
                            </div>
                          ) : (
                            <p className="text-slate-400 font-semibold italic">Không tải lên hình ảnh minh chứng</p>
                          )}
                        </div>
                      </div>

                      {/* Dispute selection */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <span className="text-xs font-bold text-slate-600 shrink-0">Hoàn tiền về:</span>
                          <select
                            value={refundDestinations[order.id] || 'WALLET'}
                            onChange={(e) => setRefundDestinations(prev => ({ ...prev, [order.id]: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-extrabold text-slate-700 focus:outline-hidden"
                          >
                            <option value="WALLET">Ví ZeroMall (ZeroPay)</option>
                            <option value="BALANCE">Số dư tài khoản khách hàng</option>
                            <option value="ORIGINAL">Phương thức thanh toán gốc</option>
                            <option value="MANUAL_BANK">Chuyển khoản ngân hàng thủ công</option>
                          </select>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleAdminApproveDispute(order)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition"
                          >
                            {actionLoadingId === order.id ? 'Đang duyệt...' : 'Duyệt Hoàn Tiền'}
                          </button>
                          <button
                            disabled={actionLoadingId === order.id}
                            onClick={() => handleAdminRejectDispute(order)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg text-xs cursor-pointer border border-rose-100 transition"
                          >
                            {actionLoadingId === order.id ? 'Đang bác...' : 'Bác bỏ & Trả tiền Seller'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TICKETS (Xử lý ticket lỗi) */}
          {activePortalTab === 'TICKETS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎫 Quản lý ticket báo lỗi toàn sàn</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Mã Ticket</th>
                      <th className="pb-3">Phân loại lỗi</th>
                      <th className="pb-3">Tiêu đề báo cáo</th>
                      <th className="pb-3">Email phản ánh</th>
                      <th className="pb-3">Thời gian</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/10">
                        <td className="py-3.5 font-mono text-[10px]">{t.id}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.category === 'ACCOUNT_ERROR' ? 'bg-red-50 text-red-650' :
                            t.category === 'PAYMENT_ERROR' ? 'bg-amber-50 text-amber-655' :
                            t.category === 'VOUCHER_ERROR' ? 'bg-indigo-50 text-indigo-655' : 'bg-blue-50 text-blue-655'
                          }`}>
                            {t.category === 'ACCOUNT_ERROR' ? 'Lỗi tài khoản' :
                             t.category === 'PAYMENT_ERROR' ? 'Lỗi thanh toán' :
                             t.category === 'VOUCHER_ERROR' ? 'Lỗi voucher' : 'Lỗi vận chuyển'}
                          </span>
                        </td>
                        <td className="py-3.5 font-extrabold text-slate-800 max-w-xs truncate" title={t.description}>
                          {t.title}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-650">{t.email}</td>
                        <td className="py-3.5 text-slate-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-650' : 'bg-amber-50 text-amber-655 animate-pulse'
                          }`}>
                            {t.status === 'RESOLVED' ? 'Đã xử lý' : 'Đang chờ xử lý'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          {t.status === 'PENDING' && (
                            <button
                              onClick={() => handleResolveTicket(t.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] cursor-pointer"
                            >
                              Xử lý xong
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ORDERS (Lịch sử đơn hàng toàn sàn) */}
          {activePortalTab === 'ORDERS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">📋 Lịch sử và hành trình đơn hàng toàn sàn</h3>
                <div className="w-full sm:w-80">
                  <input
                    type="text"
                    placeholder="Tìm mã đơn hàng hoặc khách hàng..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {allOrdersLoading ? (
                <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải lịch sử đơn hàng...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="text-center py-6 text-sm font-extrabold text-slate-400">Không tìm thấy đơn hàng nào</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã đơn hàng</th>
                        <th className="pb-3">Khách hàng ID</th>
                        <th className="pb-3">Sản phẩm</th>
                        <th className="pb-3 text-right">Tổng thanh toán</th>
                        <th className="pb-3">Phương thức</th>
                        <th className="pb-3 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px] font-bold text-slate-800">{o.id}</td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-500">{o.buyerId}</td>
                          <td className="py-3.5 max-w-xs truncate font-semibold text-slate-800">
                            {o.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ') || 'N/A'}
                          </td>
                          <td className="py-3.5 text-right font-black text-slate-750">
                            {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-655 uppercase">
                              {o.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black ${
                              o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-650' :
                              o.status === 'SHIPPING' ? 'bg-blue-50 text-blue-650' :
                              o.status === 'REFUNDED' ? 'bg-rose-50 text-rose-600' :
                              o.status === 'RETURNED' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-655'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
