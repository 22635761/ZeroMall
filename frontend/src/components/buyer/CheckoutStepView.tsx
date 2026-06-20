import React, { useState, useEffect } from 'react'
import type { CartItem } from './Header'
import type { ShippingAddress } from './CartPage'

interface CheckoutStepViewProps {
  addresses: ShippingAddress[]
  activeAddress: ShippingAddress | undefined
  addressName: string
  addressPhone: string
  addressDetails: string
  uniqueSelectedShops: string[]
  selectedCartItems: CartItem[]
  shopsInfo: Record<string, any>
  selectedShopVouchers: Record<string, string>
  allShopVouchers: any[]
  shopMessages: Record<string, string>
  setShopMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setSelectedShopVouchers: React.Dispatch<React.SetStateAction<Record<string, string>>>
  activeShopVoucherModalId: string | null
  setActiveShopVoucherModalId: (id: string | null) => void
  selectedVoucher: 'none' | 'freeship' | 'discount10' | 'discount50k'
  setSelectedVoucher: (v: 'none' | 'freeship' | 'discount10' | 'discount50k') => void
  paymentMethod: 'zeropay' | 'card' | 'gpay' | 'napas' | 'cod'
  setPaymentMethod: (m: 'zeropay' | 'card' | 'gpay' | 'napas' | 'cod') => void
  itemsTotal: number
  insuranceTotal: number
  finalShippingFee: number
  voucherDiscount: number
  shopVoucherDiscountTotal: number
  grandTotal: number
  isPlacingOrder: boolean
  handlePlaceOrder: () => void
  setStep: (step: 'cart' | 'checkout' | 'success') => void
  setShowAddressModal: (show: boolean) => void
  parsePrice: (priceStr: string) => number
  formatPrice: (value: number) => string
  getShopVoucherDiscount: (shopId: string, shopItemsTotal: number) => number
  showVoucherModal: boolean
  setShowVoucherModal: (show: boolean) => void
  user: any
}

