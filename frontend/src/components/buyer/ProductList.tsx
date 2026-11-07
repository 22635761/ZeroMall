import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product } from './FlashSale'
import { useProductFeedQuery, useFreeshipShopIdsQuery } from '../../queries/productQueries'

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

  // TanStack Query Cache cho trang chủ (30 sản phẩm phân trang)
  const { data: feedData, isLoading: loadingFeed } = useProductFeedQuery(1, 30)
  const feedProducts = feedData?.products || []
  const totalFeedCount = feedData?.pagination.total || 0

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
        // Tab 0: Dữ liệu phân trang thực tế từ backend
        return feedProducts.length > 0 ? feedProducts : products
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

      {/* Thông báo Real-time gợi ý */}
      {activeTab === 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base">🛍️</span>
            <span className="font-semibold">
              Gợi ý hôm nay: Đang hiển thị <strong className="font-black text-emerald-700">{filteredList.length}</strong> sản phẩm
              {totalFeedCount > 0 && <span> (trên tổng số {totalFeedCount.toLocaleString('vi-VN')} mặt hàng trong CSDL)</span>}
            </span>
          </div>
          {recentCategories.length > 0 && (
            <span className="hidden sm:inline text-[11px] text-emerald-800 font-medium">
              Quan tâm: {recentCategories.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      )}

      {/* Grid of Product Cards */}
      {filteredList.length === 0 && !loadingFeed ? (
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
                      <h3
                        className="text-[12px] font-medium text-slate-800 leading-snug line-clamp-3 min-h-[50px] group-hover:text-emerald-600 transition"
                        title={p.name}
                      >
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
          {loadingFeed && filteredList.length === 0 && (
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

          {/* NÚT XEM THÊM CHUẨN SHOPEE */}
          <div className="text-center pt-8 pb-4">
            <button
              onClick={() => navigate('/daily-discover?page=1')}
              className="w-full sm:w-[390px] py-3.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-emerald-500/50 rounded-md text-sm font-semibold text-slate-700 hover:text-emerald-600 shadow-3xs hover:shadow-xs transition cursor-pointer mx-auto block active:scale-[0.99]"
            >
              Xem Thêm
            </button>
          </div>
        </>
      )}
    </section>
  )
}
