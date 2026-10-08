import React, { useRef, useState } from 'react'
import { uploadImageToCloudinary } from '../../../services/cloudinary.service'

export interface VariationRow {
  key: string
  name: string
  price: string
  originalPrice: string
  stock: string
  sku: string
  image?: string
}

interface VariationMatrixTableProps {
  variationRows: VariationRow[]
  deletedVariationKeys?: string[]
  onUpdateRow: (key: string, field: keyof VariationRow, value: string) => void
  onRemoveRow: (key: string) => void
  onRestoreRow?: (key: string) => void
  onRestoreAll?: () => void
  onRowImageChange?: (key: string, imageUrl: string) => void
  onRowImageRemove?: (key: string) => void
  isEditMode?: boolean
}

export const VariationMatrixTable: React.FC<VariationMatrixTableProps> = ({
  variationRows,
  deletedVariationKeys = [],
  onUpdateRow,
  onRemoveRow,
  onRestoreRow,
  onRestoreAll,
  onRowImageChange,
  onRowImageRemove,
  isEditMode = false
}) => {
  const [activeUploadRowKey, setActiveUploadRowKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTriggerUpload = (rowKey: string) => {
    setActiveUploadRowKey(rowKey)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadRowKey || !onRowImageChange) return

    try {
      const url = await uploadImageToCloudinary(file)
      onRowImageChange(activeUploadRowKey, url)
    } catch (err) {
      console.error('Lỗi upload ảnh biến thể:', err)
      alert('Không thể tải ảnh biến thể lên!')
    } finally {
      setActiveUploadRowKey(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Thống kê nhanh
  const prices = variationRows
    .map((r) => parseFloat(r.price))
    .filter((p) => !isNaN(p) && p > 0)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
  const totalStock = variationRows.reduce((sum, r) => sum + (parseInt(r.stock) || 0), 0)

  return (
    <div className="space-y-3">
      {/* Ẩn file input để upload ảnh cho từng dòng */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header tóm tắt */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-800">
            Danh sách phân loại hàng ({variationRows.length})
          </span>
          {prices.length > 0 && (
            <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              {minPrice === maxPrice
                ? `${minPrice.toLocaleString('vi-VN')}đ`
                : `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`}
            </span>
          )}
          <span className="text-slate-400 font-medium">|</span>
          <span className="text-slate-500 font-semibold">
            Tổng tồn kho: <b className="text-slate-800">{totalStock.toLocaleString('vi-VN')}</b>
          </span>
        </div>
      </div>

      {/* Bảng biến thể */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-3xs max-h-[460px] overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 font-bold text-slate-600 backdrop-blur-xs">
            <tr>
              <th className="text-center p-3 w-16">Hình ảnh</th>
              <th className="text-left p-3 min-w-[140px]">Tên Phân Loại</th>
              <th className="text-left p-3 w-40">Giá gốc (VND)</th>
              <th className="text-left p-3 w-44">Giá bán (VND) *</th>
              <th className="text-left p-3 w-32">Kho hàng *</th>
              <th className="text-left p-3 w-40">SKU phân loại</th>
              <th className="text-center p-3 w-20">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {variationRows.map((row) => {
              const origP = parseFloat(row.originalPrice) || 0
              const saleP = parseFloat(row.price) || 0
              const discount = origP > saleP && origP > 0 ? Math.round(((origP - saleP) / origP) * 100) : 0

              return (
                <tr key={row.key} className="hover:bg-slate-50/60 transition group">
                  {/* Cột Hình ảnh */}
                  <td className="p-2.5 text-center">
                    <div className="relative inline-block">
                      {row.image ? (
                        <div
                          className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-500 group/img transition shadow-3xs"
                        >
                          <img
                            src={row.image}
                            alt={row.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1 transition">
                            <button
                              type="button"
                              onClick={() => handleTriggerUpload(row.key)}
                              title="Đổi ảnh"
                              className="p-1 bg-white hover:bg-slate-100 text-slate-800 rounded text-[9px] font-bold cursor-pointer transition shadow-xs"
                            >
                              ✎
                            </button>
                            {onRowImageRemove && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRowImageRemove(row.key)
                                }}
                                title="Xóa ảnh"
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold cursor-pointer transition shadow-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(row.key)}
                          title="Tải ảnh riêng cho biến thể này"
                          className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-400 hover:text-emerald-600 flex flex-col items-center justify-center text-[8px] font-semibold transition cursor-pointer"
                        >
                          <span>📷</span>
                          <span>+Ảnh</span>
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Tên phân loại */}
                  <td className="p-3 font-bold text-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Giá gốc */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        disabled={isEditMode}
                        value={row.originalPrice}
                        onChange={(e) => onUpdateRow(row.key, 'originalPrice', e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none pr-6 font-medium ${
                          isEditMode
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                            : 'border-slate-200 bg-white focus:border-emerald-500'
                        }`}
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-bold">đ</span>
                    </div>
                  </td>

                  {/* Giá bán */}
                  <td className="p-3">
                    <div className="relative">
                      <input
                        type="number"
                        required
                        disabled={isEditMode}
                        placeholder="Nhập giá bán"
                        value={row.price}
                        onChange={(e) => onUpdateRow(row.key, 'price', e.target.value)}
                        className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none pr-6 font-bold ${
                          isEditMode
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed select-none'
                            : 'border-emerald-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white text-emerald-700'
                        }`}
                      />
                      <span className={`absolute right-2 top-1.5 text-[10px] font-bold ${isEditMode ? 'text-slate-400' : 'text-emerald-600'}`}>đ</span>
                    </div>
                    {discount > 0 && (
                      <span className="text-[10px] text-red-500 font-bold mt-0.5 inline-block">
                        -{discount}% so với giá gốc
                      </span>
                    )}
                  </td>

                  {/* Kho hàng */}
                  <td className="p-3">
                    <input
                      type="number"
                      required
                      placeholder="Số lượng"
                      value={row.stock}
                      onChange={(e) => onUpdateRow(row.key, 'stock', e.target.value)}
                      className={`w-full border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 bg-white font-bold ${
                        parseInt(row.stock) <= 0
                          ? 'border-red-300 text-red-600 bg-red-50/20'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    />
                  </td>

                  {/* SKU */}
                  <td className="p-3">
                    <input
                      type="text"
                      placeholder="SKU-..."
                      value={row.sku}
                      onChange={(e) => onUpdateRow(row.key, 'sku', e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 bg-white font-medium uppercase text-[11px]"
                    />
                  </td>

                  {/* Thao tác xóa dòng */}
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.key)}
                      title={`Xóa biến thể ${row.name} (không kinh doanh dòng này)`}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Xóa</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Danh sách các biến thể đã xóa để khôi phục */}
      {deletedVariationKeys.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold flex items-center gap-1">
              <span>⚠️</span> Biến thể đã tạm ẩn ({deletedVariationKeys.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {deletedVariationKeys.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded-md text-[11px] shadow-3xs"
                >
                  <span>{key}</span>
                  {onRestoreRow && (
                    <button
                      type="button"
                      onClick={() => onRestoreRow(key)}
                      title={`Khôi phục ${key}`}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded px-1 text-[10px] font-bold cursor-pointer transition"
                    >
                      ↺ Khôi phục
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
          {onRestoreAll && deletedVariationKeys.length > 1 && (
            <button
              type="button"
              onClick={onRestoreAll}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0 ml-auto"
            >
              ↺ Khôi phục tất cả
            </button>
          )}
        </div>
      )}
    </div>
  )
}
