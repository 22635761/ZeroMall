import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UsersTab } from '../../components/admin/UsersTab'
import { ShopsTab } from '../../components/admin/ShopsTab'
import { CategoriesTab } from '../../components/admin/CategoriesTab'
import { ViolationsTab } from '../../components/admin/ViolationsTab'
import { PlatformVouchersTab } from '../../components/admin/PlatformVouchersTab'
import { FlashSaleTab } from '../../components/admin/FlashSaleTab'
import { CsStaffTab } from '../../components/admin/CsStaffTab'
import { SystemReportsTab } from '../../components/admin/SystemReportsTab'
import { CommissionSettingTab } from '../../components/admin/CommissionSettingTab'
import { AuditLogsTab } from '../../components/admin/AuditLogsTab'
import AdminPriceAnalyticsTab from '../../components/admin/AdminPriceAnalyticsTab'

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
  const [violations, setViolations] = useState<any[]>([])
  const [platformVouchers, setPlatformVouchers] = useState<any[]>([])
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [csStaff, setCsStaff] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [commissionRate, setCommissionRate] = useState<number>(5)
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
      case 'commission-setting': return 'COMMISSION_SETTING';
      case 'audit-logs': return 'AUDIT_LOGS';
      case 'price-analytics': return 'PRICE_ANALYTICS';
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
      case 'COMMISSION_SETTING': return 'commission-setting';
      case 'AUDIT_LOGS': return 'audit-logs';
      case 'PRICE_ANALYTICS': return 'price-analytics';
      default: return 'users';
    }
  }

  const [activePortalTab, setActivePortalTab] = useState<
    'USERS' | 'MANAGE_SHOPS' | 'CATEGORIES' | 'VIOLATIONS' | 'PLATFORM_VOUCHERS' | 'FLASH_SALE' | 'MANAGE_CS_STAFF' | 'SYSTEM_REPORTS' | 'AUDIT_LOGS' | 'COMMISSION_SETTING' | 'PRICE_ANALYTICS'
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

  const fetchCommissionRate = async () => {
    try {
      const res = await fetch('http://localhost:8000/payments/commission-rate')
      if (res.ok) {
        const data = await res.json()
        setCommissionRate(data.rate)
      }
    } catch (err) {
      console.error('Error fetching commission rate:', err)
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
      fetchCommissionRate()
    } else if (activePortalTab === 'COMMISSION_SETTING') {
      fetchCommissionRate()
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

  const menuItems = [
    { id: 'USERS', label: 'Quản lý User', icon: '👥' },
    { id: 'MANAGE_SHOPS', label: 'Quản lý & Khóa Shop', icon: '🏪' },
    { id: 'CATEGORIES', label: 'Quản lý danh mục', icon: '🗂️' },
    { id: 'VIOLATIONS', label: 'Sản phẩm vi phạm', icon: '🚫' },
    { id: 'PLATFORM_VOUCHERS', label: 'Voucher toàn sàn', icon: '🎟️' },
    { id: 'FLASH_SALE', label: 'Quản lý Flash Sale', icon: '⚡' },
    { id: 'MANAGE_CS_STAFF', label: 'Nhân viên Platform CS', icon: '🎧' },
    { id: 'SYSTEM_REPORTS', label: 'Báo cáo hệ thống', icon: '📊' },
    { id: 'PRICE_ANALYTICS', label: 'Biến động & Giá vốn', icon: '📈' },
    { id: 'COMMISSION_SETTING', label: 'Chiết khấu sàn', icon: '⚙️' },
    { id: 'AUDIT_LOGS', label: 'Lịch sử thao tác', icon: '📜' },
  ]

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
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Quản trị Portal
            </div>

            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActivePortalTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer select-none ${
                  activePortalTab === item.id 
                    ? 'bg-emerald-50 text-emerald-650' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Account Info */}
        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-xs shadow-3xs shrink-0">
              AD
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] text-slate-400 font-semibold truncate">{user?.email || 'admin@zeromall.vn'}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold text-xs rounded-md transition shadow-3xs cursor-pointer"
          >
            Đăng xuất portal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-8 z-10 sticky top-0 shadow-3xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trang quản trị /</span>
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

        {/* Content Container */}
        <main className="p-8 flex-1">
          {activePortalTab === 'USERS' && (
            <UsersTab users={users} fetchUsers={fetchUsers} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'MANAGE_SHOPS' && (
            <ShopsTab shops={shops} fetchShops={fetchShops} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'CATEGORIES' && (
            <CategoriesTab categories={categories} fetchCategories={fetchCategories} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'VIOLATIONS' && (
            <ViolationsTab violations={violations} fetchViolations={fetchViolations} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'PLATFORM_VOUCHERS' && (
            <PlatformVouchersTab platformVouchers={platformVouchers} fetchVouchers={fetchVouchers} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'FLASH_SALE' && (
            <FlashSaleTab flashSales={flashSales} fetchFlashSales={fetchFlashSales} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'MANAGE_CS_STAFF' && (
            <CsStaffTab csStaff={csStaff} fetchCsStaff={fetchCsStaff} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'SYSTEM_REPORTS' && (
            <SystemReportsTab allOrders={allOrders} users={users} commissionRate={commissionRate} />
          )}

          {activePortalTab === 'PRICE_ANALYTICS' && (
            <AdminPriceAnalyticsTab />
          )}

          {activePortalTab === 'COMMISSION_SETTING' && (
            <CommissionSettingTab commissionRate={commissionRate} setCommissionRate={setCommissionRate} triggerAuditLog={triggerAuditLog} />
          )}

          {activePortalTab === 'AUDIT_LOGS' && (
            <AuditLogsTab auditLogs={auditLogs} />
          )}
        </main>
      </div>
    </div>
  )
}
