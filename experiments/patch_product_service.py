with open('services/product-service/src/product.service.ts', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''    if (this.aiCategoryAuditor) {
      try {
        let parsedImgs: string[] | undefined = undefined;
        if (Array.isArray(dto.images)) {
          parsedImgs = dto.images;
        } else if (typeof dto.images === 'string') {
          try { parsedImgs = JSON.parse(dto.images); } catch {}
        }

        const audit = await this.aiCategoryAuditor.auditProduct({
          name: productName,
          category: categoryStr,
          image: dto.image ? String(dto.image) : undefined,
          images: parsedImgs,
          description,
        });

        if (!audit.isMatched) {
          if (audit.issueType === 'PROHIBITED_ITEM' || (audit as any).isProhibited) {
            throw new BadRequestException(
              `Hình ảnh sản phẩm chứa vật phẩm cấm kinh doanh trên sàn (${audit.detectedVisual || 'vũ khí/chất cấm'}). Hệ thống từ chối đăng tải! Vui lòng gỡ bỏ ảnh vi phạm.`
            );
          }
          isViolated = true;
          violationReason = audit.imageFeedback || audit.titleFeedback || audit.recommendation || 'Không khớp ngành hàng hoặc hình ảnh sản phẩm';
          initialStatus = 'hidden';
          this.logger.warn(`[AI Audit Flag] Sản phẩm "${productName}" bị đánh dấu vi phạm: ${violationReason}`);
        }
      } catch (err: any) {
        this.logger.warn(`AI audit check on create skipped: ${err.message}`);
      }
    }'''

repl = '''    if (this.aiCategoryAuditor) {
      let parsedImgs: string[] | undefined = undefined;
      if (Array.isArray(dto.images)) {
        parsedImgs = dto.images;
      } else if (typeof dto.images === 'string') {
        try { parsedImgs = JSON.parse(dto.images); } catch {}
      }

      let audit: any = null;
      try {
        audit = await this.aiCategoryAuditor.auditProduct({
          name: productName,
          category: categoryStr,
          image: dto.image ? String(dto.image) : undefined,
          images: parsedImgs,
          description,
        });
      } catch (err: any) {
        this.logger.warn(`AI audit check on create skipped: ${err.message}`);
      }

      if (audit) {
        if (audit.issueType === 'PROHIBITED_ITEM' || audit.isProhibited) {
          throw new BadRequestException(
            `🚫 VI PHẠM AN TOÀN NGHIÊM TRỌNG: Hình ảnh sản phẩm bị phát hiện chứa vật phẩm cấm kinh doanh trên sàn (${audit.detectedVisual || audit.prohibitedLabel || 'Vũ khí / Hàng cấm'}). Hệ thống ZeroMall từ chối đăng tải!`
          );
        }
        if (!audit.isMatched) {
          isViolated = true;
          violationReason = audit.imageFeedback || audit.titleFeedback || audit.recommendation || 'Không khớp ngành hàng hoặc hình ảnh sản phẩm';
          initialStatus = 'hidden';
          this.logger.warn(`[AI Audit Flag] Sản phẩm "${productName}" bị đánh dấu vi phạm: ${violationReason}`);
        }
      }
    }'''

assert target in c, 'target not found'
c = c.replace(target, repl)

with open('services/product-service/src/product.service.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully patched product.service.ts')
