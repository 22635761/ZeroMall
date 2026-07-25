import React from 'react'

interface ShopsTabProps {
  shops: any[]
  fetchShops: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const ShopsTab: React.FC<ShopsTabProps> = ({ shops, fetchShops, triggerAuditLog }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">🏪 Quản lý & Khóa cửa hàng</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã Shop</th>
              <th className="pb-3">Tên Cửa Hàng</th>
              <th className="pb-3">Chủ Shop</th>
              <th className="pb-3">Điện thoại</th>
              <th className="pb-3">Trạng thái</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {shops.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono text-[10px]">{s.id}</td>
                <td className="py-3.5 font-black text-slate-850">{s.name}</td>
                <td className="py-3.5 font-mono text-[10px]">{s.ownerId}</td>
                <td className="py-3.5">{s.phoneNumber || 'N/A'}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    s.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                    s.status === 'BLOCKED' ? 'bg-rose-50 text-rose-650' : 'bg-amber-50 text-amber-655'
                  }`}>
                    {s.status === 'APPROVED' ? 'Đang hoạt động' : 
                     s.status === 'BLOCKED' ? 'Đang bị Khóa' : s.status}
                  </span>
                </td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={async () => {
                      const newStatus = s.status === 'APPROVED' ? 'BLOCKED' : 'APPROVED'
                      try {
                        const res = await fetch(`http://localhost:8000/auth/shops/${s.id}/approve`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: newStatus })
                        })
                        if (res.ok) {
                          await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} cửa hàng "${s.name}"`)
                          fetchShops()
                          alert('Cập nhật trạng thái shop thành công!')
                        }
                      } catch (e: any) {
                        alert(e.message)
                      }
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer border ${
                      s.status === 'APPROVED' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100 hover:bg-emerald-100'
                    }`}
                  >
                    {s.status === 'APPROVED' ? 'Khóa Cửa Hàng' : 'Mở Khóa Cửa Hàng'}
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
