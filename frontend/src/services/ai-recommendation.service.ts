import { API_BASE_URL } from '../config/api.config';

export interface PersonalizedFeedResponse {
  products: any[];
  total: number;
  userProfile: {
    isPersonalized: boolean;
    detectedGender?: string;
    topInterests: string[];
    hasRecentInteractions: boolean;
  };
}

/**
 * Gửi sự kiện hành vi người dùng lên AI Recommendation Engine
 */
export async function trackUserEngagement(
  action: 'VIEW' | 'CART' | 'LIKE' | 'PURCHASE' | 'SEARCH',
  productId?: string,
  category?: string,
  metadata?: any
): Promise<void> {
  try {
    const rawUser = localStorage.getItem('zm_user');
    let userId = 'guest';
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u?.id) userId = u.id;
      } catch {}
    }

    // Nếu không đăng nhập, lưu session ID tạm thời trong sessionStorage
    if (userId === 'guest') {
      let guestId = sessionStorage.getItem('zm_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
        sessionStorage.setItem('zm_guest_id', guestId);
      }
      userId = guestId;
    }

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
 * Lấy danh sách sản phẩm gợi ý cá nhân hóa từ ZeroAI
 */
export async function getPersonalizedRecommendations(
  userId?: string,
  gender?: string,
  limit: number = 30
): Promise<PersonalizedFeedResponse | null> {
  try {
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const rawUser = localStorage.getItem('zm_user');
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          if (u?.id) {
            effectiveUserId = u.id;
            if (!gender && u.gender) gender = u.gender;
          }
        } catch {}
      }
    }

    if (!effectiveUserId) {
      effectiveUserId = sessionStorage.getItem('zm_guest_id') || 'guest';
    }

    const params = new URLSearchParams();
    if (effectiveUserId) params.set('userId', effectiveUserId);
    if (gender) params.set('gender', gender);
    params.set('limit', limit.toString());

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
