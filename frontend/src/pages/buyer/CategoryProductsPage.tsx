import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

interface Product {
  id: string
  name: string
  price: string | number
  flashPrice?: string
  originalPrice?: string | number
  image?: string
  images?: string
  category: string
  categoryId?: string
  categoryRef?: { name: string; slug: string }
  rating?: number
  sales?: number
  sold?: number
  stock?: number
  brand?: string
  shopId?: string
}

const CATEGORY_ICONS: Record<string, string> = {
  'thoi-trang-nam': '👕',
  'dien-thoai-phu-kien': '📱',
  'thiet-bi-dien-tu': '💻',
  'may-tinh-laptop': '🖥️',
  'dong-ho': '⌚',
  'may-anh': '📷',
  'giay-dep-nam': '👞',
  'gia-dung': '🔌',
  'the-thao': '⚽',
  'thoi-trang-nu': '👗',
  'me-va-be': '🍼',
  'nha-cua': '🏡',
  'sac-dep': '💄',
  'suc-khoe': '💊',
  'phu-kien-nu': '💍',
  'giay-dep-nu': '👠',
  'tui-vi-nu': '👜',
  'sach-vpp': '📚'
}

const toSlug = (str: string) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface CategoryProductsPageProps {
  products?: any[]
}

export const CategoryProductsPage: React.FC<CategoryProductsPageProps> = ({ products: propsProducts }) => {
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const navigate = useNavigate()

  const [allProducts, setAllProducts] = useState<Product[]>(propsProducts || [])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(!propsProducts || propsProducts.length === 0)
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SALES' | 'PRICE_ASC' | 'PRICE_DESC'>('NEWEST')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch categories
  useEffect(() => {
    fetch('http://localhost:8000/products/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(e => console.error('Error fetching categories:', e))
  }, [])

  useEffect(() => {
    if (propsProducts && propsProducts.length > 0) {
      setAllProducts(propsProducts)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch('http://localhost:8000/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted = data.map((p: any) => {
            const parseNum = (val: any) => {
              if (!val) return 0
              if (typeof val === 'number') return val
              return parseInt(String(val).replace(/\D/g, ''), 10) || 0
            }
            const origNum = parseNum(p.originalPrice || p.price)
            const priceNum = parseNum(p.price)
            const originalPriceStr = origNum > priceNum ? origNum.toLocaleString('vi-VN') + 'đ' : (priceNum > 0 ? (priceNum * 1.2).toLocaleString('vi-VN') + 'đ' : '0đ')
            const flashPriceStr = priceNum.toLocaleString('vi-VN') + 'đ'

            return {
              id: p.id,
              name: p.name,
              originalPrice: originalPriceStr,
              flashPrice: flashPriceStr,
              price: flashPriceStr,
              image: p.image || 'https://placehold.co/400x400?text=No+Image',
              sold: p.sales || p.sold || 0,
              sales: p.sales || p.sold || 0,
              rating: p.rating && p.rating > 0 ? p.rating : 5.0,
              category: p.category,
              categoryId: p.categoryId,
              categoryRef: p.categoryRef,
              brand: p.brand,
              shopId: p.shopId
            }
          })
          setAllProducts(formatted)
        }
      })
      .catch(e => console.error('Error fetching products:', e))
      .finally(() => setLoading(false))
  }, [propsProducts])

  // Current selected category object
  const currentCategory = useMemo(() => {
    if (!categorySlug) return null
    const slugTarget = toSlug(categorySlug)
    return categories.find(c => toSlug(c.slug || c.name) === slugTarget || c.id === categorySlug) || {
      name: categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      slug: categorySlug
    }
  }, [categorySlug, categories])

  // Filter products for this specific category
  const filteredProducts = useMemo(() => {
    if (!categorySlug) return allProducts

    const targetSlug = toSlug(categorySlug)

    let list = allProducts.filter(p => {
      const pCatSlug = p.category ? toSlug(p.category) : ''
      const pRefSlug = p.categoryRef?.slug ? toSlug(p.categoryRef.slug) : ''
      const pRefName = p.categoryRef?.name ? toSlug(p.categoryRef.name) : ''
      const pCatId = p.categoryId || ''

      return (
        pCatSlug === targetSlug ||
        pRefSlug === targetSlug ||
        pRefName === targetSlug ||
        pCatId === categorySlug ||
        p.category?.toLowerCase() === categorySlug.toLowerCase()
      )
    })

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(term))
    }

    // Sort
    return [...list].sort((a, b) => {
      const parsePrice = (priceVal: any) => {
        if (typeof priceVal === 'number') return priceVal
        if (!priceVal) return 0
        const digits = String(priceVal).replace(/\D/g, '')
        return parseInt(digits, 10) || 0
      }

      if (sortBy === 'PRICE_ASC') return parsePrice(a.price) - parsePrice(b.price)
      if (sortBy === 'PRICE_DESC') return parsePrice(b.price) - parsePrice(a.price)
      if (sortBy === 'SALES') return (b.sales || 0) - (a.sales || 0)
      return 0 // NEWEST
    })
  }, [allProducts, categorySlug, searchTerm, sortBy])

  const icon = categorySlug ? CATEGORY_ICONS[toSlug(categorySlug)] || '📦' : '📦'

  return (
    <div className="space-y-6 text-left">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-emerald-600 transition flex items-center gap-1 font-bold">
          <span>🏠</span> Trang Chủ
        </Link>
        <span>/</span>
        <span className="text-slate-400 font-semibold">Danh Mục Sản Phẩm</span>
        <span>/</span>
        <span className="font-extrabold text-emerald-700">{currentCategory?.name || 'Tất Cả Sản Phẩm'}</span>
      </nav>

      {/* Category Banner Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 border border-white/20">
            <span>{icon}</span> {filteredProducts.length} Sản phẩm có sẵn
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
            {currentCategory?.name || 'Danh Mục Sản Phẩm'}
          </h1>
          <p className="text-xs text-emerald-100/90 font-medium max-w-xl">
            Tất cả sản phẩm chính hãng thuộc danh mục {currentCategory?.name}. Chọn lọc theo giá tốt nhất, ưu đãi miễn phí vận chuyển toàn quốc từ ZeroMall.
          </p>
        </div>

        <div className="z-10 shrink-0 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl backdrop-blur-md border border-white/20 transition cursor-pointer"
          >
            ← Về Trang Chủ
          </button>
        </div>

        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 text-[140px] pointer-events-none select-none">
          {icon}
        </div>
      </div>

      {/* Categories Quick Switcher Bar */}
      {categories.length > 0 && (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-3 shadow-3xs overflow-x-auto scrollbar-none flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 pl-2 shrink-0">Chuyển nhanh:</span>
          {categories.map((cat) => {
            const catSlug = cat.slug || toSlug(cat.name)
            const isActive = toSlug(categorySlug || '') === toSlug(catSlug)
            const catIcon = CATEGORY_ICONS[toSlug(catSlug)] || '📦'

            return (
              <button
                key={cat.id || catSlug}
                onClick={() => navigate(`/category/${catSlug}`)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span>{catIcon}</span>
                <span>{cat.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        {/* Search within category */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Tìm sản phẩm trong ${currentCategory?.name || 'danh mục'}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 px-2 shrink-0">Sắp xếp:</span>
          {[
            { id: 'NEWEST', label: 'Mới nhất' },
            { id: 'SALES', label: 'Bán chạy' },
            { id: 'PRICE_ASC', label: 'Giá thấp ➔ cao' },
            { id: 'PRICE_DESC', label: 'Giá cao ➔ thấp' }
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setSortBy(sort.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer select-none shrink-0 ${
                sortBy === sort.id
                  ? 'bg-white text-emerald-700 shadow-3xs border border-slate-200/40'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200/60">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách sản phẩm theo danh mục...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.map(p => {
            const productSlug = toSlug(p.name)
            const parsePriceNum = (val: any) => {
              if (typeof val === 'number') return val
              if (!val) return 0
              const digits = String(val).replace(/\D/g, '')
              return parseInt(digits, 10) || 0
            }

            const origVal = parsePriceNum(p.originalPrice)
            const displayPriceStr = p.flashPrice || (typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : String(p.price || '0đ'))
            const currentPriceVal = parsePriceNum(displayPriceStr)

            const discountPct = origVal > currentPriceVal && origVal > 0 ? Math.round((1 - currentPriceVal / origVal) * 100) : 0
            const isMall = currentPriceVal > 200000
            const ratingVal = p.rating && p.rating > 0 ? p.rating : 5.0
            const soldVal = p.sold ?? p.sales ?? 0

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${productSlug}-i.${p.id}`)}
                className="bg-white border border-slate-100/80 hover:border-emerald-500/30 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between relative group cursor-pointer"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                  <img
                    src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-101 transition duration-200"
                    loading="lazy"
                  />

                  {/* Left Tags: Mall or Yêu Thích */}
                  <div className="absolute top-2.5 left-0 flex flex-col gap-1 z-10 items-start">
                    {isMall ? (
                      <span className="bg-emerald-700 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs">
                        Mall
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs">
                        Yêu thích
                      </span>
                    )}
                    <span className="bg-teal-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-r-md shadow-xs w-fit">
                      Freeship Xtra
                    </span>
                  </div>

                  {/* Right Promo Tag */}
                  {discountPct > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      -{discountPct}% GIẢM
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 min-h-[32px] group-hover:text-emerald-600 transition">
                      {p.name}
                    </h3>
                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[8px] text-emerald-600 border border-emerald-500/30 px-1 rounded-sm font-bold bg-emerald-50/20">
                        MUA ĐỂ FREESHIP
                      </span>
                      <span className="text-[8px] text-teal-600 border border-teal-500/30 px-1 rounded-sm font-bold bg-teal-50/20">
                        GIẢM ĐẾN 30K
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline flex-wrap gap-1">
                      <span className="text-sm font-bold text-emerald-600">{displayPriceStr}</span>
                      {p.originalPrice && (
                        <span className="text-[10px] text-slate-400 line-through font-semibold">
                          {typeof p.originalPrice === 'number' ? p.originalPrice.toLocaleString('vi-VN') + 'đ' : p.originalPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <div className="flex items-center text-yellow-400">
                        ★ <span className="text-slate-600 ml-0.5">{ratingVal}</span>
                      </div>
                      <span>Đã bán {soldVal >= 1000 ? `${(soldVal / 1000).toFixed(1)}k` : soldVal}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 text-right font-semibold">
                      {p.id.includes('-1') || p.id.includes('-3') || p.id.includes('-5') ? 'Hà Nội' : 'TP. Hồ Chí Minh'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center space-y-4 shadow-3xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 text-3xl flex items-center justify-center mx-auto border border-emerald-100">
            {icon}
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-extrabold text-slate-800">Chưa có sản phẩm nào thuộc danh mục này</h3>
            <p className="text-xs text-slate-400 font-medium">
              Hiện tại danh mục "{currentCategory?.name}" chưa có sản phẩm nào được người bán đăng tải hoặc tìm thấy.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-3xs"
            >
              Khám Phá Tất Cả Danh Mục
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
