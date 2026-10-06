import React, { useState } from 'react'
import { VariationOptionTag } from './VariationOptionTag'

export interface VariationGroup {
  name: string
  options: string[]
  images?: Record<string, string>
}

interface VariationGroupItemProps {
  groupIdx: number
  group: VariationGroup
  totalGroups: number
  onGroupNameChange: (name: string) => void
  onRemoveGroup: () => void
  onAddOption: (option: string) => void
  onRemoveOption: (optIdx: number) => void
  onOptionImageChange?: (optionName: string, imageUrl: string) => void
  onOptionImageRemove?: (optionName: string) => void
}

const COMMON_GROUP_NAMES = ['Màu sắc', 'Kích thước', 'Kích cỡ', 'Dung lượng', 'Mẫu mã', 'Phiên bản']

const QUICK_OPTIONS_MAP: Record<string, string[]> = {
  'Màu sắc': ['Đen', 'Trắng', 'Đỏ', 'Xanh dương', 'Xanh lá', 'Vàng', 'Hồng', 'Xám', 'Be'],
  'Kích thước': ['S', 'M', 'L', 'XL', '2XL', 'Freesize'],
  'Kích cỡ': ['S', 'M', 'L', 'XL', '38', '39', '40', '41', '42'],
  'Dung lượng': ['64GB', '128GB', '256GB', '512GB', '1TB'],
  'Mẫu mã': ['Mẫu 1', 'Mẫu 2', 'Mẫu 3', 'Bản thường', 'Bản Pro'],
  'Phiên bản': ['Bản tiêu chuẩn', 'Bản nâng cấp', 'Bản cao cấp']
}

export const VariationGroupItem: React.FC<VariationGroupItemProps> = ({
  groupIdx,
  group,
  totalGroups,
  onGroupNameChange,
  onRemoveGroup,
  onAddOption,
  onRemoveOption,
  onOptionImageChange,
  onOptionImageRemove
}) => {
  const [inputValue, setInputValue] = useState('')

  const handleAddCurrentInput = () => {
    const val = inputValue.trim().replace(/^,+|,+$/g, '')
    if (val) {
      onAddOption(val)
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddCurrentInput()
    }
  }

  const isImageGroup = groupIdx === 0

  // Tìm danh sách gợi ý tùy chọn phù hợp theo tên nhóm
  const matchingQuickOptions =
    QUICK_OPTIONS_MAP[group.name] ||
    (group.name.toLowerCase().includes('màu')
      ? QUICK_OPTIONS_MAP['Màu sắc']
      : group.name.toLowerCase().includes('size') || group.name.toLowerCase().includes('cỡ')
      ? QUICK_OPTIONS_MAP['Kích cỡ']
      : group.name.toLowerCase().includes('dung lượng')
      ? QUICK_OPTIONS_MAP['Dung lượng']
      : ['Lựa chọn 1', 'Lựa chọn 2', 'Lựa chọn 3'])

  const availableQuickOptions = matchingQuickOptions.filter(
    (opt) => !group.options.includes(opt)
  )

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-3xs hover:border-slate-300 transition">
      {/* Header nhóm */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
            {groupIdx + 1}
          </span>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Nhóm phân loại {groupIdx + 1}
          </span>
          {isImageGroup ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-3xs">
              <span>📸</span> Hỗ trợ tải ảnh riêng cho từng tùy chọn
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
              Phân loại văn bản
            </span>
          )}
        </div>

        {totalGroups > 1 && (
          <button
            type="button"
            onClick={onRemoveGroup}
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Xóa nhóm {groupIdx + 1}</span>
          </button>
        )}
      </div>

      {/* Tên nhóm & Quick Suggest */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Tên nhóm phân loại *
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            required
            placeholder="Ví dụ: Màu sắc, Kích thước, Dung lượng..."
            value={group.name}
            onChange={(e) => onGroupNameChange(e.target.value)}
            className="w-full md:w-64 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white transition"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Gợi ý tên nhóm:</span>
            {COMMON_GROUP_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onGroupNameChange(name)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border transition cursor-pointer ${
                  group.name === name
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách phân loại & Input & Quick options */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span>Các tùy chọn phân loại ({group.options.length})</span>
            {group.options.length > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                Đã thêm {group.options.length} tùy chọn
              </span>
            )}
          </label>
          <span className="text-[10px] text-slate-400">
            {isImageGroup
              ? '💡 Bấm vào ô "+ Ảnh" ở từng thẻ để tải ảnh đại diện'
              : '💡 Mỗi phân loại sẽ kết hợp với nhóm 1 để tạo ma trận giá'}
          </span>
        </div>

        {/* Khu vực thẻ tùy chọn & Input nhập */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2.5 min-h-[48px]">
            {group.options.map((opt, optIdx) => (
              <VariationOptionTag
                key={`${opt}-${optIdx}`}
                groupIdx={groupIdx}
                option={opt}
                image={group.images?.[opt]}
                onRemove={() => onRemoveOption(optIdx)}
                onImageChange={(url) => onOptionImageChange?.(opt, url)}
                onImageRemove={() => onOptionImageRemove?.(opt)}
              />
            ))}

            {/* Ô nhập + Nút thêm rõ ràng */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  group.options.length === 0
                    ? `Nhập tùy chọn (ví dụ: ${matchingQuickOptions.slice(0, 3).join(', ')}...)`
                    : 'Nhập thêm tùy chọn khác...'
                }
                className="flex-1 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={handleAddCurrentInput}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 shadow-3xs flex items-center gap-1 active:scale-95"
              >
                <span>➕</span>
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Gợi ý tùy chọn nhanh (Quick Click Tags) */}
          {availableQuickOptions.length > 0 && (
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <span>⚡</span> Bấm nhanh để thêm:
              </span>
              {availableQuickOptions.map((quickOpt) => (
                <button
                  key={quickOpt}
                  type="button"
                  onClick={() => onAddOption(quickOpt)}
                  className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer shadow-3xs flex items-center gap-1 active:scale-95"
                >
                  <span className="text-emerald-600">+</span>
                  <span>{quickOpt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
