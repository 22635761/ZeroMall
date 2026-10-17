import React from 'react'
import type { Product } from './FlashSale'

interface TopTrendingSectionProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
}

export const TopTrendingSection: React.FC<TopTrendingSectionProps> = ({
  products,
  onSelectProduct,
}) => {
  // Lọc sản phẩm còn hàng và sắp xếp theo số lượng bán nhiều nhất (Top Sales)
  const trendingProducts = [...products]
    .filter((p) => (p.stock !== undefined ? p.stock > 0 : true) && p.status !== 'hidden')
    .sort((a, b) => {
      const soldA = Number(a.sold || 0)
      const soldB = Number(b.sold || 0)
      return soldB - soldA
    })
    .slice(0, 6)

  if (trendingProducts.length === 0) return null

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return {
          label: 'TOP 1',
          bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-amber-200',
          icon: '👑',
        }
      case 1:
        return {
          label: 'TOP 2',
          bg: 'bg-gradient-to-r from-slate-400 to-slate-300 text-white shadow-slate-200',
          icon: '🥈',
        }
      case 2:
        return {
          label: 'TOP 3',
          bg: 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-amber-300',
          icon: '🥉',
        }
      default:
        return {
          label: `TOP ${rank + 1}`,
          bg: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-100',
          icon: '🔥',
        }
    }
  }

  const formatPrice = (p: Product) => {
    const raw = p.flashPrice || p.price || '0'
    const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10) || 0
    return num.toLocaleString('vi-VN') + 'đ'
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-xl shadow-xs">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight uppercase">
                Top Bán Chạy Toàn Sàn
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider animate-pulse">
                Hot Nhất
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Sản phẩm được mua nhiều nhất tuần này • Đánh giá tích cực từ cộng đồng
            </p>
          </div>
        </div>
      </div>

      {/* Grid sản phẩm Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {trendingProducts.map((p, idx) => {
          const rankInfo = getRankBadge(idx)
          const soldCount = p.sold || 0

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group cursor-pointer flex flex-col justify-between bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-200/70 hover:border-emerald-500/40 p-2.5 transition duration-200 hover:shadow-lg relative overflow-hidden"
            >
              {/* Rank Badge */}
              <div
                className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-md ${rankInfo.bg}`}
              >
                <span>{rankInfo.icon}</span>
                <span>{rankInfo.label}</span>
              </div>

              {/* Image Container */}
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-white border border-slate-100">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-between text-left">
                <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                  {p.name}
                </h3>

                <div className="pt-1">
                  <div className="text-sm font-black text-[#ee4d2d]">
                    {formatPrice(p)}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span className="bg-orange-50 text-orange-700 border border-orange-200/60 px-1.5 py-0.2 rounded-md font-bold">
                      Đã bán {soldCount > 1000 ? `${(soldCount / 1000).toFixed(1)}k` : soldCount}
                    </span>
                    {p.rating && p.rating > 0 ? (
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        ⭐ {p.rating}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
