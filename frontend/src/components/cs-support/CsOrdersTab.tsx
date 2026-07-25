import React from 'react'
import { formatOrderId } from '../../utils/orderUtils'

interface CsOrdersTabProps {
  orderSearchTerm: string
  setOrderSearchTerm: (term: string) => void
  allOrdersLoading: boolean
  filteredOrders: any[]
}

export const CsOrdersTab: React.FC<CsOrdersTabProps> = ({
  orderSearchTerm,
  setOrderSearchTerm,
  allOrdersLoading,
  filteredOrders
}) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4 font-sans text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase">📋 Lịch sử và hành trình đơn hàng toàn sàn</h3>
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm mã đơn hàng hoặc khách hàng..."
            value={orderSearchTerm}
            onChange={(e) => setOrderSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500"
          />
        </div>
      </div>

      {allOrdersLoading ? (
        <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải lịch sử đơn hàng...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center py-6 text-sm font-extrabold text-slate-400">Không tìm thấy đơn hàng nào</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                <th className="pb-3">Mã đơn hàng</th>
                <th className="pb-3">Khách hàng ID</th>
                <th className="pb-3">Sản phẩm</th>
                <th className="pb-3 text-right">Tổng thanh toán</th>
                <th className="pb-3">Phương thức</th>
                <th className="pb-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/10">
                  <td className="py-3.5 font-mono text-[10px] font-bold text-slate-800">#{formatOrderId(o.id)}</td>
                  <td className="py-3.5 font-mono text-[10px] text-slate-500">{o.buyerId}</td>
                  <td className="py-3.5 max-w-xs truncate font-semibold text-slate-800">
                    {o.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ') || 'N/A'}
                  </td>
                  <td className="py-3.5 text-right font-black text-slate-750">
                    {Number(o.totalAmount).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-50 text-slate-655 uppercase">
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-650' :
                      o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-650' :
                      o.status === 'SHIPPING' ? 'bg-indigo-50 text-indigo-655' : 'bg-amber-50 text-amber-655'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
