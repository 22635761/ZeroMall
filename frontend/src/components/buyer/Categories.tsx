import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config/api.config'

const toSlug = (str: string) => {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/^-+|-+$/g, '')
}

const categoryIcons: Record<string, string> = {
  'thoi-trang-nam': '👕',
  'dien-thoai-phu-kien': '📱',
  'thiet-bi-dien-tu': '💻',
  'may-tinh-laptop': '🖥️',
  'dong-ho': '⌚',
  'may-anh': '📷',
  'giay-dep-nam': '👞',
  'gia-dung': '🔌',
  'the-thao': '⚽',
  'thoi-trang-nu': '👗',
  'me-va-be': '🍼',
  'nha-cua': '🏡',
  'sac-dep': '💄',
  'suc-khoe': '💊',
  'phu-kien-nu': '💍',
  'giay-dep-nu': '👠',
  'tui-vi-nu': '👜',
  'sach-vpp': '📚'
}

interface CategoriesProps {
  selectedCategory?: string | null
  onSelectCategory?: (category: any) => void
}

export const Categories: React.FC<CategoriesProps> = ({ selectedCategory, onSelectCategory }) => {
  const navigate = useNavigate()
  const [categoriesList, setCategoriesList] = useState<any[]>([
    { name: 'Thời Trang Nam', slug: 'thoi-trang-nam' },
    { name: 'Điện Thoại & Phụ Kiện', slug: 'dien-thoai-phu-kien' },
    { name: 'Thiết Bị Điện Tử', slug: 'thiet-bi-dien-tu' },
    { name: 'Máy Tính & Laptop', slug: 'may-tinh-laptop' },
    { name: 'Đồng Hồ', slug: 'dong-ho' },
    { name: 'Máy Ảnh', slug: 'may-anh' },
    { name: 'Giày Dép Nam', slug: 'giay-dep-nam' },
    { name: 'Gia Dụng', slug: 'gia-dung' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Thời Trang Nữ', slug: 'thoi-trang-nu' },
    { name: 'Mẹ & Bé', slug: 'me-va-be' },
    { name: 'Nhà Cửa', slug: 'nha-cua' },
    { name: 'Sắc Đẹp', slug: 'sac-dep' },
    { name: 'Sức Khỏe', slug: 'suc-khoe' },
    { name: 'Phụ Kiện Nữ', slug: 'phu-kien-nu' },
    { name: 'Giày Dép Nữ', slug: 'giay-dep-nu' },
    { name: 'Túi Ví Nữ', slug: 'tui-vi-nu' },
    { name: 'Sách & VPP', slug: 'sach-vpp' }
  ])

  useEffect(() => {
    fetch(`${API_BASE_URL}/products/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data)
        }
      })
      .catch(err => console.error('Error fetching categories from backend:', err))
  }, [])

  const handleCategoryClick = (cat: any) => {
    if (onSelectCategory) {
      onSelectCategory(cat)
    } else {
      const slug = cat.slug || toSlug(cat.name)
      navigate(`/category/${slug}`)
    }
  }

  return (
    <section className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 text-left">
      <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khám Phá Danh Mục</h2>
        <button
          onClick={() => navigate('/category/all')}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1 cursor-pointer"
        >
          Xem tất cả <span>➔</span>
        </button>
      </div>

      {/* Grid of categories with gaps */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
        {categoriesList.map((cat, idx) => {
          const catSlug = cat.slug || toSlug(cat.name)
          const icon = categoryIcons[catSlug] || '📦'
          const isSelected = selectedCategory === cat.name || selectedCategory === catSlug
          return (
            <div
              key={cat.id || idx}
              onClick={() => handleCategoryClick(cat)}
              className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer rounded-xl transition duration-200 group ${
                isSelected
                  ? 'bg-emerald-50 border-2 border-emerald-500 shadow-md scale-105'
                  : 'bg-slate-50/50 border border-slate-100 hover:border-emerald-500/20 hover:shadow-md hover:bg-white'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl group-hover:scale-108 transition duration-200 shadow-3xs border border-slate-100">
                {icon}
              </div>
              <span className={`text-[11px] font-semibold mt-2.5 transition line-clamp-2 min-h-[32px] flex items-center justify-center ${
                isSelected ? 'text-emerald-700 font-extrabold' : 'text-slate-700 group-hover:text-emerald-600'
              }`}>
                {cat.name}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
