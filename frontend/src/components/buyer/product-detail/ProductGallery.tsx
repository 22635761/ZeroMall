import React from 'react'

interface ProductGalleryProps {
  mediaItems: { type: 'image' | 'video'; url: string }[]
  activeImgIdx: number
  setActiveImgIdx: (idx: number) => void
  productName: string
  isLiked: boolean
  likeCount: number
  handleToggleLike: () => void
  getYouTubeId: (url: string) => string | null
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  mediaItems,
  activeImgIdx,
  setActiveImgIdx,
  productName,
  isLiked,
  likeCount,
  handleToggleLike,
  getYouTubeId
}) => {
  return (
    <div className="w-full lg:w-[42%] shrink-0 space-y-4">
      {/* Main Large Media Viewport */}
      <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-2xs relative flex items-center justify-center">
        {mediaItems[activeImgIdx]?.type === 'video' ? (
          (() => {
            const videoUrl = mediaItems[activeImgIdx].url
            const ytId = getYouTubeId(videoUrl)
            if (ytId) {
              return (
                <iframe
                  title="Product Video"
                  className="w-full h-full border-none"
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              )
            }
            return (
              <video
                src={videoUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            )
          })()
        ) : (
          <img
            src={mediaItems[activeImgIdx]?.url}
            alt={productName}
            className="w-full h-full object-cover transition duration-300"
          />
        )}
      </div>

      {/* Thumbnails Row */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImgIdx(idx)}
              className={`w-[72px] h-[72px] shrink-0 border-2 rounded-lg overflow-hidden transition cursor-pointer relative bg-slate-50 flex items-center justify-center ${
                idx === activeImgIdx ? 'border-[#ee4d2d]' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              {item.type === 'video' ? (
                <>
                  {(() => {
                    const ytId = getYouTubeId(item.url)
                    if (ytId) {
                      return (
                        <img
                          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                          className="w-full h-full object-cover opacity-80"
                          alt="Video cover"
                        />
                      )
                    }
                    return (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <span className="text-xl">🎥</span>
                      </div>
                    )
                  })()}
                  <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center transition hover:bg-slate-900/40">
                    <span className="text-white text-lg bg-black/60 rounded-full w-8 h-8 flex items-center justify-center shadow-xs">
                      ▶
                    </span>
                  </div>
                </>
              ) : (
                <img src={item.url} className="w-full h-full object-cover" alt="" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Social Share & Likes */}
      <div className="flex justify-between items-center pt-2 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <span className="font-medium">Chia sẻ:</span>
          <div className="flex gap-1.5 text-base">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">f</span>
            <span className="w-6 h-6 bg-sky-400 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">t</span>
            <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">p</span>
            <span className="w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-90">💬</span>
          </div>
        </div>
        <button
          onClick={handleToggleLike}
          className="flex items-center gap-1.5 hover:opacity-85 transition cursor-pointer font-medium"
        >
          <span className={`text-base ${isLiked ? 'text-red-500 scale-110' : 'text-slate-300'} transition`}>
            ♥
          </span>
          <span>Đã thích ({likeCount})</span>
        </button>
      </div>
    </div>
  )
}
