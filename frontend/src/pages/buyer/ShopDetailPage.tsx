import React, { useState, useEffect, useMemo } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toSlug } from '../../utils/slug'

interface Product {
  id: string
  name: string
  price: string | number
  flashPrice?: string
  originalPrice?: string | number
  image?: string
  images?: string
  category?: string
  rating?: number
  sales?: number
  sold?: number
  stock?: number
  brand?: string
  shopId?: string
}

interface ShopDetails {
  id: string
  name: string
  logo?: string
  description?: string
  responseRate?: number
  responseTime?: string
  status?: string
  email?: string
  phoneNumber?: string
  pickupAddress?: string
  createdAt?: string
  followers?: number
}

interface ShopDetailPageProps {
  user?: any
  allProducts?: any[]
}

export const ShopDetailPage: React.FC<ShopDetailPageProps> = ({ user, allProducts: propsProducts }) => {
  const { shopId } = useParams<{ shopId: string }>()
  const navigate = useNavigate()

  const targetShopId = shopId || '6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c'

  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null)
  const [shopProducts, setShopProducts] = useState<Product[]>([])
  const [shopStats, setShopStats] = useState<any>(null)
  const [dbVouchers, setDbVouchers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'ALL' | 'BEST' | 'VOUCHERS' | 'ABOUT'>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'NEWEST' | 'SALES' | 'PRICE_ASC' | 'PRICE_DESC'>('NEWEST')
  const [searchTerm, setSearchTerm] = useState('')
  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, boolean>>({})

  // 1. Fetch Shop Details & Products
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const fetchShopInfo = async () => {
      try {
        // Fetch Shop Info
        const shopRes = await fetch(`${API_BASE_URL}/auth/shops/${targetShopId}`)
        if (shopRes.ok) {
          const sData = await shopRes.json()
          if (isMounted) {
            setShopDetails(sData)
            setFollowersCount(sData.followers ?? 0)
          }
        } else {
          if (isMounted) {
            setShopDetails(null)
            setFollowersCount(0)
          }
        }

        // Fetch Shop Products
        const prodRes = await fetch(`${API_BASE_URL}/products?shopId=${targetShopId}`)
        if (prodRes.ok) {
          const pData = await prodRes.json()
          if (isMounted && Array.isArray(pData)) {
            const formatted = pData.map((p: any) => {
              const parseNum = (val: any) => {
                if (!val) return 0
                if (typeof val === 'number') return val
                return parseInt(String(val).replace(/\D/g, ''), 10) || 0
              }
              const origNum = parseNum(p.originalPrice || p.price)
              const priceNum = parseNum(p.price)
              const originalPriceStr = origNum > priceNum ? origNum.toLocaleString('vi-VN') + 'đ' : (priceNum > 0 ? (priceNum * 1.2).toLocaleString('vi-VN') + 'đ' : '0đ')
              const flashPriceStr = priceNum.toLocaleString('vi-VN') + 'đ'

              return {
                id: p.id,
                name: p.name,
                originalPrice: originalPriceStr,
                flashPrice: flashPriceStr,
                price: flashPriceStr,
                image: p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                sold: p.sales || p.sold || 0,
                sales: p.sales || p.sold || 0,
                rating: p.rating && p.rating > 0 ? p.rating : 5.0,
                category: p.category,
                shopId: p.shopId
              }
            })
            setShopProducts(formatted)
          }
        } else if (propsProducts && propsProducts.length > 0) {
          if (isMounted) {
            setShopProducts(propsProducts.filter((p: any) => p.shopId === targetShopId || !p.shopId))
          }
        }

        // Fetch Shop Stats
        const statsRes = await fetch(`${API_BASE_URL}/products/shops/${targetShopId}/stats`)
        if (statsRes.ok && isMounted) {
          const statsData = await statsRes.json()
          setShopStats(statsData)
        }

        // Fetch Real Shop Vouchers from discount-service CSDL
        try {
          const voucherRes = await fetch(`${API_BASE_URL}/discounts/active?shopId=${targetShopId}`)
          if (voucherRes.ok && isMounted) {
            const vData = await voucherRes.json()
            if (Array.isArray(vData)) {
              setDbVouchers(vData)
            }
          }
        } catch (ve) {
          console.warn('Could not fetch shop vouchers:', ve)
        }

        // Fetch Follow Status & Real Follower Count
        try {
          const followRes = await fetch(`${API_BASE_URL}/auth/shops/${targetShopId}/follow-status?userId=${user?.id || ''}`)
          if (followRes.ok && isMounted) {
            const fData = await followRes.json()
            setIsFollowing(!!fData.isFollowing)
            if (typeof fData.count === 'number') {
              setFollowersCount(fData.count)
            }
          }
        } catch (fe) {
          console.warn('Could not fetch follow status:', fe)
        }
      } catch (err) {
        console.error('Error fetching shop detail page data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchShopInfo()
    return () => {
      isMounted = false
    }
  }, [targetShopId, user])

  // Handle follow toggle
  const handleToggleFollow = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để theo dõi gian hàng này!')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/shops/${targetShopId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      if (res.ok) {
        const data = await res.json()
        setIsFollowing(data.isFollowing)
        setFollowersCount(prev => data.isFollowing ? prev + 1 : Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
    }
  }

  // Shop Categories list computed from shop products
  const shopCategories = useMemo(() => {
    const set = new Set<string>()
    shopProducts.forEach(p => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set)
  }, [shopProducts])

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = [...shopProducts]

    // Tab filter
    if (activeTab === 'BEST') {
      list = list.sort((a, b) => (b.sold || 0) - (a.sold || 0))
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(p => p.category === selectedCategory)
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(term))
    }

    // Sorting
    return list.sort((a, b) => {
      const parsePriceNum = (val: any) => {
        if (typeof val === 'number') return val
        if (!val) return 0
        const digits = String(val).replace(/\D/g, '')
        return parseInt(digits, 10) || 0
      }

      if (sortBy === 'PRICE_ASC') return parsePriceNum(a.price) - parsePriceNum(b.price)
      if (sortBy === 'PRICE_DESC') return parsePriceNum(b.price) - parsePriceNum(a.price)
      if (sortBy === 'SALES') return (b.sold || 0) - (a.sold || 0)
      return 0
    })
  }, [shopProducts, activeTab, selectedCategory, searchTerm, sortBy])

  // Format Helper
  const formatJoinTime = (dateStr?: string) => {
    if (!dateStr) return 'Mới tham gia'
    const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'Hôm nay'
    if (diffDays < 30) return `${diffDays} ngày trước`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
    return `${(diffDays / 365).toFixed(1)} năm trước`
  }



  const shopProvince = useMemo(() => {
    if (!shopDetails?.pickupAddress) return ''
    try {
      const pickup = typeof shopDetails.pickupAddress === 'string'
        ? JSON.parse(shopDetails.pickupAddress)
        : shopDetails.pickupAddress
      return pickup.province || ''
    } catch {
      return ''
    }
  }, [shopDetails?.pickupAddress])

  const handleClaimVoucher = (vId: string) => {
    setClaimedVouchers(prev => ({ ...prev, [vId]: true }))
  }

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/" className="hover:text-emerald-600 transition flex items-center gap-1 font-bold">
          <span>🏠</span> Trang Chủ
        </Link>
        <span>/</span>
        <span className="text-slate-400 font-semibold">Gian Hàng Người Bán</span>
        <span>/</span>
        <span className="font-extrabold text-emerald-700">{shopDetails?.name || 'ZeroMall Store'}</span>
      </nav>

      {/* Shopee Style Shop Header Cover Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        {/* Background Overlay Graphic */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Shop Avatar & Meta Info Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 w-full lg:w-auto">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-md">
                {shopDetails?.logo ? (
                  <img
                    src={shopDetails.logo}
                    alt={shopDetails?.name || 'Shop Logo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(shopDetails?.name || 'Z').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-white text-[9px] font-black rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap ${
                (shopStats?.totalReviews ?? 0) >= 10 && (shopStats?.averageRating ?? 0) >= 4.5
                  ? 'bg-rose-600'
                  : (shopStats?.totalReviews ?? 0) === 0
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600'
              }`}>
                {(shopStats?.totalReviews ?? 0) >= 10 && (shopStats?.averageRating ?? 0) >= 4.5
                  ? 'Yêu Thích+'
                  : (shopStats?.totalReviews ?? 0) === 0
                  ? 'Shop Mới'
                  : 'Chính Hãng'}
              </span>
            </div>

            <div className="space-y-1.5 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                {shopDetails?.name || 'ZeroMall Store'}
              </h1>
              <p className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Đang hoạt động</span>
                <span className="text-white/40">•</span>
                <span className="text-slate-300 font-semibold">Chính hãng 100%</span>
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5 ${
                    isFollowing
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-white hover:bg-emerald-50 text-emerald-700 font-black'
                  }`}
                >
                  {isFollowing ? '✓ Đang Theo Dõi' : '➕ Theo Dõi Shop'}
                </button>

                <button
                  onClick={() => {
                    const targetId = shopDetails?.id || shopId || 'zeromall-official';
                    const targetName = shopDetails?.name || 'ZeroMall Shop';
                    window.dispatchEvent(
                      new CustomEvent('open_chat_with_shop', {
                        detail: { shopId: targetId, shopName: targetName },
                      })
                    );
                  }}
                  className="px-4 py-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold rounded-xl backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>💬</span> Chat Ngay
                </button>
              </div>
            </div>
          </div>

          {/* Shop Statistics Grid (100% Dynamic from Database) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs w-full lg:w-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">📦 Sản Phẩm</span>
              <p className="text-base font-black text-emerald-400">{shopStats?.totalProducts ?? shopProducts.length}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">👥 Người Theo Dõi</span>
              <p className="text-base font-black text-amber-400">
                {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">⭐ Đánh Giá</span>
              <p className="text-base font-black text-yellow-300">
                {(shopStats?.totalReviews ?? 0) > 0 ? (
                  <>
                    {shopStats.averageRating || '5.0'}{' '}
                    <span className="text-[10px] font-medium text-slate-300">({shopStats.totalReviews})</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-slate-300">Chưa có đánh giá</span>
                )}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">💬 Tỉ Lệ Phản Hồi</span>
              <p className="text-base font-black text-emerald-400">
                {shopDetails?.responseRate != null ? `${shopDetails.responseRate}%` : 'Chưa có dữ liệu'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">⏱️ Thời Gian Phản Hồi</span>
              <p className="text-xs font-bold text-slate-200 mt-1">{shopDetails?.responseTime || 'Trong vài giờ'}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">🗓️ Tham Gia</span>
              <p className="text-xs font-bold text-slate-200 mt-1">{formatJoinTime(shopDetails?.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Vouchers Row (Rendered ONLY if shop has vouchers in DB) */}
      {dbVouchers.length > 0 && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-3xs space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏷️</span> Mã Giảm Giá Của Gian Hàng
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {dbVouchers.map(v => {
              const isClaimed = claimedVouchers[v.id]
              const labelStr = v.type === 'percentage' ? `Giảm ${v.value}%` : `Giảm ${v.value?.toLocaleString('vi-VN')}đ`
              const minSpendStr = `Đơn tối thiểu ${v.minSpend?.toLocaleString('vi-VN')}đ`

              return (
                <div
                  key={v.id}
                  className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200/80 rounded-2xl p-3.5 flex justify-between items-center gap-3 relative overflow-hidden"
                >
                  <div className="space-y-0.5">
                    <p className="font-black text-rose-700 text-xs">{labelStr}</p>
                    <p className="text-[10px] font-bold text-slate-600">{minSpendStr}</p>
                    <p className="text-[9px] font-semibold text-slate-400 font-mono">Mã: {v.code}</p>
                  </div>

                  <button
                    onClick={() => handleClaimVoucher(v.id)}
                    disabled={isClaimed}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 shadow-3xs ${
                      isClaimed
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {isClaimed ? 'Đã Lưu' : 'Lưu Mã'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-1.5 flex gap-1 shadow-3xs overflow-x-auto">
        {[
          { id: 'ALL', label: '🛒 Tất Cả Sản Phẩm', count: shopProducts.length },
          { id: 'BEST', label: '🔥 Bán Chạy Nhất', count: null },
          { id: 'VOUCHERS', label: '🏷️ Mã Giảm Giá', count: dbVouchers.length },
          { id: 'ABOUT', label: '📋 Giới Thiệu Shop', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] py-2.5 px-4 text-xs font-extrabold rounded-xl transition cursor-pointer text-center select-none flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'ABOUT' ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-3xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
            📋 Thông Tin Chi Tiết Gian Hàng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase text-emerald-700">📌 Thông tin liên hệ</h4>
              <p><span className="font-bold text-slate-500">Tên gian hàng:</span> {shopDetails?.name}</p>
              <p><span className="font-bold text-slate-500">Email:</span> {shopDetails?.email || 'Chưa cập nhật'}</p>
              <p><span className="font-bold text-slate-500">Số điện thoại:</span> {shopDetails?.phoneNumber || 'Chưa cập nhật'}</p>
              <p><span className="font-bold text-slate-500">Trạng thái xác minh:</span> <span className="text-emerald-600 font-extrabold">Đã xác minh chính hãng</span></p>
            </div>

            <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase text-emerald-700">🚚 Chính sách vận chuyển & Kho</h4>
              <p>
                <span className="font-bold text-slate-500">Địa chỉ kho lấy hàng:</span>{' '}
                {(() => {
                  if (!shopDetails?.pickupAddress) return 'Chưa cập nhật địa chỉ kho'
                  try {
                    const p = typeof shopDetails.pickupAddress === 'string' ? JSON.parse(shopDetails.pickupAddress) : shopDetails.pickupAddress
                    const addr = [p.detailAddress, p.ward, p.district, p.province].filter(Boolean).join(', ')
                    return addr || 'Chưa cập nhật địa chỉ kho'
                  } catch {
                    return typeof shopDetails.pickupAddress === 'string' ? shopDetails.pickupAddress : 'Chưa cập nhật địa chỉ kho'
                  }
                })()}
              </p>
              <p><span className="font-bold text-slate-500">Đơn vị vận chuyển:</span> Giao Hàng Nhanh (GHN), Hỏa Tốc</p>
              <p><span className="font-bold text-slate-500">Thời gian chuẩn bị hàng:</span> Trong 24 giờ</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'VOUCHERS' ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-3xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
            🏷️ Mã Giảm Giá Gian Hàng ({dbVouchers.length})
          </h3>

          {dbVouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dbVouchers.map(v => {
                const labelStr = v.type === 'percentage' ? `Giảm ${v.value}%` : `Giảm ${v.value?.toLocaleString('vi-VN')}đ`
                const minSpendStr = `Đơn tối thiểu ${v.minSpend?.toLocaleString('vi-VN')}đ`
                return (
                  <div key={v.id} className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white font-mono font-bold text-[10px] rounded-md">
                      {v.code}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-sm">{labelStr}</h4>
                    <p className="text-xs text-slate-600">{minSpendStr}</p>
                    <p className="text-[10px] text-slate-400 font-bold">Hạn dùng: {new Date(v.endDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2 text-slate-400">
              <span className="text-3xl">🏷️</span>
              <p className="text-xs font-bold text-slate-600">Gian hàng hiện chưa phát hành mã giảm giá nào trong CSDL</p>
              <p className="text-[11px]">Người bán có thể tạo mã ưu đãi mới tại Kênh Người Bán (Quản lý Voucher).</p>
            </div>
          )}
        </div>
      ) : (
        /* ALL or BEST products view */
        <div className="space-y-5">
          {/* Controls & Filter Bar */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            
            {/* Search inside shop */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Tìm sản phẩm trong gian hàng ${shopDetails?.name || ''}...`}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter dropdown */}
            {shopCategories.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">Danh mục:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="all">Tất cả danh mục ({shopProducts.length})</option>
                  {shopCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
              {[
                { id: 'NEWEST', label: 'Mới nhất' },
                { id: 'SALES', label: 'Bán chạy' },
                { id: 'PRICE_ASC', label: 'Giá thấp ➔ cao' },
                { id: 'PRICE_DESC', label: 'Giá cao ➔ thấp' }
              ].map(sort => (
                <button
                  key={sort.id}
                  onClick={() => setSortBy(sort.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer select-none ${
                    sortBy === sort.id
                      ? 'bg-white text-emerald-700 shadow-3xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200/60">
              <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách sản phẩm gian hàng...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map(p => {
                const productSlug = toSlug(p.name)
                const parsePriceNum = (val: any) => {
                  if (typeof val === 'number') return val
                  if (!val) return 0
                  const digits = String(val).replace(/\D/g, '')
                  return parseInt(digits, 10) || 0
                }

                const origVal = parsePriceNum(p.originalPrice)
                const displayPriceStr = p.flashPrice || (typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') + 'đ' : String(p.price || '0đ'))
                const currentPriceVal = parsePriceNum(displayPriceStr)

                const discountPct = origVal > currentPriceVal && origVal > 0 ? Math.round((1 - currentPriceVal / origVal) * 100) : 0
                const isMall = currentPriceVal > 200000
                const ratingVal = p.rating && p.rating > 0 ? p.rating : 5.0
                const soldVal = p.sold ?? p.sales ?? 0

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${productSlug}-i.${p.id}`)}
                    className="bg-white border border-slate-100/80 hover:border-emerald-500/30 rounded-2xl overflow-hidden hover:shadow-lg transition flex flex-col justify-between relative group cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-101 transition duration-200"
                        loading="lazy"
                      />

                      {/* Left Tags: Mall or Yêu Thích */}
                      <div className="absolute top-2.5 left-0 flex flex-col gap-1 z-10 items-start">
                        {isMall ? (
                          <span className="bg-emerald-700 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs">
                            Mall
                          </span>
                        ) : (
                          <span className="bg-emerald-600 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-r-md shadow-xs">
                            Yêu thích
                          </span>
                        )}
                        <span className="bg-teal-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-r-md shadow-xs w-fit">
                          Freeship Xtra
                        </span>
                      </div>

                      {/* Right Promo Tag */}
                      {discountPct > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          -{discountPct}% GIẢM
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <h3 className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-2 min-h-[32px] group-hover:text-emerald-600 transition">
                          {p.name}
                        </h3>
                        {/* Badges row */}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[8px] text-emerald-600 border border-emerald-500/30 px-1 rounded-sm font-bold bg-emerald-50/20">
                            MUA ĐỂ FREESHIP
                          </span>
                          <span className="text-[8px] text-teal-600 border border-teal-500/30 px-1 rounded-sm font-bold bg-teal-50/20">
                            GIẢM ĐẾN 30K
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline flex-wrap gap-1">
                          <span className="text-sm font-bold text-emerald-600">{displayPriceStr}</span>
                          {p.originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through font-semibold">
                              {typeof p.originalPrice === 'number' ? p.originalPrice.toLocaleString('vi-VN') + 'đ' : p.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                          <div className="flex items-center text-yellow-400">
                            ★ <span className="text-slate-600 ml-0.5">{ratingVal}</span>
                          </div>
                          <span>Đã bán {soldVal >= 1000 ? `${(soldVal / 1000).toFixed(1)}k` : soldVal}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 text-right font-semibold">
                          {shopProvince || 'Chính hãng'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-12 text-center space-y-3">
              <span className="text-4xl">🛍️</span>
              <h3 className="text-sm font-extrabold text-slate-800">Không tìm thấy sản phẩm nào phù hợp trong gian hàng</h3>
              <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác hoặc bỏ bộ lọc danh mục.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all') }}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
