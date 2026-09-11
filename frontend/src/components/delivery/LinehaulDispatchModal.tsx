import React, { useState, useMemo } from 'react'

export interface LinehaulShipment {
  id: string
  trackingNumber: string
  orderId: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  package?: { weight: number; itemsSummary?: string }
  codAmount: number
  status: string
}

export interface LinehaulHub {
  id: string
  code: string
  name: string
  province: string
  district: string
}

export interface LinehaulDispatchData {
  shipmentIds: string[]
  targetHubId: string
  targetHubName: string
  truckNumber: string
  truckDriver: string
  truckDriverPhone: string
  sealNumber: string
  truckType: string
}

interface LinehaulDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: LinehaulDispatchData) => Promise<void>
  currentHub?: LinehaulHub
  availableHubs: LinehaulHub[]
  selectedShipments: LinehaulShipment[]
  actionLoading: boolean
}

// Danh mục xe tải chạy tuyến liên tỉnh mẫu
const SUGGESTED_TRUCKS = [
  { plate: '29C-888.99', driver: 'Nguyễn Văn Tuấn', phone: '0912.345.678', type: 'Xe Tải Thùng 15 Tấn' },
  { plate: '29H-777.66', driver: 'Trần Đình Nam', phone: '0988.112.233', type: 'Xe Tải 8 Tấn' },
  { plate: '51D-999.88', driver: 'Lê Hoàng Long', phone: '0903.667.889', type: 'Xe Container 20 Feet' },
  { plate: '60C-555.44', driver: 'Phạm Đức Trọng', phone: '0937.445.566', type: 'Xe Tải 10 Tấn' },
]

