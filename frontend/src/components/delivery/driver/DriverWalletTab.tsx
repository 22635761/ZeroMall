import React, { useState } from 'react'
import { DriverRemitCodModal } from './DriverRemitCodModal'
import { DriverPayoutModal } from './DriverPayoutModal'

export interface CompletedShipment {
  id: string
  trackingNumber: string
  buyerName: string
  codAmount: number
}

export interface DriverWalletTabProps {
  driverProfile: any
  completedTasks: CompletedShipment[]
  codInWallet: number
  driverEarnings: number
  completedPickupCount?: number
  completedDeliveryCount?: number
  pickupEarnings?: number
  deliveryEarnings?: number
  onRefresh: () => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const DriverWalletTab: React.FC<DriverWalletTabProps> = ({
  driverProfile,
  completedTasks,
  codInWallet,
  driverEarnings: initialDriverEarnings,
  completedPickupCount = 0,
  completedDeliveryCount = 0,
  pickupEarnings = 0,
  deliveryEarnings = 0,
  onRefresh,
}) => {
  const [driverEarnings, setDriverEarnings] = useState<number>(initialDriverEarnings)
  const [showRemitModal, setShowRemitModal] = useState<boolean>(false)
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false)

  // Hạn mức tiền mặt thu hộ tối đa (10 triệu VND)
  const COD_LIMIT = 10000000
  const usedPercentage = Math.min(100, Math.max(0, (codInWallet / COD_LIMIT) * 100))
  const remainingLimit = Math.max(0, COD_LIMIT - codInWallet)
  const isOverLimit = codInWallet >= COD_LIMIT
  const isNearLimit = codInWallet >= 8000000 && !isOverLimit

  // Thưởng năng suất bậc thang theo chuẩn SPX Express
  const totalTasksToday = completedPickupCount + completedDeliveryCount
  const tier1Target = 15
  const tier2Target = 30
  const tier3Target = 50

  let currentTierBonus = 0
  if (totalTasksToday >= tier3Target) currentTierBonus = 120000
  else if (totalTasksToday >= tier2Target) currentTierBonus = 60000
  else if (totalTasksToday >= tier1Target) currentTierBonus = 25000

  const getCodGradient = () => {
    if (isOverLimit) return 'bg-gradient-to-br from-rose-800 to-red-600 text-white shadow-rose-200'
    if (isNearLimit) return 'bg-gradient-to-br from-amber-700 to-orange-600 text-white shadow-amber-200'
    return 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-slate-200'
  }

  // Lấy các phiếu nộp tiền gần đây từ localStorage
  const savedSlips = JSON.parse(localStorage.getItem('zm_hub_cashier_slips') || '[]')
  const myRecentSlips = savedSlips.filter((s: any) => s.driverPhone === driverProfile?.phone || s.driverName === driverProfile?.name).slice(0, 3)

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 text-left">
      
