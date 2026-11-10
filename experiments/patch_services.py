# -*- coding: utf-8 -*-
"""
CẬP NHẬT SOURCE CODE ZEROMALL VỚI KIẾN TRÚC MULTI-AGENT:
1. MultiImageVisualAgent (CLIP) -> Hỗ trợ quét album ảnh song song (Worst-case Pooling)
2. TextSanitizerAgent (Qwen/Regex) -> Tích hợp vào pipeline thẩm định sản phẩm
3. MultiImageAggregatorAgent -> Hợp nhất phán quyết đa phương thức
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def patch_ai_category_auditor():
    file_path = os.path.join(os.path.dirname(__file__), "..", "services", "product-service", "src", "ai", "ai-category-auditor.service.ts")
    file_path = os.path.abspath(file_path)
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Thêm import AiModerationService
    if "AiModerationService" not in content:
        content = content.replace(
            "import { LocalAiService } from './local-ai.service';",
            "import { LocalAiService } from './local-ai.service';\nimport { AiModerationService } from './ai-moderation.service';"
        )

    # 2. Inject AiModerationService vào constructor
    if "private readonly aiModeration" not in content:
        content = content.replace(
            "    private readonly localAi: LocalAiService,",
            "    private readonly localAi: LocalAiService,\n    private readonly aiModeration?: AiModerationService,"
        )

    # 3. Thêm hàm queryLocalClipVisionMulti
    multi_clip_fn = """  /**
   * AGENT: MultiImageVisualAgent
   * Gửi toàn bộ album ảnh sang Local CLIP để quét song song và áp dụng Worst-case Pooling
   */
  private async queryLocalClipVisionMulti(
    images: string[],
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;
    suggestedTitle?: string;
    suggestedCategory?: string;
    reason?: string;
    confidence?: number;
    worstImageIndex?: number;
    totalImagesScanned?: number;
    source?: 'multi-image-clip-agent';
  } | null> {
    const endpoints = [
      process.env.CLIP_SERVICE_URL,
      'http://host.docker.internal:5005/audit',
      'http://127.0.0.1:5005/audit',
      'http://localhost:5005/audit',
    ].filter(Boolean) as string[];

    const payload = {
      name: rawName,
      category,
      images: images.slice(0, 9),
    };

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data: any = await res.json();
          return {
            isMismatch: !!data.isMismatch,
            detectedVisual: data.detectedVisual,
            suggestedTitle: data.suggestedTitle,
            suggestedCategory: data.suggestedCategory,
            reason: data.reason,
            confidence: Math.max(92, Math.round(data.visualConfidence || 95)),
            worstImageIndex: data.worstImageIndex,
            totalImagesScanned: data.totalImagesScanned,
            source: 'multi-image-clip-agent',
          };
        }
      } catch {
        // Thử endpoint tiếp theo
      }
    }
    return null;
  }
"""
    if "queryLocalClipVisionMulti" not in content:
        content = content.replace(
            "  private async queryLocalClipVision(",
            multi_clip_fn + "\n  private async queryLocalClipVision("
        )

    # 4. Nâng cấp auditProduct với kiểm tra đa ảnh & văn bản đối kháng
    needle = "    // 1. Phân tích Ngành hàng chuẩn dựa trên Tên sản phẩm (Title NLP Category Inference)"
    
    new_audit_block = """    // 0. AGENT: TextSanitizerAgent (Quét từ cấm & lách từ đối kháng bằng Qwen 2.5)
    if (this.aiModeration) {
      try {
        const textCheck = await this.aiModeration.moderateContent({
          text: `${rawName} ${(input as any).description || ''}`,
          category: currentCat,
        });
        if (textCheck.isViolated) {
          return {
            isMatched: false,
            issueType: 'WRONG_CATEGORY',
            confidence: textCheck.confidence || 98,
            currentCategory: currentCat,
            titleFeedback: `Phát hiện nội dung vi phạm: ${textCheck.reason}`,
            actionRequired: 'CHANGE_CATEGORY',
            recommendation: textCheck.suggestion || 'Sản phẩm vi phạm quy định kinh doanh hàng cấm/lách luật.',
            source: (textCheck.source as any) || 'local-ai-engine',
          };
        }
      } catch (err: any) {
        this.logger.warn(`TextSanitizer check skipped: ${err.message}`);
      }
    }

    // 1. Phân tích Ngành hàng chuẩn dựa trên Tên sản phẩm (Title NLP Category Inference)
    const inferredCategoryFromTitle = this.inferCategoryFromTitle(lowerName);

    // 2. AGENT: MultiImageVisualAgent (Quét toàn bộ album ảnh bằng Worst-case Pooling)
    const allImages: string[] = [];
    if (input.image) allImages.push(input.image);
    if (Array.isArray(input.images)) {
      for (const img of input.images) {
        if (img && !allImages.includes(img)) allImages.push(img);
      }
    }

    let visualCheck: any = null;
    if (allImages.length > 1) {
      visualCheck = await this.queryLocalClipVisionMulti(allImages, rawName, currentCat);
    }
    if (!visualCheck) {
      visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);
    }"""

    old_target = """    const coverImage = input.image || (Array.isArray(input.images) && input.images[0]) || '';

    // 1. Phân tích Ngành hàng chuẩn dựa trên Tên sản phẩm (Title NLP Category Inference)
    const inferredCategoryFromTitle = this.inferCategoryFromTitle(lowerName);

    // 2. Phân tích Nội dung Hình ảnh (Visual Clue Analysis qua Local CLIP + Heuristics)
    const visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);"""

    old_target_crlf = old_target.replace("\n", "\r\n")
    new_audit_block_crlf = new_audit_block.replace("\n", "\r\n")

    if old_target_crlf in content:
        content = content.replace(old_target_crlf, new_audit_block_crlf)
    elif old_target in content:
        content = content.replace(old_target, new_audit_block)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[+] Đã tích hợp Multi-Agent vào {file_path}")

if __name__ == "__main__":
    patch_ai_category_auditor()
