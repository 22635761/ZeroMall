import React, { useState } from 'react'
import { DriverPickupConfirmModal } from './DriverPickupConfirmModal'

export interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  pickupAddress?: {
    id?: string
    name?: string
    contactName?: string
    phone?: string
    address?: string
    ward?: string
    district?: string
    province?: string
  }
  codAmount: number
  status: string
  currentHub?: { name: string }
  package?: { weight: number; itemsSummary?: string }
  assignments?: Array<{
    id: string
    type: string
    status: string
    driverId?: string
    driver?: { id?: string; name?: string; phone?: string; vehicleNumber?: string }
  }>
}

export interface DriverOrdersTabProps {
  pickupTasks: Shipment[]
  deliveryTasks: Shipment[]
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string, proofImage?: string) => Promise<void>
  actionLoading: boolean
  onShowFailModal: (shipment: Shipment) => void
  isOnline?: boolean
  onOpenCheckIn?: () => void
}

/**
 * Format currency helper in Vietnamese Dong
 */
const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

/**
 * DriverOrdersTab Component
 * Orders management tab for Shipper App with sub-tabs for Pickup (Lấy Hàng) and Delivery (Giao Hàng).
 * Implements SPX privacy rules (buyer info is hidden during pickup phase).
 */
export const DriverOrdersTab: React.FC<DriverOrdersTabProps> = ({
  pickupTasks,
  deliveryTasks,
  onUpdateStatus,
  actionLoading,
  onShowFailModal,
  isOnline = true,
  onOpenCheckIn,
}) => {
  const [subTab, setSubTab] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [confirmPickupShipment, setConfirmPickupShipment] = useState<Shipment | null>(null)

  // Nếu tài xế chưa vào ca (OFFLINE): Khóa toàn bộ danh sách đơn hàng theo chuẩn SPX
  if (!isOnline) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-slate-200">
          🔒
        </div>
        <div className="space-y-1.5 max-w-xs mx-auto">
          <h3 className="text-base font-black text-slate-800 tracking-wide">
            CHƯA VÀO CA LÀM VIỆC (OFFLINE)
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Theo quy định SPX, danh sách đơn lấy và giao hàng chỉ được mở khóa sau khi bạn hoàn tất điểm danh đầu ca (Xác thực khuôn mặt & GPS tại Bưu cục).
          </p>
        </div>
        {onOpenCheckIn && (
          <button
            type="button"
            onClick={onOpenCheckIn}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>📸</span> Điểm Danh Vào Ca Ngay
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4 font-sans text-slate-800">
      {/* 1. Sub-Tab Switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 border border-slate-200/60 shadow-xs">
        <button
          type="button"
          onClick={() => setSubTab('PICKUP')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'PICKUP'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <span>🏪 Lấy Hàng</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              subTab === 'PICKUP' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {pickupTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('DELIVERY')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === 'DELIVERY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
          }`}
        >
          <span>🛵 Giao Hàng</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              subTab === 'DELIVERY' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {deliveryTasks.length}
          </span>
        </button>
      </div>

      {/* 2. Sub-Tab Content: LẤY HÀNG (PICKUP) */}
      {subTab === 'PICKUP' && (
        <div className="space-y-3">
          {pickupTasks.length === 0 ? (
            <div className="py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
              <span className="text-4xl block">🏪</span>
              <p className="text-xs font-bold text-slate-600">Không có đơn cần đi lấy</p>
              <p className="text-[11px] text-slate-400">Các đơn lấy hàng từ Người Bán sẽ xuất hiện tại đây khi được phân công.</p>
            </div>
          ) : (
            pickupTasks.map((shipment) => {
              const shopName = shipment.pickupAddress?.name || 'Kho Người Bán'
              const shopPhone = shipment.pickupAddress?.phone || ''
              
              // Ghép đầy đủ địa chỉ kho của Shop đã đăng ký: số nhà/chi tiết, phường/xã, quận/huyện, tỉnh/thành
              const addressParts = [
                shipment.pickupAddress?.address,
                shipment.pickupAddress?.ward,
                shipment.pickupAddress?.district,
                shipment.pickupAddress?.province,
              ]
                .filter(Boolean)
                .map((s) => String(s).trim())
                .filter(Boolean)

              const uniqueParts: string[] = []
              for (const part of addressParts) {
                if (!uniqueParts.some((p) => p.toLowerCase() === part.toLowerCase())) {
                  uniqueParts.push(part)
                }
              }
              const shopAddress = uniqueParts.length > 0 ? uniqueParts.join(', ') : 'Chưa cập nhật địa chỉ kho'
              const packageSummary = shipment.package?.itemsSummary || 'Sản phẩm ZeroMall'
              const packageWeight = shipment.package?.weight ?? 0.5
              const isAssigned = shipment.status === 'PICKUP_ASSIGNED'

              return (
                <div
                  key={shipment.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs hover:border-emerald-300 transition-colors"
                >
                  {/* Header: Tracking & Status */}
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[10px]">Mã đơn:</span>
                      <span className="font-mono font-bold text-emerald-700 text-xs">
                        {shipment.trackingNumber}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                        isAssigned
                          ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                      }`}
                    >
                      {isAssigned ? 'Đã gán' : 'Đang đến lấy'}
                    </span>
                  </div>

                  {/* Shop Details - Buyer info is strictly omitted per SPX Privacy rules */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sm">🏪</span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm">{shopName}</p>
                        {shopPhone && (
                          <p className="text-slate-500 text-[11px] font-medium">SĐT Shop: {shopPhone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-slate-700">
                      <span className="text-sm shrink-0">📍</span>
                      <p className="text-xs leading-relaxed text-slate-700 font-medium">
                        {shopAddress}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                      <span>📦</span>
                      <span className="font-medium truncate flex-1">{packageSummary}</span>
                      <span className="font-bold text-slate-700 shrink-0">({packageWeight} kg)</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    {shopPhone ? (
                      <a
                        href={`tel:${shopPhone}`}
                        className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        📞 Gọi Shop
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="py-2.5 bg-slate-50 text-slate-400 font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1 cursor-not-allowed"
                      >
                        📞 Chưa có SĐT
                      </button>
                    )}

                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(shopAddress)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer border border-sky-200/50"
                    >
                      🗺️ Dẫn Đường
                    </a>

                    <button
                      type="button"
                      onClick={() => setConfirmPickupShipment(shipment)}
                      disabled={actionLoading}
                      className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>📦 Xác Nhận Đã Lấy</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 3. Sub-Tab Content: GIAO HÀNG (DELIVERY) */}
      {subTab === 'DELIVERY' && (() => {
        const pendingHubPickupTasks = deliveryTasks.filter((s) => s.status === 'DELIVERY_ASSIGNED')
        const activeDeliveryTasks = deliveryTasks.filter((s) => s.status === 'OUT_FOR_DELIVERY')

        if (deliveryTasks.length === 0) {
          return (
            <div className="py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 space-y-2">
              <span className="text-4xl block">📦</span>
              <p className="text-xs font-bold text-slate-700">Chưa có đơn hàng nào cần giao</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                Khi Bưu cục phân tuyến cho bạn, các kiện hàng sẽ xuất hiện tại đây để bạn tới bưu cục quét nhận lên xe.
              </p>
            </div>
          )
        }

        return (
          <div className="space-y-4">
            {/* Phân đoạn 1: Kiện hàng bưu cục đã gán, chờ Shipper tới bưu cục nhận & quét lên xe */}
            {pendingHubPickupTasks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏢</span>
                    <h4 className="text-xs font-black text-teal-800 uppercase tracking-wide">
                      Chờ Quét Nhận Tại Bưu Cục ({pendingHubPickupTasks.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Chưa lên xe
                  </span>
                </div>

                {/* Nút nhận hàng loạt nếu có nhiều hơn 1 đơn */}
                {pendingHubPickupTasks.length > 1 && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={async () => {
                      for (const s of pendingHubPickupTasks) {
                        await onUpdateStatus(s.id, 'OUT_FOR_DELIVERY')
                      }
                    }}
                    className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <span>🛵</span>
                    <span>Quét Nhận Toàn Bộ ({pendingHubPickupTasks.length} kiện) Lên Xe Máy</span>
                  </button>
                )}

                {/* Danh sách các kiện đang ở kệ phân tuyến tại bưu cục */}
                {pendingHubPickupTasks.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="bg-teal-50/40 border border-teal-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex justify-between items-center text-xs pb-1.5 border-b border-teal-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">Mã:</span>
                        <span className="font-mono font-black text-teal-800 text-xs">
                          {shipment.trackingNumber}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 bg-teal-100/80 text-teal-800 border border-teal-300 text-[10px] font-bold rounded-md flex items-center gap-1">
                        <span>⏳</span> Chờ Shipper Nhận
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-start gap-1 text-slate-700">
                        <span className="text-xs shrink-0">📍</span>
                        <p className="text-[11px] leading-relaxed text-slate-700 font-medium">
                          <span className="font-bold text-slate-800">{shipment.buyerName}</span>: {shipment.deliveryAddress}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                        <span>📦 {shipment.package?.itemsSummary || 'Kiện hàng Shopee'} ({shipment.package?.weight || 0.5}kg)</span>
                        <span className="font-bold text-teal-700">COD: {formatMoney(shipment.codAmount)}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-xl border border-teal-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <span>🏭</span> Kệ phân tuyến tại bưu cục
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(shipment.id, 'OUT_FOR_DELIVERY')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>📷</span>
                        <span>Quét Nhận Lên Xe</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Phân đoạn 2: Kiện hàng đã quét xuất kho, đang trên xe máy đi phát tận nhà */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🛵</span>
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                    Đang Trên Xe Đi Giao ({activeDeliveryTasks.length})
                  </h4>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đang phát tận nhà
                </span>
              </div>

              {activeDeliveryTasks.length === 0 ? (
                <div className="py-6 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-1">
                  <p className="text-xs font-bold text-slate-600">Chưa có đơn nào trên xe</p>
                  <p className="text-[10px] text-slate-400">
                    Bấm "Quét Nhận Lên Xe" ở danh sách trên hoặc vào tab Quét Mã Barcode khi nhận hàng tại bưu cục.
                  </p>
                </div>
              ) : (
                activeDeliveryTasks.map((shipment) => {
                  return (
                    <div
                      key={shipment.id}
                      className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      {/* Header: Tracking & Active Pulsing Status Badge */}
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px]">Mã vận đơn:</span>
                          <span className="font-mono font-black text-emerald-700 text-xs">
                            {shipment.trackingNumber}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold rounded-md animate-pulse">
                          Đang giao
                        </span>
                      </div>

                      {/* Customer Information & Address */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {shipment.buyerName} {shipment.buyerPhone && `• ${shipment.buyerPhone}`}
                          </p>
                        </div>

                        <div className="flex items-start gap-1.5 text-slate-700">
                          <span className="text-sm shrink-0">📍</span>
                          <p className="text-xs leading-relaxed text-slate-700 font-medium">
                            {shipment.deliveryAddress}
                          </p>
                        </div>

                        {/* COD Amount Box */}
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs font-bold text-emerald-800 flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <span>💵</span> Thu Tiền COD:
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            {formatMoney(shipment.codAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Gọi khách, Dẫn đường, Giao thành công, Giao thất bại */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={`tel:${shipment.buyerPhone}`}
                          className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          📞 Gọi Khách
                        </a>

                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(shipment.deliveryAddress)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-xl text-xs transition text-center flex items-center justify-center gap-1 cursor-pointer border border-sky-200/50"
                        >
                          🗺️ Dẫn Đường
                        </a>

                        <button
                          type="button"
                          onClick={() => onUpdateStatus(shipment.id, 'DELIVERED')}
                          disabled={actionLoading}
                          className="col-span-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                        >
                          <span>✅ Giao Thành Công & Thu COD</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onShowFailModal(shipment)}
                          disabled={actionLoading}
                          className="col-span-2 py-2 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer border border-rose-200/80 flex items-center justify-center gap-1.5"
                        >
                          <span>❌ Giao Thất Bại</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Modal: Chụp Ảnh Xác Nhận Đã Lấy Hàng Tại Shop (Proof of Pickup) ── */}
      {confirmPickupShipment && (
        <DriverPickupConfirmModal
          shipment={confirmPickupShipment}
          onClose={() => setConfirmPickupShipment(null)}
          onConfirm={async (shipmentId, proofImage) => {
            await onUpdateStatus(shipmentId, 'PICKED_UP', undefined, proofImage)
          }}
          actionLoading={actionLoading}
        />
      )}
    </div>
  )
}
