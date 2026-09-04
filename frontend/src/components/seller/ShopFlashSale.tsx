import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ShopFlashSaleProps {
  user: any
}

interface FlashSaleItem {
  id: string
  productId?: string
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
  const [flashSales, setFlashSales] = useState<FlashSaleItem[]>(() => {
    try {
      const saved = localStorage.getItem('zm_shop_flash_sales')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FlashSaleItem | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [flashPrice, setFlashPrice] = useState('')
  const [stockLimit, setStockLimit] = useState('')
  const [timeSlot, setTimeSlot] = useState('15:00 - 21:00 Hôm nay')

  useEffect(() => {
    try {
      localStorage.setItem('zm_shop_flash_sales', JSON.stringify(flashSales))
    } catch (e) { console.error(e) }
  }, [flashSales])

  useEffect(() => {
    if (user?.shopId) {
      fetch(`${API_BASE_URL}/products?shopId=${user.shopId}`)
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setProducts(data) })
        .catch(err => console.error(err))
    }
  }, [user?.shopId])

  const syncProductPrice = async (productId: string, newFlashPrice: string, currentPrice: string | number) => {
    if (!productId || !newFlashPrice || productId.startsWith('demo-')) return
    try {
      await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: String(newFlashPrice),
          originalPrice: String(currentPrice || Number(newFlashPrice) * 1.3)
        })
      })
    } catch (err) { console.error(err) }
  }

  const handleCreateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault()
    const product = products.find(p => p.id === selectedProductId)
    const newFs: FlashSaleItem = {
      id: `FS-${Date.now().toString().slice(-6)}`,
      productId: selectedProductId,
      productName: product ? product.name : 'Sản phẩm',
      productImage: product ? product.image : '',
      originalPrice: product ? Number(product.originalPrice || product.price) : 0,
      flashPrice: Number(flashPrice),
      stockLimit: Number(stockLimit),
      stockSold: 0,
      timeSlot,
      status: 'ONGOING'
    }
    const updated = [newFs, ...flashSales]
    setFlashSales(updated)
    await syncProductPrice(selectedProductId, flashPrice, product?.originalPrice || product?.price)
    setShowCreateModal(false)
    setSelectedProductId(''); setFlashPrice(''); setStockLimit('')
    alert('⚡ Flash Sale đã kích hoạt! Giá ưu đãi đã được cập nhật cho Khách hàng.')
  }

  const handleEditFlashSale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    const updated = flashSales.map(fs => {
      if (fs.id !== editingItem.id) return fs
      return {
        ...fs,
        flashPrice: Number(flashPrice) || fs.flashPrice,
        stockLimit: Number(stockLimit) || fs.stockLimit,
        timeSlot,
      }
    })
    setFlashSales(updated)
    const newFlashPrice = flashPrice || String(editingItem.flashPrice)
    await syncProductPrice(editingItem.productId || '', newFlashPrice, editingItem.originalPrice)
    setEditingItem(null)
    setFlashPrice(''); setStockLimit('')
    alert('✅ Đã cập nhật Flash Sale thành công!')
  }

  const openEditModal = (item: FlashSaleItem) => {
    setEditingItem(item)
    setFlashPrice(String(item.flashPrice))
    setStockLimit(String(item.stockLimit))
    setTimeSlot(item.timeSlot)
  }

  const handleDeleteFlashSale = async (item: FlashSaleItem) => {
    if (!window.confirm(`Xóa Flash Sale "${item.productName}" và khôi phục giá gốc?`)) return
    const updated = flashSales.filter(fs => fs.id !== item.id)
    setFlashSales(updated)
    // Restore original price
    if (item.productId && !item.productId.startsWith('demo-')) {
      try {
        await fetch(`${API_BASE_URL}/products/${item.productId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: String(item.originalPrice), originalPrice: null })
        })
      } catch (err) { console.error(err) }
    }
    alert('Đã xóa Flash Sale và khôi phục giá gốc.')
  }

  const formatVND = (n: number) => n.toLocaleString('vi-VN') + 'đ'

  return (
    <div className="space-y-6 text-left font-sans">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-md flex justify-between items-center">
        <div>
          <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
            Công Cụ Marketing Shop
          </span>
          <h2 className="text-xl font-black mt-2 flex items-center gap-2">⚡ Flash Sale Của Shop</h2>
          <p className="text-xs font-semibold text-white/90 mt-1">
            Tạo giá sốc Flash Sale — giá được đồng bộ thẳng tới Khách hàng ngay lập tức.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-white text-orange-600 hover:bg-amber-50 font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition cursor-pointer shrink-0"
        >
          ➕ Tạo Flash Sale Mới
        </button>
      </div>

      {/* LIST OF CAMPAIGNS */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Chương Trình Flash Sale ({flashSales.length})
        </h3>

        {flashSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold">
            <span className="text-4xl block mb-2">⚡</span>
            Chưa có Flash Sale nào. Hãy tạo chương trình đầu tiên!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashSales.map((item) => (
              <div key={item.id} className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-3xs space-y-4 hover:border-orange-300 transition">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex gap-3">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-16 h-16 object-cover rounded-xl border border-slate-100 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2">{item.productName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Mã FS: {item.id} · {item.timeSlot}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
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
                    onClick={() => openEditModal(item)}
                    className="flex-1 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    ✏️ Chỉnh Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteFlashSale(item)}
                    className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                  >
                    🗑️ Xóa Flash Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">⚡ Tạo Flash Sale Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateFlashSale} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Chọn sản phẩm tham gia</label>
                <select
                  required value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                >
                  <option value="">-- Chọn sản phẩm của Shop --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Giá hiện tại: {Number(p.price).toLocaleString('vi-VN')}đ)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Khung giờ Flash Sale</label>
                <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer">
                  <option value="09:00 - 15:00 Hôm nay">09:00 - 15:00 Hôm nay</option>
                  <option value="15:00 - 21:00 Hôm nay">15:00 - 21:00 Hôm nay</option>
                  <option value="21:00 - 24:00 Hôm nay">21:00 - 24:00 Hôm nay</option>
                  <option value="09:00 - 15:00 Ngày mai">09:00 - 15:00 Ngày mai</option>
                  <option value="15:00 - 21:00 Ngày mai">15:00 - 21:00 Ngày mai</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Giá Flash Sale (VND)</label>
                  <input type="number" required placeholder="Ví dụ: 199000"
                    value={flashPrice} onChange={(e) => setFlashPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Số lượng khuyến mãi</label>
                  <input type="number" required placeholder="Ví dụ: 50"
                    value={stockLimit} onChange={(e) => setStockLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl shadow-md cursor-pointer transition">
                  ⚡ Kích Hoạt Flash Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase">✏️ Chỉnh Sửa Flash Sale</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer">✕</button>
            </div>

            {/* Product info banner */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
              {editingItem.productImage && (
                <img src={editingItem.productImage} alt={editingItem.productName} className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
              )}
              <div>
                <p className="font-extrabold text-slate-800 text-xs">{editingItem.productName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Mã FS: {editingItem.id}</p>
              </div>
            </div>

            <form onSubmit={handleEditFlashSale} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Khung giờ Flash Sale</label>
                <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white cursor-pointer">
                  <option value="09:00 - 15:00 Hôm nay">09:00 - 15:00 Hôm nay</option>
                  <option value="15:00 - 21:00 Hôm nay">15:00 - 21:00 Hôm nay</option>
                  <option value="21:00 - 24:00 Hôm nay">21:00 - 24:00 Hôm nay</option>
                  <option value="09:00 - 15:00 Ngày mai">09:00 - 15:00 Ngày mai</option>
                  <option value="15:00 - 21:00 Ngày mai">15:00 - 21:00 Ngày mai</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Giá Flash Sale mới (VND)</label>
                  <input type="number" placeholder={String(editingItem.flashPrice)}
                    value={flashPrice} onChange={(e) => setFlashPrice(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500" />
                  <p className="text-[10px] text-slate-400">Hiện tại: {formatVND(editingItem.flashPrice)}</p>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600">Số lượng khuyến mãi</label>
                  <input type="number" placeholder={String(editingItem.stockLimit)}
                    value={stockLimit} onChange={(e) => setStockLimit(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500" />
                  <p className="text-[10px] text-slate-400">Hiện tại: {editingItem.stockLimit} sản phẩm</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer transition">Hủy</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-xl shadow-md cursor-pointer transition">
                  ✅ Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
