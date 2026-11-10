# -*- coding: utf-8 -*-
# 1. Patch product-service ai-category-auditor.service.ts
path1 = 'services/product-service/src/ai/ai-category-auditor.service.ts'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()

# Update AuditCategoryResult interface
old_interface = "issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM';"
new_interface = "issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM' | 'PROHIBITED_ITEM';\n  isProhibited?: boolean;\n  prohibitedLabel?: string;"
c1 = c1.replace(old_interface, new_interface, 1)

# Update queryLocalClipVisionMulti return
old_q_multi = "isMismatch: !!data.isMismatch,\n            detectedVisual: data.detectedVisual,"
new_q_multi = "isMismatch: !!data.isMismatch,\n            isProhibited: !!data.isProhibited,\n            prohibitedLabel: data.prohibitedLabel,\n            detectedVisual: data.detectedVisual,"
c1 = c1.replace(old_q_multi, new_q_multi, 1)

# Update queryLocalClipVision return
old_q_single = "isMismatch: !!data.isMismatch,\n            detectedVisual: data.detectedVisual,"
new_q_single = "isMismatch: !!data.isMismatch,\n            isProhibited: !!data.isProhibited,\n            prohibitedLabel: data.prohibitedLabel,\n            detectedVisual: data.detectedVisual,"
c1 = c1.replace(old_q_single, new_q_single, 1)

# Update auditProduct visual evaluation
old_eval = """    // 3. Đánh giá Mâu thuẫn Hình ảnh (Visual-Text Mismatch)
    if (visualCheck && visualCheck.isMismatch) {
      return {
        isMatched: false,
        issueType: 'IMAGE_MISMATCH',
        confidence: visualCheck.confidence || 95,
        currentCategory: currentCat,
        suggestedTitle: visualCheck.suggestedTitle,
        detectedVisual: visualCheck.detectedVisual,
        suggestedCategory: visualCheck.suggestedCategory || inferredCategoryFromTitle || currentCat,
        titleFeedback: rawName ? `Tiêu đề bạn nhập là "${rawName}".` : `Chưa nhập tiêu đề sản phẩm.`,
        imageFeedback: visualCheck.reason || `Ảnh là "${visualCheck.detectedVisual}", không khớp với ngành hoặc tên sản phẩm.`,
        actionRequired: 'UPDATE_TITLE',
        recommendation: `Ảnh là "${visualCheck.detectedVisual}". ZeroAI đề xuất chuyển ngành sang "${visualCheck.suggestedCategory || 'Thời Trang Nam'}" hoặc chọn ảnh phù hợp.`,
        source: (visualCheck.source as any) || 'local-clip-engine',
      };
    }"""

new_eval = """    // 3. Đánh giá Mâu thuẫn Hình ảnh & Hàng cấm (Visual-Text Mismatch / Prohibited Item)
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
    }"""
c1 = c1.replace(old_eval, new_eval, 1)

with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)
print('[+] Patched ai-category-auditor.service.ts')

# 2. Patch product.service.ts create check
path2 = 'services/product-service/src/product.service.ts'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

old_create_flag = """        if (!audit.isMatched) {
          isViolated = true;
          violationReason = audit.imageFeedback || audit.titleFeedback || audit.recommendation || 'Không khớp ngành hàng hoặc hình ảnh sản phẩm';
          initialStatus = 'hidden';
          this.logger.warn(`[AI Audit Flag] Sản phẩm "${productName}" bị đánh dấu vi phạm: ${violationReason}`);
        }"""

new_create_flag = """        if (!audit.isMatched) {
          if (audit.issueType === 'PROHIBITED_ITEM' || (audit as any).isProhibited) {
            throw new BadRequestException(
              `Hình ảnh sản phẩm chứa vật phẩm cấm kinh doanh trên sàn (${audit.detectedVisual || 'vũ khí/chất cấm'}). Hệ thống từ chối đăng tải! Vui lòng gỡ bỏ ảnh vi phạm.`
            );
          }
          isViolated = true;
          violationReason = audit.imageFeedback || audit.titleFeedback || audit.recommendation || 'Không khớp ngành hàng hoặc hình ảnh sản phẩm';
          initialStatus = 'hidden';
          this.logger.warn(`[AI Audit Flag] Sản phẩm "${productName}" bị đánh dấu vi phạm: ${violationReason}`);
        }"""

c2 = c2.replace(old_create_flag, new_create_flag, 1)
with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)
print('[+] Patched product.service.ts')

# 3. Patch frontend ai-category-auditor.service.ts
path3 = 'frontend/src/services/ai-category-auditor.service.ts'
with open(path3, 'r', encoding='utf-8') as f:
    c3 = f.read()

old_fe_interface = "issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM';"
new_fe_interface = "issueType: 'MATCHED' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH' | 'KEYWORD_SPAM' | 'PROHIBITED_ITEM';\n  isProhibited?: boolean;\n  prohibitedLabel?: string;"
c3 = c3.replace(old_fe_interface, new_fe_interface, 1)
with open(path3, 'w', encoding='utf-8') as f:
    f.write(c3)
print('[+] Patched frontend ai-category-auditor.service.ts')
