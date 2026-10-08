import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ShopFreeshipXtraTabProps {
  shopDetails: any
  onShopUpdated: (updatedShop: any) => void
  productsCount: number
}

const formatPrice = (price: number) => (price || 0).toLocaleString('vi-VN') + 'đ'

export const ShopFreeshipXtraTab: React.FC<ShopFreeshipXtraTabProps> = ({
  shopDetails,
  onShopUpdated,
  productsCount
}) => {
  const [loading, setLoading] = useState(false)
  const [calcPrice, setCalcPrice] = useState<number>(250000)

  // Phân tích cài đặt vận chuyển từ shopDetails
  let parsedSettings: any = {}
  try {
    if (shopDetails?.shippingSettings) {
      parsedSettings = typeof shopDetails.shippingSettings === 'string'
        ? JSON.parse(shopDetails.shippingSettings)
        : shopDetails.shippingSettings
    }
  } catch (e) {
    parsedSettings = {}
  }

  const isEnrolled = Boolean(parsedSettings.hasFreeshipXtra)
  const enrolledAt = parsedSettings.freeshipXtraEnrolledAt
  const feeRate = parsedSettings.freeshipXtraRate || 7 // 7%
  const maxFeeCap = 30000 // Trần 30.000đ/sản phẩm

  // Tính thử phí trên máy tính
  const estimatedFee = Math.min(Math.round(calcPrice * (feeRate / 100)), maxFeeCap)
  const estimatedPayout = Math.max(0, calcPrice - estimatedFee)

  const handleToggleEnrollment = async (enroll: boolean) => {
    if (!shopDetails?.id) {
      alert('Không tìm thấy thông tin cửa hàng!')
      return
    }

    const confirmMsg = enroll
      ? `Bạn có chắc muốn ĐĂNG KÝ tham gia Gói Freeship Xtra?\n\n• Sản phẩm của Shop sẽ được gắn huy hiệu Freeship Xtra.\n• Khách hàng mua sắm sẽ được áp dụng mã giảm tối đa 35.000đ tiền ship.\n• Phí dịch vụ: ${feeRate}% (tối đa 30.000đ/sản phẩm) chỉ tính khi đơn giao thành công.`
      : 'Bạn có chắc chắn muốn HỦY tham gia Gói Freeship Xtra?\n\nSản phẩm của Shop sẽ mất huy hiệu xe tải xanh và khách hàng sẽ không thể áp mã Freeship Xtra khi mua hàng.'

    if (!window.confirm(confirmMsg)) return

    setLoading(true)
    try {
      const updatedSettings = {
        ...parsedSettings,
        hasFreeshipXtra: enroll,
        freeshipXtraRate: feeRate,
        freeshipXtraEnrolledAt: enroll ? new Date().toISOString() : null,
      }

      const res = await fetch(`${API_BASE_URL}/auth/shops/${shopDetails.id}/shipping-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingSettings: JSON.stringify(updatedSettings),
        }),
      })

      if (!res.ok) {
        throw new Error('Không thể cập nhật trạng thái gói Freeship Xtra.')
      }

      const updatedShop = await res.json()
      onShopUpdated(updatedShop)
      alert(enroll ? '🎉 Chúc mừng! Shop đã đăng ký thành công Gói Freeship Xtra.' : 'Đã hủy tham gia Gói Freeship Xtra.')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Lỗi khi cập nhật gói dịch vụ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 p-6 sm:p-8 lg:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-wider">
              <span>🚚</span> Gói Dịch Vụ Vận Chuyển ZeroMall Standard
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-3">
              Chương Trình Freeship Xtra
              {isEnrolled ? (
                <span className="bg-emerald-400 text-slate-950 text-xs px-3 py-1 rounded-lg font-black shadow-xs tracking-normal">
                  ✓ ĐANG KÍCH HOẠT
                </span>
              ) : (
                <span className="bg-slate-700/80 text-slate-200 text-xs px-3 py-1 rounded-lg font-bold shadow-xs tracking-normal border border-slate-600">
                  CHƯA THAM GIA
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/85 leading-relaxed font-normal">
              Trợ giá cước vận chuyển toàn quốc cho khách hàng. Đẩy mạnh tỉ lệ chuyển đổi đơn hàng,
              tăng trưởng lượt click vượt trội với huy hiệu Freeship Xtra độc quyền hiển thị trên toàn sàn.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start lg:items-end gap-3">
            {isEnrolled ? (
              <button
                onClick={() => handleToggleEnrollment(false)}
                disabled={loading}
                className="px-7 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>✕</span>
                <span>{loading ? 'Đang xử lý...' : 'Hủy Gói Freeship Xtra'}</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleEnrollment(true)}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 active:scale-98 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition shadow-xl cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>⚡</span>
                <span>{loading ? 'Đang xử lý...' : 'Đăng Ký Tham Gia Ngay'}</span>
              </button>
            )}
            <span className="text-xs text-teal-200/80 font-medium">
              {isEnrolled && enrolledAt
                ? `Kích hoạt từ: ${new Date(enrolledAt).toLocaleDateString('vi-VN')}`
                : 'Miễn phí kích hoạt và hủy gói bất kỳ lúc nào'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê & Lợi Ích Chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs hover:shadow-xs transition">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-black">
            🏷️
          </div>
          <h3 className="font-bold text-sm text-slate-900">Huy Hiệu Freeship Xtra</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tự động gắn huy hiệu xe tải xanh cho <b>{productsCount} sản phẩm</b> của Shop trên trang chủ & bộ lọc tìm kiếm.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs hover:shadow-xs transition">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
            📈
          </div>
          <h3 className="font-bold text-sm text-slate-900">Tăng Tỷ Lệ Chốt Đơn</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Khách hàng được áp mã giảm tới <b>35.000đ cước ship</b> cho đơn từ 0đ, kích cầu mua sắm mạnh mẽ.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs hover:shadow-xs transition">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">
            🛡️
          </div>
          <h3 className="font-bold text-sm text-slate-900">Trần Phí An Toàn ({feeRate}%)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Phí dịch vụ <b>{feeRate}%</b> giá trị sản phẩm và <b>giới hạn tối đa {formatPrice(maxFeeCap)}/sản phẩm</b>, bảo toàn lợi nhuận.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs hover:shadow-xs transition">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black">
            ⏱️
          </div>
          <h3 className="font-bold text-sm text-slate-900">Chỉ Tính Khi Giao Đạt</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Phí chỉ được trừ khi đơn hàng giao thành công. Các đơn hủy hoặc đổi trả hoàn tiền <b>hoàn toàn không mất phí</b>.
          </p>
        </div>
      </div>

      {/* Grid: Máy tính thử phí & Bảng so sánh quyền lợi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Máy tính mô phỏng chi phí */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <span className="text-xl">🧮</span>
            <div>
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
                Công Cụ Mô Phỏng Chi Phí Freeship Xtra
              </h3>
              <p className="text-xs text-slate-400 font-medium">Nhập thử giá bán để ước tính doanh thu thực nhận sau khi áp dụng gói</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1.5 text-xs">
                Nhập giá bán sản phẩm thử nghiệm (VNĐ):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <span className="font-bold text-slate-600 text-sm px-2">VNĐ</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/70 space-y-3 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium">Giá bán niêm yết:</span>
                <span className="font-bold text-slate-900">{formatPrice(calcPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-600">
                <span className="font-medium">Phí Freeship Xtra ({feeRate}% - tối đa {formatPrice(maxFeeCap)}):</span>
                <span className="font-bold">-{formatPrice(estimatedFee)}</span>
              </div>
              <div className="border-t border-slate-200/90 pt-3 flex justify-between items-center text-sm sm:text-base font-black text-emerald-700">
                <span>Doanh thu Shop thực nhận:</span>
                <span>{formatPrice(estimatedPayout)}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-800 leading-relaxed font-medium">
              💡 <strong>Lưu ý:</strong> Phí dịch vụ chỉ được sàn cấn trừ khi đơn hàng hoàn thành thành công (Escrow Release). Các đơn hủy hoặc đổi trả không bao giờ bị tính phí.
            </div>
          </div>
        </div>

        {/* Bảng so sánh quyền lợi */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
            <span className="text-xl">⚖️</span>
            <div>
              <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
                So Sánh Shop Tham Gia vs Không Tham Gia
              </h3>
              <p className="text-xs text-slate-400 font-medium">Đặc quyền hiển thị và ưu đãi vận chuyển dành cho người mua</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-3xs">
                ✓
              </span>
              <div className="space-y-1">
                <b className="text-teal-950 text-sm">Shop Có Đăng Ký Freeship Xtra:</b>
                <p className="text-teal-800/90 text-xs leading-relaxed font-medium">
                  Khách áp được mã Freeship Extra hàng ngày (tối đa 35k) ngay cả với đơn từ 0đ. Lượng đơn chốt nhanh gấp 2 - 3 lần do khách không ngần ngại về phí ship.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                —
              </span>
              <div className="space-y-1">
                <b className="text-slate-800 text-sm">Shop Không Đăng Ký Freeship Xtra:</b>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Không phát sinh phí dịch vụ {feeRate}%. Tuy nhiên sản phẩm không có huy hiệu xanh, khách mua hàng phải tự trả 100% phí ship trừ các dịp Siêu Sale toàn sàn.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FAQs & Chính Sách Gói Dịch Vụ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="text-lg">❓</span>
          <h3 className="font-bold text-sm text-slate-800">
            Câu Hỏi Thường Gặp Về Gói Freeship Xtra
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-1.5">
            <h4 className="font-bold text-slate-800">Khi nào Shop bị tính phí?</h4>
            <p className="text-slate-500 leading-relaxed">
              Phí {feeRate}% chỉ được tự động trừ khi đơn hàng hoàn tất thành công. Đơn bị hủy, bom hàng hoặc trả hàng hoàn tiền 100% không bị tính phí.
            </p>
          </div>
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-1.5">
            <h4 className="font-bold text-slate-800">Huy hiệu xuất hiện khi nào?</h4>
            <p className="text-slate-500 leading-relaxed">
              Ngay sau khi nhấn Đăng Ký, toàn bộ sản phẩm của Shop sẽ lập tức hiển thị huy hiệu Freeship Xtra trên kết quả tìm kiếm và trang chi tiết sản phẩm.
            </p>
          </div>
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-1.5">
            <h4 className="font-bold text-slate-800">Tôi có thể hủy bất cứ lúc nào?</h4>
            <p className="text-slate-500 leading-relaxed">
              Hoàn toàn được! Bạn có thể nhấn nút "Hủy Gói Freeship Xtra" bất kỳ lúc nào mà không phải chịu bất kỳ khoản phạt hay ràng buộc thời gian nào.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
