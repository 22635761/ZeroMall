import React, { useState, useEffect } from 'react'

export interface Product {
  id: string
  name: string
  originalPrice: string
  flashPrice: string
  image: string
  sold: number
  total: number
  rating?: number
  reviewsCount?: number
  description?: string
  variants?: string[]
  images?: string[]
  category?: string
  brand?: string
  shopId?: string
}

interface FlashSaleProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
}

export const FlashSale: React.FC<FlashSaleProps> = ({ products, onSelectProduct }) => {
  const [timeLeft, setTimeLeft] = useState(7200) // 2 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7200))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    }
  }

  const timeStr = formatTime(timeLeft)

  const flashSaleProducts: Product[] = products.slice(0, 5)

  return (
    <section className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5 text-left">
      {/* Flash Sale Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-black text-emerald-600 italic tracking-tight">FLASH SALE</span>
          </div>
          {/* Ticking Countdown Timer */}
          <div className="flex items-center gap-1 font-bold text-white text-xs">
            <span className="bg-emerald-600 px-2 py-0.5 rounded-md shadow-xs">{timeStr.h}</span>
            <span className="text-slate-400 text-[10px] font-bold">:</span>
            <span className="bg-emerald-600 px-2 py-0.5 rounded-md shadow-xs">{timeStr.m}</span>
            <span className="text-slate-400 text-[10px] font-bold">:</span>
            <span className="bg-emerald-600 px-2 py-0.5 rounded-md shadow-xs">{timeStr.s}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">Thời gian diễn ra còn lại 02:00:00</p>
      </div>

      {/* Product List Row */}
      {flashSaleProducts.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs font-medium">
          Hiện tại không có chương trình Flash Sale nào diễn ra.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {flashSaleProducts.map((p) => {
            const pct = p.total > 0 ? Math.round((p.sold / p.total) * 100) : 0
            const parsePrice = (priceStr: string) => parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0
            const origVal = parsePrice(p.originalPrice)
            const flashVal = parsePrice(p.flashPrice)
            const discountPct = origVal > 0 ? Math.round((1 - flashVal / origVal) * 100) : 0
            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group bg-white border border-slate-100/70 hover:border-emerald-500/30 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-emerald-500/2 cursor-pointer transition duration-300 flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-101 transition duration-300"
                  />
                  
                  {/* Modern Discount Tag */}
                  <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    -{discountPct}% GIẢM
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3.5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <h3 className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 min-h-[32px] group-hover:text-emerald-600 transition">
                    {p.name}
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-baseline flex-wrap gap-1">
                      <span className="text-sm font-bold text-emerald-600">{p.flashPrice}</span>
                      <span className="text-[10px] text-slate-400 line-through">{p.originalPrice}</span>
                    </div>

                    {/* Stock sold bar */}
                    <div className="relative w-full h-3 bg-emerald-50 rounded-full overflow-hidden text-center flex items-center justify-center">
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                      <span className="relative z-10 text-[8px] font-bold text-emerald-700/90 uppercase select-none leading-none pt-0.5">
                        {pct >= 90 ? '🔥 SẮP HẾT HÀNG' : `ĐÃ BÁN ${p.sold}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
