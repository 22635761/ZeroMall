import { API_BASE_URL } from '../config/api.config';

export interface SemanticSearchResponse {
  query: string;
  detectedIntent: string;
  suggestedCategory?: string;
  expandedKeywords: string[];
  priceRange?: { min?: number; max?: number };
  attributes?: Record<string, any>;
  products: any[];
  totalMatches: number;
  source: 'local-knowledge' | 'gemini-ai' | 'local-ai-engine' | 'gemini-2.5-flash' | 'smart-heuristic' | string;
  hitCount?: number;
  message?: string;
}

export interface VisualSearchResponse {
  visualAnalysis: {
    detectedProduct: string;
    suggestedCategory?: string;
    dominantColors: string[];
    style?: string;
    material?: string;
    gender?: string;
    searchTerms: string[];
  };
  products: any[];
  totalMatches: number;
  source: 'local-knowledge' | 'gemini-ai' | 'local-ai-engine' | 'gemini-2.5-flash' | 'smart-heuristic' | 'clip-vector-engine';
  hitCount?: number;
  message?: string;
}

export interface SearchStatsResponse {
  totalLearned: number;
  totalHits: number;
  semanticCount: number;
  visualCount: number;
  modelStatus: string;
  lastUpdated: string | null;
}

/**
 * Tìm kiếm ngữ nghĩa bằng ngôn ngữ tự nhiên qua ZeroAI
 */
export async function searchSemanticWithAI(
  query: string,
  category?: string,
  limit: number = 30
): Promise<SemanticSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/products/ai-search/semantic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category, limit }),
  });

  if (!response.ok) {
    throw new Error(`Lỗi tìm kiếm ngữ nghĩa: ${response.status}`);
  }

  return response.json();
}

/**
 * Tìm kiếm sản phẩm tương đồng bằng hình ảnh (Visual Search)
 */
export async function searchVisualWithAI(params: {
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
  limit?: number;
}): Promise<VisualSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/products/ai-search/visual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Lỗi tìm kiếm bằng hình ảnh: ${response.status}`);
  }

  return response.json();
}

/**
 * Lấy thống kê số lượt đã học của mô hình tìm kiếm
 */
export async function fetchSearchStats(): Promise<SearchStatsResponse> {
  const response = await fetch(`${API_BASE_URL}/products/ai-search/stats`);
  if (!response.ok) {
    throw new Error('Không thể tải thống kê tìm kiếm');
  }
  return response.json();
}
