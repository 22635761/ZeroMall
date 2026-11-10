# -*- coding: utf-8 -*-
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "services", "product-service", "src", "ai", "ai-category-auditor.service.ts"))
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# Fix suggestedCategory in textCheck return
old_block = """        if (textCheck.isViolated) {
          return {
            isMatched: false,
            issueType: 'WRONG_CATEGORY',
            confidence: textCheck.confidence || 98,
            currentCategory: currentCat,
            titleFeedback: `Phát hiện nội dung vi phạm: ${textCheck.reason}`,"""

new_block = """        if (textCheck.isViolated) {
          return {
            isMatched: false,
            issueType: 'WRONG_CATEGORY',
            confidence: textCheck.confidence || 98,
            currentCategory: currentCat,
            suggestedCategory: currentCat || 'Tổng Hợp',
            titleFeedback: `Phát hiện nội dung vi phạm: ${textCheck.reason}`,"""

c = c.replace(old_block.replace("\n", "\r\n"), new_block.replace("\n", "\r\n"))
c = c.replace(old_block, new_block)

# Fix source type to match AuditCategoryResult
c = c.replace("source?: 'multi-image-clip-agent';", "source?: 'local-clip-engine';")
c = c.replace("source: 'multi-image-clip-agent'", "source: 'local-clip-engine'")

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("[+] Fixed TypeScript type error in ai-category-auditor.service.ts")
