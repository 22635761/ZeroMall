import React, { useState } from 'react'

interface PlatformVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  selectedVoucher: string
  onSelectVoucher: (voucherCode: string) => void
  itemsTotal: number
  platformVouchers: any[]
  formatPrice: (price: number) => string
}

export const PlatformVoucherModal: React.FC<PlatformVoucherModalProps> = ({
  isOpen,
  onClose,
  selectedVoucher,
  onSelectVoucher,
  itemsTotal,
  platformVouchers,
  formatPrice
}) => {
  const [inputCode, setInputCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [tempSelected, setTempSelected] = useState<string>(selectedVoucher || 'none')

  if (!isOpen) return null

  const handleApplyCode = () => {
    setCodeError(null)
    const code = inputCode.trim().toUpperCase()
    if (!code) return

    if (code === 'FREESHIP' || code === 'FREESHIPXTRA') {
      setTempSelected('freeship')
      setInputCode('')
      return
    }
    if (code === 'ZERO10' || code === 'DISCOUNT10' || code === 'ZEROPROMO10') {
      setTempSelected('discount10')
      setInputCode('')
      return
    }
    if (code === 'ZERO50' || code === 'DISCOUNT50K' || code === 'ZEROMALL50K') {
      if (itemsTotal < 300000) {
        setCodeError('Voucher này yêu cầu đơn hàng tối thiểu 300.000đ!')
        return
      }
      setTempSelected('discount50k')
      setInputCode('')
      return
    }

    // Check DB platform vouchers
    const matched = platformVouchers.find(v => v.code.toUpperCase() === code)
    if (matched) {
      if (itemsTotal < matched.minSpend) {
        setCodeError(`Đơn hàng chưa đạt mức tối thiểu ${formatPrice(matched.minSpend)}!`)
        return
      }
      setTempSelected(matched.code)
      setInputCode('')
      return
    }

    setCodeError('Mã giảm giá không tồn tại hoặc đã hết lượt sử dụng!')
  }

  const handleConfirm = () => {
    onSelectVoucher(tempSelected)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/60 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] text-left">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Chọn ZeroMall Voucher</h3>
              <p className="text-[11px] text-emerald-600 font-bold">Ưu đãi giảm giá & miễn phí vận chuyển toàn sàn</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Input Code Section */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-100 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã voucher ZeroMall (FREESHIP, ZERO10, ZEROMALL10K...)"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value)
                setCodeError(null)
              }}
              className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold uppercase placeholder:normal-case focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleApplyCode}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
            >
              Áp Dụng
            </button>
          </div>
          {codeError && (
            <p className="text-[11px] text-rose-500 font-bold mt-1.5">{codeError}</p>
          )}
        </div>
        
        {/* Vouchers List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-slate-50/20">
          
          {/* Section: Freeship */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🚚</span> Mã Miễn Phí Vận Chuyển
            </h4>
            <div
              onClick={() => setTempSelected(tempSelected === 'freeship' ? 'none' : 'freeship')}
              className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                tempSelected === 'freeship'
                  ? 'border-emerald-500 bg-emerald-50/30 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-black shrink-0 border border-teal-200">
                  🚚
                </div>
                <div className="text-left text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-800">Miễn Phí Vận Chuyển Toàn Sàn</span>
                    <span className="bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Freeship Extra
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-700 font-bold">Giảm tối đa 35.000đ phí vận chuyển</p>
                  <p className="text-[10px] text-slate-500">Đơn tối thiểu: 0đ • Áp dụng mọi phương thức</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                tempSelected === 'freeship' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
              }`}>
                {tempSelected === 'freeship' && <span className="text-[10px] font-bold">✓</span>}
              </div>
            </div>
          </div>

          {/* Section: Discount Vouchers */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🎁</span> Mã Giảm Giá Đơn Hàng
            </h4>
            <div className="space-y-2.5">
              
              {/* Discount 10% */}
              <div
                onClick={() => setTempSelected(tempSelected === 'discount10' ? 'none' : 'discount10')}
                className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                  tempSelected === 'discount10'
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black shrink-0 border border-emerald-200">
                    %
                  </div>
                  <div className="text-left text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800">Giảm 10% Toàn Sàn ZeroMall</span>
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                        ZERO10
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-bold">Giảm 10% tổng giá trị đơn hàng</p>
                    <p className="text-[10px] text-slate-500">Đơn tối thiểu: 0đ</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                  tempSelected === 'discount10' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                }`}>
                  {tempSelected === 'discount10' && <span className="text-[10px] font-bold">✓</span>}
                </div>
              </div>

              {/* Discount 50k */}
              {(() => {
                const isMinSpendMet = itemsTotal >= 300000
                return (
                  <div
                    onClick={() => {
                      if (isMinSpendMet) {
                        setTempSelected(tempSelected === 'discount50k' ? 'none' : 'discount50k')
                      }
                    }}
                    className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                      tempSelected === 'discount50k'
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-2xs'
                        : isMinSpendMet
                          ? 'border-slate-200 hover:border-slate-300 bg-white'
                          : 'border-slate-100 bg-slate-50/70 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-black shrink-0 border border-orange-200">
                        🔥
                      </div>
                      <div className="text-left text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">Voucher Đặc Quyền 50.000đ</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            ZERO50
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold">Giảm ngay 50.000đ</p>
                        <p className="text-[10px] text-slate-500">Đơn tối thiểu: 300.000đ</p>
                        {!isMinSpendMet && (
                          <p className="text-[10px] text-rose-500 font-semibold">
                            Mua thêm {formatPrice(300000 - itemsTotal)} để sử dụng mã này
                          </p>
                        )}
                      </div>
                    </div>
                    {isMinSpendMet && (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                        tempSelected === 'discount50k' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {tempSelected === 'discount50k' && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* DB Platform Vouchers */}
              {platformVouchers.map((v) => {
                const isSelected = tempSelected === v.code || tempSelected === v.id
                const isMinSpendMet = itemsTotal >= (v.minSpend || 0)

                return (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (isMinSpendMet) {
                        setTempSelected(isSelected ? 'none' : v.code)
                      }
                    }}
                    className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-2xs'
                        : isMinSpendMet
                          ? 'border-slate-200 hover:border-slate-300 bg-white'
                          : 'border-slate-100 bg-slate-50/70 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-black shrink-0 border border-emerald-200">
                        🏷️
                      </div>
                      <div className="text-left text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">{v.name}</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            {v.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          Giảm {v.type === 'percentage' ? `${v.value}%` : formatPrice(v.value)}
                          {v.maxDiscount && ` (Tối đa ${formatPrice(v.maxDiscount)})`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Đơn tối thiểu: {formatPrice(v.minSpend || 0)}
                        </p>
                        {!isMinSpendMet && (
                          <p className="text-[10px] text-rose-500 font-semibold">
                            Mua thêm {formatPrice(v.minSpend - itemsTotal)} để áp dụng
                          </p>
                        )}
                      </div>
                    </div>
                    {isMinSpendMet && (
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    )}
                  </div>
                )
              })}

            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {tempSelected !== 'none' && (
            <button
              onClick={() => setTempSelected('none')}
              className="text-xs text-slate-500 hover:text-rose-500 font-bold transition cursor-pointer"
            >
              Bỏ chọn
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Trở Lại
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition"
            >
              Đồng Ý
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
