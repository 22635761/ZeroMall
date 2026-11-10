# -*- coding: utf-8 -*-
path = 'services/product-service/src/ai/ai-category-auditor.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update queryLocalClipVisionMulti return type
old_ret1 = """  private async queryLocalClipVisionMulti(
    images: string[],
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;"""

new_ret1 = """  private async queryLocalClipVisionMulti(
    images: string[],
    rawName: string,
    category: string,
  ): Promise<{
    isMismatch: boolean;
    isProhibited?: boolean;
    prohibitedLabel?: string;
    detectedVisual?: string;"""

code = code.replace(old_ret1, new_ret1, 1)

# 2. Update queryLocalClipVision return type
old_ret2 = """  private async queryLocalClipVision(
    imageUrl: string,
    rawName: string,
    category: string,
    base64Data?: string,
  ): Promise<{
    isMismatch: boolean;
    detectedVisual?: string;"""

new_ret2 = """  private async queryLocalClipVision(
    imageUrl: string,
    rawName: string,
    category: string,
    base64Data?: string,
  ): Promise<{
    isMismatch: boolean;
    isProhibited?: boolean;
    prohibitedLabel?: string;
    detectedVisual?: string;"""

code = code.replace(old_ret2, new_ret2, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print('[+] Successfully updated method return types in ai-category-auditor.service.ts')
