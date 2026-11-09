import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePersonalizedFeedQuery, useFreeshipShopIdsQuery } from '../../queries/productQueries'
import { trackUserEngagement } from '../../services/ai-recommendation.service'

const toSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const DailyDiscoverPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // TanStack Query Cache cho danh sách Freeship Shop
  const { data: freeshipSet } = useFreeshipShopIdsQuery()
  const freeshipShopIds = freeshipSet || new Set<string>()

  // TanStack Query Cache cho trang hiện tại với cơ chế gợi ý xen kẽ chuẩn Shopee
  const { data: feedData, isLoading: loading } = usePersonalizedFeedQuery(currentPage, 30)

  const products = feedData?.products || []
  const totalPages = feedData?.pagination.totalPages || 1
  const totalCount = feedData?.pagination.total || 0

  // Cuộn mượt lên đầu trang khi chuyển số trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return
    setSearchParams({ page: newPage.toString() })
  }

  // Thuật toán hiển thị các số trang (1 2 3 ... 50 kiểu Shopee)
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = []
    const delta = 2

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-12 mb-16 select-none">
        {/* Nút Prev */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-3xs transition cursor-pointer"
        >
          &lt;
        </button>

        {/* Danh sách trang */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 text-slate-400 font-bold">
                ...
              </span>
            )
          }

          const pageNum = Number(p)
          const isActive = pageNum === currentPage

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`w-10 h-10 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center shadow-3xs ${
                isActive
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {pageNum}
            </button>
          )
        })}

        {/* Nút Next */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-3xs transition cursor-pointer"
        >
          &gt;
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      {/* Breadcrumb Header */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-3xs border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-emerald-600 cursor-pointer font-medium"
          >
            Trang chủ
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-rose-600 font-black uppercase tracking-wider">
            Gợi ý hôm nay
          </span>
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Tổng cộng <strong className="text-slate-800 font-bold">{totalCount.toLocaleString('vi-VN')}</strong> sản phẩm (Trang {currentPage}/{totalPages})
        </div>
      </div>

      {/* Title Section */}
      <div className="bg-white border-b-2 border-rose-500 rounded-t-xl py-4 px-6 mb-4 shadow-3xs text-center">
        <h1 className="text-base sm:text-lg font-black text-rose-600 uppercase tracking-wide">
          ✨ TẤT CẢ GỢI Ý HÔM NAY
        </h1>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-slate-100 shadow-3xs animate-pulse space-y-2">
              <div className="aspect-square bg-slate-200/70 rounded-lg"></div>
              <div className="h-3 bg-slate-200/70 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200/70 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Grid Products */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {products.map(p => {
              const parsePrice = (priceStr?: string | number) =>
                parseInt(String(priceStr || '0').replace(/[^0-9]/g, ''), 10) || 0
              const origVal = parsePrice(p.originalPrice)
              const flashVal = parsePrice(p.flashPrice || p.price)
              const discountPct =
                origVal > flashVal && origVal > 0 ? Math.round((1 - flashVal / origVal) * 100) : 0
              const isMall = flashVal > 200000
              const hasFreeship = Boolean(p.shopId && freeshipShopIds.has(p.shopId))

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    trackUserEngagement('VIEW', p.id, p.category)
                    navigate(`/product/${toSlug(p.name)}-i.${p.id}`)
                  }}
                  className="bg-white border border-slate-200/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-1 active:scale-[0.99] transition-all duration-200 flex flex-col justify-between relative group cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
                      loading="lazy"
                    />

                    {/* Mall or Yêu Thích */}
                    <div className="absolute top-0 left-0 z-10">
                      {isMall ? (
                        <span className="bg-slate-900/90 text-emerald-400 border-r border-b border-emerald-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-br-lg shadow-xs">
                          MALL
                        </span>
                      ) : (
                        <span className="bg-emerald-600/95 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-br-lg shadow-xs">
                          Yêu thích
                        </span>
                      )}
                    </div>

                    {/* Discount */}
                    {discountPct > 0 && (
                      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg shadow-xs">
                        -{discountPct}%
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1.5">
                      <h3
                        className="text-[12px] font-medium text-slate-800 leading-snug line-clamp-3 min-h-[50px] group-hover:text-emerald-600 transition"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      <div className="flex flex-wrap gap-1 items-center min-h-[18px]">
                        {hasFreeship && (
                          <span className="text-[8px] text-teal-700 border border-teal-500/40 px-1.5 py-0.2 rounded font-bold bg-teal-50 inline-block">
                            Freeship Xtra
                          </span>
                        )}
                        {(p as any).isPersonalized ? (
                          <span className="text-[8px] text-rose-700 border border-rose-300/80 px-1.5 py-0.2 rounded font-black bg-rose-50 flex items-center gap-1 shadow-2xs">
                            {(p as any).recommendationReason || '🎯 Gợi ý cho bạn'}
                          </span>
                        ) : (p as any).recommendationReason ? (
                          <span className="text-[8px] text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-semibold bg-slate-50 truncate max-w-[120px]" title={(p as any).recommendationReason}>
                            {(p as any).recommendationReason}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-emerald-600">
                          {p.flashPrice || p.price}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{p.sold && p.sold > 0 ? `Đã bán ${p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold}` : 'Mới'}</span>
                        <span>{p.location || 'Toàn quốc'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && renderPaginationButtons()}
        </>
      )}
    </div>
  )
}
