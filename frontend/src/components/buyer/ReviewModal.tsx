import React, { useState, useRef } from 'react'
import type { Order } from '../../models/order.model'

interface ReviewModalProps {
  isOpen: boolean
  order: Order
  user: any
  onClose: () => void
  onSubmit: (data: ReviewSubmitData) => Promise<void>
}

export interface ReviewSubmitData {
  rating: number
  comment: string
  images: string[]   // Cloudinary URLs
  videos: string[]   // Cloudinary video URLs
}

interface UploadedMedia {
  url: string
  type: 'image' | 'video'
  name: string
}

const STAR_LABELS = ['', 'Tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, order, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newMedia: UploadedMedia[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isVideo = file.type.startsWith('video/')
      const endpoint = isVideo
        ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
        : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

      try {
        const result = await new Promise<string>((resolve, reject) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('upload_preset', uploadPreset)

          const xhr = new XMLHttpRequest()
          xhr.open('POST', endpoint)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100))
            }
          }

          xhr.onload = () => {
            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText)
              resolve(data.secure_url)
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`))
            }
          }

          xhr.onerror = () => reject(new Error('Upload error'))
          xhr.send(formData)
        })

        newMedia.push({
          url: result,
          type: isVideo ? 'video' : 'image',
          name: file.name
        })
      } catch (err) {
        console.error('Upload error:', err)
        alert(`Lỗi upload ${file.name}`)
      }
    }

    setUploadedMedia(prev => [...prev, ...newMedia])
    setIsUploading(false)
    setUploadProgress(0)

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveMedia = (index: number) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (rating < 1) {
      alert('Vui lòng chọn số sao đánh giá!')
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        rating,
        comment: comment.trim() || 'Sản phẩm tốt',
        images: uploadedMedia.filter(m => m.type === 'image').map(m => m.url),
        videos: uploadedMedia.filter(m => m.type === 'video').map(m => m.url),
      })
    } catch (err: any) {
      alert('Lỗi gửi đánh giá: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <>
      <div className="fixed inset-0 bg-[#f5f5f5] z-50 overflow-y-auto flex flex-col font-sans text-left">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-3xs py-4 px-6 sm:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-[#ee4d2d] tracking-tight">ZeroMall</span>
              <span className="text-slate-350 font-light text-base">|</span>
              <span className="text-sm sm:text-base font-extrabold text-[#ee4d2d]">Đánh Giá Sản Phẩm</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer bg-slate-100 hover:bg-slate-200/80 px-4 py-2 rounded-lg transition"
          >
            ✕ Đóng
          </button>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-5 flex-1 pb-32">

          {/* Product Info Section */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
              Sản phẩm đã mua
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3 flex gap-4 items-center">
                  <img
                    src={item.image || item.productImage || 'https://placehold.co/80x80?text=SP'}
                    alt={item.name || item.productName}
                    className="w-16 h-16 object-cover border border-slate-200 rounded-lg shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-2">{item.name || item.productName}</h4>
                    {item.variant && item.variant !== 'Tiêu chuẩn' && item.variant !== 'Mặc định' && item.variant !== 'Default' && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Phân loại hàng: <span className="font-semibold text-slate-600">{item.variant}</span>
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Star Rating Section */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-5">
            <h3 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
              Chất lượng sản phẩm
            </h3>

            <div className="flex items-center gap-4 justify-center py-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <span className={`text-3xl transition-colors duration-150 ${
                      star <= displayRating ? 'text-yellow-400' : 'text-slate-200'
                    }`}>
                      ★
                    </span>
                  </button>
                ))}
              </div>
              <span className={`text-sm font-extrabold transition-colors duration-150 ${
                displayRating >= 4 ? 'text-yellow-500' : displayRating >= 3 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {STAR_LABELS[displayRating] || ''}
              </span>
            </div>
          </section>

          {/* Comment Section */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
              Nhận xét của bạn
            </h3>
            <div className="relative">
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 2000))}
                placeholder="Hãy chia sẻ nhận xét cho sản phẩm này bạn nhé!"
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-[#ee4d2d] transition placeholder-slate-400 resize-none"
              />
              <span className="absolute bottom-3 right-4 text-[10px] text-slate-400 font-bold">
                {comment.length}/2000
              </span>
            </div>
          </section>

          {/* Media Upload Section */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200/50 shadow-3xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 pb-3 border-b border-slate-100">
              Hình ảnh / Video đánh giá
            </h3>

            <div className="flex flex-wrap gap-3">
              {/* Uploaded media thumbnails */}
              {uploadedMedia.map((media, idx) => (
                <div key={idx} className="relative group">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt={media.name}
                      onClick={() => setLightboxUrl(media.url)}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-80 transition"
                    />
                  ) : (
                    <div className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden cursor-pointer" onClick={() => setLightboxUrl(media.url)}>
                      <video src={media.url} className="w-full h-full object-cover" muted />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-lg">▶</span>
                      </div>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-md hover:bg-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Upload button */}
              {uploadedMedia.length < 6 && (
                <label className="w-20 h-20 border-2 border-dashed border-slate-300 hover:border-[#ee4d2d] rounded-xl flex flex-col items-center justify-center cursor-pointer transition group">
                  {isUploading ? (
                    <div className="text-center">
                      <div className="w-5 h-5 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin mx-auto" />
                      <span className="text-[9px] text-[#ee4d2d] font-bold mt-1 block">{uploadProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xl text-slate-400 group-hover:text-[#ee4d2d] transition">📷</span>
                      <span className="text-[9px] text-slate-400 font-bold group-hover:text-[#ee4d2d] transition mt-0.5">
                        Thêm
                      </span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-medium">
              Thêm tối đa 6 ảnh hoặc video (ảnh sẽ được tải lên Cloudinary)
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 px-6 sm:px-12 z-40 shadow-2xs">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
            >
              Trở lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="px-10 py-3 bg-[#ee4d2d] hover:bg-[#d03d20] disabled:bg-slate-400 text-white font-extrabold rounded-xl text-sm shadow-md hover:shadow-lg transition duration-200 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang gửi...
                </span>
              ) : 'Hoàn thành'}
            </button>
          </div>
        </footer>
      </div>

      {/* Lightbox */}
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
          {lightboxUrl.includes('/video/') ? (
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
