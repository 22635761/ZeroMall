import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface CommissionSettingTabProps {
  commissionRate: number
  setCommissionRate: (rate: number) => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const CommissionSettingTab: React.FC<CommissionSettingTabProps> = ({
  commissionRate,
  setCommissionRate,
  triggerAuditLog
}) => {
  const [tempCommissionRate, setTempCommissionRate] = useState(commissionRate.toString())
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenConfirm = () => {
    const val = parseFloat(tempCommissionRate)
    if (isNaN(val) || val < 0 || val > 100) {
      alert('Mức chiết khấu phải từ 0% đến 100%!')
      return
    }
    if (val === commissionRate) {
      alert('Mức chiết khấu nhập vào trùng với mức chiết khấu hiện tại!')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmSave = async () => {
    const val = parseFloat(tempCommissionRate)
    setIsSaving(true)
    try {
      const res = await fetch(`${API_BASE_URL}/payments/commission-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: val })
      })
      if (res.ok) {
        await triggerAuditLog(`Thay đổi mức chiết khấu sàn từ ${commissionRate}% sang ${val}%`)
        setCommissionRate(val)
        setShowConfirmModal(false)
        alert(`Đã cập nhật mức chiết khấu sàn mới là ${val}% thành công!`)
      } else {
        alert('Lỗi cập nhật chiết khấu sàn!')
      }
    } catch (err: any) {
      alert('Lỗi: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="max-w-2xl bg-white border border-slate-200/60 rounded-2xl p-8 shadow-2xs space-y-6 text-left">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">⚙️ CẤU HÌNH CHIẾT KHẤU SÀN (%)</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">Mức chiết khấu áp dụng cho các đơn hàng phát sinh. Đơn hàng cũ sẽ giữ nguyên tỷ lệ tại thời điểm tạo đơn.</p>
        </div>

        <div className="bg-emerald-50/20 border border-emerald-500/10 rounded-xl p-5 flex items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Mức chiết khấu hiện tại</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{commissionRate}</span>
              <span className="text-lg font-bold text-slate-500">%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500">Mặc định ban đầu: 5.0%</span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Thay đổi mức chiết khấu mới (%)</label>
          <div className="flex items-center gap-3">
            <div className="relative rounded-lg shadow-3xs flex-1 max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="Nhập phần trăm chiết khấu"
                value={tempCommissionRate}
                onChange={(e) => setTempCommissionRate(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-extrabold focus:outline-hidden focus:border-emerald-500 focus:bg-white text-slate-800"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-slate-405 font-extrabold text-sm">%</span>
              </div>
            </div>

            <button
              onClick={handleOpenConfirm}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs hover:shadow-2xs transition-all active:scale-97"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-205 rounded-xl p-5 space-y-3.5 text-xs text-slate-500 font-semibold">
          <h4 className="font-extrabold text-slate-700 uppercase text-[10px] tracking-wider">💡 Gợi ý vận hành & Bảo lưu dữ liệu:</h4>
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Bảo lưu lịch sử đơn cũ</strong>: Việc điều chỉnh phần trăm chiết khấu sẽ <strong>chỉ có hiệu lực đối với các đơn hàng phát sinh sau thời điểm thay đổi</strong>. Các đơn hàng trước đó đã giải ngân sẽ được giữ nguyên mức chiết khấu ban đầu.</li>
            <li><strong>Đối với đơn hàng COD</strong>: Hệ thống sẽ tự động tính số tiền thực nhận cho Shop sau khi đã khấu trừ chiết khấu sàn.</li>
            <li><strong>Đối với đơn hàng ZeroPay / VietQR</strong>: Tiền thanh toán của khách sẽ đi qua ví sàn, sau đó sàn cộng phần tiền thực nhận tương ứng vào ví doanh thu của Shop.</li>
          </ul>
        </div>
      </div>

      {/* MODAL XÁC NHẬN THAY ĐỔI CHIẾT KHẤU SÀN */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <span>⚠️</span> XÁC NHẬN THAY ĐỔI CHIẾT KHẤU SÀN
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600">Tỷ lệ hiện tại:</span>
                <span className="text-slate-800 font-black text-sm">{commissionRate}%</span>
              </div>
              <div className="flex justify-between items-center font-bold border-t border-amber-200/40 pt-2">
                <span className="text-amber-800">Tỷ lệ mới sẽ áp dụng:</span>
                <span className="text-emerald-600 font-black text-lg">{tempCommissionRate}%</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              📌 <strong>Lưu ý quan trọng:</strong> Tỷ lệ chiết khấu mới (<strong>{tempCommissionRate}%</strong>) sẽ chỉ được áp dụng cho các đơn hàng phát sinh từ thời điểm này trở đi. Doanh thu chiết khấu của các đơn hàng cũ đã giải ngân sẽ <strong>giữ nguyên tỷ lệ ban đầu</strong> và không bị thay đổi trong báo cáo.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSaving}
                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs text-slate-600 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                {isSaving ? 'Đang lưu...' : '✓ Xác Nhận Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
