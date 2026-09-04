import React, { useState } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

/**
 * Interface cho đơn hàng đã hoàn thành
 */
export interface CompletedShipment {
  id: string
  trackingNumber: string
  buyerName: string
  codAmount: number
}

/**
 * Props cho component DriverWalletTab
 */
export interface DriverWalletTabProps {
  driverProfile: any
  completedTasks: CompletedShipment[]
  codInWallet: number
  driverEarnings: number
  onRefresh: () => void
}

/**
 * Hàm định dạng tiền tệ VND
 */
const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const DriverWalletTab: React.FC<DriverWalletTabProps> = ({
  driverProfile,
  completedTasks,
  codInWallet,
  driverEarnings,
  onRefresh,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Hạn mức tiền mặt thu hộ tối đa (10 triệu VND)
  const COD_LIMIT = 10000000
  const usedPercentage = Math.min(100, Math.max(0, (codInWallet / COD_LIMIT) * 100))
  const remainingLimit = Math.max(0, COD_LIMIT - codInWallet)
  const isOverLimit = codInWallet >= COD_LIMIT
  const isNearLimit = codInWallet >= 8000000 && !isOverLimit

  /**
   * Chọn màu nền gradient dựa theo mức độ đạt hạn mức COD
   */
  const getGradientClass = () => {
    if (isOverLimit) {
      return 'bg-gradient-to-br from-rose-700 to-red-600 animate-pulse text-white shadow-red-200'
    }
    if (isNearLimit) {
      return 'bg-gradient-to-br from-amber-700 to-orange-600 text-white shadow-amber-200'
    }
    return 'bg-gradient-to-br from-emerald-700 to-teal-600 text-white shadow-emerald-200'
  }

  /**
   * Xử lý nộp tiền COD về bưu cục
   */
  const handleRemitCod = async () => {
    if (codInWallet <= 0) {
      alert('Hiện không có số dư COD nào cần nộp về bưu cục.')
      return
    }

    const isConfirmed = window.confirm(
      `Xác nhận nộp toàn bộ số tiền ${formatMoney(codInWallet)} thu hộ COD về bưu cục?`
    )
    if (!isConfirmed) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/drivers/${driverProfile?.id}/remit-cod`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: codInWallet,
            paymentMethod: 'CASH',
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Lỗi xử lý nộp tiền COD (${response.status})`)
      }

      alert(`✅ Nộp tiền COD thành công! Đã chuyển ${formatMoney(codInWallet)} về bưu cục.`)
      onRefresh()
    } catch (err: any) {
      alert(`❌ Nộp tiền COD thất bại: ${err.message || 'Lỗi kết nối máy chủ'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lấy 5 đơn hàng hoàn thành gần nhất
  const recentTasks = completedTasks.slice(0, 5)

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Thẻ số dư ví thu hộ COD */}
      <div className={`p-5 rounded-2xl shadow-lg transition-all ${getGradientClass()}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Ví Thu Hộ COD Đang Giữ
          </span>
          <span className="text-[11px] font-medium bg-black/20 backdrop-blur-sm px-2.5 py-1 rounded-full text-white">
            Hạn mức: {formatMoney(COD_LIMIT)}
          </span>
        </div>

        {/* Số tiền lớn */}
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight">
            {formatMoney(codInWallet)}
          </div>
        </div>

        {/* Thanh tiến độ hạn mức */}
        <div className="mt-4 space-y-1.5">
          <div className="w-full bg-black/25 h-2.5 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverLimit
                  ? 'bg-white'
                  : isNearLimit
                  ? 'bg-amber-200'
                  : 'bg-emerald-200'
              }`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-white/90">
            <span>Đã dùng: {usedPercentage.toFixed(1)}%</span>
            <span>Còn lại: {formatMoney(remainingLimit)}</span>
          </div>
        </div>

        {/* Cảnh báo / Lời nhắc */}
        <div className="mt-4 pt-3 border-t border-white/20 text-xs">
          {isOverLimit ? (
            <p className="font-semibold text-rose-100 flex items-start space-x-1.5">
              <span>⚠️</span>
              <span>
                CẢNH BÁO: Đã đạt hoặc vượt hạn mức COD giữ hộ! Vui lòng nộp tiền về bưu cục ngay để tiếp tục nhận đơn mới.
              </span>
            </p>
          ) : isNearLimit ? (
            <p className="text-amber-100 flex items-start space-x-1.5">
              <span>⚡</span>
              <span>
                Chú ý: Số tiền COD đang gần chạm hạn mức. Hãy sắp xếp nộp tiền về bưu cục sớm.
              </span>
            </p>
          ) : (
            <p className="text-white/80 flex items-start space-x-1.5">
              <span>💡</span>
              <span>
                Nộp tiền COD về bưu cục định kỳ trước khi đạt hạn mức 10.000.000đ.
              </span>
            </p>
          )}
        </div>

        {/* Nút nộp tiền COD */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleRemitCod}
            disabled={isSubmitting || codInWallet <= 0}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-md transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Đang xử lý nộp tiền...</span>
              </>
            ) : (
              <>
                <span>🏦</span>
                <span>Nộp Tiền COD Về Bưu Cục</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thẻ ước tính thu nhập */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ước Tính Thu Nhập
          </span>
          <span className="text-xl">💰</span>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-extrabold text-emerald-600">
              {formatMoney(driverEarnings)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Đã hoàn thành <span className="font-semibold text-slate-800">{completedTasks.length}</span> đơn giao
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ 15.000đ / đơn
            </span>
          </div>
        </div>
      </div>

      {/* Thẻ lịch sử giao hàng gần nhất */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span>📋</span>
            <span>Lịch Sử Giao Hàng Gần Nhất</span>
          </span>
          <span className="text-xs font-normal text-slate-400">
            {recentTasks.length > 0 ? `${recentTasks.length} đơn` : 'Trống'}
          </span>
        </h3>

        {recentTasks.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Chưa có đơn hàng nào hoàn thành
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-mono font-bold text-slate-800 truncate">
                    {task.trackingNumber}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate mt-0.5">
                    Khách: {task.buyerName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-slate-700 block">
                    COD: {formatMoney(task.codAmount)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Đã thu tiền
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
