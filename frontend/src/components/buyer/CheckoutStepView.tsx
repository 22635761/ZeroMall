import React, { useState, useEffect } from 'react'
import type { CartItem } from '../../models/cart.model'
import type { ShippingAddress } from '../../models/address.model'
import { API_BASE_URL } from '../../config/api.config'

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
  setActiveShopVoucherModalId: (id: string | null) => void
  selectedVoucher: 'none' | 'freeship' | 'discount10' | 'discount50k'
  setSelectedVoucher: (v: 'none' | 'freeship' | 'discount10' | 'discount50k') => void
  paymentMethod: 'zeropay' | 'cod' | 'sepay'
  setPaymentMethod: (m: 'zeropay' | 'cod' | 'sepay') => void
  itemsTotal: number
  insuranceTotal: number
  finalShippingFee: number
  shopShippingFees: Record<string, number>
  shopPackageInfos?: Record<string, { weightKg: number; isBulky: boolean; itemCount: number }>
  voucherDiscount: number
  shopVoucherDiscountTotal: number
  grandTotal: number
  isPlacingOrder: boolean
  handlePlaceOrder: () => void
  setStep: (step: 'cart' | 'checkout' | 'success') => void
  setShowAddressModal: (show: boolean) => void
  parsePrice: (priceVal: any) => number
  formatPrice: (value: number) => string
  getShopVoucherDiscount: (shopId: string, shopItemsTotal: number) => number
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
  setActiveShopVoucherModalId,
  selectedVoucher,
  setSelectedVoucher,
  paymentMethod,
  setPaymentMethod,
  itemsTotal,
  insuranceTotal,
  finalShippingFee,
  shopShippingFees,
  shopPackageInfos,
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
  setShowVoucherModal,
  user
}) => {
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchWalletBalance = async () => {
      const buyerId = user?.id || 'guest-buyer-id'
      try {
        const res = await fetch(`${API_BASE_URL}/payments/wallet/${buyerId}`)
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
        
        {/* Address block with ZeroMall emerald-teal striped border */}
        <div className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
          <div 
            className="h-1.5 w-full"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, #059669 0, #059669 10px, transparent 10px, transparent 20px, #0d9488 20px, #0d9488 30px, transparent 30px, transparent 40px)',
              backgroundSize: '80px 6px'
            }}
          />
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-emerald-600 text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <span>📍</span> Địa Chỉ Nhận Hàng
              </h3>
              <button
                onClick={() => {
                  setShowAddressModal(true)
                }}
                className="text-sm text-emerald-600 hover:text-emerald-500 hover:underline font-bold cursor-pointer transition duration-150"
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
                  <span className="border border-emerald-600 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide shrink-0 w-fit">
                    Mặc Định
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sản phẩm header row */}
        <div className="hidden lg:grid grid-cols-12 gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider px-6">
          <div className="col-span-6">Sản phẩm</div>
          <div className="col-span-2 text-center">Đơn giá</div>
          <div className="col-span-2 text-center">Số lượng</div>
          <div className="col-span-2 text-right">Thành tiền</div>
        </div>

        {/* Items grouped by Shop */}
        {uniqueSelectedShops.map(shopId => {
          if (typeof shopId !== 'string') return null
          const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)
          const shopInfo = shopsInfo[shopId]
          const shopName = shopInfo?.name || (shopId.startsWith('Shop') ? shopId : `Shop ${shopId.substring(0, 8)}`)
          
          const shopItemsTotal = shopItems.reduce((acc, item) => acc + parsePrice(item.product.flashPrice || item.product.price || 0) * item.quantity, 0)
          const shopVoucherDiscount = getShopVoucherDiscount(shopId, shopItemsTotal)
          const shopShipFee = shopShippingFees[shopId] || 37700
          const shopSubtotal = shopItemsTotal + shopShipFee - shopVoucherDiscount

          // Parse shop pickup address for display
          let shopPickupLocation = ''
          try {
            if (shopInfo?.pickupAddress) {
              const pickup = typeof shopInfo.pickupAddress === 'string' ? JSON.parse(shopInfo.pickupAddress) : shopInfo.pickupAddress
              if (typeof pickup === 'object' && pickup !== null) {
                const parts = [pickup.ward || pickup.wardName, pickup.district || pickup.districtName, pickup.province || pickup.provinceName || pickup.city].filter(Boolean)
                shopPickupLocation = parts.join(', ') || pickup.address || pickup.detailAddress || ''
              } else if (typeof pickup === 'string') {
                shopPickupLocation = pickup
              }
            }
          } catch {
            if (typeof shopInfo?.pickupAddress === 'string') {
              shopPickupLocation = shopInfo.pickupAddress
            }
          }
          
          return (
            <div key={shopId} className="bg-white rounded-2xl border border-slate-200/50 shadow-3xs overflow-hidden">
              
              {/* Shop Header */}
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🏪</span>
                  <a 
                    href={`/shop/${shopId}`} 
                    className="font-bold text-slate-800 hover:text-emerald-600 transition text-sm sm:text-base cursor-pointer flex items-center gap-1"
                  >
                    <span>{shopName}</span>
                    <span className="text-xs text-slate-400">›</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open_chat_with_shop', {
                        detail: { shopId, shopName }
                      }))
                    }}
                    className="text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>💬</span> Chat ngay
                  </button>
                </div>
              </div>

              {/* Shop Items List */}
              <div className="divide-y divide-slate-100">
                {shopItems.map((item, idx) => {
                  const unitPrice = parsePrice(item.product.flashPrice || item.product.price || 0)
                  const itemTotal = unitPrice * item.quantity
                  
                  return (
                    <div key={idx} className="px-6 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        {/* Product Info */}
                        <div className="col-span-6 flex gap-4 items-center min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover border border-slate-200/60 rounded-xl shrink-0 shadow-3xs"
                          />
                          <div className="min-w-0 flex-1 text-left space-y-1">
                            <h4 className="font-semibold text-slate-800 text-sm leading-snug truncate">
                              {item.product.name}
                            </h4>
                            {item.selectedVariant && (
                              <p className="text-xs text-slate-500 font-semibold">
                                Phân loại: {item.selectedVariant}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-2 flex lg:justify-center text-sm">
                          <span className="lg:hidden text-slate-400 font-bold mr-2">Đơn giá:</span>
                          <span className="text-slate-600 font-medium">
                            {item.product.flashPrice || formatPrice(unitPrice)}
                          </span>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 flex lg:justify-center text-sm">
                          <span className="lg:hidden text-slate-400 font-bold mr-2">Số lượng:</span>
                          <span className="text-slate-700 font-bold">x{item.quantity}</span>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 flex lg:justify-end text-sm">
                          <span className="lg:hidden text-slate-400 font-bold mr-2">Thành tiền:</span>
                          <span className="font-bold text-slate-800">{formatPrice(itemTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Shop Voucher Selector Row */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="text-rose-500 text-lg">🎟️</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm">Voucher của Shop:</span>
                  {selectedShopVouchers[shopId] && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-sm font-bold font-mono">
                      {allShopVouchers.find(v => v.id === selectedShopVouchers[shopId])?.code} (-{formatPrice(shopVoucherDiscount)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedShopVouchers[shopId] && (
                    <button
                      type="button"
                      onClick={() => setSelectedShopVouchers(prev => ({ ...prev, [shopId]: '' }))}
                      className="text-xs sm:text-sm text-slate-500 hover:text-red-500 transition cursor-pointer font-bold"
                    >
                      Xóa
                    </button>
                  )}
                  {selectedShopVouchers[shopId] && <span className="text-slate-200 font-normal">|</span>}
                  <button
                    type="button"
                    onClick={() => setActiveShopVoucherModalId(shopId)}
                    className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-500 font-bold cursor-pointer transition"
                  >
                    {selectedShopVouchers[shopId] ? 'Thay Đổi' : 'Chọn Voucher'}
                  </button>
                </div>
              </div>

              {/* Shop Shipping Fee Row - PER SHOP (Shopee style) */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                {(() => {
                  const pkgInfo = shopPackageInfos?.[shopId]
                  return (
                    <div className="space-y-1.5">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🚚</span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-700 text-xs sm:text-sm">Phương thức vận chuyển:</span>
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                                Nhanh
                              </span>
                              {pkgInfo && (
                                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>📦</span> Kiện gộp: {pkgInfo.weightKg} kg
                                </span>
                              )}
                              {pkgInfo?.isBulky && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Hàng cồng kềnh
                                </span>
                              )}
                            </div>
                            {shopPickupLocation && (
                              <p className="text-[10px] text-slate-400 font-medium">
                                Gửi từ: {shopPickupLocation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">
                            {formatPrice(shopShipFee)}
                          </span>
                        </div>
                      </div>

                      {pkgInfo && pkgInfo.itemCount > 1 && (
                        <p className="text-[10px] text-emerald-700 font-medium pl-8">
                          ✨ Đã gom chung {pkgInfo.itemCount} sản phẩm của shop vào 1 kiện hàng để tối ưu chi phí vận chuyển.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Shop Note + Shop Subtotal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/20 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center text-sm">
                <div className="flex-1 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <span className="font-bold text-slate-600 whitespace-nowrap text-xs sm:text-sm">Lời nhắn:</span>
                  <input
                    type="text"
                    placeholder="Lưu ý cho Người bán..."
                    value={shopMessages[shopId] || ''}
                    onChange={(e) => setShopMessages(prev => ({ ...prev, [shopId]: e.target.value }))}
                    className="border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none w-full max-w-md bg-white font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-normal"
                  />
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Tổng số tiền ({shopItems.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm):
                  </div>
                  <span className="text-base font-black text-emerald-600">
                    {formatPrice(shopSubtotal)}
                  </span>
                </div>
              </div>

            </div>
          )
        })}

        {/* Payment Options Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-3xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">💳</span>
            <h3 className="font-black text-slate-800 text-sm sm:text-base uppercase tracking-wider">Phương Thức Thanh Toán</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
            {[
              { id: 'sepay', label: 'VietQR Chuyển khoản', icon: '📲' },
              { id: 'zeropay', label: 'ZeroPay', icon: '⚡' },
              { id: 'cod', label: 'Thanh toán COD', icon: '💵' }
            ].map(method => (
              <div
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition select-none ${
                  paymentMethod === method.id 
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-700 font-bold shadow-3xs' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-500 font-semibold'
                }`}
              >
                <span className="text-2xl">{method.icon}</span>
                <span className="text-[11px] leading-tight text-center">{method.label}</span>
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
                  className="text-emerald-600 hover:underline normal-case cursor-pointer font-bold"
                >
                  Xóa
                </button>
              )}
            </div>
            
            <div 
              onClick={() => setShowVoucherModal(true)}
              className="flex justify-between items-center p-3.5 border border-dashed border-emerald-400/60 bg-emerald-50/20 rounded-xl cursor-pointer hover:bg-emerald-50/40 transition"
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
              <span className="text-emerald-600 hover:text-emerald-500 font-bold text-xs">
                {selectedVoucher !== 'none' ? 'Thay Đổi' : 'Chọn Mã'}
              </span>
            </div>
          </div>

          {/* Invoice Line-Items */}
          <div className="space-y-4 text-xs font-bold text-slate-600">
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
            
            {/* Per-shop shipping breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Phí vận chuyển:</span>
                <span className="text-slate-800 text-sm">{formatPrice(finalShippingFee)}</span>
              </div>
              {uniqueSelectedShops.length > 1 && (
                <div className="pl-3 space-y-1.5 border-l-2 border-slate-100 ml-1">
                  {uniqueSelectedShops.map(shopId => {
                    const shopInfo = shopsInfo[shopId]
                    const shopName = shopInfo?.name || `Shop ${shopId.substring(0, 6)}`
                    const shopFee = shopShippingFees[shopId] || 37700
                    return (
                      <div key={shopId} className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="truncate max-w-[140px]" title={shopName}>🏪 {shopName}</span>
                        <span className="font-semibold text-slate-500">{formatPrice(shopFee)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
            {voucherDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/40 px-2.5 py-1.5 rounded border border-dashed border-emerald-300/50">
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
              <span className="text-emerald-600 text-2xl font-black tracking-tight">{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {/* Checkout & Back Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handlePlaceOrder}
              disabled={selectedCartItems.length === 0 || isPlacingOrder}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

    </div>
  )
}
