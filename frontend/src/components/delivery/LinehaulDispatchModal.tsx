import React, { useState, useMemo, useEffect } from 'react'

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
  sealNumber?: string
  truckType: string
  isSealAndDispatch: boolean // false: Xếp lên xe tại Dock (thùng xe mở); true: Niêm phong Seal chì & xuất bến ngay
}

export interface DockTruck {
  id: string
  truckNumber: string
  truckDriver: string
  truckDriverPhone: string
  truckType: string
  carrierName?: string
  gatePassId?: string
  targetHubId: string
  targetHubName: string
  shipments: LinehaulShipment[]
  createdAt: string
}

export interface ApprovedTruck {
  plate: string
  driver: string
  phone: string
  type: string
  carrier: string
  gatePassId: string
  idCard?: string
  assignedTargetHubId?: string // Hub đích xe đăng ký đi
  assignedHubName?: string     // Tên Hub đích
  assignedProvince?: string    // Khu vực đích (HN, HCM, ĐN...)
  isGateIn: boolean
}

interface LinehaulDispatchModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: LinehaulDispatchData) => Promise<void>
  currentHub?: LinehaulHub
  availableHubs: LinehaulHub[]
  selectedShipments: LinehaulShipment[]
  dockTrucks?: DockTruck[]
  registeredDrivers?: any[]
  actionLoading: boolean
}

/**
 * Tự động phân tích địa chỉ người nhận từ danh sách kiện hàng để nhận diện Bưu cục đích tối ưu
 */
export const detectDestinationHub = (
  shipments: LinehaulShipment[],
  destHubs: LinehaulHub[],
  currentHubId?: string
): LinehaulHub | null => {
  const filteredDestHubs = destHubs.filter((h) => !currentHubId || h.id !== currentHubId)
  if (filteredDestHubs.length === 0) return null
  if (!shipments || shipments.length === 0) return filteredDestHubs[0]

  const scores = new Map<string, number>()
  filteredDestHubs.forEach((h) => scores.set(h.id, 0))

  for (const s of shipments) {
    const addr = (s.deliveryAddress || '').toLowerCase()
    for (const hub of filteredDestHubs) {
      const prov = (hub.province || '').toLowerCase()
      const dist = (hub.district || '').toLowerCase()
      const name = (hub.name || '').toLowerCase()

      let matched = false
      if (prov && addr.includes(prov)) matched = true
      if (dist && addr.includes(dist)) matched = true
      if (name && addr.includes(name)) matched = true

      // Phân tích các từ khóa vùng miền phổ biến tại Việt Nam
      if (
        (prov.includes('hồ chí minh') || prov.includes('hcm') || name.includes('tân bình') || name.includes('hcm')) &&
        (addr.includes('hồ chí minh') ||
          addr.includes('tp.hcm') ||
          addr.includes('tp hcm') ||
          addr.includes('sài gòn') ||
          addr.includes('tân bình') ||
          addr.includes('gò vấp') ||
          addr.includes('bình thạnh') ||
          addr.includes('quận 1') ||
          addr.includes('quận 2') ||
          addr.includes('quận 3') ||
          addr.includes('quận 7') ||
          addr.includes('quận 12') ||
          addr.includes('thủ đức') ||
          addr.includes('bình tân') ||
          addr.includes('tân phú') ||
          addr.includes('phú nhuận') ||
          addr.includes('nhà bè') ||
          addr.includes('bình chánh') ||
          addr.includes('hóc môn') ||
          addr.includes('củ chi') ||
          addr.includes('bình dương') ||
          addr.includes('đồng nai'))
      ) {
        matched = true
      }

      if (
        (prov.includes('hà nội') || prov.includes('hn') || name.includes('mê linh') || name.includes('hà nội')) &&
        (addr.includes('hà nội') ||
          addr.includes('mê linh') ||
          addr.includes('cầu giấy') ||
          addr.includes('ba đình') ||
          addr.includes('đống đa') ||
          addr.includes('hoàn kiếm') ||
          addr.includes('hà đông') ||
          addr.includes('long biên') ||
          addr.includes('hoàng mai') ||
          addr.includes('thanh xuân') ||
          addr.includes('nam từ liêm') ||
          addr.includes('bắc từ liêm') ||
          addr.includes('tây hồ') ||
          addr.includes('gia lâm') ||
          addr.includes('đông anh') ||
          addr.includes('sóc sơn'))
      ) {
        matched = true
      }

      if (matched) {
        scores.set(hub.id, (scores.get(hub.id) || 0) + 1)
      }
    }
  }

  let bestHub = filteredDestHubs[0]
  let maxScore = -1
  for (const hub of filteredDestHubs) {
    const sc = scores.get(hub.id) || 0
    if (sc > maxScore) {
      maxScore = sc
      bestHub = hub
    }
  }

  return bestHub || filteredDestHubs[0]
}

