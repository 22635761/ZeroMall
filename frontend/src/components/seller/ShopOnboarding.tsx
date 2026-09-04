import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { ShopAddressModal } from './ShopAddressModal'

interface Address {
  fullName: string
  phoneNumber: string
  province: string
  district: string
  ward: string
  detailAddress: string
  ghnProvinceId?: number
  ghnDistrictId?: number
  ghnWardCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface ShopOnboardingProps {
  user: any
  initialShopDetails?: any
  onSuccess: (updatedShop: any) => void
  onBackToHome: () => void
}

export const ShopOnboarding: React.FC<ShopOnboardingProps> = ({
  user,
  initialShopDetails,
  onSuccess,
  onBackToHome
}) => {
  const [currentStep, setCurrentStep] = useState(1) // 1 to 5
  
  // Step 1: Shop Info states
  const [shopName, setShopName] = useState(() => {
    return initialShopDetails?.name || user?.shopName || ''
  })
  const [email, setEmail] = useState(() => {
    return initialShopDetails?.email || user?.email || ''
  })
  const [phone, setPhone] = useState(() => {
    return initialShopDetails?.phoneNumber || user?.phoneNumber || ''
  })
  const [pickupAddress, setPickupAddress] = useState<Address | null>(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        return typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
      } catch (e) {
        console.error('Error parsing initial pickup address:', e)
      }
    }
    return null
  })
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  
  // Step 2: Shipping states
  const [shippingMethods, setShippingMethods] = useState(() => {
    if (initialShopDetails?.shippingSettings) {
      try {
        return typeof initialShopDetails.shippingSettings === 'string'
          ? JSON.parse(initialShopDetails.shippingSettings)
          : initialShopDetails.shippingSettings
      } catch (e) {
        console.error('Error parsing initial shipping settings:', e)
      }
    }
    return {
      express: true, // Hỏa Tốc
      fast: true,    // Nhanh
      saver: true,   // Tiết kiệm
      bulky: false   // Hàng cồng kềnh
    }
  })
  
  // Handle Submit Onboarding
  const handleSubmitOnboarding = async () => {
    if (!user?.shopId) return
    try {
      const response = await fetch(`${API_BASE_URL}/auth/shops/${user.shopId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phoneNumber: phone,
          pickupAddress: JSON.stringify(pickupAddress),
          shippingSettings: JSON.stringify(shippingMethods)
        })
      })

      if (!response.ok) throw new Error('Không thể gửi thông tin đăng ký shop')
      const updatedShop = await response.json()
      onSuccess(updatedShop)
    } catch (err: any) {
      alert(`Đã xảy ra lỗi: ${err.message}`)
    }
  }

  const stepsList = [
    { num: 1, name: 'Thông tin Shop' },
    { num: 2, name: 'Cài đặt vận chuyển' },
    { num: 3, name: 'Thông tin thuế' },
    { num: 4, name: 'Thông tin định danh' },
    { num: 5, name: 'Hoàn tất' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
      {/* Mini Header */}
      <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <span className="text-2xl">🌱</span>
            <span className="text-lg font-black tracking-tight text-slate-800">
              Zero<span className="text-emerald-600">Mall</span> 
              <span className="text-slate-400 font-normal text-sm ml-2">Đăng Ký Người Bán</span>
            </span>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 transition cursor-pointer"
          >
            🏠 Thoát ra ngoài
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col justify-between">
          
          {/* Stepper Header */}
          <div className="bg-slate-50/50 border-b border-slate-100 p-6 sm:p-8">
            <div className="relative flex items-center justify-between">
              {/* Stepper Bar Background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-1"></div>
              {/* Active Progress Bar */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 -z-1"
                style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
              ></div>
              
              {stepsList.map((step) => {
                const isActive = step.num === currentStep
                const isCompleted = step.num < currentStep
                return (
                  <div key={step.num} className="flex flex-col items-center relative">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isActive 
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-md'
                          : isCompleted 
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : step.num}
                    </div>
                    <span 
                      className={`text-[9px] sm:text-[10px] font-bold mt-2 uppercase tracking-wider text-center max-w-[80px] leading-tight ${
                        isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stepper Content */}
          <div className="p-6 sm:p-10 min-h-[350px]">
            
            {/* STEP 1: SHOP INFO */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Cửa Hàng</h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Vui lòng cung cấp các thông tin cơ bản cho cửa hàng của bạn để người mua có thể liên lạc và vận chuyển đơn hàng.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shop Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên Shop <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      maxLength={30}
                      placeholder="Nhập tên shop..."
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                    <div className="text-[10px] text-slate-400 text-right">{shopName.length}/30</div>
                  </div>

                  {/* Pickup Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Địa chỉ lấy hàng <span className="text-red-500">*</span></label>
                    {pickupAddress ? (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex justify-between items-start">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-700">{pickupAddress.fullName} | {pickupAddress.phoneNumber}</p>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            {pickupAddress.detailAddress}, {pickupAddress.ward}, {pickupAddress.district}, {pickupAddress.province}
                          </p>
                          {pickupAddress.coordinates && (
                            <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-sm mt-1">
                              📍 Đã định vị
                            </span>
                          )}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Thay đổi
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="w-full border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-400 hover:text-emerald-600 transition"
                      >
                        <span className="text-xl">➕</span>
                        <span className="text-xs font-bold">Thêm địa chỉ lấy hàng mới</span>
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email liên hệ <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      placeholder="shop@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="09xxxxxxxx..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING SETTINGS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-black text-slate-800">Cài Đặt Phương Thức Vận Chuyển</h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Kích hoạt các phương thức vận chuyển phù hợp mà shop bạn có hỗ trợ giao nhận sản phẩm.
                  </p>
                </div>

                <div className="space-y-4 border border-slate-100 rounded-2xl p-5 bg-slate-50/20">
                  {/* Express */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Hỏa Tốc</p>
                      <p className="text-[10px] text-slate-400">Giao hàng cực nhanh trong vòng 1-2 tiếng</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.express}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, express: !prev.express }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Fast */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Nhanh</p>
                      <p className="text-[10px] text-slate-400">Phương thức giao hàng mặc định thông dụng nhất</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.fast}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, fast: !prev.fast }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Saver */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Tiết Kiệm</p>
                      <p className="text-[10px] text-slate-400 font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-sm px-1.5 py-0.5 w-fit scale-90 origin-left">Phổ biến nhất</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.saver}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, saver: !prev.saver }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Bulky */}
                  <div className="flex justify-between items-center py-2.5">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Hàng Cồng Kềnh</p>
                      <p className="text-[10px] text-slate-400">Dành riêng cho sản phẩm có kích thước lớn hoặc nặng</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.bulky}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, bulky: !prev.bulky }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TAX INFO (SKIPPED) */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-10">
                <span className="text-5xl">📄</span>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Thuế</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Theo quy định của sàn, thông tin thuế sẽ giúp tự động hóa hóa đơn và nghĩa vụ tài chính.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold p-3.5 rounded-xl mt-4">
                    ℹ️ Bước này hiện không bắt buộc trên môi trường Demo. Bạn có thể bấm <strong>Tiếp theo</strong> để bỏ qua.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: IDENTITY INFO (SKIPPED) */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-10">
                <span className="text-5xl">🆔</span>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Định Danh</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Xác minh căn cước công dân và thông tin chủ sở hữu doanh nghiệp để bảo mật tài khoản.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold p-3.5 rounded-xl mt-4">
                    ℹ️ Bước này hiện không bắt buộc trên môi trường Demo. Bạn có thể bấm <strong>Tiếp theo</strong> để bỏ qua.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: COMPLETION */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5 text-center">
                  <span className="text-5xl">🎉</span>
                  <h2 className="text-lg font-black text-slate-800 mt-2">Hoàn Tất Đăng Ký</h2>
                  <p className="text-xs text-slate-400">Xem lại tóm tắt thông tin shop của bạn trước khi gửi duyệt.</p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30 text-xs font-semibold space-y-3.5 max-w-xl mx-auto">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Tên Cửa Hàng:</span>
                    <span className="text-slate-800">{shopName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Email Shop:</span>
                    <span className="text-slate-800">{email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Số Điện Thoại:</span>
                    <span className="text-slate-800">{phone}</span>
                  </div>
                  <div className="flex justify-between items-start py-1 border-b border-slate-50 gap-4">
                    <span className="text-slate-400 shrink-0">Địa Chỉ Lấy Hàng:</span>
                    <span className="text-slate-800 text-right">
                      {pickupAddress?.detailAddress}, {pickupAddress?.ward}, {pickupAddress?.district}, {pickupAddress?.province}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-1 gap-4">
                    <span className="text-slate-400 shrink-0">Vận Chuyển Kích Hoạt:</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {shippingMethods.express && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Hỏa Tốc</span>}
                      {shippingMethods.fast && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Nhanh</span>}
                      {shippingMethods.saver && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Tiết Kiệm</span>}
                      {shippingMethods.bulky && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Hàng Cồng Kềnh</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Stepper Footer Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Quay lại
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    if (!shopName.trim() || !email.trim() || !phone.trim() || !pickupAddress) {
                      alert('Vui lòng hoàn thành tất cả thông tin và thêm địa chỉ lấy hàng trước khi tiếp tục!')
                      return
                    }
                  }
                  setCurrentStep((prev) => prev + 1)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Tiếp theo
              </button>
            ) : (
              <button
                onClick={handleSubmitOnboarding}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Gửi cho Admin duyệt 🚀
              </button>
            )}
          </div>

        </div>
      </main>

      {/* --- ADD / EDIT ADDRESS MODAL (MODULAR & CASCADING GHN DROPDOWNS) --- */}
      <ShopAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={(newAddr) => {
          setPickupAddress(newAddr)
        }}
        initialAddress={pickupAddress}
      />

      {/* Footer */}
      <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
        © 2026 ZeroMall. Hệ Thống Đăng Ký Người Bán Chuyên Nghiệp.
      </footer>
    </div>
  )
}
