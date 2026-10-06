import React from 'react'
import { VariationGroupItem, type VariationGroup } from './VariationGroupItem'
import { VariationBatchBar } from './VariationBatchBar'
import { VariationMatrixTable, type VariationRow } from './VariationMatrixTable'

export type { VariationGroup, VariationRow }

interface AddProductSalesTabProps {
  hasVariations: boolean
  setHasVariations: (has: boolean) => void
  variationGroups: VariationGroup[]
  removeVariationGroup: (index: number) => void
  handleGroupNameChange: (index: number, name: string) => void
  removeOptionFromGroup: (groupIdx: number, optIdx: number) => void
  addOptionToGroup: (groupIdx: number, option: string) => void
  addVariationGroup: () => void
  handleOptionImageChange?: (groupIdx: number, optionName: string, imageUrl: string) => void
  handleOptionImageRemove?: (groupIdx: number, optionName: string) => void
  variationRows: VariationRow[]
  removeVariationRow: (key: string) => void
  restoreVariationRow?: (key: string) => void
  restoreAllDeletedVariations?: () => void
  deletedVariationKeys?: string[]
  handleRowImageChange?: (key: string, imageUrl: string) => void
  applyBulkEditWithParams: (params: {
    price: string
    originalPrice: string
    stock: string
    skuPrefix: string
  }) => void
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
  handleOptionImageChange,
  handleOptionImageRemove,
  variationRows,
  removeVariationRow,
  restoreVariationRow,
  restoreAllDeletedVariations,
  deletedVariationKeys = [],
  handleRowImageChange,
  applyBulkEditWithParams,
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
      <div className="flex items-center justify-between border-b border-slate-150 pb-3">
        <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">
          Thông tin bán hàng
        </h3>
        <span className="text-xs text-slate-400 font-medium">
          Cấu hình giá bán, tồn kho và các phân loại hàng hóa
        </span>
      </div>

      {/* Variations Toggle Switch */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl hover:border-slate-300 transition">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-800">
              Phân loại hàng hóa (Biến thể sản phẩm)
            </h4>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              Chuẩn Shopee
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Bật tính năng này nếu sản phẩm có nhiều lựa chọn như màu sắc, kích thước, dung lượng với hình ảnh và giá khác nhau.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHasVariations(!hasVariations)}
          className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
            hasVariations ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <div
            className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transition-transform duration-200 ${
              hasVariations ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Variation Builder Panel */}
      {hasVariations ? (
        <div className="space-y-5 border border-slate-200/80 p-5 rounded-2xl bg-slate-50/30">
          {/* Danh sách các nhóm phân loại (Tối đa 2 nhóm theo chuẩn Shopee) */}
          <div className="space-y-3.5">
            {variationGroups.map((group, groupIdx) => (
              <VariationGroupItem
                key={groupIdx}
                groupIdx={groupIdx}
                group={group}
                totalGroups={variationGroups.length}
                onGroupNameChange={(name) => handleGroupNameChange(groupIdx, name)}
                onRemoveGroup={() => removeVariationGroup(groupIdx)}
                onAddOption={(opt) => addOptionToGroup(groupIdx, opt)}
                onRemoveOption={(optIdx) => removeOptionFromGroup(groupIdx, optIdx)}
                onOptionImageChange={(optName, url) =>
                  handleOptionImageChange?.(groupIdx, optName, url)
                }
                onOptionImageRemove={(optName) =>
                  handleOptionImageRemove?.(groupIdx, optName)
                }
              />
            ))}
          </div>

          {/* Nút thêm nhóm phân loại thứ 2 */}
          {variationGroups.length < 2 && (
            <button
              type="button"
              onClick={addVariationGroup}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-600 text-emerald-700 hover:text-emerald-800 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 w-full bg-emerald-50/20 hover:bg-emerald-50/50 transition cursor-pointer"
            >
              <span className="text-base">➕</span>
              <span>Thêm Nhóm Phân Loại 2 (Kích thước, Dung lượng, Mẫu mã...)</span>
            </button>
          )}

          {/* Bảng quy đổi & Ma trận biến thể */}
          {variationRows.length > 0 && (
            <div className="border-t border-slate-200 pt-5 space-y-4">
              {/* Batch Edit Bar */}
              <VariationBatchBar onApply={applyBulkEditWithParams} />

              {/* Lỗi biến thể */}
              {errors.variations && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600 font-semibold">
                  <span>⚠️</span>
                  <span>{errors.variations}</span>
                </div>
              )}

              {/* Bảng ma trận phân loại */}
              <VariationMatrixTable
                variationRows={variationRows}
                deletedVariationKeys={deletedVariationKeys}
                onUpdateRow={updateVariationRow}
                onRemoveRow={removeVariationRow}
                onRestoreRow={restoreVariationRow}
                onRestoreAll={restoreAllDeletedVariations}
                onRowImageChange={handleRowImageChange}
              />
            </div>
          )}
        </div>
      ) : (
        /* Simple Pricing Mode (Không có biến thể) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-slate-200/80 p-5 rounded-2xl bg-slate-50/30">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Giá gốc sản phẩm (VND)
            </label>
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
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              * Giá bán sản phẩm (VND)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                required
                placeholder="Nhập giá bán (ví dụ: 150000)"
                value={simplePrice}
                onChange={(e) => setSimplePrice(e.target.value)}
                className="w-full border border-emerald-300 rounded-xl px-4 py-2.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
              />
              <span className="text-xs font-extrabold text-emerald-600">đ</span>
            </div>
            {errors.price && (
              <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.price}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              * Tồn kho (Số lượng)
            </label>
            <input
              type="number"
              required
              placeholder="Số lượng..."
              value={simpleStock}
              onChange={(e) => setSimpleStock(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
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
