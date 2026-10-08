import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config/api.config'

interface ShopTopProductsSidebarProps {
  shopId?: string
  currentProductId?: string
}

export const ShopTopProductsSidebar: React.FC<ShopTopProductsSidebarProps> = ({ shopId, currentProductId }) => {
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      try {
        // Query products: if shopId is provided, get this shop's products; otherwise platform products
        const url = shopId 
          ? `${API_BASE_URL}/products?shopId=${encodeURIComponent(shopId)}`
          : `${API_BASE_URL}/products`
        
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            // Filter out current viewing product and sort by sales descending
            const sorted = data
              .filter((p: any) => p.id !== currentProductId && p.status !== 'hidden' && (p.stock || 0) > 0)
              .sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
              .slice(0, 5)
              .map((p: any) => {
                let displayPriceNum = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0).replace(/[^0-9]/g, '')) || 0
                if (p.hasVariations && p.variationRows) {
                  try {
                    const rows = typeof p.variationRows === 'string' ? JSON.parse(p.variationRows) : p.variationRows
                    if (Array.isArray(rows) && rows.length > 0) {
                      const prices = rows
                        .map((r: any) => parseFloat(String(r.price || 0).replace(/[^0-9]/g, '')) || 0)
                        .filter((v: number) => v > 0)
                      if (prices.length > 0) {
                        displayPriceNum = Math.min(...prices)
                      }
                    }
                  } catch (e) {}
                }
                const displayPrice = displayPriceNum > 0 ? displayPriceNum.toLocaleString('vi-VN') + 'đ' : String(p.price || '0đ')

                // Format cover image
                let coverImg = p.image || ''
                if (!coverImg && p.images) {
                  try {
                    const parsed = typeof p.images === 'string' ? JSON.parse(p.images) : p.images
                    if (Array.isArray(parsed) && parsed.length > 0) coverImg = parsed[0]
                  } catch (e) {}
                }
                if (!coverImg) coverImg = 'https://placehold.co/100x100?text=SP'

                return {
                  id: p.id,
                  name: p.name,
                  price: displayPrice,
                  img: coverImg,
                  sales: p.sales || 0,
                  rating: p.rating || 5.0
                }
              })

            setTopProducts(sorted)
          }
        }
      } catch (err) {
        console.error('Error fetching top products for sidebar:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [shopId, currentProductId])

  if (!loading && topProducts.length === 0) {
    return null
  }

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bg-white rounded-2xl shadow-3xs border border-slate-200/50 p-4 space-y-4 text-left">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center justify-between">
          <span>🔥 Top Bán Chạy Của Shop</span>
        </h3>
        
        <div className="space-y-3.5">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">Đang tải...</div>
          ) : (
            topProducts.map((topProd) => (
              <div 
                key={topProd.id} 
                onClick={() => {
                  navigate(`/product/${topProd.id}`)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="flex gap-3 items-center group cursor-pointer p-1.5 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="w-14 h-14 rounded-xl border border-slate-150 overflow-hidden shrink-0 bg-slate-50">
                  <img src={topProd.img} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" alt={topProd.name} />
                </div>
                <div className="space-y-1 text-xs min-w-0 flex-1">
                  <p className="font-semibold text-slate-700 truncate group-hover:text-[#ee4d2d] transition text-[13px]">{topProd.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-black text-[#ee4d2d]">{topProd.price}</p>
                    <span className="text-[10px] text-slate-400 font-medium">Đã bán {topProd.sales}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
