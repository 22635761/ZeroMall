import React from 'react'
import type { CartItem } from './Header'

interface CartStepViewProps {
  cart: CartItem[]
  selectedKeys: string[]
  shopsInfo: Record<string, any>
  groupedItems: Record<string, CartItem[]>
  getItemKey: (item: CartItem) => string
  getShopShippingBadges: (shopId: string) => React.ReactNode
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
  parsePrice: (priceStr: string) => number
}

export const CartStepView: React.FC<CartStepViewProps> = ({
  cart,
  selectedKeys,
  shopsInfo,
  groupedItems,
  getItemKey,
  getShopShippingBadges,
  handleSelectItem,
  handleSelectShopItems,
  handleSelectAll,
  handleRemoveSelected,
  onUpdateQuantity,
  onRemoveItem,
  onBackToHome,
  setStep,
  selectedCartItems,
  itemsTotal,
  formatPrice,
  parsePrice
}) => {
  return (
    <>
      {cart.length === 0 ? (
        /* Empty Cart */
        <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center shadow-3xs flex flex-col items-center gap-4">
          <div className="text-6xl animate-bounce">🛒</div>
          <h3 className="font-bold text-slate-700 text-lg">Giỏ hàng của bạn còn trống</h3>
          <p className="text-slate-400 text-xs max-w-sm leading-relaxed">Hãy thêm các sản phẩm cao cấp, chính hãng từ các cửa hàng xanh trên ZeroMall để bắt đầu mua sắm.</p>
          <button 
            onClick={onBackToHome}
            className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md transition duration-200 cursor-pointer"
          >
            Mua Sắm Ngay
          </button>
        </div>
      ) : (
        /* Cart Items Grid */
        <div className="space-y-4 pb-28">
          
          {/* Table Column Titles */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-white border border-slate-200/50 rounded-xl text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="col-span-6 flex items-center gap-3">
              <input
                type="checkbox"
                checked={cart.length > 0 && cart.every(item => selectedKeys.includes(getItemKey(item)))}
                onChange={handleSelectAll}
                className="w-4.5 h-4.5 rounded-md border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer"
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
            const shopName = shopInfo?.name || `Cửa hàng ${shopId.substring(0, 8)}`
            const allShopSelected = shopItems.every(item => selectedKeys.includes(getItemKey(item)))
            
            return (
              <div key={shopId} className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-3xs">
                
                {/* Shop Header */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={allShopSelected}
                      onChange={() => handleSelectShopItems(shopItems)}
                      className="w-4.5 h-4.5 rounded-md border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer"
                    />
                    <span className="text-base">🏪</span>
                    <span className="font-extrabold text-slate-805 text-xs">{shopName}</span>
                    {getShopShippingBadges(shopId)}
                  </div>
                  
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Đảm bảo ZeroMall
                  </span>
                </div>

                {/* Shop Items List */}
                <div className="divide-y divide-slate-100">
                  {shopItems.map((item, idx) => {
                    const itemKey = getItemKey(item)
                    const isSelected = selectedKeys.includes(itemKey)
                    const itemSubtotal = parsePrice(item.product.flashPrice) * item.quantity
                    
                    return (
                      <div key={idx} className={`p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition ${isSelected ? 'bg-[#feeee9]/15' : ''}`}>
                        
                        {/* Product Info Column */}
                        <div className="col-span-6 flex gap-3 items-center min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectItem(itemKey)}
                            className="w-4.5 h-4.5 rounded-md border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer"
                          />
                          
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover border border-slate-200/60 rounded-xl shrink-0 shadow-3xs"
                          />
                          
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-bold text-slate-800 text-xs truncate hover:text-[#ee4d2d] transition cursor-pointer">
                              {item.product.name}
                            </h4>
                            
                            {item.selectedVariant && (
                              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-bold">
                                <span>Phân Loại:</span>
                                <span>{item.selectedVariant}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price Column */}
                        <div className="col-span-2 flex lg:justify-center items-center justify-between text-xs">
                          <span className="lg:hidden text-slate-400 font-bold">Đơn giá:</span>
                          <span className="font-bold text-slate-700">{item.product.flashPrice}</span>
                        </div>

                        {/* Quantity Controls */}
                        <div className="col-span-2 flex lg:justify-center items-center justify-between">
                          <span className="lg:hidden text-slate-400 font-bold">Số lượng:</span>
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 bg-slate-50 shadow-3xs">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.selectedVariant || '', item.quantity - 1)}
                              className="px-3 hover:bg-slate-200 text-slate-600 font-bold transition h-full text-xs"
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
                              className="px-3 hover:bg-slate-200 text-slate-600 font-bold transition h-full text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Subtotal Column */}
                        <div className="col-span-1 flex lg:justify-center items-center justify-between text-xs">
                          <span className="lg:hidden text-slate-400 font-bold">Số tiền:</span>
                          <span className="font-bold text-[#ee4d2d]">{formatPrice(itemSubtotal)}</span>
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
                            className="text-xs text-rose-500 hover:text-rose-700 font-bold transition cursor-pointer hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Sticky Cart Footer Summary */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 shadow-2xl py-4.5 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto rounded-t-2xl">
            <div className="flex items-center justify-between md:justify-start gap-6 text-sm text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer py-1 font-bold">
                <input
                  type="checkbox"
                  checked={cart.length > 0 && cart.every(item => selectedKeys.includes(getItemKey(item)))}
                  onChange={handleSelectAll}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer"
                />
                <span>Chọn tất cả ({cart.length})</span>
              </label>
              
              <button 
                onClick={handleRemoveSelected}
                disabled={selectedCartItems.length === 0}
                className="text-slate-500 hover:text-[#ee4d2d] disabled:opacity-40 disabled:hover:text-slate-500 font-bold text-xs transition cursor-pointer"
              >
                Xóa các mục đã chọn
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-5">
              <div className="text-right font-semibold">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tổng thanh toán ({selectedCartItems.length} sản phẩm):</div>
                <div className="text-xl md:text-2xl font-black text-[#ee4d2d] tracking-tight">{formatPrice(itemsTotal)}</div>
              </div>
              
              <button
                onClick={() => setStep('checkout')}
                disabled={selectedCartItems.length === 0}
                className="px-8 py-3 bg-[#ee4d2d] hover:bg-[#f05d40] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-md disabled:shadow-none hover:shadow-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed text-center shrink-0 min-w-[200px]"
              >
                Mua Hàng
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  )
}
