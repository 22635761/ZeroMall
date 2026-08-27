import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import { Header } from './components/buyer/Header'
import type { CartItem } from './models/cart.model'
import { Hero } from './components/buyer/Hero'
import { Categories } from './components/buyer/Categories'
import { FlashSale } from './components/buyer/FlashSale'
import type { Product } from './components/buyer/FlashSale'
import { ProductList } from './components/buyer/ProductList'
import { ProductDetailPage } from './pages/buyer/ProductDetailPage'
import { CartPage } from './pages/buyer/CartPage'
import { ServicePolicies } from './components/buyer/ServicePolicies'
import { ChatWidget } from './components/buyer/ChatWidget'
import { AuthModal } from './components/common/AuthModal'
import { SellerPortal } from './pages/seller/SellerPortal'
import { AdminPortal } from './pages/admin/AdminPortal'
import { DeliveryPortal } from './pages/delivery/DeliveryPortal'
import { ProfileModal } from './components/common/ProfileModal'
import { BuyerOrdersPage } from './pages/buyer/BuyerOrdersPage'
import { CategoryProductsPage } from './pages/buyer/CategoryProductsPage'
import { ShopDetailPage } from './pages/buyer/ShopDetailPage'
import { toSlug } from './utils/slug'
import { UserLayout } from './pages/buyer/UserLayout'
import { UserProfileTab } from './pages/buyer/UserProfileTab'
import { UserAddressTab } from './pages/buyer/UserAddressTab'
import { UserPasswordTab } from './pages/buyer/UserPasswordTab'
import { UserBankAccountsTab } from './pages/buyer/UserBankAccountsTab'
import { UserPurchaseTab } from './pages/buyer/UserPurchaseTab'
import { UserVoucherTab } from './pages/buyer/UserVoucherTab'
import { UserWalletTab } from './pages/buyer/UserWalletTab'

// Wrappers and containers for React Router

function getBuyerHomeUrl() {
  if (typeof window === 'undefined') return '/';
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol;
  if (hostname.endsWith('.zeromall.local') || hostname === 'zeromall.local') {
    return `${protocol}//zeromall.local${port}/`;
  }
  return '/';
}

function DeliveryPortalWrapper() {
  return <DeliveryPortal onBackToHome={() => { window.location.href = getBuyerHomeUrl(); }} />
}

function SellerPortalWrapper({ user, token, handleAuthSuccess, handleLogout }: { user: any, token: any, handleAuthSuccess: any, handleLogout: any }) {
  return (
    <SellerPortal
      user={user}
      token={token}
      onAuthSuccess={handleAuthSuccess}
      onLogout={handleLogout}
      onBackToHome={() => { window.location.href = getBuyerHomeUrl(); }}
    />
  )
}

function AdminPortalWrapper({ user, handleAuthSuccess, handleLogout }: { user: any, handleAuthSuccess: any, handleLogout: any }) {
  return (
    <AdminPortal
      user={user}
      onAuthSuccess={handleAuthSuccess}
      onLogout={handleLogout}
      onBackToHome={() => { window.location.href = getBuyerHomeUrl(); }}
    />
  )
}

interface BuyerContainerProps {
  cart: CartItem[]
  user: any
  dbProducts: Product[]
  handleSearch: (query: string) => void
  handleRemoveCartItem: (productId: string, variant?: string) => void
  handleUpdateCartQuantity: (productId: string, variant: string, quantity: number) => void
  handleLogout: () => void
  handleOpenLogin: () => void
  handleOpenRegister: () => void
  handleAuthSuccess: (userData: any, userToken: string) => void
  authTab: 'login' | 'register'
  setAuthTab: React.Dispatch<React.SetStateAction<'login' | 'register'>>
  isAuthOpen: boolean
  setIsAuthOpen: (isOpen: boolean) => void
  isProfileOpen: boolean
  setIsProfileOpen: (isOpen: boolean) => void
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  handleAddToCart: (product: Product, quantity: number, variant: string) => void
  handleBuyNow: (product: Product, quantity: number, variant: string) => void
}

