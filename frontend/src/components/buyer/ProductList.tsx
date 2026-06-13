import React, { useState } from 'react'
import type { Product } from './FlashSale'

interface ProductListProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
}

export const ProductList: React.FC<ProductListProps> = ({ products, onSelectProduct }) => {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { label: 'Gợi Ý Cho Bạn', icon: '✨' },
    { label: 'Freeship Xtra', icon: '🚚' },
    { label: 'Hàng Hiệu -50%', icon: '🏷️' },
    { label: 'Xu Hướng Hè', icon: '🌅' }
  ]

  const allProducts: Product[] = products

  const getFilteredProducts = () => {
    switch (activeTab) {
      case 1: // Freeship Xtra
        return allProducts.filter((p) => p.sold > 2000)
      case 2: // Hàng Hiệu
        return allProducts.filter((p) => parseFloat(p.originalPrice) > 500000)
      case 3: // Xu Hướng
        return allProducts.slice(6, 10)
      default:
        return allProducts
    }
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

      {/* Grid of Product Cards */}
      {filteredList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 text-slate-400 text-xs font-medium">
          Không tìm thấy sản phẩm nào phù hợp.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredList.map((p) => {
              const discountPct = Math.round((1 - parseFloat(p.flashPrice.replace(/\./g, '')) / parseFloat(p.originalPrice.replace(/\./g, ''))) * 100)
              const isMall = parseFloat(p.flashPrice) > 200000
              
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="bg-white border border-slate-100/80 hover:border-emerald-500/30 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between relative group"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-101 transition duration-200"
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
                    <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                      -{discountPct}% GIẢM
                    </div>
                  </div>

                  {/* Product details */}
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
                        <span className="text-sm font-bold text-emerald-600">{p.flashPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                        <div className="flex items-center text-yellow-400">
                          ★ <span className="text-slate-600 ml-0.5">{p.rating || 5}</span>
                        </div>
                        <span>Đã bán {p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold}</span>
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
          <div className="text-center pt-6">
            <button className="bg-white border border-slate-200 text-slate-600 px-16 py-2.5 text-xs font-semibold rounded-md hover:bg-slate-50 hover:border-emerald-500/20 hover:text-emerald-600 shadow-xs transition cursor-pointer">
              Xem Thêm
            </button>
          </div>
        </>
      )}
    </section>
  )
}
