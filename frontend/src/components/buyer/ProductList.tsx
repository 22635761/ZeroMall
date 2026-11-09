import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from './FlashSale'
import { useProductFeedQuery, usePersonalizedFeedQuery, useFreeshipShopIdsQuery } from '../../queries/productQueries'
import { trackUserEngagement } from '../../services/ai-recommendation.service'

interface ProductListProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
  user?: any
  onOpenAuth?: () => void
}

export const ProductList: React.FC<ProductListProps> = ({ products, onSelectProduct }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [recentCategories, setRecentCategories] = useState<string[]>([])

  // TanStack Query Cache cho danh sách Freeship Shop
  const { data: freeshipSet } = useFreeshipShopIdsQuery()
  const freeshipShopIds = freeshipSet || new Set<string>()

  // TanStack Query Cache cho Tab 0 "Gợi Ý Cho Bạn" (Session-based Interleaved Recommendation Feed)
  const { data: personalizedData, isLoading: loadingPersonalized } = usePersonalizedFeedQuery(1, 30)
  const personalizedProducts = personalizedData?.products || []
  const isFeedPersonalized = personalizedData?.userProfile?.isPersonalized || false
  const recentActionType = personalizedData?.userProfile?.recentAction

  // TanStack Query Cache cho trang chủ chung (các tab khác)
  const { data: feedData, isLoading: loadingFeed } = useProductFeedQuery(1, 30)
  const feedProducts = feedData?.products || []
  const totalFeedCount = personalizedData?.pagination?.total || feedData?.pagination?.total || 0
  const isLoading = activeTab === 0 ? loadingPersonalized : loadingFeed

  // 1. Đọc lịch sử xem sản phẩm trong phiên từ sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('zm_recent_viewed_categories')
      if (stored) {
        setRecentCategories(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const tabs = [
    { label: 'Gợi Ý Cho Bạn', icon: '✨' },
    { label: 'Freeship Xtra', icon: '🚚' },
    { label: 'Hàng Hiệu -50%', icon: '🏷️' },
    { label: 'Xu Hướng Mới', icon: '🌅' }
  ]

  // Fallback allProducts cho các tab 1, 2, 3
  const poolForOtherTabs: Product[] = (feedProducts.length > 0 ? feedProducts : products).filter(
    (p) => (p.stock !== undefined ? p.stock > 0 : (p.total || 0) > (p.sold || 0)) && p.status !== 'hidden'
  )

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 1: // Freeship Xtra
        return poolForOtherTabs.filter((p) => p.shopId && freeshipShopIds.has(p.shopId))
      case 2: // Hàng Hiệu
        return poolForOtherTabs.filter((p) => {
          const num = parseInt(String(p.originalPrice || p.flashPrice || '0').replace(/[^0-9]/g, ''), 10) || 0
          return num > 500000
        })
      case 3: // Xu Hướng Mới
        return [...poolForOtherTabs].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0))
      default:
        // Tab 0: Dữ liệu phân trang gợi ý xen kẽ chuẩn Shopee (Personalized 30/70 Interleaving)
        return personalizedProducts.length > 0 ? personalizedProducts : (feedProducts.length > 0 ? feedProducts : products)
    }
  }

  const handleProductClick = (p: Product) => {
    // 1. Ghi nhận hành vi VIEW ngay lập tức lên Recommendation Engine
    trackUserEngagement('VIEW', p.id, p.category)

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

      {/* Thông báo Real-time gợi ý chuẩn Shopee */}
      {activeTab === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">{isFeedPersonalized ? '🎯' : '🛍️'}</span>
            <span className="font-semibold">
              {isFeedPersonalized ? (
                <>
                  <strong className="text-emerald-800">Gợi Ý Hôm Nay:</strong> Đã ưu tiên hiển thị 1-2 sản phẩm bạn vừa {recentActionType === 'CART' ? 'thêm vào giỏ' : 'quan tâm'} (xen kẽ cùng các mặt hàng thịnh hành toàn sàn).
                </>
              ) : (
                <>
                  <strong className="text-emerald-800">Gợi Ý Hôm Nay:</strong> Đang hiển thị sản phẩm bán chạy và thịnh hành nhất trên toàn sàn ZeroMall ({totalFeedCount > 0 ? `${totalFeedCount.toLocaleString('vi-VN')} mặt hàng` : '10.000+ mặt hàng'}).
                </>
              )}
            </span>
          </div>
          {recentCategories.length > 0 && (
            <span className="hidden sm:inline text-[11px] text-emerald-800 font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-300/50">
              Vừa xem: {recentCategories[0]}
            </span>
          )}
        </div>
      )}

      {/* Grid of Product Cards */}
      {filteredList.length === 0 && !isLoading ? (
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
                  className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] transition-all duration-200 flex flex-col justify-between relative group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out ${isOutOfStock ? 'grayscale-40' : ''}`}
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

                    {/* Left Tag: Chỉ hiển thị 1 nhãn duy nhất (MALL hoặc Yêu Thích) để không che ảnh sản phẩm */}
                    <div className="absolute top-0 left-0 z-10">
                      {isMall ? (
                        <span className="bg-slate-900/90 text-emerald-400 border-r border-b border-emerald-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-br-lg shadow-xs backdrop-blur-xs">
                          MALL
                        </span>
                      ) : (
                        <span className="bg-emerald-600/95 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-br-lg shadow-xs">
                          Yêu thích
                        </span>
                      )}
                    </div>

                    {/* Right Promo Tag */}
                    {discountPct > 0 && !isOutOfStock && (
                      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-xs">
                        -{discountPct}%
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <h3
                        className="text-[12px] font-medium text-slate-800 leading-snug line-clamp-3 min-h-[50px] group-hover:text-emerald-600 transition"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {/* Badges row: Tổ chức gọn gàng, không đè lên hình ảnh */}
                      <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
                        {hasFreeship && (
                          <span className="text-[8px] text-teal-700 border border-teal-500/40 px-1.5 py-0.2 rounded font-bold bg-teal-50">
                            Freeship Xtra
                          </span>
                        )}
                        <span className="text-[8px] text-emerald-700 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold bg-emerald-50">
                          Giảm đến 30k
                        </span>
                        {(p as any).isPersonalized ? (
                          <span className="text-[8px] text-rose-700 border border-rose-300/80 px-1.5 py-0.2 rounded font-black bg-rose-50 flex items-center gap-1 shadow-2xs">
                            {(p as any).recommendationReason || '🎯 Gợi ý cho bạn'}
                          </span>
                        ) : p.recommendationReason && activeTab === 0 ? (
                          <span className="text-[8px] text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-semibold bg-slate-50 truncate max-w-[120px]" title={p.recommendationReason}>
                            {p.recommendationReason}
                          </span>
                        ) : isPersonalized ? (
                          <span className="text-[8px] text-amber-700 border border-amber-300/60 px-1.5 py-0.2 rounded font-semibold bg-amber-50">
                            ✨ Dành cho bạn
                          </span>
                        ) : null}
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
                          {(p.rating && p.rating > 0) ? (
                            <>★ <span className="text-slate-600 ml-0.5">{p.rating}</span></>
                          ) : (
                            <span className="text-slate-400">Mới</span>
                          )}
                        </div>
                        <span>{p.sold > 0 ? `Đã bán ${p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold}` : ''}</span>
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

          {/* SKELETON LOADING INDICATOR KHI ĐANG TẢI */}
          {isLoading && filteredList.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs animate-pulse space-y-3">
                  <div className="aspect-square bg-slate-200/70 rounded-xl"></div>
                  <div className="h-3 bg-slate-200/70 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200/70 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* NÚT XEM THÊM - CHUẨN DESIGN TASTE E-COMMERCE */}
          <div className="text-center pt-8 pb-6">
            <button
              onClick={() => navigate('/daily-discover?page=1')}
              className="w-full sm:w-[360px] py-3.5 px-6 bg-white hover:bg-emerald-50/70 border-2 border-emerald-600/30 hover:border-emerald-600 rounded-xl text-sm font-bold text-emerald-700 hover:text-emerald-800 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer mx-auto flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              <span>Xem Thêm Gợi Ý Hôm Nay</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">➔</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Khám phá hơn 10.000+ sản phẩm đa dạng trên toàn sàn ZeroMall
            </p>
          </div>
        </>
      )}
    </section>
  )
}