const BuyerContainer: React.FC<BuyerContainerProps> = ({
  cart,
  user,
  dbProducts,
  handleSearch,
  handleRemoveCartItem,
  handleUpdateCartQuantity,
  handleLogout,
  handleOpenLogin,
  handleOpenRegister,
  handleAuthSuccess,
  authTab,
  setAuthTab,
  isAuthOpen,
  setIsAuthOpen,
  isProfileOpen,
  setIsProfileOpen,
  toast,
  handleAddToCart,
  handleBuyNow
}) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const filteredProducts = selectedCategory
    ? dbProducts.filter(p => {
        const catName = selectedCategory.name?.toLowerCase();
        const catSlug = selectedCategory.slug?.toLowerCase();
        const pCat = p.category?.toLowerCase();
        return pCat === catName || pCat === catSlug || (p as any).categoryRef?.slug === catSlug || (p as any).categoryRef?.name?.toLowerCase() === catName;
      })
    : dbProducts;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-800 font-sans selection:bg-[#ee4d2d] selection:text-white">
      {/* Shopee-style Header */}
      <Header
        cart={cart}
        onSearch={handleSearch}
        onOpenCart={() => {
          localStorage.setItem('zm_checkout_step', 'cart')
          navigate('/cart')
        }}
        onRemoveCartItem={handleRemoveCartItem}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenSellerPortal={() => navigate('/seller')}
        onOpenAdminPortal={() => navigate('/admin')}
        onBackToHome={() => navigate('/')}
      />

      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Banner Sliders & Promos */}
                <Hero />

                {/* Categories Grid */}
                <Categories />

                {/* Category Filter Active Indicator */}
                {selectedCategory && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex justify-between items-center text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏷️</span>
                      <span className="font-bold text-slate-700">Đang lọc theo danh mục:</span>
                      <span className="font-black text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full">{selectedCategory.name}</span>
                      <span className="text-slate-400 font-semibold">({filteredProducts.length} sản phẩm phù hợp)</span>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="bg-white hover:bg-emerald-100 text-emerald-700 font-bold px-3.5 py-1.5 rounded-xl border border-emerald-300 transition cursor-pointer flex items-center gap-1"
                    >
                      ✕ Hủy lọc danh mục
                    </button>
                  </div>
                )}

                {/* Flash Sale Grid */}
                <FlashSale products={dbProducts} onSelectProduct={(p) => navigate(`/product/${toSlug(p.name)}-i.${p.id}`)} />

                {/* Daily Discover grid */}
                <ProductList products={filteredProducts} onSelectProduct={(p) => navigate(`/product/${toSlug(p.name)}-i.${p.id}`)} />

                {/* Platform Services Assurances */}
                <ServicePolicies />
              </>
            }
          />
          <Route
            path="/category/:categorySlug"
            element={<CategoryProductsPage products={dbProducts} />}
          />
          <Route
            path="/shop/:shopId"
            element={<ShopDetailPage user={user} allProducts={dbProducts} />}
          />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                user={user}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onBackToHome={() => navigate('/')}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <BuyerOrdersPage
                user={user}
                onBackToHome={() => navigate('/')}
              />
            }
          />
          <Route
            path="/product/:slugWithId"
            element={
              <ProductDetailPage
                user={user}
                onBackToHome={() => navigate('/')}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onOpenLogin={() => {
                  setAuthTab('login')
                  setIsAuthOpen(true)
                }}
              />
            }
          />
          <Route path="/user" element={<UserLayout user={user} />}>
            <Route index element={<Navigate to="account/profile" replace />} />
            <Route path="account/profile" element={<UserProfileTab user={user} onAuthSuccess={handleAuthSuccess} />} />
            <Route path="account/address" element={<UserAddressTab user={user} />} />
            <Route path="account/password" element={<UserPasswordTab user={user} />} />
            <Route path="account/payment" element={<UserBankAccountsTab user={user} />} />
            <Route path="purchase" element={<UserPurchaseTab user={user} />} />
            <Route path="purchase/order/:orderId" element={<UserPurchaseTab user={user} />} />
            <Route path="voucher" element={<UserVoucherTab user={user} />} />
            <Route path="wallet" element={<UserWalletTab user={user} />} />
          </Route>
        </Routes>
      </main>

      {/* Floating Customer Support Chat */}
      <ChatWidget user={user} />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
      />

      {/* Extended Shopee-style Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 text-xs text-slate-500 py-12 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Footer Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
            
            {/* Column 1: Customer support */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">CHĂM SÓC KHÁCH HÀNG</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Trung Tâm Trợ Giúp</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">ZeroMall Blog</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Hướng Dẫn Mua Hàng</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Hướng Dẫn Bán Hàng</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Thanh Toán & Trả Hàng</a></li>
              </ul>
            </div>

            {/* Column 2: About company */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">VỀ ZEROMALL</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Giới Thiệu Về ZeroMall Việt Nam</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Tuyển Dụng</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Điều Khoản ZeroMall</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Chính Sách Bảo Mật</a></li>
              </ul>
            </div>

            {/* Column 3: Payment & Logistics logos */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">THANH TOÁN</h4>
                <div className="flex flex-wrap gap-2 text-base">
                  <span className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">VISA</span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">MC</span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">JCB</span>
                  <span className="bg-slate-50 border border-slate-200 px-1 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">Pay</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">ĐƠN VỊ VẬN CHUYỂN</h4>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">SPX Express</span>
                  <span className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">GHTK</span>
                  <span className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-sm font-bold text-slate-500 shadow-3xs cursor-default">GHN</span>
                </div>
              </div>
            </div>

            {/* Column 4: App Download & Social links */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">THEO DÕI CHÚNG TÔI</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#ee4d2d] transition flex items-center gap-2"><span>👥</span> Facebook</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition flex items-center gap-2"><span>📸</span> Instagram</a></li>
                <li><a href="#" className="hover:text-[#ee4d2d] transition flex items-center gap-2"><span>💬</span> Zalo</a></li>
              </ul>
            </div>

          </div>

          {/* Corporate info */}
          <div className="pt-8 text-center text-slate-400 space-y-2 text-[11px]">
            <p>© 2026 ZeroMall. Tất cả quyền lợi được bảo lưu.</p>
            <p>Quốc gia & Khu vực: Việt Nam | Singapore | Malaysia | Thái Lan | Philippines | Indonesia</p>
            <div className="pt-4 max-w-2xl mx-auto space-y-1">
              <p className="font-bold text-slate-500 text-xs">Công ty TNHH ZeroMall Việt Nam</p>
              <p>Địa chỉ: Tầng 28, Tòa nhà Trung tâm Lotte Hà Nội, 54 Liễu Giai, Phường Cống Vị, Quận Ba Đình, Thành phố Hà Nội, Việt Nam.</p>
              <p>Mã số doanh nghiệp: 0102030405 do Sở Kế hoạch & Đầu tư TP. Hà Nội cấp lần đầu ngày 10/06/2026.</p>
            </div>
          </div>

        </div>
      </footer>

      {/* Auth Modal for Login / Register */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authTab}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-55 bg-slate-900/95 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 border border-slate-700/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-emerald-400 text-sm font-bold">✔️</span>
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  )
}

function App() {
  // Auth states
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Cart & Checkout state - user/guest isolated
  const getCartStorageKey = (u: any) => (u?.id ? `zm_cart_${u.id}` : 'zm_cart_guest')

  const [cart, setCart] = useState<CartItem[]>(() => {
    const key = user?.id ? `zm_cart_${user.id}` : 'zm_cart_guest'
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved cart', e)
      }
    }
    return []
  })
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Sync user-specific cart when user logs in/out
  useEffect(() => {
    const key = getCartStorageKey(user)
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (e) {
        setCart([])
      }
    } else {
      setCart([])
    }
  }, [user?.id])

  // Toast effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }

  // Persist cart to localStorage for active user/guest
  useEffect(() => {
    const key = getCartStorageKey(user)
    localStorage.setItem(key, JSON.stringify(cart))
  }, [cart, user])

  // Products from Database for Buyer
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/products')
      if (!response.ok) throw new Error('Failed to fetch products')

      const raw = await response.json()
      const formatted = raw.map((p: any) => {
        let flashPriceStr = p.price.toLocaleString('vi-VN') + 'đ'
        let originalPriceStr = ''
        if (p.price) {
          let originalPriceVal = p.price * 1.25
          if (originalPriceVal > 1000000) {
            originalPriceVal = Math.round(originalPriceVal / 100000) * 100000
          } else if (originalPriceVal > 100000) {
            originalPriceVal = Math.round(originalPriceVal / 10000) * 10000
          } else {
            originalPriceVal = Math.round(originalPriceVal / 1000) * 1000
          }
          originalPriceStr = originalPriceVal.toLocaleString('vi-VN') + 'đ'
        }

        let variants: string[] = []
        if (p.hasVariations && p.variationGroups) {
          try {
            const groups = JSON.parse(p.variationGroups)
            variants = groups.flatMap((g: any) => g.options || [])
          } catch (e) {
            console.error(e)
          }
        }

        let parsedImages: string[] = []
        try {
          parsedImages = p.images ? JSON.parse(p.images) : []
        } catch (e) {
          console.error('Failed to parse images', e)
        }
        if (!parsedImages || parsedImages.length === 0) {
          parsedImages = p.image ? [p.image] : []
        }

        return {
          id: p.id,
          name: p.name,
          originalPrice: originalPriceStr,
          flashPrice: flashPriceStr,
          image: p.image || 'https://placehold.co/400x400?text=No+Image',
          sold: p.sales || 0,
          total: (p.sales || 0) + (p.stock || 0),
          rating: p.rating ?? 0,
          reviewsCount: p.reviewsCount ?? 0,
          description: p.description,
          variants,
          images: parsedImages,
          video: p.video || '',
          category: p.category,
          brand: p.brand,
          shopId: p.shopId
        }
      })
      setDbProducts(formatted)

    } catch (err) {
      console.error('Error fetching db products:', err)
    }
  }

  // Load session on mount with a 1-minute grace period for reopened tabs
  useEffect(() => {
    const tabSessionId = sessionStorage.getItem('zm_tab_session_id')
    const savedUser = localStorage.getItem('zm_user')
    const savedToken = localStorage.getItem('zm_token')

    if (savedUser && savedToken) {
      if (tabSessionId) {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        setToken(savedToken)
        if ((parsed?.role === 'ADMIN' || parsed?.role === 'PLATFORM_SUPPORT') && window.location.pathname !== '/admin') {
          window.location.href = '/admin'
        }
      } else {
        const lastActive = localStorage.getItem('zm_last_active_time')
        const timePassed = Date.now() - (lastActive ? parseInt(lastActive, 10) : 0)

        if (timePassed <= 60000) {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setToken(savedToken)
          sessionStorage.setItem('zm_tab_session_id', 'active_session')
          localStorage.setItem('zm_last_active_time', Date.now().toString())
          if ((parsed?.role === 'ADMIN' || parsed?.role === 'PLATFORM_SUPPORT') && window.location.pathname !== '/admin') {
            window.location.href = '/admin'
          }
        } else {
          handleLogout()
        }
      }
    }
  }, [])

  // Keep session alive: Update last active timestamp every 10 seconds if user is logged in
  useEffect(() => {
    if (!user) return

    localStorage.setItem('zm_last_active_time', Date.now().toString())

    const interval = setInterval(() => {
      localStorage.setItem('zm_last_active_time', Date.now().toString())
    }, 10000)

    const handleTabCloseOrReload = () => {
      localStorage.setItem('zm_last_active_time', Date.now().toString())
    }

    window.addEventListener('beforeunload', handleTabCloseOrReload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleTabCloseOrReload)
    }
  }, [user])

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAuthSuccess = (userData: any, userToken: string) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('zm_user', JSON.stringify(userData))
    localStorage.setItem('zm_token', userToken)
    localStorage.setItem('zm_last_active_time', Date.now().toString())
    sessionStorage.setItem('zm_tab_session_id', 'active_session')
    if (userData?.role === 'ADMIN' || userData?.role === 'PLATFORM_SUPPORT') {
      window.location.href = '/admin'
    } else if (userData?.role === 'SHOP_OWNER' || userData?.role === 'SHOP_STAFF') {
      window.location.href = '/seller'
    } else {
      window.location.href = '/'
    }
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('zm_user')
    localStorage.removeItem('zm_token')
    localStorage.removeItem('zm_last_active_time')
    sessionStorage.removeItem('zm_tab_session_id')
    window.location.href = '/'
  }

  const handleOpenLogin = () => {
    setAuthTab('login')
    setIsAuthOpen(true)
  }

  const handleOpenRegister = () => {
    setAuthTab('register')
    setIsAuthOpen(true)
  }

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number, variant: string) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === variant
      )

      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx].quantity += quantity
        return updated
      } else {
        return [...prev, { product, quantity, selectedVariant: variant }]
      }
    })
    showToast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng thành công!`)
  }

  const handleBuyNow = (product: Product, quantity: number, variant: string) => {
    // Add to cart first
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === variant
      )

      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx].quantity += quantity
        return updated
      } else {
        return [...prev, { product, quantity, selectedVariant: variant }]
      }
    })
    localStorage.setItem('zm_checkout_step', 'cart')
    window.location.href = '/cart'
  }

  const handleUpdateCartQuantity = (productId: string, variant: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId, variant)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.selectedVariant === variant
          ? { ...item, quantity }
          : item
      )
    )
  }

  const handleRemoveCartItem = (productId: string, variant?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedVariant === variant))
    )
  }

  // 3. Subdomain-based app detection (Shopee Architecture: seller.zeromall.local, admin.zeromall.local, delivery.zeromall.local, zeromall.local)
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isSellerHost = hostname.startsWith('seller.') || hostname === 'seller.zeromall.local';
  const isAdminHost = hostname.startsWith('admin.') || hostname === 'admin.zeromall.local';
  const isDeliveryHost = hostname.startsWith('delivery.') || hostname === 'delivery.zeromall.local';

  return (
    <Router>
      <Routes>
        {/* If visiting seller subdomain, route default to Seller Portal */}
        {isSellerHost ? (
          <>
            <Route
              path="/*"
              element={
                <SellerPortalWrapper
                  user={user}
                  token={token}
                  handleAuthSuccess={handleAuthSuccess}
                  handleLogout={handleLogout}
                />
              }
            />
          </>
        ) : isAdminHost ? (
          <>
            <Route
              path="/*"
              element={
                <AdminPortalWrapper
                  user={user}
                  handleAuthSuccess={handleAuthSuccess}
                  handleLogout={handleLogout}
                />
              }
            />
          </>
        ) : isDeliveryHost ? (
          <>
            <Route
              path="/*"
              element={<DeliveryPortalWrapper />}
            />
          </>
        ) : (
          <>
            {/* Standard path-based routing (localhost:3000/seller, localhost:3000/admin, localhost:3000/delivery, localhost:3000/) */}
            <Route
              path="/delivery"
              element={<DeliveryPortalWrapper />}
            />
            <Route
              path="/seller"
              element={
                <SellerPortalWrapper
                  user={user}
                  token={token}
                  handleAuthSuccess={handleAuthSuccess}
                  handleLogout={handleLogout}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminPortalWrapper
                  user={user}
                  handleAuthSuccess={handleAuthSuccess}
                  handleLogout={handleLogout}
                />
              }
            />
            <Route
              path="/*"
              element={
                <BuyerContainer
                  cart={cart}
                  user={user}
                  dbProducts={dbProducts}
                  handleSearch={() => {}} // Tạm thời search xử lý rỗng hoặc truyền handleSearch
                  handleRemoveCartItem={handleRemoveCartItem}
                  handleUpdateCartQuantity={handleUpdateCartQuantity}
                  handleLogout={handleLogout}
                  handleOpenLogin={handleOpenLogin}
                  handleOpenRegister={handleOpenRegister}
                  handleAuthSuccess={handleAuthSuccess}
                  authTab={authTab}
                  setAuthTab={setAuthTab}
                  isAuthOpen={isAuthOpen}
                  setIsAuthOpen={setIsAuthOpen}
                  isProfileOpen={isProfileOpen}
                  setIsProfileOpen={setIsProfileOpen}
                  toast={toast}
                  handleAddToCart={handleAddToCart}
                  handleBuyNow={handleBuyNow}
                />
              }
            />
          </>
        )}
      </Routes>
    </Router>
  )
}

export default App
