import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SellerAuthForm } from '../../components/seller/SellerAuthForm'
import { ShopApprovalStatus } from '../../components/seller/ShopApprovalStatus'
import { SellerSidebar } from '../../components/seller/SellerSidebar'
import { AddProductForm } from '../../components/seller/AddProductForm'
import { ProductListTable } from '../../components/seller/ProductListTable'
import { ShopOnboarding } from '../../components/seller/ShopOnboarding'
import { ShopVouchers } from '../../components/seller/ShopVouchers'
import { ShopFlashSale } from '../../components/seller/ShopFlashSale'
import { ShopOrders } from '../../components/seller/ShopOrders'
import { ShopWallet } from '../../components/seller/ShopWallet'
import { ShopRevenue } from '../../components/seller/ShopRevenue'
import { ShopBankAccounts } from '../../components/seller/ShopBankAccounts'

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
  const isSeller = user && (user.role === 'SHOP_OWNER' || user.role === 'SHOP_STAFF')

  // Sidebar Menu Navigation State (Synced with URL Query Params)
  const [searchParams, setSearchParams] = useSearchParams()

  const activeMenu = searchParams.get('menu') || searchParams.get('tab') || 'dashboard'
  const activeSubMenu = searchParams.get('sub') || (
    activeMenu === 'dashboard' ? 'summary' :
    activeMenu === 'products' ? 'all-products' :
    activeMenu === 'orders' ? 'all-orders' :
    activeMenu === 'marketing' ? 'shop-flashsale' :
    activeMenu === 'finance' ? 'revenue' : 'chat-mgmt'
  )

  // Products list and loading states
  const [productsList, setProductsList] = useState<any[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [loadedShopName, setLoadedShopName] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)

  // Shop details and onboarding status
  const [shopDetails, setShopDetails] = useState<any>(null)
  const [shopLoading, setShopLoading] = useState(true)

  const fetchShopDetails = async () => {
    if (!user?.shopId) {
      setShopDetails(null)
      setShopLoading(false)
      return
    }
    setShopLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/auth/shops/${user.shopId}`)
      if (!response.ok) throw new Error('Không thể tải thông tin cửa hàng')
      const data = await response.json()
      setShopDetails(data)
      setLoadedShopName(data.name)
    } catch (err: any) {
      console.error('Error fetching shop details:', err)
      setShopDetails(null)
      setLoadedShopName(null)
    } finally {
      setShopLoading(false)
    }
  }

  // Fetch products from database
  const fetchProducts = async () => {
    if (!user?.shopId) return
    setProductsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/products?shopId=${user.shopId}`)
      if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm')
      const data = await response.json()
      
      const formattedProducts = data.map((p: any) => {
        let variationGroups = []
        let variationRows = []
        try { variationGroups = p.variationGroups ? JSON.parse(p.variationGroups) : [] } catch (e) {}
        try { variationRows = p.variationRows ? JSON.parse(p.variationRows) : [] } catch (e) {}
        let parsedPrice = /^\d+(\.\d+)?$/.test(p.price) ? parseFloat(p.price) : p.price
        let parsedOriginalPrice = p.originalPrice && /^\d+(\.\d+)?$/.test(p.originalPrice) ? parseFloat(p.originalPrice) : null
        let parsedImages = []
        try { parsedImages = p.images ? JSON.parse(p.images) : [] } catch (e) {}

        return {
          ...p,
          price: parsedPrice,
          originalPrice: parsedOriginalPrice,
          images: parsedImages,
          variationGroups,
          variationRows
        }
      })

      setProductsList(formattedProducts)
    } catch (err: any) {
      console.error('Error fetching products:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.shopId) {
      fetchProducts()
      fetchShopDetails()
    } else {
      setProductsList([])
      setShopDetails(null)
      setShopLoading(false)
      setLoadedShopName(null)
    }
  }, [user?.shopId])

  // CRUD API Handlers
  const handleAddProductSuccess = async (productData: any) => {
    if (!user?.shopId) return
    setProductsLoading(true)
    try {
      const isEdit = !!editingProduct
      const url = isEdit 
        ? `http://localhost:8000/products/${editingProduct.id}`
        : `http://localhost:8000/products`
      const method = isEdit ? 'PUT' : 'POST'
      
      const payload = {
        shopId: user.shopId,
        name: productData.name,
        image: productData.image,
        images: productData.images ? JSON.stringify(productData.images) : JSON.stringify([]),
        video: productData.video || '',
        category: productData.category,
        brand: productData.brand,
        description: productData.description,
        price: String(productData.price),
        originalPrice: productData.originalPrice ? String(productData.originalPrice) : null,
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
      const response = await fetch(`http://localhost:8000/products/${productId}`, {
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
      const response = await fetch(`http://localhost:8000/products/${productId}/toggle-status`, {
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

  // Navigation menu config
  const menuConfig = [
    {
      id: 'orders',
      title: 'Quản Lý Đơn Hàng',
      icon: '📋',
      subMenus: [
        { id: 'all-orders', title: 'Tất cả' },
        { id: 'bulk-delivery', title: 'Giao Hàng Loạt' },
        { id: 'cancelled-orders', title: 'Đơn Hủy' },
        { id: 'refunds', title: 'Trả Hàng/Hoàn Tiền' }
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
        { id: 'shop-flashsale', title: 'Flash Sale Của Shop' },
        { id: 'shop-vouchers', title: 'Mã Giảm Giá Của Shop' }
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
        { id: 'balance', title: 'Số Dư Ví ZeroMall' },
        { id: 'bank-accounts', title: 'Tài Khoản Ngân Hàng' }
      ]
    }
  ]

  const selectSubMenu = (menuId: string, subMenuId: string) => {
    setSearchParams({ menu: menuId, sub: subMenuId })
  }

  // 1. If not a Seller, show authentication page
  if (!isSeller) {
    return <SellerAuthForm onAuthSuccess={onAuthSuccess} onBackToHome={onBackToHome} />
  }

  // 2. If loading shop details
  if (shopLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm bg-white border border-slate-200/60 rounded-3xl p-10 shadow-lg animate-pulse">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black text-slate-700">Đang kiểm tra thông tin cửa hàng...</p>
          <p className="text-xs text-slate-400 text-center">Vui lòng đợi giây lát, hệ thống đang tải dữ liệu đồng bộ.</p>
        </div>
      </div>
    )
  }

  const shopStatus = shopDetails?.status || 'DRAFT'

  // 3. If Shop status is DRAFT
  if (shopStatus === 'DRAFT') {
    return (
      <ShopOnboarding
        user={user}
        initialShopDetails={shopDetails}
        onSuccess={(updatedShop) => setShopDetails(updatedShop)}
        onBackToHome={onBackToHome}
      />
    )
  }

  // 4. If Shop status is PENDING_APPROVAL or REJECTED
  if (shopStatus === 'PENDING_APPROVAL' || shopStatus === 'REJECTED') {
    return (
      <ShopApprovalStatus
        shopDetails={shopDetails}
        fetchShopDetails={fetchShopDetails}
        setShopDetails={setShopDetails}
        onLogout={onLogout}
        onBackToHome={onBackToHome}
      />
    )
  }

  // 5. Main Seller Dashboard
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

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs border border-slate-200 shadow-3xs">
              🏪
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-700 leading-tight">{loadedShopName || `Shop của ${user.name}`}</p>
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
        {/* Left Sidebar Menu Component */}
        <SellerSidebar
          user={user}
          activeMenu={activeMenu}
          activeSubMenu={activeSubMenu}
          menuConfig={menuConfig}
          selectSubMenu={selectSubMenu}
        />

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
          ) : activeMenu === 'marketing' && activeSubMenu === 'shop-vouchers' ? (
            <ShopVouchers user={user} />
          ) : activeMenu === 'marketing' && activeSubMenu === 'shop-flashsale' ? (
            <ShopFlashSale user={user} />
          ) : activeMenu === 'orders' ? (
            <ShopOrders user={user} token={token || ''} activeSubMenu={activeSubMenu} />
          ) : activeMenu === 'finance' && activeSubMenu === 'revenue' ? (
            <ShopRevenue user={user} token={token || ''} />
          ) : activeMenu === 'finance' && activeSubMenu === 'balance' ? (
            <ShopWallet user={user} onNavigateToBankAccounts={() => selectSubMenu('finance', 'bank-accounts')} />
          ) : activeMenu === 'finance' && activeSubMenu === 'bank-accounts' ? (
            <ShopBankAccounts user={user} shopId={shopDetails?.id} />
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
