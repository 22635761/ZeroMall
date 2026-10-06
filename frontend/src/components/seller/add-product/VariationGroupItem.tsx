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

const COMMON_GROUP_NAMES = ['Màu sắc', 'Kích cỡ', 'Dung lượng', 'Mẫu mã', 'Phiên bản']

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = inputValue.trim().replace(/^,+|,+$/g, '')
      if (val) {
        onAddOption(val)
        setInputValue('')
      }
    }
  }

  const handleBlur = () => {
    const val = inputValue.trim().replace(/^,+|,+$/g, '')
    if (val) {
      onAddOption(val)
      setInputValue('')
    }
  }

  const isImageGroup = groupIdx === 0

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 space-y-4 shadow-3xs hover:border-slate-300 transition">
      {/* Header nhóm */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
            {groupIdx + 1}
          </span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Nhóm phân loại {groupIdx + 1}
          </span>
          {isImageGroup && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span>🖼️</span> Hỗ trợ ảnh biến thể
            </span>
          )}
        </div>

        {totalGroups > 1 && (
          <button
            type="button"
            onClick={onRemoveGroup}
            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Xóa nhóm</span>
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
            placeholder="Ví dụ: Màu sắc, Kích cỡ..."
            value={group.name}
            onChange={(e) => onGroupNameChange(e.target.value)}
            className="w-full md:w-64 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 focus:bg-white transition"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Gợi ý nhanh:</span>
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

      {/* Danh sách phân loại & Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Các tùy chọn phân loại ({group.options.length})
          </label>
          {isImageGroup && (
            <span className="text-[10px] text-slate-400">
              💡 Bấm vào ô <b>+Ảnh</b> ở từng màu sắc để tải ảnh mẫu thực tế
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/70 border border-slate-200 rounded-xl min-h-[56px]">
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

          {/* Ô nhập thêm tùy chọn */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={
                group.options.length === 0
                  ? 'Gõ tên tùy chọn (ví dụ: Đen, Trắng, Đỏ...) rồi bấm Enter'
                  : 'Thêm tùy chọn khác rồi bấm Enter...'
              }
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
