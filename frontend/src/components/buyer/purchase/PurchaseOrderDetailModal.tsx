import React from 'react'
import type { Order } from '../../../models/order.model'
import { getStatusText, getStatusColor, formatMoney } from './types'

interface PurchaseOrderDetailModalProps {
  order: Order | null
  onClose: () => void
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  order,
  onClose
}) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-base">
              Chi Tiết Đơn Hàng #{order.id.slice(0, 12)}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {/* Status info box */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase text-[10px]">Trạng Thái:</span>
            <span className={`font-black ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
          {(order.refundReason || (order as any).cancelReason || order.refundDescription) && (
            <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lý do & Mô tả:</p>
              <p className="text-slate-700 font-medium text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                {order.refundReason ||
                  (order as any).cancelReason ||
                  order.refundDescription ||
                  'Không có mô tả chi tiết'}
              </p>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh Sách Sản Phẩm</p>
          {order.items.map((item: any) => (
            <div key={item.id} className="flex gap-3 text-xs border-b border-slate-100 pb-2.5">
              <img
                src={item.image || item.productImage || 'https://placehold.co/100x100?text=No+Image'}
                alt={item.name || item.productName}
                className="w-12 h-12 object-cover border border-slate-200 rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 line-clamp-1">{item.name || item.productName}</h4>
                <p className="text-[10px] text-slate-400">
                  x{item.quantity} {item.variant ? `(${item.variant})` : ''}
                </p>
              </div>
              <div className="text-right font-extrabold text-slate-700">
                {formatMoney(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Total */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Thành Tiền</p>
            <p className="text-lg font-black text-[#ee4d2d]">{formatMoney(order.totalAmount)}</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
