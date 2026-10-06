import React, { useRef, useState } from 'react'
import { uploadImageToCloudinary } from '../../../services/cloudinary.service'

interface VariationOptionTagProps {
  groupIdx: number
  option: string
  image?: string
  onRemove: () => void
  onImageChange?: (imageUrl: string) => void
  onImageRemove?: () => void
}

export const VariationOptionTag: React.FC<VariationOptionTagProps> = ({
  groupIdx,
  option,
  image,
  onRemove,
  onImageChange,
  onImageRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageChange) return

    try {
      setIsUploading(true)
      setUploadPercent(0)
      const url = await uploadImageToCloudinary(file, (percent) => {
        setUploadPercent(percent)
      })
      onImageChange(url)
    } catch (err) {
      console.error('Lỗi tải ảnh biến thể:', err)
      alert('Không thể tải ảnh lên. Vui lòng thử lại!')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Nhóm 1 (hoặc khi có onImageChange) hỗ trợ ảnh phân loại theo chuẩn Shopee
  const isImageGroup = groupIdx === 0

  return (
    <div className="group relative flex items-center gap-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-2 pr-3 transition-all shadow-3xs hover:shadow-xs">
      {/* Input chọn file ẩn */}
      {isImageGroup && onImageChange && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {/* Ô Upload / Xem ảnh phân loại */}
      {isImageGroup && (
        <div className="relative shrink-0">
          {image ? (
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-50 shrink-0 group/img shadow-2xs">
              <img
                src={image}
                alt={option}
                className="w-full h-full object-cover"
              />
              {/* Overlay thay đổi / gỡ ảnh */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1 transition">
                <button
                  type="button"
                  title="Thay đổi ảnh"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 bg-white hover:bg-slate-100 text-slate-800 rounded-md text-[10px] font-bold cursor-pointer transition shadow-xs"
                >
                  ✎
                </button>
                {onImageRemove && (
                  <button
                    type="button"
                    title="Xóa ảnh"
                    onClick={(e) => {
                      e.stopPropagation()
                      onImageRemove()
                    }}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition shadow-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              title={`Bấm để tải ảnh cho phân loại "${option}"`}
              className="w-11 h-11 rounded-xl border-2 border-dashed border-emerald-400/80 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center shrink-0 transition cursor-pointer active:scale-95 shadow-3xs"
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[8px] font-bold text-emerald-600 mt-0.5">{uploadPercent}%</span>
                </div>
              ) : (
                <>
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-[8px] font-extrabold text-emerald-700 mt-0.5 tracking-tight">+ Ảnh</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tên tùy chọn */}
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
          {option}
        </span>
        {isImageGroup && !image && (
          <span className="text-[9px] text-emerald-600 font-medium">
            Chưa có ảnh
          </span>
        )}
        {isImageGroup && image && (
          <span className="text-[9px] text-slate-400 font-medium">
            Đã có ảnh
          </span>
        )}
      </div>

      {/* Nút xóa tùy chọn */}
      <button
        type="button"
        onClick={onRemove}
        title={`Xóa tùy chọn "${option}"`}
        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition cursor-pointer ml-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
