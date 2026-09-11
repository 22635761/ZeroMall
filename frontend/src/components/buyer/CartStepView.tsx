import React, { useState, useRef, useEffect } from 'react'
import type { CartItem } from '../../models/cart.model'
import { PromotionDetailsPopover } from './PromotionDetailsPopover'

interface CartStepViewProps {
  cart: CartItem[]
  selectedKeys: string[]
  shopsInfo: Record<string, any>
  groupedItems: Record<string, CartItem[]>
  getItemKey: (item: CartItem) => string
  handleSelectItem: (key: string) => void
  handleSelectShopItems: (items: CartItem[]) => void
  handleSelectAll: () => void
  handleRemoveSelected: () => void
  onUpdateQuantity: (productId: string, variant: string, quantity: number) => void
  onRemoveItem: (productId: string, variant?: string) => void
  onBackToHome: () => void
  setStep: (step: 'cart' | 'checkout' | 'success') => void
  selectedCartItems: CartItem[]
  itemsTotal: number
  formatPrice: (val: number) => string
  parsePrice: (priceVal: any) => number

  // Voucher props
  selectedShopVouchers: Record<string, string>
  onOpenShopVoucherModal: (shopId: string) => void
  onRemoveShopVoucher: (shopId: string) => void
  getShopVoucherDiscount: (shopId: string, shopItemsTotal: number) => number
  allShopVouchers: any[]
  selectedVoucher: string
  onOpenPlatformVoucherModal: () => void
  voucherDiscount: number
  shopVoucherDiscountTotal: number
  voucherDiscountTotal?: number

  // Promotion details breakdown
  itemsOriginalTotal: number
  productDiscountTotal: number
  totalSavings: number
  finalPayable: number
}

