import React, { useState, useEffect } from 'react'
import type { Product } from './FlashSale'

interface ProductDetailPageProps {
  product: Product
  user: any
  onBackToHome: () => void
  onAddToCart: (product: Product, quantity: number, variant: string) => void
  onBuyNow: (product: Product, quantity: number, variant: string) => void
  onOpenLogin: () => void
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  user,
  onBackToHome,
  onAddToCart,
  onBuyNow,
  onOpenLogin
}) => {
  const [selectedVariant, setSelectedVariant] = useState('')
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
  const [reviewName, setReviewName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('')

  // Load reviews from API
  const fetchReviews = async () => {
    setIsLoadingReviews(true)
    try {
      const response = await fetch(`http://localhost:3002/products/${product.id}/reviews`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data)
    } catch (e) {
      console.error('Error fetching reviews:', e)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  // Load shop details and stats from APIs
  const fetchShopData = async () => {
    setIsLoadingShop(true)
    try {
      // 1. Fetch shop details from auth-service
      const shopRes = await fetch(`http://localhost:3001/auth/shops/${product.shopId}`)
      if (shopRes.ok) {
        const shopData = await shopRes.json()
        setShopDetails(shopData)
      } else {
        throw new Error('Failed to fetch shop details')
      }

      // 2. Fetch shop stats from product-service
      const statsRes = await fetch(`http://localhost:3002/products/shops/${product.shopId}/stats`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setShopStats(statsData)
      } else {
        throw new Error('Failed to fetch shop stats')
      }

      // 3. Fetch follow status
      const followRes = await fetch(`http://localhost:3001/auth/shops/${product.shopId}/follow-status?userId=${user?.id || ''}`)
      if (followRes.ok) {
        const followData = await followRes.json()
        setFollowersCount(followData.count)
        setIsFollowing(followData.isFollowing)
      }
    } catch (e) {
      console.error('Error fetching shop data:', e)
      // Fallback default shop info
      setShopDetails({
        name: 'ZeroMall Official Store',
        responseRate: 98,
        responseTime: 'trong vài giờ',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 3).toISOString()
      })
      setShopStats({
        totalProducts: 120,
        totalReviews: 14500
      })
      setFollowersCount(25800)
      setIsFollowing(false)
    } finally {
      setIsLoadingShop(false)
    }
  }

  // Fetch product likes from API
  const fetchProductLikes = async () => {
    try {
      const res = await fetch(`http://localhost:3002/products/${product.id}/likes?userId=${user?.id || ''}`)
      if (res.ok) {
        const data = await res.json()
        setLikeCount(data.count)
        setIsLiked(data.isLiked)
      }
    } catch (e) {
      console.error('Error fetching product likes:', e)
    }
  }

  // Auto-initialize states and load reviews
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant('')
    }
    setQuantity(1)
    setActiveImgIdx(0)
    setReviewSuccessMsg('')
    setReviewComment('')
    setReviewRating(5)
    setShowReviewForm(false)
    
    // Auto-fill review name if user is logged in
    if (user && user.name) {
      setReviewName(user.name)
    } else {
      setReviewName('')
    }

    fetchReviews()
    fetchShopData()
    fetchProductLikes()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [product, user])

  // Get matching sub-images category-wise for visual richness
  const getSubImages = () => {
    if (product.images && product.images.length > 1) {
      return product.images
    }
    
    const categoryLower = (product.category || '').toLowerCase()
    
    // Fashion images mock
    if (categoryLower.includes('thời trang') || categoryLower.includes('quần áo') || categoryLower.includes('giày')) {
      return [
        product.image,
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
      ]
    }
    
    // House appliances mock
    if (categoryLower.includes('gia dụng') || categoryLower.includes('thiết bị') || categoryLower.includes('điện tử')) {
      return [
        product.image,
        'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&q=80',
        'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=500&q=80',
        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80',
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80',
      ]
    }

    // Default fallbacks
    return [
      product.image,
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
    ]
  }

  const subImages = getSubImages()
  const stockAvailable = product.total - product.sold
  
  // Calculate discount percentage
  const getDiscountPct = () => {
    try {
      const flash = parseFloat(product.flashPrice.replace(/[^\d]/g, ''))
      const orig = parseFloat(product.originalPrice.replace(/[^\d]/g, ''))
      if (orig > flash) {
        return Math.round((1 - flash / orig) * 100)
      }
    } catch (e) {
      // Ignored
    }
    return 15 // Default fallback
  }

  const discountPct = getDiscountPct()
  const isMall = parseFloat(product.flashPrice.replace(/[^\d]/g, '')) > 200000

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1)
  }

  const handleIncrease = () => {
    if (quantity < stockAvailable) setQuantity((prev) => prev + 1)
  }

  const handleToggleLike = async () => {
    if (!user) {
      onOpenLogin()
      return
    }
    try {
      const res = await fetch(`http://localhost:3002/products/${product.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        const data = await res.json()
        setLikeCount(data.count)
        setIsLiked(data.isLiked)
      }
    } catch (e) {
      console.error('Error toggling product like:', e)
    }
  }

  const handleToggleFollow = async () => {
    if (!user) {
      onOpenLogin()
      return
    }
    try {
      const res = await fetch(`http://localhost:3001/auth/shops/${product.shopId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        const data = await res.json()
        setFollowersCount(data.count)
        setIsFollowing(data.isFollowing)
      }
    } catch (e) {
      console.error('Error toggling shop follow:', e)
    }
  }

  const toggleSaveCoupon = (id: string) => {
    setSavedCoupons(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure reviewer name is from logged-in user if available
    const finalReviewName = user?.name || reviewName
    
    if (!finalReviewName.trim() || !reviewComment.trim()) {
      alert('Vui lòng điền đầy đủ nội dung Nhận xét!')
      return
    }

    setIsSubmittingReview(true)
    try {
      const response = await fetch(`http://localhost:3002/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: finalReviewName,
          rating: reviewRating,
          comment: reviewComment,
          variant: selectedVariant || 'Tiêu chuẩn'
        })
      })

      if (!response.ok) throw new Error('Failed to submit review')
      
      setReviewSuccessMsg('Gửi đánh giá thành công! Đánh giá đã được lưu vào database.')
      setReviewComment('')
      
      // Reload reviews list
      await fetchReviews()
      
      // Auto close form after 3 seconds
      setTimeout(() => {
        setReviewSuccessMsg('')
        setShowReviewForm(false)
      }, 3000)

    } catch (e) {
      console.error('Error submitting review:', e)
      alert('Có lỗi xảy ra khi gửi đánh giá!')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Calculate dynamic average rating based on database reviews
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8'

  // Filter reviews based on filter selection
  const filteredReviews = reviews.filter(review => {
    if (activeReviewFilter === 'all') return true
    if (activeReviewFilter === '5star') return review.rating === 5
    if (activeReviewFilter === '4star') return review.rating === 4
    if (activeReviewFilter === '3star') return review.rating === 3
    if (activeReviewFilter === '2star') return review.rating === 2
    if (activeReviewFilter === '1star') return review.rating === 1
    return true
  })

  // Format count to string with 'k' suffix if needed
  const formatCount = (num: number) => {
    if (num === undefined || num === null) return '0'
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return num.toString()
  }

  // Format join duration from date string
  const formatJoinDuration = (createdAtStr: string) => {
    if (!createdAtStr) return 'vừa tham gia'
    try {
      const created = new Date(createdAtStr)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 1) {
        return '1 ngày'
      }
      if (diffDays < 30) {
        return `${diffDays} ngày trước`
      }
      const diffMonths = Math.floor(diffDays / 30)
      if (diffMonths < 12) {
        return `${diffMonths} tháng trước`
      }
      const diffYears = Math.floor(diffMonths / 12)
      return `${diffYears} năm trước`
    } catch (e) {
      return 'vừa tham gia'
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString)
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    } catch (e) {
      return dateString
    }
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
        
        {/* Left Side: Images & Socials */}
        <div className="w-full lg:w-[42%] shrink-0 space-y-4">
          {/* Main Large Image */}
          <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-2xs relative">
            <img
              src={subImages[activeImgIdx]}
              alt={product.name}
              className="w-full h-full object-cover transition duration-300"
            />
          </div>

          {/* Thumbnails Row */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
            {subImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIdx(idx)}
                className={`w-[72px] h-[72px] shrink-0 border-2 rounded-lg overflow-hidden transition cursor-pointer ${
                  idx === activeImgIdx ? 'border-[#ee4d2d]' : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>

          {/* Social Share & Likes */}
          <div className="flex justify-between items-center pt-2 text-xs text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-medium">Chia sẻ:</span>
              <div className="flex gap-1.5 text-base">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">f</span>
                <span className="w-6 h-6 bg-sky-400 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">t</span>
                <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">p</span>
                <span className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">💬</span>
              </div>
            </div>
            <button
              onClick={handleToggleLike}
              className="flex items-center gap-1.5 hover:opacity-85 transition cursor-pointer font-medium"
            >
              <span className={`text-base ${isLiked ? 'text-red-500 scale-110' : 'text-slate-300'} transition`}>
                ♥
              </span>
              <span>Đã thích ({likeCount})</span>
            </button>
          </div>
        </div>

        {/* Right Side: Purchase Details */}
        <div className="flex-1 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            
            {/* Title & Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                {isMall ? (
                  <span className="bg-[#ee4d2d] text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wide">
                    Mall
                  </span>
                ) : (
                  <span className="bg-[#ee4d2d] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    Yêu thích+
                  </span>
                )}
                <span className="text-[10px] text-red-500 border border-red-500/35 px-2 rounded-sm font-semibold bg-red-50/20">
                  Freeship Xtra
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Ratings, Reviews & Sales Metrics */}
            <div className="flex items-center gap-4 text-xs divide-x divide-slate-200 text-slate-500 py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[#ee4d2d] font-bold underline text-sm">{averageRating}</span>
                <div className="flex text-yellow-500 text-xs">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
              <div className="pl-4">
                <span className="font-bold underline text-slate-800">{reviews.length}</span> Đánh Giá
              </div>
              <div className="pl-4">
                <span className="font-bold text-slate-800">{product.sold || 142}</span> Đã Bán
              </div>
            </div>

            {/* Price Segment (Prominent background block) */}
            <div className="bg-[#fafafa] p-5 rounded-xl flex items-center gap-5 flex-wrap">
              <span className="text-slate-400 line-through text-sm">{product.originalPrice}</span>
              <span className="text-3xl font-black text-[#ee4d2d]">{product.flashPrice}</span>
              <span className="bg-[#ee4d2d]/10 text-[#ee4d2d] text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                {discountPct}% GIẢM
              </span>
            </div>

            {/* Shop Coupons / Vouchers */}
            <div className="text-xs flex gap-4 items-center">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Mã Giảm Giá Shop</span>
              <div className="flex flex-wrap gap-2">
                {['Mã GIẢM 15K', 'Mã GIẢM 30K', 'GIẢM 10%'].map((coupon) => {
                  const isSaved = !!savedCoupons[coupon];
                  return (
                    <button
                      key={coupon}
                      onClick={() => toggleSaveCoupon(coupon)}
                      className={`px-3 py-1 rounded-sm border font-semibold transition cursor-pointer text-[10px] ${
                        isSaved
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-[#feeee9] border-[#ee4d2d]/30 text-[#ee4d2d] hover:bg-[#fdede7]'
                      }`}
                    >
                      {isSaved ? '✓ Đã lưu' : coupon}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Shipping details */}
            <div className="text-xs flex gap-4 items-start border-t border-b border-slate-100 py-3.5">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Vận Chuyển</span>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="text-lg">🚚</span>
                  <div>
                    <p className="font-bold">Miễn Phí Vận Chuyển</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Miễn phí vận chuyển cho đơn hàng từ 99.000đ</p>
                  </div>
                </div>
                <div className="flex gap-4 text-slate-500 pl-7">
                  <span className="w-16">Vận chuyển tới</span>
                  <span className="font-semibold text-slate-700">Quận Ba Đình, Hà Nội</span>
                </div>
                <div className="flex gap-4 text-slate-500 pl-7">
                  <span className="w-16">Phí vận chuyển</span>
                  <span className="font-semibold text-slate-700">0đ - 15.000đ</span>
                </div>
              </div>
            </div>

            {/* Product Variation Options */}
            {product.variants && product.variants.length > 0 && (
              <div className="text-xs flex gap-4 items-center py-1">
                <span className="text-slate-400 w-24 shrink-0 font-medium">Phân Loại</span>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 border rounded-sm font-semibold cursor-pointer text-slate-700 transition ${
                        selectedVariant === v
                          ? 'border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9]/30 shadow-3xs'
                          : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="text-xs flex gap-4 items-center">
              <span className="text-slate-400 w-24 shrink-0 font-medium">Số Lượng</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-sm overflow-hidden bg-slate-50">
                  <button
                    onClick={handleDecrease}
                    className="w-8 h-8 flex items-center justify-center border-r border-slate-200 hover:bg-slate-100 font-bold cursor-pointer select-none text-base"
                  >
                    -
                  </button>
                  <span className="w-12 h-8 flex items-center justify-center font-bold text-slate-800 select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrease}
                    className="w-8 h-8 flex items-center justify-center border-l border-slate-200 hover:bg-slate-100 font-bold cursor-pointer select-none text-base"
                  >
                    +
                  </button>
                </div>
                <span className="text-slate-400 font-medium">
                  {stockAvailable} sản phẩm có sẵn
                </span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-100 flex-wrap">
            <button
              onClick={() => onAddToCart(product, quantity, selectedVariant)}
              className="flex-1 min-w-[200px] py-3.5 px-6 border border-[#ee4d2d] text-[#ee4d2d] bg-[#feeee9] hover:bg-[#fdede7] font-bold rounded-sm text-sm flex items-center justify-center gap-2.5 transition cursor-pointer shadow-3xs"
            >
              <span className="text-lg">🛒</span> Thêm Vào Giỏ Hàng
            </button>
            
            <button
              onClick={() => onBuyNow(product, quantity, selectedVariant)}
              className="flex-1 min-w-[200px] py-3.5 px-6 bg-[#ee4d2d] hover:bg-[#f05d40] text-white font-bold rounded-sm text-sm flex items-center justify-center gap-1 transition cursor-pointer shadow-md"
            >
              Mua Ngay
            </button>
          </div>

        </div>
      </div>

      {/* 3. Shop Info Segment */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 flex flex-col md:flex-row gap-6 mt-5 items-center">
        {/* Shop Avatar & Buttons */}
        <div className="flex gap-4 items-center pr-6 md:border-r border-slate-100 w-full md:w-auto shrink-0 justify-between md:justify-start">
          <div className="flex gap-3.5 items-center">
            <div className="w-[60px] h-[60px] rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
              <img
                src={product.category?.toLowerCase().includes('gia dụng') || product.category?.toLowerCase().includes('thiết bị') || product.category?.toLowerCase().includes('nhà cửa')
                  ? 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=120&q=80'
                  : 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=120&q=80'}
                alt="Shop Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isLoadingShop ? 'Đang tải...' : (shopDetails?.name || 'ZeroMall Store')}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span> Online 5 phút trước
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5 text-[11px]">
            <button className="px-3 py-1.5 border border-[#ee4d2d]/30 text-[#ee4d2d] bg-[#feeee9]/25 hover:bg-[#feeee9]/55 font-bold rounded-sm cursor-pointer transition">
              💬 Chat Ngay
            </button>
            <button
              onClick={handleToggleFollow}
              className={`px-3 py-1.5 border rounded-sm font-bold cursor-pointer transition ${
                isFollowing
                  ? 'border-emerald-600/30 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40'
                  : 'border-[#ee4d2d]/30 text-[#ee4d2d] bg-[#feeee9]/25 hover:bg-[#feeee9]/55'
              }`}
            >
              {isFollowing ? '✓ Đang Theo Dõi' : '➕ Theo Dõi'}
            </button>
            <button onClick={onBackToHome} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-sm cursor-pointer transition">
              🏠 Xem Shop
            </button>
          </div>
        </div>

        {/* Shop Statistics grid */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-xs text-slate-500 w-full">
          <div className="flex justify-between">
            <span>Đánh Giá</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : formatCount(shopStats?.totalReviews)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tỉ Lệ Phản Hồi</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : `${shopDetails?.responseRate ?? 100}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tham Gia</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : formatJoinDuration(shopDetails?.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Sản Phẩm</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : (shopStats?.totalProducts ?? 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Thời Gian Phản Hồi</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : (shopDetails?.responseTime ?? 'trong vài giờ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Người Theo Dõi</span>
            <span className="font-bold text-[#ee4d2d]">
              {isLoadingShop ? '...' : formatCount(followersCount)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Product Details & Description Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-5">
        
        {/* Left 3/4 Column: Specs & Description */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Attributes Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
              Chi Tiết Sản Phẩm
            </h2>
            <div className="space-y-3.5 text-xs text-slate-500 pt-1">
              <div className="flex">
                <span className="w-32 shrink-0 font-medium">Danh Mục</span>
                <span className="text-slate-800">{product.category}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-medium">Thương hiệu</span>
                <span className="text-slate-[#ee4d2d] font-bold">{product.brand || 'No Brand'}</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-medium">Hạn bảo hành</span>
                <span className="text-slate-800">12 tháng</span>
              </div>
              <div className="flex">
                <span className="w-32 shrink-0 font-medium">Gửi từ</span>
                <span className="text-slate-800">Quận Ba Đình, Hà Nội</span>
              </div>
            </div>
          </div>

          {/* Detailed text description */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
              Mô Tả Sản Phẩm
            </h2>
            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-2 pt-1 font-normal">
              {product.description || 'Không có mô tả sản phẩm chi tiết.'}
            </div>
          </div>

          {/* 5. Product Reviews Section */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Đánh Giá Sản Phẩm (Dữ liệu PostgreSQL thật)
              </h2>
              {user ? (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-[#ee4d2d] hover:bg-[#f05d40] text-white text-[11px] font-bold px-3 py-1.5 rounded-sm transition cursor-pointer shadow-3xs"
                >
                  {showReviewForm ? '✕ Đóng Khung Viết' : '✍ Viết Đánh Giá Mới'}
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Bạn cần{' '}
                  <button
                    onClick={onOpenLogin}
                    className="text-[#ee4d2d] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                  >
                    đăng nhập
                  </button>{' '}
                  để đánh giá sản phẩm.
                </span>
              )}
            </div>
            
            {/* Collapse Write Review Form */}
            {showReviewForm && user && (
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
                <h3 className="font-bold text-slate-700 text-xs">✍ Đánh Giá Sản Phẩm Của Bạn</h3>
                
                {reviewSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-2.5 rounded-lg text-xs font-bold">
                    {reviewSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Người Đánh Giá</label>
                    <div className="w-full border border-slate-200 bg-slate-100/70 rounded-sm px-3 py-2 text-xs text-slate-700 font-bold select-none">
                      {user?.name} ({user?.email})
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Số Sao Đánh Giá</label>
                    <div className="flex gap-2 items-center h-8">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-xl focus:outline-none transition ${
                            star <= reviewRating ? 'text-yellow-500 scale-105' : 'text-slate-300 hover:text-yellow-400'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="text-xs text-slate-400 font-bold ml-2">({reviewRating} Sao)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">Bình Luận / Nhận Xét</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Viết cảm nhận của bạn về sản phẩm..."
                    rows={3}
                    className="w-full border border-slate-350 bg-white rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#ee4d2d]"
                    required
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-[#ee4d2d] hover:bg-[#f05d40] disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-sm transition cursor-pointer shadow-sm"
                  >
                    {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Lên Database'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Rating Summary Dashboard */}
            <div className="bg-[#fffdfb] border border-[#f8eae0] p-5 rounded-xl flex flex-col md:flex-row gap-6 items-center">
              <div className="text-center md:border-r border-[#f8eae0] md:pr-10 shrink-0">
                <h3 className="text-2xl font-black text-[#ee4d2d] flex items-baseline justify-center gap-1">
                  {averageRating} <span className="text-xs font-semibold text-slate-400">trên 5</span>
                </h3>
                <div className="flex text-yellow-500 justify-center text-sm mt-1 mb-1.5">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>
              
              {/* Filter Chips */}
              <div className="flex-1 flex flex-wrap gap-2 text-xs">
                {[
                  { id: 'all', label: `Tất Cả (${reviews.length})` },
                  { id: '5star', label: `5 Sao (${reviews.filter(r => r.rating === 5).length})` },
                  { id: '4star', label: `4 Sao (${reviews.filter(r => r.rating === 4).length})` },
                  { id: '3star', label: `3 Sao (${reviews.filter(r => r.rating === 3).length})` },
                  { id: '2star', label: `2 Sao (${reviews.filter(r => r.rating === 2).length})` },
                  { id: '1star', label: `1 Sao (${reviews.filter(r => r.rating === 1).length})` },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveReviewFilter(filter.id)}
                    className={`px-4 py-2 border rounded-sm transition cursor-pointer font-medium ${
                      activeReviewFilter === filter.id
                        ? 'border-[#ee4d2d] text-[#ee4d2d] bg-white shadow-3xs'
                        : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews list */}
            <div className="divide-y divide-slate-100">
              {isLoadingReviews ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  🔄 Đang tải các nhận xét từ database...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  Không tìm thấy đánh giá nào trùng khớp trong database.
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.id} className="py-5 flex gap-4 items-start text-xs">
                    {/* User Avatar mock based on name */}
                    <div className="w-[32px] h-[32px] rounded-full border border-slate-150 overflow-hidden shrink-0 bg-[#ee4d2d]/10 text-[#ee4d2d] flex items-center justify-center font-bold text-xs uppercase">
                      {review.username.slice(0, 1)}
                    </div>
                    
                    {/* Review Content */}
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <p className="font-bold text-slate-700">{review.username}</p>
                        <div className="flex text-yellow-500 text-[10px] mt-0.5">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-[10px] flex gap-2">
                        <span>{formatDate(review.createdAt)}</span>
                        <span>|</span>
                        <span>Phân loại: {review.variant || 'Mặc định'}</span>
                      </p>
                      
                      <p className="text-slate-700 leading-relaxed font-normal">{review.comment}</p>
                      
                      {/* Shop Reply (if any exists in db) */}
                      {review.reply ? (
                        <div className="bg-[#f5f5f5] p-3.5 rounded-lg border-l-2 border-[#ee4d2d] space-y-1 mt-2.5">
                          <p className="font-bold text-slate-800">Phản Hồi Của Người Bán</p>
                          <p className="text-slate-600 leading-relaxed font-normal">{review.reply}</p>
                        </div>
                      ) : (
                        <div className="bg-[#f8f8f8] p-3 rounded-lg border-l-2 border-slate-300 space-y-1 mt-2.5">
                          <p className="font-bold text-slate-400">Hệ Thống Phản Hồi Tự Động</p>
                          <p className="text-slate-500 italic font-normal">Cảm ơn bạn đã tin tưởng mua sắm và dành thời gian đánh giá 5 sao cho ZeroMall nhé!</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

        {/* Right 1/4 Column: Shop Top Products list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
              Top sản phẩm bán chạy
            </h3>
            
            <div className="space-y-4">
              {[
                {
                  id: 'top-1',
                  name: 'Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn',
                  price: '250.000đ',
                  img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80'
                },
                {
                  id: 'top-2',
                  name: 'Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi',
                  price: '1.850.000đ',
                  img: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=200&q=80'
                },
                {
                  id: 'top-3',
                  name: 'Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp',
                  price: '450.000đ',
                  img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80'
                }
              ].map((topProd) => (
                <div key={topProd.id} className="flex gap-3 items-center group cursor-pointer">
                  <div className="w-12 h-12 rounded-lg border border-slate-150 overflow-hidden shrink-0 bg-slate-50">
                    <img src={topProd.img} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="font-semibold text-slate-700 line-clamp-1 group-hover:text-[#ee4d2d] transition">{topProd.name}</p>
                    <p className="font-bold text-[#ee4d2d]">{topProd.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
