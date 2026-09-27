import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface CategoriesTabProps {
  categories: any[]
  fetchCategories: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, fetchCategories, triggerAuditLog }) => {
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingAction, setLoadingAction] = useState(false)

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setLoadingAction(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      if (res.ok) {
        await triggerAuditLog(`Tạo danh mục sản phẩm mới "${newCategoryName.trim()}"`)
        fetchCategories()
        setNewCategoryName('')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Lỗi khi tạo danh mục sản phẩm')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return
    setLoadingAction(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCatName.trim() }),
      })
      if (res.ok) {
        await triggerAuditLog(`Cập nhật đổi tên danh mục "${editingCatName.trim()}" (ID: ${id})`)
        fetchCategories()
        setEditingCatId(null)
        setEditingCatName('')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Lỗi khi đổi tên danh mục')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối')
    } finally {
      setLoadingAction(false)
    }
  }

  const handleDeleteCategory = async (cat: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${cat.name}"?\n(Các sản phẩm thuộc ngành hàng này sẽ không bị xóa mà được gỡ liên kết danh mục)`)) {
      return
    }
    setLoadingAction(true)
    try {
      const res = await fetch(`${API_BASE_URL}/products/categories/${cat.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await triggerAuditLog(`Xóa danh mục sản phẩm "${cat.name}" (ID: ${cat.id})`)
        fetchCategories()
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Lỗi khi xóa danh mục')
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối')
    } finally {
      setLoadingAction(false)
    }
  }

  const filteredCategories = categories.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0)

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
      {/* Header with Title & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase flex items-center gap-2">
            <span>🗂️</span> Quản lý danh mục & Ngành hàng sản phẩm
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tất cả ngành hàng tại đây được đồng bộ 100% với form đăng sản phẩm của Người bán (Seller)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng ngành hàng</div>
            <div className="text-sm font-black text-emerald-600">{categories.length} danh mục ({totalProducts} sản phẩm)</div>
          </div>
        </div>
      </div>

      {/* Action Bar: Create & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
        {/* Create Input */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <input
            type="text"
            placeholder="Nhập tên danh mục ngành hàng mới..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 flex-1 text-slate-800"
          />
          <button
            type="button"
            disabled={loadingAction || !newCategoryName.trim()}
            onClick={handleCreateCategory}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition disabled:opacity-50 flex items-center gap-1 shrink-0"
          >
            <span>+</span> Thêm Ngành Hàng
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:border-emerald-500 text-slate-800"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3 px-2">Mã Danh Mục</th>
              <th className="pb-3 px-2">Tên Ngành Hàng</th>
              <th className="pb-3 px-2">Đường Dẫn (Slug)</th>
              <th className="pb-3 px-2 text-center">Số Sản Phẩm</th>
              <th className="pb-3 px-2 text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                  Không tìm thấy danh mục ngành hàng nào.
                </td>
              </tr>
            ) : (
              filteredCategories.map((c) => {
                const isEditing = editingCatId === c.id

                return (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-[10px] text-slate-400">
                      <span title={c.id} className="cursor-help">{c.id.slice(0, 8)}...</span>
                    </td>

                    <td className="py-3.5 px-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateCategory(c.id)
                              if (e.key === 'Escape') setEditingCatId(null)
                            }}
                            className="px-2 py-1 bg-white border border-emerald-400 rounded text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCategory(c.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-800 text-xs">{c.name}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-2 font-mono text-[11px] text-slate-400">
                      {c.slug}
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          (c.productCount || 0) > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        {c.productCount || 0} sản phẩm
                      </span>
                    </td>

                    <td className="py-3.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(c.id)
                            setEditingCatName(c.name)
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-[10px] cursor-pointer border border-slate-200 transition"
                          title="Đổi tên danh mục"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-bold text-[10px] cursor-pointer border border-rose-100 transition"
                          title="Xóa danh mục"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
