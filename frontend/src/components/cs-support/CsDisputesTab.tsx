import React from 'react'
import { formatOrderId } from '../../utils/orderUtils'

interface CsDisputesTabProps {
  disputesLoading: boolean
  disputes: any[]
  refundDestinations: Record<string, string>
  setRefundDestinations: React.Dispatch<React.SetStateAction<Record<string, string>>>
  actionLoadingId: string | null
  handleAdminApproveDispute: (order: any) => Promise<void>
  handleAdminRejectDispute: (order: any) => Promise<void>
}

export const CsDisputesTab: React.FC<CsDisputesTabProps> = ({
  disputesLoading,
  disputes,
  refundDestinations,
  setRefundDestinations,
  actionLoadingId,
  handleAdminApproveDispute,
  handleAdminRejectDispute
}) => {
  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs space-y-4 font-sans text-left">
      <h3 className="text-sm font-extrabold text-slate-800 uppercase">⚖️ Giải quyết tranh chấp Trả hàng / Hoàn tiền</h3>
      {disputesLoading ? (
        <p className="text-center py-6 text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải danh sách khiếu nại...</p>
      ) : disputes.length === 0 ? (
        <p className="text-center py-6 text-sm font-extrabold text-slate-400">Không có đơn khiếu nại tranh chấp nào cần xử lý</p>
      ) : (
        <div className="space-y-6">
          {disputes.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-3xs space-y-4">
              {/* Top Meta */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="text-xs">
                  <p className="font-extrabold text-slate-800">Mã Đơn Hàng: <span className="font-mono text-emerald-600">#{formatOrderId(order.id)}</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                  {order.status === 'RETURN_DISPUTED' ? 'ĐANG TRANH CHẤP' : 'CHỜ DUYỆT HOÀN TIỀN'}
                </span>
              </div>

              {/* Return Reasons and Proofs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Lý do người mua yêu cầu trả hàng</p>
                  <p className="text-xs font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">{order.refundReason || 'Không có lý do'}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">{order.refundDescription}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-1">Số tiền giao dịch Escrow bị treo</p>
                  <p className="text-xl font-black text-rose-600">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</p>
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">🔒 Tiền đang bị khóa tại hệ thống Escrow</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-[10px] uppercase font-extrabold text-slate-400 mb-2">Sản phẩm trong đơn hàng</p>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="p-3 flex items-center justify-between bg-white text-xs">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-slate-100" />
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          {item.variant && <p className="text-[10px] text-slate-400">Phân loại: {item.variant}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800">{Number(item.price).toLocaleString('vi-VN')}đ x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                  <span className="font-bold text-slate-600 shrink-0">Nguồn tiền hoàn:</span>
                  <select
                    value={refundDestinations[order.id] || 'WALLET'}
                    onChange={(e) => setRefundDestinations(prev => ({ ...prev, [order.id]: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-xs focus:outline-hidden focus:border-emerald-500 w-full sm:w-auto"
                  >
                    <option value="WALLET">Ví ZeroPay người mua (Tức thì)</option>
                    <option value="BANK">Chuyển khoản Ngân hàng (1-3 ngày)</option>
                  </select>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    disabled={actionLoadingId === order.id}
                    onClick={() => handleAdminApproveDispute(order)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs disabled:opacity-50 transition"
                  >
                    {actionLoadingId === order.id ? 'Đang duyệt...' : 'Duyệt Hoàn Tiền'}
                  </button>
                  <button
                    disabled={actionLoadingId === order.id}
                    onClick={() => handleAdminRejectDispute(order)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg text-xs cursor-pointer border border-rose-100 disabled:opacity-50 transition"
                  >
                    {actionLoadingId === order.id ? 'Đang bác...' : 'Bác bỏ & Trả tiền Seller'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
