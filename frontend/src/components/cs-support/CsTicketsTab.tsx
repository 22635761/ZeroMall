import React from 'react'

interface CsTicketsTabProps {
  tickets: any[]
  handleResolveTicket: (id: string) => void
}

export const CsTicketsTab: React.FC<CsTicketsTabProps> = ({ tickets, handleResolveTicket }) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4 font-sans text-left">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase">🎫 Quản lý ticket báo lỗi toàn sàn</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-slate-700">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
              <th className="pb-3">Mã Ticket</th>
              <th className="pb-3">Phân loại lỗi</th>
              <th className="pb-3">Tiêu đề báo cáo</th>
              <th className="pb-3">Email phản ánh</th>
              <th className="pb-3">Thời gian</th>
              <th className="pb-3">Trạng thái</th>
              <th className="pb-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/10">
                <td className="py-3.5 font-mono text-[10px]">{t.id}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    t.category === 'ACCOUNT_ERROR' ? 'bg-red-50 text-red-650' :
                    t.category === 'PAYMENT_ERROR' ? 'bg-amber-50 text-amber-655' :
                    t.category === 'VOUCHER_ERROR' ? 'bg-indigo-50 text-indigo-655' : 'bg-blue-50 text-blue-655'
                  }`}>
                    {t.category === 'ACCOUNT_ERROR' ? 'Lỗi tài khoản' :
                     t.category === 'PAYMENT_ERROR' ? 'Lỗi thanh toán' :
                     t.category === 'VOUCHER_ERROR' ? 'Lỗi voucher' : 'Lỗi vận chuyển'}
                  </span>
                </td>
                <td className="py-3.5 font-extrabold text-slate-800 max-w-xs truncate" title={t.description}>
                  {t.title}
                </td>
                <td className="py-3.5 font-semibold text-slate-650">{t.email}</td>
                <td className="py-3.5 text-slate-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-650' : 'bg-amber-50 text-amber-655 animate-pulse'
                  }`}>
                    {t.status === 'RESOLVED' ? 'Đã xử lý' : 'Đang chờ xử lý'}
                  </span>
                </td>
                <td className="py-3.5 text-center">
                  {t.status === 'PENDING' && (
                    <button
                      onClick={() => handleResolveTicket(t.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] cursor-pointer"
                    >
                      Xử lý xong
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
