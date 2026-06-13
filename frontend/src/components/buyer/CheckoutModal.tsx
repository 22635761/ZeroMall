import React, { useState } from 'react'
import type { CartItem } from './Header'

interface CheckoutModalProps {
  isOpen: boolean
  cart: CartItem[]
  onClose: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  if (!isOpen) return null

  // Flow step: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  
  // Checkout options
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [address, setAddress] = useState(
    'Nguyễn Văn A | (+84) 987654321\nSố 123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
  )
  const [tempAddress, setTempAddress] = useState(address)
  
  const [selectedVoucher, setSelectedVoucher] = useState<'none' | 'freeship' | 'discount10'>('none')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'shopeepay' | 'card'>('cod')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Calculations
  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10)
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ'
  }

  const itemsTotal = cart.reduce((acc, item) => {
    return acc + parsePrice(item.product.flashPrice) * item.quantity
  }, 0)

  const shippingFee = selectedVoucher === 'freeship' ? 0 : 35005
  const discount = selectedVoucher === 'discount10' ? Math.round(itemsTotal * 0.1) : 0
  const grandTotal = itemsTotal + shippingFee - discount

  const handleSaveAddress = () => {
    setAddress(tempAddress)
    setIsEditingAddress(false)
  }

  const handlePlaceOrder = () => {
    setIsPlacingOrder(true)
    setTimeout(() => {
      setIsPlacingOrder(false)
      setStep('success')
    }, 1500)
  }

  const handleFinish = () => {
    onClearCart()
    setStep('cart')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200">
      <div className="bg-[#f8fafc] border border-slate-200/60 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] text-left">
        
        {/* Header */}
        <div className="bg-white p-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-base text-emerald-600 flex items-center gap-1.5">
            <span>🛒</span> 
            {step === 'cart' && 'Giỏ Hàng Của Bạn'}
            {step === 'checkout' && 'Thanh Toán Đơn Hàng'}
            {step === 'success' && 'Đặt Hàng Thành Công'}
          </h3>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
            >
              Đóng ✕
            </button>
          )}
        </div>

        {/* Steps indicator bar */}
        {step !== 'success' && (
          <div className="bg-white border-b border-slate-150/50 py-2.5 px-4 flex justify-around text-xs font-bold text-slate-400 select-none shrink-0">
            <span className={step === 'cart' ? 'text-emerald-600' : 'text-slate-500'}>1. Giỏ Hàng</span>
            <span className="text-slate-300">➔</span>
            <span className={step === 'checkout' ? 'text-emerald-600' : ''}>2. Thanh Toán & Đặt Hàng</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4.5 space-y-4">
          
          {/* STEP 1: CART VIEW */}
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-100 rounded-xl flex flex-col items-center gap-4 shadow-3xs">
                  <span className="text-5xl">🛒</span>
                  <p className="text-slate-500 font-bold text-sm">Giỏ hàng của bạn đang trống</p>
                  <button
                    onClick={onClose}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    MUA SẮM NGAY
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-100 p-3 text-xs font-bold text-slate-400 rounded-lg hidden sm:grid grid-cols-12 gap-3 shadow-3xs">
                    <span className="col-span-6">Sản phẩm</span>
                    <span className="col-span-2 text-center">Đơn Giá</span>
                    <span className="col-span-2 text-center">Số Lượng</span>
                    <span className="col-span-2 text-right">Số Tiền</span>
                  </div>

                  {/* Cart items list */}
                  <div className="space-y-2.5">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-100 p-4 rounded-xl grid grid-cols-12 gap-3 items-center shadow-3xs"
                      >
                        {/* Image + Title */}
                        <div className="col-span-12 sm:col-span-6 flex gap-3 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover border border-slate-100 rounded-lg shrink-0"
                          />
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                              {item.product.name}
                            </h4>
                            {item.selectedVariant && (
                              <p className="text-[10px] text-slate-400 font-bold">
                                Phân loại: {item.selectedVariant}
                              </p>
                            )}
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-[10px] text-red-500 hover:underline font-bold block mt-1"
                            >
                              Xóa khỏi giỏ
                            </button>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-4 sm:col-span-2 text-left sm:text-center text-xs">
                          <span className="text-slate-400 sm:hidden">Đơn giá: </span>
                          <span className="font-semibold text-slate-700">{item.product.flashPrice}</span>
                        </div>

                        {/* Quantity picker */}
                        <div className="col-span-4 sm:col-span-2 flex justify-center">
                          <div className="flex items-center border border-slate-205 rounded-lg text-xs bg-slate-50 overflow-hidden">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="px-2.5 py-1.5 border-r border-slate-200 hover:bg-slate-100 font-bold select-none cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-3 py-1.5 font-bold text-slate-800 min-w-[24px] text-center select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="px-2.5 py-1.5 border-l border-slate-200 hover:bg-slate-100 font-bold select-none cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Line total */}
                        <div className="col-span-4 sm:col-span-2 text-right text-xs">
                          <span className="text-slate-400 sm:hidden">Tổng: </span>
                          <span className="font-bold text-emerald-600">
                            {formatPrice(parsePrice(item.product.flashPrice) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary bar */}
                  <div className="bg-white border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 shadow-3xs">
                    <div className="text-xs text-slate-500 font-bold">
                      Tổng thanh toán ({cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm):{' '}
                      <span className="text-xl font-black text-emerald-600 ml-1.5">
                        {formatPrice(itemsTotal)}
                      </span>
                    </div>
                    <button
                      onClick={() => setStep('checkout')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-xs font-bold shadow-md transition cursor-pointer text-center"
                    >
                      TIẾN HÀNH THANH TOÁN
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 2: CHECKOUT VIEW */}
          {step === 'checkout' && (
            <div className="space-y-4">
              
              {/* Shipping Address Box */}
              <div className="bg-white border-t-4 border-emerald-600 p-4 rounded-xl shadow-sm space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <span>📍</span> Địa Chỉ Nhận Hàng
                  </h4>
                  {!isEditingAddress ? (
                    <button
                      onClick={() => {
                        setTempAddress(address)
                        setIsEditingAddress(true)
                      }}
                      className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                    >
                      Thay đổi
                    </button>
                  ) : (
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleSaveAddress}
                        className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setIsEditingAddress(false)}
                        className="text-xs text-slate-400 hover:underline font-bold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingAddress ? (
                  <p className="text-xs text-slate-700 font-semibold whitespace-pre-line leading-relaxed">
                    {address}
                  </p>
                ) : (
                  <textarea
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    className="w-full p-2.5 border border-slate-205 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 bg-slate-50"
                    rows={3}
                  />
                )}
              </div>

              {/* Order Items Review */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Xem lại sản phẩm
                </h4>
                <div className="divide-y divide-slate-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.product.image}
                          alt=""
                          className="w-10 h-10 object-cover border border-slate-100 rounded-lg shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-750 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                            Số lượng: x{item.quantity} {item.selectedVariant && `| Phân loại: ${item.selectedVariant}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700 shrink-0">
                        {formatPrice(parsePrice(item.product.flashPrice) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vouchers Selection */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🎟️</span> Chọn Mã Giảm Giá (ZeroMall Voucher)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={`border rounded-lg p-3.5 flex items-center gap-3 hover:bg-slate-50/50 cursor-pointer transition ${selectedVoucher === 'freeship' ? 'border-emerald-600 bg-emerald-50/10' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="voucher"
                      checked={selectedVoucher === 'freeship'}
                      onChange={() => setSelectedVoucher('freeship')}
                      className="accent-emerald-600"
                    />
                    <div>
                      <p className="font-bold text-emerald-600">Miễn Phí Vận Chuyển</p>
                      <p className="text-[9px] text-slate-400">Giảm phí giao hàng tối đa 35k</p>
                    </div>
                  </label>

                  <label className={`border rounded-lg p-3.5 flex items-center gap-3 hover:bg-slate-50/50 cursor-pointer transition ${selectedVoucher === 'discount10' ? 'border-emerald-600 bg-emerald-50/10' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="voucher"
                      checked={selectedVoucher === 'discount10'}
                      onChange={() => setSelectedVoucher('discount10')}
                      className="accent-emerald-600"
                    />
                    <div>
                      <p className="font-bold text-emerald-600">Voucher Hoàn Xu 10%</p>
                      <p className="text-[9px] text-slate-400">Giảm trực tiếp 10% tổng đơn</p>
                    </div>
                  </label>

                  <label className={`border rounded-lg p-3 flex items-center gap-3 hover:bg-slate-50/50 cursor-pointer sm:col-span-2 transition ${selectedVoucher === 'none' ? 'border-emerald-600 bg-emerald-50/10' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="voucher"
                      checked={selectedVoucher === 'none'}
                      onChange={() => setSelectedVoucher('none')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-600">Không áp dụng voucher</span>
                  </label>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Phương thức thanh toán
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <label className={`flex-1 border p-3.5 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-slate-50/50 transition ${paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50/5' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-700">Thanh toán COD khi nhận</span>
                  </label>

                  <label className={`flex-1 border p-3.5 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-slate-50/50 transition ${paymentMethod === 'shopeepay' ? 'border-emerald-600 bg-emerald-50/5' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'shopeepay'}
                      onChange={() => setPaymentMethod('shopeepay')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-700">Ví Điện Tử ShopeePay</span>
                  </label>

                  <label className={`flex-1 border p-3.5 flex items-center gap-3 rounded-lg cursor-pointer hover:bg-slate-50/50 transition ${paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50/5' : 'border-slate-200'}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-slate-700">Thẻ Tín Dụng / Ghi Nợ</span>
                  </label>
                </div>
              </div>

              {/* Cost Summary & Actions */}
              <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm space-y-3.5 text-xs">
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Tổng tiền hàng</span>
                    <span>{formatPrice(itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Phí giao hàng</span>
                    <span>{formatPrice(35000)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Voucher giảm giá (10%)</span>
                      <span className="text-emerald-600 font-bold">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  {selectedVoucher === 'freeship' && (
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Mã miễn phí vận chuyển</span>
                      <span className="text-emerald-600 font-bold">-{formatPrice(35000)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tổng thanh toán</p>
                    <p className="text-[10px] text-slate-400 font-medium">Đã bao gồm VAT (nếu có)</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                {/* Confirm Buttons */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={() => setStep('cart')}
                    className="px-5 py-2.5 font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  >
                    Quay Lại
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 font-bold rounded-lg shadow-md transition cursor-pointer min-w-[150px] flex items-center justify-center gap-2"
                  >
                    {isPlacingOrder ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Đang đặt hàng...
                      </>
                    ) : (
                      'ĐẶT HÀNG'
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: ORDER SUCCESS */}
          {step === 'success' && (
            <div className="bg-white border border-slate-100 p-8 rounded-xl text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-500 flex items-center justify-center text-4xl mx-auto shadow-xs animate-bounce">
                ✓
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Đặt Hàng Thành Công!</h3>
                <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
                  Cảm ơn bạn đã tin tưởng mua sắm tại ZeroMall. Đơn hàng của bạn đã được chuyển tiếp đến shop và đang trong quá trình chuẩn bị hàng.
                </p>
              </div>

              {/* Tracking Ticket */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-xs space-y-3.5 max-w-md mx-auto">
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200/60 pb-2.5">
                  <span className="font-semibold">Thông tin vận đơn</span>
                  <span className="font-black text-emerald-600">Mã đơn: ZM-819280918</span>
                </div>
                
                <div className="space-y-2 text-slate-600 font-semibold">
                  <div className="flex justify-between">
                    <span>Mã vận đơn (SPX):</span>
                    <span className="font-mono font-bold text-slate-850">SPXVN812391208</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian giao dự kiến:</span>
                    <span className="text-slate-850">2 - 3 ngày tới</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phương thức thanh toán:</span>
                    <span className="text-slate-850">
                      {paymentMethod === 'cod' && 'Thanh toán COD'}
                      {paymentMethod === 'shopeepay' && 'Thanh toán qua Ví ShopeePay'}
                      {paymentMethod === 'card' && 'Thẻ tín dụng'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-150/50 pt-2.5">
                    <span>Trạng thái giao hàng:</span>
                    <span className="font-black text-emerald-600">Đang chuẩn bị bàn giao cho ĐVVC</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinish}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3 rounded-lg font-bold text-xs shadow-md transition cursor-pointer inline-block"
              >
                TIẾP TỤC MUA SẮM
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