export const LinehaulDispatchModal: React.FC<LinehaulDispatchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentHub,
  availableHubs = [],
  selectedShipments = [],
  actionLoading,
}) => {
  // Lọc các Hub đích khác với Hub hiện tại (an toàn kể cả khi currentHub chưa load xong)
  const destinationHubs = useMemo(
    () => (availableHubs || []).filter((h) => !currentHub?.id || h.id !== currentHub.id),
    [availableHubs, currentHub]
  )

  const [targetHubId, setTargetHubId] = useState<string>(() => destinationHubs[0]?.id || '')
  const [selectedTruckIndex, setSelectedTruckIndex] = useState<number>(0)
  const [customTruckNumber, setCustomTruckNumber] = useState('')
  const [customDriver, setCustomDriver] = useState('')
  const [customDriverPhone, setCustomDriverPhone] = useState('')
  const [customTruckType, setCustomTruckType] = useState('Xe Tải 15 Tấn')
  const [isCustomTruck, setIsCustomTruck] = useState(false)

  // Mã Seal niêm phong chì
  const targetHub = destinationHubs.find((h) => h.id === targetHubId) || destinationHubs[0]
  const [sealNumber, setSealNumber] = useState<string>(() => {
    const destCode = targetHub?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    return `SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`
  })

  // Cập nhật lại mã Seal khi đổi Hub đích
  const handleTargetHubChange = (newHubId: string) => {
    setTargetHubId(newHubId)
    const newTarget = destinationHubs.find((h) => h.id === newHubId)
    const destCode = newTarget?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    setSealNumber(`SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  // Tái tạo mã Seal ngẫu nhiên mới
  const handleRegenerateSeal = () => {
    const destCode = targetHub?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    setSealNumber(`SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`)
  }

  // Kiểm tra chống chất nhầm xe (Anti-Misroute Check)
  const misroutedShipments = useMemo(() => {
    if (!targetHub) return []
    const targetProv = (targetHub.province || '').toLowerCase()

    return selectedShipments.filter((s) => {
      const addr = (s.deliveryAddress || '').toLowerCase()
      // Nếu tuyến đi miền Nam/TP.HCM nhưng đơn đi tỉnh khác không thuộc tuyến
      if (targetProv.includes('hồ chí minh') || targetProv.includes('hcm')) {
        return !addr.includes('hồ chí minh') && !addr.includes('hcm') && !addr.includes('sài gòn') && !addr.includes('bình dương') && !addr.includes('long an')
      }
      if (targetProv.includes('đồng nai')) {
        return !addr.includes('đồng nai') && !addr.includes('biên hòa')
      }
      if (targetProv.includes('hà nội')) {
        return !addr.includes('hà nội') && !addr.includes('mê linh') && !addr.includes('ba vì')
      }
      return false
    })
  }, [selectedShipments, targetHub])

  // Tổng hợp thống kê chuyến xe
  const totalWeight = useMemo(
    () => selectedShipments.reduce((sum, s) => sum + (s.package?.weight || 0.5), 0),
    [selectedShipments]
  )
  const totalCod = useMemo(
    () => selectedShipments.reduce((sum, s) => sum + (s.codAmount || 0), 0),
    [selectedShipments]
  )

  if (!isOpen || !currentHub) return null

  const effectiveTruckNumber = isCustomTruck
    ? customTruckNumber.trim().toUpperCase()
    : SUGGESTED_TRUCKS[selectedTruckIndex]?.plate || '29C-888.99'

  const effectiveDriver = isCustomTruck
    ? customDriver.trim()
    : SUGGESTED_TRUCKS[selectedTruckIndex]?.driver || 'Nguyễn Văn Tuấn'

  const effectivePhone = isCustomTruck
    ? customDriverPhone.trim()
    : SUGGESTED_TRUCKS[selectedTruckIndex]?.phone || '0912.345.678'

  const effectiveTruckType = isCustomTruck
    ? customTruckType
    : SUGGESTED_TRUCKS[selectedTruckIndex]?.type || 'Xe Tải Thùng 15 Tấn'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveTruckNumber) {
      alert('Vui lòng nhập Biển số xe tải!')
      return
    }
    if (!sealNumber.trim()) {
      alert('Vui lòng nhập Mã khóa Seal niêm phong thùng xe!')
      return
    }
    if (misroutedShipments.length > 0) {
      const confirmMisroute = window.confirm(
        `⚠️ CẢNH BÁO CHỐNG XẾP NHẦM XE:\nCó ${misroutedShipments.length} kiện hàng có địa chỉ đích không khớp với tuyến bưu cục ${targetHub?.name}.\nBạn có chắc chắn muốn xuất xe không?`
      )
      if (!confirmMisroute) return
    }

    await onConfirm({
      shipmentIds: selectedShipments.map((s) => s.id),
      targetHubId: targetHub?.id || '',
      targetHubName: targetHub?.name || '',
      truckNumber: effectiveTruckNumber,
      truckDriver: effectiveDriver,
      truckDriverPhone: effectivePhone,
      sealNumber: sealNumber.trim().toUpperCase(),
      truckType: effectiveTruckType,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-xl shadow-inner">
              🚛
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-tight leading-tight">
                Đóng Xe Tải Trung Chuyển & Niêm Phong Seal
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Linehaul Dispatch & Manifest • Kho gửi: <b>{currentHub?.name || 'Bưu Cục'}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-left text-xs">
          {/* 1. Chọn Tuyến Xe Tải & Bưu Cục Đích */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <span>🗺️</span> 1. Chọn Tuyến Đường & Bưu Cục Đích (Destination Hub):
              </label>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                Tuyến cố định
              </span>
            </div>

            <select
              value={targetHubId}
              onChange={(e) => handleTargetHubChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-200 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition"
            >
              {destinationHubs.map((h) => (
                <option key={h.id} value={h.id}>
                  Tuyến {currentHub.code} ➔ {h.code}: Đến {h.name} ({h.province})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Thông Tin Xe Tải & Tài Xế Phụ Trách */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
                <span>🚚</span> 2. Xe Tải Trung Chuyển & Tài Xế (Truck & Driver):
              </label>
              <button
                type="button"
                onClick={() => setIsCustomTruck(!isCustomTruck)}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
              >
                {isCustomTruck ? '← Chọn từ đội xe có sẵn' : '+ Nhập xe ngoài / xe thuê'}
              </button>
            </div>

            {!isCustomTruck ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_TRUCKS.map((truck, idx) => (
                  <button
                    key={truck.plate}
                    type="button"
                    onClick={() => setSelectedTruckIndex(idx)}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      selectedTruckIndex === idx
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-xs text-indigo-950">{truck.plate}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{truck.type}</span>
                    </div>
                    <div className="text-[11px] text-slate-700 font-bold mt-1">
                      Bác tài: {truck.driver} • {truck.phone}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 mb-1 block">Biển số xe:</span>
                  <input
                    type="text"
                    value={customTruckNumber}
                    onChange={(e) => setCustomTruckNumber(e.target.value)}
                    placeholder="VD: 29C-999.11"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 mb-1 block">Loại xe tải:</span>
                  <select
                    value={customTruckType}
                    onChange={(e) => setCustomTruckType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                  >
                    <option value="Xe Tải Thùng 15 Tấn">Xe Tải Thùng 15 Tấn</option>
                    <option value="Xe Tải 8 Tấn">Xe Tải 8 Tấn</option>
                    <option value="Xe Tải 10 Tấn">Xe Tải 10 Tấn</option>
                    <option value="Xe Container 20 Feet">Xe Container 20 Feet</option>
                    <option value="Xe Container 40 Feet">Xe Container 40 Feet</option>
                  </select>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 mb-1 block">Tên tài xế:</span>
                  <input
                    type="text"
                    value={customDriver}
                    onChange={(e) => setCustomDriver(e.target.value)}
                    placeholder="VD: Lê Văn An"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 mb-1 block">Số điện thoại:</span>
                  <input
                    type="text"
                    value={customDriverPhone}
                    onChange={(e) => setCustomDriverPhone(e.target.value)}
                    placeholder="VD: 0912.000.111"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Khóa Niêm Phong Seal Chì Thùng Xe */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                <span>🔒</span> 3. Mã Số Niêm Phong Khóa Seal Chì (Container Security Seal):
              </label>
              <button
                type="button"
                onClick={handleRegenerateSeal}
                className="text-[10px] text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>🔄</span> Đổi mã Seal
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="VD: SEAL-HN-HCM-9821"
                className="w-full px-4 py-2.5 bg-white border-2 border-amber-400 rounded-xl font-mono font-black text-amber-900 text-sm tracking-wider uppercase focus:outline-none focus:border-amber-600"
                required
              />
              <span className="absolute right-3 top-2.5 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                CHÍNH HÃNG ZMX
              </span>
            </div>
            <p className="text-[10px] text-amber-800 font-medium">
              * Mã khóa Seal chì sẽ được dập vào chốt khóa cửa thùng xe trước khi xe xuất bến. Bưu cục đích bắt buộc phải kiểm tra mã Seal này trước khi dỡ hàng.
            </p>
          </div>

          {/* 4. Cảnh báo chống xếp nhầm xe (Anti-Misroute Alert) */}
          {misroutedShipments.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                <span>🚨</span> CẢNH BÁO: PHÁT HIỆN KIỆN HÀNG KHÔNG ĐÚNG TUYẾN ({misroutedShipments.length} KIỆN)
              </div>
              <p className="text-[10px] text-rose-700">
                Tuyến xe này chạy đến <b>{targetHub?.name} ({targetHub?.province})</b>, nhưng các kiện sau có địa chỉ giao ở tỉnh khác:
              </p>
              <ul className="space-y-0.5 pl-4 list-disc text-[10px] font-mono text-rose-800">
                {misroutedShipments.map((s) => (
                  <li key={s.id}>
                    <b>{s.trackingNumber}</b> — {s.deliveryAddress}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Tóm tắt Bảng Kê Chuyến Xe (Trip Manifest Summary) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <span>📋</span> Bảng Kê Chuyến Xe (Manifest Summary)
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Tổng Kiện Hàng</span>
                <span className="text-base font-black text-slate-800">{selectedShipments.length}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Tổng Khối Lượng</span>
                <span className="text-base font-black text-slate-800">{totalWeight.toFixed(1)} kg</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold">Tiền Thu Hộ COD</span>
                <span className="text-base font-black text-emerald-700">{totalCod.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            {/* Danh sách mã vận đơn xếp lên xe */}
            <div className="pt-2 border-t border-slate-100 max-h-32 overflow-y-auto space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block">Các vận đơn sẽ được niêm phong lên xe:</span>
              {selectedShipments.map((s) => (
                <div key={s.id} className="flex justify-between items-center text-[10px] py-0.5 px-2 bg-slate-50 rounded font-mono">
                  <span className="font-bold text-emerald-800">{s.trackingNumber}</span>
                  <span className="text-slate-500 truncate max-w-[240px]">{s.deliveryAddress}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={actionLoading || selectedShipments.length === 0}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-40"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang Niêm Phong & Xuất Bến...</span>
                </>
              ) : (
                <>
                  <span>🚛</span>
                  <span>Niêm Phong Seal & Xuất Bến ({selectedShipments.length} Kiện)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
