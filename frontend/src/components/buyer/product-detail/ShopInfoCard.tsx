import React from 'react'
import { useNavigate } from 'react-router-dom'

interface ShopInfoCardProps {
  product: any
  isLoadingShop: boolean
  shopDetails: any
  shopStats: any
  isFollowing: boolean
  followersCount: number
  handleToggleFollow: () => void
  onBackToHome: () => void
  formatCount: (num: any) => string
  formatJoinDuration: (dateStr: any) => string
}

export const ShopInfoCard: React.FC<ShopInfoCardProps> = ({
  product,
  isLoadingShop,
  shopDetails,
  shopStats,
  isFollowing,
  followersCount,
  handleToggleFollow,
  onBackToHome: _onBackToHome,
  formatCount,
  formatJoinDuration
}) => {
  const navigate = useNavigate()
  const shopId = product?.shopId || shopDetails?.id || '6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c'

  const goToShop = () => {
    navigate(`/shop/${shopId}`)
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 flex flex-col md:flex-row gap-6 mt-5 items-center">
      {/* Shop Avatar & Buttons */}
      <div className="flex gap-4 items-center pr-6 md:border-r border-slate-100 w-full md:w-auto shrink-0 justify-between md:justify-start">
        <div className="flex gap-3.5 items-center cursor-pointer group" onClick={goToShop}>
          <div className="w-[60px] h-[60px] rounded-full border border-slate-200 overflow-hidden shrink-0 bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:scale-105 transition">
            {shopDetails?.logo ? (
              <img
                src={shopDetails.logo}
                alt={shopDetails?.name || 'Shop Logo'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(shopDetails?.name || 'Z').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-600 transition">
              {isLoadingShop ? 'Đang tải...' : (shopDetails?.name || 'ZeroMall Store')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse"></span> Online 5 phút trước
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-1.5 text-[11px]">
          <button className="px-3 py-1.5 border border-[#ee4d2d]/30 text-[#ee4d2d] bg-[#feeee9]/25 hover:bg-[#feeee9]/55 font-bold rounded-sm cursor-pointer transition">
            💬 Chat Ngay
          </button>
          <button
            onClick={handleToggleFollow}
            className={`px-3 py-1.5 border rounded-sm font-bold cursor-pointer transition ${
              isFollowing
                ? 'border-emerald-600/30 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50/40'
                : 'border-[#ee4d2d]/30 text-[#ee4d2d] bg-[#feeee9]/25 hover:bg-[#feeee9]/55'
            }`}
          >
            {isFollowing ? '✓ Đang Theo Dõi' : '➕ Theo Dõi'}
          </button>
          <button onClick={goToShop} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-sm cursor-pointer transition">
            🏠 Xem Shop
          </button>
        </div>
      </div>

      {/* Shop Statistics grid */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-xs text-slate-500 w-full">
        <div className="flex justify-between">
          <span>Đánh Giá</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : formatCount(shopStats?.totalReviews)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tỉ Lệ Phản Hồi</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : `${shopDetails?.responseRate ?? 100}%`}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tham Gia</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : formatJoinDuration(shopDetails?.createdAt)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sản Phẩm</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : (shopStats?.totalProducts ?? 0)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Thời Gian Phản Hồi</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : (shopDetails?.responseTime ?? 'trong vài giờ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Người Theo Dõi</span>
          <span className="font-bold text-[#ee4d2d]">
            {isLoadingShop ? '...' : formatCount(followersCount)}
          </span>
        </div>
      </div>
    </div>
  )
}
