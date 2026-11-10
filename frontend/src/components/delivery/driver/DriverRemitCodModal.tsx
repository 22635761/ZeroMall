import React, { useState } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

export interface DriverRemitCodModalProps {
  driverProfile: any
  codInWallet: number
  onClose: () => void
  onSuccess: () => void
}

export const DriverRemitCodModal: React.FC<DriverRemitCodModalProps> = ({
  driverProfile,
  codInWallet,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER')
  const [bankRefCode, setBankRefCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remitSuccessSlip, setRemitSuccessSlip] = useState<any>(null)

  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  // Tài khoản Escrow SPX Logistics tiếp nhận tiền thu hộ COD
  const escrowAccount = '102874928172'
  const escrowBank = 'ICB' // VietinBank
  const memoText = `NOP COD ${driverProfile?.phone || driverProfile?.name || 'SHIPPER'}`
  const qrUrl = `https://img.vietqr.io/image/${escrowBank}-${escrowAccount}-compact2.png?amount=${codInWallet}&addInfo=${encodeURIComponent(memoText)}&accountName=ZEROMALL%20ESCROW%20LOGISTICS`

  const handleSubmitRemittance = async () => {
    if (codInWallet <= 0) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/drivers/${driverProfile?.id}/remit-cod`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: codInWallet,
            paymentMethod: method,
            proof: method === 'BANK_TRANSFER' ? bankRefCode.trim() || 'VIETQR_NAPAS' : 'CASH_AT_HUB_DESK',
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Không thể xử lý nộp tiền COD')
      }

      const resData = await response.json()
      
      // Tạo phiếu nộp tiền hoàn chỉnh
      const slip = {
        code: `REMIT-${driverProfile?.hub?.code || 'HUB'}-${Date.now().toString().slice(-6)}`,
        driverName: driverProfile?.name,
        driverPhone: driverProfile?.phone,
        hubName: driverProfile?.hub?.name || 'Bưu cục phát',
        amount: codInWallet,
        method: method === 'BANK_TRANSFER' ? 'Chuyển khoản VietQR' : 'Tiền mặt tại Quầy Bưu Cục',
        remittedAt: new Date().toLocaleString('vi-VN'),
        status: method === 'BANK_TRANSFER' ? 'ĐÃ ĐỐI SOÁT TỰ ĐỘNG' : 'CHỜ THỦ QUỸ BƯU CỤC XÁC NHẬN TIỀN MẶT',
        note: resData.message
      }
      
      // Lưu vào localStorage để Quầy Thu Ngân Bưu Cục đồng bộ
      const existingSlips = JSON.parse(localStorage.getItem('zm_hub_cashier_slips') || '[]')
      existingSlips.unshift(slip)
      localStorage.setItem('zm_hub_cashier_slips', JSON.stringify(existingSlips.slice(0, 50)))

      setRemitSuccessSlip(slip)
      onSuccess()
    } catch (e: any) {
      alert(`❌ Lỗi nộp tiền COD: ${e.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4.5 flex justify-between items-center shadow-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">🏦</span>
              <h3 className="font-black text-sm tracking-wide uppercase">Nộp Tiền Thu Hộ COD Về Sàn</h3>
            </div>
            <p className="text-[11px] text-slate-300 font-medium mt-0.5">
              Tài xế: <b>{driverProfile?.name}</b> • Bưu cục: <b>{driverProfile?.hub?.name || 'Bưu Cục SPX'}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">
          {remitSuccessSlip ? (
            /* Phiếu nộp tiền thành công (Biên lai đối soát COD) */
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                ✓
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Nộp Tiền COD Thành Công!</h4>
                <p className="text-xs text-slate-500 mt-1">Đã khởi tạo biên nhận đối soát dòng tiền về Bưu cục</p>
              </div>

              {/* Chi tiết phiếu */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Mã biên lai:</span>
                  <span className="font-black text-indigo-700">{remitSuccessSlip.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Số tiền nộp:</span>
                  <span className="font-black text-rose-600 text-sm">{formatMoney(remitSuccessSlip.amount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Hình thức:</span>
                  <span className="font-bold text-slate-800">{remitSuccessSlip.method}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Thời gian:</span>
                  <span className="font-medium text-slate-700">{remitSuccessSlip.remittedAt}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
                  <span className="font-black text-emerald-700">{remitSuccessSlip.status}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Thẻ số tiền cần nộp */}
              <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide block">
                    Tổng Tiền COD Cần Nộp Cuối Ca
                  </span>
                  <span className="text-2xl font-black text-rose-600 mt-1 block">
                    {formatMoney(codInWallet)}
                  </span>
                </div>
                <span className="text-2xl">💵</span>
              </div>

              {/* Lựa chọn phương thức nộp */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Chọn Phương Thức Nộp Tiền:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('BANK_TRANSFER')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      method === 'BANK_TRANSFER'
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">📱</span>
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-800">Chuyển Khoản VietQR</p>
                      <p className="text-[10px] text-slate-500">Khuyên dùng • Nhanh nhất</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('CASH')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      method === 'CASH'
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">🏢</span>
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-800">Nộp Tại Bưu Cục</p>
                      <p className="text-[10px] text-slate-500">Gặp trực tiếp Thủ quỹ</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Hướng dẫn chi tiết theo phương thức */}
              {method === 'BANK_TRANSFER' ? (
                <div className="bg-indigo-50/60 border border-indigo-200/80 p-4 rounded-2xl space-y-3 text-center">
                  <p className="text-xs font-bold text-indigo-950">
                    Quét mã VietQR chuyển khoản về Tài Khoản Escrow Sàn:
                  </p>
                  <div className="bg-white p-3 rounded-xl inline-block border border-indigo-200 shadow-xs">
                    <img src={qrUrl} alt="VietQR Escrow" className="w-48 h-48 mx-auto object-contain" />
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-0.5 font-medium">
                    <div>Ngân hàng: <b>VietinBank (ICB)</b></div>
                    <div>Số tài khoản: <b className="font-mono text-indigo-700">{escrowAccount}</b></div>
                    <div>Số tiền: <b className="text-rose-600">{formatMoney(codInWallet)}</b></div>
                    <div>Nội dung: <b className="text-indigo-800">{memoText}</b></div>
                  </div>

                  <div className="pt-2 text-left">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Mã tham chiếu / Mã giao dịch ngân hàng (nếu có):
                    </label>
                    <input
                      type="text"
                      value={bankRefCode}
                      onChange={(e) => setBankRefCode(e.target.value)}
                      placeholder="VD: FT2608129381..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl space-y-2 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-base">📋</span>
                    <span>Quy trình nộp tiền mặt tại Quầy Thu Ngân Bưu Cục:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-emerald-900 leading-relaxed font-medium">
                    <li>Bấm nút <b>"Khởi Tạo Phiếu Nộp Tiền Mặt"</b> bên dưới.</li>
                    <li>Đem toàn bộ tiền mặt <b>{formatMoney(codInWallet)}</b> đến bàn Thủ quỹ bưu cục <b>{driverProfile?.hub?.name || 'phụ trách'}</b>.</li>
                    <li>Thủ quỹ sẽ đếm tiền, bấm duyệt trên hệ thống và ký biên lai giao nhận tiền.</li>
                    <li>Hạn mức công nợ COD của bạn sẽ được giải phóng ngay lập tức.</li>
                  </ol>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!remitSuccessSlip && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmitRemittance}
              disabled={isSubmitting || codInWallet <= 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{method === 'BANK_TRANSFER' ? 'Xác Nhận Đã Chuyển Khoản' : 'Khởi Tạo Phiếu Nộp Tiền Mặt'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
