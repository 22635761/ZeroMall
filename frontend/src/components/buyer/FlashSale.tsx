import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

export interface Product {
  id: string
  name: string
  originalPrice: string
  flashPrice: string
  price?: string
  image: string
  sold: number
  total: number
  stock?: number
  status?: string
  rating?: number
  reviewsCount?: number
  description?: string
  variants?: string[]
  images?: string[]
  video?: string
  category?: string
  brand?: string
  shopId?: string
  location?: string
  weight?: number | string
  length?: number | string
  width?: number | string
  height?: number | string
}

interface FlashSaleProps {
  products: Product[]
  onSelectProduct: (product: Product) => void
}

export const FlashSale: React.FC<FlashSaleProps> = ({ products, onSelectProduct }) => {
  const [activeSlot, setActiveSlot] = useState<{
    slotId: string
    timeSlot: string
    status: string
    remainingSeconds: number
    products: any[]
  } | null>(null)

  const [timeLeft, setTimeLeft] = useState<number>(7200)

  // Tải dữ liệu khung giờ Flash Sale thực tế từ Backend
  useEffect(() => {
    const fetchActiveFlashSale = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/flash-sales/active`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setActiveSlot(data)
            if (typeof data.remainingSeconds === 'number' && data.remainingSeconds > 0) {
              setTimeLeft(data.remainingSeconds)
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải Flash Sale active:', err)
      }
    }

    fetchActiveFlashSale()
    const interval = setInterval(fetchActiveFlashSale, 60000) // Tự động làm mới mỗi phút
    return () => clearInterval(interval)
  }, [])

  // Đồng hồ đếm ngược từng giây
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
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

  // Chỉ hiển thị các sản phẩm ĐƯỢC ĐĂNG KÝ vào slot Flash Sale thực tế từ Backend
  // Tuyệt đối không tự động lấy sản phẩm mới thêm từ danh sách chung
  const displayProducts: Product[] = (activeSlot?.products && activeSlot.products.length > 0)
    ? activeSlot.products
        .map(p => {
          const foundFull = products.find(full => full.id === p.id)
          const actualStock = p.stock !== undefined ? p.stock : (foundFull?.stock !== undefined ? foundFull.stock : 0)
          const actualStatus = p.status || foundFull?.status || 'active'
          return {
            id: p.id,
            name: p.name,
            originalPrice: p.originalPrice || p.flashPrice,
            flashPrice: p.flashPrice,
            image: p.image || foundFull?.image || '',
            sold: p.sold || 0,
            total: p.total || 10,
            stock: actualStock,
            status: actualStatus,
            shopId: p.shopId || foundFull?.shopId,
            rating: foundFull?.rating,
            description: foundFull?.description
          }
        })
        .filter(p => (p.stock !== undefined ? p.stock > 0 : false) && p.status !== 'hidden')
    : []

  return (
    <section className="bg-white border border-slate-200/60 rounded-2xl shadow-xs p-5 text-left font-sans">
      {/* Flash Sale Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-black text-orange-600 italic tracking-tight">FLASH SALE</span>
          </div>

          {activeSlot?.timeSlot && (
            <span className="bg-orange-50 text-orange-700 font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full border border-orange-200">
              {activeSlot.timeSlot}
            </span>
          )}

          {/* Ticking Countdown Timer */}
          <div className="flex items-center gap-1 font-black text-white text-xs">
            <span className="bg-slate-900 px-2 py-0.5 rounded-md shadow-xs">{timeStr.h}</span>
            <span className="text-slate-400 text-[10px] font-bold">:</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-md shadow-xs">{timeStr.m}</span>
            <span className="text-slate-400 text-[10px] font-bold">:</span>
            <span className="bg-slate-900 px-2 py-0.5 rounded-md shadow-xs">{timeStr.s}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Kết thúc sau <span className="font-bold text-slate-700">{timeStr.h}:{timeStr.m}:{timeStr.s}</span>
        </p>
      </div>

      {/* Product List Row or Empty State */}
      {displayProducts.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-medium space-y-1">
          <p>⚡ Hiện chưa có sản phẩm nào được đăng ký trong khung giờ Flash Sale này.</p>
          <p className="text-[11px] text-slate-400">Người bán có thể đăng ký sản phẩm tham gia Flash Sale tại Kênh Người Bán.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {displayProducts.map((p) => {
            const stockVal = p.stock !== undefined ? p.stock : (p.total > 0 ? Math.max(0, p.total - p.sold) : 0)
            const isOutOfStock = stockVal <= 0
            const pct = p.total > 0 ? Math.min(100, Math.round((p.sold / p.total) * 100)) : (isOutOfStock ? 100 : 0)
            const parsePrice = (priceStr: string) => parseInt(String(priceStr || '0').replace(/[^0-9]/g, ''), 10) || 0
            const origVal = parsePrice(p.originalPrice)
            const flashVal = parsePrice(p.flashPrice)
            const discountPct = origVal > 0 && origVal > flashVal ? Math.round((1 - flashVal / origVal) * 100) : 0

            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="group bg-white border border-slate-100 hover:border-orange-500/40 rounded-2xl overflow-hidden hover:shadow-md hover:shadow-orange-500/5 cursor-pointer transition duration-200 flex flex-col justify-between"
              >
                {/* Product Image */}
                <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.name}
                    className={`w-full h-full object-cover group-hover:scale-102 transition duration-300 ${isOutOfStock ? 'grayscale-40' : ''}`}
                  />

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center z-20">
                      <span className="bg-black/80 text-white border border-white/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Hết Hàng
                      </span>
                    </div>
                  )}
                  
                  {/* Modern Discount Tag */}
                  {discountPct > 0 && !isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm">
                      -{discountPct}%
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <h3 className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 min-h-[32px] group-hover:text-orange-600 transition">
                    {p.name}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-baseline flex-wrap gap-1.5">
                      <span className="text-sm font-black text-orange-600">{p.flashPrice}</span>
                      {p.originalPrice && p.originalPrice !== p.flashPrice && (
                        <span className="text-[10px] text-slate-400 line-through font-medium">{p.originalPrice}</span>
                      )}
                    </div>

                    {/* Stock sold bar */}
                    <div className="relative w-full h-3 bg-orange-50 rounded-full overflow-hidden text-center flex items-center justify-center border border-orange-100">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${isOutOfStock ? 'bg-slate-400' : 'bg-gradient-to-r from-orange-400 to-red-500'}`}
                        style={{ width: `${isOutOfStock ? 100 : Math.max(pct, 12)}%` }}
                      ></div>
                      <span className="relative z-10 text-[8px] font-black uppercase select-none leading-none pt-0.5 text-white drop-shadow-xs">
                        {isOutOfStock ? 'ĐÃ HẾT HÀNG' : pct >= 90 ? '🔥 SẮP HẾT HÀNG' : `ĐÃ BÁN ${p.sold}`}
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
