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
  shippingProviders: { spx: boolean; fast: boolean; saver: boolean; bulky: boolean }
  setShippingProviders: React.Dispatch<React.SetStateAction<{ spx: boolean; fast: boolean; saver: boolean; bulky: boolean }>>
  getShippingCost: (base: number) => number
  shopShippingConfig?: { express?: boolean; fast?: boolean; saver?: boolean; bulky?: boolean }
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
  shopShippingConfig = { express: true, fast: true, saver: true, bulky: false },
  errors
}) => {
  // Tính trọng lượng quy đổi để hiển thị minh bạch cho người bán
  const w = parseFloat(weight) || 0
  const l = parseFloat(length) || 0
  const widthVal = parseFloat(width) || 0
  const h = parseFloat(height) || 0
  const volumetricWeight = (l > 0 && widthVal > 0 && h > 0) ? Math.round((l * widthVal * h) / 5) : 0
  const chargeableWeight = Math.max(w, volumetricWeight)

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Vận chuyển</h3>

      <div className="border border-slate-150 p-5 rounded-2xl bg-slate-50/30 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">* Cân nặng sau đóng gói</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                required
                min="1"
                placeholder="Cân nặng..."
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white font-bold text-slate-700"
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
              min="1"
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
              min="1"
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
              min="1"
              placeholder="Cao..."
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Thông tin tính cước quy đổi logistics */}
        {chargeableWeight > 0 && (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-emerald-50/60 border border-emerald-200/60 p-2.5 rounded-xl text-emerald-800">
            <span className="font-bold">⚖️ Trọng lượng tính cước:</span>
            <span className="font-black text-emerald-700">{chargeableWeight.toLocaleString('vi-VN')} gr</span>
            {volumetricWeight > w && (
              <span className="text-[11px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md font-semibold">
                (Quy đổi từ thể tích {l}x{widthVal}x{h}cm: {volumetricWeight.toLocaleString('vi-VN')}gr lớn hơn cân nặng thực)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700">Phương thức vận chuyển hỗ trợ</h4>
          <span className="text-[11px] text-slate-400">Dựa theo cài đặt vận chuyển của Shop</span>
        </div>
        
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
          {/* 1. Hỏa Tốc (SPX Instant / Express) */}
          {shopShippingConfig.express && (
            <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={shippingProviders.spx}
                  onChange={(e) => setShippingProviders(prev => ({ ...prev, spx: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>⚡ Hỏa Tốc</span>
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Giao 1-2h</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Vận chuyển siêu tốc nội thành bằng đội ngũ SPX Instant</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600">
                  {getShippingCost(25000) > 0 ? `${getShippingCost(25000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                </span>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">Cước ước tính</p>
              </div>
            </div>
          )}

          {/* 2. Nhanh (Fast) */}
          {shopShippingConfig.fast && (
            <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={shippingProviders.fast}
                  onChange={(e) => setShippingProviders(prev => ({ ...prev, fast: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🚀 Nhanh</span>
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">1-2 ngày</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Phương thức giao hàng tiêu chuẩn thông dụng nhất</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600">
                  {getShippingCost(18000) > 0 ? `${getShippingCost(18000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                </span>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">Cước ước tính</p>
              </div>
            </div>
          )}

          {/* 3. Tiết Kiệm (Saver) */}
          {shopShippingConfig.saver && (
            <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={shippingProviders.saver}
                  onChange={(e) => setShippingProviders(prev => ({ ...prev, saver: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>📦 Tiết Kiệm</span>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">2-4 ngày</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Cước phí tối ưu chi phí cho đơn hàng liên tỉnh</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600">
                  {getShippingCost(15000) > 0 ? `${getShippingCost(15000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                </span>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">Cước ước tính</p>
              </div>
            </div>
          )}

          {/* 4. Hàng Cồng Kềnh (Bulky) */}
          {shopShippingConfig.bulky && (
            <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={shippingProviders.bulky}
                  onChange={(e) => setShippingProviders(prev => ({ ...prev, bulky: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🚛 Hàng Cồng Kềnh</span>
                    <span className="text-[10px] font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">Hàng nặng/lớn</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Dành riêng cho sản phẩm có kích thước lớn hoặc trên 10kg</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600">
                  {getShippingCost(40000) > 0 ? `${getShippingCost(40000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                </span>
                <p className="text-[8px] font-bold text-slate-400 mt-0.5">Cước ước tính</p>
              </div>
            </div>
          )}

          {/* Trường hợp shop tắt hết tất cả kênh */}
          {!shopShippingConfig.express && !shopShippingConfig.fast && !shopShippingConfig.saver && !shopShippingConfig.bulky && (
            <div className="p-4 text-center text-xs text-amber-700 bg-amber-50">
              ⚠️ Shop của bạn chưa kích hoạt kênh vận chuyển nào trong phần Cài đặt Shop.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
