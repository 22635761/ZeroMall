import { API_BASE_URL } from '../config/api.config'

let cachedFreeshipShopIds: Set<string> | null = null
let cacheTimestamp = 0

/**
 * Truy vấn danh sách các Shop đã đăng ký gói Freeship Xtra từ CSDL thực tế
 * Cache 60 giây để tối ưu hiệu năng
 */
export const getFreeshipShopIds = async (forceRefresh = false): Promise<Set<string>> => {
  const now = Date.now()
  if (!forceRefresh && cachedFreeshipShopIds && now - cacheTimestamp < 60000) {
    return cachedFreeshipShopIds
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/shops`)
    if (res.ok) {
      const shops = await res.json()
      const enrolled = new Set<string>()
      if (Array.isArray(shops)) {
        shops.forEach((s: any) => {
          if (s.shippingSettings) {
            try {
              const parsed = typeof s.shippingSettings === 'string'
                ? JSON.parse(s.shippingSettings)
                : s.shippingSettings
              if (parsed.hasFreeshipXtra) {
                enrolled.add(s.id)
              }
            } catch (_) {}
          }
        })
      }
      cachedFreeshipShopIds = enrolled
      cacheTimestamp = now
      return enrolled
    }
  } catch (e) {
    console.error('Error fetching freeship shop IDs:', e)
  }

  return cachedFreeshipShopIds || new Set()
}
