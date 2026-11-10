with open('services/product-service/src/ai/ai-category-auditor.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''    // 0. AGENT: TextSanitizerAgent (Quét từ cấm & lách từ đối kháng bằng Qwen 2.5)
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
            suggestedCategory: currentCat || 'Tổng Hợp',
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

    const coverImage = allImages[0] || '';
    let visualCheck: any = null;
    if (allImages.length >= 1) {
      visualCheck = await this.queryLocalClipVisionMulti(allImages, rawName, currentCat);
    }
    if (!visualCheck && coverImage) {
      visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);
    }

    // 3. Đánh giá Mâu thuẫn Hình ảnh & Hàng cấm (Visual-Text Mismatch / Prohibited Item)
    if (visualCheck && (visualCheck.isMismatch || visualCheck.isProhibited)) {
      const isContraband = Boolean(visualCheck.isProhibited);
      return {
        isMatched: false,
        isProhibited: isContraband,
        prohibitedLabel: visualCheck.prohibitedLabel,
        issueType: isContraband ? 'PROHIBITED_ITEM' : 'IMAGE_MISMATCH',
        confidence: visualCheck.confidence || 98,
        currentCategory: currentCat,
        suggestedTitle: visualCheck.suggestedTitle,
        detectedVisual: visualCheck.detectedVisual,
        suggestedCategory: isContraband ? 'Hàng Cấm Kinh Doanh' : (visualCheck.suggestedCategory || inferredCategoryFromTitle || currentCat),
        titleFeedback: rawName ? `Tiêu đề bạn nhập là "${rawName}".` : `Chưa nhập tiêu đề sản phẩm.`,
        imageFeedback: visualCheck.reason || `Ảnh là "${visualCheck.detectedVisual}".`,
        actionRequired: isContraband ? 'REPLACE_IMAGE' : 'UPDATE_TITLE',
        recommendation: isContraband
          ? `🚫 CẢNH BÁO HÀNG CẤM: Hình ảnh chứa ${visualCheck.prohibitedLabel || 'vật phẩm cấm kinh doanh'}. Sàn ZeroMall nghiêm cấm tuyệt đối đăng tải!`
          : `Ảnh là "${visualCheck.detectedVisual}". ZeroAI đề xuất chuyển ngành sang "${visualCheck.suggestedCategory || 'Thời Trang Nam'}" hoặc chọn ảnh phù hợp.`,
        source: (visualCheck.source as any) || 'local-clip-engine',
      };
    }'''

repl = '''    // 1. Phân tích Thị giác & Hàng cấm đa hình ảnh (MultiImageVisualAgent: CLIP ViT-B-32 Worst-case Pooling)
    const allImages: string[] = [];
    if (input.image) allImages.push(input.image);
    if (Array.isArray(input.images)) {
      for (const img of input.images) {
        if (img && !allImages.includes(img)) allImages.push(img);
      }
    }

    const coverImage = allImages[0] || '';
    let visualCheck: any = null;
    if (allImages.length >= 1) {
      visualCheck = await this.queryLocalClipVisionMulti(allImages, rawName, currentCat);
    }
    if (!visualCheck && coverImage) {
      visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);
    }

    // NẾU HÌNH ẢNH CHỨA HÀNG CẤM -> LẬP TỨC CHẶN NGAY VỚI MỨC ƯU TIÊN CAO NHẤT
    if (visualCheck && visualCheck.isProhibited) {
      return {
        isMatched: false,
        isProhibited: true,
        prohibitedLabel: visualCheck.prohibitedLabel || 'Hàng cấm / Vũ khí',
        issueType: 'PROHIBITED_ITEM',
        confidence: visualCheck.confidence || 98,
        currentCategory: currentCat,
        suggestedTitle: visualCheck.suggestedTitle,
        detectedVisual: visualCheck.detectedVisual,
        suggestedCategory: 'Hàng Cấm Kinh Doanh',
        titleFeedback: rawName ? `Tiêu đề bạn nhập là "${rawName}".` : `Chưa nhập tiêu đề sản phẩm.`,
        imageFeedback: visualCheck.reason || `Ảnh là "${visualCheck.detectedVisual}".`,
        actionRequired: 'REPLACE_IMAGE',
        recommendation: `🚫 CẢNH BÁO HÀNG CẤM: Hình ảnh chứa ${visualCheck.prohibitedLabel || 'vật phẩm cấm kinh doanh'}. Sàn ZeroMall nghiêm cấm tuyệt đối đăng tải!`,
        source: (visualCheck.source as any) || 'local-clip-engine',
      };
    }

    // 2. AGENT: TextSanitizerAgent (Quét từ cấm & lách từ đối kháng bằng Qwen 2.5 / Gemini)
    if (this.aiModeration) {
      try {
        const textCheck = await this.aiModeration.moderateContent({
          text: `${rawName} ${(input as any).description || ''}`,
          category: currentCat,
        });
        if (textCheck.isViolated) {
          return {
            isMatched: false,
            isProhibited: true,
            prohibitedLabel: 'Hàng cấm / Từ cấm vi phạm chính sách',
            issueType: 'PROHIBITED_ITEM',
            confidence: textCheck.confidence || 98,
            currentCategory: currentCat,
            suggestedCategory: 'Hàng Cấm Kinh Doanh',
            titleFeedback: `🚫 VI PHẠM CHÍNH SÁCH: ${textCheck.reason}`,
            actionRequired: 'REPLACE_IMAGE',
            recommendation: textCheck.suggestion || 'Sản phẩm vi phạm quy định kinh doanh hàng cấm/lách luật. ZeroMall nghiêm cấm tuyệt đối đăng tải!',
            source: (textCheck.source as any) || 'local-ai-engine',
          };
        }
      } catch (err: any) {
        this.logger.warn(`TextSanitizer check skipped: ${err.message}`);
      }
    }

    // 3. Phân tích Ngành hàng chuẩn dựa trên Tên sản phẩm (Title NLP Category Inference)
    const inferredCategoryFromTitle = this.inferCategoryFromTitle(lowerName);

    // 4. Đánh giá Mâu thuẫn Hình ảnh (Visual-Text Mismatch)
    if (visualCheck && visualCheck.isMismatch) {
      return {
        isMatched: false,
        isProhibited: false,
        prohibitedLabel: undefined,
        issueType: 'IMAGE_MISMATCH',
        confidence: visualCheck.confidence || 98,
        currentCategory: currentCat,
        suggestedTitle: visualCheck.suggestedTitle,
        detectedVisual: visualCheck.detectedVisual,
        suggestedCategory: visualCheck.suggestedCategory || inferredCategoryFromTitle || currentCat,
        titleFeedback: rawName ? `Tiêu đề bạn nhập là "${rawName}".` : `Chưa nhập tiêu đề sản phẩm.`,
        imageFeedback: visualCheck.reason || `Ảnh là "${visualCheck.detectedVisual}".`,
        actionRequired: 'UPDATE_TITLE',
        recommendation: `Ảnh là "${visualCheck.detectedVisual}". ZeroAI đề xuất chuyển ngành sang "${visualCheck.suggestedCategory || 'Thời Trang Nam'}" hoặc chọn ảnh phù hợp.`,
        source: (visualCheck.source as any) || 'local-clip-engine',
      };
    }'''

assert target in c, 'target not found'
c = c.replace(target, repl)

with open('services/product-service/src/ai/ai-category-auditor.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully patched ai-category-auditor.service.ts (priority visual check)')
