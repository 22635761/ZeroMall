import React from 'react'

export const ShopTopProductsSidebar: React.FC = () => {
  const topProducts = [
    {
      id: 'top-1',
      name: 'Áo Khoác Bomber Unisex Cực Ngầu Nỉ Ngoại Dày Dặn',
      price: '250.000đ',
      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80'
    },
    {
      id: 'top-2',
      name: 'Nồi Chiên Không Dầu Điện Tử 6.5L Đa Năng Tiện Lợi',
      price: '1.850.000đ',
      img: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=200&q=80'
    },
    {
      id: 'top-3',
      name: 'Giày Sneaker Nam Nữ Thể Thao Da Mềm Cao Cấp',
      price: '450.000đ',
      img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80'
    }
  ]

  return (
    <div className="lg:col-span-1 space-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
          Top sản phẩm bán chạy
        </h3>
        
        <div className="space-y-4">
          {topProducts.map((topProd) => (
            <div key={topProd.id} className="flex gap-3 items-center group cursor-pointer">
              <div className="w-12 h-12 rounded-lg border border-slate-150 overflow-hidden shrink-0 bg-slate-50">
                <img src={topProd.img} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-700 line-clamp-1 group-hover:text-[#ee4d2d] transition">{topProd.name}</p>
                <p className="font-bold text-[#ee4d2d]">{topProd.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
