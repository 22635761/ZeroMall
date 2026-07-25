import React from 'react'

interface SepayPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  bankInfo: {
    bankId: string
    bankAcc: string
    bankName: string
  }
  qrUrl: string
  memo: string
  amount: number
}

export const SepayPaymentModal: React.FC<SepayPaymentModalProps> = ({
  isOpen,
  onClose,
  bankInfo,
  qrUrl,
  memo,
  amount
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#feeee9]/30 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <span className="font-extrabold text-slate-800 text-sm sm:text-base">Thanh Toán Chuyển Khoản</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">
          {/* QR Image */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl w-fit mx-auto shadow-sm">
            <img 
              src={qrUrl} 
              alt="VietQR Sepay" 
              className="w-56 h-56 mx-auto object-contain"
            />
          </div>

          {/* Status micro-animation */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 animate-pulse">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Hệ thống đang chờ quét mã chuyển khoản...</span>
          </div>

          {/* Bank Details Table */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-semibold text-slate-700 text-left space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Ngân hàng:</span>
              <span className="font-extrabold text-slate-800">{bankInfo.bankId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800">{bankInfo.bankAcc}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(bankInfo.bankAcc)
                    alert('Đã copy số tài khoản!')
                  }}
                  className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
              <span className="font-extrabold text-slate-800 uppercase">{bankInfo.bankName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Số tiền:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-red-650">{amount.toLocaleString('vi-VN')}đ</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(String(amount))
                    alert('Đã copy số tiền!')
                  }}
                  className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Nội dung CK:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-500/25 px-2 py-0.5 rounded text-sm sm:text-base font-mono">
                  {memo}
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(memo)
                    alert('Đã copy nội dung chuyển khoản!')
                  }}
                  className="text-sky-600 hover:underline font-bold text-[10px] cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-2xl p-4 text-[10px] font-medium text-amber-700 text-left leading-relaxed">
            ⚠️ <strong>Quan trọng:</strong> Vui lòng nhập chính xác <strong>Nội dung chuyển khoản ({memo})</strong> ở trên. Hệ thống sẽ tự động quét biến động số dư và xác nhận đơn hàng sau vài giây.
          </div>
        </div>
      </div>
    </div>
  )
}
