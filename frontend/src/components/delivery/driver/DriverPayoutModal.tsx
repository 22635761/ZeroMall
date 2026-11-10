import React, { useState } from 'react'

export interface DriverPayoutModalProps {
  driverProfile: any
  driverEarnings: number
  onClose: () => void
  onSuccess: (amount: number) => void
}

export const DriverPayoutModal: React.FC<DriverPayoutModalProps> = ({
  driverProfile,
  driverEarnings,
  onClose,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number>(driverEarnings)
  const [bankName, setBankName] = useState<string>('Vietcombank (VCB)')
  const [accountNumber, setAccountNumber] = useState<string>('0981000384729')
  const [accountHolder, setAccountHolder] = useState<string>((driverProfile?.name || 'NGUYEN VAN GIAO').toUpperCase())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState<any>(null)

  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  const handleWithdrawAll = () => {
    setAmount(driverEarnings)
  }

  const handleSubmitPayout = () => {
    if (amount <= 0 || amount > driverEarnings) {
      alert('Số tiền rút không hợp lệ hoặc vượt quá số dư khả dụng!')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      const receipt = {
        code: `PO-${Date.now().toString().slice(-8)}`,
        amount,
        bankName,
        accountNumber,
        accountHolder,
        time: new Date().toLocaleString('vi-VN'),
        fee: 0,
        netAmount: amount,
        status: 'ĐANG XỬ LÝ CHI TRẢ (NAPAS 247)'
      }
      setPayoutSuccess(receipt)
      setIsSubmitting(false)
      onSuccess(amount)
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4.5 flex justify-between items-center shadow-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">💳</span>
              <h3 className="font-black text-sm tracking-wide uppercase">Rút Thu Nhập Về Ngân Hàng</h3>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
              Ví Thu Nhập Tài Xế • Chuẩn SPX Payout 24/7
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1 text-xs">
          {payoutSuccess ? (
            <div className="space-y-4 text-center py-2 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                ✓
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">Lệnh Rút Tiền Đã Được Tiếp Nhận!</h4>
                <p className="text-xs text-slate-500 mt-1">Hệ thống NAPAS 247 đang chuyển tiền vào tài khoản của bạn</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Mã giao dịch:</span>
                  <span className="font-mono font-bold text-slate-800">{payoutSuccess.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Số tiền rút:</span>
                  <span className="font-black text-emerald-600 text-sm">{formatMoney(payoutSuccess.amount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Ngân hàng nhận:</span>
                  <span className="font-bold text-slate-800">{payoutSuccess.bankName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Số tài khoản:</span>
                  <span className="font-mono font-bold text-slate-800">{payoutSuccess.accountNumber}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                  <span className="font-black text-slate-800">{payoutSuccess.accountHolder}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Phí rút tiền:</span>
                  <span className="font-bold text-emerald-600">0đ (Miễn phí)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                Đóng & Về Màn Hình Chính
              </button>
            </div>
          ) : (
            <>
              {/* Thẻ số dư khả dụng */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                    Số Dư Thu Nhập Khả Dụng
                  </span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {formatMoney(driverEarnings)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleWithdrawAll}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition cursor-pointer shadow-3xs"
                >
                  Rút toàn bộ
                </button>
              </div>

              {/* Nhập số tiền rút */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Số Tiền Muốn Rút (VND):</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    max={driverEarnings}
                    min={50000}
                    step={10000}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:border-emerald-600 transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    đ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Hạn mức rút tối thiểu: 50.000đ • Tối đa: 20.000.000đ/ngày</p>
              </div>

              {/* Thông tin tài khoản thụ hưởng */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <span className="font-bold text-slate-700 block">Tài Khoản Ngân Hàng Thụ Hưởng:</span>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-medium block">Ngân hàng:</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Vietcombank (VCB)">Vietcombank (VCB) - Ngoại Thương Việt Nam</option>
                    <option value="VietinBank (CTG)">VietinBank (CTG) - Công Thương Việt Nam</option>
                    <option value="MBBank (MB)">MBBank (MB) - Quân Đội</option>
                    <option value="Techcombank (TCB)">Techcombank (TCB) - Kỹ Thương</option>
                    <option value="BIDV">BIDV - Đầu tư và Phát triển Việt Nam</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-medium block">Số tài khoản:</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 font-medium block">Tên chủ tài khoản (In hoa không dấu):</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 uppercase"
                  />
                </div>
              </div>

              {/* Ghi chú chu kỳ chi trả */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <span>💡</span> Chu kỳ chi trả SPX Logistics:
                </p>
                <p>
                  Tiền sẽ về tài khoản ngân hàng của bạn trong vòng <b>5 - 15 phút</b> thông qua cổng chuyển mạch NAPAS 247. Hoàn toàn miễn phí dịch vụ.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!payoutSuccess && (
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
              onClick={handleSubmitPayout}
              disabled={isSubmitting || amount <= 0 || amount > driverEarnings}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Đang xử lý rút tiền...</span>
                </>
              ) : (
                <>
                  <span>💳</span>
                  <span>Xác Nhận Rút {formatMoney(amount)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
