with open('frontend/src/components/seller/AddProductForm.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

target1 = '''  const handleSubmit = async (e: React.FormEvent, targetStatus: 'active' | 'hidden' = 'active') => {
    e.preventDefault()

    if (isProhibitedItem) {
      alert(`🚫 VI PHẠM AN TOÀN NGHIÊM TRỌNG: AI đã phát hiện hình ảnh hoặc nội dung sản phẩm chứa mặt hàng cấm (${categoryAudit?.prohibitedLabel || 'Hàng cấm / Vũ khí'}). ZeroMall từ chối đăng tải sản phẩm này theo chính sách của sàn!`)
      return
    }'''

repl1 = '''  const handleSubmit = async (e: React.FormEvent, targetStatus: 'active' | 'hidden' = 'active') => {
    e.preventDefault()

    let currentAudit = categoryAudit
    if (!currentAudit && images.length > 0) {
      try {
        const coverImg = images[0]?.url || ''
        currentAudit = await auditProductCategory({
          name: productName.trim() || category || 'Sản phẩm mới',
          category: category || '',
          image: coverImg,
          images: images.map(i => i.url).filter(Boolean),
          description: description || '',
        })
      } catch {}
    }

    if (isProhibitedItem || currentAudit?.isProhibited || currentAudit?.issueType === 'PROHIBITED_ITEM') {
      alert(`🚫 VI PHẠM AN TOÀN NGHIÊM TRỌNG: AI đã phát hiện hình ảnh hoặc nội dung sản phẩm chứa mặt hàng cấm (${currentAudit?.prohibitedLabel || categoryAudit?.prohibitedLabel || 'Hàng cấm / Vũ khí'}). ZeroMall từ chối đăng tải sản phẩm này theo chính sách của sàn!`)
      return
    }'''

assert target1 in c, 'target1 not found'
c = c.replace(target1, repl1)

target2 = '''    try {
      if (onSuccess) {
        await onSuccess(newProduct)
      }
      setToastMessage(initialData ? '🎉 Đã cập nhật sản phẩm thành công!' : '🎉 Đã thêm sản phẩm thành công!')
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 1500)
    } catch (err: any) {
      console.error('Failed to save product:', err)
    }'''

repl2 = '''    try {
      if (onSuccess) {
        await onSuccess(newProduct)
      }
      setToastMessage(initialData ? '🎉 Đã cập nhật sản phẩm thành công!' : '🎉 Đã thêm sản phẩm thành công!')
      setShowToast(true)
      setTimeout(() => {
        setShowToast(false)
      }, 1500)
    } catch (err: any) {
      console.error('Failed to save product:', err)
      alert(err?.message || 'Lỗi khi lưu sản phẩm')
      return
    }'''

assert target2 in c, 'target2 not found'
c = c.replace(target2, repl2)

# Also ensure auditProductCategory is imported if not already
if 'auditProductCategory' not in c:
    c = c.replace(
        "import { type AuditCategoryResult } from '../../services/ai-category-auditor.service'",
        "import { auditProductCategory, type AuditCategoryResult } from '../../services/ai-category-auditor.service'"
    )

with open('frontend/src/components/seller/AddProductForm.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Successfully patched AddProductForm.tsx')
