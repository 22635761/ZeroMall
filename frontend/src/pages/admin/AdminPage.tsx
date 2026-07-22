import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

interface AdminPageProps {
  user: any
  onLogout: () => void
  onBackToHome: () => void
}

export const AdminPage: React.FC<AdminPageProps> = ({
  user,
  onLogout,
  onBackToHome
}) => {
  const [shops, setShops] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [violations, setViolations] = useState<any[]>([])
  const [platformVouchers, setPlatformVouchers] = useState<any[]>([])
  const [newVoucherCode, setNewVoucherCode] = useState('')
  const [newVoucherDiscount, setNewVoucherDiscount] = useState(0)
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [csStaff, setCsStaff] = useState<any[]>([])
  const [newCsName, setNewCsName] = useState('')
  const [newCsEmail, setNewCsEmail] = useState('')
  const [newCsPassword, setNewCsPassword] = useState('')
  const [showAddCsModal, setShowAddCsModal] = useState(false)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [searchParams, setSearchParams] = useSearchParams()

  const getTabFromParam = (param: string | null): any => {
    if (!param) return null;
    switch (param.toLowerCase()) {
      case 'users': return 'USERS';
      case 'manage-shops': return 'MANAGE_SHOPS';
      case 'categories': return 'CATEGORIES';
      case 'violations': return 'VIOLATIONS';
      case 'vouchers': return 'PLATFORM_VOUCHERS';
      case 'flash-sale': return 'FLASH_SALE';
      case 'cs-staff': return 'MANAGE_CS_STAFF';
      case 'reports': return 'SYSTEM_REPORTS';
      case 'audit-logs': return 'AUDIT_LOGS';
      default: return null;
    }
  }

  const getParamFromTab = (tab: string): string => {
    switch (tab) {
      case 'USERS': return 'users';
      case 'MANAGE_SHOPS': return 'manage-shops';
      case 'CATEGORIES': return 'categories';
      case 'VIOLATIONS': return 'violations';
      case 'PLATFORM_VOUCHERS': return 'vouchers';
      case 'FLASH_SALE': return 'flash-sale';
      case 'MANAGE_CS_STAFF': return 'cs-staff';
      case 'SYSTEM_REPORTS': return 'reports';
      case 'AUDIT_LOGS': return 'audit-logs';
      default: return 'users';
    }
  }

  const [activePortalTab, setActivePortalTab] = useState<
    'USERS' | 'MANAGE_SHOPS' | 'CATEGORIES' | 'VIOLATIONS' | 'PLATFORM_VOUCHERS' | 'FLASH_SALE' | 'MANAGE_CS_STAFF' | 'SYSTEM_REPORTS' | 'AUDIT_LOGS'
  >(() => {
    const searchParamsLocal = new URLSearchParams(window.location.search);
    const param = searchParamsLocal.get('tab');
    if (param) {
      const parsed = getTabFromParam(param);
      if (parsed) return parsed;
    }
    return 'USERS';
  })

  const triggerAuditLog = async (action: string) => {
    try {
      await fetch('http://localhost:8000/auth/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: user?.email || 'Unknown Admin', action })
      })
    } catch (err) {
      console.error(err)
    }
  }

  const fetchShops = async () => {
    try {
      const response = await fetch(`http://localhost:8000/auth/shops`)
      if (!response.ok) throw new Error('Không thể tải danh sách cửa hàng')
      const data = await response.json()
      setShops(data)
    } catch (err: any) {
      console.error(err)
    }
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

  const fetchAllOrders = async () => {
    try {
      const response = await fetch('http://localhost:8000/orders')
      if (response.ok) {
        const data = await response.json()
        setAllOrders(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (activePortalTab === 'MANAGE_SHOPS') {
      fetchShops()
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
  }, [activePortalTab])

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

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans text-left selection:bg-emerald-600 selection:text-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-20">
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3 bg-white">
            <span className="text-2xl">🛡️</span>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-0.5">
                Admin Control
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">QUẢN TRỊ VIÊN SÀN</p>
            
            <button
              onClick={() => setActivePortalTab('USERS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'USERS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">👥</span>
              <span>Quản lý User</span>
            </button>

            <button
              onClick={() => setActivePortalTab('MANAGE_SHOPS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'MANAGE_SHOPS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🏪</span>
              <span>Quản lý & Khóa Shop</span>
            </button>

            <button
              onClick={() => setActivePortalTab('CATEGORIES')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'CATEGORIES' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🗂️</span>
              <span>Quản lý Danh Mục</span>
            </button>

            <button
              onClick={() => setActivePortalTab('VIOLATIONS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'VIOLATIONS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🚫</span>
              <span>Sản Phẩm Vi Phạm</span>
            </button>

            <button
              onClick={() => setActivePortalTab('PLATFORM_VOUCHERS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'PLATFORM_VOUCHERS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🎟️</span>
              <span>Voucher Toàn Sàn</span>
            </button>

            <button
              onClick={() => setActivePortalTab('FLASH_SALE')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'FLASH_SALE' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">⚡</span>
              <span>Quản Lý Flash Sale</span>
            </button>

            <button
              onClick={() => setActivePortalTab('MANAGE_CS_STAFF')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'MANAGE_CS_STAFF' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">🎧</span>
              <span>Nhân viên Platform CS</span>
            </button>

            <button
              onClick={() => setActivePortalTab('SYSTEM_REPORTS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'SYSTEM_REPORTS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">📊</span>
              <span>Báo Cáo Hệ Thống</span>
            </button>

            <button
              onClick={() => setActivePortalTab('AUDIT_LOGS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                activePortalTab === 'AUDIT_LOGS' ? 'bg-emerald-50 text-emerald-650' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-[14px]">📜</span>
              <span>Log Thao Tác</span>
            </button>
          </nav>
        </div>

        {/* Account footer */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-3xs shrink-0">
              🛡️
            </div>
            <div className="text-xs overflow-hidden">
              <p className="font-extrabold text-slate-850 truncate leading-tight">{user?.name || 'Admin ZeroMall'}</p>
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
            <span>🛡️ Quản trị viên</span>
            <span>/</span>
            <span className="text-slate-700">
              {activePortalTab === 'USERS' ? 'Quản lý User'
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
          
          {/* TAB: USERS */}
          {activePortalTab === 'USERS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">👥 Quản lý người dùng hệ thống</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Mã User</th>
                      <th className="pb-3">Họ và Tên</th>
                      <th className="pb-3">Email liên hệ</th>
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
                            u.role === 'ADMIN' ? 'bg-red-50 text-red-655' : 
                            u.role === 'PLATFORM_SUPPORT' ? 'bg-indigo-50 text-indigo-655' :
                            u.role === 'SHOP_OWNER' ? 'bg-blue-50 text-blue-655' : 'bg-slate-50 text-slate-655'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650' : 'bg-rose-50 text-rose-650'
                          }`}>
                            {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đang bị khóa'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          {u.role !== 'ADMIN' && (
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
                                    await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản "${u.email}"`)
                                    fetchUsers()
                                    alert('Cập nhật trạng thái người dùng thành công!')
                                  }
                                } catch (e: any) {
                                  alert(e.message)
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer border ${
                                u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100 hover:bg-emerald-100'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Khóa TK' : 'Mở Khóa'}
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

          {/* TAB: MANAGE SHOPS */}
          {activePortalTab === 'MANAGE_SHOPS' && (
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
                        <td className="py-3.5 font-mono text-[10px]">{s.id}</td>
                        <td className="py-3.5 font-black text-slate-850">{s.name}</td>
                        <td className="py-3.5 font-mono text-[10px]">{s.ownerId}</td>
                        <td className="py-3.5">{s.phoneNumber || 'N/A'}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            s.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                            s.status === 'BLOCKED' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-655'
                          }`}>
                            {s.status === 'APPROVED' ? 'Đang hoạt động' : 
                             s.status === 'BLOCKED' ? 'Đang bị Khóa' : s.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={async () => {
                              const newStatus = s.status === 'APPROVED' ? 'BLOCKED' : 'APPROVED'
                              try {
                                const res = await fetch(`http://localhost:8000/auth/shops/${s.id}/approve`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: newStatus })
                                })
                                if (res.ok) {
                                  await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} cửa hàng "${s.name}"`)
                                  fetchShops()
                                  alert('Cập nhật trạng thái shop thành công!')
                                }
                              } catch (e: any) {
                                alert(e.message)
                              }
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer border ${
                              s.status === 'APPROVED' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100 hover:bg-emerald-100'
                            }`}
                          >
                            {s.status === 'APPROVED' ? 'Khóa Cửa Hàng' : 'Mở Khóa Cửa Hàng'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activePortalTab === 'CATEGORIES' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">🗂️ Quản lý danh mục sản phẩm</h3>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: VIOLATIONS */}
          {activePortalTab === 'VIOLATIONS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">🚫 Kiểm duyệt sản phẩm vi phạm</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Sản phẩm</th>
                      <th className="pb-3">Shop bán</th>
                      <th className="pb-3 text-right">Lượt Report</th>
                      <th className="pb-3">Lý do vi phạm</th>
                      <th className="pb-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {violations.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/10">
                        <td className="py-3.5 flex items-center gap-3">
                          {p.image && <img src={p.image} className="w-10 h-10 object-cover rounded-lg border border-slate-100 shadow-3xs" />}
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800 leading-snug">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{p.id}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-[10px]">{p.shopId}</td>
                        <td className="py-3.5 text-right font-black text-rose-600">{p.reportsCount}</td>
                        <td className="py-3.5 font-semibold text-slate-650 max-w-xs truncate">{p.violationReason || 'N/A'}</td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={async () => {
                                if (window.confirm('Bỏ qua tất cả cảnh báo vi phạm của sản phẩm này?')) {
                                  try {
                                    const res = await fetch(`http://localhost:8000/products/violations/${p.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isViolated: false })
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`Bỏ qua cảnh báo vi phạm cho sản phẩm ID ${p.id}`)
                                      fetchViolations()
                                      alert('Đã bỏ qua cảnh báo thành công!')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded font-bold text-[10px] cursor-pointer border border-emerald-100"
                            >
                              Bỏ qua
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Gỡ bỏ vĩnh viễn sản phẩm này khỏi hệ thống ZeroMall?')) {
                                  try {
                                    const res = await fetch(`http://localhost:8000/products/${p.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (res.ok) {
                                      await triggerAuditLog(`Xóa vĩnh viễn sản phẩm vi phạm ID ${p.id}`)
                                      fetchViolations()
                                      alert('Đã gỡ bỏ sản phẩm thành công!')
                                    }
                                  } catch (err: any) {
                                    alert(err.message)
                                  }
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                            >
                              Gỡ bỏ
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PLATFORM VOUCHERS */}
          {activePortalTab === 'PLATFORM_VOUCHERS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎟️ Quản lý Voucher toàn sàn</h3>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Mã Voucher (Ví dụ: ZERO50)..."
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                  />
                  <input
                    type="number"
                    placeholder="Số tiền giảm (đ)..."
                    value={newVoucherDiscount}
                    onChange={(e) => setNewVoucherDiscount(Number(e.target.value))}
                    className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden w-28"
                  />
                  <button
                    onClick={async () => {
                      if (!newVoucherCode.trim() || newVoucherDiscount <= 0) return
                      try {
                        const res = await fetch('http://localhost:8000/discounts?shopId=PLATFORM', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            code: newVoucherCode,
                            value: newVoucherDiscount,
                            minSpend: 0,
                            usageLimit: 1000,
                            startDate: new Date().toISOString(),
                            endDate: new Date(Date.now() + 86400000 * 30).toISOString()
                          })
                        })
                        if (res.ok) {
                          await triggerAuditLog(`Tạo voucher toàn sàn mới "${newVoucherCode}" giảm ${newVoucherDiscount}đ`)
                          fetchVouchers()
                          setNewVoucherCode('')
                          setNewVoucherDiscount(0)
                          alert('Tạo voucher toàn sàn thành công!')
                        }
                      } catch (err: any) {
                        alert(err.message)
                      }
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                  >
                    Tạo Voucher
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Mã Code</th>
                      <th className="pb-3 text-right">Giá Trị Giảm</th>
                      <th className="pb-3 text-right">Lượt Dùng</th>
                      <th className="pb-3">Hạn sử dụng</th>
                      <th className="pb-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {platformVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/10">
                        <td className="py-3.5 font-mono font-black text-slate-800">{v.code}</td>
                        <td className="py-3.5 text-right font-bold text-emerald-600">-{Number(v.value).toLocaleString('vi-VN')}đ</td>
                        <td className="py-3.5 text-right font-semibold text-slate-700">{v.usedCount || 0} / {v.usageLimit}</td>
                        <td className="py-3.5 font-semibold text-slate-500">{new Date(v.endDate).toLocaleDateString('vi-VN')}</td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Xóa voucher "${v.code}"?`)) {
                                try {
                                  const res = await fetch(`http://localhost:8000/discounts/${v.id}`, {
                                    method: 'DELETE'
                                  })
                                  if (res.ok) {
                                    await triggerAuditLog(`Xóa voucher toàn sàn "${v.code}"`)
                                    fetchVouchers()
                                    alert('Đã xóa voucher thành công!')
                                  }
                                } catch (err: any) {
                                  alert(err.message)
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FLASH SALE */}
          {activePortalTab === 'FLASH_SALE' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">⚡ Cấu hình giờ vàng Flash Sale</h3>
                <button
                  onClick={async () => {
                    const slot = window.prompt('Nhập khung giờ Flash Sale (ví dụ: 16:00 - 18:00)')
                    if (!slot) return
                    try {
                      const res = await fetch('http://localhost:8000/products/flash-sales', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ timeSlot: slot })
                      })
                      if (res.ok) {
                        await triggerAuditLog(`Tạo khung giờ Flash Sale mới "${slot}"`)
                        fetchFlashSales()
                        alert('Đã tạo khung giờ Flash Sale mới!')
                      }
                    } catch (err: any) {
                      alert(err.message)
                    }
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
                >
                  + Thêm khung giờ
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Mã ID</th>
                      <th className="pb-3">Khung Giờ Vàng</th>
                      <th className="pb-3 text-right">Lượt Sản Phẩm Đăng Ký</th>
                      <th className="pb-3">Trạng thái hoạt động</th>
                      <th className="pb-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {flashSales.map(slot => (
                      <tr key={slot.id} className="hover:bg-slate-50/10">
                        <td className="py-3.5 font-mono text-[10px]">{slot.id}</td>
                        <td className="py-3.5 font-black text-slate-850">{slot.timeSlot}</td>
                        <td className="py-3.5 text-right font-black text-slate-750">{slot.productsCount}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            slot.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-650' : 
                            slot.status === 'ENDED' ? 'bg-slate-50 text-slate-655' : 'bg-amber-50 text-amber-655'
                          }`}>
                            {slot.status === 'RUNNING' ? 'ĐANG CHẠY' : 
                             slot.status === 'ENDED' ? 'ĐÃ KẾT THÚC' : 'SẮP DIỄN RA'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex justify-center">
                            <select
                              value={slot.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value
                                try {
                                  const res = await fetch(`http://localhost:8000/products/flash-sales/${slot.id}/status`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: newStatus })
                                  })
                                  if (res.ok) {
                                    await triggerAuditLog(`Cập nhật trạng thái Flash Sale ID ${slot.id} thành ${newStatus}`)
                                    fetchFlashSales()
                                    alert('Cập nhật trạng thái Flash Sale thành công!')
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
          )}

          {/* TAB: MANAGE CS STAFF */}
          {activePortalTab === 'MANAGE_CS_STAFF' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎧 Quản lý nhân viên Platform CS</h3>
                <button
                  onClick={() => setShowAddCsModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Thêm nhân viên mới
                </button>
              </div>

              {/* MODAL THÊM NHÂN VIÊN */}
              {showAddCsModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform scale-100 transition-all text-left">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xs font-black text-slate-850 uppercase flex items-center gap-2">
                        <span>🎧</span> Thêm nhân viên CSKH mới
                      </h3>
                      <button
                        onClick={() => {
                          setShowAddCsModal(false);
                          setNewCsName('');
                          setNewCsEmail('');
                          setNewCsPassword('');
                        }}
                        className="text-slate-400 hover:text-slate-650 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Họ và Tên</label>
                        <input
                          type="text"
                          placeholder="Nhập họ tên nhân viên..."
                          value={newCsName}
                          onChange={(e) => setNewCsName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Email liên hệ</label>
                        <input
                          type="email"
                          placeholder="Nhập email đăng nhập..."
                          value={newCsEmail}
                          onChange={(e) => setNewCsEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
                        <input
                          type="password"
                          placeholder="Tạo mật khẩu cho tài khoản..."
                          value={newCsPassword}
                          onChange={(e) => setNewCsPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowAddCsModal(false);
                          setNewCsName('');
                          setNewCsEmail('');
                          setNewCsPassword('');
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300/80 text-slate-755 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Hủy bỏ
                      </button>
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
                              setShowAddCsModal(false)
                              alert('Đã thêm nhân viên CSKH thành công!')
                            } else {
                              const errData = await res.json()
                              alert('Lỗi thêm nhân viên CS: ' + (errData.message || 'Không xác định'))
                            }
                          } catch (err: any) {
                            alert(err.message)
                          }
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs transition-colors"
                      >
                        Xác nhận tạo
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
          )}

          {/* TAB: SYSTEM REPORTS */}
          {activePortalTab === 'SYSTEM_REPORTS' && (() => {
            const totalGMV = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
            const orderCount = allOrders.length
            const userCount = users.length
            const refundCount = allOrders.filter(o => o.status === 'REFUNDED' || o.status === 'RETURNED' || o.status === 'RETURN_PENDING').length
            const refundRate = orderCount > 0 ? ((refundCount / orderCount) * 100).toFixed(1) : '0.0'

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng GMV Toàn Sàn</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">{totalGMV.toLocaleString('vi-VN')}đ</p>
                    <p className="text-[9px] text-slate-450 mt-1">Doanh số tích lũy thực tế</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng Số Đơn Hàng</p>
                    <p className="text-2xl font-black text-slate-700 mt-1">{orderCount}</p>
                    <p className="text-[9px] text-slate-450 mt-1">Đơn hàng phát sinh trong DB</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng Thành Viên</p>
                    <p className="text-2xl font-black text-slate-700 mt-1">{userCount}</p>
                    <p className="text-[9px] text-slate-450 mt-1">Người dùng đã đăng ký thật</p>
                  </div>
                  <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
                    <p className="text-[10px] text-rose-500 font-bold uppercase">Tỷ Lệ Trả Hàng Hoàn Tiền</p>
                    <p className="text-2xl font-black text-rose-550 mt-1">{refundRate}%</p>
                    <p className="text-[9px] text-slate-450 mt-1">Dựa trên đơn hoàn/tổng đơn</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* TAB: AUDIT LOGS */}
          {activePortalTab === 'AUDIT_LOGS' && (
            <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase">📜 Nhật ký lịch sử thao tác hệ thống</h3>
              <div className="overflow-y-auto max-h-[500px]">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="pb-3">Thời gian</th>
                      <th className="pb-3">Người thực hiện</th>
                      <th className="pb-3">Hành động thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/10">
                        <td className="py-3 font-mono text-[10px] text-slate-500">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 font-bold text-slate-755">{log.user}</td>
                        <td className="py-3 font-semibold text-slate-655">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
