import React from 'react'

export const Categories: React.FC = () => {
  const categoriesList = [
    { name: 'Thời Trang Nam', icon: '👕' },
    { name: 'Điện Thoại', icon: '📱' },
    { name: 'Thiết Bị Điện Tử', icon: '💻' },
    { name: 'Máy Tính & Laptop', icon: '🖥️' },
    { name: 'Đồng Hồ', icon: '⌚' },
    { name: 'Máy Ảnh', icon: '📷' },
    { name: 'Giày Dép Nam', icon: '👞' },
    { name: 'Gia Dụng', icon: '🔌' },
    { name: 'Thể Thao', icon: '⚽' },
    { name: 'Thời Trang Nữ', icon: '👗' },
    { name: 'Mẹ & Bé', icon: '🍼' },
    { name: 'Nhà Cửa', icon: '🏡' },
    { name: 'Sắc Đẹp', icon: '💄' },
    { name: 'Sức Khỏe', icon: '💊' },
    { name: 'Phụ Kiện Nữ', icon: '💍' },
    { name: 'Giày Dép Nữ', icon: '👠' },
    { name: 'Túi Ví Nữ', icon: '👜' },
    { name: 'Sách & VPP', icon: '📚' }
  ]

  return (
    <section className="bg-white border border-slate-200/60 rounded-xl shadow-sm p-5 text-left">
      <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khám Phá Danh Mục</h2>
        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1 cursor-pointer">
          Xem tất cả <span>➔</span>
        </button>
      </div>

      {/* Grid of categories with gaps */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3">
        {categoriesList.map((cat, idx) => (
          <div
            key={idx}
            className="bg-slate-50/50 border border-slate-100 hover:border-emerald-500/20 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md hover:bg-white rounded-xl transition duration-200 group"
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-2xl group-hover:scale-108 transition duration-200 shadow-3xs border border-slate-100">
              {cat.icon}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 mt-2.5 group-hover:text-emerald-600 transition line-clamp-2 min-h-[32px] flex items-center justify-center">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
