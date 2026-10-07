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
    <div className="space-y-6 text-left max-w-5xl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-black uppercase tracking-wider">
              <span>🚚</span> Gói Dịch Vụ Sàn Shopee / ZeroMall Standard
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Chương Trình Freeship Xtra
              {isEnrolled && (
                <span className="bg-emerald-500 text-slate-950 text-xs px-2.5 py-1 rounded-md font-black shadow-xs">
                  ĐANG KÍCH HOẠT
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/80 leading-relaxed font-normal">
              Trợ giá cước vận chuyển toàn quốc cho khách hàng. Đẩy mạnh tỉ lệ chuyển đổi đơn hàng,
              tăng trưởng lượt click vượt trội với huy hiệu Freeship Xtra độc quyền.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
            {isEnrolled ? (
              <button
                onClick={() => handleToggleEnrollment(false)}
                disabled={loading}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Hủy Gói Freeship Xtra'}
              </button>
            ) : (
              <button
                onClick={() => handleToggleEnrollment(true)}
                disabled={loading}
                className="px-7 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition shadow-xl cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : '⚡ Đăng Ký Tham Gia Ngay'}
              </button>
            )}
            <span className="text-[11px] text-teal-200/70 font-medium">
              {isEnrolled && enrolledAt
                ? `Kích hoạt từ: ${new Date(enrolledAt).toLocaleDateString('vi-VN')}`
                : 'Miễn phí hủy gói bất kỳ lúc nào'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Thẻ Lợi Ích & Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-xl font-black">
            🏷️
          </div>
          <h3 className="font-bold text-sm text-slate-900">Huy Hiệu Freeship Xtra</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tự động gắn huy hiệu xe tải xanh trên <b>{productsCount} sản phẩm</b> của Shop. Nổi bật trên trang chủ và bộ lọc tìm kiếm.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-black">
            📈
          </div>
          <h3 className="font-bold text-sm text-slate-900">Tăng Trưởng Doanh Số</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Khách hàng được áp mã giảm tới <b>35.000đ cước ship</b> cho đơn từ 0đ. Tỷ lệ chốt giỏ hàng tăng gấp 2 - 3 lần.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-2.5 shadow-3xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">
            🛡️
          </div>
          <h3 className="font-bold text-sm text-slate-900">Trần Phí An Toàn ({feeRate}%)</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Phí dịch vụ <b>{feeRate}%</b> giá trị sản phẩm và <b>giới hạn trần tối đa {formatPrice(maxFeeCap)}/sản phẩm</b>, bảo toàn tối đa lợi nhuận.
          </p>
        </div>
      </div>

      {/* Grid: Máy tính thử phí & Bảng quy định */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Máy tính mô phỏng chi phí */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🧮</span>
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
              Công Cụ Mô Phỏng Chi Phí Freeship Xtra
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-500 font-bold mb-1.5">
                Nhập giá bán sản phẩm thử nghiệm:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="10000"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:border-teal-500"
                />
                <span className="font-bold text-slate-600 text-sm">VNĐ</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Giá bán niêm yết:</span>
                <span className="font-bold text-slate-900">{formatPrice(calcPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-600">
                <span>Phí Freeship Xtra ({feeRate}% - tối đa {formatPrice(maxFeeCap)}):</span>
                <span className="font-bold">-{formatPrice(estimatedFee)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-emerald-700">
                <span>Doanh thu Shop thực nhận:</span>
                <span>{formatPrice(estimatedPayout)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Phí dịch vụ chỉ được sàn trừ khi đơn hàng hoàn thành (Escrow Release). Các đơn hủy hoặc đổi trả không bị tính phí.
            </p>
          </div>
        </div>

        {/* Bảng so sánh quyền lợi */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">⚖️</span>
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">
              So Sánh Shop Tham Gia vs Không Tham Gia
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-3">
              <span className="text-base text-teal-600">✅</span>
              <div>
                <b className="text-teal-950">Shop Có Đăng Ký Freeship Xtra:</b>
                <p className="text-teal-800 text-[11px] mt-0.5">
                  Khách áp được mã Freeship Extra hàng ngày (tối đa 35k). Lượng đơn tăng mạnh, khách yên tâm bấm mua không lo phí ship.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="text-base text-slate-400">⚪</span>
              <div>
                <b className="text-slate-800">Shop Không Đăng Ký Freeship Xtra:</b>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Không bị trừ phí dịch vụ 7%. Nhưng khách hàng chỉ được freeship khi sàn tung mã Toàn Sàn vào các dịp Siêu Sale lớn.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
