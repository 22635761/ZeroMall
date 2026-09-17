import React from 'react'
import { LiveMapTracking } from '../../delivery/LiveMapTracking'

interface PurchaseTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  trackingData: any
  trackingLoading: boolean
}

export const PurchaseTrackingModal: React.FC<PurchaseTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingData,
  trackingLoading
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
              <span>🚚</span> Thông Tin Vận Chuyển ZeroExpress (ZMX)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {trackingData ? `Mã vận đơn: ${trackingData.trackingNumber}` : 'Đang tra cứu hệ thống ZMX...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl transition cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        {trackingLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-bold">Đang kết nối vệ tinh trạm bưu cục ZMX...</p>
          </div>
        ) : !trackingData ? (
          <div className="py-8 text-center space-y-2">
            <span className="text-3xl">📦</span>
            <p className="text-xs text-slate-600 font-bold">Người bán đang đóng gói kiện hàng</p>
            <p className="text-[11px] text-slate-400">Đơn vị vận chuyển ZMX đang điều phối tài xế đến lấy hàng.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 🗺️ BẢN ĐỒ HÀNH TRÌNH TƯƠNG TÁC GOONG MAP / OSM LIVE */}
            <LiveMapTracking
              trackingData={trackingData}
              goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
            />

            {/* Stepper Status Box */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-950">Trạng thái hiện tại:</span>
                <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                  {trackingData.status === 'CREATED' && 'Đang chuẩn bị hàng'}
                  {trackingData.status === 'WAITING_PICKUP' && 'Chờ Shipper đến lấy'}
                  {trackingData.status === 'PICKUP_ASSIGNED' && 'Shipper đang đến lấy'}
                  {trackingData.status === 'PICKED_UP' && 'Đã lấy hàng'}
                  {trackingData.status === 'AT_ORIGIN_HUB' && 'Tại Bưu cục gửi'}
                  {trackingData.status === 'SORTING' && 'Đang phân loại tại Kho SOC'}
                  {trackingData.status === 'IN_TRANSIT' && 'Xe tải đang trung chuyển'}
                  {trackingData.status === 'AT_DESTINATION_HUB' && 'Đã đến Bưu cục phát'}
                  {trackingData.status === 'OUT_FOR_DELIVERY' && 'Shipper đang giao tận nhà'}
                  {trackingData.status === 'DELIVERED' && 'Giao thành công'}
                  {trackingData.status === 'DELIVERY_FAILED' && 'Giao không thành công'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <p>• <b>Đơn vị vận chuyển:</b> ZeroMall Express (ZMX Logistics)</p>
                {trackingData.assignments && trackingData.assignments[0] && (
                  <p>• <b>Tài xế phụ trách:</b> {trackingData.assignments[0].driver?.name} (SĐT: {trackingData.assignments[0].driver?.phone} - Biển số: {trackingData.assignments[0].driver?.vehicleNumber})</p>
                )}
                {trackingData.currentHub && (
                  <p>• <b>Kho/Bưu cục hiện tại:</b> {trackingData.currentHub.name} ({trackingData.currentHub.province})</p>
                )}
              </div>
            </div>

            {/* Vertical Milestones */}
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chi Tiết Lịch Sử Hành Trình</p>
              {trackingData.trackingLogs && trackingData.trackingLogs.map((log: any, idx: number) => (
                <div key={log.id} className="flex gap-3 relative text-xs">
                  {idx !== trackingData.trackingLogs.length - 1 && (
                    <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200"></div>
                  )}
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold z-10 ${
                    idx === 0 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx === 0 ? '●' : '○'}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-bold ${idx === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{log.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] leading-relaxed font-normal">{log.description}</p>
                    {log.location && (
                      <p className="text-[10px] text-slate-400 font-medium">📍 {log.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
