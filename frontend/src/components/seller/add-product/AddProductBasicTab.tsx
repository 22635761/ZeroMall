import React, { useState, useEffect, useCallback } from 'react'
import { findProhibitedKeyword } from '../../../utils/bannedWords'
import { AiModerationBadge } from '../ai/AiModerationBadge'
import type { AiModerationResponse } from '../../../services/ai-moderation.service'
import { auditProductCategory, type AuditCategoryResult } from '../../../services/ai-category-auditor.service'

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}

interface UploadedImage {
  id: string
  file: File
  url: string
  progress: number
  isCover: boolean
}

interface UploadedVideo {
  file: File | null
  url: string
  progress: number
  error: string | null
}

interface AddProductBasicTabProps {
  images: UploadedImage[]
  imageRatio: '1:1' | '3:4'
  setImageRatio: (ratio: '1:1' | '3:4') => void
  errors: Record<string, string>
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (id: string) => void
  setAsCover: (id: string) => void
  videoMode: 'upload' | 'link'
  setVideoMode: (mode: 'upload' | 'link') => void
  videoFile: UploadedVideo
  handleVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeVideo: () => void
  videoLink: string
  setVideoLink: (link: string) => void
  youtubeId: string | null
  productName: string
  setProductName: (name: string) => void
  category: string
  setCategory: (cat: string) => void
  categoriesList: any[]
  brand: string
  setBrand: (brand: string) => void
  description: string
  setDescription: (desc: string) => void
  aiModerationResult?: AiModerationResponse | null
  isAiChecking?: boolean
  onTriggerAiCheck?: () => void
}

