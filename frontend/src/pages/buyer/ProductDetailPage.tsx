import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { useParams } from 'react-router-dom'
import type { Product, VariationGroup, VariationRow } from '../../components/buyer/FlashSale'
import { ProductGallery } from '../../components/buyer/product-detail/ProductGallery'
import { ProductPurchasePanel } from '../../components/buyer/product-detail/ProductPurchasePanel'
import { ShopInfoCard } from '../../components/buyer/product-detail/ShopInfoCard'
import { ProductDescriptionSection } from '../../components/buyer/product-detail/ProductDescriptionSection'
import { ProductReviewsSection } from '../../components/buyer/product-detail/ProductReviewsSection'
import { ShopTopProductsSidebar } from '../../components/buyer/product-detail/ShopTopProductsSidebar'

interface ProductDetailPageProps {
  user: any
  onBackToHome: () => void
  onAddToCart: (product: Product, quantity: number, variant: string) => void
  onBuyNow: (product: Product, quantity: number, variant: string) => void
  onOpenLogin: () => void
  onRequireLogin?: (title?: string, description?: string, icon?: string) => void
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  user,
  onBackToHome,
  onAddToCart,
  onBuyNow,
  onOpenLogin,
  onRequireLogin
}) => {
  const { slugWithId } = useParams<{ slugWithId: string }>()
  const id = slugWithId?.split('-i.').pop()
  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return
      setLoadingProduct(true)
      try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`)
        if (response.ok) {
          const p = await response.json()
          
          const sellingPriceNum = parseFloat(String(p.price || 0).replace(/[^0-9]/g, '')) || 0
          let flashPriceStr = sellingPriceNum.toLocaleString('vi-VN') + 'đ'
          let originalPriceStr = ''
          const rawOrigNum = p.originalPrice ? parseFloat(String(p.originalPrice).replace(/[^0-9]/g, '')) : 0
          if (rawOrigNum > 0) {
            originalPriceStr = rawOrigNum.toLocaleString('vi-VN') + 'đ'
          } else {
            originalPriceStr = flashPriceStr
          }

          let parsedVariationGroups: VariationGroup[] = []
          if (p.hasVariations && p.variationGroups) {
            try {
              parsedVariationGroups = typeof p.variationGroups === 'string'
                ? JSON.parse(p.variationGroups)
                : p.variationGroups
            } catch (e) {
              console.error('Error parsing variationGroups', e)
            }
          }

          let parsedVariationRows: VariationRow[] = []
          if (p.hasVariations && p.variationRows) {
            try {
              parsedVariationRows = typeof p.variationRows === 'string'
                ? JSON.parse(p.variationRows)
                : p.variationRows
            } catch (e) {
              console.error('Error parsing variationRows', e)
            }
          }

          // Fallback if variationGroups is empty but legacy variants exist
          if (parsedVariationGroups.length === 0 && p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
            parsedVariationGroups = [{ name: 'Phân loại', options: p.variants }]
          }

          let parsedImages: string[] = []
          try {
            parsedImages = p.images ? JSON.parse(p.images) : []
          } catch (e) {
            console.error('Failed to parse images', e)
          }
          if (!parsedImages || parsedImages.length === 0) {
            parsedImages = p.image ? [p.image] : []
          }

          setProduct({
            id: p.id,
            name: p.name,
            originalPrice: originalPriceStr,
            flashPrice: flashPriceStr,
            price: flashPriceStr,
            image: p.image || 'https://placehold.co/400x400?text=No+Image',
            stock: p.stock !== undefined ? p.stock : 0,
            status: p.status || 'active',
            sold: p.sales || 0,
            total: (p.sales || 0) + (p.stock || 0),
            rating: p.rating ?? 0,
            reviewsCount: p.reviewsCount ?? 0,
            description: p.description,
            hasVariations: Boolean(p.hasVariations || parsedVariationGroups.length > 0),
            variationGroups: parsedVariationGroups,
            variationRows: parsedVariationRows,
            variants: parsedVariationGroups.flatMap((g) => g.options || []),
            images: parsedImages,
            video: p.video || '',
            category: p.category,
            brand: p.brand,
            shopId: p.shopId,
            weight: p.weight,
            length: p.length,
            width: p.width,
            height: p.height
          })
        }
      } catch (e) {
        console.error('Failed to fetch product details:', e)
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchProductDetails()
  }, [id])

  // Multi-tier variation selection state
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [savedCoupons, setSavedCoupons] = useState<Record<string, boolean>>({})
  
  // Real database reviews state
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [activeReviewFilter, setActiveReviewFilter] = useState('all')

  // Real database shop state
  const [shopDetails, setShopDetails] = useState<any>(null)
  const [shopStats, setShopStats] = useState<any>(null)
  const [isLoadingShop, setIsLoadingShop] = useState(true)

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('')

  // Flying items state for product add-to-cart animation
  const [flyingItems, setFlyingItems] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number; image: string }[]>([])

  // Reset variation selection when product changes
  useEffect(() => {
    setSelectedOptions({})
    setActiveImgIdx(0)
  }, [product?.id])

  const handleSelectOption = (groupIdx: number, option: string) => {
    setSelectedOptions((prev) => {
      if (prev[groupIdx] === option) {
        const next = { ...prev }
        delete next[groupIdx]
        return next
      }
      return {
        ...prev,
        [groupIdx]: option
      }
    })
  }

  // Find matching row for the current selections
  const selectedRow = useMemo(() => {
    if (!product?.variationRows || product.variationRows.length === 0) return null
    const groups = product.variationGroups || []
    if (groups.length === 0) return null

    const selectedVals: string[] = []
    for (let i = 0; i < groups.length; i++) {
      if (!selectedOptions[i]) return null
      selectedVals.push(selectedOptions[i])
    }

    return product.variationRows.find((r) => {
      if (r.key === selectedVals.join(' - ') || r.name === selectedVals.join(' - ')) return true
      if (r.key === selectedVals.join(', ') || r.name === selectedVals.join(', ')) return true
      if (r.key === selectedVals.join(' ') || r.name === selectedVals.join(' ')) return true
      const parts = (r.name || r.key || '').split(/[-,\/]/).map((s: string) => s.trim().toLowerCase())
      const sel = selectedVals.map((s) => s.trim().toLowerCase())
      return sel.length === parts.length && sel.every((sv, i) => parts[i] === sv)
    }) || null
  }, [product, selectedOptions])

  // Price & stock calculation based on variations
  const { currentFlashPrice, currentOriginalPrice, stockAvailable, currentVariantName } = useMemo(() => {
    if (!product) {
      return { currentFlashPrice: '0đ', currentOriginalPrice: '0đ', stockAvailable: 0, currentVariantName: '' }
    }

    const groups = product.variationGroups || []
    const rows = product.variationRows || []

    if (!product.hasVariations || groups.length === 0 || rows.length === 0) {
      const stockVal = product.stock !== undefined ? product.stock : Math.max(0, product.total - product.sold)
      return {
        currentFlashPrice: product.flashPrice || product.price || '0đ',
        currentOriginalPrice: product.originalPrice || product.flashPrice || '0đ',
        stockAvailable: stockVal,
        currentVariantName: ''
      }
    }

    if (selectedRow) {
      const priceNum = parseFloat(String(selectedRow.price).replace(/[^0-9]/g, '')) || 0
      const origNum = selectedRow.originalPrice ? parseFloat(String(selectedRow.originalPrice).replace(/[^0-9]/g, '')) : 0
      const stockNum = parseInt(String(selectedRow.stock)) || 0
      return {
        currentFlashPrice: priceNum.toLocaleString('vi-VN') + 'đ',
        currentOriginalPrice: origNum > 0 ? origNum.toLocaleString('vi-VN') + 'đ' : priceNum.toLocaleString('vi-VN') + 'đ',
        stockAvailable: stockNum,
        currentVariantName: selectedRow.name || selectedRow.key || Object.values(selectedOptions).join(' - ')
      }
    }

    // Partially selected: calculate price range & filtered stock
    let matchingRows = rows
    const selectedEntries = Object.entries(selectedOptions).filter(([_, opt]) => Boolean(opt))
    if (selectedEntries.length > 0) {
      matchingRows = rows.filter((r) => {
        const parts = (r.name || r.key || '').split(/[-,\/]/).map((s: string) => s.trim().toLowerCase())
        return selectedEntries.every(([gIdx, optVal]) => {
          const idx = Number(gIdx)
          return parts[idx] === optVal.toLowerCase() || (r.name || r.key || '').toLowerCase().includes(optVal.toLowerCase())
        })
      })
    }

    const prices = matchingRows.map((r) => parseFloat(String(r.price).replace(/[^0-9]/g, '')) || 0).filter((p) => p > 0)
    const origPrices = matchingRows.map((r) => r.originalPrice ? parseFloat(String(r.originalPrice).replace(/[^0-9]/g, '')) : 0).filter((p) => p > 0)
    const totalStock = matchingRows.reduce((sum, r) => sum + (parseInt(String(r.stock)) || 0), 0)

    let flashPriceStr = product.flashPrice
    if (prices.length > 0) {
      const minP = Math.min(...prices)
      const maxP = Math.max(...prices)
      flashPriceStr = minP === maxP ? `${minP.toLocaleString('vi-VN')}đ` : `${minP.toLocaleString('vi-VN')}đ - ${maxP.toLocaleString('vi-VN')}đ`
    }

    let origPriceStr = product.originalPrice
    if (origPrices.length > 0) {
      const minOrig = Math.min(...origPrices)
      const maxOrig = Math.max(...origPrices)
      origPriceStr = minOrig === maxOrig ? `${minOrig.toLocaleString('vi-VN')}đ` : `${minOrig.toLocaleString('vi-VN')}đ - ${maxOrig.toLocaleString('vi-VN')}đ`
    }

    return {
      currentFlashPrice: flashPriceStr,
      currentOriginalPrice: origPriceStr,
      stockAvailable: totalStock,
      currentVariantName: ''
    }
  }, [product, selectedRow, selectedOptions])

  const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!product) return

    const groups = product.variationGroups || []
    if (groups.length > 0) {
      for (let i = 0; i < groups.length; i++) {
        if (!selectedOptions[i]) {
          alert(`Vui lòng chọn ${groups[i].name}!`)
          return
        }
      }
    }

    if (stockAvailable <= 0 || product.status === 'hidden') {
      alert('Sản phẩm với phân loại đã chọn hiện đã hết hàng, quý khách vui lòng chọn phân loại khác!')
      return
    }

    if (!user) {
      if (onRequireLogin) {
        onRequireLogin()
      } else {
        onOpenLogin()
      }
      return
    }

    const effectiveProduct = {
      ...product,
      price: currentFlashPrice,
      flashPrice: currentFlashPrice,
      originalPrice: currentOriginalPrice,
      stock: stockAvailable,
      image: selectedRow?.image || product.image
    }

    onAddToCart(effectiveProduct, quantity, currentVariantName)

    const rect = e.currentTarget.getBoundingClientRect()
    const cartIcon = document.getElementById('cart-icon')
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect()
      const startX = rect.left + rect.width / 2
      const startY = rect.top + rect.height / 2
      const endX = cartRect.left + cartRect.width / 2
      const endY = cartRect.top + cartRect.height / 2
      
      const newFlyingItem = {
        id: Date.now() + Math.random(),
        startX,
        startY,
        endX,
        endY,
        image: selectedRow?.image || product.image
      }

      setFlyingItems((prev) => [...prev, newFlyingItem])

      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((item) => item.id !== newFlyingItem.id))
      }, 800)
    }
  }

  const handleBuyNowClick = (prod: any, qty: number, variant: string) => {
    const stockVal = prod?.stock !== undefined ? prod.stock : (prod?.total !== undefined ? prod.total - (prod?.sold || 0) : 0)
    if (stockVal <= 0 || prod?.status === 'hidden') {
      alert('Sản phẩm này hiện đã hết hàng, quý khách vui lòng chọn sản phẩm khác!')
      return
    }

    if (!user) {
      if (onRequireLogin) {
        onRequireLogin()
      } else {
        onOpenLogin()
      }
      return
    }
    onBuyNow(prod, qty, variant)
  }

  const fetchReviews = async () => {
    if (!product) return
    setIsLoadingReviews(true)
    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}/reviews`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data)
    } catch (e) {
      console.error('Error fetching reviews:', e)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const fetchShopData = async () => {
    if (!product) return
    setIsLoadingShop(true)
    
    try {
      const shopRes = await fetch(`${API_BASE_URL}/auth/shops/${product.shopId}`)
      if (shopRes.ok) {
        const shopData = await shopRes.json()
        setShopDetails(shopData)
      } else {
        setShopDetails(null)
      }
    } catch (e) {
      console.error('Error fetching shop details:', e)
      setShopDetails(null)
    }

    try {
      const statsRes = await fetch(`${API_BASE_URL}/auth/shops/${product.shopId}/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setShopStats(statsData)
      } else {
        setShopStats({
          totalProducts: 0,
          totalReviews: 0
        })
      }
    } catch (e) {
      console.error('Error fetching shop stats:', e)
      setShopStats({
        totalProducts: 0,
        totalReviews: 0
      })
    }

    try {
      const followRes = await fetch(`${API_BASE_URL}/auth/shops/${product.shopId}/follow-status?userId=${user?.id || ''}`)
      if (followRes.ok) {
        const followData = await followRes.json()
        setFollowersCount(followData.count)
        setIsFollowing(followData.isFollowing)
      } else {
        throw new Error('Failed to fetch follow status')
      }
    } catch (e) {
      console.error('Error fetching follow status:', e)
      setFollowersCount(0)
      setIsFollowing(false)
    } finally {
      setIsLoadingShop(false)
    }
  }

  const fetchProductLikes = async () => {
    if (!product) return
    try {
      const res = await fetch(`${API_BASE_URL}/products/${product.id}/likes?userId=${user?.id || ''}`)
      if (res.ok) {
        const data = await res.json()
        setLikeCount(data.count)
        setIsLiked(data.isLiked)
      }
    } catch (e) {
      console.error('Error fetching product likes:', e)
    }
  }

  useEffect(() => {
    if (product) {
      fetchReviews()
      fetchShopData()
      fetchProductLikes()
    }
  }, [product])

  const handleToggleLike = async () => {
    if (!product) return
    if (!user) {
      if (onRequireLogin) onRequireLogin()
      else onOpenLogin()
      return
    }

    const newLikeState = !isLiked
    setIsLiked(newLikeState)
    setLikeCount((prev) => (newLikeState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const res = await fetch(`${API_BASE_URL}/products/${product.id}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        const data = await res.json()
        setIsLiked(data.isLiked)
        setLikeCount(data.count)
      }
    } catch (e) {
      console.error('Error toggling like:', e)
    }
  }

  const handleToggleFollow = async () => {
    if (!product) return
    if (!user) {
      if (onRequireLogin) onRequireLogin()
      else onOpenLogin()
      return
    }

    const newFollowState = !isFollowing
    setIsFollowing(newFollowState)
    setFollowersCount((prev) => (newFollowState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const res = await fetch(`${API_BASE_URL}/auth/shops/${product.shopId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
        setFollowersCount(data.count)
      }
    } catch (e) {
      console.error('Error toggling follow:', e)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    if (!reviewComment.trim()) return
    if (!user) {
      if (onRequireLogin) onRequireLogin()
      else onOpenLogin()
      return
    }

    setIsSubmittingReview(true)
    setReviewSuccessMsg('')

    try {
      const response = await fetch(`${API_BASE_URL}/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.name || user.email || 'Người dùng ZeroMall',
          rating: reviewRating,
          comment: reviewComment,
          variant: currentVariantName || 'Mặc định'
        })
      })

      if (!response.ok) throw new Error('Không thể gửi đánh giá')

      const newReview = await response.json()
      setReviews((prev) => [newReview, ...prev])
      setReviewComment('')
      setReviewSuccessMsg(' Cảm ơn bạn! Đánh giá đã được lưu trực tiếp vào cơ sở dữ liệu PostgreSQL.')
      
      setTimeout(() => {
        setReviewSuccessMsg('')
        setShowReviewForm(false)
      }, 2500)
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const getYouTubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const mediaItems: { type: 'image' | 'video'; url: string }[] = useMemo(() => {
    const items: { type: 'image' | 'video'; url: string }[] = []
    if (!product) return items

    if (product.video) {
      items.push({ type: 'video', url: product.video })
    }

    const addedUrls = new Set<string>()

    // 1. Toàn bộ hình ảnh chung của sản phẩm (ảnh bìa & ảnh chi tiết)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      product.images.forEach((imgUrl) => {
        if (typeof imgUrl === 'string' && imgUrl.trim() && !addedUrls.has(imgUrl.trim())) {
          items.push({ type: 'image', url: imgUrl.trim() })
          addedUrls.add(imgUrl.trim())
        }
      })
    }
    
    // Nếu ảnh đại diện chính chưa có trong danh sách images, bổ sung vào đầu
    if (product.image && typeof product.image === 'string' && product.image.trim() && !addedUrls.has(product.image.trim())) {
      items.unshift({ type: 'image', url: product.image.trim() })
      addedUrls.add(product.image.trim())
    }

    // 2. Hình ảnh của từng nhóm biến thể (chỉ khi có biến thể và chỉ lấy option còn tồn tại)
    if (product.hasVariations && product.variationGroups && Array.isArray(product.variationGroups)) {
      product.variationGroups.forEach((group: any) => {
        const gImages = group?.images || {}
        const validOptions = new Set((group?.options || []).map((o: string) => String(o).trim().toLowerCase()))
        Object.entries(gImages).forEach(([optName, imgUrl]: [string, any]) => {
          if (validOptions.has(optName.trim().toLowerCase()) && typeof imgUrl === 'string' && imgUrl.trim() && !addedUrls.has(imgUrl.trim())) {
            items.push({ type: 'image', url: imgUrl.trim() })
            addedUrls.add(imgUrl.trim())
          }
        })
      })
    }

    // 3. Hình ảnh của các dòng biến thể chi tiết
    if (product.hasVariations && product.variationRows && Array.isArray(product.variationRows)) {
      product.variationRows.forEach((r: any) => {
        if (r.image && typeof r.image === 'string' && r.image.trim() && !addedUrls.has(r.image.trim())) {
          items.push({ type: 'image', url: r.image.trim() })
          addedUrls.add(r.image.trim())
        }
      })
    }

    return items
  }, [product])

  const handleSelectOptionImage = (imageUrl: string) => {
    if (!imageUrl) return
    const targetIdx = mediaItems.findIndex((m) => m.url === imageUrl)
    if (targetIdx >= 0) {
      setActiveImgIdx(targetIdx)
    }
  }

  const isMall = Boolean(product?.brand && product.brand.toLowerCase() !== 'no brand' && product.brand !== '')

  const handleDecrease = () => setQuantity((prev) => Math.max(stockAvailable > 0 ? 1 : 0, prev - 1))
  const handleIncrease = () => setQuantity((prev) => Math.min(stockAvailable, prev + 1))

  const toggleSaveCoupon = (coupon: string) => {
    setSavedCoupons((prev) => ({
      ...prev,
      [coupon]: !prev[coupon]
    }))
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return product?.rating?.toFixed(1) || '5.0'
    const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0)
    return (totalStars / reviews.length).toFixed(1)
  }

  const averageRating = calculateAverageRating()

  const filteredReviews = reviews.filter((r) => {
    if (activeReviewFilter === 'all') return true
    if (activeReviewFilter === '5star') return r.rating === 5
    if (activeReviewFilter === '4star') return r.rating === 4
    if (activeReviewFilter === '3star') return r.rating === 3
    if (activeReviewFilter === '2star') return r.rating === 2
    if (activeReviewFilter === '1star') return r.rating === 1
    return true
  })

  const parseNumPrice = (val: any) => {
    if (!val) return 0
    return parseFloat(String(val).replace(/[^0-9]/g, '')) || 0
  }
  const origPriceVal = parseNumPrice(currentOriginalPrice)
  const flashPriceVal = parseNumPrice(currentFlashPrice)
  const discountPct = origPriceVal > flashPriceVal && origPriceVal > 0 
    ? Math.round(((origPriceVal - flashPriceVal) / origPriceVal) * 100) 
    : 0

  const formatCount = (num: any) => {
    if (!num || isNaN(num)) return '0'
    if (num < 1000) return num.toString()
    return (num / 1000).toFixed(1).replace('.0', '') + 'k'
  }

  const formatJoinDuration = (dateString: any) => {
    if (!dateString) return '3 năm'
    try {
      const created = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays < 30) return `${diffDays} ngày`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`
      return `${Math.floor(diffDays / 365)} năm`
    } catch (e) {
      return '3 năm'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    } catch (e) {
      return dateString
    }
  }

  if (loadingProduct) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/50 p-20 text-center shadow-3xs space-y-3">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-405 font-semibold">Đang tải chi tiết sản phẩm...</p>
      </div>
    )
  }

  const isProductOutOfStock = product ? (product.stock !== undefined ? product.stock <= 0 : (product.total - product.sold <= 0)) || product.status === 'hidden' : false

  if (!product || isProductOutOfStock) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/50 p-20 text-center shadow-3xs flex flex-col items-center gap-4.5">
        <span className="text-5xl">📦</span>
        <h4 className="font-extrabold text-slate-800 text-sm">
          {!product ? 'Không tìm thấy sản phẩm' : 'Sản phẩm này hiện đã hết hàng hoặc tạm ngừng kinh doanh'}
        </h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Sản phẩm bạn đang xem hiện không còn tồn kho trong gian hàng. Vui lòng tham khảo các sản phẩm khác trên sàn.
        </p>
        <button onClick={onBackToHome} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition duration-200 cursor-pointer">
          Trở về Trang chủ
        </button>
      </div>
    )
  }

  return (
    <div className="text-slate-800 text-left">
      {/* 1. Breadcrumbs */}
      <div className="text-xs text-slate-500 py-4 flex flex-wrap gap-1 items-center bg-[#f5f5f5] mb-2">
        <button onClick={onBackToHome} className="hover:text-[#ee4d2d] font-medium transition cursor-pointer">
          Trang chủ
        </button>
        <span>&gt;</span>
        <span className="hover:text-[#ee4d2d] cursor-pointer">{product.category || 'Danh mục'}</span>
        <span>&gt;</span>
        <span className="text-slate-700 truncate max-w-[300px] font-normal">{product.name}</span>
      </div>

      {/* 2. Main Product Info Area */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 flex flex-col lg:flex-row gap-8">
        <ProductGallery
          mediaItems={mediaItems}
          activeImgIdx={activeImgIdx}
          setActiveImgIdx={setActiveImgIdx}
          productName={product.name}
          isLiked={isLiked}
          likeCount={likeCount}
          handleToggleLike={handleToggleLike}
          getYouTubeId={getYouTubeId}
        />

        <ProductPurchasePanel
          product={product}
          isMall={isMall}
          averageRating={averageRating}
          reviewsCount={reviews.length}
          discountPct={discountPct}
          savedCoupons={savedCoupons}
          toggleSaveCoupon={toggleSaveCoupon}
          selectedOptions={selectedOptions}
          onSelectOption={handleSelectOption}
          selectedVariantName={currentVariantName}
          currentFlashPrice={currentFlashPrice}
          currentOriginalPrice={currentOriginalPrice}
          stockAvailable={stockAvailable}
          quantity={quantity}
          handleDecrease={handleDecrease}
          handleIncrease={handleIncrease}
          handleAddToCartClick={handleAddToCartClick}
          onBuyNow={handleBuyNowClick}
          onSelectOptionImage={handleSelectOptionImage}
          user={user}
          shopDetails={shopDetails}
        />
      </div>

      {/* 3. Shop Info Segment */}
      <ShopInfoCard
        product={product}
        isLoadingShop={isLoadingShop}
        shopDetails={shopDetails}
        shopStats={shopStats}
        isFollowing={isFollowing}
        followersCount={followersCount}
        handleToggleFollow={handleToggleFollow}
        onBackToHome={onBackToHome}
        formatCount={formatCount}
        formatJoinDuration={formatJoinDuration}
      />

      {/* 4. Product Details & Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-5">
        <div className="lg:col-span-3 space-y-5">
          <ProductDescriptionSection product={product} shopDetails={shopDetails} />

          <ProductReviewsSection
            user={user}
            onOpenLogin={onOpenLogin}
            showReviewForm={showReviewForm}
            setShowReviewForm={setShowReviewForm}
            reviewRating={reviewRating}
            setReviewRating={setReviewRating}
            reviewComment={reviewComment}
            setReviewComment={setReviewComment}
            isSubmittingReview={isSubmittingReview}
            reviewSuccessMsg={reviewSuccessMsg}
            handleReviewSubmit={handleReviewSubmit}
            averageRating={averageRating}
            reviews={reviews}
            activeReviewFilter={activeReviewFilter}
            setActiveReviewFilter={setActiveReviewFilter}
            isLoadingReviews={isLoadingReviews}
            filteredReviews={filteredReviews}
            formatDate={formatDate}
          />
        </div>

        <ShopTopProductsSidebar shopId={product?.shopId} currentProductId={product?.id} />
      </div>

      {/* Dynamic Flying Items Animation */}
      <style>{`
        @keyframes flyToCart {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          40% {
            opacity: 1;
            transform: translate(calc(var(--dx) * 0.45), calc(var(--dy) * 0.4 - 120px)) scale(0.8) rotate(180deg);
          }
          100% {
            transform: translate(var(--dx), var(--dy)) scale(0.15) rotate(360deg);
            opacity: 0.1;
          }
        }
      `}</style>
      
      {flyingItems.map((item) => (
        <div
          key={item.id}
          className="fixed w-10 h-10 rounded-full z-55 pointer-events-none border-2 border-emerald-500 bg-white overflow-hidden shadow-lg shadow-emerald-500/30"
          style={{
            left: item.startX - 20,
            top: item.startY - 20,
            backgroundImage: `url(${item.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'flyToCart 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
            '--dx': `${item.endX - item.startX}px`,
            '--dy': `${item.endY - item.startY}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
