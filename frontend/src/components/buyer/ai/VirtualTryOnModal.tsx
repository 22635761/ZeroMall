import React, { useState, useEffect, useRef } from 'react'
import { API_BASE_URL, TRYON_SERVICE_URL } from '../../../config/api.config'
import { formatCurrencyVND } from '../../../utils/formatters'
import type { Product } from '../FlashSale'
import type { CartItem } from '../../../models/cart.model'
import { Human3DViewer } from './Human3DViewer'

interface BodyMeasurements {
  bmi: number
  body_type: string
  shape_class: string
  height_cm: number
  weight_kg: number
  gender: string
  chest_cm: number
  waist_cm: number
  hip_cm: number
  thigh_cm: number
  shoulder_cm: number
  inseam_cm: number
  outseam_cm: number
  recommended_pant_size: string
}

interface FitZone {
  label: string
  diff_percent?: number
  diff_cm?: number
  status: string
  status_code: string
  color: string
}

interface FitResult {
  fit_score: number
  recommended_size: string
  silhouette?: string
  body_tip?: string
  zones: {
    waist: FitZone
    hip: FitZone
    thigh: FitZone
    length: FitZone
  }
  verdict: string
  stylist_fit_advice: string
}


interface ExtractedGarment {
  success: boolean
  detected_category: string
  dominant_colors: string[]
  dimensions: { width: number; height: number; orig_width: number; orig_height: number }
  bbox: number[]
  mask_url: string
  extracted_garment_url: string
  pixels_count: number
}

interface ExtractedFace {
  success: boolean
  face_url: string
  width: number
  height: number
}

interface CartFashionItem {
  product: Product
  variant?: string
  quantity: number
}

interface VirtualTryOnModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  cart?: CartItem[]
  onAddToCart?: (product: Product, quantity: number, variant: string) => void
}

