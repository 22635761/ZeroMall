import React, { useState, useEffect } from 'react'
import type { CartItem } from './Header'
import { CartStepView } from './CartStepView'
import { CheckoutStepView } from './CheckoutStepView'
import { AddressModal } from './AddressModal'

export interface ShippingAddress {
  id: string
  name: string
  phone: string
  region: string
  details: string
  isDefault: boolean
  lat?: number
  lng?: number
}

export const DEFAULT_ADDRESSES: ShippingAddress[] = []

export const VIETNAM_PROVINCES = [
  "Thành phố Hà Nội",
  "Thành phố Hồ Chí Minh",
  "Thành phố Hải Phòng",
  "Thành phố Đà Nẵng",
  "Thành phố Cần Thơ",
  "Tỉnh An Giang",
  "Tỉnh Bà Rịa - Vũng Tàu",
  "Tỉnh Bắc Giang",
  "Tỉnh Bắc Kạn",
  "Tỉnh Bạc Liêu",
  "Tỉnh Bắc Ninh",
  "Tỉnh Bến Tre",
  "Tỉnh Bình Định",
  "Tỉnh Bình Dương",
  "Tỉnh Bình Phước",
  "Tỉnh Bình Thuận",
  "Tỉnh Cà Mau",
  "Tỉnh Cao Bằng",
  "Tỉnh Đắk Lắk",
  "Tỉnh Đắk Nông",
  "Tỉnh Điện Biên",
  "Tỉnh Đồng Nai",
  "Tỉnh Đồng Tháp",
  "Tỉnh Gia Lai",
  "Tỉnh Hà Giang",
  "Tỉnh Hà Nam",
  "Tỉnh Hà Tĩnh",
  "Tỉnh Hải Dương",
  "Tỉnh Hậu Giang",
  "Tỉnh Hòa Bình",
  "Tỉnh Hưng Yên",
  "Tỉnh Khánh Hòa",
  "Tỉnh Kiên Giang",
  "Tỉnh Kon Tum",
  "Tỉnh Lai Châu",
  "Tỉnh Lâm Đồng",
  "Tỉnh Lạng Sơn",
  "Tỉnh Lào Cai",
  "Tỉnh Long An",
  "Tỉnh Nam Định",
  "Tỉnh Nghệ An",
  "Tỉnh Ninh Bình",
  "Tỉnh Ninh Thuận",
  "Tỉnh Phú Thọ",
  "Tỉnh Phú Yên",
  "Tỉnh Quảng Bình",
  "Tỉnh Quảng Nam",
  "Tỉnh Quảng Ngãi",
  "Tỉnh Quảng Ninh",
  "Tỉnh Quảng Trị",
  "Tỉnh Sóc Trăng",
  "Tỉnh Sơn La",
  "Tỉnh Tây Ninh",
  "Tỉnh Thái Bình",
  "Tỉnh Thái Nguyên",
  "Tỉnh Thanh Hóa",
  "Tỉnh Thừa Thiên Huế",
  "Tỉnh Tiền Giang",
  "Tỉnh Trà Vinh",
  "Tỉnh Tuyên Quang",
  "Tỉnh Vĩnh Long",
  "Tỉnh Vĩnh Phúc",
  "Tỉnh Yên Bái"
]

export const removeVietnameseTones = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|U|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.replace(/\u0300|\u0301|\u0309|\u0303|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str;
}

