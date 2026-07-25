import React from 'react'

interface AddProductOtherTabProps {
  condition: string
  setCondition: (val: string) => void
  parentSku: string
  setParentSku: (val: string) => void
  isPreOrder: boolean
  setIsPreOrder: (val: boolean) => void
  preOrderDays: string
  setPreOrderDays: (val: string) => void
}

export const AddProductOtherTab: React.FC<AddProductOtherTabProps> = ({
  condition,
  setCondition,
  parentSku,
  setParentSku,
  isPreOrder,
  setIsPreOrder,
  preOrderDays,
  setPreOrderDays
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin khác</h3>

      <div className="grid grid-cols-2 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tình trạng</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 bg-white transition cursor-pointer"
          >
            <option value="new">Mới 100% (Nguyên seal/nguyên hộp)</option>
            <option value="used">Đã qua sử dụng (Like new, 99%, 95%...)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã SKU Sản Phẩm (Mã kho)</label>
          <input
            type="text"
            placeholder="Ví dụ: IP15-PROMAX-256G-BLK"
            value={parentSku}
            onChange={(e) => setParentSku(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      <div className="space-y-3 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-700">Hàng đặt trước (Pre-order)</h4>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Bật nếu bạn cần thời gian chuẩn bị hàng lâu hơn (từ 7-15 ngày) thay vì gửi hàng trong 2 ngày thông thường.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPreOrder(!isPreOrder)}
            className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              isPreOrder ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transition-transform duration-200 ${
              isPreOrder ? 'translate-x-5.5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        {isPreOrder && (
          <div className="flex items-center gap-3 mt-3.5 bg-white p-3.5 rounded-xl border border-slate-200 max-w-xs animate-in slide-in-from-top-2 duration-150">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Thời gian chuẩn bị:</label>
            <select
              value={preOrderDays}
              onChange={(e) => setPreOrderDays(e.target.value)}
              className="border border-slate-250 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white w-full cursor-pointer font-bold"
            >
              <option value="7">7 ngày</option>
              <option value="10">10 ngày</option>
              <option value="12">12 ngày</option>
              <option value="15">15 ngày</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