export const LinehaulDispatchModal: React.FC<LinehaulDispatchModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentHub,
  availableHubs = [],
  selectedShipments = [],
  dockTrucks = [],
  registeredDrivers = [],
  actionLoading,
}) => {
  // Lọc các Hub đích khác với Hub hiện tại
  const destinationHubs = useMemo(
    () => (availableHubs || []).filter((h) => !currentHub?.id || h.id !== currentHub.id),
    [availableHubs, currentHub]
  )

  // Tự động nhận diện bưu cục đích tối ưu dựa vào địa chỉ các kiện hàng đã chọn
  const autoDetectedHub = useMemo(() => {
    return detectDestinationHub(selectedShipments, destinationHubs, currentHub?.id)
  }, [selectedShipments, destinationHubs, currentHub])

  const [targetHubId, setTargetHubId] = useState<string>('')
  const [isManualRoute, setIsManualRoute] = useState<boolean>(false)

  // Cập nhật targetHubId khi mở modal hoặc thay đổi danh sách đơn
  useEffect(() => {
    if (isOpen && autoDetectedHub) {
      setTargetHubId(autoDetectedHub.id)
      setIsManualRoute(false)
    }
  }, [isOpen, autoDetectedHub])

  // Lấy Hub đích thực tế đang được chọn
  const targetHub = destinationHubs.find((h) => h.id === targetHubId) || autoDetectedHub || destinationHubs[0]

  // Quản lý Đội Xe Đã Kiểm Duyệt & Đã Gate-In Qua Cổng An Ninh
  const [fleetSearch, setFleetSearch] = useState('')
  const [selectedTruckPlate, setSelectedTruckPlate] = useState('')
  const [truckNumber, setTruckNumber] = useState('')
  const [truckDriver, setTruckDriver] = useState('')
  const [truckDriverPhone, setTruckDriverPhone] = useState('')
  const [truckType, setTruckType] = useState('Xe Tải Thùng 15 Tấn')
  const [carrierName, setCarrierName] = useState('Đội Xe Nội Bộ ZMX Fleet')
  const [gatePassId, setGatePassId] = useState('GP-ZMX-01')

  // Form đăng ký thẻ Gate-In cho xe hợp đồng 3PL mới đến cổng
  const [isRegisteringGatePass, setIsRegisteringGatePass] = useState(false)
  const [newGatePassPlate, setNewGatePassPlate] = useState('')
  const [newGatePassDriver, setNewGatePassDriver] = useState('')
  const [newGatePassPhone, setNewGatePassPhone] = useState('')
  const [newGatePassIdCard, setNewGatePassIdCard] = useState('')
  const [newGatePassCarrier, setNewGatePassCarrier] = useState('Đối Tác 3PL Indo-Trans Logistics (ITL)')
  const [newGatePassType, setNewGatePassType] = useState('Xe Tải Thùng 15 Tấn')

  // Danh sách xe đã được phê duyệt từ API drivers
  const approvedFleet = useMemo(() => {
    const list: ApprovedTruck[] = []

    if (registeredDrivers && registeredDrivers.length > 0) {
      registeredDrivers.forEach((d: any) => {
        if (
          d.vehicleNumber &&
          (d.vehicleType === 'TRUCK' || d.vehicleType === 'VAN' || d.vehicleNumber.includes('C') || d.vehicleNumber.includes('D') || d.vehicleNumber.includes('H'))
        ) {
          list.push({
            plate: d.vehicleNumber.toUpperCase(),
            driver: d.name,
            phone: d.phone,
            type: d.vehicleType === 'TRUCK' ? 'Xe Tải Thùng 15 Tấn' : 'Xe Tải Van 2 Tấn',
            carrier: d.name.includes('3PL') || d.name.includes('Indo-Trans') ? 'Đối Tác 3PL Indo-Trans Logistics' : 'Đội Xe Nội Bộ ZMX Fleet',
            gatePassId: `GP-${d.id.replace('driver-', '').toUpperCase()}`,
            isGateIn: true,
          })
        }
      })
    }

    // Đội xe đã đăng ký kiểm duyệt chuẩn của hệ thống
    if (list.length === 0) {
      list.push(
        {
          plate: '29C-888.99',
          driver: 'Trần Quốc Bảo (ZMX 15T)',
          phone: '0912.888.999',
          type: 'Xe Tải Thùng 15 Tấn',
          carrier: 'Đội Xe Nội Bộ ZMX Fleet',
          gatePassId: 'GP-TRUCK-HN',
          isGateIn: true,
        },
        {
          plate: '51C-777.66',
          driver: 'Nguyễn Hữu Nam (3PL Indo-Trans)',
          phone: '0903.112.233',
          type: 'Xe Container 20 Feet',
          carrier: 'Đối Tác 3PL Indo-Trans Logistics',
          gatePassId: 'GP-TRUCK-HCM',
          isGateIn: true,
        },
        {
          plate: '60C-555.44',
          driver: 'Đặng Văn Hùng (ZMX 8T)',
          phone: '0937.668.899',
          type: 'Xe Tải 8 Tấn',
          carrier: 'Đội Xe Nội Bộ ZMX Fleet',
          gatePassId: 'GP-TRUCK-DN',
          isGateIn: true,
        },
        {
          plate: '51D-999.88',
          driver: 'Lê Hữu Tải (ZMX Van)',
          phone: '0987.654.321',
          type: 'Xe Tải Van 2 Tấn',
          carrier: 'Đội Xe Nội Bộ ZMX Fleet',
          gatePassId: 'GP-03-ZMX',
          isGateIn: true,
        }
      )
    }

    return list
  }, [registeredDrivers])

  // Xe 3PL được bảo vệ cấp thẻ Gate-In trong phiên làm việc
  const [customGateInList, setCustomGateInList] = useState<ApprovedTruck[]>([])

  const allAvailableFleet = useMemo(() => {
    return [...customGateInList, ...approvedFleet]
  }, [customGateInList, approvedFleet])

  const handleSelectApprovedTruck = (truck: ApprovedTruck) => {
    setSelectedTruckPlate(truck.plate)
    setTruckNumber(truck.plate)
    setTruckDriver(truck.driver)
    setTruckDriverPhone(truck.phone)
    setTruckType(truck.type)
    setCarrierName(truck.carrier)
    setGatePassId(truck.gatePassId)
  }

  // Tự động chọn xe đầu tiên khi mở modal nếu chưa chọn
  useEffect(() => {
    if (isOpen && allAvailableFleet.length > 0 && !selectedTruckPlate) {
      handleSelectApprovedTruck(allAvailableFleet[0])
    }
  }, [isOpen, allAvailableFleet, selectedTruckPlate])

  // Xác thực & Cấp thẻ Gate-In cho xe 3PL
  const handleRegister3plGatePass = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPlate = newGatePassPlate.trim().toUpperCase()
    if (!cleanPlate || !newGatePassDriver.trim() || !newGatePassPhone.trim() || !newGatePassIdCard.trim()) {
      alert('Vui lòng điền đầy đủ: Biển số xe, Tên tài xế, SĐT, và Số CCCD/GPLX để kiểm soát an ninh cổng!')
      return
    }

    const newTruck: ApprovedTruck = {
      plate: cleanPlate,
      driver: newGatePassDriver.trim(),
      phone: newGatePassPhone.trim(),
      type: newGatePassType,
      carrier: newGatePassCarrier.trim(),
      idCard: newGatePassIdCard.trim(),
      gatePassId: `GP-3PL-${Math.floor(1000 + Math.random() * 9000)}`,
      isGateIn: true,
    }

    setCustomGateInList([newTruck, ...customGateInList])
    handleSelectApprovedTruck(newTruck)
    setIsRegisteringGatePass(false)
    setNewGatePassPlate('')
    setNewGatePassDriver('')
    setNewGatePassPhone('')
    setNewGatePassIdCard('')
  }

  // Chế độ: 
  // false: Xếp hàng lên xe tại Dock (thùng xe mở, chưa niêm phong để gom thêm hàng)
  // true: Niêm phong Seal chì & Xuất bến ngay lập tức
  const [isSealAndDispatch, setIsSealAndDispatch] = useState<boolean>(false)

  // Mã Seal niêm phong chì ZMX
  const [sealNumber, setSealNumber] = useState<string>(() => {
    const destCode = targetHub?.code || 'DEST'
    const originCode = currentHub?.code || 'HUB'
    return `SEAL-${originCode}-${destCode}-${Math.floor(1000 + Math.random() * 9000)}`
  })

  // Cập nhật lại mã Seal khi đổi Hub đích
  const handleTargetHubChange = (newHubId: string) => {
    setTargetHubId(newHubId)
    setIsManualRoute(true)
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

  // Chọn nhanh xe đang mở tại cửa Dock (nếu có)
  const handleSelectDockTruck = (dt: DockTruck) => {
    setSelectedTruckPlate(dt.truckNumber)
    setTruckNumber(dt.truckNumber)
    setTruckDriver(dt.truckDriver)
    setTruckDriverPhone(dt.truckDriverPhone)
    setTruckType(dt.truckType)
    if (dt.targetHubId) {
      setTargetHubId(dt.targetHubId)
      setIsManualRoute(true)
    }
  }

  // Lọc các xe đang mở tại Dock phù hợp với tuyến hiện tại
  const matchingDockTrucks = useMemo(() => {
    return dockTrucks.filter((dt) => !targetHub?.id || dt.targetHubId === targetHub.id)
  }, [dockTrucks, targetHub])

  // Kiểm tra chống chất nhầm xe (Anti-Misroute Check)
  const misroutedShipments = useMemo(() => {
    if (!targetHub) return []
    const targetProv = (targetHub.province || '').toLowerCase()

    return selectedShipments.filter((s) => {
      const addr = (s.deliveryAddress || '').toLowerCase()
      // Tuyến đi miền Nam/TP.HCM
      if (targetProv.includes('hồ chí minh') || targetProv.includes('hcm')) {
        return (
          !addr.includes('hồ chí minh') &&
          !addr.includes('hcm') &&
          !addr.includes('sài gòn') &&
          !addr.includes('bình dương') &&
          !addr.includes('long an') &&
          !addr.includes('đồng nai')
        )
      }
      // Tuyến đi miền Bắc/Hà Nội
      if (targetProv.includes('hà nội') || targetProv.includes('mê linh')) {
        return (
          !addr.includes('hà nội') &&
          !addr.includes('mê linh') &&
          !addr.includes('bắc ninh') &&
          !addr.includes('vĩnh phúc') &&
          !addr.includes('hải phòng')
        )
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanTruckNumber = truckNumber.trim().toUpperCase()
    if (!cleanTruckNumber) {
      alert('Vui lòng nhập Biển số xe tải!')
      return
    }

    if (isSealAndDispatch && !sealNumber.trim()) {
      alert('Vui lòng nhập Mã khóa Seal chì để niêm phong xuất bến!')
      return
    }

    if (misroutedShipments.length > 0) {
      const confirmMisroute = window.confirm(
        `⚠️ CẢNH BÁO CHỐNG XẾP NHẦM XE:\nCó ${misroutedShipments.length} kiện hàng có địa chỉ người nhận không thuộc tuyến bưu cục ${targetHub?.name}.\nBạn có chắc chắn muốn tiếp tục không?`
      )
      if (!confirmMisroute) return
    }

    await onConfirm({
      shipmentIds: selectedShipments.map((s) => s.id),
      targetHubId: targetHub?.id || '',
      targetHubName: targetHub?.name || '',
      truckNumber: cleanTruckNumber,
      truckDriver: truckDriver.trim() || 'Tài xế vận tải',
      truckDriverPhone: truckDriverPhone.trim() || '',
      sealNumber: isSealAndDispatch ? sealNumber.trim().toUpperCase() : undefined,
      truckType,
      isSealAndDispatch,
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
                Đóng Xe Tải Trung Chuyển Liên Tỉnh (Linehaul Dispatch)
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Kho xuất: <b>{currentHub?.name || 'Bưu Cục'}</b> ({currentHub?.code})
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
          {/* 1. Tuyến Xe Tải & Bưu Cục Đích (TỰ ĐỘNG NHẬN DIỆN) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-sky-50/70 border-2 border-indigo-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <span>🗺️</span> 1. Tuyến Đường & Bưu Cục Đích:
              </label>
              <div className="flex items-center gap-2">
                {!isManualRoute ? (
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md font-black flex items-center gap-1">
                    <span>⚡</span> Tự động nhận diện
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md font-black">
                    Tùy chọn thủ công
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsManualRoute(!isManualRoute)}
                  className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer"
                >
                  {isManualRoute ? '← Dùng tự động' : 'Đổi tuyến khác'}
                </button>
              </div>
            </div>

            {!isManualRoute ? (
              <div className="p-3 bg-white rounded-xl border border-indigo-200 flex items-center justify-between">
                <div>
                  <div className="font-black text-sm text-indigo-950 flex items-center gap-2">
                    <span>{currentHub.name} ({currentHub.code})</span>
                    <span className="text-slate-400">➔</span>
                    <span className="text-indigo-600">{targetHub?.name} ({targetHub?.code})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Khu vực tiếp nhận: <b>{targetHub?.province}</b> • Dựa theo địa chỉ nhận của {selectedShipments.length} bưu kiện
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-black text-xs rounded-lg border border-indigo-200">
                  {currentHub.code}-{targetHub?.code}
                </span>
              </div>
            ) : (
              <select
                value={targetHubId}
                onChange={(e) => handleTargetHubChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-300 rounded-xl font-bold text-slate-800 text-xs focus:outline-none focus:border-indigo-500 transition"
              >
                {destinationHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    Tuyến {currentHub.code} ➔ {h.code}: Đến {h.name} ({h.province})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. THÔNG TIN XE TẢI & TÀI XẾ (KIỂM SOÁT AN NINH CỔNG BẢO VỆ) */}
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="font-black text-slate-900 flex items-center gap-2 text-xs">
                  <span className="text-base">🛡️</span>
                  <span>2. Đội Xe & Tài Xế Đã Kiểm Duyệt (Gate-In Whitelist):</span>
                </label>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Chỉ các phương tiện đã được ZMX phê duyệt hồ sơ và hoàn tất Gate-In qua cổng an ninh mới được nhận hàng.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisteringGatePass(!isRegisteringGatePass)}
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                <span>{isRegisteringGatePass ? '✕ Đóng Khai Báo' : '+ Cấp Thẻ Gate-In Xe 3PL'}</span>
              </button>
            </div>

            {/* Gợi ý chọn xe đang mở tại Dock nếu có */}
            {matchingDockTrucks.length > 0 && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-sky-800 block">
                  💡 Có xe đang mở tại Dock cho tuyến này, bấm để ghép chung hàng:
                </span>
                <div className="flex flex-wrap gap-2">
                  {matchingDockTrucks.map((dt) => (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => handleSelectDockTruck(dt)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-black transition cursor-pointer flex items-center gap-1.5 ${
                        truckNumber === dt.truckNumber
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white border border-sky-300 text-sky-900 hover:bg-sky-100'
                      }`}
                    >
                      <span>🚛 [{dt.truckNumber}]</span>
                      <span className="text-[10px] font-sans font-normal opacity-80">({dt.shipments.length} kiện)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Khai Báo & Cấp Thẻ Gate-In cho Xe Hợp Đồng 3PL Mới Đến Cổng */}
            {isRegisteringGatePass && (
              <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                  <span>📋</span>
                  <span>Khai Báo Thủ Tục Gate-In Cổng An Ninh (Xe Thuê Ngoài / 3PL)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">
                      Biển số xe tải <span className="text-rose-500">*</span>:
                    </span>
                    <input
                      type="text"
                      value={newGatePassPlate}
                      onChange={(e) => setNewGatePassPlate(e.target.value.toUpperCase())}
                      placeholder="VD: 51C-888.11"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-black text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">
                      Họ tên tài xế <span className="text-rose-500">*</span>:
                    </span>
                    <input
                      type="text"
                      value={newGatePassDriver}
                      onChange={(e) => setNewGatePassDriver(e.target.value)}
                      placeholder="VD: Hoàng Văn Nam"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">
                      Số CCCD / GPLX Hạng C/FC <span className="text-rose-500">*</span>:
                    </span>
                    <input
                      type="text"
                      value={newGatePassIdCard}
                      onChange={(e) => setNewGatePassIdCard(e.target.value)}
                      placeholder="VD: 001095012345"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">
                      Số điện thoại <span className="text-rose-500">*</span>:
                    </span>
                    <input
                      type="text"
                      value={newGatePassPhone}
                      onChange={(e) => setNewGatePassPhone(e.target.value)}
                      placeholder="VD: 0918.222.333"
                      className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">
                      Đơn vị vận tải 3PL / Hợp đồng:
                    </span>
                    <select
                      value={newGatePassCarrier}
                      onChange={(e) => setNewGatePassCarrier(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs"
                    >
                      <option value="Đối Tác 3PL Indo-Trans Logistics (ITL)">Indo-Trans Logistics (ITL)</option>
                      <option value="Đối Tác 3PL Vinafco Logistics">Vinafco Logistics</option>
                      <option value="Đối Tác 3PL Viettel Post Contract">Viettel Post Contract</option>
                      <option value="Đối Tác 3PL Giao Hàng Nhanh">GHN Fleet Contract</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Loại xe:</span>
                    <select
                      value={newGatePassType}
                      onChange={(e) => setNewGatePassType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs"
                    >
                      <option value="Xe Tải Thùng 15 Tấn">Xe Tải Thùng 15 Tấn</option>
                      <option value="Xe Tải 8 Tấn">Xe Tải 8 Tấn</option>
                      <option value="Xe Container 20 Feet">Xe Container 20 Feet</option>
                      <option value="Xe Container 40 Feet">Xe Container 40 Feet</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleRegister3plGatePass}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🛡️</span>
                    <span>Xác Thực Hồ Sơ & Cấp Thẻ Gate-In</span>
                  </button>
                </div>
              </div>
            )}

            {/* Ô tìm kiếm nhanh bằng Mã Lệnh Điều Xe hoặc Biển Số */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                placeholder="Tìm biển số xe, tên tài xế hoặc quét mã Lệnh Điều Xe (Trip Code / Gate Pass)..."
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Danh sách các xe đã kiểm duyệt và đang Gate-in */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {allAvailableFleet
                .filter((f) => {
                  if (!fleetSearch.trim()) return true
                  const q = fleetSearch.toLowerCase()
                  return (
                    f.plate.toLowerCase().includes(q) ||
                    f.driver.toLowerCase().includes(q) ||
                    f.gatePassId.toLowerCase().includes(q) ||
                    f.carrier.toLowerCase().includes(q)
                  )
                })
                .map((f) => {
                  const isSelected = selectedTruckPlate === f.plate
                  return (
                    <div
                      key={f.plate}
                      onClick={() => handleSelectApprovedTruck(f)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-sky-50 border-sky-600 ring-2 ring-sky-400/30 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="font-mono font-black text-xs text-sky-950 flex items-center gap-1.5">
                          <span>🚛</span>
                          <span>[{f.plate}]</span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[9px] font-black">
                          🟢 GATE-IN
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700 font-bold">
                        Bác tài: {f.driver}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-0.5 border-t border-slate-100">
                        <span className="truncate max-w-[140px]">{f.carrier}</span>
                        <span className="font-mono text-slate-600 font-bold">{f.gatePassId}</span>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Thẻ xác thực an ninh xe đang chọn */}
            {selectedTruckPlate && (
              <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-black shadow-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-2">
                      <span>Xe Được Phê Duyệt: [{truckNumber}]</span>
                      <span className="text-[10px] text-emerald-800 font-sans font-normal">({truckType})</span>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-medium">
                      Đơn vị: <b>{carrierName}</b> • Tài xế: <b>{truckDriver}</b> • SĐT: <b>{truckDriverPhone}</b> • Mã: <b>{gatePassId}</b>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md font-mono text-[9px] font-bold">
                  HỒ SƠ HỢP LỆ
                </span>
              </div>
            )}
          </div>

          {/* 3. TÁCH BIỆT: XẾP HÀNG LÊN XE VS NIÊM PHONG SEAL CHÌ */}
          <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
            <label className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
              <span>⚙️</span> 3. Chọn Chế Độ Thao Tác (Xếp Hàng vs Niêm Phong):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Xếp lên xe tại Dock (Chưa niêm phong) */}
              <div
                onClick={() => setIsSealAndDispatch(false)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-2 ${
                  !isSealAndDispatch
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={!isSealAndDispatch}
                    onChange={() => setIsSealAndDispatch(false)}
                    className="mt-0.5"
                  />
                  <div>
                    <h5 className="font-black text-xs text-sky-950 flex items-center gap-1.5">
                      <span>📦</span> Xếp Lên Xe Tại Cửa Dock
                    </h5>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      <b>Thùng xe vẫn mở</b> để tiếp tục gom thêm các kiện khác cùng tuyến. Khóa Seal chì sẽ được dập sau khi xe đầy tải.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md self-start">
                  Khuyến nghị: Khi xe chưa xuất bến
                </span>
              </div>

              {/* Option 2: Niêm phong Seal chì & Xuất bến ngay */}
              <div
                onClick={() => setIsSealAndDispatch(true)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between space-y-2 ${
                  isSealAndDispatch
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="dispatchMode"
                    checked={isSealAndDispatch}
                    onChange={() => setIsSealAndDispatch(true)}
                    className="mt-0.5"
                  />
                  <div>
                    <h5 className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                      <span>🔒</span> Niêm Phong Seal & Xuất Bến
                    </h5>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                      Xe đã đủ tải hoặc đến giờ xuất phát. Dập khóa Seal chì ZMX, đóng thùng xe và chuyển sang <b>Đang Trung Chuyển (IN_TRANSIT)</b>.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md self-start">
                  Đóng chốt xuất bến
                </span>
              </div>
            </div>

            {/* Ô nhập mã Seal chì (CHỈ bắt buộc khi chọn Niêm phong xuất bến) */}
            {isSealAndDispatch && (
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <label className="font-black text-amber-950 flex items-center gap-1.5 text-xs">
                    <span>🔒</span> Mã Số Khóa Seal Chì (Container Security Seal):
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
                    onChange={(e) => setSealNumber(e.target.value.toUpperCase())}
                    placeholder="VD: SEAL-HN-HCM-9821"
                    className="w-full px-3.5 py-2 bg-white border-2 border-amber-400 rounded-xl font-mono font-black text-amber-900 text-xs tracking-wider uppercase focus:outline-none focus:border-amber-600"
                    required={isSealAndDispatch}
                  />
                  <span className="absolute right-3 top-2 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    CHÍNH HÃNG ZMX
                  </span>
                </div>
                <p className="text-[10px] text-amber-800 font-medium">
                  * Sau khi dập Seal, bưu cục đích bắt buộc đối soát đúng mã Seal này trước khi dỡ hàng.
                </p>
              </div>
            )}
          </div>

          {/* 4. Cảnh báo chống xếp nhầm xe (Anti-Misroute Alert) */}
          {misroutedShipments.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                <span>🚨</span> CẢNH BÁO: PHÁT HIỆN KIỆN HÀNG KHÔNG ĐÚNG TUYẾN ({misroutedShipments.length} KIỆN)
              </div>
              <p className="text-[10px] text-rose-700">
                Tuyến xe này chạy đến <b>{targetHub?.name} ({targetHub?.province})</b>, nhưng các kiện sau có địa chỉ giao ở khu vực khác:
              </p>
              <ul className="space-y-0.5 pl-4 list-disc text-[10px] font-mono text-rose-800 max-h-24 overflow-y-auto">
                {misroutedShipments.map((s) => (
                  <li key={s.id}>
                    <b>{s.trackingNumber}</b> — {s.deliveryAddress}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Tóm tắt Bảng Kê (Manifest Summary) */}
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
            <div className="pt-2 border-t border-slate-100 max-h-28 overflow-y-auto space-y-1">
              <span className="text-[10px] font-bold text-slate-500 block">Danh sách vận đơn đưa lên xe:</span>
              {selectedShipments.map((s) => (
                <div key={s.id} className="flex justify-between items-center text-[10px] py-0.5 px-2 bg-slate-50 rounded font-mono">
                  <span className="font-bold text-indigo-900">{s.trackingNumber}</span>
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
              className={`px-6 py-2.5 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-2 disabled:opacity-40 ${
                isSealAndDispatch
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                  : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500'
              }`}
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang Xử Lý...</span>
                </>
              ) : isSealAndDispatch ? (
                <>
                  <span>🔒</span>
                  <span>Niêm Phong Seal & Xuất Bến ({selectedShipments.length} Kiện)</span>
                </>
              ) : (
                <>
                  <span>📦</span>
                  <span>Xếp Lên Xe Tại Cửa Dock ({selectedShipments.length} Kiện)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

