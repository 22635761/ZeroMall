import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { API_BASE_URL } from '../config/api.config'
import { formatRawProduct } from '../utils/productFormatter'
import type { Product } from '../components/buyer/FlashSale'
import { getFreeshipShopIds } from '../services/shop.service'
import { getEffectiveUserId } from '../services/ai-recommendation.service'

export interface ProductFeedResult {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Hook truy vấn danh mục sản phẩm (Categories) có cơ chế cache 10 phút.
 * Tránh việc mỗi lần quay về Home hay chuyển trang lại gọi API /products/categories.
 */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/products/categories`)
      if (!res.ok) throw new Error('Không thể tải danh mục')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
    staleTime: 1000 * 60 * 10, // 10 phút
  })
}

/**
 * Hook truy vấn danh sách Shop Freeship Xtra với TanStack Query cache.
 * Khi chuyển đổi qua lại giữa Home, Daily Discover, Search, v.v. dữ liệu tái sử dụng ngay.
 */
export function useFreeshipShopIdsQuery() {
  return useQuery<Set<string>>({
    queryKey: ['freeshipShopIds'],
    queryFn: async () => {
      return await getFreeshipShopIds()
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  })
}

/**
 * Hook truy vấn Top Bán Chạy Toàn Sàn từ backend (/products/top-trending).
 * Sắp xếp chuẩn xác theo số lượt bán thực tế (sales desc) trên toàn bộ CSDL.
 */
export function useTopTrendingProductsQuery(limit: number = 6) {
  return useQuery<Product[]>({
    queryKey: ['products', 'top-trending', limit],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/products/top-trending?limit=${limit}`)
      if (!res.ok) throw new Error('Không thể tải top bán chạy toàn sàn')
      const raw = await res.json()
      const rawList = Array.isArray(raw) ? raw : (raw.products || [])
      return rawList.map((p: any) => formatRawProduct(p))
    },
    staleTime: 1000 * 60 * 5, // 5 phút cache
  })
}

/**
 * Hook truy vấn dữ liệu Feed sản phẩm phân trang (Shopee-style Infinite/Paged Feed).
 * Tích hợp keepPreviousData để khi chuyển trang (1 -> 2 -> 3) không bị giật trắng trang.
 * Dữ liệu từng trang được lưu vào cache, người dùng back/forward không bao giờ bị spam API.
 */
export function useProductFeedQuery(page: number = 1, limit: number = 30, category?: string) {
  return useQuery<ProductFeedResult>({
    queryKey: ['products', 'feed', page, limit, category || 'all'],
    queryFn: async () => {
      const url = new URL(`${API_BASE_URL}/products`)
      url.searchParams.set('page', String(page))
      url.searchParams.set('limit', String(limit))
      if (category) {
        url.searchParams.set('category', category)
      }

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Lỗi tải feed sản phẩm trang ${page}`)
      const data = await res.json()

      const rawItems = Array.isArray(data) ? data : (data.products || [])
      const mapped = rawItems.map((p: any) => formatRawProduct(p))
      const valid = mapped.filter(
        (p: Product) =>
          (p.stock !== undefined ? p.stock > 0 : (p.total || 0) > (p.sold || 0)) &&
          p.status !== 'hidden'
      )

      const total = data.pagination?.total || mapped.length
      const totalPages = data.pagination?.totalPages || Math.ceil(total / limit) || 1
      const hasMore = data.pagination ? data.pagination.hasMore : rawItems.length >= limit

      return {
        products: valid,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 3, // 3 phút
  })
}

/**
 * Hook truy vấn feed "Gợi Ý Hôm Nay" (Daily Discover) cá nhân hóa theo phiên chuẩn Shopee.
 * Tự động xen kẽ 1-2 sản phẩm liên quan đến món vừa xem hoặc thêm giỏ hàng.
 */
export function usePersonalizedFeedQuery(page: number = 1, limit: number = 30) {
  const userId = getEffectiveUserId()
  return useQuery<ProductFeedResult & { userProfile?: any }>({
    queryKey: ['products', 'personalized_feed', userId, page, limit],
    queryFn: async () => {
      const url = new URL(`${API_BASE_URL}/products/ai/recommendations`)
      url.searchParams.set('userId', userId)
      url.searchParams.set('page', String(page))
      url.searchParams.set('limit', String(limit))

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Lỗi tải feed gợi ý trang ${page}`)
      const data = await res.json()

      const rawItems = Array.isArray(data) ? data : (data.products || [])
      const mapped = rawItems.map((p: any) => {
        const formatted = formatRawProduct(p)
        return {
          ...formatted,
          isPersonalized: Boolean(p.isPersonalized),
          recommendationReason: p.recommendationReason || '',
        }
      })
      const valid = mapped.filter(
        (p: Product) =>
          (p.stock !== undefined ? p.stock > 0 : (p.total || 0) > (p.sold || 0)) &&
          p.status !== 'hidden'
      )

      const total = data.total || data.pagination?.total || mapped.length
      const totalPages = data.pagination?.totalPages || Math.ceil(total / limit) || 1
      const hasMore = data.pagination ? data.pagination.hasMore : rawItems.length >= limit

      return {
        products: valid,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore,
        },
        userProfile: data.userProfile,
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 giây để cập nhật nhanh khi người dùng tương tác
  })
}

