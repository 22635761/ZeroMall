import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api.config'
import type { CartItem } from '../../models/cart.model'
import { CartStepView } from '../../components/buyer/CartStepView'
import { CheckoutStepView } from '../../components/buyer/CheckoutStepView'
import { AddressModal } from '../../components/buyer/AddressModal'
import { SepayPaymentModal } from '../../components/buyer/SepayPaymentModal'
import { ShopVoucherModal } from '../../components/buyer/ShopVoucherModal'
import { PlatformVoucherModal } from '../../components/buyer/PlatformVoucherModal'
import type { ShippingAddress } from '../../models/address.model'

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
  const location = useLocation()
  const navigate = useNavigate()

  // Flow step: derived from URL pathname
  const getStepFromPath = (path: string): 'cart' | 'checkout' | 'success' => {
    if (path === '/checkout') return 'checkout'
    const saved = localStorage.getItem('zm_checkout_step')
    if (saved === 'success' && path === '/cart') return 'success'
    return 'cart'
  }

  const [step, setStepInternal] = useState<'cart' | 'checkout' | 'success'>(() => getStepFromPath(location.pathname))

  // Sync step when URL changes
  useEffect(() => {
    const newStep = getStepFromPath(location.pathname)
    setStepInternal(newStep)
  }, [location.pathname])

  // Custom setStep that also navigates
  const setStep = (newStep: 'cart' | 'checkout' | 'success') => {
    setStepInternal(newStep)
    if (newStep === 'checkout') {
      navigate('/checkout', { replace: false })
    } else if (newStep === 'cart') {
      navigate('/cart', { replace: false })
    } else if (newStep === 'success') {
      localStorage.setItem('zm_checkout_step', 'success')
      // Stay on current URL for success screen
    }
  }

  // Clear success state when leaving
  useEffect(() => {
    if (step !== 'success') {
      localStorage.removeItem('zm_checkout_step')
    }
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

  // Checkout address & details: Fetch dynamically from API per user
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => {
    if (user?.id) {
      const cached = localStorage.getItem(`zm_user_addresses_${user.id}`)
      if (cached) {
        try { return JSON.parse(cached) } catch (_) {}
      }
    }
    return []
  })

  const [activeAddressId, setActiveAddressId] = useState<string>(() => {
    if (user?.id) {
      return localStorage.getItem(`zm_active_address_id_${user.id}`) || ''
    }
    return ''
  })

  // Fetch addresses from backend when user is available
  useEffect(() => {
    // Dọn dẹp key cũ không phân biệt user
    try {
      localStorage.removeItem('zm_user_addresses')
      localStorage.removeItem('zm_active_address_id')
    } catch (e) {}

    if (!user?.id) {
      setAddresses([])
      setActiveAddressId('')
      return
    }

    const fetchUserAddresses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses`)
        if (res.ok) {
          const data: ShippingAddress[] = await res.json()
          setAddresses(data)
          localStorage.setItem(`zm_user_addresses_${user.id}`, JSON.stringify(data))
          
          const def = data.find(a => a.isDefault) || data[0]
          if (def) {
            setActiveAddressId(def.id)
            localStorage.setItem(`zm_active_address_id_${user.id}`, def.id)
          } else {
            setActiveAddressId('')
          }
        }
      } catch (err) {
        console.error('Error fetching user addresses in CartPage:', err)
      }
    }

    fetchUserAddresses()
  }, [user?.id])

  // Sync addresses to per-user localStorage cache
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`zm_user_addresses_${user.id}`, JSON.stringify(addresses))
    }
  }, [addresses, user?.id])

  // Sync active address id to per-user localStorage
  useEffect(() => {
    if (user?.id && activeAddressId) {
      localStorage.setItem(`zm_active_address_id_${user.id}`, activeAddressId)
    }
  }, [activeAddressId, user?.id])

  // Address modal visibility
  const [showAddressModal, setShowAddressModal] = useState(false)

  // Goong API key
  const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || ''

  // Derive active address details
  const activeAddress = addresses.find(a => a.id === activeAddressId) || addresses[0]
  const addressName = activeAddress?.name || ''
  const addressPhone = activeAddress?.phone || ''
  const addressDetails = activeAddress ? `${activeAddress.details}, ${activeAddress.region}` : ''

  // Generate unique key for cart item
  const getItemKey = (item: CartItem) => {
    return `${item.product.id}#${item.selectedVariant || ''}`
  }

  // Selected items calculation
  const selectedCartItems = cart.filter(item => selectedKeys.includes(getItemKey(item)))

  // Vouchers and payment
  const [selectedVoucher, setSelectedVoucher] = useState<'none' | 'freeship' | 'discount10' | 'discount50k'>('none')
  const [paymentMethod, setPaymentMethod] = useState<'zeropay' | 'cod' | 'sepay'>('cod')
  const [shopShippingFees, setShopShippingFees] = useState<Record<string, number>>({})
  const [shopPackageInfos, setShopPackageInfos] = useState<Record<string, { weightKg: number; isBulky: boolean; itemCount: number }>>({})
  const [productSpecs, setProductSpecs] = useState<Record<string, { weight?: number; length?: number; width?: number; height?: number }>>({})
  
  // Shop Vouchers State
  const [allShopVouchers, setAllShopVouchers] = useState<any[]>([])
  const [selectedShopVouchers, setSelectedShopVouchers] = useState<Record<string, string>>({})
  const [activeShopVoucherModalId, setActiveShopVoucherModalId] = useState<string | null>(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Voucher modal visibility
  const [showVoucherModal, setShowVoucherModal] = useState(false)

  // Lời nhắn cho từng Shop: { [shopId: string]: string }
  const [shopMessages, setShopMessages] = useState<Record<string, string>>({})

  // Sepay payment states
  const [showSepayModal, setShowSepayModal] = useState(false)
  const [sepayQrUrl, setSepayQrUrl] = useState('')
  const [sepayMemo, setSepayMemo] = useState('')
  const [sepayBankInfo, setSepayBankInfo] = useState<any>(null)
  const [activeOrderId, setActiveOrderId] = useState<string>('')

  // Polling check trạng thái chuyển khoản Sepay
  useEffect(() => {
    let intervalId: any
    if (showSepayModal && activeOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/payments/status/${activeOrderId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.status === 'SUCCESS') {
              clearInterval(intervalId)
              setShowSepayModal(false)

              // Cập nhật voucher đã dùng
              try {
                const appliedVoucherIds = Object.values(selectedShopVouchers).filter(Boolean)
                // Mark discount as used again via API
                await fetch(`${API_BASE_URL}/discounts/use`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ voucherIds: appliedVoucherIds })
                })
              } catch (e) {
                console.error(e)
              }
              setSelectedShopVouchers({})

              // Xóa các sản phẩm đã mua khỏi giỏ hàng
              selectedCartItems.forEach(item => {
                onRemoveItem(item.product.id, item.selectedVariant)
              })

              // Chuyển sang màn hình thành công
              setStep('success')
            }
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [showSepayModal, activeOrderId, selectedShopVouchers, selectedCartItems])

  // Calculations helpers
  const parsePrice = (priceVal: any): number => {
    if (typeof priceVal === 'number') return priceVal
    if (!priceVal) return 0
    const cleaned = String(priceVal).replace(/[^0-9]/g, '')
    return parseInt(cleaned, 10) || 0
  }

  const formatPrice = (value: number) => {
    return value.toLocaleString('vi-VN') + 'đ'
  }

  // Ensure cart items are selected by default when entering cart page
  useEffect(() => {
    if (cart.length > 0) {
      const allKeys = cart.map(getItemKey)
      const hasAnySelected = selectedKeys.some(k => allKeys.includes(k))
      if (!hasAnySelected) {
        setSelectedKeys(allKeys)
      }
    }
  }, [cart])

  // Fetch shop information dynamically for unique shop IDs in the cart
  useEffect(() => {
    const fetchShopNames = async () => {
      const uniqueShopIds = Array.from(new Set(cart.map(item => item.product.shopId).filter(Boolean)))
      
      for (const shopId of uniqueShopIds) {
        if (shopId && !shopsInfo[shopId]) {
          try {
            const res = await fetch(`${API_BASE_URL}/auth/shops/${shopId}`)
            if (res.ok) {
              const data = await res.json()
              setShopsInfo(prev => ({
                ...prev,
                [shopId]: {
                  name: data.name || `Cửa hàng ${shopId.substring(0, 8)}`,
                  shippingSettings: data.shippingSettings ? JSON.parse(data.shippingSettings) : null,
                  pickupAddress: data.pickupAddress
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

  // Load active shop and platform vouchers from backend API
  useEffect(() => {
    const fetchActiveVouchers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/discounts/all-active`)
        if (res.ok) {
          const data = await res.json()
          setAllShopVouchers(data)
        }
      } catch (err) {
        console.error('Error fetching active vouchers:', err)
      }
    }
    
    if (cart.length > 0) {
      fetchActiveVouchers()
    }
  }, [cart])

  // Tự động tải thông số kích thước & cân nặng chuẩn từ CSDL cho các sản phẩm trong giỏ hàng
  useEffect(() => {
    const fetchMissingSpecs = async () => {
      const missingProductIds = cart
        .map((i) => i.product.id)
        .filter((id) => !productSpecs[id])

      for (const pId of missingProductIds) {
        try {
          const res = await fetch(`${API_BASE_URL}/products/${pId}`)
          if (res.ok) {
            const pData = await res.json()
            setProductSpecs((prev) => ({
              ...prev,
              [pId]: {
                weight: pData.weight ? parseFloat(pData.weight) : 0,
                length: pData.length ? parseFloat(pData.length) : 0,
                width: pData.width ? parseFloat(pData.width) : 0,
                height: pData.height ? parseFloat(pData.height) : 0,
              },
            }))
          }
        } catch (e) {
          console.error('Error fetching product specs:', e)
        }
      }
    }

    if (cart.length > 0) {
      fetchMissingSpecs()
    }
  }, [cart])

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
  const itemsTotal = selectedCartItems.reduce((acc, item) => {
    const itemUnitPrice = parsePrice(item.product.flashPrice || item.product.price || item.product.originalPrice || 0)
    return acc + itemUnitPrice * item.quantity
  }, 0)

  // Base shipping fee: Chuẩn vận chuyển nội bộ ZeroMall Express (ZMX)
  // Tính cước theo Tổng trọng lượng / Thể tích quy đổi gộp cho toàn bộ sản phẩm của cùng 1 Shop
  const uniqueSelectedShops = Array.from(new Set(selectedCartItems.map(item => item.product.shopId).filter(Boolean))) as string[]
  
  // Tính phí ship ZMX cho từng shop dựa trên cân nặng/kích thước và khoảng cách thực tế
  useEffect(() => {
    const newFees: Record<string, number> = {}
    const newPackageInfos: Record<string, { weightKg: number; isBulky: boolean; itemCount: number }> = {}

    for (const shopId of uniqueSelectedShops) {
      const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)

      let totalActualWeight = 0
      let totalVolumetricWeight = 0
      let totalQuantity = 0

      for (const item of shopItems) {
        const spec = productSpecs[item.product.id] || {}
        const rawW = item.product.weight !== undefined ? item.product.weight : spec.weight
        const rawL = item.product.length !== undefined ? item.product.length : spec.length
        const rawWidth = item.product.width !== undefined ? item.product.width : spec.width
        const rawH = item.product.height !== undefined ? item.product.height : spec.height

        const w = parseFloat(String(rawW || 0)) || 0
        const l = parseFloat(String(rawL || 0)) || 0
        const width = parseFloat(String(rawWidth || 0)) || 0
        const h = parseFloat(String(rawH || 0)) || 0

        // Trọng lượng quy đổi theo thể tích (gr): (D x R x C) / 5 (chuẩn logistics)
        const vol = (l > 0 && width > 0 && h > 0) ? Math.round((l * width * h) / 5) : 0

        totalActualWeight += w * item.quantity
        totalVolumetricWeight += vol * item.quantity
        totalQuantity += item.quantity
      }

      // Trọng lượng tính cước của kiện hàng gộp (lấy max giữa cân nặng thực tế và thể tích quy đổi)
      const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight)
      const weightKg = parseFloat((chargeableWeight / 1000).toFixed(2))

      // Phân tích tuyến đường giữa kho Shop và địa chỉ người nhận
      const shopProv = (shopsInfo[shopId]?.pickupAddress?.province || '').toLowerCase()
      const buyerProv = (activeAddress?.province || activeAddress?.region || '').toLowerCase()

      const isSameProvince = Boolean(
        shopProv && buyerProv && (
          shopProv.includes(buyerProv) || buyerProv.includes(shopProv) ||
          (shopProv.includes('hà nội') && buyerProv.includes('hà nội')) ||
          (shopProv.includes('hồ chí minh') && buyerProv.includes('hồ chí minh')) ||
          (shopProv.includes('đà nẵng') && buyerProv.includes('đà nẵng'))
        )
      )

      // Cước cơ bản cho nấc đầu tiên (<= 500g):
      // - Nội thành / Nội tỉnh: 16.500đ
      // - Liên tỉnh / Liên miền (ví dụ Hà Nội <-> TP.HCM): 22.000đ (hoặc theo cài đặt baseFee của shop)
      const shopSettings = shopsInfo[shopId]?.shippingSettings
      const baseFee = isSameProvince ? 16500 : (shopSettings?.baseFee || 22000)
      const stepFee = isSameProvince ? 2500 : 5000

      let fee = baseFee
      if (chargeableWeight > 500) {
        const extraWeight = chargeableWeight - 500
        const extraSteps = Math.ceil(extraWeight / 500)
        fee += extraSteps * stepFee
      }

      newFees[shopId] = fee
      newPackageInfos[shopId] = {
        weightKg: weightKg > 0 ? weightKg : 0.5,
        isBulky: chargeableWeight > 500,
        itemCount: totalQuantity
      }
    }

    setShopShippingFees(newFees)
    setShopPackageInfos(newPackageInfos)
  }, [uniqueSelectedShops.join(','), selectedCartItems, productSpecs, shopsInfo, activeAddress])

  const dynamicShippingTotal = uniqueSelectedShops.reduce((sum, shopId) => sum + (shopShippingFees[shopId] || 22000), 0)
  const baseShippingFee = dynamicShippingTotal

  // Shipping discount and vouchers
  const shippingDiscount = selectedVoucher === 'freeship' ? Math.min(baseShippingFee, 35000) : 0
  const finalShippingFee = baseShippingFee - shippingDiscount

  // Platform voucher discount calculation
  let voucherDiscount = 0
  if (selectedVoucher === 'discount10') {
    voucherDiscount = Math.round(itemsTotal * 0.1)
  } else if (selectedVoucher === 'discount50k') {
    voucherDiscount = Math.min(itemsTotal, 50000)
  } else if (selectedVoucher !== 'none' && selectedVoucher !== 'freeship') {
    const dbPlatVoucher = allShopVouchers.find(
      v => (v.code === selectedVoucher || v.id === selectedVoucher) && v.shopId === 'PLATFORM'
    )
    if (dbPlatVoucher && itemsTotal >= (dbPlatVoucher.minSpend || 0)) {
      if (dbPlatVoucher.type === 'percentage') {
        const disc = Math.round(itemsTotal * (dbPlatVoucher.value / 100))
        voucherDiscount = dbPlatVoucher.maxDiscount ? Math.min(disc, dbPlatVoucher.maxDiscount) : disc
      } else {
        voucherDiscount = Math.min(itemsTotal, dbPlatVoucher.value)
      }
    }
  }

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
    const shopItemsTotal = shopItems.reduce((sum, item) => sum + parsePrice(item.product.flashPrice || item.product.price || 0) * item.quantity, 0)
    return acc + getShopVoucherDiscount(shopId, shopItemsTotal)
  }, 0)

  // Original items total & savings for Promotion Details Breakdown (Shopee style)
  // Tổng tiền hàng = Tổng tiền GIÁ GỐC SẢN PHẨM * số lượng
  const itemsOriginalTotal = selectedCartItems.reduce((acc, item) => {
    const rawOrig = parsePrice(item.product.originalPrice)
    const sellingPrice = parsePrice(item.product.flashPrice || item.product.price || 0)
    const effectiveOrig = rawOrig > 0 ? Math.max(rawOrig, sellingPrice) : sellingPrice
    return acc + effectiveOrig * item.quantity
  }, 0)

  // Giảm giá sản phẩm = GIÁ GỐC SẢN PHẨM - GIÁ BÁN SẢN PHẨM
  const productDiscountTotal = Math.max(0, itemsOriginalTotal - itemsTotal)
  const voucherDiscountTotal = (selectedVoucher !== 'freeship' ? voucherDiscount : 0) + shopVoucherDiscountTotal
  // Tiết kiệm = Giảm giá sản phẩm + Voucher
  const totalSavings = productDiscountTotal + voucherDiscountTotal + (selectedVoucher === 'freeship' ? shippingDiscount : 0)
  const cartFinalPayable = Math.max(0, itemsTotal - (selectedVoucher !== 'freeship' ? voucherDiscount : 0) - shopVoucherDiscountTotal)

  const grandTotal = itemsTotal + finalShippingFee - (selectedVoucher !== 'freeship' ? voucherDiscount : 0) - shopVoucherDiscountTotal

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

      const appliedVoucherIds = Object.values(selectedShopVouchers).filter(Boolean)
      const shopDiscounts = uniqueSelectedShops.reduce((acc, sId) => {
        const sItems = selectedCartItems.filter(item => item.product.shopId === sId)
        const sTotal = sItems.reduce((sum, item) => sum + parsePrice(item.product.flashPrice || item.product.price || 0) * item.quantity, 0)
        acc[sId] = getShopVoucherDiscount(sId, sTotal)
        return acc
      }, {} as Record<string, number>)

      const orderData = {
        buyerId: user?.id || 'guest-buyer-id',
        buyerEmail: user?.email || 'buyer@zeromall.com',
        buyerName: addressName,
        buyerPhone: addressPhone,
        shippingAddress: addressDetails,
        totalAmount: grandTotal,
        shippingFee: finalShippingFee,
        paymentMethod: paymentMethod,
        shopDiscountAmount: shopVoucherDiscountTotal || 0,
        platformDiscountAmount: voucherDiscount || 0,
        platformVoucherCode: selectedVoucher !== 'none' ? selectedVoucher.toUpperCase() : null,
        appliedVoucherIds: appliedVoucherIds.length > 0 ? JSON.stringify(appliedVoucherIds) : null,
        shopShippingFees: shopShippingFees,
        shopDiscounts: shopDiscounts,
        items: orderItems
      }

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Đặt hàng thất bại. Vui lòng thử lại.')
      }

      const orderJson = await response.json()
      const orders = Array.isArray(orderJson) ? orderJson : [orderJson]

      // Gọi API thanh toán cho TỪNG đơn hàng (1 đơn / 1 shop)
      for (const ord of orders) {
        const paymentResponse = await fetch(`${API_BASE_URL}/payments/charge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: ord.id,
            buyerId: user?.id || 'guest-buyer-id',
            amount: ord.totalAmount,
            paymentMethod
          })
        })

        if (!paymentResponse.ok) {
          const errJson = await paymentResponse.json()
          throw new Error(errJson.message || 'Thanh toán thất bại. Vui lòng kiểm tra lại số dư ví!')
        }
      }

      try {
        const appliedVoucherIds = Object.values(selectedShopVouchers).filter(Boolean)
        if (appliedVoucherIds.length > 0) {
          await fetch(`${API_BASE_URL}/discounts/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voucherIds: appliedVoucherIds })
          })
        }
      } catch (e) {
        console.error('Error updating shop voucher usage on checkout:', e)
      }
      setSelectedShopVouchers({})

      if (paymentMethod === 'sepay') {
        try {
          const configRes = await fetch(`${API_BASE_URL}/payments/sepay-config`)
          if (configRes.ok) {
            const config = await configRes.json()
            const firstOrderId = orders[0].id
            const memo = `ZM${firstOrderId.substring(0, 8).toUpperCase()}`
            const qr = `https://img.vietqr.io/image/${config.bankId}-${config.bankAcc}-compact2.jpg?amount=${grandTotal}&addInfo=${memo}&accountName=${encodeURIComponent(config.bankName)}`
            
            setSepayMemo(memo)
            setSepayQrUrl(qr)
            setSepayBankInfo(config)
            setActiveOrderId(firstOrderId)
            setShowSepayModal(true)
          } else {
            throw new Error('Không thể tải cấu hình chuyển khoản ngân hàng.')
          }
        } catch (e: any) {
          throw new Error('Lỗi cấu hình cổng thanh toán VietQR: ' + e.message)
        }
        return
      }

      // Clear purchased items from cart state immediately
      selectedCartItems.forEach(item => {
        onRemoveItem(item.product.id, item.selectedVariant)
      })
      setSelectedKeys(prev => prev.filter(k => !selectedKeys.includes(k)))

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

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-800 tracking-tight">
              Zero<span className="text-emerald-600">Mall</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-base font-extrabold text-emerald-600">
              {step === 'cart' && 'Giỏ Hàng'}
              {step === 'checkout' && 'Thanh Toán'}
              {step === 'success' && 'Hoàn Tất Đặt Hàng'}
            </span>
          </div>
        </div>
      </div>

      {step === 'cart' && (
        <CartStepView
          cart={cart}
          selectedKeys={selectedKeys}
          shopsInfo={shopsInfo}
          groupedItems={groupedItems}
          getItemKey={getItemKey}
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

          selectedShopVouchers={selectedShopVouchers}
          onOpenShopVoucherModal={(sId) => setActiveShopVoucherModalId(sId)}
          onRemoveShopVoucher={(sId) => setSelectedShopVouchers(prev => ({ ...prev, [sId]: '' }))}
          getShopVoucherDiscount={getShopVoucherDiscount}
          allShopVouchers={allShopVouchers}
          selectedVoucher={selectedVoucher}
          onOpenPlatformVoucherModal={() => setShowVoucherModal(true)}
          voucherDiscount={voucherDiscount}
          shopVoucherDiscountTotal={shopVoucherDiscountTotal}
          voucherDiscountTotal={voucherDiscountTotal}
          itemsOriginalTotal={itemsOriginalTotal}
          productDiscountTotal={productDiscountTotal}
          totalSavings={totalSavings}
          finalPayable={cartFinalPayable}
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
          setActiveShopVoucherModalId={setActiveShopVoucherModalId}
          selectedVoucher={selectedVoucher}
          setSelectedVoucher={setSelectedVoucher}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          itemsTotal={itemsTotal}
          insuranceTotal={0}
          finalShippingFee={finalShippingFee}
          shopShippingFees={shopShippingFees}
          shopPackageInfos={shopPackageInfos}
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
          <h3 className="font-black text-slate-800 text-xl tracking-tight">Thanh Toán & Đặt Hàng Thành Công!</h3>
          <p className="text-slate-500 text-xs max-w-sm leading-relaxed font-semibold">
            Cảm ơn bạn đã mua sắm tại ZeroMall. Đơn hàng đã được xác nhận và đang được xử lý.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleFinish}
              className="mt-2 px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition duration-200 cursor-pointer"
            >
              Tiếp Tục Mua Sắm
            </button>
            <button
              onClick={() => { onBackToHome(); setTimeout(() => window.location.href='/user/purchase', 100) }}
              className="mt-2 px-6 py-3 bg-[#ee4d2d] hover:bg-[#d03d20] text-white rounded-xl font-bold text-xs shadow-md transition duration-200 cursor-pointer"
            >
              Xem Đơn Mua
            </button>
          </div>
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
        user={user}
      />

      {/* Sepay VietQR Payment Modal */}
      {showSepayModal && sepayBankInfo && (
        <SepayPaymentModal
          isOpen={showSepayModal}
          onClose={() => {
            if (window.confirm('Đóng? Đơn hàng vẫn ở trạng thái "Chờ thanh toán". Bạn có thể vào Đơn mua để thanh toán lại sau.')) {
              setShowSepayModal(false)
              onBackToHome()
              setTimeout(() => window.location.href = '/user/purchase', 100)
            }
          }}
          bankInfo={sepayBankInfo}
          qrUrl={sepayQrUrl}
          memo={sepayMemo}
          amount={grandTotal}
        />
      )}

      {/* Shop Voucher Selector Modal (Available in both Cart and Checkout) */}
      {activeShopVoucherModalId && (() => {
        const shopId = activeShopVoucherModalId
        const shopInfo = shopsInfo[shopId]
        const shopName = shopInfo?.name || `Cửa hàng ${shopId.substring(0, 8)}`
        const shopItems = selectedCartItems.filter(item => item.product.shopId === shopId)
        const shopItemsTotal = shopItems.reduce((acc, item) => acc + parsePrice(item.product.flashPrice || item.product.price || item.product.originalPrice) * item.quantity, 0)

        return (
          <ShopVoucherModal
            isOpen={Boolean(activeShopVoucherModalId)}
            onClose={() => setActiveShopVoucherModalId(null)}
            shopId={shopId}
            shopName={shopName}
            shopItemsTotal={shopItemsTotal}
            allShopVouchers={allShopVouchers}
            selectedVoucherId={selectedShopVouchers[shopId]}
            onSelectVoucher={(sId, vId) => {
              setSelectedShopVouchers(prev => ({ ...prev, [sId]: vId }))
            }}
            formatPrice={formatPrice}
          />
        )
      })()}

      {/* Platform Voucher Selector Modal (Available in both Cart and Checkout) */}
      <PlatformVoucherModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        selectedVoucher={selectedVoucher}
        onSelectVoucher={(vCode) => setSelectedVoucher(vCode as any)}
        itemsTotal={itemsTotal}
        platformVouchers={allShopVouchers.filter(v => v.shopId === 'PLATFORM')}
        formatPrice={formatPrice}
      />

    </div>
  )
}