// Dùng chung hàm định dạng chuẩn từ utils/formatters
const formatDisplayPrice = formatCurrencyVND

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  isOpen,
  onClose,
  product,
  cart,
  onAddToCart
}) => {
  // 1. Ảnh người dùng & Thông số thể hình (Lưu trữ LocalStorage để đồng bộ xuyên suốt)
  const [userPhoto, setUserPhoto] = useState<string>(() => {
    return localStorage.getItem('zeromall_tryon_user_photo') || '/models/tryon_master/tran_thanh_base.jpg'
  })
  const [userPhotoName, setUserPhotoName] = useState<string>(() => {
    return localStorage.getItem('zeromall_tryon_user_name') || 'Trấn Thành (Hồ sơ AI)'
  })
  const [height, setHeight] = useState<number>(() => {
    return Number(localStorage.getItem('zeromall_tryon_user_height')) || 175
  })
  const [weight, setWeight] = useState<number>(() => {
    return Number(localStorage.getItem('zeromall_tryon_user_weight')) || 68
  })
  const [gender, setGender] = useState<'male' | 'female'>(() => {
    return (localStorage.getItem('zeromall_tryon_user_gender') as 'male' | 'female') || 'male'
  })

  // Lưu thông số thể hình vào LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('zeromall_tryon_user_height', String(height))
      localStorage.setItem('zeromall_tryon_user_weight', String(weight))
      localStorage.setItem('zeromall_tryon_user_gender', gender)
    } catch (e) {
      console.warn('[VirtualTryOnModal] Failed to persist body stats to localStorage:', e)
    }
  }, [height, weight, gender])

  // Tính toán BMI và phân loại thể hình theo chuẩn nhân trắc học
  const hM = Math.max(1, height / 100)
  const currentBmi = Number((weight / (hM * hM)).toFixed(1))

  const getBodyPhysiqueInfo = (bmiVal: number) => {
    if (bmiVal < 18.5) {
      return {
        label: 'Gầy mảnh khảnh (Ectomorph)',
        badge: '🦴 Dáng Gầy (Skinny)',
        color: 'text-sky-700 bg-sky-50 border-sky-300',
        textColor: 'text-sky-600',
        desc: 'Khung người gầy, chân tay thon nhỏ'
      }
    }
    if (bmiVal < 22.0) {
      return {
        label: 'Thon gọn, thanh mảnh',
        badge: '✨ Dáng Thon (Slim)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        textColor: 'text-emerald-600',
        desc: 'Vóc dáng thon thả, eo nhỏ, chân gọn'
      }
    }
    if (bmiVal < 25.0) {
      return {
        label: 'Cân đối tiêu chuẩn (Mesomorph)',
        badge: '💪 Cân Đối (Standard)',
        color: 'text-indigo-700 bg-indigo-50 border-indigo-300',
        textColor: 'text-indigo-600',
        desc: 'Vóc dáng tiêu chuẩn vừa vặn'
      }
    }
    if (bmiVal < 29.0) {
      return {
        label: 'Đậm người / Cơ bắp (Endomorph)',
        badge: '🏋️ Đậm Người (Stout)',
        color: 'text-amber-800 bg-amber-50 border-amber-300',
        textColor: 'text-amber-600',
        desc: 'Khung người đậm, bắp chân & đùi to'
      }
    }
    return {
      label: 'Đầy đặn / Tròn trịa (Plus size)',
      badge: '👕 Dáng Mập (Chubby)',
      color: 'text-rose-700 bg-rose-50 border-rose-300',
      textColor: 'text-rose-600',
      desc: 'Khung người đậm, vòng bụng & đùi đầy đặn'
    }
  }

  const physiqueInfo = getBodyPhysiqueInfo(currentBmi)

  // Phân loại slot trang phục chính xác tuyệt đối theo loại sản phẩm (Top / Bottom / Shoes / Accessory / null)
  const detectItemSlot = (p: any): 'top' | 'bottom' | 'shoes' | 'accessory' | null => {
    if (!p) return null
    const name = ' ' + (p.name || '').toLowerCase().trim() + ' '
    const cat = (p.category || '').toLowerCase().trim()
    const slug = (p.categoryRef?.slug || '').toLowerCase().trim()

    // 0. Loại trừ đồ gia dụng / điện tử / công nghệ nếu lọt vào (trừ túi/ví đựng)
    if (name.includes('bàn là') || name.includes('nồi cơm') || name.includes('nồi chiên') || name.includes('máy giặt') || name.includes('tủ lạnh')) {
      return null
    }
    if ((name.includes('điện thoại') || name.includes('máy tính') || name.includes('máy ảnh')) && !name.includes('túi') && !name.includes('ví') && !name.includes('balo') && !name.includes('bao da') && !name.includes('ốp')) {
      return null
    }

    // 1. GIÀY DÉP (Footwear): Giày, dép, sneaker, sandal, guốc, cao gót, búp bê, loafer, boots...
    const isShoes = [
      'giày', 'giay', 'dép', 'dep', 'sneaker', 'sandal', 'guốc', 'guoc', 
      'cao gót', 'búp bê', 'loafer', 'derby', 'chelsea', 'boots', 'bốt', 'ủng', 'sục', 'mwc', 'slip-on', 'slip on'
    ].some(k => name.includes(k)) || (slug.includes('giay-dep') || cat.includes('giày dép'))

    if (isShoes && !name.includes('hộp đựng') && !name.includes('túi đựng giày') && !name.includes('kệ để giày')) {
      return 'shoes'
    }

    // 2. QUẦN & VÁY & ĐẦM (Bottoms / Lower Garments): Quần tây, jean, jogger, short, chân váy, đầm maxi...
    const isBottom = [
      'quần', 'quan', 'jean', 'jeans', 'jogger', 'short', 'shorts', 'kaki', 'tây âu', 'quần tây', 
      'quần đùi', 'quần baggy', 'quần ống', 'quần culottes', 'quần legging', 
      'quần bò', 'quần lửng', 'quần nỉ', 'quần thun',
      'chân váy', 'váy xòe', 'váy chữ a', 'váy xếp ly', 'váy midi', 'váy maxi', 'váy body', 'váy yếm', 'váy hoa', 'váy tay bồng', 'váy công chúa', 'váy',
      'đầm', 'dam', 'maxi', 'jumpsuit', 'set đồ bộ'
    ].some(k => name.includes(k))

    if (isBottom) {
      return 'bottom'
    }

    // 3. ÁO (Tops / Upper Garments): Áo sơ mi, thun, polo, khoác, bomber, blazer, cardigan, hoodie, sweater, croptop, vest...
    const isTop = [
      'áo', 'ao', 'sơ mi', 'so mi', 'thun', 'polo', 'khoác', 'khoac', 'bomber', 'blazer', 
      'cardigan', 'hoodie', 'sweater', 'croptop', 'crop top', 'tank top', 'ba lỗ', 
      'gile', 'vest', 'bra', 'sát nách', 'cộc tay', 'tay phồng', 'len dệt kim', 'jacket'
    ].some(k => {
      if (k === 'áo' || k === 'ao') {
        return /(?:^|[^\p{L}])áo(?:[^\p{L}]|$)/ui.test(name) || name.includes(' áo ') || name.startsWith(' áo') || name.includes('áo-')
      }
      return name.includes(k)
    })

    // Loại trừ trường hợp phụ kiện có nhắc chữ "cổ áo" hoặc "áo"
    if (isTop && !name.includes('khăn') && !name.includes('kẹp tóc') && !name.includes('dây chuyền') && !name.includes('bông tai') && !name.includes('khuyên tai')) {
      return 'top'
    }

    // 4. MŨ NÓN & PHỤ KIỆN & TRANG SỨC & TÚI VÍ (Accessories)
    const hasHat = name.includes('mũ ') || name.includes(' mũ') || name.includes('nón') || name.includes('cap') || name.includes('beanie') || name.includes('snapback') || name.includes('bucket')
    const hasGlasses = name.includes('kính') || name.includes('gọng kính') || name.includes('tròng phân cực')
    const hasBag = name.includes('túi') || name.includes('ví') || name.includes('balo') || name.includes('ba lô') || name.includes('clutch') || name.includes('tote')
    const hasScarf = name.includes('khăn') || name.includes('cà vạt') || name.includes('caravat')
    const hasHair = name.includes('kẹp tóc') || name.includes('cột tóc') || name.includes('băng đô') || name.includes('cài tóc') || name.includes('bờm') || name.includes('chun buộc')
    const hasJewelry = name.includes('dây chuyền') || name.includes('vòng cổ') || name.includes('vòng tay') || name.includes('lắc tay') || name.includes('lắc chân') || name.includes('khuyên tai') || name.includes('hoa tai') || name.includes('bông tai') || name.includes('nhẫn') || name.includes('kiềng') || name.includes('charm')
    const hasBelt = name.includes('thắt lưng') || name.includes('dây nịt') || name.includes('belt')
    const hasWatch = name.includes('đồng hồ')
    const isAccCat = slug.includes('phu-kien') || slug.includes('tui-vi') || slug.includes('dong-ho') || cat.includes('phụ kiện') || cat.includes('túi ví') || cat.includes('đồng hồ')

    if (hasHat || hasGlasses || hasBag || hasScarf || hasHair || hasJewelry || hasBelt || hasWatch || isAccCat) {
      return 'accessory'
    }

    return null
  }

  // Nhãn badge hiển thị chuẩn xác từng món đồ
  const getSlotBadgeText = (p: any) => {
    const slot = detectItemSlot(p)
    if (slot === 'top') return '👔 Áo'
    if (slot === 'bottom') return '👖 Quần/Váy'
    if (slot === 'shoes') return '👟 Giày/Dép'
    if (slot === 'accessory') {
      const n = (p.name || '').toLowerCase()
      if (n.includes('mũ') || n.includes('nón')) return '🧢 Mũ/Nón'
      if (n.includes('kính')) return '🕶️ Kính'
      if (n.includes('túi') || n.includes('ví') || n.includes('balo')) return '👜 Túi/Ví'
      if (n.includes('khăn')) return '🧣 Khăn'
      return '✨ Phụ Kiện'
    }
    return 'Thời trang'
  }

  // 2. Món đồ được chọn để ướm thử & Nguồn cấp tủ đồ (Hỗ trợ Phối Đồ Đa Món Mix & Match)
  const [selectedOutfit, setSelectedOutfit] = useState<{
    top: Product | null
    bottom: Product | null
    shoes: Product | null
    accessory: Product | null
  }>(() => {
    const init: {
      top: Product | null
      bottom: Product | null
      shoes: Product | null
      accessory: Product | null
    } = { top: null, bottom: null, shoes: null, accessory: null }
    if (product) {
      const slot = detectItemSlot(product) || 'top'
      init[slot] = product
    }
    return init
  })
  const [activeOutfitSlot, setActiveOutfitSlot] = useState<'top' | 'bottom' | 'shoes' | 'accessory'>(() => {
    return (product ? detectItemSlot(product) : null) || 'top'
  })

  const [sourceTab, setSourceTab] = useState<'cart' | 'catalog'>('catalog')
  const [cartFashionItems, setCartFashionItems] = useState<CartFashionItem[]>([])
  const [availablePants, setAvailablePants] = useState<Product[]>(() => (product ? [product] : []))
  const [selectedPant, setSelectedPant] = useState<Product | null>(() => product || null)
  const [isLoadingPants, setIsLoadingPants] = useState<boolean>(true)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'top' | 'bottom' | 'shoes' | 'accessory'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false)
  const searchTimeoutRef = useRef<any>(null)

  // 3. Kết quả phân tích AI & Bóc tách đồ
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false)
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null)
  const [fitResult, setFitResult] = useState<FitResult | null>(null)
  const [compositeTryOnImage, setCompositeTryOnImage] = useState<string>('')
  const [extractedGarment, setExtractedGarment] = useState<ExtractedGarment | null>(null)
  const [extractedFace, setExtractedFace] = useState<ExtractedFace | null>(null)
  const [isScanningGarment, setIsScanningGarment] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'photo' | '3d' | 'scanner' | 'heatmap'>('photo')
  const [viewMode, setViewMode] = useState<'tryon' | 'original' | 'sidebyside'>('tryon')
  const [toastMsg, setToastMsg] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const customGarmentInputRef = useRef<HTMLInputElement | null>(null)
  const lastTriedProductIdRef = useRef<string | null>(null)

  // Nạp ảnh mẫu mặc định nếu người dùng chưa tải ảnh riêng
  useEffect(() => {
    if (!userPhoto) {
      if (gender === 'male') {
        setUserPhoto('/models/tryon_master/tran_thanh_base.jpg')
        setUserPhotoName('Trấn Thành (Hồ sơ AI)')
      } else {
        setUserPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80')
        setUserPhotoName('Ảnh mẫu nữ chuẩn')
      }
    }
  }, [gender])

  // Hàm tải và lọc các món thời trang trong giỏ hàng thực tế của người dùng
  const loadCartFashionItems = (): CartFashionItem[] => {
    try {
      let rawCartItems: CartItem[] = []
      if (cart && Array.isArray(cart)) {
        rawCartItems = cart
      } else {
        const savedUser = localStorage.getItem('zm_user')
        const user = savedUser ? JSON.parse(savedUser) : null
        const key = user?.id ? `zm_cart_${user.id}` : 'zm_cart_guest'
        const saved = localStorage.getItem(key) || localStorage.getItem('zm_cart_guest')
        if (saved) {
          rawCartItems = JSON.parse(saved)
        }
      }

      if (Array.isArray(rawCartItems)) {
        const fashionList: CartFashionItem[] = []
        rawCartItems.forEach((item) => {
          if (!item.product) return
          // Chỉ lấy sản phẩm có thể phân loại chính xác vào 1 trong 4 slot thời trang
          const slot = detectItemSlot(item.product)
          if (slot !== null) {
            const rawPrice = item.product.price || item.product.flashPrice || 0
            const numericPrice = typeof rawPrice === 'number'
              ? rawPrice
              : (parseFloat(String(rawPrice).replace(/[^0-9]/g, '')) || 0)

            const priceStr = numericPrice.toLocaleString('vi-VN') + 'đ'

            fashionList.push({
              product: {
                id: item.product.id,
                name: item.product.name,
                price: priceStr,
                flashPrice: item.product.flashPrice || priceStr,
                originalPrice: item.product.originalPrice || priceStr,
                image: item.product.image,
                category: (item.product as any).category || 'Thời Trang',
                rating: (item.product as any).rating || 0,
                sold: item.product.sold || 0,
                stock: item.product.stock || 99,
                total: item.product.total || 100,
              } as unknown as Product,
              variant: item.selectedVariant,
              quantity: item.quantity
            })
          }
        })
        setCartFashionItems(fashionList)
        return fashionList
      }
    } catch (e) {
      console.error('Lỗi khi nạp danh sách giỏ hàng cho thử đồ:', e)
    }
    setCartFashionItems([])
    return []
  }

  // Hàm tìm kiếm đồ thời trang trong toàn bộ CSDL ZeroMall cho mục Gợi Ý
  const handleSearchDatabase = (query: string) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    const q = query.trim()
    if (!q) {
      setSearchResults([])
      setIsSearchingDb(false)
      return
    }
    setIsSearchingDb(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(q)}&limit=60`)
        if (res.ok) {
          const raw = await res.json()
          const prods: Product[] = Array.isArray(raw) ? raw : (raw.products || [])
          // Chỉ lấy sản phẩm thời trang hợp lệ thuộc 1 trong 4 nhóm: Áo, Quần/Váy, Giày/Dép, Mũ/Phụ Kiện
          const validFashion = prods.filter(p => detectItemSlot(p) !== null)
          setSearchResults(validFashion)
        }
      } catch (err) {
        console.error('Lỗi khi tìm kiếm sản phẩm trong database:', err)
      } finally {
        setIsSearchingDb(false)
      }
    }, 300)
  }

  // Khi mở modal hoặc khi product thay đổi: Đảm bảo chọn ngay sản phẩm được truyền vào
  useEffect(() => {
    if (isOpen && product) {
      const slot = detectItemSlot(product) || 'top'
      setSelectedOutfit(prev => ({ ...prev, [slot]: product }))
      setActiveOutfitSlot(slot)
      setSelectedPant(product)
      setSourceTab('catalog')
    }
  }, [isOpen, product])

  // Tải danh sách trang phục thời trang từ CSDL thực tế ZeroMall & Giỏ hàng (Đầy đủ Áo, Quần, Giày Dép, Mũ Nón)
  useEffect(() => {
    if (!isOpen) return

    // 1. Nạp danh sách đồ thời trang trong giỏ hàng
    const cartItems = loadCartFashionItems()

    // 2. Nạp danh sách đồ đa dạng từ CSDL sàn ZeroMall (Thời trang nam, nữ, giày dép, phụ kiện nón)
    const fetchRealFashion = async () => {
      setIsLoadingPants(true)
      try {
        const [resNam, resNu, resGiayNam, resGiayNu, resPhuKien, resTuiVi] = await Promise.all([
          fetch(`${API_BASE_URL}/products?category=thoi-trang-nam&limit=40`),
          fetch(`${API_BASE_URL}/products?category=thoi-trang-nu&limit=40`),
          fetch(`${API_BASE_URL}/products?category=giay-dep-nam&limit=25`),
          fetch(`${API_BASE_URL}/products?category=giay-dep-nu&limit=25`),
          fetch(`${API_BASE_URL}/products?category=phu-kien-nu&limit=25`),
          fetch(`${API_BASE_URL}/products?category=tui-vi-nu&limit=25`),
        ])

        const parseList = async (res: Response) => {
          if (!res.ok) return []
          const data = await res.json()
          return Array.isArray(data) ? data : (data.products || [])
        }

        const [listNam, listNu, listGiayNam, listGiayNu, listPhuKien, listTuiVi] = await Promise.all([
          parseList(resNam),
          parseList(resNu),
          parseList(resGiayNam),
          parseList(resGiayNu),
          parseList(resPhuKien),
          parseList(resTuiVi)
        ])

        const rawCombined = [...listNam, ...listNu, ...listGiayNam, ...listGiayNu, ...listPhuKien, ...listTuiVi]
        
        // Loại bỏ trùng lặp và loại bỏ các sản phẩm không thuộc 4 slot thời trang
        const uniqueMap = new Map<string, Product>()
        rawCombined.forEach(p => {
          if (p && p.id && !uniqueMap.has(p.id) && detectItemSlot(p) !== null) {
            uniqueMap.set(p.id, p)
          }
        })
        const combined = Array.from(uniqueMap.values())
        let effectivePants = combined.length > 0 ? combined : []

        if (product) {
          const filtered = effectivePants.filter(p => p.id !== product.id)
          effectivePants = [product, ...filtered]
          setAvailablePants(effectivePants)
          const slot = detectItemSlot(product) || 'top'
          setSelectedOutfit(prev => ({ ...prev, [slot]: product }))
          setActiveOutfitSlot(slot)
          setSelectedPant(product)
          setSourceTab('catalog')
        } else {
          setAvailablePants(effectivePants)
          if (cartItems.length > 0) {
            const first = cartItems[0].product
            const slot = detectItemSlot(first) || 'top'
            setSelectedOutfit({ top: null, bottom: null, shoes: null, accessory: null, [slot]: first })
            setActiveOutfitSlot(slot)
            setSelectedPant(first)
            setSourceTab('cart')
          } else if (effectivePants.length > 0) {
            const first = effectivePants[0]
            const slot = detectItemSlot(first) || 'top'
            setSelectedOutfit({ top: null, bottom: null, shoes: null, accessory: null, [slot]: first })
            setActiveOutfitSlot(slot)
            setSelectedPant(first)
            setSourceTab('catalog')
          }
        }
      } catch (e) {
        console.error('Lỗi khi tải sản phẩm ZeroMall:', e)
        if (product) {
          setAvailablePants([product])
          const slot = detectItemSlot(product) || 'top'
          setSelectedOutfit({ top: null, bottom: null, shoes: null, accessory: null, [slot]: product })
          setSelectedPant(product)
        }
      } finally {
        setIsLoadingPants(false)
      }
    }

    fetchRealFashion()
  }, [isOpen, product, cart])

  // Xử lý tải ảnh người dùng lên & tự động trích xuất khuôn mặt bằng AI
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUserPhotoName(file.name)
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string
          setUserPhoto(dataUrl)
          try {
            localStorage.setItem('zeromall_tryon_user_photo', dataUrl)
            localStorage.setItem('zeromall_tryon_user_name', file.name)
          } catch (eStorage) {
            console.warn('[VirtualTryOnModal] Failed to cache user photo to localStorage:', eStorage)
          }
          triggerToast('Đã tải ảnh người dùng! Đang tự động ướm đồ lên vóc dáng của bạn...')

          // Trích xuất khuôn mặt để ốp vào đầu 3D Mannequin
          try {
            const faceRes = await fetch(`${TRYON_SERVICE_URL}/api/tryon/extract-face`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_image: dataUrl })
            })
            if (faceRes.ok) {
              const faceData = await faceRes.json()
              if (faceData.success && faceData.face_url) {
                setExtractedFace(faceData)
              }
            }
          } catch (eFace) {
            console.warn('Face extract warning:', eFace)
          }

          // Kích hoạt chu trình ướm thử lại với ảnh mới ngay lập tức
          handleRunTryOn(selectedPant || product || undefined, dataUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Chọn nhanh ảnh người mẫu mẫu có sẵn
  const handleSelectPresetModel = (modelUrl: string, modelName: string, modelGender: 'male' | 'female') => {
    setUserPhoto(modelUrl)
    setUserPhotoName(modelName)
    setGender(modelGender)
    try {
      localStorage.setItem('zeromall_tryon_user_photo', modelUrl)
      localStorage.setItem('zeromall_tryon_user_name', modelName)
    } catch (e) {
      console.warn('[VirtualTryOnModal] Failed to cache selected model to localStorage:', e)
    }
    triggerToast(`Đã chuyển sang [${modelName}]! AI đang ướm thử...`)
    handleRunTryOn(selectedPant || product || undefined, modelUrl)
  }

  // Bóc tách trang phục theo yêu cầu (Scanner)
  const handleScanGarment = async (garmentToScan?: Product) => {
    const target = garmentToScan || selectedPant
    if (!target || !target.image) return
    setIsScanningGarment(true)
    triggerToast('AI FashnHumanParser đang quét và bóc tách từng lớp vải...')

    try {
      const res = await fetch(`${TRYON_SERVICE_URL}/api/tryon/extract-garment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: target.image,
          garment_info: target
        })
      })
      if (res.ok) {
        const extData = await res.json()
        if (extData.success) {
          setExtractedGarment(extData)
          setActiveTab('scanner')
          triggerToast(`Bóc tách thành công [${extData.detected_category.toUpperCase()}]!`)
        }
      }
    } catch (err) {
      console.error(err)
      triggerToast('Không thể kết nối AI Extractor.')
    } finally {
      setIsScanningGarment(false)
    }
  }

  // Tải ảnh món đồ bất kỳ do người dùng cung cấp (không có trong CSDL)
  const handleCustomGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string
      if (!dataUrl) return
      setIsScanningGarment(true)
      triggerToast('AI đang quét và bóc tách món đồ bạn vừa tải lên...')

      try {
        const res = await fetch(`${TRYON_SERVICE_URL}/api/tryon/extract-garment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            garment_info: { name: file.name }
          })
        })
        if (res.ok) {
          const ext = await res.json()
          if (ext.success) {
            setExtractedGarment(ext)
            const customProduct: Product = {
              id: `custom-${Date.now()}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              price: '0',
              originalPrice: '0',
              flashPrice: '0',
              sold: 0,
              total: 10,
              image: dataUrl,
              category: ext.detected_category,
              stock: 1
            }
            setSelectedPant(customProduct)
            setActiveTab('scanner')
            triggerToast(`AI đã bóc tách thành công: ${ext.detected_category.toUpperCase()}!`)
            handleRunTryOn(customProduct)
          }
        }
      } catch (err) {
        console.error(err)
        triggerToast('Lỗi khi bóc tách món đồ.')
      } finally {
        setIsScanningGarment(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Chạy AI: Dựng 3D + Đo vóc dáng + Ướm thử đồ + Phối đồ đa món
  const handleRunTryOn = async (
    pantToTry?: Product,
    overrideUserPhoto?: string,
    overrideHeight?: number,
    overrideWeight?: number,
    overrideGender?: 'male' | 'female',
    overrideOutfit?: {
      top: Product | null
      bottom: Product | null
      shoes: Product | null
      accessory: Product | null
    }
  ) => {
    const effectiveOutfit = overrideOutfit || selectedOutfit
    const activeItems = Object.values(effectiveOutfit).filter(Boolean) as Product[]
    const targetPant = pantToTry || selectedPant || (activeItems.length > 0 ? activeItems[0] : null)
    if (!targetPant && activeItems.length === 0) return

    setIsLoadingAi(true)
    const effectivePhoto = overrideUserPhoto || userPhoto
    const effectiveH = overrideHeight !== undefined ? overrideHeight : height
    const effectiveW = overrideWeight !== undefined ? overrideWeight : weight
    const effectiveG = overrideGender || gender

    try {
      const res = await fetch(`${TRYON_SERVICE_URL}/api/tryon/full-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height_cm: Number(effectiveH),
          weight_kg: Number(effectiveW),
          gender: effectiveG,
          pant: targetPant || {},
          outfit: effectiveOutfit,
          user_image: effectivePhoto
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setMeasurements(data.measurements)
          setFitResult(data.fit)
          if (data.preview && data.preview.composite_image) {
            setCompositeTryOnImage(data.preview.composite_image)
          }
          if (data.extracted_face && data.extracted_face.face_url) {
            setExtractedFace(data.extracted_face)
          }
          if (data.extracted_garment && data.extracted_garment.extracted_garment_url) {
            setExtractedGarment(data.extracted_garment)
          }
          const activeCount = Object.values(effectiveOutfit).filter(Boolean).length
          if (activeCount > 1) {
            triggerToast(`✨ Đã phối trọn bộ ${activeCount} món lên người mẫu thành công!`)
          } else {
            triggerToast(`Đã ướm thử theo khung người ${effectiveH}cm • ${effectiveW}kg thành công!`)
          }
        }
      }
    } catch (e: any) {
      console.error('Try-on API error:', e)
      triggerToast('Không thể kết nối Local AI Service (Port 5006).')
    } finally {
      setIsLoadingAi(false)
    }
  }

  // Quản lý gán món vào bộ phối đồ
  const handleEquipItem = (item: Product, targetSlot?: 'top' | 'bottom' | 'shoes' | 'accessory') => {
    const slot = targetSlot || activeOutfitSlot || detectItemSlot(item)
    const newOutfit = {
      ...selectedOutfit,
      [slot]: item
    }
    setSelectedOutfit(newOutfit)
    setSelectedPant(item)
    handleRunTryOn(item, undefined, undefined, undefined, undefined, newOutfit)
  }

  const handleRemoveSlot = (slot: 'top' | 'bottom' | 'shoes' | 'accessory', e: React.MouseEvent) => {
    e.stopPropagation()
    const newOutfit = {
      ...selectedOutfit,
      [slot]: null
    }
    setSelectedOutfit(newOutfit)
    const remaining = Object.values(newOutfit).filter(Boolean) as Product[]
    if (remaining.length > 0) {
      setSelectedPant(remaining[0])
      handleRunTryOn(remaining[0], undefined, undefined, undefined, undefined, newOutfit)
    } else {
      setSelectedPant(null)
      setCompositeTryOnImage('')
    }
  }

  const handleSelectSlot = (slot: 'top' | 'bottom' | 'shoes' | 'accessory') => {
    setActiveOutfitSlot(slot)
    setCategoryFilter(slot)
  }

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'streetwear') {
      const top = availablePants.find(p => (p.name || '').toLowerCase().includes('bomber')) || availablePants.find(p => detectItemSlot(p) === 'top')
      const bottom = availablePants.find(p => (p.name || '').toLowerCase().includes('jean')) || availablePants.find(p => detectItemSlot(p) === 'bottom')
      const shoes = availablePants.find(p => (p.name || '').toLowerCase().includes('sneaker')) || availablePants.find(p => detectItemSlot(p) === 'shoes')
      const hat = availablePants.find(p => (p.name || '').toLowerCase().includes('nón') || (p.name || '').toLowerCase().includes('mũ')) || availablePants.find(p => detectItemSlot(p) === 'accessory')
      const newOutfit = {
        top: top || null,
        bottom: bottom || null,
        shoes: shoes || null,
        accessory: hat || null
      }
      setSelectedOutfit(newOutfit)
      handleRunTryOn(top || bottom || undefined, undefined, undefined, undefined, undefined, newOutfit)
      triggerToast('🔥 Đã áp dụng Set Streetwear Cực Ngầu!')
    } else if (presetName === 'office') {
      const top = availablePants.find(p => (p.name || '').toLowerCase().includes('sơ mi') || (p.name || '').toLowerCase().includes('blazer')) || availablePants.find(p => detectItemSlot(p) === 'top')
      const bottom = availablePants.find(p => (p.name || '').toLowerCase().includes('tây') || (p.name || '').toLowerCase().includes('slimfit')) || availablePants.find(p => detectItemSlot(p) === 'bottom')
      const shoes = availablePants.find(p => (p.name || '').toLowerCase().includes('tây') || (p.name || '').toLowerCase().includes('loafer')) || availablePants.find(p => detectItemSlot(p) === 'shoes')
      const newOutfit = {
        top: top || null,
        bottom: bottom || null,
        shoes: shoes || null,
        accessory: null
      }
      setSelectedOutfit(newOutfit)
      handleRunTryOn(top || bottom || undefined, undefined, undefined, undefined, undefined, newOutfit)
      triggerToast('👔 Đã áp dụng Set Công Sở Lịch Lãm!')
    } else if (presetName === 'sport') {
      const top = availablePants.find(p => (p.name || '').toLowerCase().includes('thun') || (p.name || '').toLowerCase().includes('cotton')) || availablePants.find(p => detectItemSlot(p) === 'top')
      const bottom = availablePants.find(p => (p.name || '').toLowerCase().includes('jogger')) || availablePants.find(p => detectItemSlot(p) === 'bottom')
      const shoes = availablePants.find(p => (p.name || '').toLowerCase().includes('sneaker') || (p.name || '').toLowerCase().includes('dép')) || availablePants.find(p => detectItemSlot(p) === 'shoes')
      const newOutfit = {
        top: top || null,
        bottom: bottom || null,
        shoes: shoes || null,
        accessory: null
      }
      setSelectedOutfit(newOutfit)
      handleRunTryOn(top || bottom || undefined, undefined, undefined, undefined, undefined, newOutfit)
      triggerToast('⚡ Đã áp dụng Set Thể Thao Năng Động!')
    }
  }

  const handleAddWholeOutfitToCart = () => {
    const items = Object.values(selectedOutfit).filter(Boolean) as Product[]
    if (items.length === 0) {
      triggerToast('Chưa có món đồ nào được chọn trong bộ phối!')
      return
    }
    if (onAddToCart) {
      items.forEach(item => {
        onAddToCart(item, 1, `Size ${fitResult?.recommended_size || 'L'}`)
      })
      triggerToast(`🛒 Đã thêm trọn bộ ${items.length} món phối đồ vào giỏ hàng!`)
      setTimeout(() => {
        loadCartFashionItems()
      }, 350)
    }
  }

  // Tự động kích hoạt AI ướm thử đồ ngay lập tức khi mở modal hoặc khi bộ phối đồ thay đổi
  useEffect(() => {
    if (isOpen) {
      const outfitSig = Object.entries(selectedOutfit).map(([k, v]) => `${k}:${v?.id || 'none'}`).join('|')
      const currentSignature = `${outfitSig}_${userPhoto}`
      if (lastTriedProductIdRef.current !== currentSignature) {
        lastTriedProductIdRef.current = currentSignature
        const activeItems = Object.values(selectedOutfit).filter(Boolean) as Product[]
        if (activeItems.length > 0) {
          handleRunTryOn(activeItems[0], undefined, undefined, undefined, undefined, selectedOutfit)
        }
      }
    }
  }, [isOpen, selectedOutfit, userPhoto])

  useEffect(() => {
    if (!isOpen) {
      lastTriedProductIdRef.current = null
    }
  }, [isOpen])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const outfitItems = Object.values(selectedOutfit).filter(Boolean) as Product[]
  const totalOutfitPrice = outfitItems.reduce((sum, item) => {
    const raw = item.price || item.flashPrice || 0
    const num = typeof raw === 'number' ? raw : (parseFloat(String(raw).replace(/[^0-9]/g, '')) || 0)
    return sum + num
  }, 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-emerald-600 text-white font-black text-xs px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>✓</span> {toastMsg}
        </div>
      )}

      {/* Modal Dialog */}
      <div 
        className="bg-white w-full max-w-6xl max-h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xl shrink-0">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Phòng Thử Đồ Online AI • Mảng Thời Trang
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Studio 3D
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Gửi ảnh của bạn + Nhập chiều cao cân nặng + Chọn món đồ để AI dựng hình 3D và gợi ý option phù hợp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 2 Columns - Ưu tiên hiển thị Ảnh Thử Đồ làm trung tâm */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CỘT 1: HERO FITTING MIRROR - Ảnh Thử Đồ To Rõ, Nổi Bật (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="bg-slate-900 rounded-3xl p-4 text-white shadow-xl border border-slate-800 flex flex-col justify-between">
                
                {/* Header thanh công cụ của Gương Thử Đồ */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('photo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                        activeTab === 'photo'
                          ? 'bg-emerald-600 text-white ring-1 ring-emerald-400/50'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      <span>📸</span> Ảnh Mặc Thử AI HD
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('3d')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        activeTab === '3d'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <span>🧍</span> Mô Hình 3D Xoay 360°
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('scanner')
                        if (!extractedGarment) handleScanGarment()
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        activeTab === 'scanner'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <span>🔬</span> AI Bóc Tách Đồ
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('heatmap')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        activeTab === 'heatmap'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <span>🔥</span> Áp Lực Vừa Vặn
                    </button>
                  </div>

                  {/* Các nút chế độ khi đang ở tab Ảnh Mặc Thử */}
                  {activeTab === 'photo' && (
                    <div className="flex gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setViewMode('tryon')}
                        className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                          viewMode === 'tryon' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>✨</span> Ảnh Ướm AI
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('original')}
                        className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                          viewMode === 'original' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>👤</span> Ảnh Gốc
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('sidebyside')}
                        className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                          viewMode === 'sidebyside' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>↔</span> So Sánh
                      </button>
                    </div>
                  )}
                </div>

                {/* Khung Display Chính: Chiều cao lớn h-[520px] chuẩn tỷ lệ Studio thời trang */}
                <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                  
                  {/* TAB 1: ẢNH MẶC THỬ THỰC TẾ (HERO) */}
                  {activeTab === 'photo' && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      
                      {/* Trạng thái Loading khi AI đang chạy sinh ảnh */}
                      {isLoadingAi && (
                        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                          <div className="relative mb-4">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-xl">✨</div>
                          </div>
                          <h4 className="text-white font-black text-sm mb-1.5 flex items-center gap-2">
                            Đang xử lý Ảnh Mặc Thử AI HD...
                          </h4>
                          <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                            Hệ thống AI đang phân tích vóc dáng và hoán đổi trang phục sắc nét chuẩn Studio HD
                          </p>
                          <div className="mt-4 flex items-center gap-2 text-[11px] text-indigo-400 font-bold bg-indigo-950/70 px-3.5 py-1.5 rounded-full border border-indigo-500/30">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            ZeroMall AI • Neural Try-On Pipeline
                          </div>
                        </div>
                      )}

                      {/* Chế độ so sánh Song Song (Side by Side) */}
                      {viewMode === 'sidebyside' ? (
                        <div className="grid grid-cols-2 gap-3 w-full h-full p-3">
                          <div className="relative h-full rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-md">
                            <img
                              src={userPhoto}
                              alt="Original User"
                              className="w-full h-full object-contain bg-slate-900"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300 border border-white/10">
                              👤 Ảnh Gốc Ban Đầu
                            </div>
                          </div>
                          <div className="relative h-full rounded-xl overflow-hidden border-2 border-indigo-500/80 bg-slate-900 shadow-md">
                            <img
                              src={compositeTryOnImage || userPhoto}
                              alt="AI Try-on Result"
                              className="w-full h-full object-contain bg-slate-900"
                            />
                            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-600 to-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black text-white shadow-md flex items-center gap-1.5">
                              <span>✨</span> ZeroMall AI • Ảnh Ướm Thử
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Chế độ xem Đơn To Toàn Màn Hình */
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                          <img
                            src={viewMode === 'original' ? userPhoto : (compositeTryOnImage || userPhoto)}
                            alt="Visual Fitting Result"
                            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition duration-300"
                          />
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] font-bold text-indigo-300 border border-white/15 flex items-center gap-2 shadow-xl">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {viewMode === 'original' ? 'Ảnh gốc của bạn' : 'Ảnh Thử Đồ AI (HD Studio)'}
                          </div>
                          {selectedPant && ((selectedPant.name || '').toLowerCase().includes('quần') || (selectedPant.name || '').toLowerCase().includes('jean') || (selectedPant.name || '').toLowerCase().includes('jogger')) && (
                            <div className="absolute bottom-3 left-3 bg-indigo-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-200 border border-indigo-500/30 flex items-center gap-1.5 shadow-lg">
                              <span>👖</span> Đang ướm Quần vào đôi chân & vóc dáng toàn thân
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MÔ HÌNH 3D CON NGƯỜI CHÂN THỰC THREE.JS (Xoay 360 độ) */}
                  {activeTab === '3d' && (
                    <Human3DViewer
                      userFaceUrl={extractedFace?.face_url || userPhoto}
                      heightCm={Number(height)}
                      weightKg={Number(weight)}
                      gender={gender}
                      waistCm={measurements?.waist_cm}
                      thighCm={measurements?.thigh_cm}
                      garmentColor={
                        extractedGarment?.dominant_colors?.[0] || (
                          (selectedPant?.name || '').toLowerCase().includes('đỏ') ? '#d53154' :
                          (selectedPant?.name || '').toLowerCase().includes('jean') ? '#2563eb' :
                          (selectedPant?.name || '').toLowerCase().includes('jogger') ? '#334155' :
                          (selectedPant?.name || '').toLowerCase().includes('bomber') || (selectedPant?.name || '').toLowerCase().includes('khoác') ? '#1e293b' : '#3b82f6'
                        )
                      }
                      garmentType={
                        (selectedPant?.name || '').toLowerCase().includes('váy') || (selectedPant?.name || '').toLowerCase().includes('đầm') ? 'one-pieces' :
                        (selectedPant?.name || '').toLowerCase().includes('quần') || (selectedPant?.name || '').toLowerCase().includes('jean') || (selectedPant?.name || '').toLowerCase().includes('jogger') ? 'bottoms' : 'tops'
                      }
                      garmentName={selectedPant?.name}
                    />
                  )}

                  {/* TAB 3: BỘ BÓC TÁCH & QUÉT TRANG PHỤC THÔNG MINH (AI GARMENT SCANNER) */}
                  {activeTab === 'scanner' && (
                    <div className="w-full h-full p-4 flex flex-col justify-between overflow-y-auto text-slate-200">
                      <div>
                        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
                          <div>
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <span>🔬</span> Bộ Bóc Tách Trang Phục Từng Lớp (FashnHumanParser AI)
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Tự động bóc tách vải, khử nền sạch 100%, tạo Alpha Matte & trích xuất bảng màu
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleScanGarment()}
                            disabled={isScanningGarment}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                          >
                            <span>⚡</span> {isScanningGarment ? 'Đang Quét...' : 'Quét Lại Món Này'}
                          </button>
                        </div>

                        {/* 3 Cột Trực Quan: Ảnh Gốc -> Mặt Nạ B&W -> Đồ Sạch Nền Trong Suốt */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          {/* Cột 1: Ảnh Gốc */}
                          <div className="bg-slate-900 rounded-xl p-2.5 border border-white/10 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 self-start">
                              1. Ảnh Gốc Món Đồ
                            </span>
                            <div className="w-full h-52 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-white/5">
                              <img
                                src={selectedPant?.image || ''}
                                alt="Garment Original"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1.5 text-center truncate max-w-full">
                              {selectedPant?.name}
                            </span>
                          </div>

                          {/* Cột 2: Mặt Nạ Phân Đoạn (Segmentation Mask) */}
                          <div className="bg-slate-900 rounded-xl p-2.5 border border-white/10 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5 self-start flex items-center gap-1">
                              <span>🎭</span> 2. Mặt Nạ Phân Đoạn AI
                            </span>
                            <div className="w-full h-52 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-white/5 relative">
                              {extractedGarment?.mask_url ? (
                                <img
                                  src={extractedGarment.mask_url}
                                  alt="AI Garment Mask"
                                  className="max-h-full max-w-full object-contain"
                                />
                              ) : (
                                <div className="text-center p-4">
                                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <span className="text-xs text-slate-400">Đang tạo mặt nạ nhị phân...</span>
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-400 border border-white/10">
                                {extractedGarment?.pixels_count ? `${extractedGarment.pixels_count.toLocaleString()} px` : 'Mask 0/1'}
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1.5">
                              Nhãn: {extractedGarment?.detected_category?.toUpperCase() || 'CHƯA QUÉT'}
                            </span>
                          </div>

                          {/* Cột 3: Món Đồ Sạch Nền Trong Suốt */}
                          <div className="bg-slate-900 rounded-xl p-2.5 border border-white/10 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5 self-start flex items-center gap-1">
                              <span>✨</span> 3. Đồ Bóc Tách Sạch Nền
                            </span>
                            <div 
                              className="w-full h-52 rounded-lg overflow-hidden flex items-center justify-center border border-white/5 relative"
                              style={{
                                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                                backgroundSize: '16px 16px',
                                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                              }}
                            >
                              {extractedGarment?.extracted_garment_url ? (
                                <img
                                  src={extractedGarment.extracted_garment_url}
                                  alt="Isolated Garment"
                                  className="max-h-full max-w-full object-contain drop-shadow-2xl"
                                />
                              ) : (
                                <img
                                  src={selectedPant?.image || ''}
                                  alt="Isolated Garment"
                                  className="max-h-full max-w-full object-contain opacity-70"
                                />
                              )}
                              <div className="absolute bottom-1 right-1 bg-emerald-950/80 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                                Alpha PNG 100%
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1.5">
                              Khung: {extractedGarment?.dimensions?.width || 0} × {extractedGarment?.dimensions?.height || 0} px
                            </span>
                          </div>
                        </div>

                        {/* Thẻ Phân Tích Thuộc Tính Vải & Màu Sắc */}
                        <div className="bg-slate-900/90 rounded-xl p-3 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-300">Bảng màu vải chủ đạo:</span>
                            <div className="flex items-center gap-1.5">
                              {(extractedGarment?.dominant_colors || ['#3b82f6', '#1e293b']).map((c, i) => (
                                <div key={i} className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-white/10">
                                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c }}></span>
                                  <span className="font-mono text-[10px] text-slate-300">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('3d')}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <span>🧍</span> Mặc Lên Khung 3D (Xoay 360°)
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTab('photo')}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <span>✨</span> Xem Ảnh Thử Bằng Neural AI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BẢN ĐỒ ÁP LỰC VỪA VẶN */}
                  {activeTab === 'heatmap' && fitResult && (
                    <div className="w-full h-full p-6 flex flex-col justify-center space-y-3.5 max-w-md mx-auto text-slate-800">
                      <h4 className="text-white font-bold text-center text-sm mb-2">🔥 Bản Đồ Áp Lực Co Giãn Vải Theo Vóc Dáng</h4>
                      {Object.entries(fitResult.zones).map(([key, zone]) => (
                        <div key={key} className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-white/20 space-y-1.5 shadow-md">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">{zone.label}</span>
                            <span
                              className="font-black px-2 py-0.5 rounded text-[10px]"
                              style={{ backgroundColor: `${zone.color}25`, color: zone.color }}
                            >
                              {zone.status}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, Math.max(30, 85 - Math.abs(zone.diff_percent || zone.diff_cm || 0) * 3))}%`,
                                backgroundColor: zone.color
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Món Đồ Đang Mặc & Nút Thao Tác Nhanh */}
                {outfitItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        {outfitItems.map((item, idx) => (
                          <img
                            key={item.id + idx}
                            src={item.image || 'https://placehold.co/80x80'}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded-xl border-2 border-slate-900 bg-white shadow-sm"
                            title={item.name}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">
                          {outfitItems.length > 1 ? `Đang Phối Bộ ${outfitItems.length} Món` : 'Đang Thử Trên Người'}
                        </span>
                        <h4 className="font-bold text-white text-xs sm:text-sm truncate max-w-[280px]">
                          {outfitItems.map(i => i.name).join(' + ')}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-rose-400 font-black text-xs sm:text-sm">
                            {totalOutfitPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-2 py-0.2 rounded-full border border-emerald-500/30">
                            Khớp vóc dáng: {fitResult?.fit_score || 95}% • Size {fitResult?.recommended_size || measurements?.recommended_pant_size || 'L'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {compositeTryOnImage && (
                        <a
                          href={compositeTryOnImage}
                          download={`zeromall-outfit-${Date.now()}.jpg`}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-white/10"
                          title="Tải ảnh mặc thử độ phân giải cao"
                        >
                          <span>⬇</span> Tải Ảnh HD
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={handleAddWholeOutfitToCart}
                        className="px-4 py-2 bg-[#ee4d2d] hover:bg-[#d93b1d] text-white rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] flex items-center gap-1.5"
                      >
                        <span>🛒</span> {outfitItems.length > 1 ? `Thêm Trọn Bộ (${outfitItems.length} Món)` : 'Thêm Vào Giỏ Hàng'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT 2: BẢNG ĐIỀU KHIỂN & TỦ ĐỒ CHỌN MÓN (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* KHỐI 1: BẢNG PHỐI ĐỒ ĐA NĂNG AI (OUTFIT MIX & MATCH BUILDER) */}
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                      <span>🎨</span> Bảng Phối Đồ AI (Mix & Match)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    {outfitItems.length}/4 Món Đã Phối
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Bấm vào từng ô để chọn phối áo, quần, giày dép, mũ nón... AI sẽ tự động ướm trọn bộ lên cơ thể!
                </p>

                {/* 4 NGĂN PHỐI ĐỒ: Áo, Quần, Giày, Mũ */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Ô 1: ÁO */}
                  <div
                    onClick={() => handleSelectSlot('top')}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                      activeOutfitSlot === 'top'
                        ? 'border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-indigo-300 mb-1">👔 Áo</span>
                    {selectedOutfit.top ? (
                      <div className="w-full space-y-1">
                        <div className="relative w-12 h-12 mx-auto">
                          <img
                            src={selectedOutfit.top.image || 'https://placehold.co/60x60'}
                            alt={selectedOutfit.top.name}
                            className="w-full h-full object-cover rounded-lg border border-white/20 bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSlot('top', e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow hover:bg-rose-500 cursor-pointer"
                            title="Gỡ áo"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[9px] font-bold text-white truncate max-w-[70px]">{selectedOutfit.top.name}</p>
                      </div>
                    ) : (
                      <div className="h-12 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300">
                        <span className="text-sm">+</span>
                        <span className="text-[9px] font-bold">Chọn Áo</span>
                      </div>
                    )}
                  </div>

                  {/* Ô 2: QUẦN / VÁY */}
                  <div
                    onClick={() => handleSelectSlot('bottom')}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                      activeOutfitSlot === 'bottom'
                        ? 'border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-indigo-300 mb-1">👖 Quần/Váy</span>
                    {selectedOutfit.bottom ? (
                      <div className="w-full space-y-1">
                        <div className="relative w-12 h-12 mx-auto">
                          <img
                            src={selectedOutfit.bottom.image || 'https://placehold.co/60x60'}
                            alt={selectedOutfit.bottom.name}
                            className="w-full h-full object-cover rounded-lg border border-white/20 bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSlot('bottom', e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow hover:bg-rose-500 cursor-pointer"
                            title="Gỡ quần"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[9px] font-bold text-white truncate max-w-[70px]">{selectedOutfit.bottom.name}</p>
                      </div>
                    ) : (
                      <div className="h-12 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300">
                        <span className="text-sm">+</span>
                        <span className="text-[9px] font-bold">Chọn Quần</span>
                      </div>
                    )}
                  </div>

                  {/* Ô 3: GIÀY / DÉP */}
                  <div
                    onClick={() => handleSelectSlot('shoes')}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                      activeOutfitSlot === 'shoes'
                        ? 'border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-indigo-300 mb-1">👟 Giày/Dép</span>
                    {selectedOutfit.shoes ? (
                      <div className="w-full space-y-1">
                        <div className="relative w-12 h-12 mx-auto">
                          <img
                            src={selectedOutfit.shoes.image || 'https://placehold.co/60x60'}
                            alt={selectedOutfit.shoes.name}
                            className="w-full h-full object-cover rounded-lg border border-white/20 bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSlot('shoes', e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow hover:bg-rose-500 cursor-pointer"
                            title="Gỡ giày"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[9px] font-bold text-white truncate max-w-[70px]">{selectedOutfit.shoes.name}</p>
                      </div>
                    ) : (
                      <div className="h-12 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300">
                        <span className="text-sm">+</span>
                        <span className="text-[9px] font-bold">Chọn Giày</span>
                      </div>
                    )}
                  </div>

                  {/* Ô 4: MŨ / PHỤ KIỆN */}
                  <div
                    onClick={() => handleSelectSlot('accessory')}
                    className={`relative p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                      activeOutfitSlot === 'accessory'
                        ? 'border-indigo-400 bg-indigo-950/60 ring-2 ring-indigo-500/40 shadow-md'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-indigo-300 mb-1">🧢 Mũ/Nón</span>
                    {selectedOutfit.accessory ? (
                      <div className="w-full space-y-1">
                        <div className="relative w-12 h-12 mx-auto">
                          <img
                            src={selectedOutfit.accessory.image || 'https://placehold.co/60x60'}
                            alt={selectedOutfit.accessory.name}
                            className="w-full h-full object-cover rounded-lg border border-white/20 bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRemoveSlot('accessory', e)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow hover:bg-rose-500 cursor-pointer"
                            title="Gỡ mũ"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[9px] font-bold text-white truncate max-w-[70px]">{selectedOutfit.accessory.name}</p>
                      </div>
                    ) : (
                      <div className="h-12 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-300">
                        <span className="text-sm">+</span>
                        <span className="text-[9px] font-bold">Chọn Mũ</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gợi ý phối set nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400">Gợi ý phối sẵn:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('streetwear')}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition cursor-pointer"
                  >
                    🔥 Set Streetwear (Bomber+Jean+Sneaker)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('office')}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition cursor-pointer"
                  >
                    👔 Set Công Sở (Sơ mi+Quần tây+Giày)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('sport')}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition cursor-pointer"
                  >
                    ⚡ Set Thể Thao (Thun+Jogger+Sneaker)
                  </button>
                </div>

                {/* Total Outfit Price & Buy Whole Set Button */}
                {outfitItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Tổng {outfitItems.length} món trong bộ:</span>
                      <span className="text-sm font-black text-rose-400">{totalOutfitPrice.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunTryOn(undefined, undefined, undefined, undefined, undefined, selectedOutfit)}
                        disabled={isLoadingAi}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <span>✨</span> {isLoadingAi ? 'Đang Ướm...' : 'Ướm Cả Bộ'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddWholeOutfitToCart}
                        className="px-3 py-1.5 bg-[#ee4d2d] hover:bg-[#d93b1d] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <span>🛒</span> Mua Cả Bộ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 2: THÊM ẢNH NGƯỜI DÙNG ĐỂ THỬ ĐỒ (CTA NỔI BẬT NHẤT) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span>📸</span> Thêm Ảnh Người Dùng
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {((selectedPant?.name || '').toLowerCase().includes('quần') || (selectedPant?.name || '').toLowerCase().includes('jean') || (selectedPant?.name || '').toLowerCase().includes('jogger'))
                        ? 'AI nhận diện vóc dáng và ghép quần vào đôi chân (chân dung hoặc toàn thân)'
                        : 'Tải ảnh của bạn để AI tự động ướm đồ lên người bạn'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {height}cm • {weight}kg
                  </span>
                </div>

                {/* Hero CTA Box: Bấm để chọn ảnh từ máy tính / điện thoại */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-400/80 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50/80 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={userPhoto || 'https://placehold.co/100x100?text=You'}
                      alt="Avatar"
                      className="w-13 h-13 sm:w-14 sm:h-14 object-cover rounded-xl border border-emerald-300 shadow-2xs group-hover:scale-105 transition bg-white"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow">
                      📷
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                      <span>+</span> Tải Ảnh Của Bạn Lên Đây
                    </p>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">
                      Đang dùng: <span className="font-bold text-slate-800">{userPhotoName}</span>
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 group-hover:underline">
                      Chọn file ảnh từ thiết bị (JPG, PNG) ➔
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {/* Quick Model Selector Pills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Hoặc chọn nhanh ảnh mẫu có sẵn:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectPresetModel('/models/tryon_master/tran_thanh_base.jpg', 'Trấn Thành (Hồ sơ AI)', 'male')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                        userPhoto.includes('tran_thanh')
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>👨</span> Trấn Thành
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetModel('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', 'Mẫu Nam Chuẩn', 'male')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                        userPhoto.includes('photo-1506794778202')
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>👨</span> Mẫu Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetModel('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80', 'Mẫu Nữ Chuẩn', 'female')}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer truncate ${
                        userPhoto.includes('photo-1534528741775')
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>👩</span> Mẫu Nữ
                    </button>
                  </div>
                </div>

                {/* Nhập Chiều cao & Cân nặng để AI tự động tính vóc dáng */}
                <div className="pt-2.5 border-t border-slate-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Chiều cao (cm)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="120"
                          max="220"
                          value={height || ''}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRunTryOn(selectedPant || product || undefined, userPhoto, height, weight, gender)
                            }
                          }}
                          placeholder="175"
                          className="w-full px-2.5 py-1.5 text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Cân nặng (kg)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="30"
                          max="150"
                          value={weight || ''}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRunTryOn(selectedPant || product || undefined, userPhoto, height, weight, gender)
                            }
                          }}
                          placeholder="50"
                          className="w-full px-2.5 py-1.5 text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin vóc dáng AI tự tính & Nút cập nhật số đo */}
                  <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/70">
                    <span className="text-slate-600 truncate">
                      AI tự tính vóc dáng: <strong className="text-indigo-700">{physiqueInfo.badge}</strong> (BMI {currentBmi})
                    </span>
                    <button
                      type="button"
                      disabled={isLoadingAi || !selectedPant || !height || !weight}
                      onClick={() => handleRunTryOn(selectedPant || product || undefined, userPhoto, height, weight, gender)}
                      className="text-indigo-600 hover:text-indigo-800 font-black text-[11px] shrink-0 ml-2 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Áp dụng ➔
                    </button>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: GỢI Ý TRANG PHỤC & TÌM KIẾM ĐỒ TRONG CSDL */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span>💡</span> Gợi Ý Ướm Thử
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {sourceTab === 'cart'
                      ? `${cartFashionItems.length} món trong giỏ`
                      : searchQuery.trim()
                      ? `${searchResults.filter(p => categoryFilter === 'all' || detectItemSlot(p) === categoryFilter).length} kết quả`
                      : `${availablePants.filter(p => categoryFilter === 'all' || detectItemSlot(p) === categoryFilter).length} mẫu`}
                  </span>
                </div>

                {/* BỘ CHUYỂN NGUỒN: TRONG GIỎ HÀNG vs GỢI Ý */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setSourceTab('cart')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      sourceTab === 'cart'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>🛒</span> Trong Giỏ Hàng
                    {cartFashionItems.length > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        sourceTab === 'cart' ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {cartFashionItems.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('catalog')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      sourceTab === 'catalog'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>💡</span> Gợi Ý
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      sourceTab === 'catalog' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {searchQuery.trim()
                        ? searchResults.filter(p => categoryFilter === 'all' || detectItemSlot(p) === categoryFilter).length
                        : availablePants.filter(p => categoryFilter === 'all' || detectItemSlot(p) === categoryFilter).length}
                    </span>
                  </button>
                </div>

                {/* Nút Tải Ảnh Món Đồ Bất Kỳ Của Bạn */}
                <div>
                  <button
                    type="button"
                    onClick={() => customGarmentInputRef.current?.click()}
                    disabled={isScanningGarment}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-white rounded-xl text-xs font-bold shadow-xs transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    <span>📸</span> {isScanningGarment ? 'AI Đang Quét & Bóc Tách...' : 'Tải Ảnh Đồ Bất Kỳ Để AI Quét & Thử'}
                  </button>
                  <input
                    ref={customGarmentInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomGarmentUpload}
                    className="hidden"
                  />
                </div>

                {/* TAB 1: HIỂN THỊ CÁC MÓN TRONG GIỎ HÀNG */}
                {sourceTab === 'cart' && (
                  <div>
                    {cartFashionItems.length === 0 ? (
                      <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                        <span className="text-2xl">🛒</span>
                        <p className="text-xs font-bold text-slate-700">Chưa có đồ thời trang trong giỏ hàng</p>
                        <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                          Các sản phẩm áo, quần, váy bạn thêm vào giỏ hàng sẽ hiển thị tại đây để bạn ướm thử trước khi thanh toán.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSourceTab('catalog')}
                          className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>🛍️</span> Thử mẫu trên sàn ZeroMall ➔
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                        {cartFashionItems.map((item) => {
                          const isEquipped = Object.values(selectedOutfit).some(it => it?.id === item.product.id)
                          const equippedSlot = Object.entries(selectedOutfit).find(([_, it]) => it?.id === item.product.id)?.[0]
                          const slotLabel = equippedSlot === 'top' ? '👔 Áo' : equippedSlot === 'bottom' ? '👖 Quần' : equippedSlot === 'shoes' ? '👟 Giày' : equippedSlot === 'accessory' ? '🧢 Phụ Kiện' : ''
                          return (
                            <div
                              key={item.product.id + (item.variant || '')}
                              onClick={() => handleEquipItem(item.product)}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                isEquipped
                                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/30 shadow-xs'
                                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
                              }`}
                            >
                              <img
                                src={item.product.image || 'https://placehold.co/80x100?text=Item'}
                                alt={item.product.name}
                                className="w-12 h-14 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-bold truncate ${isEquipped ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                                  {item.product.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-black text-rose-600">
                                    {formatDisplayPrice(item.product.price || item.product.flashPrice)}
                                  </span>
                                  {item.variant && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium truncate max-w-[90px]">
                                      {item.variant}
                                    </span>
                                  )}
                                  {isEquipped ? (
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                                      Đang phối {slotLabel}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                                      {getSlotBadgeText(item.product)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isEquipped ? (
                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600">
                                  + Phối ➔
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: HIỂN THỊ CÁC MÓN GỢI Ý & TÌM KIẾM TỪ CSDL ZEROMALL */}
                {sourceTab === 'catalog' && (
                  <div className="space-y-2.5">
                    {/* Ô Tìm Kiếm Món Đồ Thời Trang Trong Toàn Bộ Database */}
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchDatabase(e.target.value)}
                        placeholder="🔍 Tìm đồ khác trong kho (áo, quần, đầm, blazer...)"
                        className="w-full pl-8 pr-8 py-2 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                        🔍
                      </span>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Tabs phân loại danh mục */}
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
                      {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'top', label: '👔 Áo (Tops)' },
                        { key: 'bottom', label: '👖 Quần & Váy' },
                        { key: 'shoes', label: '👟 Giày & Dép' },
                        { key: 'accessory', label: '🧢 Mũ & Phụ kiện' }
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setCategoryFilter(tab.key as any)}
                          className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition cursor-pointer text-xs ${
                            categoryFilter === tab.key
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Danh sách trang phục thực tế (Gợi ý hoặc Kết quả tìm kiếm CSDL) */}
                    {isSearchingDb ? (
                      <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
                        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Đang tìm kiếm đồ thời trang trong database ZeroMall...
                      </div>
                    ) : isLoadingPants ? (
                      <div className="text-center py-8 text-xs text-slate-400 flex flex-col items-center gap-2">
                        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                        Đang nạp gợi ý từ CSDL ZeroMall...
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {(searchQuery.trim() ? searchResults : availablePants)
                          .filter((p) => {
                            const slot = detectItemSlot(p)
                            if (!slot) return false
                            if (categoryFilter === 'all') return true
                            return slot === categoryFilter
                          })
                          .map((pant) => {
                            const isEquipped = Object.values(selectedOutfit).some(it => it?.id === pant.id)
                            const equippedSlot = Object.entries(selectedOutfit).find(([_, it]) => it?.id === pant.id)?.[0]
                            const slotLabel = equippedSlot === 'top' ? '👔 Áo' : equippedSlot === 'bottom' ? '👖 Quần' : equippedSlot === 'shoes' ? '👟 Giày' : equippedSlot === 'accessory' ? '🧢 Phụ Kiện' : ''
                            return (
                              <div
                                key={pant.id}
                                onClick={() => handleEquipItem(pant)}
                                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                  isEquipped
                                    ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/30 shadow-xs'
                                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <img
                                  src={pant.image || 'https://placehold.co/80x100?text=Item'}
                                  alt={pant.name}
                                  className="w-12 h-14 object-cover rounded-xl border border-slate-200 shrink-0 shadow-2xs"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isEquipped ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                                    {pant.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-black text-rose-600">
                                      {formatDisplayPrice(pant.price || pant.flashPrice)}
                                    </span>
                                    {isEquipped ? (
                                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                                        Đang phối {slotLabel}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md">
                                        {getSlotBadgeText(pant)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isEquipped ? (
                                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600">
                                    + Phối ➔
                                  </span>
                                )}
                              </div>
                            )
                          })}

                        {searchQuery.trim() && searchResults.length === 0 && (
                          <div className="text-center py-6 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
                            Không tìm thấy món đồ thời trang nào khớp với "{searchQuery}" trong kho.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Nút bấm Thử lại / Dựng lại */}
                <button
                  type="button"
                  disabled={isLoadingAi || !selectedPant}
                  onClick={() => handleRunTryOn()}
                  className={`w-full py-2.5 px-4 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                    isLoadingAi
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                  }`}
                >
                  {isLoadingAi ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      AI Đang Xử Lý Mặc Đồ...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      LÀM MỚI & ƯỚM LẠI MÓN NÀY
                    </>
                  )}
                </button>
              </div>

              {/* KHỐI 3: LỜI KHUYÊN TỪ AI STYLIST */}
              {fitResult && (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-950 leading-relaxed shadow-2xs">
                  <span className="text-base shrink-0">💡</span>
                  <div>
                    <p className="font-black text-emerald-900 text-xs mb-0.5">Phân Tích AI Stylist:</p>
                    <p className="text-[11px] text-emerald-800">{fitResult.stylist_fit_advice}</p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
