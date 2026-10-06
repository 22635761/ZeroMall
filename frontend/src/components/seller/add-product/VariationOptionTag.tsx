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

  // Nhóm 1 (groupIdx === 0) hỗ trợ ảnh phân loại theo chuẩn Shopee
  const isImageGroup = groupIdx === 0

  return (
    <div className="group relative flex items-center gap-2 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-1.5 pr-2.5 transition-all shadow-3xs hover:shadow-xs">
      {/* Ẩn input chọn file */}
      {isImageGroup && onImageChange && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {/* Thumbnail Upload cho nhóm 1 */}
      {isImageGroup && (
        <div className="relative">
          {image ? (
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-400 bg-slate-50 shrink-0 group/img">
              <img
                src={image}
                alt={option}
                className="w-full h-full object-cover"
              />
              {/* Overlay thay đổi / gỡ ảnh */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1 transition">
                <button
                  type="button"
                  title="Thay đổi ảnh"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded text-[9px] font-bold cursor-pointer transition"
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
                    className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded text-[9px] font-bold cursor-pointer transition"
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
              title={`Tải ảnh cho phân loại "${option}"`}
              className="w-9 h-9 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center shrink-0 transition cursor-pointer"
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[7px] font-bold text-emerald-600 mt-0.5">{uploadPercent}%</span>
                </div>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[7px] font-bold mt-0.2">+Ảnh</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tên tùy chọn */}
      <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
        {option}
      </span>

      {/* Nút xóa tùy chọn */}
      <button
        type="button"
        onClick={onRemove}
        title={`Xóa tùy chọn "${option}"`}
        className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition cursor-pointer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
