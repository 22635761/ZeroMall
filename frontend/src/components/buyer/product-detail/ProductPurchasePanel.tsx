import React from 'react'

interface ProductPurchasePanelProps {
  product: any
  isMall: boolean
  averageRating: string
  reviewsCount: number
  discountPct: number
  savedCoupons: Record<string, boolean>
  toggleSaveCoupon: (coupon: string) => void
  selectedVariant: string
  setSelectedVariant: (variant: string) => void
  quantity: number
  handleDecrease: () => void
  handleIncrease: () => void
  stockAvailable: number
  handleAddToCartClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onBuyNow: (product: any, quantity: number, variant: string) => void
}

export const ProductPurchasePanel: React.FC<ProductPurchasePanelProps> = ({
  product,
  isMall,
  averageRating,
  reviewsCount,
  discountPct,
  savedCoupons,
  toggleSaveCoupon,
  selectedVariant,
  setSelectedVariant,
  quantity,
  handleDecrease,
  handleIncrease,
  stockAvailable,
  handleAddToCartClick,
  onBuyNow
}) => {
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
                const starVal = idx + 1;
                const ratingNum = parseFloat(averageRating);
                return (
                  <span 
                    key={idx} 
                    className={ratingNum >= starVal ? 'text-yellow-500' : 'text-slate-300'}
                  >
                    ★
                  </span>
                );
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
        <div className="bg-[#fafafa] p-5 rounded-xl flex items-center gap-5 flex-wrap">
          <span className="text-slate-400 line-through text-sm">{product.originalPrice}</span>
          <span className="text-3xl font-black text-[#ee4d2d]">{product.flashPrice}</span>
          <span className="bg-[#ee4d2d]/10 text-[#ee4d2d] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
            {discountPct}% GIẢM
          </span>
        </div>

        {/* Shop Coupons / Vouchers */}
        <div className="text-xs flex gap-4 items-center">
          <span className="text-slate-400 w-24 shrink-0 font-medium">Mã Giảm Giá Shop</span>
          <div className="flex flex-wrap gap-2">
            {['Mã GIẢM 15K', 'Mã GIẢM 30K', 'GIẢM 10%'].map((coupon) => {
              const isSaved = !!savedCoupons[coupon];
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
              <span className="font-semibold text-slate-700">Quận Ba Đình, Hà Nội</span>
            </div>
            <div className="flex gap-4 text-slate-500 pl-7">
              <span className="w-16">Phí vận chuyển</span>
              <span className="font-semibold text-slate-700">0đ - 15.000đ</span>
            </div>
          </div>
        </div>

        {/* Product Variation Options */}
        {product.variants && product.variants.length > 0 && (
          <div className="text-xs flex gap-4 items-center py-1">
            <span className="text-slate-400 w-24 shrink-0 font-medium">Phân Loại</span>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v: string) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-4 py-2 border rounded-sm font-semibold cursor-pointer text-slate-700 transition ${
                    selectedVariant === v
                      ? 'border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9]/30 shadow-3xs'
                      : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="text-xs flex gap-4 items-center">
          <span className="text-slate-400 w-24 shrink-0 font-medium">Số Lượng</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden bg-slate-50">
              <button
                onClick={handleDecrease}
                className="w-8 h-8 flex items-center justify-center border-r border-slate-200 hover:bg-slate-100 font-bold cursor-pointer select-none text-base"
              >
                -
              </button>
              <span className="w-12 h-8 flex items-center justify-center font-bold text-slate-800 select-none">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="w-8 h-8 flex items-center justify-center border-l border-slate-200 hover:bg-slate-100 font-bold cursor-pointer select-none text-base"
              >
                +
              </button>
            </div>
            <span className="text-slate-400 font-medium">
              {stockAvailable} sản phẩm có sẵn
            </span>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-slate-100 flex-wrap">
        <button
          onClick={handleAddToCartClick}
          className="flex-1 min-w-[200px] py-3.5 px-6 border border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9] hover:bg-[#fdede7] font-bold rounded-sm text-sm flex items-center justify-center gap-2.5 transition cursor-pointer shadow-3xs"
        >
          <span className="text-lg">🛒</span> Thêm Vào Giỏ Hàng
        </button>
        
        <button
          onClick={() => onBuyNow(product, quantity, selectedVariant)}
          className="flex-1 min-w-[200px] py-3.5 px-6 bg-[#ee4d2d] hover:bg-[#f05d40] text-white font-bold rounded-sm text-sm flex items-center justify-center gap-1 transition cursor-pointer shadow-md"
        >
          Mua Ngay
        </button>
      </div>

    </div>
  )
}
