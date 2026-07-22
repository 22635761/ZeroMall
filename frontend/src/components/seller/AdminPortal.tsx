import React, { useState, useEffect } from 'react'

interface AdminPortalProps {
  user: any
  onLogout: () => void
  onBackToHome: () => void
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onLogout,
  onBackToHome
}) => {
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL') // 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Tab control and withdrawal states
  const [activePortalTab, setActivePortalTab] = useState<
    'SHOPS' | 'WITHDRAWALS' | 'DISPUTES' | 'TICKETS' | 'ORDERS' |
    'USERS' | 'MANAGE_SHOPS' | 'CATEGORIES' | 'VIOLATIONS' | 'PLATFORM_VOUCHERS' | 'FLASH_SALE' | 'MANAGE_CS_STAFF' | 'SYSTEM_REPORTS' | 'AUDIT_LOGS'
  >('SHOPS')
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [disputes, setDisputes] = useState<any[]>([])
  const [disputesLoading, setDisputesLoading] = useState(false)

  // Admin - User accounts management state
  const [users, setUsers] = useState<any[]>([])

  // Admin - Categories management state
  const [categories, setCategories] = useState<any[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')

  // Admin - Flagged/violated products state
  const [violations, setViolations] = useState<any[]>([])

  // Admin - Platform vouchers state
  const [platformVouchers, setPlatformVouchers] = useState<any[]>([])
  const [newVoucherCode, setNewVoucherCode] = useState('')
  const [newVoucherDiscount, setNewVoucherDiscount] = useState(0)

  // Admin - Flash sale state
  const [flashSales, setFlashSales] = useState<any[]>([])

  // Admin - CS Staff management state
  const [csStaff, setCsStaff] = useState<any[]>([])
  const [newCsName, setNewCsName] = useState('')
  const [newCsEmail, setNewCsEmail] = useState('')
  const [newCsPassword, setNewCsPassword] = useState('')

  // Admin - System Operation Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Platform CS - Tickets state
  const [tickets, setTickets] = useState<any[]>([
    { id: 'TKT-101', category: 'ACCOUNT_ERROR', title: 'Lỗi khóa tài khoản nhầm', email: 'buyer@zeromall.vn', description: 'Tài khoản của tôi tự dưng báo bị khóa khi đang thanh toán ví.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'TKT-102', category: 'PAYMENT_ERROR', title: 'Đã quét mã Sepay nhưng không tự động xác nhận', email: 'buyer2@zeromall.vn', description: 'Tôi đã chuyển khoản thành công 120,000đ nhưng trạng thái đơn hàng vẫn báo Chờ thanh toán.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
    { id: 'TKT-103', category: 'VOUCHER_ERROR', title: 'Voucher GIAM50K báo không khả dụng', email: 'guest@zeromall.vn', description: 'Tôi áp dụng voucher giảm 50k của shop nhưng hệ thống báo lỗi không áp dụng được mặc dù đơn hàng trên 200k.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 8).toISOString() },
    { id: 'TKT-104', category: 'SHIPPING_ERROR', title: 'Đơn hàng GHN giao quá 5 ngày chưa nhận được', email: 'hello@zeromall.vn', description: 'Đơn hàng mã GHN82736481 ghi đang giao nhưng 5 ngày rồi chưa cập nhật hành trình.', status: 'PENDING', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
  ])

  // Platform CS - All orders state
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [allOrdersLoading, setAllOrdersLoading] = useState(false)
  const [orderSearchTerm, setOrderSearchTerm] = useState('')

  // Refund destination selection
  const [refundDestinations, setRefundDestinations] = useState<Record<string, string>>({})

  const fetchShops = async (forceAll: boolean = false) => {
    setLoading(true)
    try {
      const url = (forceAll || activePortalTab === 'MANAGE_SHOPS')
        ? `http://localhost:8000/auth/shops`
        : (statusFilter === 'ALL' 
            ? `http://localhost:8000/auth/shops`
            : `http://localhost:8000/auth/shops?status=${statusFilter}`)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Không thể tải danh sách cửa hàng')
      const data = await response.json()
      setShops(data)
    } catch (err: any) {
      console.error(err)
      alert(`Lỗi: ${err.message}`)
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
      // Lọc các đơn hàng ở trạng thái REFUND_DISPUTED
      const disputedOrders = data.filter((o: any) => o.status === 'REFUND_DISPUTED')
      setDisputes(disputedOrders)
    } catch (err: any) {
      console.error(err)
    } finally {
      setDisputesLoading(false)
    }
  }

  const handleAdminApproveDispute = async (order: any) => {
    const dest = refundDestinations[order.id] || 'Ví ZeroMall';
    if (!window.confirm(`Bạn phán quyết HOÀN TIỀN ${order.totalAmount.toLocaleString('vi-VN')}đ cho Người mua?\nPhương thức nhận tiền hoàn: ${dest}`)) return
    setActionLoadingId(order.id)
    try {
      // 1. Cập nhật status thành REFUNDED
      const updateRes = await fetch(`http://localhost:8000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REFUNDED' })
      })
      if (!updateRes.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng')

      // 2. Gọi thanh toán hoàn tiền ví cho Người mua
      if (order.paymentMethod !== 'cod') {
        const refundRes = await fetch('http://localhost:8000/payments/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            buyerId: order.buyerId,
            amount: order.totalAmount
          })
        })
        if (!refundRes.ok) {
          console.error('Không thể hoàn tiền ví cho người mua')
        }
      }

      alert(`Đã phán quyết hoàn tiền thành công về [${dest}] cho Người mua!`)
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/users')
      if (res.ok) setUsers(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/products/categories')
      if (res.ok) setCategories(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchViolations = async () => {
    try {
      const res = await fetch('http://localhost:8000/products/violations')
      if (res.ok) setViolations(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchVouchers = async () => {
    try {
      const res = await fetch('http://localhost:8000/discounts?shopId=PLATFORM')
      if (res.ok) setPlatformVouchers(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchFlashSales = async () => {
    try {
      const res = await fetch('http://localhost:8000/products/flash-sales')
      if (res.ok) setFlashSales(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCsStaff = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/cs-staff')
      if (res.ok) setCsStaff(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('http://localhost:8000/auth/audit-logs')
      if (res.ok) setAuditLogs(await res.json())
    } catch (err) {
      console.error(err)
    }
  }

  const triggerAuditLog = async (action: string) => {
    try {
      await fetch('http://localhost:8000/auth/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user?.email || 'admin@zeromall.vn', action })
      })
      fetchAuditLogs()
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (activePortalTab === 'SHOPS' || activePortalTab === 'MANAGE_SHOPS') {
      fetchShops()
    } else if (activePortalTab === 'WITHDRAWALS') {
      fetchWithdrawals()
    } else if (activePortalTab === 'DISPUTES') {
      fetchDisputes()
    } else if (activePortalTab === 'ORDERS') {
      fetchAllOrders()
    } else if (activePortalTab === 'USERS') {
      fetchUsers()
    } else if (activePortalTab === 'CATEGORIES') {
      fetchCategories()
    } else if (activePortalTab === 'VIOLATIONS') {
      fetchViolations()
    } else if (activePortalTab === 'PLATFORM_VOUCHERS') {
      fetchVouchers()
    } else if (activePortalTab === 'FLASH_SALE') {
      fetchFlashSales()
    } else if (activePortalTab === 'MANAGE_CS_STAFF') {
      fetchCsStaff()
    } else if (activePortalTab === 'AUDIT_LOGS') {
      fetchAuditLogs()
    } else if (activePortalTab === 'SYSTEM_REPORTS') {
      fetchShops()
      fetchUsers()
      fetchAllOrders()
    }
  }, [statusFilter, activePortalTab])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setActivePortalTab('USERS')
    }
  }, [user])

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

  // Count helper
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.email && shop.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans text-left selection:bg-emerald-600 selection:text-white">
      
      {/* LEFT SIDEBAR (Shopee Style with Emerald theme) */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 bg-white">
            <span className="text-2xl">🌱</span>
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
            {user?.role === 'ADMIN' ? (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">QUẢN TRỊ VIÊN SÀN</p>
                
                <button
                  onClick={() => setActivePortalTab('USERS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'USERS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">👥</span>
                  <span>Quản lý User</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('MANAGE_SHOPS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'MANAGE_SHOPS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🏪</span>
                  <span>Quản lý & Khóa Shop</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('CATEGORIES')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'CATEGORIES'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🗂️</span>
                  <span>Quản lý Danh Mục</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('VIOLATIONS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'VIOLATIONS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🚫</span>
                  <span>Sản Phẩm Vi Phạm</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('PLATFORM_VOUCHERS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'PLATFORM_VOUCHERS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🎟️</span>
                  <span>Voucher Toàn Sàn</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('FLASH_SALE')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'FLASH_SALE'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">⚡</span>
                  <span>Quản Lý Flash Sale</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('MANAGE_CS_STAFF')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'MANAGE_CS_STAFF'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🎧</span>
                  <span>Nhân viên Platform CS</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('SYSTEM_REPORTS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'SYSTEM_REPORTS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">📊</span>
                  <span>Báo Cáo Hệ Thống</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('AUDIT_LOGS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'AUDIT_LOGS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">📜</span>
                  <span>Log Thao Tác</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">CSKH & HỖ TRỢ</p>
                
                <button
                  onClick={() => setActivePortalTab('SHOPS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'SHOPS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🏪</span>
                  <span>Duyệt Đăng Ký Shop</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('WITHDRAWALS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'WITHDRAWALS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">💰</span>
                  <span>Phê Duyệt Rút Tiền</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('DISPUTES')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'DISPUTES'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">⚖️</span>
                  <span>Tranh Chấp Khiếu Nại</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('TICKETS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'TICKETS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">🎫</span>
                  <span>Ticket Toàn Sàn</span>
                </button>

                <button
                  onClick={() => setActivePortalTab('ORDERS')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                    activePortalTab === 'ORDERS'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[14px]">📋</span>
                  <span>Lịch Sử Đơn Hàng</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Account details */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-3xs shrink-0">
              {user?.role === 'ADMIN' ? '🛡️' : '🎧'}
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-extrabold text-slate-850 truncate leading-tight">
                {user?.name || (user?.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên CSKH')}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{user?.email || 'admin@zeromall.vn'}</p>
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

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER BAR */}
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-8 z-10 sticky top-0 shadow-3xs shrink-0">
          {/* Breadcrumbs */}
          <nav className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span>Support & CSKH Center</span>
            <span>/</span>
            <span className="text-slate-700">
              {activePortalTab === 'SHOPS' ? 'Quản lý cửa hàng' 
               : activePortalTab === 'WITHDRAWALS' ? 'Phê duyệt rút tiền' 
               : activePortalTab === 'DISPUTES' ? 'Tranh chấp khiếu nại' 
               : activePortalTab === 'TICKETS' ? 'Ticket toàn sàn' 
               : activePortalTab === 'ORDERS' ? 'Lịch sử đơn hàng'
               : activePortalTab === 'USERS' ? 'Quản lý User'
               : activePortalTab === 'MANAGE_SHOPS' ? 'Quản lý & Khóa Shop'
               : activePortalTab === 'CATEGORIES' ? 'Quản lý danh mục'
               : activePortalTab === 'VIOLATIONS' ? 'Sản phẩm vi phạm'
               : activePortalTab === 'PLATFORM_VOUCHERS' ? 'Voucher toàn sàn'
               : activePortalTab === 'FLASH_SALE' ? 'Quản lý Flash Sale'
               : activePortalTab === 'MANAGE_CS_STAFF' ? 'Nhân viên Platform CS'
               : activePortalTab === 'SYSTEM_REPORTS' ? 'Báo cáo hệ thống'
               : 'Log thao tác'}
            </span>
          </nav>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToHome}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-lg shadow-3xs"
            >
              🛒 Về Trang Mua Sắm
            </button>
          </div>
        </header>

        {/* DYNAMIC SCROLL CONTAINER */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* TAB 1: SHOPS APPROVAL */}
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
                  <p className="text-2xl font-black text-amber-550 mt-1">
                    {statusFilter === 'PENDING_APPROVAL' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-450 mt-1">Cần được xử lý sớm</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã kích hoạt</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {statusFilter === 'APPROVED' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-450 mt-1">Sẵn sàng bán hàng</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-rose-500 font-bold uppercase">Bị từ chối</p>
                  <p className="text-2xl font-black text-rose-550 mt-1">
                    {statusFilter === 'REJECTED' ? filteredShops.length : 'Lọc để xem'}
                  </p>
                  <p className="text-[9px] text-slate-450 mt-1">Yêu cầu hoàn trả thông tin</p>
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
                          : 'bg-white text-slate-600 hover:bg-slate-5 hover:text-slate-800 border-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-80 relative">
                  <input
                    type="text"
                    placeholder="🔍 Tìm shop theo tên, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-emerald-600 transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-650 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Shops Cards Listing Grid */}
              {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách các shop...</p>
                </div>
              ) : filteredShops.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs text-center space-y-3">
                  <span className="text-4xl">📭</span>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Trống</p>
                    <p className="text-xs text-slate-400">Không tìm thấy cửa hàng nào khớp với bộ lọc hiện tại.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredShops.map(shop => {
                    let parsedAddress: any = null
                    
                    if (shop.pickupAddress) {
                      try {
                        parsedAddress = typeof shop.pickupAddress === 'string'
                          ? JSON.parse(shop.pickupAddress)
                          : shop.pickupAddress
                      } catch (e) {}
                    }

                    return (
                      <div key={shop.id} className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                          <div className="space-y-1.5 text-left">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Cửa Hàng</span>
                            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                              🏪 {shop.name}
                            </h3>
                            <p className="text-[10px] text-slate-450 font-semibold">ID: {shop.id}</p>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                            shop.status === 'PENDING_APPROVAL' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {shop.status === 'PENDING_APPROVAL' && 'Chờ duyệt'}
                            {shop.status === 'APPROVED' && 'Hoạt động'}
                            {shop.status === 'REJECTED' && 'Bị từ chối'}
                          </span>
                        </div>

                        <div className="p-5 space-y-4 text-xs font-semibold text-slate-700 flex-1">
                          <div className="grid grid-cols-2 gap-3 pb-3.5 border-b border-slate-50">
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Số điện thoại</p>
                              <p className="text-slate-800">{shop.phoneNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Email liên hệ</p>
                              <p className="truncate text-slate-800">{shop.email || 'N/A'}</p>
                            </div>
                          </div>

                          {parsedAddress && (
                            <div className="pb-3.5 border-b border-slate-50">
                              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Địa chỉ lấy hàng</p>
                              <p className="text-slate-600 font-medium leading-relaxed">
                                <strong>{parsedAddress.fullName}</strong> ({parsedAddress.phoneNumber})<br />
                                {parsedAddress.detailAddress}, {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                              </p>
                            </div>
                          )}
                        </div>

                        {shop.status === 'PENDING_APPROVAL' && (
                          <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                            <button
                              onClick={() => handleApprove(shop.id, 'APPROVED')}
                              disabled={actionLoadingId !== null}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-bold text-xs shadow-3xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                            >
                              {actionLoadingId === shop.id ? 'Đang xử lý...' : 'Phê Duyệt Hoạt Động ✓'}
                            </button>
                            <button
                              onClick={() => handleApprove(shop.id, 'REJECTED')}
                              disabled={actionLoadingId !== null}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg py-2.5 font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                            >
                              {actionLoadingId === shop.id ? 'Đang xử lý...' : 'Từ Chối Đăng Ký ✕'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: WITHDRAWALS APPROVAL (Emerald theme style) */}
          {activePortalTab === 'WITHDRAWALS' && (
            <>
              {/* Statistics Dashboard Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng yêu cầu rút tiền</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">{withdrawals.length}</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-amber-500 font-bold uppercase">Đang chờ duyệt</p>
                  <p className="text-2xl font-black text-amber-550 mt-1">
                    {withdrawals.filter(w => w.status === 'PENDING').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã phê duyệt</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {withdrawals.filter(w => w.status === 'APPROVED').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-rose-500 font-bold uppercase">Đã từ chối</p>
                  <p className="text-2xl font-black text-rose-550 mt-1">
                    {withdrawals.filter(w => w.status === 'REJECTED').length}
                  </p>
                </div>
              </div>

              {/* Withdrawals Listing Table card */}
              {withdrawLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách yêu cầu rút tiền...</p>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs text-center space-y-3">
                  <span className="text-4xl">📭</span>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Trống</p>
                    <p className="text-xs text-slate-400">Không có yêu cầu rút tiền nào trên hệ thống.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold text-slate-700 border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="pb-3.5">Mã yêu cầu</th>
                          <th className="pb-3.5">Mã Shop</th>
                          <th className="pb-3.5 text-right">Số tiền rút</th>
                          <th className="pb-3.5">Thông tin tài khoản ngân hàng</th>
                          <th className="pb-3.5">Thời gian gửi</th>
                          <th className="pb-3.5">Trạng thái</th>
                          <th className="pb-3.5 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {withdrawals.map(req => {
                          const statusColor = 
                            req.status === 'APPROVED' ? 'text-emerald-600 bg-emerald-50' :
                            req.status === 'PENDING' ? 'text-amber-600 bg-amber-50' :
                            'text-rose-600 bg-rose-50'
                          
                          const statusLabel = 
                            req.status === 'APPROVED' ? 'Đã duyệt' :
                            req.status === 'PENDING' ? 'Chờ duyệt' : 'Từ chối'

                          return (
                            <tr key={req.id} className="hover:bg-slate-50/20 transition">
                              <td className="py-4 font-mono text-[10px]">{req.id.substring(0, 8)}...</td>
                              <td className="py-4 font-bold text-slate-800">{req.shopId.substring(0, 8)}...</td>
                              <td className="py-4 text-right font-black text-slate-800 text-sm tracking-tight">
                                {req.amount.toLocaleString('vi-VN')}đ
                              </td>
                              <td className="py-4 text-left">
                                <p className="font-extrabold text-slate-850">{req.bankName}</p>
                                <p className="text-[10px] text-slate-450 mt-0.5">
                                  STK: <span className="font-bold text-slate-900">{req.bankAccount}</span> | {req.accountName}
                                </p>
                              </td>
                              <td className="py-4 text-[10px] text-slate-400 font-medium">
                                {new Date(req.createdAt).toLocaleString('vi-VN')}
                              </td>
                              <td className="py-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                {req.status === 'PENDING' ? (
                                  <div className="flex justify-center gap-2">
                                    <button
                                      onClick={() => handleApproveWithdrawal(req.id, 'APPROVED')}
                                      disabled={actionLoadingId !== null}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50 cursor-pointer shadow-3xs"
                                    >
                                      {actionLoadingId === req.id ? '...' : 'Duyệt ✓'}
                                    </button>
                                    <button
                                      onClick={() => handleApproveWithdrawal(req.id, 'REJECTED')}
                                      disabled={actionLoadingId !== null}
                                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg font-bold text-[10px] transition disabled:opacity-50 cursor-pointer"
                                    >
                                      {actionLoadingId === req.id ? '...' : 'Từ chối ✕'}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Đã xử lý</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 3: DISPUTES RESOLUTION (Shopee style) */}
          {activePortalTab === 'DISPUTES' && (
            <>
              {/* Statistics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng tranh chấp cần xử lý</p>
                  <p className="text-2xl font-black text-rose-600 mt-1">{disputes.length}</p>
                </div>
              </div>

              {/* Disputes Listing Card */}
              {disputesLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách khiếu nại...</p>
                </div>
              ) : disputes.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs text-center space-y-3">
                  <span className="text-4xl">⚖️</span>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Trống</p>
                    <p className="text-xs text-slate-400">Không có tranh chấp khiếu nại nào cần giải quyết.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold text-slate-700 border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="pb-3.5">Mã đơn hàng</th>
                          <th className="pb-3.5">Khách hàng khiếu nại</th>
                          <th className="pb-3.5 text-right">Số tiền</th>
                          <th className="pb-3.5">Thông tin lý do & chi tiết</th>
                          <th className="pb-3.5">Thời gian cập nhật</th>
                          <th className="pb-3.5 text-center">Hành động phán xử</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {disputes.map((order: any) => (
                          <tr key={order.id} className="hover:bg-slate-50/20 transition">
                            <td className="py-4 font-mono text-[10px] font-bold text-slate-900">
                              #{order.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4">
                              <p className="font-bold text-slate-800">{order.buyerName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{order.buyerEmail}</p>
                            </td>
                            <td className="py-4 text-right font-black text-rose-600 text-sm tracking-tight">
                              {order.totalAmount.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-4 text-left max-w-xs space-y-2">
                              <div>
                                <span className="text-[9px] bg-rose-50 text-rose-600 font-extrabold px-1.5 py-0.5 rounded mr-1">Buyer</span>
                                <span className="font-bold text-amber-700 leading-snug">{order.refundReason || 'Không rõ lý do'}</span>
                                {order.refundDescription && (
                                  <p className="text-[10px] text-slate-500 mt-1 leading-normal italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    "{order.refundDescription}"
                                  </p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[9px] text-emerald-600 font-semibold cursor-pointer hover:underline">📸 Xem ảnh lỗi.jpg</span>
                                  <span className="text-[9px] text-emerald-600 font-semibold cursor-pointer hover:underline">🎥 Xem clip_mo_hop.mp4</span>
                                </div>
                              </div>
                              <hr className="border-slate-100" />
                              <div>
                                <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-1.5 py-0.5 rounded mr-1">Seller</span>
                                <span className="text-[10px] text-slate-600 font-medium">Đối chứng từ Người bán</span>
                                <p className="text-[10px] text-slate-450 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  "Shop đóng hàng đủ, đúng mẫu mã 100%. Camera shop ghi nhận gói đúng hàng. Đề nghị kiểm tra xem bên ship làm bể."
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <span className="text-[9px] text-blue-600 font-semibold cursor-pointer hover:underline">📸 Anh_dong_goi.png</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-[10px] text-slate-400 font-medium">
                              {new Date(order.updatedAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-4 text-center">
                              <div className="space-y-3.5">
                                <div className="text-left">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Nguồn hoàn tiền về:</label>
                                  <select
                                    value={refundDestinations[order.id] || 'Ví ZeroMall'}
                                    onChange={(e) => setRefundDestinations(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    className="mt-1 block w-full text-[10px] rounded-lg border-slate-200 bg-slate-50 p-1 text-slate-700 font-bold focus:border-emerald-500 focus:ring-emerald-500"
                                  >
                                    <option value="Ví ZeroMall">Ví ZeroMall</option>
                                    <option value="Số dư tài khoản khách hàng">Số dư tài khoản khách hàng</option>
                                    <option value="Phương thức thanh toán ban đầu">Phương thức thanh toán ban đầu</option>
                                    <option value="Chuyển khoản thủ công">Chuyển khoản thủ công</option>
                                  </select>
                                </div>
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleAdminApproveDispute(order)}
                                    disabled={actionLoadingId !== null}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50 cursor-pointer shadow-3xs"
                                  >
                                    {actionLoadingId === order.id ? '...' : 'Hoàn tiền cho Buyer'}
                                  </button>
                                  <button
                                    onClick={() => handleAdminRejectDispute(order)}
                                    disabled={actionLoadingId !== null}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[10px] transition disabled:opacity-50 cursor-pointer shadow-3xs"
                                  >
                                    {actionLoadingId === order.id ? '...' : 'Trả tiền cho Seller'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 4: TICKETS MANAGEMENT */}
          {activePortalTab === 'TICKETS' && (
            <>
              {/* Statistics Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng ticket nhận được</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">{tickets.length}</p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-amber-500 font-bold uppercase">Chờ xử lý</p>
                  <p className="text-2xl font-black text-amber-550 mt-1">
                    {tickets.filter(t => t.status === 'PENDING').length}
                  </p>
                </div>
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã giải quyết</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {tickets.filter(t => t.status === 'RESOLVED').length}
                  </p>
                </div>
              </div>

              {/* Tickets table */}
              <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-semibold text-slate-700 border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="pb-3.5">Mã Ticket</th>
                        <th className="pb-3.5">Phân loại lỗi</th>
                        <th className="pb-3.5">Tiêu đề lỗi</th>
                        <th className="pb-3.5">Email liên hệ</th>
                        <th className="pb-3.5">Mô tả sự cố</th>
                        <th className="pb-3.5">Thời gian gửi</th>
                        <th className="pb-3.5">Trạng thái</th>
                        <th className="pb-3.5 text-center">Hành động CS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tickets.map(t => {
                        let catLabel = t.category
                        let catColor = 'bg-slate-100 text-slate-700'
                        if (t.category === 'ACCOUNT_ERROR') {
                          catLabel = 'Lỗi Tài Khoản'
                          catColor = 'bg-indigo-50 text-indigo-705 border border-indigo-100'
                        } else if (t.category === 'PAYMENT_ERROR') {
                          catLabel = 'Lỗi Thanh Toán'
                          catColor = 'bg-rose-50 text-rose-705 border border-rose-100'
                        } else if (t.category === 'VOUCHER_ERROR') {
                          catLabel = 'Lỗi Voucher'
                          catColor = 'bg-purple-50 text-purple-705 border border-purple-100'
                        } else if (t.category === 'SHIPPING_ERROR') {
                          catLabel = 'Lỗi Vận Chuyển'
                          catColor = 'bg-amber-50 text-amber-705 border border-amber-100'
                        }

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/20 transition">
                            <td className="py-4 font-mono font-bold text-slate-900">{t.id}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${catColor}`}>
                                {catLabel}
                              </span>
                            </td>
                            <td className="py-4 font-extrabold text-slate-850">{t.title}</td>
                            <td className="py-4 text-slate-500">{t.email}</td>
                            <td className="py-4 text-slate-450 italic leading-snug max-w-xs">"{t.description}"</td>
                            <td className="py-4 text-[10px] text-slate-400">
                              {new Date(t.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {t.status === 'RESOLVED' ? 'Đã sửa lỗi' : 'Chờ xử lý'}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              {t.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleResolveTicket(t.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[10px] transition cursor-pointer shadow-3xs"
                                >
                                  🛠️ Xử lý lỗi
                                </button>
                              ) : (
                                <span className="text-slate-400 italic">Đã đóng ticket</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: ALL ORDERS HISTORY */}
          {activePortalTab === 'ORDERS' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng số đơn hàng</p>
                  <p className="text-2xl font-black text-slate-700 mt-1">{allOrders.length}</p>
                </div>
              </div>

              {/* Filters / Search */}
              <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs flex items-center gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo mã đơn, email khách hàng, hoặc số điện thoại..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Orders List Table */}
              {allOrdersLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách lịch sử đơn hàng...</p>
                </div>
              ) : allOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs text-center">
                  <span className="text-4xl">📦</span>
                  <p className="text-sm font-extrabold text-slate-700 mt-3">Trống</p>
                  <p className="text-xs text-slate-400">Không tìm thấy đơn hàng nào.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-2xs p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold text-slate-700 border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="pb-3.5">Mã đơn hàng</th>
                          <th className="pb-3.5">Khách hàng</th>
                          <th className="pb-3.5">Thông tin nhận hàng & Vận chuyển</th>
                          <th className="pb-3.5 text-right">Tổng tiền</th>
                          <th className="pb-3.5">Phương thức</th>
                          <th className="pb-3.5">Trạng thái đơn</th>
                          <th className="pb-3.5">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {allOrders
                          .filter(o => 
                            o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                            o.buyerEmail.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                            o.buyerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                            (o.buyerPhone && o.buyerPhone.includes(orderSearchTerm))
                          )
                          .map(o => {
                            let statusBadge = 'bg-slate-100 text-slate-700'
                            let statusText = o.status
                            if (o.status === 'PENDING_PAYMENT') {
                              statusBadge = 'bg-amber-100 text-amber-700'
                              statusText = 'Chờ thanh toán'
                            } else if (o.status === 'PROCESSING') {
                              statusBadge = 'bg-sky-100 text-sky-700'
                              statusText = 'Chờ chuẩn bị hàng'
                            } else if (o.status === 'SHIPPING') {
                              statusBadge = 'bg-blue-100 text-blue-700'
                              statusText = 'Đang giao hàng'
                            } else if (o.status === 'COMPLETED') {
                              statusBadge = 'bg-emerald-100 text-emerald-700'
                              statusText = 'Đã giao thành công'
                            } else if (o.status === 'CANCELLED') {
                              statusBadge = 'bg-slate-100 text-slate-500'
                              statusText = 'Đã hủy'
                            } else if (o.status === 'REFUND_PENDING') {
                              statusBadge = 'bg-orange-100 text-orange-700'
                              statusText = 'Chờ duyệt hoàn tiền'
                            } else if (o.status === 'RETURN_PENDING') {
                              statusBadge = 'bg-yellow-100 text-yellow-700'
                              statusText = 'Chờ khách trả hàng'
                            } else if (o.status === 'RETURN_SHIPPED') {
                              statusBadge = 'bg-purple-100 text-purple-700'
                              statusText = 'Đang trả hàng'
                            } else if (o.status === 'REFUND_DISPUTED') {
                              statusBadge = 'bg-red-100 text-red-700'
                              statusText = 'Tranh chấp khiếu nại'
                            } else if (o.status === 'REFUNDED') {
                              statusBadge = 'bg-rose-100 text-rose-700'
                              statusText = 'Đã hoàn tiền'
                            }

                            return (
                              <tr key={o.id} className="hover:bg-slate-50/20 transition">
                                <td className="py-4 font-mono font-bold text-slate-900">
                                  #{o.id.substring(0, 8).toUpperCase()}
                                </td>
                                <td className="py-4">
                                  <p className="font-bold text-slate-800">{o.buyerName}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{o.buyerEmail} | {o.buyerPhone}</p>
                                </td>
                                <td className="py-4 text-left max-w-xs">
                                  <p className="font-extrabold text-slate-800 leading-snug truncate">{o.shippingAddress}</p>
                                  {o.ghnOrderCode && (
                                    <p className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded mt-1 inline-block font-mono">
                                      🚚 GHN: {o.ghnOrderCode}
                                    </p>
                                  )}
                                </td>
                                <td className="py-4 text-right font-black text-slate-800 text-sm tracking-tight">
                                  {o.totalAmount.toLocaleString('vi-VN')}đ
                                </td>
                                <td className="py-4">
                                  <span className="font-bold uppercase text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded text-[9px]">
                                    {o.paymentMethod}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${statusBadge}`}>
                                    {statusText}
                                  </span>
                                </td>
                                <td className="py-4 text-[10px] text-slate-400">
                                  {new Date(o.createdAt).toLocaleString('vi-VN')}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 6: USERS */}
          {activePortalTab === 'USERS' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">👥 Quản lý người dùng hệ thống</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã User</th>
                        <th className="pb-3">Họ và Tên</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Vai trò</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{u.id}</td>
                          <td className="py-3.5 font-bold text-slate-850">{u.name}</td>
                          <td className="py-3.5">{u.email}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.role === 'ADMIN' ? 'bg-red-50 text-red-650' : 
                              u.role === 'PLATFORM_SUPPORT' ? 'bg-indigo-50 text-indigo-655' :
                              u.role === 'SHOP_OWNER' ? 'bg-blue-50 text-blue-655' : 'bg-slate-50 text-slate-655'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-655' : 'bg-rose-50 text-rose-655'
                            }`}>
                              {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {u.role !== 'ADMIN' ? (
                              <button
                                onClick={async () => {
                                  const newStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
                                  try {
                                    const res = await fetch(`http://localhost:8000/auth/users/${u.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản ${u.email}`)
                                      fetchUsers()
                                      alert('Đã cập nhật trạng thái người dùng thành công!')
                                    } else {
                                      alert('Lỗi cập nhật trạng thái người dùng')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }}
                                className={`px-3 py-1 rounded font-bold text-[10px] cursor-pointer ${
                                  u.status === 'ACTIVE' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border border-emerald-100'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                              </button>
                            ) : (
                              <span className="text-slate-400 italic">Không khả dụng</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 7: MANAGE SHOPS */}
          {activePortalTab === 'MANAGE_SHOPS' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">🏪 Quản lý & Khóa cửa hàng</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã Shop</th>
                        <th className="pb-3">Tên Cửa Hàng</th>
                        <th className="pb-3">Chủ Shop</th>
                        <th className="pb-3">Điện thoại</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {shops.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{s.id.substring(0, 8)}...</td>
                          <td className="py-3.5 font-black text-slate-800">{s.name}</td>
                          <td className="py-3.5">{s.owner?.name || s.ownerId.substring(0,8)}</td>
                          <td className="py-3.5">{s.phoneNumber || 'N/A'}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              s.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                              s.status === 'BLOCKED' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-650'
                            }`}>
                              {s.status === 'APPROVED' ? 'Đang hoạt động' : s.status === 'BLOCKED' ? 'Đã khóa' : 'Chờ duyệt'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex justify-center gap-2">
                              {s.status === 'PENDING_APPROVAL' && (
                                <button
                                  onClick={() => handleApprove(s.id, 'APPROVED')}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-500 cursor-pointer shadow-3xs"
                                >
                                  Duyệt Shop
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  const newStatus = s.status === 'BLOCKED' ? 'APPROVED' : 'BLOCKED'
                                  try {
                                    const res = await fetch(`http://localhost:8000/auth/shops/${s.id}/approve`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} cửa hàng "${s.name}"`)
                                      fetchShops()
                                      alert('Đã cập nhật trạng thái cửa hàng thành công!')
                                    } else {
                                      alert('Lỗi cập nhật trạng thái cửa hàng')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }}
                                className={`px-2.5 py-1 rounded font-bold text-[10px] cursor-pointer ${
                                  s.status === 'BLOCKED' ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border border-emerald-105' : 'bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-105'
                                }`}
                              >
                                {s.status === 'BLOCKED' ? 'Mở khóa Shop' : 'Khóa Shop ✕'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 8: CATEGORIES */}
          {activePortalTab === 'CATEGORIES' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">🗂️ Quản lý danh mục sản phẩm</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Tên danh mục mới..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={async () => {
                        if (!newCategoryName.trim()) return
                        try {
                          const res = await fetch('http://localhost:8000/products/categories', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newCategoryName })
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Tạo danh mục sản phẩm mới "${newCategoryName}"`)
                            fetchCategories()
                            setNewCategoryName('')
                            alert('Đã tạo danh mục thành công!')
                          } else {
                            alert('Lỗi tạo danh mục sản phẩm')
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                    >
                      Thêm mới
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã Danh Mục</th>
                        <th className="pb-3">Tên Danh Mục</th>
                        <th className="pb-3">Slug Đường Dẫn</th>
                        <th className="pb-3 text-right">Số Sản Phẩm</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {categories.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{c.id}</td>
                          <td className="py-3.5 font-extrabold text-slate-800">{c.name}</td>
                          <td className="py-3.5 font-mono">{c.slug}</td>
                          <td className="py-3.5 text-right font-black text-slate-800">{c.productCount || 0}</td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={async () => {
                                if (window.confirm(`Xóa danh mục "${c.name}"?`)) {
                                  try {
                                    const res = await fetch(`http://localhost:8000/products/categories/${c.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`Xóa danh mục sản phẩm "${c.name}"`)
                                      fetchCategories()
                                      alert('Đã xóa danh mục thành công!')
                                    } else {
                                      alert('Lỗi khi xóa danh mục')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded font-bold text-[10px] cursor-pointer"
                            >
                              Xóa ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 9: VIOLATIONS */}
          {activePortalTab === 'VIOLATIONS' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">🚫 Kiểm duyệt sản phẩm vi phạm</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã sản phẩm</th>
                        <th className="pb-3">Tên sản phẩm</th>
                        <th className="pb-3">Tên Shop</th>
                        <th className="pb-3">Lý do vi phạm</th>
                        <th className="pb-3 text-right">Lượt báo cáo</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {violations.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{v.id}</td>
                          <td className="py-3.5 font-extrabold text-slate-850">{v.name}</td>
                          <td className="py-3.5 font-bold text-slate-700">{v.shopName || `Shop ID: ${v.shopId}`}</td>
                          <td className="py-3.5 text-rose-600 font-medium italic">{v.violationReason || v.reason || 'Báo cáo vi phạm'}</td>
                          <td className="py-3.5 text-right font-black text-rose-600">{v.reportsCount || 0}</td>
                          <td className="py-3.5 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Xóa vĩnh viễn sản phẩm vi phạm "${v.name}"?`)) {
                                    try {
                                      const res = await fetch(`http://localhost:8000/products/${v.id}`, {
                                        method: 'DELETE'
                                      })
                                      if (res.ok) {
                                        await triggerAuditLog(`Gỡ bỏ sản phẩm vi phạm "${v.name}"`)
                                        fetchViolations()
                                        alert('Đã xóa sản phẩm vi phạm thành công!')
                                      } else {
                                        alert('Lỗi khi xóa sản phẩm')
                                      }
                                    } catch (err: any) {
                                      alert(err.message)
                                    }
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] transition cursor-pointer shadow-3xs"
                              >
                                Gỡ bỏ sản phẩm
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`http://localhost:8000/products/violations/${v.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isViolated: false })
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`Bỏ qua cảnh báo vi phạm của sản phẩm "${v.name}"`)
                                      fetchViolations()
                                      alert('Đã bỏ qua cảnh báo.')
                                    } else {
                                      alert('Lỗi cập nhật cảnh báo')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[10px] cursor-pointer"
                              >
                                Bỏ qua
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 10: PLATFORM VOUCHERS */}
          {activePortalTab === 'PLATFORM_VOUCHERS' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎟️ Quản lý voucher toàn sàn</h3>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Mã Voucher..."
                      value={newVoucherCode}
                      onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <input
                      type="number"
                      placeholder="Số tiền giảm..."
                      value={newVoucherDiscount || ''}
                      onChange={(e) => setNewVoucherDiscount(parseInt(e.target.value, 10))}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <button
                      onClick={async () => {
                        if (!newVoucherCode.trim() || newVoucherDiscount <= 0) return
                        try {
                          const res = await fetch('http://localhost:8000/discounts?shopId=PLATFORM', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: `Voucher toàn sàn ${newVoucherCode}`,
                              code: newVoucherCode,
                              type: 'fixed',
                              value: newVoucherDiscount,
                              minSpend: 150000,
                              usageLimit: 1000,
                              startDate: new Date().toISOString(),
                              endDate: new Date(Date.now() + 365*24*3600*1000).toISOString()
                            })
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Tạo voucher toàn sàn ${newVoucherCode} (Giảm ${newVoucherDiscount.toLocaleString()}đ)`)
                            fetchVouchers()
                            setNewVoucherCode('')
                            setNewVoucherDiscount(0)
                            alert('Đã tạo voucher toàn sàn thành công!')
                          } else {
                            const errData = await res.json()
                            alert('Lỗi tạo voucher: ' + (errData.message || 'Không xác định'))
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                    >
                      Thêm Voucher
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã Code</th>
                        <th className="pb-3 text-right">Mức Giảm</th>
                        <th className="pb-3 text-right">Đơn tối thiểu</th>
                        <th className="pb-3 text-right">Đã sử dụng</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {platformVouchers.map(v => {
                        const isActive = new Date(v.endDate) > new Date()
                        return (
                          <tr key={v.id || v.code} className="hover:bg-slate-50/10">
                            <td className="py-3.5 font-mono font-extrabold text-slate-900">{v.code}</td>
                            <td className="py-3.5 text-right font-black text-emerald-600">{(v.value || 0).toLocaleString()}đ</td>
                            <td className="py-3.5 text-right font-bold text-slate-700">{(v.minSpend || 0).toLocaleString()}đ</td>
                            <td className="py-3.5 text-right font-bold text-slate-500">{v.usedCount || 0}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isActive ? 'bg-emerald-50 text-emerald-650' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isActive ? 'Hoạt động' : 'Hết hạn'}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Xóa vĩnh viễn voucher toàn sàn ${v.code}?`)) {
                                    try {
                                      const res = await fetch(`http://localhost:8000/discounts/${v.id}`, {
                                        method: 'DELETE'
                                      })
                                      if (res.ok) {
                                        await triggerAuditLog(`Xóa voucher toàn sàn ${v.code}`)
                                        fetchVouchers()
                                        alert('Đã xóa voucher thành công!')
                                      } else {
                                        alert('Lỗi khi xóa voucher')
                                      }
                                    } catch (err: any) {
                                      alert(err.message)
                                    }
                                  }
                                }}
                                className="px-2.5 py-1 rounded font-bold text-[10px] cursor-pointer bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100"
                              >
                                Xóa Voucher ✕
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 11: FLASH SALE */}
          {activePortalTab === 'FLASH_SALE' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">⚡ Quản Lý Flash Sale</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Khung giờ (VD: 16:00 - 18:00)..."
                      id="newFlashSaleSlot"
                      className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={async () => {
                        const input = document.getElementById('newFlashSaleSlot') as HTMLInputElement
                        const slot = input?.value
                        if (!slot?.trim()) return
                        try {
                          const res = await fetch('http://localhost:8000/products/flash-sales', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ timeSlot: slot })
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Tạo khung giờ Flash Sale mới "${slot}"`)
                            fetchFlashSales()
                            input.value = ''
                            alert('Đã tạo khung giờ Flash Sale thành công!')
                          } else {
                            alert('Lỗi tạo khung giờ Flash Sale')
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                    >
                      Thêm Khung Giờ
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã Khung giờ</th>
                        <th className="pb-3">Khung Giờ Vàng</th>
                        <th className="pb-3 text-right">Số sản phẩm đăng ký</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {flashSales.map(fs => (
                        <tr key={fs.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{fs.id}</td>
                          <td className="py-3.5 font-extrabold text-slate-850">{fs.timeSlot}</td>
                          <td className="py-3.5 text-right font-bold text-slate-700">{fs.productsCount || 0}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              fs.status === 'RUNNING' ? 'bg-rose-50 text-rose-650 border border-rose-100 animate-pulse' : 
                              fs.status === 'UPCOMING' ? 'bg-sky-50 text-sky-655 border border-sky-100' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {fs.status === 'RUNNING' ? 'Đang diễn ra' : fs.status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex justify-center gap-2">
                              <select
                                value={fs.status}
                                onChange={async (e) => {
                                  const newStatus = e.target.value
                                  try {
                                    const res = await fetch(`http://localhost:8000/products/flash-sales/${fs.id}/status`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: newStatus })
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`Cập nhật trạng thái Flash Sale slot ${fs.timeSlot} thành ${newStatus}`)
                                      fetchFlashSales()
                                      alert('Đã cập nhật trạng thái Flash Sale!')
                                    } else {
                                      alert('Lỗi cập nhật trạng thái')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }}
                                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold cursor-pointer"
                              >
                                <option value="UPCOMING">Sắp diễn ra</option>
                                <option value="RUNNING">Đang diễn ra</option>
                                <option value="ENDED">Đã kết thúc</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 12: MANAGE CS STAFF */}
          {activePortalTab === 'MANAGE_CS_STAFF' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎧 Quản lý nhân viên Platform CS</h3>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Họ tên CS..."
                      value={newCsName}
                      onChange={(e) => setNewCsName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-205 rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <input
                      type="email"
                      placeholder="Email CS..."
                      value={newCsEmail}
                      onChange={(e) => setNewCsEmail(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-205 rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <input
                      type="password"
                      placeholder="Mật khẩu..."
                      value={newCsPassword}
                      onChange={(e) => setNewCsPassword(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-205 rounded-lg text-xs font-semibold focus:outline-hidden"
                    />
                    <button
                      onClick={async () => {
                        if (!newCsName.trim()) {
                          alert('Vui lòng nhập Họ tên nhân viên CSKH!')
                          return
                        }
                        if (!newCsEmail.trim()) {
                          alert('Vui lòng nhập Email nhân viên CSKH!')
                          return
                        }
                        if (!newCsPassword.trim()) {
                          alert('Vui lòng nhập Mật khẩu cho tài khoản!')
                          return
                        }
                        try {
                          const res = await fetch('http://localhost:8000/auth/cs-staff', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newCsName, email: newCsEmail, password: newCsPassword })
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Tạo tài khoản CSKH mới cho ${newCsEmail}`)
                            fetchCsStaff()
                            setNewCsName('')
                            setNewCsEmail('')
                            setNewCsPassword('')
                            alert('Đã thêm nhân viên CSKH thành công!')
                          } else {
                            const errData = await res.json()
                            alert('Lỗi thêm nhân viên CS: ' + (errData.message || 'Không xác định'))
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                    >
                      Thêm nhân viên
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-700">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        <th className="pb-3">Mã CS</th>
                        <th className="pb-3">Họ và Tên</th>
                        <th className="pb-3">Email liên hệ</th>
                        <th className="pb-3 text-right">Số ticket đã xử lý</th>
                        <th className="pb-3">Trạng thái</th>
                        <th className="pb-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {csStaff.map(cs => (
                        <tr key={cs.id} className="hover:bg-slate-50/10">
                          <td className="py-3.5 font-mono text-[10px]">{cs.id}</td>
                          <td className="py-3.5 font-extrabold text-slate-850">{cs.name}</td>
                          <td className="py-3.5">{cs.email}</td>
                          <td className="py-3.5 text-right font-bold text-slate-700">{cs.handledTickets || 0}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              cs.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650' : 'bg-rose-50 text-rose-650'
                            }`}>
                              {cs.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={async () => {
                                const newStatus = cs.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
                                try {
                                  const res = await fetch(`http://localhost:8000/auth/users/${cs.id}/status`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  })
                                  if (res.ok) {
                                    await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Tạm ngưng' : 'Kích hoạt lại'} nhân viên CSKH ${cs.email}`)
                                    fetchCsStaff()
                                    alert('Đã cập nhật trạng thái nhân viên CSKH!')
                                  } else {
                                    alert('Lỗi cập nhật trạng thái')
                                  }
                                } catch (err: any) {
                                  alert(err.message)
                                }
                              }}
                              className={`px-2.5 py-1 rounded font-bold text-[10px] cursor-pointer ${
                                cs.status === 'ACTIVE' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border border-emerald-100'
                              }`}
                            >
                              {cs.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 13: SYSTEM REPORTS */}
          {activePortalTab === 'SYSTEM_REPORTS' && (() => {
            const totalGMV = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
            const orderCount = allOrders.length
            const userCount = users.length
            const refundCount = allOrders.filter(o => o.status === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'RETURN_PENDING').length
            const refundRate = orderCount > 0 ? ((refundCount / orderCount) * 100).toFixed(1) : '0.0'

            const codCount = allOrders.filter(o => o.paymentMethod === 'COD').length
            const sepayCount = allOrders.filter(o => o.paymentMethod === 'SEPAY' || o.paymentMethod === 'BANK_TRANSFER').length
            const zeropayCount = allOrders.filter(o => o.paymentMethod === 'ZEROPAY' || o.paymentMethod === 'WALLET').length
            const totalPayCount = orderCount || 1
            const codPercent = ((codCount / totalPayCount) * 100).toFixed(0)
            const sepayPercent = ((sepayCount / totalPayCount) * 100).toFixed(0)
            const zeropayPercent = ((zeropayCount / totalPayCount) * 100).toFixed(0)

            return (
              <>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                      <p className="text-[10px] text-slate-450 font-bold uppercase">Tổng Doanh Thu Sàn (GMV)</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{totalGMV.toLocaleString('vi-VN')}đ</p>
                      <p className="text-[9px] text-emerald-600 font-extrabold mt-1">▲ Báo cáo thời gian thực</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                      <p className="text-[10px] text-slate-455 font-bold uppercase">Số Lượng Đơn Hàng</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{orderCount} đơn</p>
                      <p className="text-[9px] text-emerald-600 font-extrabold mt-1">▲ Tải trực tiếp từ DB</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                      <p className="text-[10px] text-slate-455 font-bold uppercase">Người dùng hệ thống</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{userCount} thành viên</p>
                      <p className="text-[9px] text-emerald-600 font-extrabold mt-1">▲ Tài khoản đã đăng ký</p>
                    </div>
                    <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
                      <p className="text-[10px] text-rose-500 font-bold uppercase">Tỷ Lệ Trả Hàng Hoàn Tiền</p>
                      <p className="text-2xl font-black text-rose-600 mt-1">{refundRate}%</p>
                      <p className="text-[9px] text-slate-500 font-bold mt-1">Tổng {refundCount} khiếu nại hoàn tiền</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 uppercase">📈 Báo cáo chi tiết hoạt động sàn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-black text-slate-700">Top Danh Mục Bán Chạy</h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex justify-between font-bold text-slate-600"><span>1. Điện thoại & Phụ kiện</span> <span className="text-slate-800">45% doanh thu</span></li>
                          <li className="flex justify-between font-bold text-slate-650"><span>2. Thời trang nam</span> <span className="text-slate-800">30% doanh thu</span></li>
                          <li className="flex justify-between font-bold text-slate-650"><span>3. Mẹ & Bé</span> <span className="text-slate-800">15% doanh thu</span></li>
                        </ul>
                      </div>
                      <div className="border border-slate-100 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-black text-slate-700">Phân Phối Thanh Toán</h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex justify-between font-bold text-slate-600"><span>1. Thanh toán Ví ZeroPay</span> <span className="text-slate-800">{zeropayPercent}% ({zeropayCount} đơn)</span></li>
                          <li className="flex justify-between font-bold text-slate-650"><span>2. Chuyển khoản Sepay</span> <span className="text-slate-800">{sepayPercent}% ({sepayCount} đơn)</span></li>
                          <li className="flex justify-between font-bold text-slate-650"><span>3. Thanh toán COD</span> <span className="text-slate-800">{codPercent}% ({codCount} đơn)</span></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

          {/* TAB 14: AUDIT LOGS */}
          {activePortalTab === 'AUDIT_LOGS' && (
            <>
              <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">📜 Log lịch sử thao tác hệ thống</h3>
                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-4 items-start text-xs font-semibold p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="font-mono text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0">{log.user}</span>
                      <span className="text-slate-700 leading-snug">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
