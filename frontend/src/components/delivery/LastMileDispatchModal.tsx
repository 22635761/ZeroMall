import React, { useState, useMemo } from 'react'

export interface DispatchDriver {
  id: string
  name: string
  phone: string
  vehicleType?: string
  vehicleNumber?: string
  hubId?: string
  operatingArea?: string
  assignedDistrict?: string
  assignedProvince?: string
  status?: string // AVAILABLE, OFFLINE, BUSY
  hub?: { id: string; name: string; code?: string }
}

export interface DispatchShipment {
  id: string
  trackingNumber: string
  orderId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  codAmount: number
  package?: { weight: number; itemsSummary?: string }
}

interface LastMileDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  shipments: DispatchShipment[]
  drivers: DispatchDriver[]
  currentHub?: { id?: string; name?: string; code?: string; province?: string; district?: string }
  onConfirm: (shipmentIds: string[], driverId: string) => Promise<void>
  actionLoading: boolean
}

export const LastMileDispatchModal: React.FC<LastMileDispatchModalProps> = ({
  isOpen,
  onClose,
  shipments,
  drivers = [],
  currentHub,
  onConfirm,
  actionLoading,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [autoMatchReason, setAutoMatchReason] = useState<string | null>(null)

  // Lọc danh sách tài xế thuộc Hub hiện tại (nếu có currentHub)
  const hubDrivers = useMemo(() => {
    if (!currentHub?.id) return drivers
    const filtered = drivers.filter((d) => d.hubId === currentHub.id || d.hub?.id === currentHub.id)
    return filtered.length > 0 ? filtered : drivers
  }, [drivers, currentHub])

  // Chọn mặc định tài xế đầu tiên đang AVAILABLE
  useMemo(() => {
    if (!selectedDriverId && hubDrivers.length > 0) {
      const firstAvailable = hubDrivers.find((d) => d.status === 'AVAILABLE' || d.status === 'BUSY')
      if (firstAvailable) setSelectedDriverId(firstAvailable.id)
      else setSelectedDriverId(hubDrivers[0].id)
    }
  }, [hubDrivers, selectedDriverId])

  // Tự động gợi ý tài xế theo khu vực giao hàng
  const handleAutoSuggestDriver = () => {
    if (shipments.length === 0 || hubDrivers.length === 0) return

    const firstShipment = shipments[0]
    const addr = (firstShipment.deliveryAddress || '').toLowerCase()

    // Tìm tài xế có operatingArea hoặc assignedDistrict khớp với địa chỉ giao
    let bestMatch = hubDrivers.find((d) => {
      const area = (d.operatingArea || '').toLowerCase()
      const dist = (d.assignedDistrict || '').toLowerCase()
      return (area && addr.includes(area)) || (dist && addr.includes(dist))
    })

    // Nếu không khớp, ưu tiên tài xế đang AVAILABLE
    if (!bestMatch) {
      bestMatch = hubDrivers.find((d) => d.status === 'AVAILABLE') || hubDrivers[0]
      setAutoMatchReason(
        `Đã chọn Shipper [${bestMatch.name}] vì đang trực ONLINE sẵn sàng nhận đơn tại ${currentHub?.name || 'bưu cục'}.`
      )
    } else {
      setAutoMatchReason(
        `Đã tự động khớp tuyến: Shipper [${bestMatch.name}] phụ trách khu vực [${bestMatch.operatingArea || bestMatch.assignedDistrict}] trùng khớp với địa chỉ khách hàng.`
      )
    }

    if (bestMatch) {
      setSelectedDriverId(bestMatch.id)
    }
  }

  const selectedDriver = useMemo(() => {
    return hubDrivers.find((d) => d.id === selectedDriverId)
  }, [hubDrivers, selectedDriverId])

  const handleSubmit = async () => {
    if (!selectedDriverId) {
      alert('Vui lòng chọn một Shipper phụ trách giao hàng!')
      return
    }
    const ids = shipments.map((s) => s.id)
    await onConfirm(ids, selectedDriverId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white p-5 border-b border-emerald-950/50 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black tracking-wide shadow-sm flex items-center gap-1.5">
                <span>🛵</span>
                <span>CHIA TUYẾN GIAO HÀNG</span>
              </span>
              <span className="text-sm font-bold text-emerald-300">
                {currentHub?.name || 'Bưu Cục Phát'}
              </span>
            </div>
            <h3 className="text-base font-black text-white">
              Phân Công Shipper Phụ Trách ({shipments.length} bưu kiện)
            </h3>
            <p className="text-[11px] text-slate-300">
              Đơn hàng sẽ được chuyển vào mục <b>"Chờ Lấy Tại Bưu Cục"</b> của Shipper để quét nhận lên xe trước khi đi giao.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Thân Modal */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* 1. Tóm tắt các kiện hàng được phân công */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>📦 Bưu kiện được chia tuyến:</span>
              <span className="text-emerald-700 font-mono font-black">{shipments.length} kiện</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {shipments.map((s) => (
                <div
                  key={s.id}
                  className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex justify-between items-start gap-2 shadow-2xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-black text-emerald-800 text-[11px]">
                      {s.trackingNumber}
                    </div>
                    <div className="text-slate-700 font-bold text-[11px]">
                      {s.buyerName} {s.buyerPhone && `• ${s.buyerPhone}`}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1">
                      📍 {s.deliveryAddress}
                    </div>
                  </div>
                  {s.codAmount > 0 && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                      COD: {s.codAmount.toLocaleString('vi-VN')}đ
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Nút Tự Động Đề Xuất Theo Tuyến */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
            <div className="text-xs text-emerald-900 font-medium">
              <span>💡 Hệ thống có thể tự động phân tích tuyến đường và chọn Shipper phù hợp nhất.</span>
            </div>
            <button
              type="button"
              onClick={handleAutoSuggestDriver}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <span>⚡</span>
              <span>Đề Xuất Theo Tuyến</span>
            </button>
          </div>

          {autoMatchReason && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 rounded-xl text-xs font-medium animate-in fade-in">
              {autoMatchReason}
            </div>
          )}

          {/* 3. Danh sách Shipper của Bưu Cục */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wider">
                Chọn Shipper Phụ Trách ({hubDrivers.length} tài xế trong đội xe)
              </span>
              <span className="text-slate-400 text-[11px]">
                {hubDrivers.filter((d) => d.status === 'AVAILABLE').length} đang Online
              </span>
            </div>

            {hubDrivers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có tài xế nào được tạo cho bưu cục này.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {hubDrivers.map((driver) => {
                  const isSelected = driver.id === selectedDriverId
                  const isAvailable = driver.status === 'AVAILABLE'

                  return (
                    <div
                      key={driver.id}
                      onClick={() => {
                        setSelectedDriverId(driver.id)
                        setAutoMatchReason(null)
                      }}
                      className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedDriver"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedDriverId(driver.id)
                            setAutoMatchReason(null)
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />

                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">
                              {driver.name}
                            </span>
                            {isAvailable ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>ONLINE</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200">
                                OFFLINE
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span>📞 {driver.phone}</span>
                            <span>• 🏍️ Biển số: <b className="font-mono text-slate-700">{driver.vehicleNumber || 'Chưa cập nhật'}</b></span>
                          </div>

                          <div className="text-[11px] text-emerald-700 font-medium">
                            📍 Tuyến phụ trách: <b>{driver.operatingArea || driver.assignedDistrict || 'Toàn quận'}</b>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isSelected ? 'Đã Chọn' : 'Chọn'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            {selectedDriver ? (
              <span>
                Phân công cho: <b className="text-emerald-700">{selectedDriver.name}</b> ({selectedDriver.phone})
              </span>
            ) : (
              <span className="text-rose-600 font-bold">Chưa chọn tài xế</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              disabled={actionLoading || !selectedDriverId}
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-40"
            >
              <span>🛵</span>
              <span>Xác Nhận Chia Tuyến ({shipments.length} kiện)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
