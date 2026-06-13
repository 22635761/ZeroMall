import React, { useState } from 'react'
import { AddProductForm } from './AddProductForm'
import { ProductListTable } from './ProductListTable'

interface SellerPortalProps {
  user: any
  token: string | null
  onAuthSuccess: (user: any, token: string) => void
  onLogout: () => void
  onBackToHome: () => void
}

export const SellerPortal: React.FC<SellerPortalProps> = ({
  user,
  token,
  onAuthSuccess,
  onLogout,
  onBackToHome
}) => {
  // Page mode: 'dashboard' or 'auth'
  const isSeller = user && (user.role === 'SHOP_OWNER' || user.role === 'SHOP_STAFF')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Auth Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [shopName, setShopName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Sidebar Menu Navigation State
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [activeSubMenu, setActiveSubMenu] = useState('summary')

  // Products list and loading states
  const [productsList, setProductsList] = useState<any[]>([])
  const [productsLoading, setProductsLoading] = useState(false)

  // Fetch products from database
  const fetchProducts = async () => {
    if (!user?.shopId) return
    setProductsLoading(true)
    try {
      const response = await fetch(`http://localhost:3002/products?shopId=${user.shopId}`)
      if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm')
      const data = await response.json()
      
      const formattedProducts = data.map((p: any) => {
        let variationGroups = []
        let variationRows = []
        try {
          variationGroups = p.variationGroups ? JSON.parse(p.variationGroups) : []
        } catch (e) {
          console.error('Failed to parse variationGroups', e)
        }
        try {
          variationRows = p.variationRows ? JSON.parse(p.variationRows) : []
        } catch (e) {
          console.error('Failed to parse variationRows', e)
        }

        let parsedPrice: number | string = p.price
        if (/^\d+(\.\d+)?$/.test(p.price)) {
          parsedPrice = parseFloat(p.price)
        }

        return {
          ...p,
          price: parsedPrice,
          variationGroups,
          variationRows
        }
      })

      if (formattedProducts.length === 0) {
        await seedDefaultProducts()
      } else {
        setProductsList(formattedProducts)
      }
    } catch (err: any) {
      console.error('Error fetching products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  // Seed default mock products into PostgreSQL if the shop has zero products
  const seedDefaultProducts = async () => {
    if (!user?.shopId) return
    const defaultProducts = [
      {
        shopId: user.shopId,
        name: 'Điện thoại Apple iPhone 15 Pro Max 256GB - Hàng Chính Hãng',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&q=80',
        category: 'Điện Thoại & Phụ Kiện',
        brand: 'Apple',
        description: 'iPhone 15 Pro Max nổi bật với thiết kế khung Titanium cực nhẹ và bền bỉ, màn hình Dynamic Island, cổng kết nối USB-C tiện lợi và cụm camera zoom 5x đỉnh cao.',
        price: '29990000',
        stock: 50,
        sales: 124,
        status: 'active',
        sku: 'IP15PM-256-GRY',
        hasVariations: false,
        variationGroups: JSON.stringify([]),
        variationRows: JSON.stringify([]),
        weight: '300',
        condition: 'new',
        isPreOrder: false,
        preOrderDays: '7'
      },
      {
        shopId: user.shopId,
        name: 'Tai nghe Bluetooth chụp tai Sony WH-1000XM5 Chống Ồn Chủ Động',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
        category: 'Thiết Bị Điện Gia Dụng',
        brand: 'Sony',
        description: 'Sony WH-1000XM5 định nghĩa lại tiêu chuẩn chống ồn chủ động với bộ vi xử lý thông minh, thiết kế choàng đầu êm ái và chất âm đỉnh cao chi tiết.',
        price: '6490000',
        stock: 15,
        sales: 48,
        status: 'active',
        sku: 'SNY-WH1000XM5',
        hasVariations: false,
        variationGroups: JSON.stringify([]),
        variationRows: JSON.stringify([]),
        weight: '400',
        condition: 'new',
        isPreOrder: false,
        preOrderDays: '7'
      },
      {
        shopId: user.shopId,
        name: 'Bàn phím cơ không dây AKKO 3098B Multi-modes cực đẹp',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80',
        category: 'Máy Tính & Laptop',
        brand: 'AKKO',
        description: 'Bàn phím cơ AKKO 3098B hỗ trợ 3 chế độ kết nối, switch Akko chất lượng cao mang lại cảm giác gõ êm tai, hệ thống đèn nền RGB cực kỳ bắt mắt.',
        price: '1850000',
        stock: 0,
        sales: 89,
        status: 'active',
        sku: 'AKO-3098B-BLU',
        hasVariations: false,
        variationGroups: JSON.stringify([]),
        variationRows: JSON.stringify([]),
        weight: '1200',
        condition: 'new',
        isPreOrder: false,
        preOrderDays: '7'
      }
    ]

    try {
      for (const p of defaultProducts) {
        await fetch('http://localhost:3002/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p)
        })
      }
      
      const response = await fetch(`http://localhost:3002/products?shopId=${user.shopId}`)
      if (response.ok) {
        const data = await response.json()
        const formatted = data.map((p: any) => {
          let parsedPrice: number | string = p.price
          if (/^\d+(\.\d+)?$/.test(p.price)) {
            parsedPrice = parseFloat(p.price)
          }
          return {
            ...p,
            price: parsedPrice,
            variationGroups: p.variationGroups ? JSON.parse(p.variationGroups) : [],
            variationRows: p.variationRows ? JSON.parse(p.variationRows) : []
          }
        })
        setProductsList(formatted)
      }
    } catch (err) {
      console.error('Error seeding default products:', err)
    }
  }

  // Load products when user's shopId changes
  React.useEffect(() => {
    if (user?.shopId) {
      fetchProducts()
    } else {
      setProductsList([])
    }
  }, [user?.shopId])

  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // CRUD API Handlers
  const handleAddProductSuccess = async (productData: any) => {
    if (!user?.shopId) return
    setProductsLoading(true)
    try {
      const isEdit = !!editingProduct
      const url = isEdit 
        ? `http://localhost:3002/products/${editingProduct.id}`
        : `http://localhost:3002/products`
      const method = isEdit ? 'PUT' : 'POST'
      
      const payload = {
        shopId: user.shopId,
        name: productData.name,
        image: productData.image,
        category: productData.category,
        brand: productData.brand,
        description: productData.description,
        price: String(productData.price),
        stock: productData.stock,
        sales: productData.sales ?? 0,
        status: productData.status,
        sku: productData.sku,
        variationsText: productData.variationsText,
        hasVariations: productData.hasVariations,
        variationGroups: productData.variationGroups ? JSON.stringify(productData.variationGroups) : JSON.stringify([]),
        variationRows: productData.variationRows ? JSON.stringify(productData.variationRows) : JSON.stringify([]),
        weight: productData.weight,
        length: productData.length,
        width: productData.width,
        height: productData.height,
        condition: productData.condition,
        isPreOrder: productData.isPreOrder,
        preOrderDays: String(productData.preOrderDays || '7')
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Không thể lưu sản phẩm vào cơ sở dữ liệu')
      
      await fetchProducts()
      setEditingProduct(null)
      selectSubMenu('products', 'all-products')
    } catch (err: any) {
      alert(`Lỗi khi lưu sản phẩm: ${err.message}`)
    } finally {
      setProductsLoading(false)
    }
  }

  const handleProductDelete = async (productId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/products/${productId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Không thể xóa sản phẩm')
      await fetchProducts()
    } catch (err: any) {
      alert(`Lỗi khi xóa sản phẩm: ${err.message}`)
    }
  }

  const handleProductToggleStatus = async (productId: string) => {
    try {
      const response = await fetch(`http://localhost:3002/products/${productId}/toggle-status`, {
        method: 'PUT'
      })
      if (!response.ok) throw new Error('Không thể cập nhật trạng thái sản phẩm')
      await fetchProducts()
    } catch (err: any) {
      alert(`Lỗi khi cập nhật trạng thái: ${err.message}`)
    }
  }

  const handleProductEdit = (product: any) => {
    setEditingProduct(product)
    selectSubMenu('products', 'add-product')
  }

  const handleProductCancel = () => {
    setEditingProduct(null)
    selectSubMenu('products', 'all-products')
  }

  // Use token parameter for future authorization integration
  React.useEffect(() => {
    if (token) {
      console.log('Seller token loaded.');
    }
  }, [token])

  // Auth submits
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const endpoint = authMode === 'login' ? 'login' : 'register'
    const payload = authMode === 'login'
      ? { email, password }
      : { 
          email, 
          password, 
          name, 
          role: 'SHOP_OWNER', // Mặc định đăng ký kênh người bán là SHOP_OWNER
          shopName 
        }

    try {
      const response = await fetch(`http://localhost:3001/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Đã có lỗi xảy ra.')
      }

      if (authMode === 'login') {
        if (data.user.role !== 'SHOP_OWNER' && data.user.role !== 'SHOP_STAFF') {
          throw new Error('Tài khoản của bạn không phải là Chủ shop hoặc Nhân viên shop!')
        }
        onAuthSuccess(data.user, data.accessToken)
      } else {
        setSuccess('Đăng ký Kênh Người Bán thành công! Đang chuyển sang Đăng nhập...')
        setTimeout(() => {
          setAuthMode('login')
          setError(null)
          setSuccess(null)
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // If not a Seller, show authentication page
  if (!isSeller) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans">
        {/* Simple Header */}
        <header className="bg-white border-b border-slate-200/80 py-4 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
              <span className="text-2xl">🌱</span>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span> <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
              </span>
            </div>
            <button 
              onClick={onBackToHome}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5 cursor-pointer"
            >
              🏠 Quay lại Trang Chủ
            </button>
          </div>
        </header>

        {/* Auth Forms */}
        <main className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200/60 flex flex-col justify-between">
            {/* Mode selection */}
            <div className="flex border-b border-slate-100 relative">
              <button 
                onClick={() => { setAuthMode('login'); setError(null); }}
                className={`flex-1 py-4 text-center font-bold text-sm transition-all cursor-pointer ${
                  authMode === 'login' ? 'text-emerald-600 bg-slate-55/20' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Đăng Nhập Người Bán
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setError(null); }}
                className={`flex-1 py-4 text-center font-bold text-sm transition-all cursor-pointer ${
                  authMode === 'register' ? 'text-emerald-600 bg-slate-55/20' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Đăng Ký Bán Hàng
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="p-6 space-y-4 text-left">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg text-xs font-semibold">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-3 rounded-r-lg text-xs font-semibold">
                  ✅ {success}
                </div>
              )}

              {authMode === 'register' && (
                <>
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ và Tên</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập họ và tên của bạn..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>

                  {/* Shop Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên Shop Của Bạn</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Shop Gia Dụng ABC..."
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    />
                  </div>
                </>
              )}

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Đăng Nhập</label>
                <input 
                  type="email" 
                  required
                  placeholder="seller@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold text-sm shadow-md transition duration-150 mt-6 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : (authMode === 'login' ? 'Đăng Nhập Kênh Người Bán' : 'Đăng Ký & Tạo Shop')}
              </button>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 rounded-b-3xl">
              Đăng ký bán hàng cực nhanh, quản lý đơn hàng & sản phẩm tức thì.
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
          © 2026 ZeroMall Seller Centre. Hệ Thống Quản Lý Bán Hàng Chuyên Nghiệp.
        </footer>
      </div>
    )
  }

  // --- SELLER DASHBOARD VIEW ---
  // Menu items from the mockup image
  const menuConfig = [
    {
      id: 'orders',
      title: 'Quản Lý Đơn Hàng',
      icon: '📋',
      subMenus: [
        { id: 'all-orders', title: 'Tất cả' },
        { id: 'bulk-delivery', title: 'Giao Hàng Loạt' },
        { id: 'cancelled-orders', title: 'Đơn Hủy' },
        { id: 'refunds', title: 'Trả Hàng/Hoàn Tiền' },
        { id: 'shipping-settings', title: 'Cài Đặt Vận Chuyển' }
      ]
    },
    {
      id: 'products',
      title: 'Quản Lý Sản Phẩm',
      icon: '📦',
      subMenus: [
        { id: 'all-products', title: 'Tất Cả Sản Phẩm' },
        { id: 'add-product', title: 'Thêm Sản Phẩm' }
      ]
    },
    {
      id: 'marketing',
      title: 'Kênh Marketing',
      icon: '🏷️',
      subMenus: [
        { id: 'marketing-channel', title: 'Kênh Marketing' },
        { id: 'cheap-bid', title: 'Đấu Giá Rẻ Vô Địch', badge: 'New' },
        { id: 'shopee-ads', title: 'Quảng Cáo Shopee' },
        { id: 'kol-boost', title: 'Tăng Đơn Cùng KOL' },
        { id: 'live-video', title: 'Live & Video' },
        { id: 'shop-promos', title: 'Khuyến Mãi của Shop' },
        { id: 'shop-flashsale', title: 'Flash Sale Của Shop' },
        { id: 'shop-vouchers', title: 'Mã Giảm Giá Của Shop' },
        { id: 'platform-events', title: 'Chương Trình Shopee' }
      ]
    },
    {
      id: 'support',
      title: 'Chăm sóc khách hàng',
      icon: '💬',
      subMenus: [
        { id: 'chat-mgmt', title: 'Quản lý Chat' },
        { id: 'reviews-mgmt', title: 'Quản lý Đánh Giá' }
      ]
    },
    {
      id: 'finance',
      title: 'Tài Chính',
      icon: '💳',
      subMenus: [
        { id: 'revenue', title: 'Doanh Thu' },
        { id: 'balance', title: 'Số dư TK Shopee' },
        { id: 'bank-accounts', title: 'Tài Khoản Ngân Hàng' }
      ]
    }
  ]

  const selectSubMenu = (menuId: string, subMenuId: string) => {
    setActiveMenu(menuId)
    setActiveSubMenu(subMenuId)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans text-left">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 z-40 sticky top-0 shadow-3xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
          <span className="text-2xl">🌱</span>
          <span className="text-lg font-black tracking-tight text-slate-800">
            Zero<span className="text-emerald-600">Mall</span> 
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-sm ml-2.5">
              SELLER CENTRE
            </span>
          </span>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg"
          >
            🛒 Về Trang Mua Sắm
          </button>
          
          <span className="text-slate-200">|</span>

          {/* Shop and User profile info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 shadow-3xs">
              🏪
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-700 leading-tight">Shop của {user.name}</p>
              <p className="text-[10px] text-slate-400 capitalize font-semibold mt-0.5">{user.role === 'SHOP_OWNER' ? 'Chủ Shop' : 'Nhân Viên CSKH'}</p>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
          >
            Đăng Xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Menu */}
        <aside className="w-64 bg-white border-r border-slate-200/80 overflow-y-auto z-10 select-none shrink-0 flex flex-col justify-between">
          <div className="divide-y divide-slate-100">
            
            {/* Overview / Dashboard Tab */}
            <div className="p-2">
              <button 
                onClick={() => selectSubMenu('dashboard', 'summary')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeMenu === 'dashboard' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>📊</span> Tổng quan Shop
              </button>
            </div>

            {/* Sidebar menu groups */}
            {menuConfig.map((menu) => (
              <div key={menu.id} className="p-3 space-y-1 text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 flex items-center gap-1.5">
                  <span>{menu.icon}</span> {menu.title}
                </span>
                
                <div className="space-y-0.5 pt-1">
                  {menu.subMenus.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => selectSubMenu(menu.id, sub.id)}
                      className={`w-full text-left px-7 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                        activeMenu === menu.id && activeSubMenu === sub.id
                          ? 'bg-slate-100 text-emerald-600 font-bold'
                          : sub.id === 'bank-accounts'
                            ? 'text-[#ee4d2d] hover:bg-slate-50'
                            : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{sub.title}</span>
                      {sub.badge && (
                        <span className="bg-red-55 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full scale-90 uppercase">
                          {sub.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
            Đăng nhập: {user.email}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Active Title Banner */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <nav className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>Kênh Người Bán</span>
                <span>/</span>
                <span>{activeMenu === 'dashboard' ? 'Tổng quan' : menuConfig.find(m => m.id === activeMenu)?.title}</span>
              </nav>
              <h1 className="text-xl font-black text-slate-800 mt-1">
                {activeMenu === 'dashboard' 
                  ? 'Tổng Quan Cửa Hàng'
                  : activeMenu === 'products' && activeSubMenu === 'add-product' && editingProduct
                    ? 'Cập Nhật Sản Phẩm'
                    : menuConfig.find(m => m.id === activeMenu)?.subMenus.find(s => s.id === activeSubMenu)?.title}
              </h1>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              ID Shop: {user.shopId || 'Đang cấp'}
            </span>
          </div>

          {/* DYNAMIC CONTENT CONTAINER */}
          {activeMenu === 'products' && activeSubMenu === 'add-product' ? (
            <AddProductForm
              initialData={editingProduct}
              onSuccess={(newProduct) => handleAddProductSuccess(newProduct)}
              onCancel={handleProductCancel}
            />
          ) : activeMenu === 'products' && activeSubMenu === 'all-products' ? (
            productsLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách sản phẩm từ hệ thống...</p>
              </div>
            ) : (
              <ProductListTable
                products={productsList}
                onEdit={handleProductEdit}
                onDelete={handleProductDelete}
                onToggleStatus={handleProductToggleStatus}
                onAddNew={() => {
                  setEditingProduct(null)
                  selectSubMenu('products', 'add-product')
                }}
              />
            )
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm min-h-[450px]">
              {activeMenu === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Stats Summary cards */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Phân Tích Bán Hàng</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Doanh số</p>
                        <p className="text-lg font-black text-emerald-600 mt-1">0đ</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hôm nay: -% so với hôm qua</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Đơn hàng</p>
                        <p className="text-lg font-black text-slate-700 mt-1">0</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hôm nay: -% so với hôm qua</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Tỷ lệ chuyển đổi</p>
                        <p className="text-lg font-black text-slate-700 mt-1">0.0%</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hôm nay: -% so với hôm qua</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Lượt truy cập</p>
                        <p className="text-lg font-black text-slate-700 mt-1">0</p>
                        <p className="text-[9px] text-slate-400 mt-1">Hôm nay: -% so với hôm qua</p>
                      </div>
                    </div>
                  </div>

                  {/* To do list */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Danh Sách Việc Cần Làm</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="bg-slate-50/50 border border-slate-100 hover:bg-slate-50 p-4 rounded-xl cursor-pointer transition">
                        <p className="text-lg font-bold text-emerald-600">0</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Chờ Xác Nhận</p>
                      </div>
                      <div className="bg-slate-50/50 border border-slate-100 hover:bg-slate-50 p-4 rounded-xl cursor-pointer transition">
                        <p className="text-lg font-bold text-emerald-600">0</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Chờ Lấy Hàng</p>
                      </div>
                      <div className="bg-slate-50/50 border border-slate-100 hover:bg-slate-50 p-4 rounded-xl cursor-pointer transition">
                        <p className="text-lg font-bold text-emerald-600">0</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Đã Xử Lý</p>
                      </div>
                      <div className="bg-slate-50/50 border border-slate-100 hover:bg-slate-50 p-4 rounded-xl cursor-pointer transition">
                        <p className="text-lg font-bold text-emerald-600">0</p>
                        <p className="text-[10px] text-slate-500 font-bold mt-1">Đơn Hủy</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state or placeholders for menus */}
              {activeMenu !== 'dashboard' && (
                <div className="flex flex-col items-center justify-center min-h-[350px] text-center space-y-4 animate-in fade-in duration-200">
                  <span className="text-5xl">🛠️</span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Tính Năng Đang Phát Triển</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Chức năng <strong className="text-emerald-600">{
                        menuConfig.find(m => m.id === activeMenu)?.subMenus.find(s => s.id === activeSubMenu)?.title
                      }</strong> đang được tích hợp kết nối Database thật của ZeroMall. Vui lòng quay lại sau!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
