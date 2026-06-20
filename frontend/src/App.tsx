import { useState, useEffect } from 'react'
import { Header } from './components/buyer/Header'
import type { CartItem } from './components/buyer/Header'
import { Hero } from './components/buyer/Hero'
import { Categories } from './components/buyer/Categories'
import { FlashSale } from './components/buyer/FlashSale'
import type { Product } from './components/buyer/FlashSale'
import { ProductList } from './components/buyer/ProductList'
import { ProductDetailPage } from './components/buyer/ProductDetailPage'
import { CartPage } from './components/buyer/CartPage'
import { ServicePolicies } from './components/buyer/ServicePolicies'
import { ChatWidget } from './components/buyer/ChatWidget'
import { AuthModal } from './components/common/AuthModal'
import { SellerPortal } from './components/seller/SellerPortal'
import { AdminPortal } from './components/seller/AdminPortal'
import { ProfileModal } from './components/common/ProfileModal'
import { BuyerOrdersPage } from './components/buyer/BuyerOrdersPage'

function App() {
  // Cart & Checkout state
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('zm_cart')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved cart', e)
      }
    }
    return []
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const savedProduct = localStorage.getItem('zm_selected_product')
    if (savedProduct) {
      try {
        return JSON.parse(savedProduct)
      } catch (e) {
        console.error('Failed to parse saved selected product', e)
      }
    }
    return null
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Page state
  const [currentPage, setCurrentPage] = useState<'home' | 'seller' | 'product-detail' | 'admin' | 'cart' | 'orders'>(() => {
    const savedPage = localStorage.getItem('zm_current_page')
    if (savedPage) {
      if (['home', 'seller', 'product-detail', 'admin', 'cart', 'orders'].includes(savedPage)) {
        return savedPage as any
      }
    }
    return 'home'
  })

  // Persist current page and selected product to localStorage
  useEffect(() => {
    localStorage.setItem('zm_current_page', currentPage)
  }, [currentPage])

  useEffect(() => {
    if (selectedProduct) {
      localStorage.setItem('zm_selected_product', JSON.stringify(selectedProduct))
    } else {
      localStorage.removeItem('zm_selected_product')
    }
  }, [selectedProduct])

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

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('zm_cart', JSON.stringify(cart))
  }, [cart])

  // Auth states
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Products from Database for Buyer
  const [dbProducts, setDbProducts] = useState<Product[]>([])

  const loadProducts = async () => {
    try {
      const response = await fetch('http://localhost:8000/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      const formatted = data.map((p: any) => {
        let flashPriceStr = ''
        let flashPriceVal = 0
        if (p.price && p.price.includes('đ')) {
          flashPriceStr = p.price
          const firstSegment = p.price.split('-')[0].replace(/[^0-9]/g, '')
          flashPriceVal = parseFloat(firstSegment) || 100000
        } else {
          if (p.price && /^\d+(\.\d+)?$/.test(p.price)) {
            flashPriceVal = parseFloat(p.price)
          } else if (p.price) {
            const match = p.price.match(/\d+(\.\d+)?/)
            if (match) {
              flashPriceVal = parseFloat(match[0])
            }
          }
          if (!flashPriceVal) flashPriceVal = 100000
          flashPriceStr = flashPriceVal.toLocaleString('vi-VN') + 'đ'
        }

        let originalPriceStr = ''
        let originalPriceVal = 0
        if (p.originalPrice) {
          if (p.originalPrice.includes('đ')) {
            originalPriceStr = p.originalPrice
            const firstSegment = p.originalPrice.split('-')[0].replace(/[^0-9]/g, '')
            originalPriceVal = parseFloat(firstSegment) || 0
          } else {
            if (/^\d+(\.\d+)?$/.test(p.originalPrice)) {
              originalPriceVal = parseFloat(p.originalPrice)
            } else {
              const match = p.originalPrice.match(/\d+(\.\d+)?/)
              if (match) {
                originalPriceVal = parseFloat(match[0])
              }
            }
            if (originalPriceVal) {
              originalPriceStr = originalPriceVal.toLocaleString('vi-VN') + 'đ'
            }
          }
        }

        if (!originalPriceVal || originalPriceVal <= flashPriceVal) {
          // Deterministic discount percentage between 10% and 50%
          const nameLen = p.name ? p.name.length : 0
          const brandLen = p.brand ? p.brand.length : 0
          const discountPercent = 10 + ((nameLen + brandLen) % 9) * 5
          originalPriceVal = Math.round(flashPriceVal / (1 - discountPercent / 100))
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
          rating: 5,
          reviewsCount: 12,
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
      const parsed = JSON.parse(savedUser)
      setUser(parsed)
      setToken(savedToken)
      const savedPage = localStorage.getItem('zm_current_page')
      if (parsed?.role === 'ADMIN' && !savedPage) {
        setCurrentPage('admin')
      }
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
    if (userData?.role === 'ADMIN') {
      setCurrentPage('admin')
    }
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('zm_user')
    localStorage.removeItem('zm_token')
    setCurrentPage('home')
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
    // Redirect to cart page and reset step to cart
    localStorage.setItem('zm_checkout_step', 'cart')
    setCurrentPage('cart')
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

  if (currentPage === 'admin') {
    return (
      <AdminPortal
        user={user}
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
        onOpenCart={() => {
          localStorage.setItem('zm_checkout_step', 'cart')
          setCurrentPage('cart')
        }}
        onRemoveCartItem={handleRemoveCartItem}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        onOpenRegister={handleOpenRegister}
        onOpenAdminPortal={() => setCurrentPage('admin')}
        onBackToHome={() => {
          setCurrentPage('home')
          setSelectedProduct(null)
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenOrders={() => setCurrentPage('orders')}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {currentPage === 'cart' ? (
          <CartPage
            cart={cart}
            user={user}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onBackToHome={() => {
              setCurrentPage('home')
              setSelectedProduct(null)
            }}
          />
        ) : currentPage === 'orders' ? (
          <BuyerOrdersPage
            user={user}
            onBackToHome={() => {
              setCurrentPage('home')
              setSelectedProduct(null)
            }}
          />
        ) : currentPage === 'product-detail' && selectedProduct ? (
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

export default App
