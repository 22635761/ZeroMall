# -*- coding: utf-8 -*-
path = 'frontend/src/components/seller/add-product/AddProductBasicTab.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_block = """        {categoryAudit && !categoryAudit.isMatched && (
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-900 mt-2.5 space-y-2 shadow-2xs animate-fadeIn">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <span className="text-base">⚠️</span>
                <span>Cảnh báo kiểm duyệt hình ảnh ZeroAI:</span>
              </div>
              {categoryAudit.suggestedCategory && categoryAudit.suggestedCategory !== category && (
                <button
                  type="button"
                  onClick={() => setCategory(categoryAudit.suggestedCategory)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <span>⚡ Đổi sang ngành: {categoryAudit.suggestedCategory}</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
              {categoryAudit.imageFeedback || categoryAudit.recommendation || `Ảnh nhận diện là "${categoryAudit.detectedVisual}", không khớp với ngành hoặc tên sản phẩm đã chọn.`}
            </p>
          </div>
        )}"""

new_block = """        {categoryAudit && !categoryAudit.isMatched && (
          categoryAudit.issueType === 'PROHIBITED_ITEM' ? (
            <div className="bg-red-600 text-white rounded-2xl p-4 text-xs mt-2.5 space-y-2 shadow-lg animate-pulse border-2 border-red-300">
              <div className="flex items-center gap-2 font-black text-sm">
                <span className="text-xl">🚫</span>
                <span>CẢNH BÁO: PHÁT HIỆN HÀNG CẤM TRONG HÌNH ẢNH!</span>
              </div>
              <p className="text-xs text-red-100 font-medium leading-relaxed">
                {categoryAudit.imageFeedback || categoryAudit.recommendation}
              </p>
              <div className="bg-red-700/80 p-2 rounded-xl text-[11px] font-bold text-amber-200">
                ⚠️ Sàn ZeroMall nghiêm cấm tuyệt đối buôn bán vũ khí, súng đạn, đao kiếm và chất cấm. Bạn không thể đăng sản phẩm này cho đến khi gỡ bỏ hình ảnh vi phạm!
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-900 mt-2.5 space-y-2 shadow-2xs animate-fadeIn">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <span className="text-base">⚠️</span>
                  <span>Cảnh báo kiểm duyệt hình ảnh ZeroAI:</span>
                </div>
                {categoryAudit.suggestedCategory && categoryAudit.suggestedCategory !== category && (
                  <button
                    type="button"
                    onClick={() => setCategory(categoryAudit.suggestedCategory)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <span>⚡ Đổi sang ngành: {categoryAudit.suggestedCategory}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                {categoryAudit.imageFeedback || categoryAudit.recommendation || `Ảnh nhận diện là "${categoryAudit.detectedVisual}", không khớp với ngành hoặc tên sản phẩm đã chọn.`}
              </p>
            </div>
          )
        )}"""

if old_block in code:
    code = code.replace(old_block, new_block, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print('[+] Successfully patched AddProductBasicTab.tsx with PROHIBITED_ITEM red banner')
else:
    print('[-] Pattern not found, skipping patch')
