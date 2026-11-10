import React, { useState } from 'react'
import type { Shipment } from './types'
import { LiveMapTracking } from '../LiveMapTracking'

interface AdminShipmentDrawerProps {
  shipment: Shipment | null
  onClose: () => void
  onUpdateStatus?: (shipmentId: string, status: string, failureReason?: string) => void
}

const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

export const AdminShipmentDrawer: React.FC<AdminShipmentDrawerProps> = ({
  shipment,
  onClose,
}) => {
  const [copied, setCopied] = useState(false)

  if (!shipment) return null

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(shipment.trackingNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const latestAssignment = shipment.assignments && shipment.assignments[0]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* 1. Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-700 text-base">
                  {shipment.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Sao chép mã vận đơn"
                >
                  {copied ? '✅ Đã chép' : '📋 Chép'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Đơn hàng ZeroMall: <b>#{shipment.orderId}</b>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  shipment.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : shipment.status === 'OUT_FOR_DELIVERY'
                    ? 'bg-orange-100 text-orange-800'
                    : shipment.status === 'DELIVERY_FAILED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {shipment.status}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm cursor-pointer shadow-3xs"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Bản đồ định vị tương tác */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-3xs">
              <LiveMapTracking
                trackingData={shipment}
                goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
              />
            </div>

            {/* Thông tin Người nhận & Người gửi */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Khách Hàng (Người Nhận):
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {shipment.buyerName}{' '}
                  <span className="text-slate-500 font-normal text-xs">({shipment.buyerPhone})</span>
                </div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">
                  {shipment.deliveryAddress}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Tiền Thu Hộ COD:
                  </span>
                  <span className="font-mono font-black text-sm text-emerald-700">
                    {shipment.codAmount > 0 ? formatMoney(shipment.codAmount) : 'Đã thanh toán (0đ)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Cước Phí Vận Chuyển:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(shipment.shippingFee || 30000)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tài xế & Bưu cục phụ trách */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Đơn Vị Vận Chuyển Phụ Trách:
              </span>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    {latestAssignment?.driver?.name ? (
                      `🛵 Shipper: ${latestAssignment.driver.name}`
                    ) : (
                      '🛵 Chưa điều phối tài xế'
                    )}
                  </div>
                  {latestAssignment?.driver?.phone && (
                    <div className="text-[11px] text-slate-500">
                      SĐT: {latestAssignment.driver.phone} • Biển số: {latestAssignment.driver.vehicleNumber || 'Đang cập nhật'}
                    </div>
                  )}
                </div>

                {shipment.currentHub && (
                  <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200 font-mono">
                    Hub: {shipment.currentHub.code}
                  </span>
                )}
              </div>
            </div>

            {/* Bằng chứng giao hàng POD nếu đã hoàn tất */}
            {shipment.podImageUrl && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <span>📸</span> Bằng Chứng Giao Hàng Điện Tử (POD)
                </span>
                <img
                  src={shipment.podImageUrl}
                  alt="Proof of Delivery"
                  className="w-full h-44 object-cover rounded-xl border border-emerald-200 shadow-2xs"
                />
                {shipment.deliveryNote && (
                  <p className="text-[11px] text-emerald-800 font-medium italic">
                    Ghi chú: {shipment.deliveryNote}
                  </p>
                )}
              </div>
            )}

            {/* Lịch sử lộ trình chi tiết (Timeline Stepper) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wide block text-[11px]">
                Lịch Sử Quét Mã & Lộ Trình Bưu Kiện
              </span>

              <div className="space-y-4 pl-1">
                {(shipment.trackingLogs || []).map((log, index) => (
                  <div key={log.id || index} className="flex gap-3 relative">
                    {index !== (shipment.trackingLogs || []).length - 1 && (
                      <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200" />
                    )}

                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] font-bold ${
                        index === 0
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {index === 0 ? '●' : '○'}
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className={`font-bold ${index === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {log.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        {log.description}
                      </p>
                      {log.location && (
                        <p className="text-[10px] text-slate-400 font-medium">📍 {log.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Footer Action */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Đóng Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
