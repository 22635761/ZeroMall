import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CsShopsTab } from '../../components/cs-support/CsShopsTab'
import { CsWithdrawalsTab } from '../../components/cs-support/CsWithdrawalsTab'
import { CsDisputesTab } from '../../components/cs-support/CsDisputesTab'
import { CsTicketsTab } from '../../components/cs-support/CsTicketsTab'
import { CsOrdersTab } from '../../components/cs-support/CsOrdersTab'

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
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL')
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
      const [withdrawRes, shopsRes, usersRes] = await Promise.all([
        fetch('http://localhost:8000/payments/withdraw/pending'),
        fetch('http://localhost:8000/auth/shops'),
        fetch('http://localhost:8000/auth/users'),
      ])
      if (!withdrawRes.ok) throw new Error('Không thể tải danh sách rút tiền')
      const withdrawalsData = await withdrawRes.json()
      const shopsData = shopsRes.ok ? await shopsRes.json() : []
      const usersData = usersRes.ok ? await usersRes.json() : []

      const enriched = withdrawalsData.map((w: any) => {
        const matchedShop = shopsData.find((s: any) => s.id === w.shopId || s.ownerId === w.shopId)
        if (matchedShop) {
          return {
            ...w,
            accountType: 'SHOP',
            ownerName: matchedShop.name,
            ownerEmail: matchedShop.email || 'shop@zeromall.vn',
            ownerPhone: matchedShop.phoneNumber || '0901234567',
          }
        }
        const matchedUser = usersData.find((u: any) => u.id === w.shopId)
        if (matchedUser) {
          return {
            ...w,
            accountType: 'BUYER',
            ownerName: matchedUser.name,
            ownerEmail: matchedUser.email,
            ownerPhone: matchedUser.phoneNumber || '0901234567',
          }
        }
        const isShopFallback = w.shopId?.toLowerCase().startsWith('shop')
        return {
          ...w,
          accountType: isShopFallback ? 'SHOP' : 'BUYER',
          ownerName: w.accountName || (isShopFallback ? 'Cửa Hàng ZeroMall' : 'Khách Hàng ZeroMall'),
          ownerEmail: isShopFallback ? 'shop@zeromall.vn' : 'buyer@zeromall.vn',
          ownerPhone: '0901234567',
        }
      })

      setWithdrawals(enriched)
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
      if (!response.ok) throw new Error('Không thể tải danh sách tranh chấp')
      const data = await response.json()
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
      await fetch(`http://localhost:8000/payments/escrow/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const updateRes = await fetch(`http://localhost:8000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REFUNDED' })
      })
      if (!updateRes.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng')

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

      await triggerAuditLog(`Chấp nhận hoàn tiền đơn hàng ${order.id} về [${destLabel}], đã hủy Escrow`)
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
      await fetch(`http://localhost:8000/payments/escrow/${order.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const updateRes = await fetch(`http://localhost:8000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      if (!updateRes.ok) throw new Error('Không thể cập nhật trạng thái đơn hàng')

      await triggerAuditLog(`Từ chối yêu cầu trả hàng của đơn hàng ${order.id}. Đã giải ngân Escrow cho Người bán.`)
      alert('Đã bác bỏ khiếu nại! Tiền đơn hàng đã được giải ngân cho Người bán.')
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

  const handleApprove = async (shopId: string, status: string) => {
    setActionLoadingId(shopId)
    try {
      const response = await fetch(`http://localhost:8000/auth/shops/${shopId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Không thể cập nhật trạng thái cửa hàng')

      await triggerAuditLog(`${status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} cửa hàng ID ${shopId}`)
      alert(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} thành công!`)
      fetchShops()
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleApproveWithdrawal = async (reqId: string, status: string) => {
    setActionLoadingId(reqId)
    try {
      const response = await fetch(`http://localhost:8000/payments/withdraw/${reqId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Xử lý thất bại')

      await triggerAuditLog(`${status === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'} yêu cầu rút tiền mã #${reqId}`)
      alert(`Đã ${status === 'APPROVED' ? 'phê duyệt' : 'từ chối'} lệnh rút tiền!`)
      fetchWithdrawals()
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'RESOLVED' } : t))
    triggerAuditLog(`Đánh dấu xử lý xong Ticket lỗi #${ticketId}`)
    alert(`Đã cập nhật Ticket #${ticketId} thành Đã xử lý!`)
  }

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shop.ownerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          shop.id.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredOrders = allOrders.filter(o => 
    o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    o.buyerId.toLowerCase().includes(orderSearchTerm.toLowerCase())
  )

  const menuItems = [
    { id: 'SHOPS', label: 'Duyệt Đăng Ký Shop', icon: '🏪' },
    { id: 'WITHDRAWALS', label: 'Phê duyệt rút tiền', icon: '💰' },
    { id: 'DISPUTES', label: 'Tranh chấp khiếu nại', icon: '⚖️' },
    { id: 'TICKETS', label: 'Ticket toàn sàn', icon: '🎫' },
    { id: 'ORDERS', label: 'Lịch sử đơn hàng', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans text-left selection:bg-emerald-600 selection:text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 bg-white">
            <span className="text-2xl">🎧</span>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-0.5">
                CSKH & Phê Duyệt Portal
              </span>
            </div>
          </div>

          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Nghiệp vụ Chăm Sóc Khách Hàng
            </div>

            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActivePortalTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer select-none ${
                  activePortalTab === item.id 
                    ? 'bg-emerald-50 text-emerald-660' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-3xs shrink-0">
              CS
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Nhân viên CSKH'}</span>
              <span className="text-[10px] text-slate-400 font-semibold truncate">{user?.email || 'cs@zeromall.vn'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold text-xs rounded-md transition shadow-3xs cursor-pointer"
          >
            Đăng xuất CS Portal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-8 z-10 sticky top-0 shadow-3xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">CS Portal /</span>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {menuItems.find(m => m.id === activePortalTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHome}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-lg shadow-3xs"
            >
              <span>🏪</span> Xem giao diện Chợ ZeroMall
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {activePortalTab === 'SHOPS' && (
            <CsShopsTab
              shops={shops}
              filteredShops={filteredShops}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              loading={loading}
              actionLoadingId={actionLoadingId}
              handleApprove={handleApprove}
            />
          )}

          {activePortalTab === 'WITHDRAWALS' && (
            <CsWithdrawalsTab
              withdrawLoading={withdrawLoading}
              withdrawals={withdrawals}
              actionLoadingId={actionLoadingId}
              handleApproveWithdrawal={handleApproveWithdrawal}
            />
          )}

          {activePortalTab === 'DISPUTES' && (
            <CsDisputesTab
              disputesLoading={disputesLoading}
              disputes={disputes}
              refundDestinations={refundDestinations}
              setRefundDestinations={setRefundDestinations}
              actionLoadingId={actionLoadingId}
              handleAdminApproveDispute={handleAdminApproveDispute}
              handleAdminRejectDispute={handleAdminRejectDispute}
            />
          )}

          {activePortalTab === 'TICKETS' && (
            <CsTicketsTab
              tickets={tickets}
              handleResolveTicket={handleResolveTicket}
            />
          )}

          {activePortalTab === 'ORDERS' && (
            <CsOrdersTab
              orderSearchTerm={orderSearchTerm}
              setOrderSearchTerm={setOrderSearchTerm}
              allOrdersLoading={allOrdersLoading}
              filteredOrders={filteredOrders}
            />
          )}
        </main>
      </div>
    </div>
  )
}
