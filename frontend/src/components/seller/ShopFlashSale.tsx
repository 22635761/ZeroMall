import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ShopFlashSaleProps {
  user: any
}

interface FlashSaleSlot {
  id: string
  timeSlot: string
  status: string
  productsCount: number
}

interface FlashSaleItem {
  id: string
  flashSaleId: string
  productId: string
  product?: {
    id: string
    name: string
    image?: string
    price: string
    originalPrice?: string
  }
  flashSale?: {
    id: string
    timeSlot: string
    status: string
  }
  flashPrice: number
  originalPrice: number
  stockLimit: number
  stockSold: number
  status: string
}

export const ShopFlashSale: React.FC<ShopFlashSaleProps> = ({ user }) => {
  const [flashSales, setFlashSales] = useState<FlashSaleItem[]>([])
  const [slots, setSlots] = useState<FlashSaleSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [flashPrice, setFlashPrice] = useState('')
  const [stockLimit, setStockLimit] = useState('')

  const fetchShopFlashSales = async () => {
    if (!user?.shopId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/flash-sales/shop/${user.shopId}`)
      if (res.ok) {
        const data = await res.json()
        setFlashSales(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Lỗi khi tải Flash Sale của Shop:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/flash-sales`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setSlots(data)
          if (data.length > 0 && !selectedSlotId) {
            setSelectedSlotId(data[0].id)
          }
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách khung giờ Flash Sale:', err)
    }
  }

  const fetchProducts = async () => {
    if (!user?.shopId) return
    try {
      const res = await fetch(`${API_BASE_URL}/products?shopId=${user.shopId}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setProducts(data)
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm của Shop:', err)
    }
  }

  useEffect(() => {
    fetchShopFlashSales()
    fetchSlots()
    fetchProducts()
  }, [user?.shopId])

  const handleCreateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlotId) {
      alert('Vui lòng chọn khung giờ Flash Sale!')
      return
    }
    if (!selectedProductId) {
      alert('Vui lòng chọn sản phẩm tham gia!')
      return
    }
    if (!flashPrice || Number(flashPrice) <= 0) {
      alert('Vui lòng nhập giá Flash Sale hợp lệ!')
      return
    }
    if (!stockLimit || Number(stockLimit) <= 0) {
      alert('Vui lòng nhập số lượng khuyến mãi hợp lệ!')
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products/flash-sales/${selectedSlotId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          shopId: user.shopId,
          flashPrice: Number(flashPrice),
          stockLimit: Number(stockLimit)
        })
      })

      const data = await res.json()
      if (res.ok) {
        alert('⚡ Đăng ký Flash Sale thành công! Giá ưu đãi đã được cập nhật cho sản phẩm.')
        setShowCreateModal(false)
        setSelectedProductId('')
        setFlashPrice('')
        setStockLimit('')
        fetchShopFlashSales()
        fetchSlots()
        fetchProducts()
      } else {
        alert(`⚠️ Lỗi: ${data.message || 'Không thể đăng ký Flash Sale'}`)
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi kết nối: ${err.message}`)
    }
  }

  const handleDeleteFlashSale = async (item: FlashSaleItem) => {
    const productName = item.product?.name || 'Sản phẩm'
    if (!window.confirm(`Xác nhận hủy Flash Sale cho "${productName}" và khôi phục giá bán gốc?`)) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/products/flash-sales/items/${item.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        alert('✅ Đã xóa Flash Sale và khôi phục giá gốc cho sản phẩm thành công!')
        fetchShopFlashSales()
        fetchSlots()
        fetchProducts()
      } else {
        const data = await res.json()
        alert(`⚠️ Lỗi: ${data.message || 'Không thể xóa'}`)
      }
    } catch (err: any) {
      alert(`⚠️ Lỗi kết nối: ${err.message}`)
    }
  }

  const formatVND = (n: number) => (n || 0).toLocaleString('vi-VN') + 'đ'

  return (
    <div className="space-y-6 text-left font-sans">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
            Công Cụ Marketing Shop
          </span>
          <h2 className="text-xl font-black mt-2 flex items-center gap-2">⚡ Flash Sale Của Shop</h2>
          <p className="text-xs font-semibold text-white/90 mt-1">
            Đăng ký tham gia các khung giờ vàng Flash Sale — Giá ưu đãi được đồng bộ thẳng đến Khách hàng trên toàn sàn.
          </p>
        </div>
        <button
          onClick={() => {
            fetchSlots()
            fetchProducts()
            setShowCreateModal(true)
          }}
          className="bg-white text-orange-600 hover:bg-amber-50 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition cursor-pointer shrink-0"
        >
          ➕ Đăng Ký Flash Sale Mới
        </button>
      </div>

      {/* LIST OF CAMPAIGNS */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Danh Sách Sản Phẩm Flash Sale ({flashSales.length})
          </h3>
          <button
            onClick={() => { fetchShopFlashSales(); fetchSlots(); }}
            className="text-xs text-orange-600 font-bold hover:underline cursor-pointer"
          >
            🔄 Làm mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            Đang tải dữ liệu Flash Sale...
          </div>
        ) : flashSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            <span className="text-4xl block mb-2">⚡</span>
            Shop chưa đăng ký sản phẩm nào tham gia Flash Sale. Hãy bấm nút tạo chương trình đầu tiên!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashSales.map((item) => {
              const productName = item.product?.name || 'Sản phẩm'
              const productImage = item.product?.image || ''
              const timeSlot = item.flashSale?.timeSlot || 'Khung giờ Flash Sale'
              const slotStatus = item.flashSale?.status || 'RUNNING'

              return (
                <div key={item.id} className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-3xs space-y-4 hover:border-orange-300 transition">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 min-w-0">
                      {productImage && (
                        <img src={productImage} alt={productName} className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2">{productName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">Khung giờ: {timeSlot}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                      slotStatus === 'RUNNING' ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' :
                      slotStatus === 'UPCOMING' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {slotStatus === 'RUNNING' ? '🔥 Đang Diễn Ra' : slotStatus === 'UPCOMING' ? '⏳ Sắp Diễn Ra' : 'Đã Kết Thúc'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Giá Flash Sale</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-black text-red-600 text-sm">{formatVND(item.flashPrice)}</span>
                        {item.originalPrice > 0 && (
                          <span className="line-through text-[10px] text-slate-400">{formatVND(item.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Số lượng ưu đãi</p>
                      <p className="font-bold text-slate-700 mt-0.5">{item.stockSold} / {item.stockLimit} đã bán</p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleDeleteFlashSale(item)}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                    >
                      🗑️ Hủy Flash Sale & Khôi Phục Giá Gốc
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">⚡ Đăng Ký Flash Sale Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateFlashSale} className="space-y-4 text-xs">
              
              {/* Chọn khung giờ */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Khung giờ Flash Sale (Do Sàn cấu hình)</label>
                <select
                  required
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                >
                  <option value="">-- Chọn khung giờ Flash Sale --</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.timeSlot} ({s.status === 'RUNNING' ? 'Đang chạy' : s.status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn sản phẩm */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Chọn sản phẩm tham gia</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => {
                    const pId = e.target.value
                    setSelectedProductId(pId)
                    const p = products.find(x => x.id === pId)
                    if (p) {
                      const num = parseFloat(String(p.price).replace(/[^0-9]/g, '')) || 0
                      setFlashPrice(String(Math.round(num * 0.8))) // Đề xuất giảm 20%
                      setStockLimit(String(Math.min(p.stock || 10, 50)))
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                >
                  <option value="">-- Chọn sản phẩm của Shop --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Giá hiện tại: {Number(p.price).toLocaleString('vi-VN')}đ | Tồn: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Giá Flash Sale (VNĐ) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 150000"
                    value={flashPrice}
                    onChange={(e) => setFlashPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Số lượng suất ưu đãi <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 20"
                    value={stockLimit}
                    onChange={(e) => setStockLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl shadow-md cursor-pointer transition"
                >
                  ⚡ Kích Hoạt Flash Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