export const AddProductBasicTab: React.FC<AddProductBasicTabProps> = ({
  images,
  imageRatio,
  setImageRatio,
  errors,
  handleImageChange,
  removeImage,
  setAsCover,
  videoMode,
  setVideoMode,
  videoFile,
  handleVideoChange,
  removeVideo,
  videoLink,
  setVideoLink,
  youtubeId,
  productName,
  setProductName,
  category,
  setCategory,
  categoriesList,
  brand,
  setBrand,
  description,
  setDescription,
  aiModerationResult,
  isAiChecking,
  onTriggerAiCheck: _onTriggerAiCheck
}) => {
  const [categoryAudit, setCategoryAudit] = useState<AuditCategoryResult | null>(null)

  const triggerAudit = useCallback(async () => {
    if (!productName || productName.trim().length < 3) {
      setCategoryAudit(null)
      return
    }

    try {
      const cover = images.find(img => img.isCover) || images[0]
      let coverUrl = cover?.url || ''
      if (cover?.file && (!coverUrl || coverUrl.startsWith('blob:'))) {
        try {
          coverUrl = await fileToBase64(cover.file)
        } catch {
          // ignore error
        }
      }

      const result = await auditProductCategory({
        name: productName,
        category: category || '',
        image: coverUrl,
      })
      setCategoryAudit(result)
    } catch (e) {
      console.error(e)
    }
  }, [productName, category, images])

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerAudit()
    }, 500)

    return () => clearTimeout(timer)
  }, [triggerAudit])

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin cơ bản</h3>

      
      {/* Product Images (Grid 0/9) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>* Hình ảnh sản phẩm</span>
            <span className="text-[10px] font-medium text-slate-400 normal-case">({images.length}/9 hình ảnh)</span>
          </label>
          
          {/* Ratio switcher */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setImageRatio('1:1')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                imageRatio === '1:1' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
              }`}
            >
              Hình ảnh tỷ lệ 1:1
            </button>
            <button
              type="button"
              onClick={() => setImageRatio('3:4')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                imageRatio === '3:4' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
              }`}
            >
              Hình ảnh tỷ lệ 3:4
            </button>
          </div>
        </div>

        {errors.images && (
          <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.images}</p>
        )}

        {/* Images Upload Grid */}
        <div className="grid grid-cols-5 gap-3.5 pt-1">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group bg-slate-50 border rounded-2xl overflow-hidden shadow-3xs flex items-center justify-center transition-all ${
                imageRatio === '1:1' ? 'aspect-square' : 'aspect-[3/4]'
              } ${img.isCover ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}
            >
              {img.url ? (
                <>
                  <img src={img.url} alt="product" className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600 transition cursor-pointer shadow-sm"
                      >
                        ✕
                      </button>
                    </div>

                    {!img.isCover && (
                      <button
                        type="button"
                        onClick={() => setAsCover(img.id)}
                        className="w-full bg-white/95 text-[9px] font-black text-slate-800 py-1 rounded-md hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                      >
                        Đặt làm ảnh bìa
                      </button>
                    )}
                  </div>

                  {img.isCover && (
                    <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                      Ảnh bìa
                    </span>
                  )}
                </>
              ) : (
                <div className="p-3 w-full text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin mx-auto"></div>
                  <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${img.progress}%` }}></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold block">{img.progress}%</span>
                </div>
              )}
            </div>
          ))}

          {images.length < 9 && (
            <label className={`border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer p-4 group transition-all ${
              imageRatio === '1:1' ? 'aspect-square' : 'aspect-[3/4]'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <span className="text-xl text-slate-400 group-hover:scale-115 group-hover:text-emerald-500 transition duration-150">🖼️</span>
              <span className="text-[10px] text-slate-400 font-bold mt-2 group-hover:text-emerald-500">
                Thêm hình ảnh
              </span>
              <span className="text-[8px] text-slate-300 font-medium mt-1">({images.length}/9)</span>
            </label>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="space-y-2 border-t border-slate-100 pt-5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Video sản phẩm <span className="text-[10px] font-medium text-slate-400 normal-case">(Tùy chọn)</span>
          </label>

          <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setVideoMode('upload')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                videoMode === 'upload' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
              }`}
            >
              Tải tệp video lên
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('link')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                videoMode === 'link' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
              }`}
            >
              Dùng Link YouTube/TikTok
            </button>
          </div>
        </div>

        {videoMode === 'upload' ? (
          <div className="grid grid-cols-3 gap-4">
            {videoFile.url ? (
              <div className="relative border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center col-span-2 shadow-2xs">
                <video src={videoFile.url} controls className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition shadow-md z-10 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : videoFile.progress > 0 ? (
              <div className="border border-slate-200 rounded-2xl p-6 text-center space-y-3 col-span-2 bg-slate-50/50 flex flex-col justify-center">
                <span className="animate-spin text-2xl mx-auto">⏳</span>
                <div className="w-1/2 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${videoFile.progress}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">Đang tải video lên Cloudinary... {videoFile.progress}%</p>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/20 transition duration-150 flex flex-col items-center justify-center col-span-2 group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <span className="text-2xl text-slate-400 group-hover:scale-115 group-hover:text-emerald-500 transition">🎥</span>
                <span className="text-[11px] text-slate-500 font-bold mt-2 group-hover:text-emerald-500">Tải video lên</span>
                <span className="text-[9px] text-slate-400 mt-1 max-w-xs leading-normal">
                  Kích thước tối đa 15Mb, định dạng MP4, độ dài 10s-60s.
                </span>
              </label>
            )}

            {videoFile.error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded-r-2xl text-[10px] font-semibold flex items-center justify-center">
                ⚠️ {videoFile.error}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <p className="text-[9px] text-slate-400 font-medium leading-normal">
                Dán đường dẫn đầy đủ của video YouTube hoặc TikTok. Video sẽ tải trực tiếp từ nguồn ngoài giúp tiết kiệm băng thông tối đa.
              </p>
            </div>

            {youtubeId ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-900 shadow-2xs">
                <iframe
                  title="Preview"
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1`}
                  allowFullScreen
                />
              </div>
            ) : videoLink.trim() ? (
              <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 text-center flex items-center justify-center text-[10px] font-semibold text-slate-400">
                Link chưa được nhận diện hoặc chưa hỗ trợ xem trước
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl border-dashed bg-slate-50/50 p-4 text-center flex items-center justify-center text-[10px] font-semibold text-slate-300">
                Chưa có link video
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="space-y-1.5 border-t border-slate-100 pt-5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Tên sản phẩm</label>
          <span className="text-[9px] text-slate-400 font-bold">{productName.length}/120</span>
        </div>
        {(() => {
          const isViolatedByAi = aiModerationResult?.isViolated;
          const isSafeByAi = aiModerationResult && !aiModerationResult.isViolated;
          const prohibitedMatch = !isSafeByAi ? findProhibitedKeyword(productName) : null;
          const isImageMismatch = categoryAudit?.issueType === 'IMAGE_MISMATCH';
          const hasError = isViolatedByAi || prohibitedMatch || errors.name || isImageMismatch;

          return (
            <>
              <input
                type="text"
                required
                placeholder="Nhập tên sản phẩm (Ví dụ: Áo bóng đá tuyển Việt Nam 2024 chất liệu thun mè thoáng khí)"
                value={productName}
                onChange={(e) => setProductName(e.target.value.substring(0, 120))}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition ${
                  hasError
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white'
                }`}
              />

              {/* ZeroAI Image Mismatch Alert - Sleek & Compact */}
              {categoryAudit && isImageMismatch && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200/90 rounded-xl text-xs text-rose-800 mt-1.5 animate-fadeIn shadow-3xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs shrink-0">⚠️</span>
                    <span className="truncate text-[11px] font-medium" title={categoryAudit.imageFeedback || categoryAudit.recommendation}>
                      {categoryAudit.imageFeedback || `Ảnh là ${categoryAudit.detectedVisual || 'khác'}, không khớp tên.`}
                    </span>
                  </div>
                  {categoryAudit.suggestedTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductName(categoryAudit.suggestedTitle!)
                        if (categoryAudit.suggestedCategory) {
                          setCategory(categoryAudit.suggestedCategory)
                        }
                      }}
                      className="shrink-0 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition shadow-3xs flex items-center gap-1"
                      title={`Đổi thành: ${categoryAudit.suggestedTitle}`}
                    >
                      <span>⚡ Đổi theo ảnh</span>
                    </button>
                  )}
                </div>
              )}

              {/* ZeroAI Moderation Result Badge */}
              <AiModerationBadge
                isLoading={!!isAiChecking}
                result={aiModerationResult || null}
                className="mt-1"
              />

              {/* Fallback warning if not yet checked by AI but caught by static regex */}
              {!aiModerationResult && prohibitedMatch && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 mt-1.5 shadow-2xs">
                  <span className="text-sm">🚫</span>
                  <span>
                    Tên sản phẩm chứa từ cấm: <strong className="underline text-rose-900 font-black">"{prohibitedMatch}"</strong>. Vui lòng sửa lại tên hoặc bấm "Thẩm định ngay" để AI đánh giá ngữ cảnh.
                  </span>
                </div>
              )}
              {errors.name && !isViolatedByAi && !prohibitedMatch && !isImageMismatch && (
                <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.name}</p>
              )}
            </>
          );
        })()}
      </div>

      {/* Category & Brand row */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Ngành hàng</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition cursor-pointer"
          >
            <option value="">-- Chọn ngành hàng phù hợp --</option>
            {categoriesList.map((cat, i) => {
              const catName = typeof cat === 'string' ? cat : cat.name
              const catId = typeof cat === 'string' ? cat : (cat.id || cat.name)
              return (
                <option key={catId || i} value={catName}>
                  {catName}
                </option>
              )
            })}
          </select>
          {errors.category && (
            <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.category}</p>
          )}

          {/* AI Category Suggestion - Sleek & Compact */}
          {categoryAudit && !categoryAudit.isMatched && categoryAudit.issueType === 'WRONG_CATEGORY' && categoryAudit.suggestedCategory && categoryAudit.suggestedCategory !== category ? (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 mt-1.5 text-xs animate-fadeIn shadow-3xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs shrink-0">💡</span>
                <span className="text-[11px] truncate">
                  AI đề xuất ngành: <strong>{categoryAudit.suggestedCategory}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCategory(categoryAudit.suggestedCategory)}
                className="shrink-0 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[10px] cursor-pointer transition shadow-3xs"
              >
                Áp dụng
              </button>
            </div>
          ) : !category && categoryAudit?.suggestedCategory ? (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] text-indigo-600 font-bold">💡 Gợi ý:</span>
              <button
                type="button"
                onClick={() => setCategory(categoryAudit.suggestedCategory)}
                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-bold cursor-pointer transition"
              >
                {categoryAudit.suggestedCategory}
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Thương hiệu</label>
          <input
            type="text"
            required
            placeholder="Ví dụ: OEM, Apple, Samsung, Sony..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
          {errors.brand && (
            <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.brand}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1 border-t border-slate-100 pt-5">
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Mô tả sản phẩm</label>
          <span className="text-[9px] text-slate-400 font-bold">{description.length}/3000</span>
        </div>
        {(() => {
          const prohibitedMatchDesc = findProhibitedKeyword(description);
          return (
            <>
              <textarea
                required
                rows={6}
                placeholder="Nhập thông tin chi tiết về sản phẩm (Tính năng, công dụng, chất liệu, thông số kỹ thuật chi tiết...)"
                value={description}
                onChange={(e) => setDescription(e.target.value.substring(0, 3000))}
                className={`w-full border rounded-xl px-4 py-3 text-xs focus:outline-none transition resize-none leading-relaxed ${
                  prohibitedMatchDesc || errors.description
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {prohibitedMatchDesc && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 mt-1.5 shadow-2xs">
                  <span className="text-sm">🚫</span>
                  <span>
                    Mô tả sản phẩm chứa từ cấm: <strong className="underline text-rose-900 font-black">"{prohibitedMatchDesc}"</strong>. Vui lòng sửa lại mô tả để tiếp tục đăng bán.
                  </span>
                </div>
              )}
              {errors.description && !prohibitedMatchDesc && (
                <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.description}</p>
              )}
            </>
          );
        })()}
      </div>

    </div>
  )
}