/**
 * Hook truy vấn tất cả sản phẩm (cho Search / Filter / Categories).
 * Cache 5 phút, tránh việc mỗi lần vào Search hay lọc lại load lại toàn bộ CSDL.
 */
export function useAllProductsQuery() {
  return useQuery<Product[]>({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/products`)
      if (!res.ok) throw new Error('Không thể tải toàn bộ sản phẩm')
      const raw = await res.json()
      const rawList = Array.isArray(raw) ? raw : (raw.products || [])
      const formatted = rawList.map((p: any) => formatRawProduct(p))
      return formatted.filter(
        (p: any) => (p.stock !== undefined ? p.stock > 0 : p.total > p.sold) && p.status !== 'hidden'
      )
    },
    staleTime: 1000 * 60 * 5, // 5 phút
  })
}

/**
 * Hook truy vấn chi tiết một sản phẩm theo ID.
 * Khi click xem sản phẩm rồi quay lại trang trước rồi xem lại: không tốn request HTTP.
 */
export function useProductDetailQuery(productId?: string) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null
      const res = await fetch(`${API_BASE_URL}/products/${productId}`)
      if (!res.ok) throw new Error('Không thể tải chi tiết sản phẩm')
      return await res.json()
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 5, // 5 phút
  })
}

/**
 * Hook truy vấn đánh giá (reviews) của sản phẩm.
 */
export function useProductReviewsQuery(productId?: string) {
  return useQuery({
    queryKey: ['productReviews', productId],
    queryFn: async () => {
      if (!productId) return []
      const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`)
      if (!res.ok) return []
      return await res.json()
    },
    enabled: Boolean(productId),
    staleTime: 1000 * 60 * 3, // 3 phút
  })
}

/**
 * Hook truy vấn thông tin Shop.
 */
export function useShopDetailsQuery(shopId?: string) {
  return useQuery({
    queryKey: ['shop', shopId],
    queryFn: async () => {
      if (!shopId) return null
      const res = await fetch(`${API_BASE_URL}/auth/shops/${shopId}`)
      if (!res.ok) return null
      return await res.json()
    },
    enabled: Boolean(shopId),
    staleTime: 1000 * 60 * 5, // 5 phút
  })
}

/**
 * Hook truy vấn thống kê Shop.
 */
export function useShopStatsQuery(shopId?: string) {
  return useQuery({
    queryKey: ['shopStats', shopId],
    queryFn: async () => {
      if (!shopId) return { totalProducts: 0, totalReviews: 0 }
      const res = await fetch(`${API_BASE_URL}/auth/shops/${shopId}/stats`)
      if (!res.ok) return { totalProducts: 0, totalReviews: 0 }
      return await res.json()
    },
    enabled: Boolean(shopId),
    staleTime: 1000 * 60 * 5, // 5 phút
  })
}
