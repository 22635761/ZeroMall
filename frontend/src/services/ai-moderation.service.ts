import { API_BASE_URL } from '../config/api.config';

export interface AiModerationResponse {
  isViolated: boolean;
  violationType: 'SAFE' | 'NARCOTICS' | 'WEAPONS' | 'COUNTERFEIT' | 'OBSCENE' | 'DANGEROUS' | 'RESTRICTED';
  confidence: number;
  reason: string;
  suggestion: string;
  detectedKeywords: string[];
  source: 'local-knowledge' | 'gemini-2.5-flash' | 'safe-pattern' | 'smart-heuristic';
  hitCount?: number;
  message?: string;
  stats?: {
    totalLearned: number;
    totalHits: number;
    violationCount: number;
    modelStatus?: string;
    lastUpdated?: string | null;
  };
}

export interface ModerationStatsResponse {
  totalLearned: number;
  totalHits: number;
  violationCount: number;
  modelStatus: string;
  lastUpdated: string | null;
}

/**
 * Gọi API ZeroAI Kiểm duyệt ngữ cảnh tự học
 */
export async function moderateContentWithAI(
  text: string,
  type: 'TITLE' | 'DESCRIPTION' = 'TITLE',
  category?: string
): Promise<AiModerationResponse> {
  const response = await fetch(`${API_BASE_URL}/products/ai-moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, type, category }),
  });

  if (!response.ok) {
    throw new Error(`Lỗi kiểm duyệt AI: ${response.status}`);
  }

  return response.json();
}

/**
 * Lấy số liệu thống kê tự học của Mô hình AI
 */
export async function fetchModerationStats(): Promise<ModerationStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/ai-moderate/stats`);
  if (!response.ok) {
    throw new Error('Không thể tải thống kê mô hình AI');
  }
  return response.json();
}
