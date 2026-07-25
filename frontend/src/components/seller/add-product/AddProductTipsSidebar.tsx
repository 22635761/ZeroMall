import React from 'react'

interface AddProductTipsSidebarProps {
  isImageValid: boolean
  isVideoValid: boolean
  isNameValid: boolean
  isDescValid: boolean
  isBrandValid: boolean
  productName: string
  description: string
}

export const AddProductTipsSidebar: React.FC<AddProductTipsSidebarProps> = ({
  isImageValid,
  isVideoValid,
  isNameValid,
  isDescValid,
  isBrandValid,
  productName,
  description
}) => {
  return (
    <aside className="w-1/4 bg-white border border-slate-200/70 rounded-3xl p-5 sticky top-24 shrink-0 shadow-2xs select-none space-y-4">
      <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Gợi ý điền Thông tin</h4>
      
      <ul className="space-y-4 text-xs font-semibold text-slate-500">
        <li className="flex items-start gap-2.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            isImageValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {isImageValid ? '✓' : '•'}
          </span>
          <span className={isImageValid ? 'text-slate-800 font-bold' : ''}>Thêm ít nhất 1 hình ảnh</span>
        </li>
        
        <li className="flex items-start gap-2.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            isVideoValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {isVideoValid ? '✓' : '•'}
          </span>
          <span className={isVideoValid ? 'text-slate-800 font-bold' : ''}>Thêm video sản phẩm</span>
        </li>

        <li className="flex items-start gap-2.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            isNameValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {isNameValid ? '✓' : '•'}
          </span>
          <span className={isNameValid ? 'text-slate-800 font-bold' : ''}>
            Điền tên sản phẩm
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">({productName.length}/120 ký tự)</span>
          </span>
        </li>

        <li className="flex items-start gap-2.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            isDescValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {isDescValid ? '✓' : '•'}
          </span>
          <span className={isDescValid ? 'text-slate-800 font-bold' : ''}>
            Điền mô tả sản phẩm
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">({description.length} ký tự)</span>
          </span>
        </li>

        <li className="flex items-start gap-2.5">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
            isBrandValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            {isBrandValid ? '✓' : '•'}
          </span>
          <span className={isBrandValid ? 'text-slate-800 font-bold' : ''}>Thêm thương hiệu</span>
        </li>
      </ul>
    </aside>
  )
}
