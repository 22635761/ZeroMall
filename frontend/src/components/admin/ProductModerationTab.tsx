import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface ProductModerationTabProps {
  triggerAuditLog: (action: string) => Promise<void>
}

export const ProductModerationTab: React.FC<ProductModerationTabProps> = ({ triggerAuditLog }) => {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'ACTIVE' | 'VIOLATIONS' | 'DELISTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [categories, setCategories] = useState<any[]>([])
  const [shopsMap, setShopsMap] = useState<Record<string, string>>({})

  // Modals
  const [deleteModalProduct, setDeleteModalProduct] = useState<any | null>(null)
  const [deleteReason, setDeleteReason] = useState('Hàng giả / Nhái nhãn hiệu')
  const [deleteNote, setDeleteNote] = useState('')
  const [penaltyPoints, setPenaltyPoints] = useState<number>(3)
  const [isDeleting, setIsDeleting] = useState(false)

  // Preview Modal
  const [previewProduct, setPreviewProduct] = useState<any | null>(null)

  // Edit Stock & Sales Override Modal
  const [stockEditProduct, setStockEditProduct] = useState<any | null>(null)
  const [editStockValue, setEditStockValue] = useState<number>(0)
  const [editSalesValue, setEditSalesValue] = useState<number>(0)
  const [isUpdatingStock, setIsUpdatingStock] = useState<boolean>(false)

  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const [resProd, resCat, resShops] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/products/categories`),
        fetch(`${API_BASE_URL}/auth/shops`),
      ])
      if (resProd.ok) {
        const prodData = await resProd.json()
        setProducts(prodData)
      }
      if (resCat.ok) {
        setCategories(await resCat.json())
      }
      if (resShops.ok) {
        const shopsData = await resShops.json()
        const map: Record<string, string> = {}
        shopsData.forEach((s: any) => { map[s.id] = s.name })
        setShopsMap(map)
      }
    } catch (e) {
      console.error('Error fetching products for moderation:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllProducts()
  }, [])

  // Format currency
  const formatMoney = (val: any) => {
    const num = parseFloat(val) || 0
    return num.toLocaleString('vi-VN') + 'đ'
  }

  // Filter products
  const filteredProducts = products.filter((p) => {
    // 1. SubTab Filter
    if (activeSubTab === 'ACTIVE' && (p.isViolated || p.status === 'hidden')) return false
    if (activeSubTab === 'VIOLATIONS' && !p.isViolated && (!p.reportsCount || p.reportsCount === 0)) return false
    if (activeSubTab === 'DELISTED' && p.status !== 'hidden' && !p.isViolated) return false

    // 2. Category Filter
    if (categoryFilter !== 'ALL') {
      const catMatch = p.category === categoryFilter || p.categoryId === categoryFilter || p.categoryRef?.slug === categoryFilter
      if (!catMatch) return false
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = (p.name || '').toLowerCase().includes(q)
      const idMatch = (p.id || '').toLowerCase().includes(q)
      const shopName = (shopsMap[p.shopId] || '').toLowerCase()
      const shopMatch = shopName.includes(q) || (p.shopId || '').toLowerCase().includes(q)
      if (!nameMatch && !idMatch && !shopMatch) return false
    }

    return true
  })

  // Count stats
  const countAll = products.length
  const countActive = products.filter(p => !p.isViolated && p.status !== 'hidden').length
  const countViolations = products.filter(p => p.isViolated || (p.reportsCount && p.reportsCount > 0)).length
  const countDelisted = products.filter(p => p.status === 'hidden' || p.isViolated).length

  // Xử lý Xóa Vi Phạm Sản Phẩm
  const handleConfirmDeleteViolation = async () => {
    if (!deleteModalProduct) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/${deleteModalProduct.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const fullReason = `Xóa sản phẩm vi phạm: [${deleteReason}] ${deleteNote ? `- Ghi chú: ${deleteNote}` : ''} (+${penaltyPoints} điểm Sao Quả Tạ Shop ${shopsMap[deleteModalProduct.shopId] || deleteModalProduct.shopId})`
        await triggerAuditLog(`[ADMIN MODERATION] ${fullReason} - Sản phẩm: ${deleteModalProduct.name} (ID: ${deleteModalProduct.id})`)
        alert(`✅ Đã xóa vĩnh viễn sản phẩm vi phạm "${deleteModalProduct.name}" và ghi nhận chế tài thành công!`)
        setDeleteModalProduct(null)
        setDeleteNote('')
        fetchAllProducts()
      } else {
        alert('Lỗi: Không thể xóa sản phẩm. Vui lòng thử lại.')
      }
    } catch (e: any) {
      alert('Lỗi kết nối: ' + e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Xử lý Tạm Khóa / Mở Khóa Sản Phẩm
  const handleToggleProductStatus = async (product: any) => {
    const nextStatus = product.status === 'hidden' ? 'active' : 'hidden'
    const confirmText = nextStatus === 'hidden' 
      ? `Tạm khóa / Ẩn sản phẩm "${product.name}" khỏi sàn?` 
      : `Mở khóa hiển thị lại sản phẩm "${product.name}" trên sàn?`

    if (!window.confirm(confirmText)) return

    try {
      const res = await fetch(`${API_BASE_URL}/products/${product.id}/toggle-status`, {
        method: 'PUT',
      })
      if (res.ok) {
        await triggerAuditLog(`[ADMIN MODERATION] Đổi trạng thái sản phẩm ${product.name} (ID: ${product.id}) sang ${nextStatus}`)
        fetchAllProducts()
      } else {
        alert('Không thể cập nhật trạng thái sản phẩm.')
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    }
  }

  // Xử lý Bỏ Qua Cảnh Báo Vi Phạm
  const handleDismissViolation = async (product: any) => {
    if (!window.confirm(`Xác nhận sản phẩm "${product.name}" hợp lệ và xóa sạch cảnh báo báo cáo vi phạm?`)) return
    try {
      const res = await fetch(`${API_BASE_URL}/products/violations/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isViolated: false }),
      })
      if (res.ok) {
        await triggerAuditLog(`[ADMIN MODERATION] Bỏ qua cảnh báo vi phạm cho sản phẩm ${product.name} (ID: ${product.id})`)
        alert('Đã xóa cảnh báo vi phạm thành công!')
        fetchAllProducts()
      }
    } catch (e: any) {
      alert('Lỗi: ' + e.message)
    }
  }

  // Xử lý Cưỡng chế Điều chỉnh Kho & Lượt Bán của Admin
  const handleSaveStockAndSales = async () => {
    if (!stockEditProduct) return
    setIsUpdatingStock(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/${stockEditProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock: editStockValue,
          sales: editSalesValue,
        }),
      })

      if (res.ok) {
        await triggerAuditLog(`[ADMIN INVENTORY OVERRIDE] Điều chỉnh kho/bán cho sản phẩm "${stockEditProduct.name}" (ID: ${stockEditProduct.id}) -> Tồn kho: ${editStockValue}, Đã bán: ${editSalesValue}`)
        alert(`✅ Đã điều chỉnh Tồn kho & Lượt bán cho sản phẩm "${stockEditProduct.name}" thành công!`)
        setStockEditProduct(null)
        fetchAllProducts()
      } else {
        alert('Lỗi: Không thể cập nhật Tồn kho/Lượt bán.')
      }
    } catch (e: any) {
      alert('Lỗi kết nối: ' + e.message)
    } finally {
      setIsUpdatingStock(false)
    }
  }

  return (
    <div className="space-y-4 text-left">
      {/* 1. Header Card & SubTab Navigation */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📦</span>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Quản Lý & Kiểm Duyệt Sản Phẩm (Product Moderation Center)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Kiểm soát chất lượng danh mục, xử lý hàng cấm/hàng giả, delist hoặc gỡ bỏ vi phạm chuẩn Shopee
            </p>
          </div>

          <button
            onClick={fetchAllProducts}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>🔄</span> Tải Lại Dữ Liệu
          </button>
        </div>

        {/* Status Sub-Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold gap-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'Tất Cả Sản Phẩm', count: countAll, color: 'text-slate-700' },
            { id: 'ACTIVE', label: 'Đang Hoạt Động', count: countActive, color: 'text-emerald-700' },
            { id: 'VIOLATIONS', label: 'Bị Báo Cáo / Vi Phạm', count: countViolations, color: 'text-rose-600', badge: 'bg-rose-500 text-white' },
            { id: 'DELISTED', label: 'Đã Tạm Khóa / Ẩn', count: countDelisted, color: 'text-amber-700' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`pb-3 px-3 transition cursor-pointer relative flex items-center gap-1.5 whitespace-nowrap ${
                activeSubTab === tab.id
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                tab.badge ? tab.badge : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <div className="sm:col-span-8 relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, mã SKU/ID, hoặc tên Shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ngành hàng</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Product Moderation Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-bold">Đang tải danh sách sản phẩm...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <span className="text-4xl">📭</span>
            <p className="text-xs font-bold">Không tìm thấy sản phẩm nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Sản Phẩm & Mã ID</th>
                  <th className="py-3.5 px-3">Gian Hàng (Shop)</th>
                  <th className="py-3.5 px-3">Ngành Hàng</th>
                  <th className="py-3.5 px-3 text-right">Giá Bán</th>
                  <th className="py-3.5 px-3 text-center">Trạng Thái / Vi Phạm</th>
                  <th className="py-3.5 px-4 text-center">Chế Tài & Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const shopName = shopsMap[p.shopId] || p.shopId
                  const isViolated = p.isViolated || (p.reportsCount && p.reportsCount > 0)
                  const isHidden = p.status === 'hidden'

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      {/* Cột 1: Thông tin sản phẩm */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <img
                            src={p.image || 'https://placehold.co/100x100?text=No+Image'}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-slate-900 line-clamp-1 hover:text-emerald-700 transition" title={p.name}>
                              {p.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 12)}...</p>
                            {p.brand && (
                              <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                                Brand: {p.brand}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Gian hàng */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">{shopName}</p>
                          <a
                            href={`/shop/${p.shopId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 font-semibold"
                          >
                            <span>🏪 Xem Shop</span>
                          </a>
                        </div>
                      </td>

                      {/* Cột 3: Ngành hàng */}
                      <td className="py-3.5 px-3 font-semibold text-slate-600">
                        {p.category || 'Mặc định'}
                      </td>

                      {/* Cột 4: Giá bán */}
                      <td className="py-3.5 px-3 text-right">
                        <p className="font-black text-[#ee4d2d]">{formatMoney(p.price)}</p>
                        {p.originalPrice && (
                          <p className="text-[10px] text-slate-400 line-through">{formatMoney(p.originalPrice)}</p>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái & Cảnh báo vi phạm */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1 inline-flex flex-col items-center">
                          {isViolated ? (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black rounded-md flex items-center gap-1 animate-pulse">
                              <span>⚠️</span> Vi phạm ({p.reportsCount || 1} report)
                            </span>
                          ) : isHidden ? (
                            <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded-md">
                              🔒 Đang Tạm Khóa
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-md">
                              ✅ Đang Hoạt Động
                            </span>
                          )}

                          {p.violationReason && (
                            <p className="text-[9px] text-rose-600 max-w-[140px] truncate font-semibold" title={p.violationReason}>
                              {p.violationReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Cột 7: Thao tác & Chế tài Admin */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Nút Xem Trước */}
                          <button
                            onClick={() => setPreviewProduct(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Xem nhanh chi tiết sản phẩm"
                          >
                            👁️
                          </button>

                          {/* Nút Điều chỉnh Kho / Lượt Bán (Admin Override) */}
                          <button
                            onClick={() => {
                              setStockEditProduct(p)
                              setEditStockValue(p.stock || 0)
                              setEditSalesValue(p.sales || 0)
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Kiểm soát Kho & Lượt Bán"
                          >
                            📦
                          </button>

                          {/* Nút Bỏ Qua Vi Phạm (Nếu đang bị cờ vi phạm) */}
                          {isViolated && (
                            <button
                              onClick={() => handleDismissViolation(p)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Bỏ qua cảnh báo vi phạm"
                            >
                              Bỏ qua
                            </button>
                          )}

                          {/* Nút Khóa / Mở Khóa */}
                          <button
                            onClick={() => handleToggleProductStatus(p)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                              isHidden
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                            title={isHidden ? 'Mở khóa sản phẩm' : 'Tạm khóa sản phẩm'}
                          >
                            {isHidden ? 'Mở khóa' : 'Tạm ẩn'}
                          </button>

                          {/* Nút Xóa Vi Phạm Vĩnh Viễn */}
                          <button
                            onClick={() => {
                              setDeleteModalProduct(p)
                              setDeleteReason(p.violationReason || 'Hàng giả / Nhái nhãn hiệu')
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shadow-3xs flex items-center gap-1"
                            title="Gỡ bỏ vĩnh viễn do vi phạm"
                          >
                            <span>🗑️</span> Xóa Vi Phạm
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: XÁC NHẬN XÓA VI PHẠM & ÁP DỤNG CHẾ TÀI CHUẨN SHOPEE */}
      {deleteModalProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-hidden text-left border border-slate-100">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚫</span>
                <h3 className="font-black text-slate-900 text-base">Gỡ Bỏ Sản Phẩm Do Vi Phạm</h3>
              </div>
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin sản phẩm chuẩn bị xóa */}
            <div className="p-3 bg-slate-50 rounded-2xl flex gap-3 items-center border border-slate-200/60">
              <img
                src={deleteModalProduct.image || 'https://placehold.co/100x100?text=No+Image'}
                alt={deleteModalProduct.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900 text-xs line-clamp-1">{deleteModalProduct.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">Shop: <strong>{shopsMap[deleteModalProduct.shopId] || deleteModalProduct.shopId}</strong></p>
                <p className="text-[10px] text-[#ee4d2d] font-bold">Giá: {formatMoney(deleteModalProduct.price)}</p>
              </div>
            </div>

            {/* Form chọn điều khoản vi phạm */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">1. Điều khoản vi phạm (Lý do chính):</label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="Hàng giả / Nhái nhãn hiệu bản quyền">Hàng giả / Nhái nhãn hiệu bản quyền</option>
                  <option value="Hàng cấm buôn bán theo quy định pháp luật">Hàng cấm buôn bán theo quy định pháp luật</option>
                  <option value="Hình ảnh / Nội dung phản cảm, đồi trụy">Hình ảnh / Nội dung phản cảm, đồi trụy</option>
                  <option value="Spam từ khóa / Đăng sai ngành hàng">Spam từ khóa / Đăng sai ngành hàng</option>
                  <option value="Gian lận giá / Tăng giá ảo trước khuyến mãi">Gian lận giá / Tăng giá ảo trước khuyến mãi</option>
                  <option value="Hàng hóa kém chất lượng / Nhiều khiếu nại">Hàng hóa kém chất lượng / Nhiều khiếu nại</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">2. Điểm phạt Sao Quả Tạ (Penalty Points):</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setPenaltyPoints(pts)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition cursor-pointer ${
                        penaltyPoints === pts
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-200'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      +{pts} Điểm
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">3. Ghi chú chi tiết cho Shop:</label>
                <textarea
                  rows={2}
                  placeholder="Nhập chi tiết bằng chứng hoặc nội dung vi phạm để gửi thông báo cho người bán..."
                  value={deleteNote}
                  onChange={(e) => setDeleteNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <p className="font-bold">⚠️ Lưu ý nghiệp vụ Kế toán & Hóa đơn:</p>
                <p>Hành động này sẽ gỡ bỏ sản phẩm khỏi sàn và gian hàng. Các **hóa đơn cũ của khách hàng đã mua sản phẩm này vẫn được bảo toàn nguyên vẹn**.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmDeleteViolation}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {isDeleting ? 'Đang xử lý...' : 'Xác Nhận Xóa Vi Phạm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM NHANH CHI TIẾT SẢN PHẨM (PREVIEW MODAL) */}
      {previewProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden text-left border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="font-black text-slate-900 text-base">Chi Tiết Sản Phẩm Kiểm Duyệt</h3>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <img
                  src={previewProduct.image || 'https://placehold.co/300x300?text=No+Image'}
                  alt={previewProduct.name}
                  className="w-full h-56 object-cover rounded-2xl border border-slate-200 shadow-xs"
                />
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-black text-slate-900 text-sm">{previewProduct.name}</h4>
                <p className="text-slate-500">Mã SKU / ID: <code className="font-mono text-slate-800">{previewProduct.id}</code></p>
                <p className="text-slate-500">Gian hàng: <strong>{shopsMap[previewProduct.shopId] || previewProduct.shopId}</strong></p>
                <p className="text-slate-500">Ngành hàng: <strong>{previewProduct.category}</strong></p>
                <p className="text-slate-500">Thương hiệu: <strong>{previewProduct.brand || 'No Brand'}</strong></p>
                <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl">
                  <span className="text-xs text-slate-500">Giá bán niêm yết:</span>
                  <p className="text-lg font-black text-[#ee4d2d]">{formatMoney(previewProduct.price)}</p>
                </div>
                <p className="text-slate-600">Tồn kho: <strong>{previewProduct.stock}</strong> | Đã bán: <strong>{previewProduct.sales || 0}</strong></p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800">Mô tả sản phẩm:</span>
              <p className="p-3 bg-slate-50 rounded-xl text-slate-600 max-h-32 overflow-y-auto leading-relaxed border border-slate-200/50">
                {previewProduct.description || 'Chưa có mô tả'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KIỂM SOÁT & ĐIỀU CHỈNH KHO / LƯỢT BÁN (ADMIN OVERRIDE) */}
      {stockEditProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl overflow-hidden text-left border border-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="font-black text-slate-900 text-base">Kiểm Soát Tồn Kho & Lượt Bán</h3>
              </div>
              <button
                onClick={() => setStockEditProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thông tin sản phẩm */}
            <div className="p-3 bg-slate-50 rounded-2xl flex gap-3 items-center border border-slate-200/60">
              <img
                src={stockEditProduct.image || 'https://placehold.co/100x100?text=No+Image'}
                alt={stockEditProduct.name}
                className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900 text-xs line-clamp-1">{stockEditProduct.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">Shop: <strong>{shopsMap[stockEditProduct.shopId] || stockEditProduct.shopId}</strong></p>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">1. Số lượng Tồn Kho Thực Tế (Stock):</label>
                <input
                  type="number"
                  min="0"
                  value={editStockValue}
                  onChange={(e) => setEditStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  * Đặt về 0 nếu phát hiện hàng hóa bị thu hồi hoặc Shop kê khống kho ảo.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">2. Số Lượng Đã Bán (Sales Count):</label>
                <input
                  type="number"
                  min="0"
                  value={editSalesValue}
                  onChange={(e) => setEditSalesValue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-between items-center pt-1">
                  <p className="text-[10px] text-slate-400">
                    * Reset về 0 nếu phát hiện Shop gian lận buff đơn ảo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditSalesValue(0)}
                    className="px-2 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-bold cursor-pointer border border-rose-200"
                  >
                    Reset về 0
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStockEditProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveStockAndSales}
                disabled={isUpdatingStock}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStock ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
