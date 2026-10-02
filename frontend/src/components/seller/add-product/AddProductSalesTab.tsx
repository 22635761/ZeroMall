import React from 'react'

interface VariationGroup {
  name: string
  options: string[]
}

interface VariationRow {
  key: string
  name: string
  price: string
  originalPrice: string
  stock: string
  sku: string
}

interface AddProductSalesTabProps {
  hasVariations: boolean
  setHasVariations: (has: boolean) => void
  variationGroups: VariationGroup[]
  removeVariationGroup: (index: number) => void
  handleGroupNameChange: (index: number, name: string) => void
  removeOptionFromGroup: (groupIdx: number, optIdx: number) => void
  addOptionToGroup: (groupIdx: number, option: string) => void
  addVariationGroup: () => void
  variationRows: VariationRow[]
  removeVariationRow: (key: string) => void
  restoreVariationRow?: (key: string) => void
  restoreAllDeletedVariations?: () => void
  deletedVariationKeys?: string[]
  bulkOriginalPrice: string
  setBulkOriginalPrice: (val: string) => void
  bulkPrice: string
  setBulkPrice: (val: string) => void
  bulkStock: string
  setBulkStock: (val: string) => void
  applyBulkEdit: () => void
  updateVariationRow: (key: string, field: keyof VariationRow, value: string) => void
  errors: Record<string, string>
  simpleOriginalPrice: string
  setSimpleOriginalPrice: (val: string) => void
  simplePrice: string
  setSimplePrice: (val: string) => void
  simpleStock: string
  setSimpleStock: (val: string) => void
}

