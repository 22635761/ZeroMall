import React, { useState } from 'react'

interface Voucher {
  id: string
  shopId: string
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minSpend: number
  maxDiscount: number | null
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
}

interface ShopVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  shopId: string
  shopName: string
  shopItemsTotal: number
  allShopVouchers: Voucher[]
  selectedVoucherId?: string
  onSelectVoucher: (shopId: string, voucherId: string) => void
  formatPrice: (price: number) => string
}

export const ShopVoucherModal: React.FC<ShopVoucherModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  shopItemsTotal,
  allShopVouchers,
  selectedVoucherId,
  onSelectVoucher,
  formatPrice
}) => {
  const [inputCode, setInputCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [tempSelectedId, setTempSelectedId] = useState<string>(selectedVoucherId || '')

  if (!isOpen) return null

  const shopVouchers = allShopVouchers.filter(v => v.shopId === shopId)

  const handleApplyCode = () => {
    setCodeError(null)
    const trimmed = inputCode.trim().toUpperCase()
    if (!trimmed) return

    const matched = shopVouchers.find(v => v.code.toUpperCase() === trimmed)
    if (!matched) {
      setCodeError('Mã voucher không hợp lệ hoặc không thuộc Shop này!')
      return
    }

    if (shopItemsTotal < matched.minSpend) {
      setCodeError(`Đơn hàng của Shop chưa đạt mức tối thiểu ${formatPrice(matched.minSpend)}!`)
      return
    }

    setTempSelectedId(matched.id)
    setInputCode('')
  }

  const handleConfirm = () => {
    onSelectVoucher(shopId, tempSelectedId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/60 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh] text-left">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">Voucher của Shop</h3>
              <p className="text-[11px] text-emerald-600 font-bold">{shopName}</p>
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
              placeholder="Nhập mã voucher của Shop..."
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
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/20">
          {shopVouchers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-semibold leading-relaxed space-y-2">
              <span className="text-3xl block mb-2">🏷️</span>
              <p>Hiện Shop chưa có mã giảm giá nào.</p>
              <p className="text-[10px] text-slate-400 font-normal">Hãy theo dõi Shop để nhận ưu đãi sớm nhất khi có chương trình khuyến mãi nhé!</p>
            </div>
          ) : (
            shopVouchers.map((voucher) => {
              const isSelected = tempSelectedId === voucher.id
              const isMinSpendMet = shopItemsTotal >= voucher.minSpend
              
              return (
                <div
                  key={voucher.id}
                  onClick={() => {
                    if (isMinSpendMet) {
                      setTempSelectedId(isSelected ? '' : voucher.id)
                    }
                  }}
                  className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 transition cursor-pointer relative ${
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
                    <div className="text-left text-xs space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 tracking-wide">{voucher.name || `Mã: ${voucher.code}`}</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                          {voucher.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-bold">
                        Giảm {voucher.type === 'percentage' ? `${voucher.value}%` : formatPrice(voucher.value)}
                        {voucher.maxDiscount && ` (Tối đa ${formatPrice(voucher.maxDiscount)})`}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Đơn tối thiểu: {formatPrice(voucher.minSpend)}
                      </p>
                      {!isMinSpendMet && (
                        <p className="text-[10px] text-rose-500 font-semibold">
                          Mua thêm {formatPrice(voucher.minSpend - shopItemsTotal)} để áp dụng
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {isMinSpendMet && (
                    <div className="flex items-center justify-center shrink-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                        isSelected 
                          ? 'bg-emerald-600 border-emerald-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          {tempSelectedId && (
            <button
              onClick={() => setTempSelectedId('')}
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
