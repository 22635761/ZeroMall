import React from 'react'
import type { Product, VariationGroup, VariationRow } from '../FlashSale'

interface ProductPurchasePanelProps {
  product: Product
  isMall: boolean
  averageRating: string
  reviewsCount: number
  discountPct: number
  savedCoupons: Record<string, boolean>
  toggleSaveCoupon: (coupon: string) => void
  selectedOptions: Record<number, string>
  onSelectOption: (groupIdx: number, option: string) => void
  selectedVariantName: string
  currentFlashPrice: string
  currentOriginalPrice: string
  stockAvailable: number
  quantity: number
  handleDecrease: () => void
  handleIncrease: () => void
  handleAddToCartClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onBuyNow: (product: any, quantity: number, variant: string) => void
  user?: any
}

export const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
  product,
  isMall,
  averageRating,
  reviewsCount,
  discountPct,
  savedCoupons,
  toggleSaveCoupon,
  selectedOptions,
  onSelectOption,
  selectedVariantName,
  currentFlashPrice,
  currentOriginalPrice,
  stockAvailable,
  quantity,
  handleDecrease,
  handleIncrease,
  handleAddToCartClick,
  onBuyNow,
  user
}) => {
  const variationGroups: VariationGroup[] = product.variationGroups && product.variationGroups.length > 0
    ? product.variationGroups
    : (product.variants && product.variants.length > 0 ? [{ name: 'Phân loại', options: product.variants }] : [])

  const variationRows: VariationRow[] = product.variationRows || []

  // Check if an option has stock > 0 given the current other group selections
  const isOptionAvailable = (groupIdx: number, optValue: string): boolean => {
    if (variationRows.length === 0) return true

    return variationRows.some((r) => {
      const parts = (r.name || r.key || '').split(/[-,\/]/).map((s: string) => s.trim().toLowerCase())
      const thisOptMatches = parts[groupIdx] === optValue.toLowerCase() || (r.name || r.key || '').toLowerCase().includes(optValue.toLowerCase())
      if (!thisOptMatches) return false

      // Check if it matches other already selected groups
      const matchesOtherGroups = Object.entries(selectedOptions).every(([gIdxStr, selectedOptVal]) => {
        const gIdx = Number(gIdxStr)
        if (gIdx === groupIdx || !selectedOptVal) return true
        return parts[gIdx] === selectedOptVal.toLowerCase() || (r.name || r.key || '').toLowerCase().includes(selectedOptVal.toLowerCase())
      })

      return matchesOtherGroups && (parseInt(String(r.stock)) || 0) > 0
    })
  }

  const handleBuyNowClick = () => {
    if (variationGroups.length > 0) {
      for (let i = 0; i < variationGroups.length; i++) {
        if (!selectedOptions[i]) {
          alert(`Vui lòng chọn ${variationGroups[i].name}!`)
          return
        }
      }
    }

    if (stockAvailable <= 0) {
      alert(`Sản phẩm với phân loại đã chọn hiện đã hết hàng, vui lòng chọn phân loại khác!`)
      return
    }

    const effectiveProduct = {
      ...product,
      price: currentFlashPrice,
      flashPrice: currentFlashPrice,
      originalPrice: currentOriginalPrice,
      stock: stockAvailable
    }

    onBuyNow(effectiveProduct, quantity, selectedVariantName)
  }

  return (
    <div className="flex-1 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        
        {/* Title & Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            {isMall ? (
              <span className="bg-[#ee4d2d] text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                Mall
              </span>
            ) : (
              <span className="bg-[#ee4d2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                Yêu thích+
              </span>
            )}
            <span className="text-[10px] text-red-500 border border-red-500/35 px-2 rounded-sm font-semibold bg-red-50/20">
              Freeship Xtra
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            {product.name}
          </h1>
        </div>

        {/* Ratings, Reviews & Sales Metrics */}
        <div className="flex items-center gap-4 text-xs divide-x divide-slate-200 text-slate-500 py-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[#ee4d2d] font-bold underline text-sm">{averageRating}</span>
            <div className="flex text-xs gap-0.5">
              {Array.from({ length: 5 }).map((_, idx) => {
                const starVal = idx + 1
                const ratingNum = parseFloat(averageRating)
                return (
                  <span 
                    key={idx} 
                    className={ratingNum >= starVal ? 'text-yellow-500' : 'text-slate-300'}
                  >
                    ★
                  </span>
                )
              })}
            </div>
          </div>
          <div className="pl-4">
            <span className="font-bold underline text-slate-800">{reviewsCount}</span> Đánh Giá
          </div>
          <div className="pl-4">
            <span className="font-bold text-slate-800">{product.sold !== undefined ? product.sold : 0}</span> Đã Bán
          </div>
        </div>

        {/* Price Segment */}
        <div className="bg-slate-50 p-5 rounded-xl flex items-center gap-5 flex-wrap">
          {discountPct > 0 && currentOriginalPrice && currentOriginalPrice !== currentFlashPrice && (
            <span className="text-slate-400 line-through text-sm">{currentOriginalPrice}</span>
          )}
          <span className="text-3xl font-black text-emerald-600">{currentFlashPrice}</span>
          {discountPct > 0 && (
            <span className="bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
              {discountPct}% GIẢM
            </span>
          )}
        </div>

        {/* Shop Coupons / Vouchers */}
        <div className="text-xs flex gap-4 items-center">
          <span className="text-slate-400 w-24 shrink-0 font-medium">Mã Giảm Giá Shop</span>
          <div className="flex flex-wrap gap-2">
            {['Mã GIẢM 15K', 'Mã GIẢM 30K', 'GIẢM 10%'].map((coupon) => {
              const isSaved = !!savedCoupons[coupon]
              return (
                <button
                  key={coupon}
                  onClick={() => toggleSaveCoupon(coupon)}
                  className={`px-3 py-1 rounded-sm border font-semibold transition cursor-pointer text-[10px] ${
                    isSaved
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-[#feeee9] border-[#ee4d2d]/30 text-[#ee4d2d] hover:bg-[#fdede7]'
                  }`}
                >
                  {isSaved ? '✓ Đã lưu' : coupon}
                </button>
              )
            })}
          </div>
        </div>

        {/* Shipping details */}
        <div className="text-xs flex gap-4 items-start border-t border-b border-slate-100 py-3.5">
          <span className="text-slate-400 w-24 shrink-0 font-medium">Vận Chuyển</span>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="text-lg">🚚</span>
              <div>
                <p className="font-bold">Miễn Phí Vận Chuyển</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Miễn phí vận chuyển cho đơn hàng từ 99.000đ</p>
              </div>
            </div>
            <div className="flex gap-4 text-slate-500 pl-7">
              <span className="w-16">Vận chuyển tới</span>
              <span className="font-semibold text-slate-700">
                {user?.deliveryAddress || user?.address || 'Chọn địa chỉ nhận hàng'}
              </span>
            </div>
            <div className="flex gap-4 text-slate-500 pl-7">
              <span className="w-16">Phí vận chuyển</span>
              {(() => {
                const pWeight = parseFloat(String(product.weight || 0)) || 0
                const pL = parseFloat(String(product.length || 0)) || 0
                const pW = parseFloat(String(product.width || 0)) || 0
                const pH = parseFloat(String(product.height || 0)) || 0
                const volWeight = (pL > 0 && pW > 0 && pH > 0) ? Math.round((pL * pW * pH) / 5) : 0
                const cw = Math.max(pWeight, volWeight)
                let fee = 22000
                if (cw > 500) {
                  const extra = Math.ceil((cw - 500) / 500)
                  fee += extra * 5000
                }
                return (
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>{fee.toLocaleString('vi-VN')}đ</span>
                    {cw > 500 && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                        Hàng cồng kềnh {(cw / 1000).toFixed(2)}kg
                      </span>
                    )}
                  </span>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Product Variation Options - Multi-tier (Tier 1: Màu sắc, Tier 2: Kích thước, etc.) */}
        {variationGroups.length > 0 && (
          <div className="space-y-3 py-1">
            {variationGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="text-xs flex gap-4 items-start">
                <span className="text-slate-400 w-24 shrink-0 font-medium pt-2">
                  {group.name}
                </span>
                <div className="flex flex-wrap gap-2.5 flex-1 items-center">
                  {group.options.map((opt: string) => {
                    const isSelected = selectedOptions[groupIdx] === opt
                    const available = isOptionAvailable(groupIdx, opt)

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => onSelectOption(groupIdx, opt)}
                        className={`px-3.5 py-1.5 border rounded-sm font-semibold transition cursor-pointer text-xs flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9]/40 shadow-2xs ring-1 ring-[#ee4d2d]'
                            : available
                            ? 'border-slate-200 text-slate-700 hover:border-[#ee4d2d]/60 hover:bg-slate-50'
                            : 'border-dashed border-slate-200 text-slate-400 bg-slate-50 opacity-60'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <span className="text-[#ee4d2d] text-[10px] font-bold">✓</span>}
                        {!available && <span className="text-[9px] text-slate-400 italic">(Hết)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity Selector */}
        <div className="text-xs flex gap-4 items-center">
          <span className="text-slate-400 w-24 shrink-0 font-medium">Số Lượng</span>
          <div className="flex items-center gap-4">
            <div className={`flex items-center border rounded-sm overflow-hidden ${stockAvailable <= 0 ? 'bg-slate-100 border-slate-200 opacity-60' : 'border-slate-200 bg-slate-50'}`}>
              <button
                type="button"
                disabled={stockAvailable <= 0}
                onClick={handleDecrease}
                className="w-8 h-8 flex items-center justify-center border-r border-slate-200 hover:bg-slate-100 font-bold cursor-pointer disabled:cursor-not-allowed select-none text-base text-slate-600"
              >
                -
              </button>
              <span className="w-12 h-8 flex items-center justify-center font-bold text-slate-800 select-none">
                {stockAvailable <= 0 ? 0 : quantity}
              </span>
              <button
                type="button"
                disabled={stockAvailable <= 0}
                onClick={handleIncrease}
                className="w-8 h-8 flex items-center justify-center border-l border-slate-200 hover:bg-slate-100 font-bold cursor-pointer disabled:cursor-not-allowed select-none text-base text-slate-600"
              >
                +
              </button>
            </div>
            {stockAvailable <= 0 ? (
              <span className="text-rose-600 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                <span>⚠️</span> Hết hàng (0 sản phẩm có sẵn)
              </span>
            ) : (
              <span className="text-slate-400 font-medium">
                {stockAvailable} sản phẩm có sẵn
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-slate-100 flex-wrap">
        <button
          type="button"
          disabled={stockAvailable <= 0}
          onClick={handleAddToCartClick}
          className={`flex-1 min-w-[200px] py-3.5 px-6 font-bold rounded-sm text-sm flex items-center justify-center gap-2.5 transition ${
            stockAvailable <= 0
              ? 'bg-slate-100 border border-slate-300 text-slate-400 cursor-not-allowed opacity-60'
              : 'border border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9] hover:bg-[#fdede7] cursor-pointer shadow-3xs'
          }`}
        >
          <span className="text-lg">🛒</span> {stockAvailable <= 0 ? 'Tạm Hết Hàng' : 'Thêm Vào Giỏ Hàng'}
        </button>
        
        <button
          type="button"
          disabled={stockAvailable <= 0}
          onClick={handleBuyNowClick}
          className={`flex-1 min-w-[200px] py-3.5 px-6 font-bold rounded-sm text-sm flex items-center justify-center gap-1 transition ${
            stockAvailable <= 0
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none opacity-60'
              : 'bg-[#ee4d2d] hover:bg-[#f05d40] text-white cursor-pointer shadow-md'
          }`}
        >
          {stockAvailable <= 0 ? 'Hết Hàng' : 'Mua Ngay'}
        </button>
      </div>

    </div>
  )
}