      {/* VÍ 1: VÍ THU HỘ TIỀN MẶT COD (CÔNG NỢ NỘP LẠI CHO BƯU CỤC) */}
      <div className={`p-5 rounded-3xl shadow-lg border border-white/10 transition-all ${getCodGradient()}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
            <span>🛡️</span> Ví Thu Hộ COD (Đang Giữ)
          </span>
          <span className="text-[10px] font-bold bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full text-white">
            Hạn mức: {formatMoney(COD_LIMIT)}
          </span>
        </div>

        {/* Số tiền thu hộ lớn */}
        <div className="mt-3.5">
          <div className="text-3xl font-black tracking-tight text-white">
            {formatMoney(codInWallet)}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Tiền mặt thu từ khách khi giao hàng • Cần nộp lại cho bưu cục
          </p>
        </div>

        {/* Thanh đo hạn mức */}
        <div className="mt-4 space-y-1.5">
          <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden p-0.5 backdrop-blur-xs">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isOverLimit ? 'bg-rose-400' : isNearLimit ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium text-slate-300">
            <span>Đã dùng: {usedPercentage.toFixed(1)}%</span>
            <span>Khả dụng còn lại: {formatMoney(remainingLimit)}</span>
          </div>
        </div>

        {/* Cảnh báo hạn mức */}
        {isOverLimit ? (
          <div className="mt-3 p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-[11px] text-rose-200 font-bold flex items-center gap-1.5">
            <span>⚠️</span> Đã chạm trần hạn mức! Bắt buộc nộp tiền COD để tiếp tục nhận đơn mới.
          </div>
        ) : isNearLimit ? (
          <div className="mt-3 p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl text-[11px] text-amber-200 font-medium flex items-center gap-1.5">
            <span>⚡</span> Cảnh báo: Tiền COD gần đạt hạn mức. Vui lòng nộp tiền về bưu cục sớm.
          </div>
        ) : null}

        {/* Danh sách đơn hàng đang giữ COD */}
        {completedTasks && completedTasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300">
            <span className="text-[10px] uppercase font-bold text-slate-400">Đơn hàng đang giữ tiền ({completedTasks.length}):</span>
            <div className="mt-1.5 space-y-1 max-h-24 overflow-y-auto">
              {completedTasks.map((t) => (
                <div key={t.id} className="flex justify-between items-center text-[10px] text-slate-300">
                  <span className="truncate max-w-[200px]">{t.trackingNumber} ({t.buyerName})</span>
                  <span className="font-mono text-amber-300 font-bold">{formatMoney(t.codAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút nộp tiền COD */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowRemitModal(true)}
            disabled={codInWallet <= 0}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🏦</span>
            <span>Nộp Tiền COD (VietQR / Quầy Bưu Cục)</span>
          </button>
        </div>
      </div>

      {/* VÍ 2: VÍ THU NHẬP & TIỀN LƯƠNG CỦA TÀI XẾ (DRIVER INCOME WALLET) */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shadow-3xs">
              💰
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                Ví Thu Nhập Của Bạn
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Thù lao nhận đơn & thưởng KPI</span>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
            Khả Dụng
          </span>
        </div>

        <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatMoney(driverEarnings + currentTierBonus)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Số dư tích lũy từ {totalTasksToday} đơn hoàn thành hôm nay
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPayoutModal(true)}
            disabled={(driverEarnings + currentTierBonus) <= 0}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-3xs transition cursor-pointer disabled:opacity-50"
          >
            💳 Rút Tiền 24/7
          </button>
        </div>

        {/* Bóc tách công lấy & công giao */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>📦</span> Lấy từ Shop
              </span>
              <span className="text-emerald-700">8.000đ/đơn</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-xs font-bold text-slate-800">{completedPickupCount} đơn</span>
              <span className="text-xs font-black text-emerald-700">{formatMoney(pickupEarnings)}</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1">
                <span>🛵</span> Giao tới Khách
              </span>
              <span className="text-emerald-700">8.000đ/đơn</span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="text-xs font-bold text-slate-800">{completedDeliveryCount} đơn</span>
              <span className="text-xs font-black text-emerald-700">{formatMoney(deliveryEarnings)}</span>
            </div>
          </div>
        </div>

        {/* BẢNG THƯỞNG KPI NĂNG SUẤT NGÀY (SPX DAILY INCENTIVE LADDER) */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 p-3.5 rounded-2xl space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <span>🎯</span> Thưởng Năng Suất Ca Hôm Nay
            </span>
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
              +{formatMoney(currentTierBonus)}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Mốc 1 */}
            <div className="flex items-center justify-between">
              <span className={totalTasksToday >= tier1Target ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                {totalTasksToday >= tier1Target ? '✓' : '○'} Mốc 1: Đạt {tier1Target} đơn
              </span>
              <span className="font-bold text-amber-900">+25.000đ</span>
            </div>
            {/* Mốc 2 */}
            <div className="flex items-center justify-between">
              <span className={totalTasksToday >= tier2Target ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                {totalTasksToday >= tier2Target ? '✓' : '○'} Mốc 2: Đạt {tier2Target} đơn
              </span>
              <span className="font-bold text-amber-900">+60.000đ</span>
            </div>
            {/* Mốc 3 */}
            <div className="flex items-center justify-between">
              <span className={totalTasksToday >= tier3Target ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                {totalTasksToday >= tier3Target ? '✓' : '○'} Mốc 3: Đạt {tier3Target} đơn
              </span>
              <span className="font-bold text-amber-900">+120.000đ</span>
            </div>
          </div>

          <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalTasksToday / tier3Target) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-amber-800 text-right">
            Đã hoàn thành <b>{totalTasksToday}/{tier3Target} đơn</b> hôm nay
          </p>
        </div>
      </div>

      {/* LỊCH SỬ NỘP TIỀN COD GẦN ĐÂY */}
      {myRecentSlips.length > 0 && (
        <div className="bg-white p-4.5 rounded-3xl shadow-sm border border-slate-200/90 space-y-3">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
            Biên Nhận Nộp Tiền COD Gần Đây
          </span>
          <div className="space-y-2">
            {myRecentSlips.map((slip: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">{slip.code}</div>
                  <div className="text-[10px] text-slate-500">{slip.remittedAt} • {slip.method}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-rose-600">{formatMoney(slip.amount)}</div>
                  <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                    {slip.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showRemitModal && (
        <DriverRemitCodModal
          driverProfile={driverProfile}
          codInWallet={codInWallet}
          onClose={() => setShowRemitModal(false)}
          onSuccess={() => {
            onRefresh()
          }}
        />
      )}

      {showPayoutModal && (
        <DriverPayoutModal
          driverProfile={driverProfile}
          driverEarnings={driverEarnings + currentTierBonus}
          onClose={() => setShowPayoutModal(false)}
          onSuccess={(withdrawn) => {
            setDriverEarnings(prev => Math.max(0, prev - withdrawn))
            alert(`✅ Đã gửi yêu cầu rút ${formatMoney(withdrawn)} về tài khoản ngân hàng thành công!`)
          }}
        />
      )}
    </div>
  )
}
