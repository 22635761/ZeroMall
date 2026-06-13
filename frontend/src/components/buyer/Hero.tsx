import React, { useState, useEffect } from 'react'

export const Hero: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0)

  const slides = [
    {
      title: 'XANH MÁT NGÀY HÈ 6.6',
      sub: 'Miễn Phí Vận Chuyển Toàn Quốc Cho Mọi Đơn Hàng',
      img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
      badge: 'MINT SALE',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'ĐẠI TIỆC CÔNG NGHỆ',
      sub: 'Giảm Đến 50% - Trả Góp 0% Lãi Suất',
      img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
      badge: 'TECH ZONE',
      color: 'from-blue-600 to-indigo-500'
    },
    {
      title: 'XU HƯỚNG THỜI TRANG BÊN VỮNG',
      sub: 'Chất Liệu Tự Nhiên - Hoàn Xu 10% Đơn Hàng',
      img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80',
      badge: 'ECO FASHION',
      color: 'from-teal-500 to-emerald-600'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <section className="space-y-4">
      {/* Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Carousel Banner */}
        <div className="lg:col-span-8 relative aspect-[21/9] sm:aspect-[21/8] lg:h-[320px] rounded-2xl overflow-hidden group shadow-sm border border-slate-200/50 bg-slate-50">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 flex items-center justify-between ${
                idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Text content overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent z-10 flex flex-col justify-center px-8 sm:px-12 text-left text-white space-y-2.5">
                <span className="inline-block self-start text-[9px] font-extrabold px-2 py-0.5 rounded-sm bg-white text-emerald-600 shadow-sm uppercase tracking-wider">
                  {slide.badge}
                </span>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight uppercase">
                  {slide.title}
                </h2>
                <p className="text-[10px] sm:text-xs text-white/85 font-medium max-w-xs sm:max-w-md">
                  {slide.sub}
                </p>
                <button className="self-start text-[10px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md shadow-md transition cursor-pointer">
                  MUA NGAY
                </button>
              </div>

              {/* Background Image */}
              <img
                src={slide.img}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all border border-white/20 cursor-pointer ${
                  idx === activeSlide ? 'bg-emerald-600 w-6' : 'bg-white/60 hover:bg-white'
                }`}
              ></button>
            ))}
          </div>
        </div>

        {/* Right Column: Stacked Banners */}
        <div className="lg:col-span-4 flex lg:flex-col gap-4 h-full">
          {/* Sub banner 1 */}
          <div className="flex-1 aspect-[21/9] lg:aspect-auto lg:h-[152px] rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/50 bg-slate-50 group">
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent z-10 flex flex-col justify-center p-5 text-left text-white space-y-1">
              <span className="text-[9px] font-extrabold text-teal-300 tracking-wider">ĐỘC QUYỀN ZEROMALL</span>
              <h3 className="text-xs sm:text-sm font-bold uppercase truncate">
                Mã Freeship Lên Tới 300K
              </h3>
              <p className="text-[9px] text-white/80">Nhận mã miễn phí vận chuyển tuần này</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=80"
              alt="Sub Banner 1"
              className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
            />
          </div>

          {/* Sub banner 2 */}
          <div className="flex-1 aspect-[21/9] lg:aspect-auto lg:h-[152px] rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/50 bg-slate-50 group">
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent z-10 flex flex-col justify-center p-5 text-left text-white space-y-1">
              <span className="text-[9px] font-extrabold text-emerald-300 tracking-wider">XU HƯỚNG MỚI</span>
              <h3 className="text-xs sm:text-sm font-bold uppercase truncate">
                Sản Phẩm Công Nghệ Xanh
              </h3>
              <p className="text-[9px] text-white/80">Trả góp lãi suất 0% kỳ hạn dài</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80"
              alt="Sub Banner 2"
              className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
            />
          </div>
        </div>
      </div>

      {/* Modern Services Policies Bar */}
      <div className="bg-white border border-slate-200/60 rounded-xl grid grid-cols-3 divide-x divide-slate-100 py-3.5 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 text-slate-700 px-2">
          <span className="text-lg text-emerald-600 hidden sm:inline">🛡️</span>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">7 Ngày Miễn Phí Trả Hàng</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-700 px-2">
          <span className="text-lg text-emerald-600 hidden sm:inline">🌟</span>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">100% Hàng Chính Hãng</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-700 px-2">
          <span className="text-lg text-emerald-600 hidden sm:inline">🚚</span>
          <span className="text-[10px] sm:text-xs font-semibold text-slate-700 truncate">Miễn Phí Giao Hàng Toàn Quốc</span>
        </div>
      </div>
    </section>
  )
}
