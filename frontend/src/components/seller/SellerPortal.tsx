import React, { useState } from 'react'
import { AddProductForm } from './AddProductForm'
import { ProductListTable } from './ProductListTable'
import { ShopOnboarding } from './ShopOnboarding'
import { ShopVouchers } from './ShopVouchers'

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
  const [loadedShopName, setLoadedShopName] = useState<string | null>(null)

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

        let parsedOriginalPrice: number | string | null = p.originalPrice
        if (p.originalPrice && /^\d+(\.\d+)?$/.test(p.originalPrice)) {
          parsedOriginalPrice = parseFloat(p.originalPrice)
        }

        let parsedImages = []
        try {
          parsedImages = p.images ? JSON.parse(p.images) : []
        } catch (e) {
          console.error('Failed to parse images', e)
        }

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

  // Load products and shop info when user's shopId changes
  React.useEffect(() => {
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

  const [editingProduct, setEditingProduct] = useState<any | null>(null)

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
      const response = await fetch(`http://localhost:8000/auth/${endpoint}`, {
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

  // If loading shop details, show a premium loading spinner
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

  if (shopStatus === 'DRAFT') {
    return (
      <ShopOnboarding
        user={user}
        initialShopDetails={shopDetails}
        onSuccess={(updatedShop) => {
          setShopDetails(updatedShop)
        }}
        onBackToHome={onBackToHome}
      />
    )
  }

  if (shopStatus === 'PENDING_APPROVAL') {
    let parsedAddress: any = null
    let parsedShipping: any = { express: false, fast: false, saver: false, bulky: false }
    if (shopDetails?.pickupAddress) {
      try {
        parsedAddress = typeof shopDetails.pickupAddress === 'string'
          ? JSON.parse(shopDetails.pickupAddress)
          : shopDetails.pickupAddress
      } catch (e) {}
    }
    if (shopDetails?.shippingSettings) {
      try {
        parsedShipping = typeof shopDetails.shippingSettings === 'string'
          ? JSON.parse(shopDetails.shippingSettings)
          : shopDetails.shippingSettings
      } catch (e) {}
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
              <span className="text-2xl">🌱</span>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span> 
                <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogout}
                className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
              >
                Đăng Xuất
              </button>
              <button 
                onClick={onBackToHome}
                className="text-xs font-semibold text-slate-500 hover:text-red-550 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                🏠 Thoát ra ngoài
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 py-12 flex flex-col justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
              ⏳
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800">Đăng Ký Đang Chờ Phê Duyệt</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Cửa hàng <strong className="text-emerald-600 font-bold">{shopDetails?.name}</strong> của bạn đã gửi thông tin đăng ký thành công. Hệ thống đang tiến hành phê duyệt trong vòng 24h.
              </p>
            </div>

            {/* Details Summary */}
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40 text-left text-xs font-semibold space-y-3.5 max-w-md mx-auto">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-1.5">Tóm tắt thông tin đăng ký</p>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Tên Cửa Hàng:</span>
                <span className="text-slate-800">{shopDetails?.name}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-800">{shopDetails?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Số Điện Thoại:</span>
                <span className="text-slate-800">{shopDetails?.phoneNumber || 'N/A'}</span>
              </div>
              {parsedAddress && (
                <div className="flex justify-between items-start py-0.5 gap-4">
                  <span className="text-slate-400 shrink-0">Địa Chỉ Lấy Hàng:</span>
                  <span className="text-slate-800 text-right font-medium">
                    {parsedAddress.detailAddress}, {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start py-0.5 gap-4">
                <span className="text-slate-400 shrink-0">Vận Chuyển Đã Chọn:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {parsedShipping.express && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Hỏa Tốc</span>}
                  {parsedShipping.fast && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Nhanh</span>}
                  {parsedShipping.saver && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Tiết Kiệm</span>}
                  {parsedShipping.bulky && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Hàng Cồng Kềnh</span>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t border-slate-100 max-w-md mx-auto">
              <button
                onClick={fetchShopDetails}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                🔄 Kiểm tra trạng thái
              </button>
              <button
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Về Trang Mua Sắm
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
          © 2026 ZeroMall. Hệ Thống Duyệt Shop Tự Động.
        </footer>
      </div>
    )
  }

  if (shopStatus === 'REJECTED') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
              <span className="text-2xl">🌱</span>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span> 
                <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogout}
                className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
              >
                Đăng Xuất
              </button>
              <button 
                onClick={onBackToHome}
                className="text-xs font-semibold text-slate-500 hover:text-red-550 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                🏠 Thoát ra ngoài
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-md w-full mx-auto p-4 py-12 flex flex-col justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
              ❌
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800">Yêu Cầu Bị Từ Chối</h2>
              <p className="text-xs text-slate-455 leading-relaxed">
                Đăng ký mở cửa hàng <strong className="text-red-600 font-bold">{shopDetails?.name}</strong> của bạn đã bị từ chối do thông tin chưa chính xác hoặc thiếu minh chứng hợp lệ.
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl text-left leading-relaxed">
              ⚠️ Vui lòng cập nhật lại chính xác các thông tin như Số điện thoại liên hệ, Địa chỉ lấy hàng thực tế và kích hoạt các phương thức giao hàng đúng chuẩn để được phê duyệt nhanh nhất.
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShopDetails({ ...shopDetails, status: 'DRAFT' })}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                ✏️ Chỉnh sửa thông tin đăng ký
              </button>
              <button
                onClick={onBackToHome}
                className="w-full px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Về Trang Mua Sắm
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
          © 2026 ZeroMall. Kênh Người Bán.
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
          ) : activeMenu === 'marketing' && activeSubMenu === 'shop-vouchers' ? (
            <ShopVouchers user={user} />
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
