import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { fetchBatchAuditScan, fixProductCategory, type BatchAuditStats } from '../../services/ai-category-auditor.service'

interface CsCategoryAuditTabProps {
  user: any
  triggerAuditLog: (action: string) => Promise<void>
}

export const CsCategoryAuditTab: React.FC<CsCategoryAuditTabProps> = ({ user, triggerAuditLog }) => {
  const [batchAudit, setBatchAudit] = useState<BatchAuditStats | null>(null)
  const [isAuditing, setIsAuditing] = useState(false)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [hidingId, setHidingId] = useState<string | null>(null)
  
  // Filter & Search
  const [filterIssue, setFilterIssue] = useState<'ALL' | 'WRONG_CATEGORY' | 'IMAGE_MISMATCH'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Shops map: id -> { id, name, ownerId, phoneNumber }
  const [shopsMap, setShopsMap] = useState<Record<string, any>>({})
  
  // Modals
  const [imagePreview, setImagePreview] = useState<{ src: string; title: string } | null>(null)
  const [warningModalItem, setWarningModalItem] = useState<any | null>(null)
  const [warningTitle, setWarningTitle] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [isSendingWarning, setIsSendingWarning] = useState(false)

  // Fetch shop metadata
  const fetchShops = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/shops`)
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, any> = {}
        data.forEach((s: any) => { map[s.id] = s })
        setShopsMap(map)
      }
    } catch (e) {
      console.error('Error fetching shops map:', e)
    }
  }

  // Run or refresh AI Audit Scan
  const runAiAuditScan = async () => {
    setIsAuditing(true)
    try {
      const data = await fetchBatchAuditScan()
      if (data) {
        setBatchAudit(data)
      }
    } catch (e) {
      console.error('Error in batch category audit:', e)
    } finally {
      setIsAuditing(false)
    }
  }

  useEffect(() => {
    fetchShops()
    runAiAuditScan()
  }, [])

  // Handle 1-Click Category Fix by CSKH
  const handleAutoFixCategory = async (productId: string, newCategory: string, productName: string) => {
    setFixingId(productId)
    try {
      const ok = await fixProductCategory(productId, newCategory)
      if (ok) {
        await triggerAuditLog(`[CSKH AI-AUDIT] Cập nhật ngành hàng sản phẩm "${productName}" (ID: ${productId}) sang "${newCategory}"`)
        alert(`✅ CSKH đã chuyển sản phẩm "${productName}" sang đúng ngành hàng "${newCategory}" thành công!`)
        runAiAuditScan()
      } else {
        alert('Không thể cập nhật ngành hàng. Vui lòng thử lại.')
      }
    } catch (e: any) {
      alert('Lỗi khi cập nhật ngành hàng: ' + e.message)
    } finally {
      setFixingId(null)
    }
  }

  // Handle Toggle Product Hide/Show (Tạm ẩn khỏi sàn)
  const handleToggleProductStatus = async (item: any) => {
    const isCurrentlyHidden = item.status === 'hidden'
    const nextStatus = isCurrentlyHidden ? 'active' : 'hidden'
    const confirmText = isCurrentlyHidden
      ? `Mở khóa hiển thị lại sản phẩm "${item.name}" trên sàn?`
      : `CSKH xác nhận tạm ẩn sản phẩm "${item.name}" khỏi sàn để yêu cầu Shop bổ sung ảnh/ngành hàng chuẩn?`

    if (!window.confirm(confirmText)) return

    setHidingId(item.id)
    try {
      const res = await fetch(`${API_BASE_URL}/products/${item.id}/toggle-status`, {
        method: 'PUT',
      })
      if (res.ok) {
        await triggerAuditLog(`[CSKH AI-AUDIT] Đổi trạng thái sản phẩm "${item.name}" (ID: ${item.id}) sang ${nextStatus}`)
        alert(`✅ Đã ${isCurrentlyHidden ? 'mở khóa hiển thị' : 'tạm ẩn'} sản phẩm thành công!`)
        runAiAuditScan()
      } else {
        alert('Không thể cập nhật trạng thái sản phẩm.')
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    } finally {
      setHidingId(null)
    }
  }

  // Open Warning Notification Modal
  const openWarningModal = (item: any) => {
    const shop = shopsMap[item.shopId]
    const shopName = shop?.name || `Shop #${item.shopId?.slice(0, 8)}`
    const isImageMismatch = item.auditResult?.issueType === 'IMAGE_MISMATCH'

    setWarningModalItem(item)
    setWarningTitle(isImageMismatch ? `[Cảnh báo CSKH] Hình ảnh sản phẩm không khớp nội dung` : `[Cảnh báo CSKH] Sản phẩm sai phân loại ngành hàng`)
    
    if (isImageMismatch) {
      setWarningMessage(
        `Kính gửi ${shopName},\n\nBộ phận CSKH & Kiểm duyệt ZeroMall phát hiện sản phẩm "${item.name}" (Mã: ${item.id}) có hình ảnh minh họa không khớp với tiêu đề và mô tả.\n\nChi tiết đánh giá: ${item.auditResult?.imageFeedback || item.auditResult?.recommendation}\n\nVui lòng cập nhật hình ảnh đúng thực tế của sản phẩm trong vòng 24 giờ. Sau thời gian này, sản phẩm có thể bị tạm khóa hiển thị để bảo vệ quyền lợi người mua.\n\nTrân trọng,\nBộ phận CSKH ZeroMall`
      )
    } else {
      setWarningMessage(
        `Kính gửi ${shopName},\n\nBộ phận CSKH & Kiểm duyệt ZeroMall phát hiện sản phẩm "${item.name}" (Mã: ${item.id}) đang đăng bán trong danh mục "${item.category}" chưa phù hợp.\n\nĐề xuất điều chỉnh: Chuyển sang danh mục "${item.auditResult?.suggestedCategory || 'Danh mục chuẩn'}".\n\nVui lòng vào Kênh Người Bán để cập nhật lại danh mục đúng chuẩn.\n\nTrân trọng,\nBộ phận CSKH ZeroMall`
      )
    }
  }

  // Send Warning Notification to Shop Owner
  const handleSendWarning = async () => {
    if (!warningModalItem) return
    const shop = shopsMap[warningModalItem.shopId]
    const targetUserId = shop?.ownerId || warningModalItem.shopId

    setIsSendingWarning(true)
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          title: warningTitle,
          content: warningMessage,
          type: 'SYSTEM',
          metadata: {
            productId: warningModalItem.id,
            shopId: warningModalItem.shopId,
            sentBy: user?.email || 'cskh@zeromall.vn',
            issueType: warningModalItem.auditResult?.issueType
          }
        })
      })

      if (res.ok) {
        await triggerAuditLog(`[CSKH CẢNH BÁO SHOP] Đã gửi thông báo nhắc nhở Shop "${shop?.name || warningModalItem.shopId}" về sản phẩm "${warningModalItem.name}"`)
        alert('✅ Đã gửi thông báo cảnh báo thành công tới chủ gian hàng!')
        setWarningModalItem(null)
      } else {
        alert('Không thể gửi thông báo. Vui lòng thử lại.')
      }
    } catch (e: any) {
      alert('Lỗi khi gửi thông báo: ' + e.message)
    } finally {
      setIsSendingWarning(false)
    }
  }

  // Filtered flagged products
  const flaggedProducts = batchAudit?.flaggedProducts || []
  const filteredProducts = flaggedProducts.filter((item) => {
    // 1. Issue type filter
    if (filterIssue === 'WRONG_CATEGORY' && item.auditResult?.issueType !== 'WRONG_CATEGORY') return false
    if (filterIssue === 'IMAGE_MISMATCH' && item.auditResult?.issueType !== 'IMAGE_MISMATCH') return false

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = (item.name || '').toLowerCase().includes(q)
      const idMatch = (item.id || '').toLowerCase().includes(q)
      const shopName = (shopsMap[item.shopId]?.name || '').toLowerCase()
      const shopMatch = shopName.includes(q) || (item.shopId || '').toLowerCase().includes(q)
      if (!nameMatch && !idMatch && !shopMatch) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <h2 className="text-base font-black tracking-tight text-white uppercase">
                AI Category & Image Auditor (Hệ Thống Rà Soát Dành Cho CSKH)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/40 text-emerald-200 border border-emerald-400/30">
                Multimodal AI QC
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 font-medium max-w-2xl">
              Tự động đối soát hình ảnh thực tế, tiêu đề và phân loại ngành hàng. Hỗ trợ nhân viên CSKH nhanh chóng phát hiện sản phẩm sai lệch, sửa danh mục bằng 1-Click hoặc gửi nhắc nhở cho Shop.
            </p>
          </div>

          <button
            type="button"
            onClick={runAiAuditScan}
            disabled={isAuditing}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-sm"
          >
            <span>{isAuditing ? '⏳' : '⚡'}</span>
            <span>{isAuditing ? 'Đang Chạy AI Quét Toàn Sàn...' : 'Quét Lại Bằng AI'}</span>
          </button>
        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-700/50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Tổng Đã Quét</p>
            <p className="text-xl font-black text-white mt-0.5">{batchAudit?.totalScanned || 0}</p>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md rounded-xl p-3 border border-emerald-400/30">
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Khớp Chuẩn Xác</p>
            <p className="text-xl font-black text-emerald-200 mt-0.5">{batchAudit?.matchedCount || 0}</p>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-md rounded-xl p-3 border border-amber-400/30">
            <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Sai Ngành Hàng</p>
            <p className="text-xl font-black text-amber-200 mt-0.5">{batchAudit?.wrongCategoryCount || 0}</p>
          </div>
          <div className="bg-rose-500/20 backdrop-blur-md rounded-xl p-3 border border-rose-400/30">
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Lệch Ảnh & Tiêu Đề</p>
            <p className="text-xl font-black text-rose-200 mt-0.5">{batchAudit?.imageMismatchCount || 0}</p>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Sub-filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterIssue('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterIssue === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Tất cả phát hiện</span>
              <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[10px]">
                {batchAudit?.flaggedProducts?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setFilterIssue('WRONG_CATEGORY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterIssue === 'WRONG_CATEGORY'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <span>⚠️ Sai ngành hàng</span>
              <span className="px-1.5 py-0.2 bg-amber-600/30 rounded-full text-[10px]">
                {batchAudit?.wrongCategoryCount || 0}
              </span>
            </button>
            <button
              onClick={() => setFilterIssue('IMAGE_MISMATCH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                filterIssue === 'IMAGE_MISMATCH'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>🚨 Lệch ảnh & tiêu đề</span>
              <span className="px-1.5 py-0.2 bg-rose-700/30 rounded-full text-[10px]">
                {batchAudit?.imageMismatchCount || 0}
              </span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, ID, hoặc tên Shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Main Audit Results Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {isAuditing ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold">
              Mô hình AI đang đối chiếu hình ảnh thực tế, văn bản tiêu đề và danh mục đăng bán...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <span className="text-5xl">🎉</span>
            <p className="text-sm font-black text-slate-800">
              {searchQuery ? 'Không tìm thấy sản phẩm vi phạm phù hợp với từ khóa' : 'Không có sản phẩm nào vi phạm phân loại ngành hàng!'}
            </p>
            <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
              Tất cả sản phẩm đã được rà soát đều có hình ảnh và tiêu đề đồng nhất với danh mục ngành hàng đã chọn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4 min-w-[240px]">Sản Phẩm & Ảnh Bìa</th>
                  <th className="py-3.5 px-3 min-w-[160px]">Gian Hàng (Shop)</th>
                  <th className="py-3.5 px-3">Ngành Hàng Hiện Tại</th>
                  <th className="py-3.5 px-3 min-w-[280px]">AI Chẩn Đoán & Khuyến Nghị</th>
                  <th className="py-3.5 px-4 text-center min-w-[190px]">Nghiệp Vụ CSKH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => {
                  const shop = shopsMap[item.shopId]
                  const shopName = shop?.name || `Shop #${item.shopId?.slice(0, 8)}`
                  const res = item.auditResult
                  const isImageMismatch = res?.issueType === 'IMAGE_MISMATCH'
                  const isHidden = item.status === 'hidden'

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Cột 1: Sản phẩm & Ảnh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setImagePreview({ src: item.image, title: item.name })}
                            className="relative group shrink-0 cursor-pointer"
                            title="Click để phóng to ảnh"
                          >
                            <img
                              src={item.image || 'https://placehold.co/100x100?text=No+Image'}
                              alt={item.name}
                              className="w-14 h-14 object-cover rounded-xl border border-slate-200 shadow-2xs group-hover:scale-105 transition"
                            />
                            <span className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                              🔍 Phóng to
                            </span>
                          </button>
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-slate-900 line-clamp-2 hover:text-emerald-700 transition" title={item.name}>
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">ID: {item.id.slice(0, 10)}...</span>
                              {isHidden && (
                                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded text-[9px] font-black">
                                  ĐÃ ẨN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Gian hàng */}
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-slate-900">{shopName}</p>
                        {shop?.phoneNumber && (
                          <p className="text-[10px] text-slate-500 font-medium">📞 {shop.phoneNumber}</p>
                        )}
                        <a
                          href={`/shop/${item.shopId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline font-bold inline-flex items-center gap-1 mt-0.5"
                        >
                          <span>🏪</span> Xem Shop
                        </a>
                      </td>

                      {/* Cột 3: Ngành hàng hiện tại */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                          ❌ {item.category}
                        </span>
                      </td>

                      {/* Cột 4: AI Chẩn đoán */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isImageMismatch 
                                ? 'bg-rose-600 text-white' 
                                : 'bg-amber-500 text-white'
                            }`}>
                              {isImageMismatch ? '🚨 LỆCH ẢNH & TIÊU ĐỀ' : '⚠️ SAI NGÀNH HÀNG'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              Độ tin cậy: {res?.confidence || 90}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                            {res?.imageFeedback || res?.recommendation}
                          </p>
                          {res?.suggestedCategory && res?.suggestedCategory !== item.category && (
                            <p className="text-[11px] text-indigo-700 font-bold flex items-center gap-1.5">
                              <span>👉 Đề xuất chuyển sang:</span>
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-md font-extrabold text-indigo-800">
                                {res.suggestedCategory}
                              </span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Nghiệp vụ CSKH */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col gap-1.5 items-stretch justify-center max-w-[180px] mx-auto">
                          {/* 1-Click Fix Category */}
                          {res?.suggestedCategory && res?.suggestedCategory !== item.category && (
                            <button
                              type="button"
                              onClick={() => handleAutoFixCategory(item.id, res.suggestedCategory, item.name)}
                              disabled={fixingId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                              title={`Duyệt sửa sang ngành hàng ${res.suggestedCategory}`}
                            >
                              <span>{fixingId === item.id ? '⏳' : '⚡'}</span>
                              <span className="truncate">1-Click: Đổi sang {res.suggestedCategory}</span>
                            </button>
                          )}

                          {/* Gửi cảnh báo nhắc nhở Shop */}
                          <button
                            type="button"
                            onClick={() => openWarningModal(item)}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <span>🔔</span>
                            <span>Nhắc Nhở Shop</span>
                          </button>

                          {/* Tạm ẩn / Mở khóa sản phẩm */}
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(item)}
                            disabled={hidingId === item.id}
                            className={`px-3 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                              isHidden
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600'
                            }`}
                          >
                            <span>{isHidden ? '👁️' : '🚫'}</span>
                            <span>{isHidden ? 'Mở Khóa Hiển Thị' : 'Tạm Ẩn Khỏi Sàn'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Zoom Image Preview Modal */}
      {imagePreview && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 line-clamp-1">{imagePreview.title}</h3>
              <button 
                onClick={() => setImagePreview(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img 
                src={imagePreview.src} 
                alt={imagePreview.title} 
                className="object-contain max-h-[70vh] w-full"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CSKH Warning Notification Modal */}
      {warningModalItem && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setWarningModalItem(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="text-sm font-black text-slate-900">
                  Gửi Cảnh Báo Vi Phạm Cho Gian Hàng
                </h3>
              </div>
              <button 
                onClick={() => setWarningModalItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Tiêu đề thông báo
                </label>
                <input
                  type="text"
                  value={warningTitle}
                  onChange={(e) => setWarningTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nội dung nhắc nhở / Yêu cầu khắc phục
                </label>
                <textarea
                  rows={7}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWarningModalItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSendWarning}
                disabled={isSendingWarning}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>{isSendingWarning ? '⏳' : '🚀'}</span>
                <span>{isSendingWarning ? 'Đang gửi...' : 'Gửi Cảnh Báo Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
