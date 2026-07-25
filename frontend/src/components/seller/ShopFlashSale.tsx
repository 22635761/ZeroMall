import React, { useState, useEffect } from 'react'

interface ShopFlashSaleProps {
  user: any
}

interface FlashSaleItem {
  id: string
  productName: string
  productImage: string
  originalPrice: number
  flashPrice: number
  stockLimit: number
  stockSold: number
  timeSlot: string
  status: 'UPCOMING' | 'ONGOING' | 'ENDED'
}

export const ShopFlashSale: React.FC<ShopFlashSaleProps> = ({ user }) => {
  const [flashSales, setFlashSales] = useState<FlashSaleItem[]>([
    {
      id: 'FS-101',
      productName: 'Áo Khác Bomber Nam Phong Cách Hàn Quốc',
      productImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      originalPrice: 350000,
      flashPrice: 199000,
      stockLimit: 50,
      stockSold: 18,
      timeSlot: '15:00 - 21:00 Hôm nay',
      status: 'ONGOING'
    },
    {
      id: 'FS-102',
      productName: 'Tai Nghe Bluetooth Không Dây ZeroBuds Pro',
      productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      originalPrice: 590000,
      flashPrice: 299000,
      stockLimit: 100,
      stockSold: 0,
      timeSlot: '21:00 - 24:00 Ngày mai',
      status: 'UPCOMING'
    }
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [flashPrice, setFlashPrice] = useState('')
  const [stockLimit, setStockLimit] = useState('')
  const [timeSlot, setTimeSlot] = useState('15:00 - 21:00 Hôm nay')

  useEffect(() => {
    if (user?.shopId) {
      fetch(`http://localhost:8000/products?shopId=${user.shopId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setProducts(data)
        })
        .catch(err => console.error(err))
    }
  }, [user?.shopId])

  const handleCreateFlashSale = (e: React.FormEvent) => {
    e.preventDefault()
    const product = products.find(p => p.id === selectedProductId)
    const newFs: FlashSaleItem = {
      id: `FS-${Date.now().toString().slice(-4)}`,
      productName: product ? product.name : 'Sản phẩm thử nghiệm',
      productImage: product ? product.image : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      originalPrice: product ? Number(product.price) : 250000,
      flashPrice: Number(flashPrice) || 150000,
      stockLimit: Number(stockLimit) || 30,
      stockSold: 0,
      timeSlot,
      status: 'UPCOMING'
    }

    setFlashSales(prev => [newFs, ...prev])
    setShowCreateModal(false)
    setSelectedProductId('')
    setFlashPrice('')
    setStockLimit('')
    alert('⚡ Đã đăng ký chương trình Flash Sale thành công!')
  }

  return (
    <div className="space-y-6 text-left font-sans">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-md flex justify-between items-center">
        <div>
          <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
            Công Cụ Marketing Shop
          </span>
          <h2 className="text-xl font-black mt-2 flex items-center gap-2">
            ⚡ Flash Sale Của Shop
          </h2>
          <p className="text-xs font-semibold text-white/90 mt-1">
            Tăng vọt doanh số và lượt truy cập cửa hàng bằng cách bùng nổ giá sốc theo các khung giờ vàng trong ngày.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-orange-600 hover:bg-amber-50 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition cursor-pointer shrink-0"
        >
          ➕ Tạo Khung Giờ Flash Sale
        </button>
      </div>

      {/* LIST OF CAMPAIGNS */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Chương Trình Flash Sale Đang Khởi Tạo & Diễn Ra ({flashSales.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashSales.map((item) => (
            <div key={item.id} className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-3xs space-y-4 hover:border-orange-300 transition">
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3">
                  <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2">{item.productName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Mã FS: {item.id} · {item.timeSlot}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                  item.status === 'ONGOING' ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                  item.status === 'UPCOMING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.status === 'ONGOING' ? '🔥 Đang Diễn Ra' : item.status === 'UPCOMING' ? '⏳ Sắp Diễn Ra' : 'Đã Kết Thúc'}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Giá Flash Sale</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-black text-red-600 text-sm">{item.flashPrice.toLocaleString('vi-VN')}đ</span>
                    <span className="line-through text-[10px] text-slate-400">{item.originalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Số lượng ưu đãi</p>
                  <p className="font-bold text-slate-700 mt-0.5">{item.stockSold} / {item.stockLimit} đã bán</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">⚡ Đăng ký Flash Sale Shop</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateFlashSale} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Chọn sản phẩm tham gia</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-orange-500 bg-white"
                >
                  <option value="">-- Chọn sản phẩm của Shop --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString('vi-VN')}đ)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Khung giờ Flash Sale</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-orange-500 bg-white"
                >
                  <option value="09:00 - 15:00 Hôm nay">09:00 - 15:00 Hôm nay</option>
                  <option value="15:00 - 21:00 Hôm nay">15:00 - 21:00 Hôm nay</option>
                  <option value="21:00 - 24:00 Hôm nay">21:00 - 24:00 Hôm nay</option>
                  <option value="09:00 - 15:00 Ngày mai">09:00 - 15:00 Ngày mai</option>
                  <option value="15:00 - 21:00 Ngày mai">15:00 - 21:00 Ngày mai</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Giá khuyến mãi (VND)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 199000"
                    value={flashPrice}
                    onChange={(e) => setFlashPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Số lượng khuyến mãi</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 50"
                    value={stockLimit}
                    onChange={(e) => setStockLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl shadow-md"
                >
                  Xác Nhận Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
