import { API_BASE_URL } from '../config/api.config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
  timestamp: number;
}

export interface AssistantChatResponse {
  reply: string;
  suggestedProducts: any[];
  quickReplies?: string[];
  detectedIntent?: {
    category?: string;
    targetGender?: string;
    priceRange?: { min?: number; max?: number };
    keywords?: string[];
  };
}

/**
 * Gửi tin nhắn tới ZeroAI Shopping Assistant
 */
export async function sendAssistantChat(
  message: string,
  history: ChatMessage[] = [],
  userGender?: string
): Promise<AssistantChatResponse | null> {
  try {
    const rawUser = localStorage.getItem('zm_user');
    let userId = 'guest';
    let effectiveGender = userGender;

    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u?.id) userId = u.id;
        if (!effectiveGender && u?.gender) effectiveGender = u.gender;
        if (!effectiveGender && u?.name) {
          const malePattern = /\b(cuong|cường|nam|hùng|tuấn|đức|dũng|minh|hoàng|long|khoa|thắng|văn|huy|trung|kiên)\b/i;
          const femalePattern = /\b(lan|hương|mai|linh|ngọc|trang|vy|hà|thảo|nga|hoa|huyền|phương|nhung|trinh)\b/i;
          if (malePattern.test(u.name)) effectiveGender = 'MALE';
          else if (femalePattern.test(u.name)) effectiveGender = 'FEMALE';
        }
      } catch {}
    }

    const payload = {
      message,
      userId,
      userGender: effectiveGender,
      history: history.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    const res = await fetch(`${API_BASE_URL}/products/ai/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return (await res.json()) as AssistantChatResponse;
    }

    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Không thể kết nối đến ZeroAI');
  } catch (e) {
    console.warn('Lỗi gọi ZeroAI Assistant:', e);
    return null;
  }
}