interface CartPageProps {
  cart: CartItem[]
  user: any
  onUpdateQuantity: (productId: string, variant: string, quantity: number) => void
  onRemoveItem: (productId: string, variant?: string) => void
  onBackToHome: () => void
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  user,
  onUpdateQuantity,
  onRemoveItem,
  onBackToHome
}) => {
  // Flow step: 'cart' | 'checkout' | 'success'
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>(() => {
    const saved = localStorage.getItem('zm_checkout_step')
    return (saved as 'cart' | 'checkout' | 'success') || 'cart'
  })

  // Persist checkout step to localStorage
  useEffect(() => {
    localStorage.setItem('zm_checkout_step', step)
  }, [step])

  // Selected items state: store keys of selected items: "productId#variant"
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('zm_selected_keys')
    return saved ? JSON.parse(saved) : []
  })

  // Persist selected keys to localStorage
  useEffect(() => {
    localStorage.setItem('zm_selected_keys', JSON.stringify(selectedKeys))
  }, [selectedKeys])

  // Store fetched shop details: { [shopId: string]: { name: string; shippingSettings?: any } }
  const [shopsInfo, setShopsInfo] = useState<{ [key: string]: any }>({})

  // Checkout address & details (prefill with user details or default)
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => {
    const saved = localStorage.getItem('zm_user_addresses')
    return saved ? JSON.parse(saved) : DEFAULT_ADDRESSES
  })

  useEffect(() => {
    if (user) {
      console.log('ZeroMall: Buyer session active for checkout', user.email || user.name)
    }
  }, [user])

  const [activeAddressId, setActiveAddressId] = useState<string>(() => {
    const saved = localStorage.getItem('zm_active_address_id')
    if (saved) return saved
    const def = DEFAULT_ADDRESSES.find(a => a.isDefault)
    return def ? def.id : (DEFAULT_ADDRESSES[0]?.id || '')
  })

  // Sync addresses to localStorage
  useEffect(() => {
    localStorage.setItem('zm_user_addresses', JSON.stringify(addresses))
  }, [addresses])

  // Sync active address id to localStorage
  useEffect(() => {
    localStorage.setItem('zm_active_address_id', activeAddressId)
  }, [activeAddressId])

  // Address modal visibility
  const [showAddressModal, setShowAddressModal] = useState(false)

  // Goong API key
  const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || ''

  // Derive active address details
  const activeAddress = addresses.find(a => a.id === activeAddressId) || addresses[0]
  const addressName = activeAddress?.name || ''
  const addressPhone = activeAddress?.phone || ''
  const addressDetails = activeAddress ? `${activeAddress.details}, ${activeAddress.region}` : ''

  // Vouchers and payment
  const [selectedVoucher, setSelectedVoucher] = useState<'none' | 'freeship' | 'discount10' | 'discount50k'>('none')
  const [paymentMethod, setPaymentMethod] = useState<'zeropay' | 'card' | 'gpay' | 'napas' | 'cod'>('cod')
  
  // Shop Vouchers State
  const [allShopVouchers, setAllShopVouchers] = useState<any[]>([])
  const [selectedShopVouchers, setSelectedShopVouchers] = useState<Record<string, string>>({})
  const [activeShopVoucherModalId, setActiveShopVoucherModalId] = useState<string | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Voucher modal visibility
  const [showVoucherModal, setShowVoucherModal] = useState(false)

  // Lời nhắn cho từng Shop: { [shopId: string]: string }
  const [shopMessages, setShopMessages] = useState<Record<string, string>>({})

  // Calculations helpers
  const parsePrice = (priceStr: string) => {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ'
  }

  // Generate unique key for cart item
  const getItemKey = (item: CartItem) => {
    return `${item.product.id}#${item.selectedVariant || ''}`
  }

  // Fetch shop information dynamically for unique shop IDs in the cart
  useEffect(() => {
    const fetchShopNames = async () => {
      const uniqueShopIds = Array.from(new Set(cart.map(item => item.product.shopId).filter(Boolean)))
      
      for (const shopId of uniqueShopIds) {
        if (shopId && !shopsInfo[shopId]) {
          try {
            const res = await fetch(`http://localhost:8000/auth/shops/${shopId}`)
            if (res.ok) {
              const data = await res.json()
              setShopsInfo(prev => ({
                ...prev,
                [shopId]: {
                  name: data.name || `Cửa hàng ${shopId.substring(0, 8)}`,
                  shippingSettings: data.shippingSettings ? JSON.parse(data.shippingSettings) : null
                }
              }))
            }
          } catch (err) {
            console.error('Error fetching shop info:', err)
          }
        }
      }
    }
    
    if (cart.length > 0) {
      fetchShopNames()
    }
  }, [cart])

  // Load active shop vouchers from backend API
  useEffect(() => {
    const fetchActiveVouchers = async () => {
      const uniqueShopIds = Array.from(new Set(cart.map(item => item.product.shopId).filter(Boolean)))
      let fetchedVouchers: any[] = []
      
      for (const shopId of uniqueShopIds) {
        if (shopId) {
          try {
            const res = await fetch(`http://localhost:8000/discounts/active?shopId=${shopId}`)
            if (res.ok) {
              const data = await res.json()
              fetchedVouchers = [...fetchedVouchers, ...data]
            }
          } catch (err) {
            console.error('Error fetching active vouchers:', err)
          }
        }
      }
      setAllShopVouchers(fetchedVouchers)
    }
    
    if (cart.length > 0 && (step === 'checkout' || step === 'cart')) {
      fetchActiveVouchers()
    }
  }, [cart, step])

  // Group items by shopId
  const groupedItems = cart.reduce((groups, item) => {
    const shopId = item.product.shopId || 'unknown'
    if (!groups[shopId]) {
      groups[shopId] = []
    }
    groups[shopId].push(item)
    return groups;
  }, {} as { [key: string]: CartItem[] })

  // Selection logic
  const handleSelectItem = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleSelectShopItems = (items: CartItem[]) => {
    const itemKeys = items.map(getItemKey)
    const allSelected = itemKeys.every(k => selectedKeys.includes(k))
    
    if (allSelected) {
      setSelectedKeys(prev => prev.filter(k => !itemKeys.includes(k)))
    } else {
      setSelectedKeys(prev => {
        const filtered = prev.filter(k => !itemKeys.includes(k))
        return [...filtered, ...itemKeys]
      })
    }
  }

  const handleSelectAll = () => {
    const allKeys = cart.map(getItemKey)
    const isAllSelected = allKeys.length > 0 && allKeys.every(k => selectedKeys.includes(k))
    
    if (isAllSelected) {
      setSelectedKeys([])
    } else {
      setSelectedKeys(allKeys)
    }
  }

  const handleRemoveSelected = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa các sản phẩm đã chọn khỏi giỏ hàng?')) {
      cart.forEach(item => {
        const key = getItemKey(item)
        if (selectedKeys.includes(key)) {
          onRemoveItem(item.product.id, item.selectedVariant)
        }
      })
      setSelectedKeys([])
    }
  }

  // Selected items calculation
  const selectedCartItems = cart.filter(item => selectedKeys.includes(getItemKey(item)))
  const itemsTotal = selectedCartItems.reduce((acc, item) => {
    return acc + parsePrice(item.product.flashPrice) * item.quantity
  }, 0)

  // Base shipping fee: 37.700đ per shop represented in selected items
  const uniqueSelectedShops = Array.from(new Set(selectedCartItems.map(item => item.product.shopId).filter(Boolean))) as string[]
  const baseShippingFee = uniqueSelectedShops.length * 37700

  // Shipping discount and vouchers
  const shippingDiscount = selectedVoucher === 'freeship' ? Math.min(baseShippingFee, 35000) : 0
  const finalShippingFee = baseShippingFee - shippingDiscount

  const voucherDiscount = selectedVoucher === 'discount10' 
    ? Math.round(itemsTotal * 0.1) 
    : selectedVoucher === 'discount50k' 
      ? Math.min(itemsTotal, 50000) 
      : 0

  const getShopVoucherDiscount = (shopId: string, shopItemsTotal: number) => {
    const voucherId = selectedShopVouchers[shopId]
    if (!voucherId) return 0
    const voucher = allShopVouchers.find(v => v.id === voucherId)
    if (!voucher) return 0

    const now = new Date()
    const start = new Date(voucher.startDate)
    const end = new Date(voucher.endDate)
    const isValidDate = now >= start && now <= end
    const hasRemaining = voucher.usedCount < voucher.usageLimit
    const meetsMinSpend = shopItemsTotal >= voucher.minSpend

    if (!isValidDate || !hasRemaining || !meetsMinSpend) return 0

    if (voucher.type === 'percentage') {
      const discount = Math.round(shopItemsTotal * (voucher.value / 100))
      return voucher.maxDiscount !== null ? Math.min(discount, voucher.maxDiscount) : discount
    } else {
      return Math.min(shopItemsTotal, voucher.value)
    }
  }

  const shopVoucherDiscountTotal = uniqueSelectedShops.reduce((acc, shopId) => {
    if (typeof shopId !== 'string') return acc
    const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)
    const shopItemsTotal = shopItems.reduce((sum, item) => sum + parsePrice(item.product.flashPrice) * item.quantity, 0)
    return acc + getShopVoucherDiscount(shopId, shopItemsTotal)
  }, 0)

  const grandTotal = itemsTotal + finalShippingFee - voucherDiscount - shopVoucherDiscountTotal

  const handlePlaceOrder = async () => {
    if (selectedCartItems.length === 0) return
    if (addresses.length === 0) {
      alert('Vui lòng thêm địa chỉ nhận hàng trước khi đặt hàng!')
      return
    }
    setIsPlacingOrder(true)
    try {
      const orderItems = selectedCartItems.map(item => ({
        productId: item.product.id,
        shopId: item.product.shopId || 'unknown',
        name: item.product.name,
        image: item.product.image,
        variant: item.selectedVariant || null,
        price: parsePrice(item.product.flashPrice),
        quantity: item.quantity
      }))

      const orderData = {
        buyerId: user?.id || 'guest-buyer-id',
        buyerEmail: user?.email || 'buyer@zeromall.com',
        buyerName: addressName,
        buyerPhone: addressPhone,
        shippingAddress: addressDetails,
        totalAmount: grandTotal,
        shippingFee: finalShippingFee,
        paymentMethod: paymentMethod,
        items: orderItems
      }

      const response = await fetch('http://localhost:8000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Đặt hàng thất bại. Vui lòng thử lại.')
      }

      const orderJson = await response.json()
      const orderId = orderJson.id

      // Gọi API thực hiện thanh toán
      const paymentResponse = await fetch('http://localhost:8000/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          buyerId: user?.id || 'guest-buyer-id',
          amount: grandTotal,
          paymentMethod
        })
      })

      if (!paymentResponse.ok) {
        const errJson = await paymentResponse.json()
        throw new Error(errJson.message || 'Thanh toán thất bại. Vui lòng kiểm tra lại số dư ví!')
      }

      try {
        const appliedVoucherIds = Object.values(selectedShopVouchers).filter(Boolean)
        if (appliedVoucherIds.length > 0) {
          const res = await fetch('http://localhost:8000/discounts/use', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voucherIds: appliedVoucherIds })
          })
          if (!res.ok) {
            console.error('Failed to record voucher usage on backend')
          }
        }
      } catch (e) {
        console.error('Error updating shop voucher usage on checkout:', e)
      }
      setSelectedShopVouchers({})

      setStep('success')
    } catch (err: any) {
      alert(err.message || 'Lỗi hệ thống khi thanh toán')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const handleFinish = () => {
    selectedCartItems.forEach(item => {
      onRemoveItem(item.product.id, item.selectedVariant)
    })
    setSelectedKeys(prev => prev.filter(k => !selectedKeys.includes(k)))
    setStep('cart')
    onBackToHome()
  }

  const getShopShippingBadges = (shopId: string) => {
    const info = shopsInfo[shopId]
    if (!info || !info.shippingSettings) return null
    const settings = info.shippingSettings
    return (
      <div className="flex gap-1 items-center ml-2.5">
        {settings.express && <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] px-1 py-0.2 rounded-sm font-bold">Hỏa Tốc</span>}
        {settings.fast && <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] px-1 py-0.2 rounded-sm font-bold">Nhanh</span>}
        {settings.saver && <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] px-1 py-0.2 rounded-sm font-bold">Tiết Kiệm</span>}
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/50 shadow-3xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-800 tracking-tight">ZeroMall</span>
            <span className="text-slate-300">|</span>
            <span className="text-base font-extrabold text-[#ee4d2d]">
              {step === 'cart' && 'Giỏ Hàng'}
              {step === 'checkout' && 'Thanh Toán'}
              {step === 'success' && 'Hoàn Tất Đặt Hàng'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content Blocks */}
      {step === 'cart' && (
        <CartStepView
          cart={cart}
          selectedKeys={selectedKeys}
          shopsInfo={shopsInfo}
          groupedItems={groupedItems}
          getItemKey={getItemKey}
          getShopShippingBadges={getShopShippingBadges}
          handleSelectItem={handleSelectItem}
          handleSelectShopItems={handleSelectShopItems}
          handleSelectAll={handleSelectAll}
          handleRemoveSelected={handleRemoveSelected}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onBackToHome={onBackToHome}
          setStep={setStep}
          selectedCartItems={selectedCartItems}
          itemsTotal={itemsTotal}
          formatPrice={formatPrice}
          parsePrice={parsePrice}
        />
      )}

      {step === 'checkout' && (
        <CheckoutStepView
          addresses={addresses}
          activeAddress={activeAddress}
          addressName={addressName}
          addressPhone={addressPhone}
          addressDetails={addressDetails}
          uniqueSelectedShops={uniqueSelectedShops}
          selectedCartItems={selectedCartItems}
          shopsInfo={shopsInfo}
          selectedShopVouchers={selectedShopVouchers}
          allShopVouchers={allShopVouchers}
          shopMessages={shopMessages}
          setShopMessages={setShopMessages}
          setSelectedShopVouchers={setSelectedShopVouchers}
          activeShopVoucherModalId={activeShopVoucherModalId}
          setActiveShopVoucherModalId={setActiveShopVoucherModalId}
          selectedVoucher={selectedVoucher}
          setSelectedVoucher={setSelectedVoucher}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          itemsTotal={itemsTotal}
          insuranceTotal={0}
          finalShippingFee={finalShippingFee}
          voucherDiscount={voucherDiscount}
          shopVoucherDiscountTotal={shopVoucherDiscountTotal}
          grandTotal={grandTotal}
          isPlacingOrder={isPlacingOrder}
          handlePlaceOrder={handlePlaceOrder}
          setStep={setStep}
          setShowAddressModal={setShowAddressModal}
          parsePrice={parsePrice}
          formatPrice={formatPrice}
          getShopVoucherDiscount={getShopVoucherDiscount}
          showVoucherModal={showVoucherModal}
          setShowVoucherModal={setShowVoucherModal}
          user={user}
        />
      )}

      {step === 'success' && (
        /* Order Success Screen */
        <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center shadow-3xs flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl border border-emerald-100 shadow-3xs animate-bounce">
            🎉
          </div>
          <h3 className="font-black text-slate-805 text-xl tracking-tight">Đặt Hàng Thành Công!</h3>
          <p className="text-slate-500 text-xs max-w-sm leading-relaxed font-semibold">
            Cảm ơn bạn đã mua sắm tại ZeroMall. Đơn hàng của bạn đã được tiếp nhận và chuyển giao sang hệ thống giao vận xanh của chúng tôi.
          </p>
          <button 
            onClick={handleFinish}
            className="mt-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition duration-200 cursor-pointer"
          >
            Tiếp Tục Mua Sắm
          </button>
        </div>
      )}

      {/* Address Management Modal (integrated at CartPage parent level) */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        addresses={addresses}
        setAddresses={setAddresses}
        activeAddressId={activeAddressId}
        setActiveAddressId={setActiveAddressId}
        goongApiKey={goongApiKey}
        VIETNAM_PROVINCES={VIETNAM_PROVINCES}
        removeVietnameseTones={removeVietnameseTones}
      />

    </div>
  )
}
