import React, { useState } from 'react'

export interface CartItem {
  product: {
    id: string
    name: string
    flashPrice: string
    image: string
  }
  quantity: number
  selectedVariant?: string
}

interface HeaderProps {
  cart: CartItem[]
  onSearch: (query: string) => void
  onOpenCart: () => void
  onRemoveCartItem?: (id: string) => void
  user: any
  onLogout: () => void
  onOpenLogin: () => void
  onOpenRegister: () => void
  onOpenSellerPortal: () => void
  onBackToHome?: () => void
}

export const Header: React.FC<HeaderProps> = ({ 
  cart, 
  onSearch, 
  onOpenCart, 
  onRemoveCartItem,
  user,
  onLogout,
  onOpenLogin,
  onOpenRegister,
  onOpenSellerPortal,
  onBackToHome
}) => {
  const [searchValue, setSearchValue] = useState('')
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchValue)
  }

  const hotSearches = ['iPhone 15 Pro', 'Tai Nghe Sony', 'Bàn Phím Cơ', 'Son Tint Lì', 'Túi Xách Nữ', 'Áo Thun Nam']

  return (
    <header className="w-full bg-white text-slate-700 text-xs z-50 sticky top-0 shadow-xs border-b border-slate-100">
      {/* Top Utility Bar (Subtle grey) */}
      <div className="bg-slate-50 border-b border-slate-200/40 text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          {/* Left links */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onOpenSellerPortal}
              className="hover:text-emerald-600 transition bg-transparent border-none p-0 cursor-pointer font-bold text-slate-500 text-xs"
            >
              Kênh Người Bán
            </button>
            <span className="text-slate-200">|</span>
            <a href="#" className="hover:text-emerald-600 transition">Tải ứng dụng</a>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-1.5">
              <span>Kết nối</span>
              <a href="#" className="hover:text-emerald-600 transition font-bold text-xs">f</a>
              <a href="#" className="hover:text-emerald-600 transition font-bold text-xs">📳</a>
            </div>
          </div>

          {/* Right links */}
          <div className="flex items-center gap-4">
            <a href="#" className="flex items-center gap-1 hover:text-emerald-600 transition">
              <span>🔔</span> Thông Báo
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-emerald-600 transition">
              <span>❓</span> Hỗ Trợ
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-emerald-600 transition font-bold">
              🌐 Tiếng Việt
            </a>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-3 font-bold">
              {user ? (
                <>
                  <span className="text-slate-600 font-semibold cursor-default">Chào, {user.name}</span>
                  <span className="text-slate-200">|</span>
                  <button 
                    onClick={onLogout} 
                    className="hover:text-emerald-600 transition cursor-pointer bg-transparent border-none p-0 font-bold"
                  >
                    Đăng Xuất
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={onOpenRegister} 
                    className="hover:text-emerald-600 transition cursor-pointer bg-transparent border-none p-0 font-bold"
                  >
                    Đăng Ký
                  </button>
                  <span className="text-slate-200">|</span>
                  <button 
                    onClick={onOpenLogin} 
                    className="hover:text-emerald-600 transition cursor-pointer bg-transparent border-none p-0 font-bold"
                  >
                    Đăng Nhập
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => {
          if (onBackToHome) onBackToHome()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}>
          <div className="flex items-center gap-1.5 hover:opacity-90 transition">
            <span className="text-2xl">🌱</span>
            <span className="text-xl font-black tracking-tight text-slate-800">
              Zero<span className="text-emerald-600">Mall</span>
            </span>
          </div>
          <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-sm hidden md:inline-block">
            MALL
          </span>
        </div>

        {/* Search & Suggestions */}
        <div className="flex-1 max-w-3xl flex flex-col gap-1.5">
          <form onSubmit={handleSearchSubmit} className="w-full flex items-center bg-slate-55/35 border border-slate-200 rounded-lg p-0.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition duration-200">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 px-3.5 text-slate-800 text-sm focus:outline-none placeholder-slate-400 bg-transparent"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white w-10 h-8 rounded-md transition flex items-center justify-center cursor-pointer shadow-sm shrink-0"
            >
              <span className="text-xs">🔍</span>
            </button>
          </form>

          {/* Quick search links */}
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400 font-medium">
            {hotSearches.map((term, i) => (
              <span
                key={i}
                onClick={() => {
                  setSearchValue(term)
                  onSearch(term)
                }}
                className="hover:text-emerald-600 cursor-pointer transition"
              >
                {term}
              </span>
            ))}
          </div>
        </div>

        {/* Cart Icon & Dropdown Hover */}
        <div className="relative group shrink-0 flex items-center justify-center p-2.5 cursor-pointer">
          <div onClick={onOpenCart} className="relative text-slate-700 hover:text-emerald-600 transition">
            <span className="text-xl">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </div>

          {/* Cart preview popover (shoots down on hover) */}
          <div className="absolute top-full right-0 mt-1 w-96 bg-white rounded-lg border border-slate-200/80 shadow-xl text-slate-800 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
            <div className="p-3 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              Sản phẩm mới thêm
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <span className="text-3xl">🛒</span>
                <p className="text-slate-400 text-xs font-semibold">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                  {cart.map((item, index) => (
                    <div key={index} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover border border-slate-100 rounded-md shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.product.name}</p>
                          {item.selectedVariant && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Phân loại: {item.selectedVariant}</p>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-emerald-600">{item.product.flashPrice}</span>
                        <span className="text-[10px] text-slate-400 font-medium">x{item.quantity}</span>
                        {onRemoveCartItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveCartItem(item.product.id)
                            }}
                            className="text-[10px] text-red-500 hover:underline mt-1 font-semibold"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold">{cartCount} sản phẩm trong giỏ</span>
                  <button
                    onClick={onOpenCart}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-md font-semibold text-xs shadow-sm transition cursor-pointer"
                  >
                    Xem Giỏ Hàng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
