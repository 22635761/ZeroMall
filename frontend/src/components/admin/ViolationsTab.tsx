import React from 'react'

interface ViolationsTabProps {
  violations: any[]
  fetchViolations: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const ViolationsTab: React.FC<ViolationsTabProps> = ({ violations, fetchViolations, triggerAuditLog }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">🚫 Kiểm duyệt sản phẩm vi phạm</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Sản phẩm</th>
              <th className="pb-3">Shop bán</th>
              <th className="pb-3 text-right">Lượt Report</th>
              <th className="pb-3">Lý do vi phạm</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {violations.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 flex items-center gap-3">
                  {p.image && <img src={p.image} className="w-10 h-10 object-cover rounded-lg border border-slate-100 shadow-3xs" />}
                  <div className="flex flex-col">
                    <span className="font-extrabold text-slate-800 leading-snug">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{p.id}</span>
                  </div>
                </td>
                <td className="py-3.5 font-mono text-[10px]">{p.shopId}</td>
                <td className="py-3.5 text-right font-black text-rose-600">{p.reportsCount}</td>
                <td className="py-3.5 font-semibold text-slate-650 max-w-xs truncate">{p.violationReason || 'N/A'}</td>
                <td className="py-3.5 text-center">
                  <div className="flex justify-center gap-1.5">
                    <button
                      onClick={async () => {
                        if (window.confirm('Bỏ qua tất cả cảnh báo vi phạm của sản phẩm này?')) {
                          try {
                            const res = await fetch(`http://localhost:8000/products/violations/${p.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isViolated: false })
                            })
                            if (res.ok) {
                              await triggerAuditLog(`Bỏ qua cảnh báo vi phạm cho sản phẩm ID ${p.id}`)
                              fetchViolations()
                              alert('Đã bỏ qua cảnh báo thành công!')
                            }
                          } catch (err: any) {
                            alert(err.message)
                          }
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded font-bold text-[10px] cursor-pointer border border-emerald-100"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Gỡ bỏ vĩnh viễn sản phẩm này khỏi hệ thống ZeroMall?')) {
                          try {
                            const res = await fetch(`http://localhost:8000/products/${p.id}`, {
                              method: 'DELETE'
                            })
                            if (res.ok) {
                              await triggerAuditLog(`Xóa vĩnh viễn sản phẩm vi phạm ID ${p.id}`)
                              fetchViolations()
                              alert('Đã gỡ bỏ sản phẩm thành công!')
                            }
                          } catch (err: any) {
                            alert(err.message)
                          }
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-bold text-[10px] cursor-pointer border border-rose-100"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
