import { API_BASE_URL } from '../config/api.config';

export interface AuditProductInput {
  productId?: string;
  name: string;
  category: string;
  image?: string;
  images?: string[];
  description?: string;
}

export interface AuditCategoryResult {
  isMatched: boolean;
  issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM';
  confidence: number;
  currentCategory: string;
  suggestedCategory: string;
  suggestedTitle?: string;
  detectedVisual?: string;
  titleFeedback: string;
  imageFeedback?: string;
  actionRequired: 'NONE' | 'CHANGE_CATEGORY' | 'REPLACE_IMAGE' | 'UPDATE_TITLE';
  recommendation: string;
  source: string;
}

export interface BatchAuditStats {
  totalScanned: number;
  matchedCount: number;
  wrongCategoryCount: number;
  imageMismatchCount: number;
  flaggedProducts: Array<{
    id: string;
    name: string;
    image: string;
    category: string;
    shopId: string;
    status?: string;
    auditResult: AuditCategoryResult;
  }>;
}

/**
 * Kiểm tra ngành hàng và hình ảnh theo thời gian thực
 */
export async function auditProductCategory(input: AuditProductInput): Promise<AuditCategoryResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/ai/audit-category`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error auditing product category:', err);
    return null;
  }
}

/**
 * Quét toàn bộ sản phẩm phát hiện sai ngành hàng (Dành cho Admin / Shop)
 */
export async function fetchBatchAuditScan(shopId?: string): Promise<BatchAuditStats | null> {
  try {
    const url = shopId
      ? `${API_BASE_URL}/products/ai/audit-scan?shopId=${encodeURIComponent(shopId)}`
      : `${API_BASE_URL}/products/ai/audit-scan`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching batch audit scan:', err);
    return null;
  }
}

/**
 * Tự động sửa ngành hàng theo đề xuất của AI
 */
export async function fixProductCategory(productId: string, category: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/ai/fix-category/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error fixing product category:', err);
    return false;
  }
}
