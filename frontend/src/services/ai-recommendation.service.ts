import { API_BASE_URL } from '../config/api.config';

export interface PersonalizedFeedResponse {
  products: any[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  userProfile: {
    isPersonalized: boolean;
    detectedGender?: string;
    topInterests: string[];
    hasRecentInteractions: boolean;
    recentAction?: string;
  };
}

/**
 * Lấy mã định danh người dùng nhất quán (Hỗ trợ cả User đã đăng nhập & Khách vãng lai Guest)
 */
export function getEffectiveUserId(): string {
  try {
    const rawUser = localStorage.getItem('zm_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u?.id) return u.id;
    }
  } catch {}

  // Đối với khách vãng lai: Lưu vào localStorage để duy trì lịch sử phiên xuyên suốt các tab
  let guestId = localStorage.getItem('zm_guest_id') || sessionStorage.getItem('zm_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('zm_guest_id', guestId);
    sessionStorage.setItem('zm_guest_id', guestId);
  }
  return guestId;
}

/**
 * Gửi sự kiện hành vi người dùng lên AI Recommendation Engine
 * (Kích hoạt khi Xem sản phẩm, Thêm vào giỏ, Thả tim, Tìm kiếm)
 */
export async function trackUserEngagement(
  action: 'VIEW' | 'CART' | 'LIKE' | 'PURCHASE' | 'SEARCH',
  productId?: string,
  category?: string,
  metadata?: any
): Promise<void> {
  try {
    const userId = getEffectiveUserId();

    await fetch(`${API_BASE_URL}/products/ai/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action,
        productId,
        category,
        metadata,
      }),
    });
  } catch (e) {
    // Non-blocking error handling
  }
}

/**
 * Lấy danh sách sản phẩm gợi ý cá nhân hóa từ ZeroAI ("Gợi Ý Hôm Nay" / Daily Discover)
 */
export async function getPersonalizedRecommendations(
  userId?: string,
  gender?: string,
  limit: number = 30,
  page: number = 1
): Promise<PersonalizedFeedResponse | null> {
  try {
    const effectiveUserId = userId || getEffectiveUserId();

    const params = new URLSearchParams();
    if (effectiveUserId) params.set('userId', effectiveUserId);
    if (gender) params.set('gender', gender);
    params.set('limit', limit.toString());
    params.set('page', page.toString());

    const res = await fetch(`${API_BASE_URL}/products/ai/recommendations?${params.toString()}`);
    if (res.ok) {
      return (await res.json()) as PersonalizedFeedResponse;
    }
    return null;
  } catch (e) {
    console.warn('Lỗi lấy gợi ý AI:', e);
    return null;
  }
}
