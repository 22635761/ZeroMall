import React from 'react'

interface AddProductShippingTabProps {
  weight: string
  setWeight: (val: string) => void
  length: string
  setLength: (val: string) => void
  width: string
  setWidth: (val: string) => void
  height: string
  setHeight: (val: string) => void
  shippingProviders: { spx: boolean; ghtk: boolean; ghn: boolean }
  setShippingProviders: React.Dispatch<React.SetStateAction<{ spx: boolean; ghtk: boolean; ghn: boolean }>>
  getShippingCost: (base: number) => number
  errors: Record<string, string>
}

export const AddProductShippingTab: React.FC<AddProductShippingTabProps> = ({
  weight,
  setWeight,
  length,
  setLength,
  width,
  setWidth,
  height,
  setHeight,
  shippingProviders,
  setShippingProviders,
  getShippingCost,
  errors
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Vận chuyển</h3>

      <div className="grid grid-cols-4 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">* Cân nặng sau đóng gói</label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              required
              placeholder="Cân nặng..."
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
            />
            <span className="text-[10px] font-extrabold text-slate-400">gr</span>
          </div>
          {errors.weight && (
            <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.weight}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kích thước Dài (cm)</label>
          <input
            type="number"
            placeholder="Dài..."
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rộng (cm)</label>
          <input
            type="number"
            placeholder="Rộng..."
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cao (cm)</label>
          <input
            type="number"
            placeholder="Cao..."
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700">Đơn vị vận chuyển liên kết</h4>
        
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={shippingProviders.spx}
                onChange={(e) => setShippingProviders(prev => ({ ...prev, spx: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">SPX Express</p>
                <p className="text-[9px] text-slate-400 font-medium">Đối tác vận chuyển hỏa tốc và giao nhanh tiêu chuẩn của Shopee</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-emerald-600">
                {getShippingCost(15000) > 0 ? `${getShippingCost(15000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
              </span>
              <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={shippingProviders.ghtk}
                onChange={(e) => setShippingProviders(prev => ({ ...prev, ghtk: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Giao Hàng Tiết Kiệm (GHTK)</p>
                <p className="text-[9px] text-slate-400 font-medium">Bảo đảm giao hàng liên tỉnh nhanh chóng trong 24-48h</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-emerald-600">
                {getShippingCost(18000) > 0 ? `${getShippingCost(18000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
              </span>
              <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={shippingProviders.ghn}
                onChange={(e) => setShippingProviders(prev => ({ ...prev, ghn: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">Giao Hàng Nhanh (GHN)</p>
                <p className="text-[9px] text-slate-400 font-medium">Bản đồ phủ sóng rộng, hỗ trợ lấy hàng tận nơi miễn phí</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold text-emerald-600">
                {getShippingCost(20000) > 0 ? `${getShippingCost(20000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
              </span>
              <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
