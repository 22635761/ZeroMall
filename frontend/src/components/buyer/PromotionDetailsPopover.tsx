import React, { useEffect, useRef } from 'react'

interface PromotionDetailsPopoverProps {
  isOpen: boolean
  onClose: () => void
  itemsOriginalTotal: number
  productDiscountTotal: number
  voucherDiscountTotal: number
  totalSavings: number
  finalPayable: number
  formatPrice: (price: number) => string
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const PromotionDetailsPopover: React.FC<PromotionDetailsPopoverProps> = ({
  isOpen,
  onClose,
  itemsOriginalTotal,
  productDiscountTotal,
  voucherDiscountTotal,
  totalSavings,
  finalPayable,
  formatPrice,
  onMouseEnter,
  onMouseLeave
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      ref={popoverRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute right-0 bottom-full mb-3 z-50 w-80 md:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-5 text-left text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200 select-text"
    >
      {/* Downward pointing arrow */}
      <div className="absolute -bottom-2 right-12 w-4 h-4 bg-white border-b border-r border-slate-200/90 transform rotate-45 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Chi tiết khuyến mãi</h4>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Rows */}
      <div className="py-3.5 space-y-3 text-xs">
        {/* 1. Total items original price */}
        <div className="flex items-center justify-between text-slate-600">
          <span>Tổng tiền hàng</span>
          <span className="font-semibold text-slate-800">{formatPrice(itemsOriginalTotal)}</span>
        </div>

        {/* 2. Product discount (Original Price - Selling Price) */}
        <div className="flex items-center justify-between text-slate-600">
          <span>Giảm giá sản phẩm</span>
          <span className={`font-semibold ${productDiscountTotal > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
            {productDiscountTotal > 0 ? `-${formatPrice(productDiscountTotal)}` : '-0đ'}
          </span>
        </div>

        {/* 3. Voucher discount */}
        <div className="flex items-center justify-between text-slate-600">
          <span>Voucher giảm giá</span>
          <span className={`font-semibold ${voucherDiscountTotal > 0 ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
            {voucherDiscountTotal > 0 ? `-${formatPrice(voucherDiscountTotal)}` : '-0đ'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 pt-3 space-y-2">
        {/* 4. Total Savings (Product discount + Voucher discount) */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">Tiết kiệm</span>
          <span className="font-bold text-rose-600">
            {totalSavings > 0 ? `-${formatPrice(totalSavings)}` : '-0đ'}
          </span>
        </div>

        {/* 5. Final Amount Payable */}
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="font-extrabold text-slate-900">Tổng số tiền</span>
          <span className="font-black text-emerald-600 text-base tracking-tight">
            {formatPrice(finalPayable)}
          </span>
        </div>

        {/* Note */}
        <p className="text-[10px] text-slate-400 font-medium text-right pt-0.5">
          Số tiền cuối cùng thanh toán
        </p>
      </div>
    </div>
  )
}