export const CartStepView: React.FC<CartStepViewProps> = ({
  cart,
  selectedKeys,
  shopsInfo,
  groupedItems,
  getItemKey,
  handleSelectItem,
  handleSelectShopItems,
  handleSelectAll,
  handleRemoveSelected,
  onUpdateQuantity,
  onRemoveItem,
  onBackToHome,
  setStep,
  selectedCartItems,
  formatPrice,
  parsePrice,
  selectedShopVouchers,
  onOpenShopVoucherModal,
  onRemoveShopVoucher,
  getShopVoucherDiscount,
  allShopVouchers,
  selectedVoucher,
  onOpenPlatformVoucherModal,
  voucherDiscount,
  shopVoucherDiscountTotal,
  voucherDiscountTotal,
  itemsOriginalTotal,
  productDiscountTotal,
  totalSavings,
  finalPayable
}) => {
  const [showPromotionDetails, setShowPromotionDetails] = useState(false)
  const hoverTimeoutRef = useRef<any>(null)

  const handleMouseEnterPromotion = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setShowPromotionDetails(true)
  }

  const handleMouseLeavePromotion = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPromotionDetails(false)
    }, 250)
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const effectiveVoucherDiscount = voucherDiscountTotal !== undefined ? voucherDiscountTotal : (voucherDiscount + shopVoucherDiscountTotal)

  return (
    <>
      {cart.length === 0 ? (
        /* Empty Cart */
        <div className="bg-white border border-slate-200/60 rounded-2xl p-16 text-center shadow-3xs flex flex-col items-center gap-4">
          <div className="text-6xl animate-bounce">🛒</div>
          <h3 className="font-extrabold text-slate-800 text-lg">Giỏ hàng của bạn còn trống</h3>
          <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
            Hãy thêm các sản phẩm chính hãng từ các gian hàng xanh trên ZeroMall để bắt đầu mua sắm.
          </p>
          <button 
            onClick={onBackToHome}
            className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition duration-200 cursor-pointer"
          >
            Mua Sắm Ngay
          </button>
        </div>
      ) : (
        /* Cart Items Grid */
        <div className="space-y-4 pb-36">
          
          {/* Table Column Titles */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 bg-white border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-500 uppercase tracking-wider shadow-2xs">
            <div className="col-span-6 flex items-center gap-3">
              <input
                type="checkbox"
                checked={cart.length > 0 && cart.every(item => selectedKeys.includes(getItemKey(item)))}
                onChange={handleSelectAll}
                className="w-4.5 h-4.5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Sản Phẩm</span>
            </div>
            <div className="col-span-2 text-center">Đơn Giá</div>
            <div className="col-span-2 text-center">Số Lượng</div>
            <div className="col-span-1 text-center">Số Tiền</div>
            <div className="col-span-1 text-right">Thao Tác</div>
          </div>

          {/* Grouped by Shop */}
          {Object.keys(groupedItems).map(shopId => {
            const shopItems = groupedItems[shopId]
            const shopInfo = shopsInfo[shopId]
            const shopName = shopInfo?.name || (shopId.startsWith('Shop') ? shopId : `Shop ${shopId.substring(0, 8)}`)
            const allShopSelected = shopItems.every(item => selectedKeys.includes(getItemKey(item)))

            // Compute shop items subtotal
            const shopSelectedItems = shopItems.filter(item => selectedKeys.includes(getItemKey(item)))
            const shopItemsTotal = shopSelectedItems.reduce((acc, item) => {
              const unitPrice = parsePrice(item.product.flashPrice || item.product.price || item.product.originalPrice || 0)
              return acc + unitPrice * item.quantity
            }, 0)

            const currentShopVoucherId = selectedShopVouchers[shopId]
            const currentShopDiscount = getShopVoucherDiscount(shopId, shopItemsTotal)
            const currentVoucherObj = allShopVouchers.find(v => v.id === currentShopVoucherId)
            
            return (
              <div key={shopId} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-2xs">
                
                {/* Clean Shop Header (No shipping clutter) */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={allShopSelected}
                      onChange={() => handleSelectShopItems(shopItems)}
                      className="w-4.5 h-4.5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                      Shop
                    </span>
                    <a 
                      href={`/shop/${shopId}`} 
                      className="font-extrabold text-slate-800 hover:text-emerald-600 transition text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{shopName}</span>
                      <span className="text-[10px] text-slate-400">›</span>
                    </a>

                    {/* Chat with Shop Button (ZeroMall Brand Green) */}
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open_chat_with_shop', {
                          detail: { shopId, shopName }
                        }))
                      }}
                      title={`Chat ngay với ${shopName}`}
                      className="text-emerald-600 hover:text-emerald-700 p-1 px-2 rounded-md hover:bg-emerald-50 transition cursor-pointer flex items-center justify-center gap-1 text-xs font-bold border border-emerald-200/60 ml-1"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
                      </svg>
                      <span className="text-[11px] font-bold">Chat</span>
                    </button>
                  </div>
                  
                  {/* ZeroMall Assurance Badge */}
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                    <span>🛡️</span>
                    <span>Đảm bảo ZeroMall</span>
                  </div>
                </div>

                {/* Shop Items List */}
                <div className="divide-y divide-slate-100">
                  {shopItems.map((item, idx) => {
                    const itemKey = getItemKey(item)
                    const isSelected = selectedKeys.includes(itemKey)
                    const unitPrice = parsePrice(item.product.flashPrice || item.product.price || 0)
                    const rawOrig = parsePrice(item.product.originalPrice)
                    const originalPrice = rawOrig > 0 ? Math.max(rawOrig, unitPrice) : unitPrice
                    const hasDiscount = originalPrice > unitPrice
                    const itemSubtotal = unitPrice * item.quantity
                    
                    return (
                      <div key={idx} className={`p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition ${isSelected ? 'bg-emerald-50/20' : ''}`}>
                        
                        {/* Product Info Column */}
                        <div className="col-span-6 flex gap-3 items-center min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectItem(itemKey)}
                            className="w-4.5 h-4.5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover border border-slate-200/60 rounded-xl shrink-0 shadow-3xs"
                          />
                          
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-bold text-slate-800 text-xs truncate hover:text-emerald-600 transition cursor-pointer">
                              {item.product.name}
                            </h4>
                            
                            {item.selectedVariant && (
                              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-bold">
                                <span>Phân Loại:</span>
                                <span>{item.selectedVariant}</span>
                              </div>
                            )}

                            {hasDiscount && (
                              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <span>🏷️ Giá ưu đãi</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="col-span-2 flex lg:justify-center items-center justify-between text-xs">
                          <span className="lg:hidden text-slate-400 font-bold">Đơn giá:</span>
                          <div className="flex flex-col lg:items-center">
                            {hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                            )}
                            <span className="font-bold text-slate-700">
                              {item.product.flashPrice || formatPrice(unitPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="col-span-2 flex lg:justify-center items-center justify-between">
                          <span className="lg:hidden text-slate-400 font-bold">Số lượng:</span>
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 bg-slate-50 shadow-3xs">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.selectedVariant || '', item.quantity - 1)}
                              className="px-3 hover:bg-slate-200 text-slate-600 font-bold transition h-full text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10)
                                if (!isNaN(val) && val > 0) {
                                  onUpdateQuantity(item.product.id, item.selectedVariant || '', val)
                                }
                              }}
                              className="w-10 text-center text-xs font-bold bg-white text-slate-700 h-full border-x border-slate-200 focus:outline-none"
                            />
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.selectedVariant || '', item.quantity + 1)}
                              className="px-3 hover:bg-slate-200 text-slate-600 font-bold transition h-full text-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal Column */}
                        <div className="col-span-1 flex lg:justify-center items-center justify-between text-xs">
                          <span className="lg:hidden text-slate-400 font-bold">Số tiền:</span>
                          <span className="font-bold text-slate-900">{formatPrice(itemSubtotal)}</span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex lg:justify-end items-center justify-between">
                          <span className="lg:hidden text-slate-400 font-bold">Thao tác:</span>
                          <button
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                                onRemoveItem(item.product.id, item.selectedVariant)
                              }
                            }}
                            className="text-xs text-slate-400 hover:text-rose-600 font-bold transition cursor-pointer hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Shop Voucher Row (ZeroMall Emerald Style) */}
                <div className="px-5 py-3 border-t border-slate-100 bg-[#f9fbf9] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base text-emerald-600">🎟️</span>
                    <span className="font-extrabold text-slate-800 text-xs">Voucher của Shop</span>
                    {currentShopVoucherId && currentShopDiscount > 0 ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md">
                        Đã giảm {formatPrice(currentShopDiscount)} ({currentVoucherObj?.code})
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {currentShopVoucherId && (
                      <button
                        type="button"
                        onClick={() => onRemoveShopVoucher(shopId)}
                        className="text-slate-400 hover:text-rose-500 font-bold transition cursor-pointer text-xs"
                      >
                        Bỏ chọn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenShopVoucherModal(shopId)}
                      className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <span>{currentShopVoucherId ? 'Xem thêm voucher' : 'Chọn hoặc nhập mã'}</span>
                      <span className="text-[10px]">›</span>
                    </button>
                  </div>
                </div>

              </div>
            )
          })}

          {/* Sticky Cart Footer Summary */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-2xl py-4 px-4 md:px-8 max-w-6xl mx-auto rounded-t-2xl">
            
            {/* ZeroMall Platform Voucher Row */}
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base text-emerald-600">🏷️</span>
                <span className="font-extrabold text-slate-800">ZeroMall Voucher</span>
                {selectedVoucher !== 'none' && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                    {selectedVoucher === 'freeship' && 'Miễn phí vận chuyển (tối đa 35k)'}
                    {selectedVoucher === 'discount10' && 'Giảm 10% toàn sàn'}
                    {selectedVoucher === 'discount50k' && 'Giảm 50.000đ'}
                    {!['freeship', 'discount10', 'discount50k'].includes(selectedVoucher) && `Mã: ${selectedVoucher}`}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenPlatformVoucherModal}
                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer text-xs"
              >
                <span>{selectedVoucher !== 'none' ? 'Thay đổi voucher' : 'Chọn hoặc nhập mã'}</span>
                <span className="text-[10px]">›</span>
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center justify-between md:justify-start gap-6 text-sm text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer py-1 font-bold">
                  <input
                    type="checkbox"
                    checked={cart.length > 0 && cart.every(item => selectedKeys.includes(getItemKey(item)))}
                    onChange={handleSelectAll}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Chọn tất cả ({cart.length})</span>
                </label>
                
                <button 
                  onClick={handleRemoveSelected}
                  disabled={selectedCartItems.length === 0}
                  className="text-slate-400 hover:text-rose-600 disabled:opacity-40 disabled:hover:text-slate-400 font-bold text-xs transition cursor-pointer"
                >
                  Xóa các mục đã chọn
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-5">
                
                {/* Total Payment with Promotion Details Trigger */}
                <div 
                  className="text-right font-semibold relative"
                  onMouseEnter={handleMouseEnterPromotion}
                  onMouseLeave={handleMouseLeavePromotion}
                >
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                    Tổng thanh toán ({selectedCartItems.length} sản phẩm):
                  </div>
                  
                  <div 
                    onClick={() => setShowPromotionDetails(prev => !prev)}
                    className="inline-flex items-center gap-1.5 cursor-pointer select-none group py-0.5"
                    title="Rê chuột để xem chi tiết khuyến mãi"
                  >
                    <span className="text-xl md:text-2xl font-black text-emerald-600 tracking-tight group-hover:text-emerald-700 transition">
                      {formatPrice(finalPayable)}
                    </span>
                    <span className={`text-xs transition-transform duration-200 ${showPromotionDetails ? 'rotate-180 text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      ▼
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div 
                      onClick={() => setShowPromotionDetails(prev => !prev)}
                      className="text-xs text-slate-500 cursor-pointer flex items-center justify-end gap-1 font-medium hover:text-slate-700 transition"
                    >
                      <span>Tiết kiệm</span>
                      <span className="text-rose-600 font-bold">{formatPrice(totalSavings)}</span>
                    </div>
                  )}

                  {/* Chi tiết khuyến mãi Popover (Shopee Style with ZeroMall Palette) */}
                  <PromotionDetailsPopover
                    isOpen={showPromotionDetails}
                    onClose={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
                      setShowPromotionDetails(false)
                    }}
                    onMouseEnter={handleMouseEnterPromotion}
                    onMouseLeave={handleMouseLeavePromotion}
                    itemsOriginalTotal={itemsOriginalTotal}
                    productDiscountTotal={productDiscountTotal}
                    voucherDiscountTotal={effectiveVoucherDiscount}
                    totalSavings={totalSavings}
                    finalPayable={finalPayable}
                    formatPrice={formatPrice}
                  />
                </div>
                
                {/* ZeroMall Brand Emerald Checkout Button */}
                <button
                  onClick={() => setStep('checkout')}
                  disabled={selectedCartItems.length === 0}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-md disabled:shadow-none hover:shadow-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed text-center shrink-0 min-w-[180px]"
                >
                  Mua Hàng
                </button>
              </div>
            </div>

          </div>

        </div>
      )}
    </>
  )
}
