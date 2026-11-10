with open('services/product-service/src/ai/ai-category-auditor.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update visualCheck call
target1 = '''    const coverImage = allImages[0] || '';
    let visualCheck: any = null;
    if (allImages.length > 1) {
      visualCheck = await this.queryLocalClipVisionMulti(allImages, rawName, currentCat);
    }
    if (!visualCheck) {
      visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);
    }'''

repl1 = '''    const coverImage = allImages[0] || '';
    let visualCheck: any = null;
    if (allImages.length >= 1) {
      visualCheck = await this.queryLocalClipVisionMulti(allImages, rawName, currentCat);
    }
    if (!visualCheck && coverImage) {
      visualCheck = await this.analyzeVisualClue(coverImage, rawName, currentCat);
    }'''

assert target1 in c, 'target1 not found'
c = c.replace(target1, repl1)

# 2. Add http://clip-service:5005/audit to endpoints
target2 = '''    const endpoints = [
      process.env.CLIP_SERVICE_URL,
      'http://host.docker.internal:5005/audit',
      'http://127.0.0.1:5005/audit',
      'http://localhost:5005/audit',
    ].filter(Boolean) as string[];'''

repl2 = '''    const endpoints = [
      process.env.CLIP_SERVICE_URL,
      'http://clip-service:5005/audit',
      'http://zeromall-clip-service:5005/audit',
      'http://host.docker.internal:5005/audit',
      'http://127.0.0.1:5005/audit',
      'http://localhost:5005/audit',
    ].filter(Boolean) as string[];'''

assert target2 in c, 'target2 not found'
c = c.replace(target2, repl2)

# 3. Update analyzeVisualClue return type & body
target3 = '''  private async analyzeVisualClue(
    imageUrl: string,
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;
    suggestedTitle?: string;
    suggestedCategory?: string;
    reason?: string;
    confidence?: number;
    source?: string;
  }> {'''

repl3 = '''  private async analyzeVisualClue(
    imageUrl: string,
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    isProhibited?: boolean;
    prohibitedLabel?: string;
    detectedVisual?: string;
    suggestedTitle?: string;
    suggestedCategory?: string;
    reason?: string;
    confidence?: number;
    source?: string;
  }> {'''

assert target3 in c, 'target3 not found'
c = c.replace(target3, repl3)

target4 = '''      if (clipRes) {
        const perception = {
          detectedVisual: clipRes.detectedVisual || 'Sản phẩm',
          suggestedTitle: clipRes.suggestedTitle || rawName,
          suggestedCategory: clipRes.suggestedCategory || category || 'Thể Thao',
          confidence: clipRes.confidence || 95,
        };
        this.visualPerceptionCache.set(imageUrl, perception);

        // Kiểm tra bổ sung ngữ nghĩa nếu tên nhập xung đột
        const evalCheck = this.checkSemanticMismatch(
          `${perception.detectedVisual} ${perception.suggestedTitle}`,
          lowerName,
        );

        if (clipRes.isMismatch || evalCheck.isMismatch) {
          return {
            isMismatch: true,
            detectedVisual: perception.detectedVisual,
            suggestedTitle: perception.suggestedTitle,
            suggestedCategory: perception.suggestedCategory,
            reason:
              clipRes.reason ||
              evalCheck.reason ||
              `Ảnh hiển thị "${perception.detectedVisual}", không tương đồng với tên "${rawName}".`,
            confidence: perception.confidence,
            source: 'local-clip-engine',
          };
        }

        return {
          isMismatch: false,
          detectedVisual: perception.detectedVisual,
          suggestedTitle: perception.suggestedTitle,
          suggestedCategory: perception.suggestedCategory,
          source: 'local-clip-engine',
        };
      }'''

repl4 = '''      if (clipRes) {
        if (clipRes.isProhibited) {
          return {
            isMismatch: true,
            isProhibited: true,
            prohibitedLabel: clipRes.prohibitedLabel,
            detectedVisual: clipRes.detectedVisual || clipRes.prohibitedLabel || 'Vật phẩm cấm',
            suggestedTitle: clipRes.suggestedTitle || rawName,
            suggestedCategory: 'Hàng Cấm Kinh Doanh',
            reason: clipRes.reason || `[Visual Safety Guard] Ảnh phát hiện ${clipRes.prohibitedLabel} - thuộc danh mục cấm kinh doanh trên sàn!`,
            confidence: clipRes.confidence || 98,
            source: 'local-clip-engine',
          };
        }

        const perception = {
          detectedVisual: clipRes.detectedVisual || 'Sản phẩm',
          suggestedTitle: clipRes.suggestedTitle || rawName,
          suggestedCategory: clipRes.suggestedCategory || category || 'Thể Thao',
          confidence: clipRes.confidence || 95,
        };
        this.visualPerceptionCache.set(imageUrl, perception);

        // Kiểm tra bổ sung ngữ nghĩa nếu tên nhập xung đột
        const evalCheck = this.checkSemanticMismatch(
          `${perception.detectedVisual} ${perception.suggestedTitle}`,
          lowerName,
        );

        if (clipRes.isMismatch || evalCheck.isMismatch) {
          return {
            isMismatch: true,
            isProhibited: false,
            detectedVisual: perception.detectedVisual,
            suggestedTitle: perception.suggestedTitle,
            suggestedCategory: perception.suggestedCategory,
            reason:
              clipRes.reason ||
              evalCheck.reason ||
              `Ảnh hiển thị "${perception.detectedVisual}", không tương đồng với tên "${rawName}".`,
            confidence: perception.confidence,
            source: 'local-clip-engine',
          };
        }

        return {
          isMismatch: false,
          isProhibited: false,
          detectedVisual: perception.detectedVisual,
          suggestedTitle: perception.suggestedTitle,
          suggestedCategory: perception.suggestedCategory,
          source: 'local-clip-engine',
        };
      }'''

assert target4 in c, 'target4 not found'
c = c.replace(target4, repl4)

with open('services/product-service/src/ai/ai-category-auditor.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully patched ai-category-auditor.service.ts')