export const CheckoutStepView: React.FC<CheckoutStepViewProps> = ({
  addresses,
  activeAddress,
  addressName,
  addressPhone,
  addressDetails,
  uniqueSelectedShops,
  selectedCartItems,
  shopsInfo,
  selectedShopVouchers,
  allShopVouchers,
  shopMessages,
  setShopMessages,
  setSelectedShopVouchers,
  activeShopVoucherModalId,
  setActiveShopVoucherModalId,
  selectedVoucher,
  setSelectedVoucher,
  paymentMethod,
  setPaymentMethod,
  itemsTotal,
  insuranceTotal,
  finalShippingFee,
  voucherDiscount,
  shopVoucherDiscountTotal,
  grandTotal,
  isPlacingOrder,
  handlePlaceOrder,
  setStep,
  setShowAddressModal,
  parsePrice,
  formatPrice,
  getShopVoucherDiscount,
  showVoucherModal,
  setShowVoucherModal,
  user
}) => {
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchWalletBalance = async () => {
      const buyerId = user?.id || 'guest-buyer-id'
      try {
        const res = await fetch(`http://localhost:8000/payments/wallet/${buyerId}`)
        if (res.ok) {
          const data = await res.json()
          setWalletBalance(data.balance)
        }
      } catch (e) {
        console.error('Error fetching wallet balance:', e)
      }
    }
    fetchWalletBalance()
  }, [user])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-28 text-slate-800">
      
      {/* Left Column: Details (8 cols) */}
      <div className="lg:col-span-8 space-y-5">
        
        {/* Address block with Red-Blue striped border */}
        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
          <div 
            className="h-1.5 w-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, #ee4d2d 0, #ee4d2d 10px, transparent 10px, transparent 20px, #4d8ee9 20px, #4d8ee9 30px, transparent 30px, transparent 40px)',
              backgroundSize: '80px 6px'
            }}
          />
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#ee4d2d] text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <span>📍</span> Địa Chỉ Nhận Hàng
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(true)
                }}
                className="text-sm text-sky-655 hover:text-sky-500 hover:underline font-bold cursor-pointer transition duration-150"
              >
                {addresses.length === 0 ? 'Thêm Địa Chỉ' : 'Thay Đổi'}
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-red-500 font-bold text-sm text-left flex items-center gap-2 pt-1.5">
                <span>⚠️</span> Chưa có địa chỉ nhận hàng. Vui lòng thêm địa chỉ nhận hàng mới để tiến hành thanh toán.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-left">
                <div className="font-bold text-slate-800 shrink-0">
                  {addressName} | {addressPhone}
                </div>
                <div className="text-slate-600 font-medium flex-1 leading-relaxed">
                  {addressDetails}
                </div>
                {activeAddress?.isDefault && (
                  <span className="border border-[#ee4d2d] text-[#ee4d2d] text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 w-fit">
                    Mặc Định
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Items grouped by Shop */}
        {uniqueSelectedShops.map(shopId => {
          if (typeof shopId !== 'string') return null
          const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)
          const shopInfo = shopsInfo[shopId]
          const shopName = shopInfo?.name || `Cửa hàng ${shopId.substring(0, 8)}`
          
          const shopItemsTotal = shopItems.reduce((acc, item) => acc + parsePrice(item.product.flashPrice) * item.quantity, 0)
          const shopVoucherDiscount = getShopVoucherDiscount(shopId, shopItemsTotal)
          const shopSubtotal = shopItemsTotal + 37700 - shopVoucherDiscount
          
          return (
            <div key={shopId} className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
              
              {/* Shop Header */}
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏪</span>
                  <span className="font-bold text-slate-855 text-sm sm:text-base">{shopName}</span>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 font-bold flex items-center gap-1">
                    <span>💬</span> Chat ngay
                  </span>
                </div>
              </div>

              {/* Shop Items List */}
              <div className="divide-y divide-slate-100">
                {shopItems.map((item, idx) => {
                  const itemTotal = parsePrice(item.product.flashPrice) * item.quantity
                  
                  return (
                    <div key={idx} className="p-6 space-y-4">
                      
                      {/* Item info row */}
                      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="flex gap-4 items-center min-w-0 flex-1">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover border border-slate-200/60 rounded-xl shrink-0 shadow-3xs"
                          />
                          <div className="min-w-0 flex-1 text-left space-y-1">
                            <h4 className="font-semibold text-slate-855 text-sm sm:text-base leading-snug">
                              {item.product.name}
                            </h4>
                            {item.selectedVariant && (
                              <p className="text-xs text-slate-500 font-semibold">
                                Phân loại: {item.selectedVariant}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-8 text-sm shrink-0 pl-20 sm:pl-0">
                          <div className="text-slate-500 font-medium">
                            {item.product.flashPrice} <span className="text-xs text-slate-400 font-bold ml-1">x{item.quantity}</span>
                          </div>
                          <div className="font-bold text-slate-850 text-right min-w-[90px] text-base">
                            {formatPrice(itemTotal)}
                          </div>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>

              {/* Shop Voucher Selector Row */}
              <div className="px-6 py-4 border-t border-slate-100 bg-[#fafafa]/50 flex items-center justify-between text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-500 text-lg">🎟️</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">Voucher của Shop:</span>
                  {selectedShopVouchers[shopId] && (
                    <span className="text-xs bg-red-50 text-[#ee4d2d] border border-red-200 px-2.5 py-0.5 rounded-sm font-bold font-mono">
                      {allShopVouchers.find(v => v.id === selectedShopVouchers[shopId])?.code} (-{formatPrice(shopVoucherDiscount)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedShopVouchers[shopId] && (
                    <button
                      type="button"
                      onClick={() => setSelectedShopVouchers(prev => ({ ...prev, [shopId]: '' }))}
                      className="text-xs sm:text-sm text-slate-505 hover:text-red-500 transition cursor-pointer font-bold"
                    >
                      Xóa
                    </button>
                  )}
                  {selectedShopVouchers[shopId] && <span className="text-slate-200 font-normal">|</span>}
                  <button
                    type="button"
                    onClick={() => setActiveShopVoucherModalId(shopId)}
                    className="text-xs sm:text-sm text-sky-600 hover:text-sky-555 font-bold cursor-pointer transition"
                  >
                    {selectedShopVouchers[shopId] ? 'Thay Đổi' : 'Chọn Voucher'}
                  </button>
                </div>
              </div>

              {/* Shop Shipping & Note Footer */}
              <div className="px-6 py-5 border-t border-slate-100 bg-[#fafafa]/30 flex flex-col md:flex-row gap-5 justify-between items-stretch md:items-center text-sm">
                <div className="flex-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <span className="font-bold text-slate-655 whitespace-nowrap text-xs sm:text-sm">Lời nhắn:</span>
                  <input
                    type="text"
                    placeholder="Lưu ý cho Người bán..."
                    value={shopMessages[shopId] || ''}
                    onChange={(e) => setShopMessages(prev => ({ ...prev, [shopId]: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:ring-1 focus:ring-[#ee4d2d] focus:outline-none w-full max-w-md bg-white font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
                
                <div className="text-right whitespace-nowrap md:self-end">
                  <span className="text-xs text-slate-400 font-bold mr-2">Tổng số tiền ({shopItems.length} sản phẩm):</span>
                  <span className="text-base font-black text-[#ee4d2d]">{formatPrice(shopSubtotal)}</span>
                </div>
              </div>

            </div>
          )
        })}

        {/* Payment Options Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-3xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">💳</span>
            <h3 className="font-black text-slate-805 text-sm sm:text-base uppercase tracking-wider">Phương Thức Thanh Toán</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {[
              { id: 'zeropay', label: 'ZeroPay', icon: '⚡' },
              { id: 'card', label: 'Thẻ tín dụng', icon: '💳' },
              { id: 'gpay', label: 'Google Pay', icon: '🤖' },
              { id: 'napas', label: 'Thẻ ATM', icon: '🏦' },
              { id: 'cod', label: 'Thanh toán COD', icon: '💵' }
            ].map(method => (
              <div
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition select-none ${
                  paymentMethod === method.id 
                    ? 'border-[#ee4d2d] bg-[#feeee9]/25 text-[#ee4d2d] font-bold shadow-3xs' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-500 font-semibold'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-[11px] leading-tight">{method.label}</span>
                {method.id === 'zeropay' && walletBalance !== null && (
                  <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">
                    ({formatPrice(walletBalance)})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Invoice Sidebar (4 cols) */}
      <div className="lg:col-span-4 space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-3xs space-y-5 sticky top-6">
          
          {/* ZeroMall Voucher Section */}
          <div className="space-y-3.5 pb-5 border-b border-slate-100">
            <div className="flex justify-between items-center text-xs uppercase font-extrabold text-slate-400 tracking-wider">
              <span>🎟️ ZeroMall Voucher</span>
              {selectedVoucher !== 'none' && (
                <button 
                  onClick={() => setSelectedVoucher('none')}
                  className="text-[#ee4d2d] hover:underline normal-case cursor-pointer font-bold"
                >
                  Xóa
                </button>
              )}
            </div>
            
            <div 
              onClick={() => setShowVoucherModal(true)}
              className="flex justify-between items-center p-3.5 border border-dashed border-[#ee4d2d]/60 bg-[#feeee9]/10 rounded-xl cursor-pointer hover:bg-[#feeee9]/20 transition"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>🎁</span>
                <span>
                  {selectedVoucher === 'freeship' && 'Miễn Phí Vận Chuyển Extra'}
                  {selectedVoucher === 'discount10' && 'Giảm 10% Tổng Đơn'}
                  {selectedVoucher === 'discount50k' && 'Giảm 50.000đ'}
                  {selectedVoucher === 'none' && 'Chọn hoặc nhập mã giảm giá'}
                </span>
              </div>
              <span className="text-sky-600 hover:text-sky-505 font-bold text-xs">
                {selectedVoucher !== 'none' ? 'Thay Đổi' : 'Chọn Mã'}
              </span>
            </div>
          </div>

          {/* Invoice Line-Items */}
          <div className="space-y-4 text-xs font-bold text-slate-655">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Tạm tính:</span>
              <span className="text-slate-800 text-sm">{formatPrice(itemsTotal)}</span>
            </div>
            {insuranceTotal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Phí bảo hiểm:</span>
                <span className="text-slate-800 text-sm">{formatPrice(insuranceTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Phí vận chuyển:</span>
              <span className="text-slate-800 text-sm">{formatPrice(finalShippingFee)}</span>
            </div>
            
            {voucherDiscount > 0 && (
              <div className="flex justify-between items-center text-[#ee4d2d] bg-[#feeee9]/25 px-2.5 py-1.5 rounded border border-dashed border-[#ee4d2d]/30">
                <span>ZeroMall Voucher:</span>
                <span>-{formatPrice(voucherDiscount)}</span>
              </div>
            )}
            
            {shopVoucherDiscountTotal > 0 && (
              <div className="flex justify-between items-center text-rose-600 bg-rose-50/40 px-2.5 py-1.5 rounded border border-dashed border-rose-200">
                <span>Voucher của Shop:</span>
                <span>-{formatPrice(shopVoucherDiscountTotal)}</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4.5 mt-4.5 flex justify-between items-center">
              <span className="text-slate-800 text-sm sm:text-base font-extrabold uppercase">Tổng thanh toán:</span>
              <span className="text-[#ee4d2d] text-2xl font-black tracking-tight">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout & Back Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handlePlaceOrder}
              disabled={selectedCartItems.length === 0 || isPlacingOrder}
              className="w-full py-3.5 bg-[#ee4d2d] hover:bg-[#f05d40] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang Đặt Hàng...</span>
                </>
              ) : (
                'Đặt Hàng'
              )}
            </button>
            
            <button
              onClick={() => setStep('cart')}
              disabled={isPlacingOrder}
              className="w-full py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl transition duration-150 cursor-pointer text-center"
            >
              Trở lại Giỏ Hàng
            </button>
          </div>

        </div>
      </div>

      {/* Voucher Selection Modal (rendered inline within Checkout view) */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh] text-left">
            <div className="bg-white p-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-sm text-[#ee4d2d] flex items-center gap-1.5">
                <span>🎟️</span> Chọn ZeroMall Voucher
              </h3>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer animate-in rotate-in duration-100"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4.5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/20">
              {/* Option 1: Freeship */}
              <div 
                onClick={() => {
                  setSelectedVoucher(selectedVoucher === 'freeship' ? 'none' : 'freeship')
                  setShowVoucherModal(false)
                }}
                className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition ${
                  selectedVoucher === 'freeship'
                    ? 'border-[#ee4d2d] bg-[#feeee9]/20 shadow-3xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-2xl mt-0.5">🚚</span>
                <div className="text-left text-xs font-semibold">
                  <p className="font-extrabold text-slate-805">Miễn Phí Vận Chuyển Extra</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Giảm tối đa 35.000đ phí giao hàng</p>
                </div>
              </div>

              {/* Option 2: Discount 10% */}
              <div 
                onClick={() => {
                  setSelectedVoucher(selectedVoucher === 'discount10' ? 'none' : 'discount10')
                  setShowVoucherModal(false)
                }}
                className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition ${
                  selectedVoucher === 'discount10'
                    ? 'border-[#ee4d2d] bg-[#feeee9]/20 shadow-3xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-2xl mt-0.5">🏷️</span>
                <div className="text-left text-xs font-semibold">
                  <p className="font-extrabold text-slate-805">Voucher giảm 10%</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Áp dụng trực tiếp vào tổng hóa đơn</p>
                </div>
              </div>

              {/* Option 3: Discount 50k */}
              <div 
                onClick={() => {
                  setSelectedVoucher(selectedVoucher === 'discount50k' ? 'none' : 'discount50k')
                  setShowVoucherModal(false)
                }}
                className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition ${
                  selectedVoucher === 'discount50k'
                    ? 'border-[#ee4d2d] bg-[#feeee9]/20 shadow-3xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-2xl mt-0.5">🔥</span>
                <div className="text-left text-xs font-semibold">
                  <p className="font-extrabold text-slate-805">Voucher giảm 50.000đ</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Đơn hàng tối thiểu 300.000đ</p>
                </div>
              </div>
            </div>
            
            <div className="p-4.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowVoucherModal(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer bg-white border border-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Voucher Selector Modal (Popup) */}
      {activeShopVoucherModalId && (() => {
        const shopId = activeShopVoucherModalId
        const shopInfo = shopsInfo[shopId]
        const shopName = shopInfo?.name || `Cửa hàng ${shopId.substring(0, 8)}`
        const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)
        const shopItemsTotal = shopItems.reduce((acc, item) => acc + parsePrice(item.product.flashPrice) * item.quantity, 0)
        
        const shopVouchers = allShopVouchers.filter(v => v.shopId === shopId)
        const selectedVoucherId = selectedShopVouchers[shopId]
        
        return (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-850 animate-in fade-in duration-200">
            <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh] text-left">
              <div className="bg-white p-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-sm text-[#ee4d2d] flex items-center gap-1.5">
                  <span>🎟️</span> Voucher từ {shopName}
                </h3>
                <button 
                  onClick={() => setActiveShopVoucherModalId(null)}
                  className="text-slate-405 hover:text-slate-655 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-4.5 overflow-y-auto space-y-3 flex-1 bg-slate-50/15">
                {shopVouchers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                    Cửa hàng chưa phát hành Voucher nào hoặc đã hết hạn.
                  </div>
                ) : (
                  shopVouchers.map((voucher: any) => {
                    const isSelected = selectedVoucherId === voucher.id
                    const isMinSpendMet = shopItemsTotal >= voucher.minSpend
                    
                    return (
                      <div
                        key={voucher.id}
                        onClick={() => {
                          if (isMinSpendMet) {
                            setSelectedShopVouchers(prev => ({
                              ...prev,
                              [shopId]: isSelected ? '' : voucher.id
                            }))
                            setActiveShopVoucherModalId(null)
                          }
                        }}
                        className={`p-4 border rounded-xl flex items-start justify-between gap-3 transition cursor-pointer relative ${
                          isSelected 
                            ? 'border-[#ee4d2d] bg-[#feeee9]/20 shadow-3xs' 
                            : isMinSpendMet 
                              ? 'border-slate-200 hover:border-slate-300 bg-white' 
                              : 'border-slate-100 bg-slate-100/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="text-2xl mt-0.5">🏷️</span>
                          <div className="text-left text-xs font-semibold">
                            <p className="font-extrabold text-slate-805">Mã: {voucher.code}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">
                              Giảm {voucher.type === 'percentage' ? `${voucher.value}%` : formatPrice(voucher.value)}
                              {voucher.maxDiscount && ` (Tối đa ${formatPrice(voucher.maxDiscount)})`}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                              Đơn tối thiểu: {formatPrice(voucher.minSpend)}
                            </p>
                            {!isMinSpendMet && (
                              <p className="text-[9px] text-[#ee4d2d] font-bold mt-1">
                                Chưa đủ điều kiện tối thiểu (còn thiếu {formatPrice(voucher.minSpend - shopItemsTotal)})
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {isMinSpendMet && (
                          <div className="flex items-center justify-center shrink-0">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                              isSelected 
                                ? 'bg-[#ee4d2d] border-[#ee4d2d] text-white' 
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <span className="text-[10px] font-bold">✓</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              
              <div className="p-4.5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  onClick={() => setActiveShopVoucherModalId(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer bg-white border border-slate-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}
