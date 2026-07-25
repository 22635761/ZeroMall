import React from 'react'

interface ShopApprovalStatusProps {
  shopDetails: any
  fetchShopDetails: () => void
  setShopDetails: React.Dispatch<React.SetStateAction<any>>
  onLogout: () => void
  onBackToHome: () => void
}

export const ShopApprovalStatus: React.FC<ShopApprovalStatusProps> = ({
  shopDetails,
  fetchShopDetails,
  setShopDetails,
  onLogout,
  onBackToHome
}) => {
  const shopStatus = shopDetails?.status || 'DRAFT'

  let parsedAddress: any = null
  let parsedShipping: any = { express: false, fast: false, saver: false, bulky: false }

  if (shopDetails?.pickupAddress) {
    try {
      parsedAddress = typeof shopDetails.pickupAddress === 'string'
        ? JSON.parse(shopDetails.pickupAddress)
        : shopDetails.pickupAddress
    } catch (e) {}
  }

  if (shopDetails?.shippingSettings) {
    try {
      parsedShipping = typeof shopDetails.shippingSettings === 'string'
        ? JSON.parse(shopDetails.shippingSettings)
        : shopDetails.shippingSettings
    } catch (e) {}
  }

  if (shopStatus === 'PENDING_APPROVAL') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
        {/* Header */}
        <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
              <span className="text-2xl">🌱</span>
              <span className="text-lg font-black tracking-tight text-slate-800">
                Zero<span className="text-emerald-600">Mall</span> 
                <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onLogout}
                className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
              >
                Đăng Xuất
              </button>
              <button 
                onClick={onBackToHome}
                className="text-xs font-semibold text-slate-500 hover:text-red-550 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
              >
                🏠 Thoát ra ngoài
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-2xl w-full mx-auto p-4 py-12 flex flex-col justify-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">
              ⏳
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-800">Đăng Ký Đang Chờ Phê Duyệt</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Cửa hàng <strong className="text-emerald-600 font-bold">{shopDetails?.name}</strong> của bạn đã gửi thông tin đăng ký thành công. Hệ thống đang tiến hành phê duyệt trong vòng 24h.
              </p>
            </div>

            {/* Details Summary */}
            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40 text-left text-xs font-semibold space-y-3.5 max-w-md mx-auto">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-1.5">Tóm tắt thông tin đăng ký</p>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Tên Cửa Hàng:</span>
                <span className="text-slate-800">{shopDetails?.name}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-800">{shopDetails?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-400">Số Điện Thoại:</span>
                <span className="text-slate-800">{shopDetails?.phoneNumber || 'N/A'}</span>
              </div>
              {parsedAddress && (
                <div className="flex justify-between items-start py-0.5 gap-4">
                  <span className="text-slate-400 shrink-0">Địa Chỉ Lấy Hàng:</span>
                  <span className="text-slate-800 text-right font-medium">
                    {parsedAddress.detailAddress}, {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start py-0.5 gap-4">
                <span className="text-slate-400 shrink-0">Vận Chuyển Đã Chọn:</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {parsedShipping.express && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Hỏa Tốc</span>}
                  {parsedShipping.fast && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Nhanh</span>}
                  {parsedShipping.saver && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Tiết Kiệm</span>}
                  {parsedShipping.bulky && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-sm text-[9px]">Hàng Cồng Kềnh</span>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 border-t border-slate-100 max-w-md mx-auto">
              <button
                onClick={fetchShopDetails}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                🔄 Kiểm tra trạng thái
              </button>
              <button
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Về Trang Mua Sắm
              </button>
            </div>
          </div>
        </main>

        <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
          © 2026 ZeroMall. Hệ Thống Duyệt Shop Tự Động.
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <span className="text-2xl">🌱</span>
            <span className="text-lg font-black tracking-tight text-slate-800">
              Zero<span className="text-emerald-600">Mall</span> 
              <span className="text-slate-400 font-normal text-sm ml-2">Kênh Người Bán</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
            >
              Đăng Xuất
            </button>
            <button 
              onClick={onBackToHome}
              className="text-xs font-semibold text-slate-500 hover:text-red-550 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
            >
              🏠 Thoát ra ngoài
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 py-12 flex flex-col justify-center animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-4xl mx-auto animate-pulse">
            ❌
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-800">Yêu Cầu Bị Từ Chối</h2>
            <p className="text-xs text-slate-455 leading-relaxed">
              Đăng ký mở cửa hàng <strong className="text-red-600 font-bold">{shopDetails?.name}</strong> của bạn đã bị từ chối do thông tin chưa chính xác hoặc thiếu minh chứng hợp lệ.
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold p-4 rounded-xl text-left leading-relaxed">
            ⚠️ Vui lòng cập nhật lại chính xác các thông tin như Số điện thoại liên hệ, Địa chỉ lấy hàng thực tế và kích hoạt các phương thức giao hàng đúng chuẩn để được phê duyệt nhanh nhất.
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShopDetails({ ...shopDetails, status: 'DRAFT' })}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
            >
              ✏️ Chỉnh sửa thông tin đăng ký
            </button>
            <button
              onClick={onBackToHome}
              className="w-full px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Về Trang Mua Sắm
            </button>
          </div>
        </div>
      </main>

      <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
        © 2026 ZeroMall. Kênh Người Bán.
      </footer>
    </div>
  )
}
