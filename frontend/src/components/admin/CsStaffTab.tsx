import React, { useState } from 'react'
import { AddCsStaffModal } from './AddCsStaffModal'

interface CsStaffTabProps {
  csStaff: any[]
  fetchCsStaff: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const CsStaffTab: React.FC<CsStaffTabProps> = ({ csStaff, fetchCsStaff, triggerAuditLog }) => {
  const [showAddCsModal, setShowAddCsModal] = useState(false)

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎧 Quản lý nhân viên Platform CS</h3>
        <button
          onClick={() => setShowAddCsModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Thêm nhân viên mới
        </button>
      </div>

      {/* MODAL THÊM NHÂN VIÊN */}
      <AddCsStaffModal
        isOpen={showAddCsModal}
        onClose={() => setShowAddCsModal(false)}
        onSuccess={fetchCsStaff}
        triggerAuditLog={triggerAuditLog}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã CS</th>
              <th className="pb-3">Họ và Tên</th>
              <th className="pb-3">Email liên hệ</th>
              <th className="pb-3 text-right">Số ticket đã xử lý</th>
              <th className="pb-3">Trạng thái</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {csStaff.map(cs => (
              <tr key={cs.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono text-[10px]">{cs.id}</td>
                <td className="py-3.5 font-extrabold text-slate-850">{cs.name}</td>
                <td className="py-3.5">{cs.email}</td>
                <td className="py-3.5 text-right font-bold text-slate-700">{cs.handledTickets || 0}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    cs.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650' : 'bg-rose-50 text-rose-650'
                  }`}>
                    {cs.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </td>
                <td className="py-3.5 text-center">
                  <button
                    onClick={async () => {
                      const newStatus = cs.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
                      try {
                        const res = await fetch(`http://localhost:8000/auth/users/${cs.id}/status`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: newStatus })
                        })
                        if (res.ok) {
                          await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Tạm ngưng' : 'Kích hoạt lại'} nhân viên CSKH ${cs.email}`)
                          fetchCsStaff()
                          alert('Đã cập nhật trạng thái nhân viên CSKH!')
                        }
                      } catch (err: any) {
                        alert(err.message)
                      }
                    }}
                    className={`px-2.5 py-1 rounded font-bold text-[10px] cursor-pointer ${
                      cs.status === 'ACTIVE' ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-650 border border-emerald-100'
                    }`}
                  >
                    {cs.status === 'ACTIVE' ? 'Tạm ngưng' : 'Kích hoạt'}
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
