import React from 'react'

interface UsersTabProps {
  users: any[]
  fetchUsers: () => void
  triggerAuditLog: (action: string) => Promise<void>
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, fetchUsers, triggerAuditLog }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase mb-4">👥 Quản lý người dùng hệ thống</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã User</th>
              <th className="pb-3">Họ và Tên</th>
              <th className="pb-3">Email liên hệ</th>
              <th className="pb-3">Vai trò</th>
              <th className="pb-3">Trạng thái</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono text-[10px]">{u.id}</td>
                <td className="py-3.5 font-bold text-slate-850">{u.name}</td>
                <td className="py-3.5">{u.email}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    u.role === 'ADMIN' ? 'bg-red-50 text-red-655' : 
                    u.role === 'PLATFORM_SUPPORT' ? 'bg-indigo-50 text-indigo-655' :
                    u.role === 'SHOP_OWNER' ? 'bg-blue-50 text-blue-655' : 'bg-slate-50 text-slate-655'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-650' : 'bg-rose-50 text-rose-650'
                  }`}>
                    {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đang bị khóa'}
                  </span>
                </td>
                <td className="py-3.5 text-center">
                  {u.role !== 'ADMIN' && (
                    <button
                      onClick={async () => {
                        const newStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
                        try {
                          const res = await fetch(`http://localhost:8000/auth/users/${u.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: newStatus })
                          })
                          if (res.ok) {
                            await triggerAuditLog(`${newStatus === 'BLOCKED' ? 'Khóa' : 'Mở khóa'} tài khoản "${u.email}"`)
                            fetchUsers()
                            alert('Cập nhật trạng thái người dùng thành công!')
                          }
                        } catch (e: any) {
                          alert(e.message)
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[9px] font-black cursor-pointer border ${
                        u.status === 'ACTIVE' ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-650 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? 'Khóa TK' : 'Mở Khóa'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