export const AddProductSalesTab: React.FC<AddProductSalesTabProps> = ({
  hasVariations,
  setHasVariations,
  variationGroups,
  removeVariationGroup,
  handleGroupNameChange,
  removeOptionFromGroup,
  addOptionToGroup,
  addVariationGroup,
  variationRows,
  removeVariationRow,
  restoreVariationRow,
  restoreAllDeletedVariations,
  deletedVariationKeys = [],
  bulkOriginalPrice,
  setBulkOriginalPrice,
  bulkPrice,
  setBulkPrice,
  bulkStock,
  setBulkStock,
  applyBulkEdit,
  updateVariationRow,
  errors,
  simpleOriginalPrice,
  setSimpleOriginalPrice,
  simplePrice,
  setSimplePrice,
  simpleStock,
  setSimpleStock
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin bán hàng</h3>

      {/* Variations Toggle */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-4 rounded-2xl">
        <div>
          <h4 className="text-xs font-bold text-slate-700">Phân loại hàng hóa (Biến thể sản phẩm)</h4>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Áp dụng cho sản phẩm có nhiều lựa chọn như màu sắc, kích thước, dung lượng...
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHasVariations(!hasVariations)}
          className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
            hasVariations ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transition-transform duration-200 ${
            hasVariations ? 'translate-x-5.5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Variation Builder Panel */}
      {hasVariations ? (
        <div className="space-y-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
          {variationGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="border-b border-slate-100 pb-4 last:border-none last:pb-0 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Nhóm phân loại {groupIdx + 1}
                </span>
                
                {variationGroups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariationGroup(groupIdx)}
                    className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Xóa nhóm {groupIdx + 1}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 items-start">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Tên nhóm</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Màu sắc, Kích thước..."
                    value={group.name}
                    onChange={(e) => handleGroupNameChange(groupIdx, e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Tùy chọn phân loại</label>
                  
                  <div className="flex flex-wrap gap-1.5 border border-slate-200 rounded-lg p-1.5 bg-white min-h-[36px]">
                    {group.options.map((opt, optIdx) => (
                      <span
                        key={optIdx}
                        className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 cursor-default"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeOptionFromGroup(groupIdx, optIdx)}
                          className="text-[9px] text-slate-400 hover:text-red-500 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      placeholder="Gõ rồi bấm Enter..."
                      className="flex-1 min-w-[100px] border-none outline-none text-xs p-0 px-1 focus:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addOptionToGroup(groupIdx, e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      onBlur={(e) => {
                        addOptionToGroup(groupIdx, e.target.value)
                        e.target.value = ''
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {variationGroups.length < 2 && (
            <button
              type="button"
              onClick={addVariationGroup}
              className="border border-dashed border-emerald-600/40 hover:border-emerald-600 text-emerald-600 text-[10px] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full bg-white transition cursor-pointer"
            >
              ➕ Thêm Nhóm Phân Loại (Kích thước, Dung lượng...)
            </button>
          )}

          {variationRows.length > 0 && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Thiết lập hàng loạt</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Giá gốc chung (VND)"
                    value={bulkOriginalPrice}
                    onChange={(e) => setBulkOriginalPrice(e.target.value)}
                    className="w-36 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Giá bán chung (VND)"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="w-36 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Kho chung"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    className="w-24 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={applyBulkEdit}
                    className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>

              {errors.variations && (
                <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.variations}</p>
              )}

              {deletedVariationKeys.length > 0 && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">⚠️ Biến thể đã xóa ({deletedVariationKeys.length}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {deletedVariationKeys.map((key) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-3xs"
                        >
                          <span>{key}</span>
                          <button
                            type="button"
                            onClick={() => restoreVariationRow ? restoreVariationRow(key) : restoreAllDeletedVariations?.()}
                            title={`Khôi phục ${key}`}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded px-1 text-[10px] font-bold cursor-pointer transition"
                          >
                            ↺ Khôi phục
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  {restoreAllDeletedVariations && deletedVariationKeys.length > 1 && (
                    <button
                      type="button"
                      onClick={restoreAllDeletedVariations}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0 ml-auto"
                    >
                      ↺ Khôi phục tất cả
                    </button>
                  )}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-500">
                    <tr>
                      <th className="text-left p-3">Tên Phân loại</th>
                      <th className="text-left p-3 w-1/4">Giá gốc (VND)</th>
                      <th className="text-left p-3 w-1/4">Giá bán (VND) *</th>
                      <th className="text-left p-3 w-1/6">Kho hàng *</th>
                      <th className="text-left p-3 w-1/4">SKU phân loại</th>
                      <th className="text-center p-3 w-20">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {variationRows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <span>{row.name}</span>
                            <button
                              type="button"
                              onClick={() => removeVariationRow(row.key)}
                              title={`Xóa phân loại ${row.name}`}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={row.originalPrice}
                              onChange={(e) => updateVariationRow(row.key, 'originalPrice', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">đ</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              required
                              value={row.price}
                              onChange={(e) => updateVariationRow(row.key, 'price', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">đ</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            required
                            value={row.stock}
                            onChange={(e) => updateVariationRow(row.key, 'stock', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="SKU-..."
                            value={row.sku}
                            onChange={(e) => updateVariationRow(row.key, 'sku', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeVariationRow(row.key)}
                            title="Xóa phân loại này nếu không kinh doanh"
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Xóa</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giá gốc sản phẩm (VND)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Giá gốc (ví dụ: 200000)"
                value={simpleOriginalPrice}
                onChange={(e) => setSimpleOriginalPrice(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
              />
              <span className="text-xs font-extrabold text-slate-400">đ</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Giá bán sản phẩm (VND)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                required
                placeholder="Nhập giá bán (ví dụ: 150000)"
                value={simplePrice}
                onChange={(e) => setSimplePrice(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
              />
              <span className="text-xs font-extrabold text-slate-400">đ</span>
            </div>
            {errors.price && (
              <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.price}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Tồn kho (Số lượng)</label>
            <input
              type="number"
              required
              placeholder="Số lượng..."
              value={simpleStock}
              onChange={(e) => setSimpleStock(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
            />
            {errors.stock && (
              <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.stock}</p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
