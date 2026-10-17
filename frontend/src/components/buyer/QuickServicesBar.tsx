import React from 'react'

interface QuickServicesBarProps {
  onSelectCategory?: (categoryName: string) => void
  onScrollToFlashSale?: () => void
  onSelectTab?: (tabIndex: number) => void
}

export const QuickServicesBar: React.FC<QuickServicesBarProps> = ({
  onSelectCategory,
  onScrollToFlashSale,
  onSelectTab,
}) => {
  const services = [
    {
      id: 'freeship',
      title: 'Freeship 0Đ',
      badge: 'Toàn sàn',
      badgeColor: 'bg-orange-500',
      icon: '🚚',
      bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      action: () => onSelectTab && onSelectTab(1), // Tab Freeship Xtra
    },
    {
      id: 'flashsale',
      title: 'Flash Sale',
      badge: 'Giá sốc',
      badgeColor: 'bg-red-500',
      icon: '⚡',
      bgColor: 'bg-amber-50 text-amber-600 border-amber-200',
      action: () => onScrollToFlashSale && onScrollToFlashSale(),
    },
    {
      id: 'hanghieu',
      title: 'Hàng Hiệu -50%',
      badge: 'Chính hãng',
      badgeColor: 'bg-rose-500',
      icon: '🏷️',
      bgColor: 'bg-rose-50 text-rose-600 border-rose-200',
      action: () => onSelectTab && onSelectTab(2), // Tab Hàng hiệu
    },
    {
      id: 'tech',
      title: 'Đồ Công Nghệ',
      badge: 'Giảm sâu',
      badgeColor: 'bg-blue-500',
      icon: '📱',
      bgColor: 'bg-blue-50 text-blue-600 border-blue-200',
      action: () => onSelectCategory && onSelectCategory('Điện Thoại & Phụ Kiện'),
    },
    {
      id: 'fashion',
      title: 'Thời Trang Hot',
      badge: 'Trending',
      badgeColor: 'bg-purple-500',
      icon: '👗',
      bgColor: 'bg-purple-50 text-purple-600 border-purple-200',
      action: () => onSelectCategory && onSelectCategory('Thời Trang Nam'),
    },
    {
      id: 'home',
      title: 'Đời Sống Gia Đình',
      badge: 'Tiện ích',
      badgeColor: 'bg-teal-500',
      icon: '🏡',
      bgColor: 'bg-teal-50 text-teal-600 border-teal-200',
      action: () => onSelectCategory && onSelectCategory('Gia Dụng'),
    },
    {
      id: 'voucher',
      title: 'Kho Voucher',
      badge: 'Đến 500K',
      badgeColor: 'bg-amber-500',
      icon: '🎟️',
      bgColor: 'bg-orange-50 text-orange-600 border-orange-200',
      action: () => onSelectTab && onSelectTab(0),
    },
    {
      id: 'newuser',
      title: 'Ưu Đãi Bạn Mới',
      badge: 'Tặng 50K',
      badgeColor: 'bg-emerald-600',
      icon: '🎁',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      action: () => onSelectTab && onSelectTab(0),
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-2 text-center">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={s.action}
            className="flex flex-col items-center group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition transform hover:-translate-y-1"
          >
            <div className="relative mb-2">
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border ${s.bgColor} shadow-sm group-hover:scale-105 transition`}
              >
                {s.icon}
              </div>
              {s.badge && (
                <span
                  className={`absolute -top-1.5 -right-2 text-[8px] font-black text-white px-1.5 py-0.2 rounded-full uppercase shadow-xs ${s.badgeColor}`}
                >
                  {s.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition leading-tight line-clamp-1">
              {s.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
