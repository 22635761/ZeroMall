import React, { useState } from 'react'

interface ProductReviewsSectionProps {
  user: any
  onOpenLogin: () => void
  showReviewForm: boolean
  setShowReviewForm: (show: boolean) => void
  reviewRating: number
  setReviewRating: (rating: number) => void
  reviewComment: string
  setReviewComment: (comment: string) => void
  isSubmittingReview: boolean
  reviewSuccessMsg: string
  handleReviewSubmit: (e: React.FormEvent) => void
  averageRating: string
  reviews: any[]
  activeReviewFilter: string
  setActiveReviewFilter: (filter: string) => void
  isLoadingReviews: boolean
  filteredReviews: any[]
  formatDate: (dateStr: string) => string
}

const parseReviewImages = (images: string | null | undefined): string[] => {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  user,
  onOpenLogin,
  showReviewForm,
  setShowReviewForm: _setShowReviewForm,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  isSubmittingReview,
  reviewSuccessMsg,
  handleReviewSubmit,
  averageRating,
  reviews,
  activeReviewFilter,
  setActiveReviewFilter,
  isLoadingReviews,
  filteredReviews,
  formatDate
}) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  return (
    <>
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
          Đánh Giá Sản Phẩm (Từ người mua đã nhận hàng)
        </h2>
        {user ? (
          <button
            onClick={() => window.location.href = '/user/purchase'}
            className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-sm transition cursor-pointer shadow-3xs flex items-center gap-1"
          >
            <span>⭐ Đánh Giá Từ Đơn Mua</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 font-medium">
            Bạn cần{' '}
            <button
              onClick={onOpenLogin}
              className="text-[#ee4d2d] font-bold hover:underline cursor-pointer bg-transparent border-none p-0 inline"
            >
              đăng nhập
            </button>{' '}
            để đánh giá sản phẩm sau khi nhận hàng.
          </span>
        )}
      </div>
      
      {/* Collapse Write Review Form */}
      {showReviewForm && user && (
        <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
          <h3 className="font-bold text-slate-700 text-xs">✍ Đánh Giá Sản Phẩm Của Bạn</h3>
          
          {reviewSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 px-4 py-2.5 rounded-lg text-xs font-bold">
              {reviewSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Người Đánh Giá</label>
              <div className="w-full border border-slate-200 bg-slate-100/70 rounded-sm px-3 py-2 text-xs text-slate-700 font-bold select-none">
                {user?.name} ({user?.email})
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Số Sao Đánh Giá</label>
              <div className="flex gap-2 items-center h-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-xl focus:outline-none transition ${
                      star <= reviewRating ? 'text-yellow-500 scale-105' : 'text-slate-300 hover:text-yellow-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs text-slate-400 font-bold ml-2">({reviewRating} Sao)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 font-medium mb-1">Bình Luận / Nhận Xét</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Viết cảm nhận của bạn về sản phẩm..."
              rows={3}
              className="w-full border border-slate-350 bg-white rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#ee4d2d]"
              required
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="bg-[#ee4d2d] hover:bg-[#f05d40] disabled:bg-slate-400 text-white text-xs font-bold px-5 py-2.5 rounded-sm transition cursor-pointer shadow-sm"
            >
              {isSubmittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá Lên Database'}
            </button>
          </div>
        </form>
      )}
      
      {/* Rating Summary Dashboard */}
      <div className="bg-[#fffdfb] border border-[#f8eae0] p-5 rounded-xl flex flex-col md:flex-row gap-6 items-center">
        <div className="text-center md:border-r border-[#f8eae0] md:pr-10 shrink-0">
          <h3 className="text-2xl font-black text-[#ee4d2d] flex items-baseline justify-center gap-1">
            {averageRating} <span className="text-xs font-semibold text-slate-400">trên 5</span>
          </h3>
          <div className="flex text-yellow-500 justify-center text-sm mt-1 mb-1.5">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
        </div>
        
        {/* Filter Chips */}
        <div className="flex-1 flex flex-wrap gap-2 text-xs">
          {[
            { id: 'all', label: `Tất Cả (${reviews.length})` },
            { id: '5star', label: `5 Sao (${reviews.filter(r => r.rating === 5).length})` },
            { id: '4star', label: `4 Sao (${reviews.filter(r => r.rating === 4).length})` },
            { id: '3star', label: `3 Sao (${reviews.filter(r => r.rating === 3).length})` },
            { id: '2star', label: `2 Sao (${reviews.filter(r => r.rating === 2).length})` },
            { id: '1star', label: `1 Sao (${reviews.filter(r => r.rating === 1).length})` },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveReviewFilter(filter.id)}
              className={`px-4 py-2 border rounded-sm transition cursor-pointer font-medium ${
                activeReviewFilter === filter.id
                  ? 'border-[#ee4d2d] text-[#ee4d2d] bg-white shadow-3xs'
                  : 'border-slate-100 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="divide-y divide-slate-100">
        {isLoadingReviews ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            🔄 Đang tải các nhận xét từ database...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium">
            Không tìm thấy đánh giá nào trùng khớp trong database.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const mediaUrls = parseReviewImages(review.images)
            return (
              <div key={review.id} className="py-5 flex gap-4 items-start text-xs">
                {/* User Avatar */}
                <div className="w-[32px] h-[32px] rounded-full border border-slate-150 overflow-hidden shrink-0 bg-[#ee4d2d]/10 text-[#ee4d2d] flex items-center justify-center font-bold text-xs uppercase">
                  {review.username.slice(0, 1)}
                </div>
                
                {/* Review Content */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <p className="font-bold text-slate-700">{review.username}</p>
                    <div className="flex text-yellow-500 text-[10px] mt-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-[10px] flex gap-2">
                    <span>{formatDate(review.createdAt)}</span>
                    <span>|</span>
                    <span>Phân loại: {review.variant || 'Mặc định'}</span>
                  </p>
                  
                  <p className="text-slate-700 leading-relaxed font-normal">{review.comment}</p>

                  {/* Review images/videos gallery */}
                  {mediaUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mediaUrls.map((url: string, idx: number) => {
                        const isVideo = url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.webm')
                        return isVideo ? (
                          <div
                            key={idx}
                            className="relative w-[72px] h-[72px] rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:opacity-80 transition"
                            onClick={() => setLightboxUrl(url)}
                          >
                            <video src={url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="text-white text-sm">▶</span>
                            </div>
                          </div>
                        ) : (
                          <img
                            key={idx}
                            src={url}
                            alt={`Review ${idx + 1}`}
                            className="w-[72px] h-[72px] object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition"
                            onClick={() => setLightboxUrl(url)}
                          />
                        )
                      })}
                    </div>
                  )}
                  
                  {/* Shop Reply */}
                  {review.reply ? (
                    <div className="bg-[#f5f5f5] p-3.5 rounded-lg border-l-2 border-[#ee4d2d] space-y-1 mt-2.5">
                      <p className="font-bold text-slate-800">Phản Hồi Của Người Bán</p>
                      <p className="text-slate-600 leading-relaxed font-normal">{review.reply}</p>
                    </div>
                  ) : (
                    <div className="bg-[#f8f8f8] p-3 rounded-lg border-l-2 border-slate-300 space-y-1 mt-2.5">
                      <p className="font-bold text-slate-400">Hệ Thống Phản Hồi Tự Động</p>
                      <p className="text-slate-500 italic font-normal">Cảm ơn bạn đã tin tưởng mua sắm và dành thời gian đánh giá 5 sao cho ZeroMall nhé!</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>

    {/* Lightbox for review images/videos */}
    {lightboxUrl && (
      <div
        className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer"
        onClick={() => setLightboxUrl(null)}
      >
        <button
          onClick={() => setLightboxUrl(null)}
          className="absolute top-6 right-6 text-white/80 hover:text-white text-2xl font-bold cursor-pointer z-10"
        >
          ✕
        </button>
        {lightboxUrl.includes('/video/') || lightboxUrl.endsWith('.mp4') || lightboxUrl.endsWith('.webm') ? (
          <video
            src={lightboxUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <img
            src={lightboxUrl}
            alt="Review media"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        )}
      </div>
    )}
    </>
  )
}
