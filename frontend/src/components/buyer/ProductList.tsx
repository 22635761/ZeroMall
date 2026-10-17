import React, { useState, useEffect } from 'react'
import type { Product } from './FlashSale'
import { getFreeshipShopIds } from '../../services/shop.service'
import { getPersonalizedRecommendations } from '../../services/ai-recommendation.service'

interface ProductListProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
  user?: any
}

export const ProductList: React.FC<ProductListProps> = ({ products, onSelectProduct, user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const [freeshipShopIds, setFreeshipShopIds] = useState<Set<string>>(new Set())
  const [recentCategories, setRecentCategories] = useState<string[]>([])
  const [aiProducts, setAiProducts] = useState<Product[]>([])
  const [aiMeta, setAiMeta] = useState<any>(null)
  const [loadingAi, setLoadingAi] = useState(false)

  // Tải danh sách gợi ý cá nhân hóa từ ZeroAI Engine
  const fetchAiFeed = async () => {
    setLoadingAi(true)
    try {
      const feed = await getPersonalizedRecommendations(user?.id, user?.gender)
      if (feed && feed.products && feed.products.length > 0) {
        const mapped: Product[] = feed.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          originalPrice: p.originalPrice ? (typeof p.originalPrice === 'number' ? p.originalPrice.toLocaleString('vi-VN') + 'đ' : p.originalPrice) : '',
          flashPrice: p.price ? (typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : p.price) : '',
          price: p.price ? (typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : p.price) : '',
          image: (Array.isArray(p.images) && p.images[0]) || p.image || '/placeholder.png',
          sold: p.sold || 0,
          total: p.stock || 100,
          stock: p.stock !== undefined ? p.stock : 100,
          status: p.status || 'ACTIVE',
          rating: p.rating || 4.8,
          category: p.category,
          shopId: p.shopId,
          location: p.location || 'Toàn quốc',
          recommendationReason: p.recommendationReason,
          recommendationScore: p.recommendationScore
        }))
        setAiProducts(mapped)
        setAiMeta(feed.userProfile)
      }
    } catch (err) {
      console.warn('AI recommendation fallback:', err)
    } finally {
      setLoadingAi(false)
    }
  }

  useEffect(() => {
    fetchAiFeed()
  }, [user?.id, user?.gender])

  // Đọc lịch sử xem sản phẩm trong phiên từ sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('zm_recent_viewed_categories')
      if (stored) {
        setRecentCategories(JSON.parse(stored))
      }
    } catch {}
  }, [])

  // Tải danh sách Shop đã đăng ký Freeship Xtra động từ database thực tế
  useEffect(() => {
    let isMounted = true
    getFreeshipShopIds().then((enrolledSet) => {
      if (isMounted) setFreeshipShopIds(enrolledSet)
    })
    return () => {
      isMounted = false
    }
  }, [])

  const tabs = [
    { label: 'Gợi Ý Cho Bạn', icon: '✨' },
    { label: 'Freeship Xtra', icon: '🚚' },
    { label: 'Hàng Hiệu -50%', icon: '🏷️' },
    { label: 'Xu Hướng Mới', icon: '🌅' }
  ]

  const allProducts: Product[] = products.filter(
    (p) => (p.stock !== undefined ? p.stock > 0 : (p.total || 0) > (p.sold || 0)) && p.status !== 'hidden'
  )

  // Hàm tính điểm hấp dẫn sản phẩm cho thuật toán Cold Start
  const calculateProductScore = (p: Product): number => {
    const parsePrice = (priceStr?: string | number) => parseInt(String(priceStr || '0').replace(/[^0-9]/g, ''), 10) || 0
    const origVal = parsePrice(p.originalPrice)
    const flashVal = parsePrice(p.flashPrice || p.price)
    const discountPct = origVal > flashVal && origVal > 0 ? Math.round((1 - flashVal / origVal) * 100) : 0
    const sold = Number(p.sold || 0)
    const rating = Number(p.rating || 4.5)

    // Công thức: 40% doanh số bán + 30% đánh giá sao + 30% mức giảm giá
    return sold * 0.4 + (rating * 20) * 0.3 + discountPct * 0.3
  }

  // Thuật toán Diversity Sampling: Trộn đều các ngành hàng để trang chủ đa dạng cho người mới
  const rankWithDiversity = (productList: Product[]): Product[] => {
    if (productList.length <= 1) return productList

    // 1. Nhóm theo danh mục
    const categoryGroups: Record<string, Product[]> = {}
    for (const p of productList) {
      const cat = p.category || 'Khác'
      if (!categoryGroups[cat]) categoryGroups[cat] = []
      categoryGroups[cat].push(p)
    }

    // 2. Sắp xếp các sản phẩm trong từng nhóm theo điểm hấp dẫn giảm dần
    for (const cat in categoryGroups) {
      categoryGroups[cat].sort((a, b) => calculateProductScore(b) - calculateProductScore(a))
    }

    // 3. Round-Robin: Lấy lần lượt 1 sản phẩm từ mỗi nhóm để không ngành hàng nào chiếm sóng
    const result: Product[] = []
    const categories = Object.keys(categoryGroups)
    let hasMore = true
    let pointer = 0

    while (hasMore) {
      hasMore = false
      for (const cat of categories) {
        if (pointer < categoryGroups[cat].length) {
          result.push(categoryGroups[cat][pointer])
          hasMore = true
        }
      }
      pointer++
    }

    return result
  }

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 1: // Freeship Xtra
        return allProducts.filter((p) => p.shopId && freeshipShopIds.has(p.shopId))
      case 2: // Hàng Hiệu
        return allProducts.filter((p) => {
          const num = parseInt(String(p.originalPrice || p.flashPrice || '0').replace(/[^0-9]/g, ''), 10) || 0
          return num > 500000
        })
      case 3: // Xu Hướng Mới
        return [...allProducts].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
      default: {
        // TAB 0: "Gợi Ý Cho Bạn" - ZeroAI Personalized Engine
        if (aiProducts.length > 0) {
          return aiProducts
        }

        if (recentCategories.length > 0) {
          // A. Người dùng đã bấm xem một số danh mục trong phiên:
          // Đẩy các sản phẩm thuộc danh mục vừa xem lên đầu tiên
          const personalized = allProducts.filter((p) => p.category && recentCategories.includes(p.category))
          const others = allProducts.filter((p) => !p.category || !recentCategories.includes(p.category))

          personalized.sort((a, b) => calculateProductScore(b) - calculateProductScore(a))
          const diverseOthers = rankWithDiversity(others)

          return [...personalized, ...diverseOthers]
        } else {
          // B. Người dùng mới toanh (Cold Start): Đa dạng hóa ngành hàng toàn diện
          return rankWithDiversity(allProducts)
        }
      }
    }
  }

  const handleProductClick = (p: Product) => {
    try {
      if (p.category) {
        const stored = sessionStorage.getItem('zm_recent_viewed_categories')
        let cats: string[] = stored ? JSON.parse(stored) : []
        cats = [p.category, ...cats.filter((c) => c !== p.category)].slice(0, 5)
        sessionStorage.setItem('zm_recent_viewed_categories', JSON.stringify(cats))
        setRecentCategories(cats)
      }
    } catch {}
    onSelectProduct(p)
  }

  const filteredList = getFilteredProducts()

  return (
    <section className="space-y-4 text-left">
      {/* Tab Header Bar */}
      <div className="bg-white border-b border-slate-200/60 flex overflow-x-auto scrollbar-none sticky top-16 sm:top-20 z-30 shadow-sm rounded-xl overflow-hidden">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`flex-1 min-w-[120px] py-4 text-center font-bold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
              idx === activeTab ? 'text-emerald-600' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {idx === activeTab && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 animate-in fade-in duration-200"></span>
            )}
          </button>
        ))}
      </div>

      {/* Thông báo Real-time gợi ý AI */}
      {activeTab === 0 && (
        <>
          {aiMeta?.isPersonalized ? (
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-200/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-indigo-950 shadow-xs animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🤖</span>
                <div>
                  <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                    ZeroAI Feed Cá Nhân Hóa
                    <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">HYPER-SCALE</span>
                  </span>
                  <p className="text-[11px] text-indigo-800/80 font-medium">
                    {aiMeta.hasRecentInteractions
                      ? 'Đang ưu tiên các sản phẩm tương tự món đồ bạn vừa xem & giỏ hàng!'
                      : aiMeta.detectedGender === 'NAM'
                      ? 'Bộ sưu tập công nghệ, phụ kiện & thời trang nam dành riêng cho bạn.'
                      : aiMeta.detectedGender === 'NU'
                      ? 'Bộ sưu tập túi xách, mỹ phẩm & thời trang nữ dành riêng cho bạn.'
                      : `Gợi ý theo xu hướng và sở thích của bạn: ${aiMeta.topInterests?.slice(0, 3).join(', ')}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchAiFeed()}
                disabled={loadingAi}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white/80 hover:bg-white border border-indigo-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                title="Làm mới nguồn gợi ý"
              >
                <span className={loadingAi ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
                <span>{loadingAi ? 'Đang phân tích...' : 'Làm mới'}</span>
              </button>
            </div>
          ) : recentCategories.length > 0 ? (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <span className="font-semibold">
                  Gợi ý dựa trên sở thích bạn vừa xem: <strong className="font-black text-emerald-900">{recentCategories.slice(0, 2).join(', ')}</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('zm_recent_viewed_categories')
                  setRecentCategories([])
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                Đặt lại
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Grid of Product Cards */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400 text-xs font-medium">
          {activeTab === 1
            ? 'Hiện chưa có sản phẩm nào thuộc Shop đăng ký Gói Freeship Xtra.'
            : 'Không tìm thấy sản phẩm nào phù hợp.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredList.map((p) => {
              const parsePrice = (priceStr?: string | number) => parseInt(String(priceStr || '0').replace(/[^0-9]/g, ''), 10) || 0
              const origVal = parsePrice(p.originalPrice)
              const flashVal = parsePrice(p.flashPrice || p.price)
              const discountPct = origVal > flashVal && origVal > 0 ? Math.round((1 - flashVal / origVal) * 100) : 0
              const isMall = flashVal > 200000
              const stockVal = p.stock !== undefined ? p.stock : (p.total !== undefined ? p.total - (p.sold || 0) : 99)
              const isOutOfStock = stockVal <= 0 || p.status === 'hidden'
              const hasFreeship = Boolean(p.shopId && freeshipShopIds.has(p.shopId))
              const isPersonalized = Boolean(activeTab === 0 && p.category && recentCategories.includes(p.category))

              return (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="bg-white border border-slate-100/80 hover:border-emerald-500/30 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between relative group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className={`w-full h-full object-cover group-hover:scale-101 transition duration-200 ${isOutOfStock ? 'grayscale-40' : ''}`}
                      loading="lazy"
                    />

                    {/* Out of stock overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-20">
                        <span className="bg-black/80 text-white border border-white/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                          Hết Hàng
                        </span>
                      </div>
                    )}

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

                      {/* CHỈ HIỂN THỊ NẾU SHOP ĐÃ ĐĂNG KÝ FREESHIP XTRA */}
                      {hasFreeship && (
                        <span className="bg-teal-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-r-md shadow-xs w-fit">
                          Freeship Xtra
                        </span>
                      )}

                      {/* Gợi ý cho bạn */}
                      {p.recommendationReason && activeTab === 0 ? (
                        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs w-fit max-w-[130px] truncate" title={p.recommendationReason}>
                          {p.recommendationReason}
                        </span>
                      ) : isPersonalized && (
                        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs w-fit">
                          ✨ Dành cho bạn
                        </span>
                      )}
                    </div>

                    {/* Right Promo Tag */}
                    {discountPct > 0 && !isOutOfStock && (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                        -{discountPct}% GIẢM
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <h3 className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 min-h-[32px] group-hover:text-emerald-600 transition">
                        {p.name}
                      </h3>
                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1">
                        {hasFreeship && (
                          <span className="text-[8px] text-teal-600 border border-teal-500/30 px-1 rounded-sm font-bold bg-teal-50/20">
                            FREESHIP XTRA
                          </span>
                        )}
                        <span className="text-[8px] text-emerald-600 border border-emerald-500/30 px-1 rounded-sm font-bold bg-emerald-50/20">
                          GIẢM ĐẾN 30K
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-baseline flex-wrap gap-1.5">
                        <span className="text-sm font-bold text-emerald-600">{p.flashPrice || p.price}</span>
                        {p.originalPrice && p.originalPrice !== p.flashPrice && p.originalPrice !== p.price && (
                          <span className="text-[10px] text-slate-400 line-through font-medium">{p.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <div className="flex items-center text-yellow-400">
                          ★ <span className="text-slate-600 ml-0.5">{p.rating ?? 0}</span>
                        </div>
                        <span>Đã bán {p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold}</span>
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
        </>
      )}
    </section>
  )
}
