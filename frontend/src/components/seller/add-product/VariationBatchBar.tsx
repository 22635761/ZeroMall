import React, { useState } from 'react'

interface VariationBatchBarProps {
  onApply: (params: {
    price: string
    originalPrice: string
    stock: string
    skuPrefix: string
  }) => void
}

export const VariationBatchBar: React.FC<VariationBatchBarProps> = ({ onApply }) => {
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkOriginalPrice, setBulkOriginalPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState('')

  const handleApply = () => {
    if (!bulkPrice && !bulkOriginalPrice && !bulkStock && !bulkSkuPrefix) {
      alert('Vui lòng nhập ít nhất một thông tin (Giá bán, Giá gốc, Kho hàng hoặc SKU) để áp dụng hàng loạt!')
      return
    }

    onApply({
      price: bulkPrice,
      originalPrice: bulkOriginalPrice,
      stock: bulkStock,
      skuPrefix: bulkSkuPrefix
    })
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 space-y-3 shadow-3xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
            ⚡
          </span>
          <div>
            <h5 className="text-xs font-bold text-slate-800">
              Bảng quy đổi áp dụng cho tất cả phân loại
            </h5>
            <p className="text-[10px] text-slate-500 font-medium">
              Nhập giá trị và nhấn Áp dụng để cập nhật đồng loạt cho toàn bộ các dòng phân loại bên dưới
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
        {/* Giá gốc chung */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Giá gốc (VND)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Ví dụ: 250000"
              value={bulkOriginalPrice}
              onChange={(e) => setBulkOriginalPrice(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-7"
            />
            <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-bold">đ</span>
          </div>
        </div>

        {/* Giá bán chung */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
            * Giá bán chung (VND)
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="Ví dụ: 199000"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-7"
            />
            <span className="absolute right-2.5 top-1.5 text-[11px] text-emerald-600 font-bold">đ</span>
          </div>
        </div>

        {/* Kho hàng chung */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
            * Kho hàng chung
          </label>
          <input
            type="number"
            placeholder="Ví dụ: 100"
            value={bulkStock}
            onChange={(e) => setBulkStock(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* SKU chung */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            SKU phân loại
          </label>
          <input
            type="text"
            placeholder="Ví dụ: AO-THUN"
            value={bulkSkuPrefix}
            onChange={(e) => setBulkSkuPrefix(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
          />
        </div>

        {/* Nút Áp dụng */}
        <button
          type="button"
          onClick={handleApply}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>✓</span>
          <span>Áp dụng tất cả</span>
        </button>
      </div>
    </div>
  )
}
