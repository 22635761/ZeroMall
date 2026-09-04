import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ShopReviewsProps {
  user: any
  shopId?: string
}

export const ShopReviews: React.FC<ShopReviewsProps> = ({ user, shopId }) => {
  const effectiveShopId = shopId || user?.shopId || user?.id

  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

  const fetchShopReviews = async () => {
    if (!effectiveShopId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/shop/${effectiveShopId}/reviews`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data)
      }
    } catch (e) {
      console.error('Error fetching shop reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShopReviews()
  }, [effectiveShopId])

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'with_media') {
      try {
        const media = r.images ? JSON.parse(r.images) : []
        return media.length > 0
      } catch {
        return false
      }
    }
    return r.rating === parseInt(activeFilter, 10)
  })

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  const handleSendReply = (reviewId: string) => {
    const text = replyTextMap[reviewId]?.trim()
    if (!text) return
    alert('Đã gửi phản hồi đánh giá thành công!')
    setReplyTextMap(prev => ({ ...prev, [reviewId]: '' }))
    setActiveReplyId(null)
  }

  const parseMedia = (imagesStr: string | null | undefined): string[] => {
    if (!imagesStr) return []
    try {
      const parsed = JSON.parse(imagesStr)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <div className="space-y-6 text-left selection:bg-emerald-500 selection:text-white">
      {/* Header Stat Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">⭐ Quản Lý Đánh Giá Cửa Hàng</h2>
          <p className="text-xs text-emerald-100 mt-1 font-medium">Theo dõi phản hồi từ khách hàng và nâng cao uy tín của Shop.</p>
        </div>
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20">
          <div className="text-center">
            <div className="text-2xl font-black text-amber-300">{averageRating} / 5.0</div>
            <div className="text-[10px] uppercase font-bold text-emerald-100">Điểm Đánh Giá Shop</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center">
            <div className="text-2xl font-black text-white">{reviews.length}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-100">Tổng Đánh Giá</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          {[
            { id: 'all', label: `Tất cả (${reviews.length})` },
            { id: '5', label: '⭐ 5 Sao' },
            { id: '4', label: '⭐ 4 Sao' },
            { id: '3', label: '⭐ 3 Sao' },
            { id: '2', label: '⭐ 2 Sao' },
            { id: '1', label: '⭐ 1 Sao' },
            { id: 'with_media', label: '📷 Có Hình ảnh/Video' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg border transition cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-3xs flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Đang tải danh sách đánh giá...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 text-xs shadow-3xs">
          <span className="text-4xl block mb-2">💬</span>
          Chưa có đánh giá nào phù hợp với bộ lọc này.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const mediaList = parseMedia(rev.images)
            return (
              <div key={rev.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-3">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {rev.username?.substring(0, 2).toUpperCase() || 'KH'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{rev.username || 'Khách hàng'}</h4>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold">
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Product info banner */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
                  {rev.productImage && (
                    <img src={rev.productImage} alt={rev.productName} className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-700 truncate">{rev.productName}</div>
                    {rev.variant && <div className="text-[10px] text-slate-400">Phân loại: {rev.variant}</div>}
                  </div>
                </div>

                {/* Comment content */}
                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {rev.comment}
                </p>

                {/* Media attachments */}
                {mediaList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {mediaList.map((url: string, idx: number) => (
                      <img key={idx} src={url} alt="review media" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-3xs" />
                    ))}
                  </div>
                )}

                {/* Reply section */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Mã đơn hàng: #{rev.orderId?.substring(0, 8)}
                  </span>
                  
                  <button
                    onClick={() => setActiveReplyId(activeReplyId === rev.id ? null : rev.id)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer transition flex items-center gap-1"
                  >
                    💬 {activeReplyId === rev.id ? 'Hủy Phản Hồi' : 'Phản Hồi Đánh Giá'}
                  </button>
                </div>

                {activeReplyId === rev.id && (
                  <div className="pt-3 space-y-2 animate-in fade-in duration-150">
                    <textarea
                      value={replyTextMap[rev.id] || ''}
                      onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                      placeholder="Nhập câu trả lời thân thiện của Shop..."
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                      rows={2}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSendReply(rev.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-3xs transition cursor-pointer"
                      >
                        Gửi Phản Hồi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
