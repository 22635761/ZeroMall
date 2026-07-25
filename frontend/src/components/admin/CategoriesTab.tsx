import React, { useState } from 'react'

interface CategoriesTabProps {
  categories: any[]
  fetchCategories: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, fetchCategories, triggerAuditLog }) => {
  const [newCategoryName, setNewCategoryName] = useState('')

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase">🗂️ Quản lý danh mục sản phẩm</h3>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Tên danh mục mới..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          />
          <button
            onClick={async () => {
              if (!newCategoryName.trim()) return
              try {
                const res = await fetch('http://localhost:8000/products/categories', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name: newCategoryName })
                })
                if (res.ok) {
                  await triggerAuditLog(`Tạo danh mục sản phẩm mới "${newCategoryName}"`)
                  fetchCategories()
                  setNewCategoryName('')
                  alert('Đã tạo danh mục thành công!')
                } else {
                  alert('Lỗi tạo danh mục sản phẩm')
                }
              } catch (err: any) {
                alert(err.message)
              }
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-3xs"
          >
            Thêm mới
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã Danh Mục</th>
              <th className="pb-3">Tên Danh Mục</th>
              <th className="pb-3 text-right">Số Sản Phẩm</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono text-[10px]">{c.id}</td>
                <td className="py-3.5 font-extrabold text-slate-800">{c.name}</td>
                <td className="py-3.5 text-right font-black text-slate-800">{c.productCount || 0}</td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={async () => {
                      if (window.confirm(`Xóa danh mục "${c.name}"?`)) {
                        try {
                          const res = await fetch(`http://localhost:8000/products/categories/${c.id}`, {
                            method: 'DELETE'
                          })
                          if (res.ok) {
                            await triggerAuditLog(`Xóa danh mục sản phẩm "${c.name}"`)
                            fetchCategories()
                            alert('Đã xóa danh mục thành công!')
                          } else {
                            alert('Lỗi khi xóa danh mục')
                          }
                        } catch (err: any) {
                          alert(err.message)
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
