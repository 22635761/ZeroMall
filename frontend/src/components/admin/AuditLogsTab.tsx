import React from 'react'

interface AuditLogsTabProps {
  auditLogs: any[]
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ auditLogs }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase">📜 Nhật ký lịch sử thao tác hệ thống</h3>
      <div className="overflow-y-auto max-h-[500px]">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Thời gian</th>
              <th className="pb-3">Người thực hiện</th>
              <th className="pb-3">Hành động thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/10">
                <td className="py-3 font-mono text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleString('vi-VN')}
                </td>
                <td className="py-3 font-bold text-slate-755">{log.user}</td>
                <td className="py-3 font-semibold text-slate-655">{log.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
