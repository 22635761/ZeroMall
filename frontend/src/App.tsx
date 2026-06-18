import { useState, useEffect } from 'react'
import { Header } from './components/buyer/Header'
import type { CartItem } from './components/buyer/Header'
import { Hero } from './components/buyer/Hero'
import { Categories } from './components/buyer/Categories'
import { FlashSale } from './components/buyer/FlashSale'
import type { Product } from './components/buyer/FlashSale'
import { ProductList } from './components/buyer/ProductList'
import { ProductDetailPage } from './components/buyer/ProductDetailPage'
import { CheckoutModal } from './components/buyer/CheckoutModal'
import { ServicePolicies } from './components/buyer/ServicePolicies'
import { ChatWidget } from './components/buyer/ChatWidget'
import { AuthModal } from './components/common/AuthModal'
import { SellerPortal } from './components/seller/SellerPortal'

function App() {
  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCheckout, setShowCheckout] = useState(false)

  // Page state
  const [currentPage, setCurrentPage] = useState<'home' | 'seller' | 'product-detail'>('home')

  // Auth states
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')

  // Products from Database for Buyer
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:3002/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      const formatted = data.map((p: any) => {
        let numericPrice = 0
        if (/^\d+(\.\d+)?$/.test(p.price)) {
          numericPrice = parseFloat(p.price)
        } else {
          const match = p.price.match(/\d+(\.\d+)?/)
          if (match) {
            numericPrice = parseFloat(match[0])
          }
        }

        const flashPriceVal = numericPrice || 100000
        
        // Deterministic discount percentage between 10% and 50%
        const nameLen = p.name ? p.name.length : 0
        const brandLen = p.brand ? p.brand.length : 0
        const discountPercent = 10 + ((nameLen + brandLen) % 9) * 5
        let originalPriceVal = Math.round(flashPriceVal / (1 - discountPercent / 100))
        if (originalPriceVal > 1000000) {
          originalPriceVal = Math.round(originalPriceVal / 100000) * 100000
        } else if (originalPriceVal > 100000) {
          originalPriceVal = Math.round(originalPriceVal / 10000) * 10000
        } else {
          originalPriceVal = Math.round(originalPriceVal / 1000) * 1000
        }
        
        const flashPriceStr = flashPriceVal.toLocaleString('vi-VN') + 'đ'
        const originalPriceStr = originalPriceVal.toLocaleString('vi-VN') + 'đ'

        let variants: string[] = []
        if (p.hasVariations && p.variationGroups) {
          try {
            const groups = JSON.parse(p.variationGroups)
            variants = groups.flatMap((g: any) => g.options || [])
          } catch (e) {
            console.error(e)
          }
        }

        return {
          id: p.id,
          name: p.name,
          originalPrice: originalPriceStr,
          flashPrice: flashPriceStr,
          image: p.image || 'https://placehold.co/400x400?text=No+Image',
          sold: p.sales || 0,
          total: (p.sales || 0) + (p.stock || 0),
          rating: 5,
          reviewsCount: 12,
          description: p.description,
          variants,
          images: p.image ? [p.image] : [],
          category: p.category,
          brand: p.brand,
          shopId: p.shopId
        }
      })
      setDbProducts(formatted)

      // Also refresh the selected product details if it is currently open
      setSelectedProduct((currentSelected) => {
        if (!currentSelected) return null
        const updated = formatted.find((item: any) => item.id === currentSelected.id)
        return updated || currentSelected
      })
    } catch (err) {
      console.error('Error fetching db products:', err)
    }
  }

  // Load session from localStorage on mount and fetch products
  useEffect(() => {
    const savedUser = localStorage.getItem('zm_user')
    const savedToken = localStorage.getItem('zm_token')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }
  }, [])

  useEffect(() => {
    if (currentPage === 'home' || currentPage === 'product-detail') {
      loadProducts()
    }
  }, [currentPage])

  const handleAuthSuccess = (userData: any, userToken: string) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('zm_user', JSON.stringify(userData))
    localStorage.setItem('zm_token', userToken)
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('zm_user')
    localStorage.removeItem('zm_token')
  }

  const handleOpenLogin = () => {
    setAuthTab('login')
    setIsAuthOpen(true)
  }

  const handleOpenRegister = () => {
    setAuthTab('register')
    setIsAuthOpen(true)
  }

  const handleSearch = (query: string) => {
    console.log('User searched for:', query)
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
    setSelectedProduct(null)
  }

  const handleBuyNow = (product: Product, quantity: number, variant: string) => {
    // Add to cart first
    handleAddToCart(product, quantity, variant)
    // Open checkout directly
    setShowCheckout(true)
  }

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    )
  }

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const handleClearCart = () => {
    setCart([])
    loadProducts()
  }

  if (currentPage === 'seller') {
    return (
      <SellerPortal
        user={user}
        token={token}
        onAuthSuccess={handleAuthSuccess}
        onLogout={handleLogout}
        onBackToHome={() => setCurrentPage('home')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-800 font-sans selection:bg-[#ee4d2d] selection:text-white">
      {/* Shopee-style Header */}
      <Header
        cart={cart}
        onSearch={handleSearch}
        onOpenCart={() => setShowCheckout(true)}
        onRemoveCartItem={handleRemoveCartItem}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenSellerPortal={() => setCurrentPage('seller')}
        onBackToHome={() => {
          setCurrentPage('home')
          setSelectedProduct(null)
        }}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {currentPage === 'product-detail' && selectedProduct ? (
          <ProductDetailPage
            product={selectedProduct}
            user={user}
            onBackToHome={() => {
              setCurrentPage('home')
              setSelectedProduct(null)
            }}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenLogin={() => {
              setAuthTab('login')
              setIsAuthOpen(true)
            }}
          />
        ) : (
          <>
            {/* Banner Sliders & Promos */}
            <Hero />

            {/* Categories Grid */}
            <Categories />

            {/* Flash Sale Grid */}
            <FlashSale products={dbProducts} onSelectProduct={(p) => {
              setSelectedProduct(p)
              setCurrentPage('product-detail')
            }} />

            {/* Daily Discover grid */}
            <ProductList products={dbProducts} onSelectProduct={(p) => {
              setSelectedProduct(p)
              setCurrentPage('product-detail')
            }} />

            {/* Platform Services Assurances */}
            <ServicePolicies />
          </>
        )}
      </main>

      {/* Floating Customer Support Chat */}
      <ChatWidget />

      {/* Shopping Cart & Checkout flow dialog */}
      <CheckoutModal
        isOpen={showCheckout}
        cart={cart}
        onClose={() => setShowCheckout(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
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
                <li><a href="#" className="hover:text-[#ee4d2d] transition">Kênh Người Bán</a></li>
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
    </div>
  )
}

export default App
