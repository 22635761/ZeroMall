import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api.config'
import { toSlug } from '../../utils/slug'

interface Product {
  id: string
  name: string
  price: string | number
  flashPrice?: string
  originalPrice?: string | number
  image?: string
  images?: string[]
  category: string
  categoryId?: string
  categoryRef?: { name: string; slug: string }
  rating?: number
  sales?: number
  sold?: number
  stock?: number
  brand?: string
  shopId?: string
  location?: string
  description?: string
}

interface SearchResultsPageProps {
  products?: any[]
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ products: initialProducts }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const query = searchParams.get('q') || searchParams.get('keyword') || ''
  
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts || [])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // Filter and Sort states
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [minPriceInput, setMinPriceInput] = useState<string>('')
  const [maxPriceInput, setMaxPriceInput] = useState<string>('')
  const [appliedMinPrice, setAppliedMinPrice] = useState<number | null>(null)
  const [appliedMaxPrice, setAppliedMaxPrice] = useState<number | null>(null)
  const [minRating, setMinRating] = useState<number | null>(null)
  const [filterFreeship, setFilterFreeship] = useState(false)
  const [filterMall, setFilterMall] = useState(false)
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'NEWEST' | 'SALES' | 'PRICE_ASC' | 'PRICE_DESC'>('RELEVANCE')

  // 1. Fetch categories
  useEffect(() => {
    fetch(`${API_BASE_URL}/products/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch(err => console.error('Error fetching categories:', err))
  }, [])

  // 2. Fetch products from API when search query changes
  useEffect(() => {
    setLoading(true)
    const url = query.trim() 
      ? `${API_BASE_URL}/products?search=${encodeURIComponent(query.trim())}`
      : `${API_BASE_URL}/products`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formatted: Product[] = data.map((p: any) => {
            const parseNum = (val: any) => {
              if (!val) return 0
              if (typeof val === 'number') return val
              return parseInt(String(val).replace(/\D/g, ''), 10) || 0
            }
            const origNum = parseNum(p.originalPrice)
            const priceNum = parseNum(p.price)
            const originalPriceStr = origNum > priceNum ? origNum.toLocaleString('vi-VN') + 'đ' : priceNum.toLocaleString('vi-VN') + 'đ'
            const flashPriceStr = priceNum.toLocaleString('vi-VN') + 'đ'

            let parsedImages: string[] = []
            try {
              parsedImages = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
            } catch (e) {
              parsedImages = []
            }
            if (!parsedImages || parsedImages.length === 0) {
              parsedImages = p.image ? [p.image] : []
            }

            return {
              id: p.id,
              name: p.name,
              originalPrice: originalPriceStr,
              flashPrice: flashPriceStr,
              price: flashPriceStr,
              image: p.image || 'https://placehold.co/400x400?text=No+Image',
              images: parsedImages,
              sold: p.sales || p.sold || 0,
              sales: p.sales || p.sold || 0,
              stock: p.stock || 0,
              rating: p.rating && p.rating > 0 ? p.rating : 5.0,
              category: p.category,
              categoryId: p.categoryId,
              categoryRef: p.categoryRef,
              brand: p.brand,
              shopId: p.shopId,
              location: p.location || 'Toàn quốc',
              description: p.description
            }
          })
          setAllProducts(formatted)
        }
      })
      .catch(err => console.error('Error searching products:', err))
      .finally(() => setLoading(false))
  }, [query])

  // Helper to extract raw numeric price
  const parsePrice = (priceVal: any): number => {
    if (typeof priceVal === 'number') return priceVal
    if (!priceVal) return 0
    const digits = String(priceVal).replace(/\D/g, '')
    return parseInt(digits, 10) || 0
  }

  // Filtered & Sorted results
  const filteredProducts = useMemo(() => {
    let list = [...allProducts]

    // If local query filter needed (secondary check)
    if (query.trim()) {
      const qLower = query.toLowerCase().trim()
      list = list.filter(p => 
        p.name.toLowerCase().includes(qLower) ||
        (p.brand && p.brand.toLowerCase().includes(qLower)) ||
        (p.category && p.category.toLowerCase().includes(qLower)) ||
        (p.description && p.description.toLowerCase().includes(qLower))
      )
    }

    // Category filter
    if (selectedCategory) {
      const target = toSlug(selectedCategory)
      list = list.filter(p => {
        const pCatSlug = p.category ? toSlug(p.category) : ''
        const pRefSlug = p.categoryRef?.slug ? toSlug(p.categoryRef.slug) : ''
        return pCatSlug === target || pRefSlug === target || p.category === selectedCategory
      })
    }

    // Price range filter
    if (appliedMinPrice !== null) {
      list = list.filter(p => parsePrice(p.price) >= appliedMinPrice)
    }
    if (appliedMaxPrice !== null) {
      list = list.filter(p => parsePrice(p.price) <= appliedMaxPrice)
    }

    // Rating filter
    if (minRating !== null) {
      list = list.filter(p => (p.rating || 5.0) >= minRating)
    }

    // Freeship Xtra filter
    if (filterFreeship) {
      list = list.filter(p => (p.sold || 0) > 0 || parsePrice(p.price) > 50000)
    }

    // Mall filter
    if (filterMall) {
      list = list.filter(p => parsePrice(p.price) >= 150000 || (p.brand && p.brand !== 'No Brand'))
    }

    // Sorting
    return list.sort((a, b) => {
      const priceA = parsePrice(a.price)
      const priceB = parsePrice(b.price)

      if (sortBy === 'PRICE_ASC') return priceA - priceB
      if (sortBy === 'PRICE_DESC') return priceB - priceA
      if (sortBy === 'SALES') return (b.sold || 0) - (a.sold || 0)
      if (sortBy === 'NEWEST') return b.id.localeCompare(a.id)
      return 0 // RELEVANCE
    })
  }, [allProducts, query, selectedCategory, appliedMinPrice, appliedMaxPrice, minRating, filterFreeship, filterMall, sortBy])

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault()
    const min = minPriceInput.trim() ? parseInt(minPriceInput.replace(/\D/g, ''), 10) : null
    const max = maxPriceInput.trim() ? parseInt(maxPriceInput.replace(/\D/g, ''), 10) : null
    setAppliedMinPrice(min)
    setAppliedMaxPrice(max)
  }

  const handleResetFilters = () => {
    setSelectedCategory('')
    setMinPriceInput('')
    setMaxPriceInput('')
    setAppliedMinPrice(null)
    setAppliedMaxPrice(null)
    setMinRating(null)
    setFilterFreeship(false)
    setFilterMall(false)
    setSortBy('RELEVANCE')
  }

  const hasActiveFilters = Boolean(
    selectedCategory ||
    appliedMinPrice !== null ||
    appliedMaxPrice !== null ||
    minRating !== null ||
    filterFreeship ||
    filterMall
  )

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-emerald-600 transition flex items-center gap-1 font-bold">
          <span>🏠</span> Trang Chủ
        </Link>
        <span>/</span>
        <span className="text-slate-400 font-semibold">Tìm kiếm</span>
        {query && (
          <>
            <span>/</span>
            <span className="font-extrabold text-emerald-700">"{query}"</span>
          </>
        )}
      </nav>

      {/* Search Header Banner */}
      <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
              {query.trim() ? (
                <>
                  Kết quả tìm kiếm cho: <span className="text-emerald-600 font-black">"{query}"</span>
                </>
              ) : (
                'Tất cả sản phẩm'
              )}
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-semibold pl-7">
            Tìm thấy <strong className="text-slate-700 font-black">{filteredProducts.length}</strong> sản phẩm phù hợp
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>✕</span> Xóa tất cả bộ lọc
          </button>
        )}
      </div>

      {/* Main Content Layout: Left Sidebar Filters + Right Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT SIDEBAR: Filters */}
        <aside className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-3xs space-y-6 text-xs select-none">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
            <span>⚙️</span> Bộ Lọc Tìm Kiếm
          </div>

          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Theo Danh Mục</h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex justify-between items-center ${
                  !selectedCategory ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Tất cả danh mục</span>
                {!selectedCategory && <span>✓</span>}
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name || selectedCategory === cat.slug
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => setSelectedCategory(isSelected ? '' : (cat.slug || cat.name))}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex justify-between items-center ${
                      isSelected ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <span>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Khoảng Giá (VNĐ)</h4>
            <form onSubmit={handleApplyPrice} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="₫ TỪ"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-300">-</span>
                <input
                  type="number"
                  placeholder="₫ ĐẾN"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg transition text-xs shadow-3xs cursor-pointer"
              >
                Áp Dụng
              </button>
            </form>
          </div>

          {/* Service & Promotion */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Dịch Vụ & Khuyến Mãi</h4>
            <div className="space-y-2 font-semibold text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={filterFreeship}
                  onChange={(e) => setFilterFreeship(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>🚚 Freeship Xtra</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={filterMall}
                  onChange={(e) => setFilterMall(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>💎 ZeroMall Chính Hãng</span>
              </label>
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Đánh Giá</h4>
            <div className="space-y-1.5 font-semibold text-slate-600">
              {[5, 4, 3].map((star) => (
                <button
                  key={star}
                  onClick={() => setMinRating(minRating === star ? null : star)}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                    minRating === star ? 'bg-emerald-50 text-emerald-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1 text-yellow-400">
                    {'★'.repeat(star)}{'☆'.repeat(5 - star)}
                    <span className="text-slate-600 text-[11px] ml-1 font-semibold">{star === 5 ? '5 sao' : `từ ${star} sao`}</span>
                  </div>
                  {minRating === star && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-bold transition text-xs cursor-pointer"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </aside>

        {/* RIGHT COLUMN: Sort Toolbar & Products Grid */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Sort Toolbar */}
          <div className="bg-white border border-slate-200/70 rounded-2xl p-3.5 shadow-3xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="font-bold text-slate-400 shrink-0">Sắp xếp theo:</span>
              {[
                { id: 'RELEVANCE', label: 'Liên quan' },
                { id: 'NEWEST', label: 'Mới nhất' },
                { id: 'SALES', label: 'Bán chạy' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
                    sortBy === s.id
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                  }`}
                >
                  {s.label}
                </button>
              ))}

              {/* Price Sort Dropdown */}
              <select
                value={sortBy.startsWith('PRICE') ? sortBy : ''}
                onChange={(e) => {
                  if (e.target.value) setSortBy(e.target.value as any)
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  sortBy.startsWith('PRICE')
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/60'
                }`}
              >
                <option value="" disabled className="bg-white text-slate-800">Giá cả</option>
                <option value="PRICE_ASC" className="bg-white text-slate-800">Giá: Thấp đến Cao</option>
                <option value="PRICE_DESC" className="bg-white text-slate-800">Giá: Cao đến Thấp</option>
              </select>
            </div>

            <div className="text-[11px] font-semibold text-slate-400">
              Trang <strong>1/1</strong>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="bg-white border border-slate-200/70 rounded-3xl p-20 text-center space-y-3 shadow-3xs">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Đang tìm kiếm sản phẩm...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const parseNum = (val: any) => {
                  if (typeof val === 'number') return val
                  if (!val) return 0
                  return parseInt(String(val).replace(/\D/g, ''), 10) || 0
                }
                const origVal = parseNum(p.originalPrice)
                const priceVal = parseNum(p.price)
                const discountPct = origVal > priceVal && origVal > 0 ? Math.round((1 - priceVal / origVal) * 100) : 0
                const isMall = priceVal >= 150000

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${toSlug(p.name)}-i.${p.id}`)}
                    className="bg-white border border-slate-100/80 hover:border-emerald-500/40 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between relative group cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                      <img
                        src={p.image || 'https://placehold.co/400x400?text=No+Image'}
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
                          <span className="text-sm font-bold text-emerald-600">{p.flashPrice || p.price}</span>
                          {p.originalPrice && p.originalPrice !== p.price && (
                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                              {p.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <div className="flex items-center text-yellow-400">
                            ★ <span className="text-slate-600 ml-0.5">{p.rating || 5.0}</span>
                          </div>
                          <span>Đã bán {p.sold && p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : (p.sold || 0)}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 text-right font-semibold">
                          {p.location || 'Toàn quốc'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-slate-200/70 rounded-3xl p-12 text-center space-y-5 shadow-3xs">
              <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-4xl mx-auto shadow-inner">
                🔍
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-extrabold text-slate-800">
                  Không tìm thấy kết quả nào phù hợp
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Không có sản phẩm nào khớp với từ khóa <strong className="text-slate-600">"{query}"</strong> hoặc các bộ lọc đã chọn.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 text-xs text-slate-500 font-medium">
                <span className="font-bold text-slate-700 block">Gợi ý tìm kiếm:</span>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Kiểm tra lại chính tả của từ khóa</li>
                  <li>Thử tìm bằng các từ khóa ngắn gọn hoặc phổ biến hơn</li>
                  <li>Xóa bớt các tiêu chí lọc nâng cao để mở rộng kết quả</li>
                </ul>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Xóa các bộ lọc
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition cursor-pointer shadow-3xs"
                >
                  Về Trang Chủ Mua Sắm
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
