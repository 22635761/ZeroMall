import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { HubCreateEditModal } from './HubCreateEditModal'

interface Driver {
  id: string
  name: string
  phone: string
  vehicleType: string
  vehicleNumber: string
  hubId: string
  operatingArea?: string
  assignedDistrict?: string
  assignedProvince?: string
  status: string
  createdAt?: string
  hub?: { id: string; name: string; code: string; type?: string }
}

interface Hub {
  id: string
  code: string
  name: string
  address: string
  province: string
  district: string
  ward?: string
  type: string
  status: string
  drivers?: Driver[]
  _count?: { shipments?: number; drivers?: number }
  createdAt?: string
}

interface LogisticsHubsFleetTabProps {
  triggerAuditLog?: (action: string) => Promise<void>
  initialSubView?: 'HUBS' | 'DRIVERS'
}

// Helper phân loại Hub vào Cụm Mega SOC chủ quản theo địa lý chuẩn TMĐT
export const getParentSoc = (hub: { province?: string; code?: string }) => {
  const p = (hub.province || '').toLowerCase()
  if (p.includes('hồ chí minh') || p.includes('đồng nai') || p.includes('bình dương')) {
    return { id: 'hub-hcm-01', code: 'HCM01', name: 'Trung Tâm Phân Loại Bắc Củ Chi SOC', shortName: 'Bắc Củ Chi SOC', region: 'Khu Vực Nam Bộ' }
  }
  if (p.includes('hà nội') || p.includes('hoà bình') || p.includes('hòa bình') || p.includes('bắc ninh')) {
    return { id: 'hub-hn-01', code: 'HN01', name: 'Trung Tâm Phân Loại Mê Linh SOC', shortName: 'Mê Linh SOC', region: 'Khu Vực Miền Bắc' }
  }
  if (p.includes('đà nẵng') || p.includes('quảng nam') || p.includes('huế')) {
    return { id: 'hub-dng-soc', code: 'DNG01', name: 'Trung Tâm Phân Loại Hòa Cầm SOC', shortName: 'Hòa Cầm SOC', region: 'Khu Vực Miền Trung' }
  }
  return { id: 'hub-ct-soc', code: 'CT01', name: 'Trung Tâm Phân Loại Trà Nóc SOC', shortName: 'Trà Nóc SOC', region: 'Khu Vực Tây Nam Bộ' }
}

export const LogisticsHubsFleetTab: React.FC<LogisticsHubsFleetTabProps> = ({
  triggerAuditLog,
  initialSubView = 'HUBS'
}) => {
  const [subView, setSubView] = useState<'HUBS' | 'DRIVERS'>(initialSubView)
  const [hubTypeFilter, setHubTypeFilter] = useState<'ALL' | 'DESTINATION_HUB' | 'SORTING_CENTER'>('ALL')
  const [vehicleFilter, setVehicleFilter] = useState<'ALL' | 'MOTORBIKE' | 'VAN' | 'TRUCK'>('ALL')
  const [hubs, setHubs] = useState<Hub[]>([])
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('ALL')
  const [selectedHubFilter, setSelectedHubFilter] = useState<string>(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    return params?.get('hub') || 'ALL'
  })
  const [selectedSocId, setSelectedSocId] = useState<string>(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    return params?.get('soc') || 'ALL'
  })
  const [driverViewMode, setDriverViewMode] = useState<'TABLE' | 'TREE'>(() => {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    return params?.get('dview') === 'TREE' ? 'TREE' : 'TABLE'
  })

  // Modals state
  const [isHubModalOpen, setIsHubModalOpen] = useState(false)
  const [editingHub, setEditingHub] = useState<Hub | null>(null)

  const [selectedHubForDrivers, setSelectedHubForDrivers] = useState<Hub | null>(null)
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: 'MOTORBIKE',
    hubId: '',
    assignedDistrict: '',
    assignedProvince: '',
    operatingArea: ''
  })

  const [submitting, setSubmitting] = useState(false)

  // Synchronize when initialSubView changes
  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView)
    }
  }, [initialSubView])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hubsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/delivery/hubs`),
        fetch(`${API_BASE_URL}/delivery/drivers`)
      ])

      if (hubsRes.ok) {
        const hubsData = await hubsRes.json()
        setHubs(Array.isArray(hubsData) ? hubsData : [])
        if (selectedHubForDrivers) {
          const updated = hubsData.find((h: Hub) => h.id === selectedHubForDrivers.id)
          if (updated) setSelectedHubForDrivers(updated)
        }
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json()
        setAllDrivers(Array.isArray(driversData) ? driversData : [])
      }
    } catch (err) {
      console.error('Error fetching hubs/drivers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // List of unique provinces from existing hubs for quick filter
  const existingProvinces = Array.from(new Set(hubs.map(h => h.province).filter(Boolean)))

  // Breakdown statistics
  const motorbikeDrivers = allDrivers.filter(d => d.vehicleType === 'MOTORBIKE')
  const vanDrivers = allDrivers.filter(d => d.vehicleType === 'VAN')
  const truckDrivers = allDrivers.filter(d => d.vehicleType === 'TRUCK')
  const lastMileShippers = allDrivers.filter(d => d.vehicleType !== 'TRUCK')
  const megaSocs = hubs.filter(h => h.type === 'SORTING_CENTER')
  const destHubs = hubs.filter(h => h.type !== 'SORTING_CENTER')
  const totalSocCount = megaSocs.length
  const totalDeliveryHubCount = destHubs.length

  // Danh sách các Hub con tương ứng với Cụm Mega SOC đang chọn
  const activeChildHubs = selectedSocId === 'ALL'
    ? destHubs
    : destHubs.filter(h => getParentSoc(h).id === selectedSocId)

  const activeSocTruckDrivers = selectedSocId === 'ALL'
    ? truckDrivers
    : allDrivers.filter(d => d.hubId === selectedSocId && d.vehicleType === 'TRUCK')

  const activeSelectedSoc = megaSocs.find(s => s.id === selectedSocId)
  const activeSelectedHub = hubs.find(h => h.id === selectedHubFilter)

  // Filtered hubs
  const filteredHubs = hubs.filter(h => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query || 
      h.name.toLowerCase().includes(query) ||
      h.code.toLowerCase().includes(query) ||
      h.province.toLowerCase().includes(query) ||
      h.district.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query)

    const matchesProvince = provinceFilter === 'ALL' || h.province === provinceFilter
    const matchesType = hubTypeFilter === 'ALL' || h.type === hubTypeFilter

    return matchesSearch && matchesProvince && matchesType
  })

  // Filtered drivers with 2-Tier Hierarchy (SOC ➔ Hub)
  const filteredDrivers = allDrivers.filter(d => {
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      d.name.toLowerCase().includes(query) ||
      d.phone.includes(query) ||
      d.vehicleNumber.toLowerCase().includes(query) ||
      (d.hub?.name && d.hub.name.toLowerCase().includes(query)) ||
      (d.operatingArea && d.operatingArea.toLowerCase().includes(query))

    // 1. Phân loại theo Mega SOC
    let matchesSoc = true
    if (selectedSocId !== 'ALL') {
      const hubObj = hubs.find(h => h.id === d.hubId) || d.hub
      if (hubObj) {
        if (hubObj.type === 'SORTING_CENTER') {
          matchesSoc = hubObj.id === selectedSocId
        } else {
          matchesSoc = getParentSoc(hubObj).id === selectedSocId
        }
      } else {
        matchesSoc = false
      }
    }

    // 2. Phân loại theo Bưu Cục Hub con
    let matchesHub = true
    if (selectedHubFilter === 'TRUCKS_ONLY') {
      matchesHub = d.vehicleType === 'TRUCK'
    } else if (selectedHubFilter !== 'ALL') {
      matchesHub = d.hubId === selectedHubFilter
    }

    const matchesVehicle = vehicleFilter === 'ALL' || d.vehicleType === vehicleFilter

    return matchesSearch && matchesSoc && matchesHub && matchesVehicle
  })

  // Handle Delete Hub
  const handleDeleteHub = async (hub: Hub) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Bưu cục "${hub.name}" (${hub.code})? Hành động này không thể hoàn tác.`)) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/delivery/hubs/${hub.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Không thể xóa bưu cục')
      }
      alert('Đã xóa bưu cục thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`Xóa Bưu cục [${hub.code}] ${hub.name}`)
      }
      fetchData()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa bưu cục'))
    }
  }

  // Handle Driver Form Submit
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driverFormData.name.trim() || !driverFormData.phone.trim() || !driverFormData.vehicleNumber.trim() || !driverFormData.hubId) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc của Tài xế!')
      return
    }

    // Safety check: Motorbike/Van shipper cannot be assigned to SORTING_CENTER
    const chosenHub = hubs.find(h => h.id === driverFormData.hubId)
    if (chosenHub?.type === 'SORTING_CENTER' && driverFormData.vehicleType !== 'TRUCK') {
      alert('Quy định nghiệp vụ: Shipper xe máy hoặc xe bán tải không thể trực thuộc Kho Tổng Phân Loại (SOC). Vui lòng chọn Bưu Cục Giao Hàng (Hub)!')
      return
    }

    setSubmitting(true)
    try {
      const url = editingDriver 
        ? `${API_BASE_URL}/delivery/drivers/${editingDriver.id}` 
        : `${API_BASE_URL}/delivery/drivers`
      const method = editingDriver ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverFormData)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Không thể lưu thông tin tài xế')
      }

      alert(editingDriver ? 'Cập nhật thông tin tài xế thành công!' : 'Thêm tài xế thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`${editingDriver ? 'Cập nhật' : 'Thêm mới'} Tài xế ${driverFormData.name} (${driverFormData.phone})`)
      }
      setIsDriverModalOpen(false)
      setEditingDriver(null)
      fetchData()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Đã xảy ra lỗi'))
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Driver
  const handleDeleteDriver = async (driver: Driver) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài xế "${driver.name}" (${driver.phone}) khỏi hệ thống?`)) {
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/delivery/drivers/${driver.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Không thể xóa tài xế')
      }
      alert('Đã xóa tài xế thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`Xóa Tài xế ${driver.name} (${driver.phone})`)
      }
      fetchData()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa tài xế'))
    }
  }

  const openAddHubModal = () => {
    setEditingHub(null)
    setIsHubModalOpen(true)
  }

  const openEditHubModal = (hub: Hub) => {
    setEditingHub(hub)
    setIsHubModalOpen(true)
  }

  const openAddDriverModal = (hub?: Hub, forcedVehicleType?: string) => {
    const isSOC = hub?.type === 'SORTING_CENTER'
    const defaultVehicleType = forcedVehicleType || (isSOC ? 'TRUCK' : 'MOTORBIKE')
    
    // Eligible target hubs for this vehicle
    const eligibleHubs = defaultVehicleType === 'TRUCK' 
      ? hubs 
      : hubs.filter(h => h.type !== 'SORTING_CENTER')

    const targetHubId = hub?.id || (eligibleHubs[0]?.id || hubs[0]?.id || '')
    const chosenHub = hubs.find(h => h.id === targetHubId)

    setEditingDriver(null)
    setDriverFormData({
      name: '',
      phone: '',
      vehicleNumber: '',
      vehicleType: defaultVehicleType,
      hubId: targetHubId,
      assignedDistrict: chosenHub?.district || '',
      assignedProvince: chosenHub?.province || '',
      operatingArea: ''
    })
    setIsDriverModalOpen(true)
  }

  const openEditDriverModal = (driver: Driver) => {
    setEditingDriver(driver)
    setDriverFormData({
      name: driver.name,
      phone: driver.phone,
      vehicleNumber: driver.vehicleNumber,
      vehicleType: driver.vehicleType,
      hubId: driver.hubId,
      assignedDistrict: driver.assignedDistrict || '',
      assignedProvince: driver.assignedProvince || '',
      operatingArea: driver.operatingArea || ''
    })
    setIsDriverModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hubs & SOC */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl text-slate-700 shrink-0">
            🌐
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hạ Tầng Toàn Sàn</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{hubs.length} Cơ Sở</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{totalSocCount} SOC • {totalDeliveryHubCount} Hub phát</div>
          </div>
        </div>

        {/* SOC Mega Sorting Centers */}
        <div 
          onClick={() => { setSubView('HUBS'); setHubTypeFilter('SORTING_CENTER'); }}
          className="bg-white p-5 rounded-2xl border border-sky-200/80 hover:border-sky-300 shadow-3xs flex items-center gap-4 cursor-pointer transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 group-hover:scale-105 flex items-center justify-center text-2xl text-sky-600 shrink-0 transition">
            🏭
          </div>
          <div>
            <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Kho Trung Chuyển (SOC)</div>
            <div className="text-2xl font-black text-sky-950 mt-0.5">{totalSocCount} Đại Trung Tâm</div>
            <div className="text-[10px] text-sky-600 font-semibold mt-0.5">Băng chuyền tự động & Xe tải lớn</div>
          </div>
        </div>

        {/* Delivery Hubs */}
        <div 
          onClick={() => { setSubView('HUBS'); setHubTypeFilter('DESTINATION_HUB'); }}
          className="bg-white p-5 rounded-2xl border border-emerald-200/80 hover:border-emerald-300 shadow-3xs flex items-center gap-4 cursor-pointer transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 group-hover:scale-105 flex items-center justify-center text-2xl text-emerald-600 shrink-0 transition">
            🏢
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Bưu Cục Giao Hàng (Hub)</div>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">{totalDeliveryHubCount} Bưu Cục Phát</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Tiếp nhận & giao tận tay khách</div>
          </div>
        </div>

        {/* Drivers & Shippers Breakdown */}
        <div 
          onClick={() => setSubView('DRIVERS')}
          className="bg-white p-5 rounded-2xl border border-amber-200/80 hover:border-amber-300 shadow-3xs flex items-center gap-4 cursor-pointer transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 group-hover:scale-105 flex items-center justify-center text-2xl text-amber-600 shrink-0 transition">
            🛵
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Đội Ngũ Vận Chuyển</div>
            <div className="text-2xl font-black text-amber-950 mt-0.5">{allDrivers.length} Nhân Sự</div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
              {lastMileShippers.length} Shipper phát • {truckDrivers.length} Xe tải Linehaul
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPX Supply Chain Explanatory Notice */}
      <div className="p-4 bg-linear-to-r from-sky-50/70 via-indigo-50/50 to-emerald-50/70 border border-slate-200/90 rounded-2xl shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-base shrink-0 shadow-3xs">
            💡
          </div>
          <div className="space-y-1">
            <span className="font-black text-slate-900">
              Quy chuẩn phân định chức năng: Trung Tâm Phân Loại (SOC) vs. Bưu Cục Giao Hàng (Hub)
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11px]">
              <span className="flex items-center gap-1">
                <b className="text-sky-800">🏭 Mega SOC:</b> Kho tổng xử lý phân loại tự động liên tỉnh, chỉ tiếp nhận <b>Xe tải Linehaul (8T-20ft)</b>. Tuyệt đối không giao hàng lẻ và <u>không có shipper xe máy</u>.
              </span>
              <span className="flex items-center gap-1">
                <b className="text-emerald-800">🏢 Delivery Hub:</b> Bưu cục vệ tinh chặng cuối (Last-mile), nơi quản lý <b>Đội ngũ Shipper (Xe máy / Van)</b> để giao bưu kiện đến tận cửa khách hàng.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Admin Management Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Navigation Switcher: Bưu Cục vs Đội Tài Xế */}
        <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl">
            <button
              onClick={() => { setSubView('HUBS'); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                subView === 'HUBS'
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏢</span> Mạng Lưới Bưu Cục & Trạm ({hubs.length})
            </button>
            <button
              onClick={() => { setSubView('DRIVERS'); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                subView === 'DRIVERS'
                  ? 'bg-white text-slate-900 shadow-3xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛵</span> Quản Lý Đội Ngũ Vận Tải ({allDrivers.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {subView === 'HUBS' ? (
              <button
                onClick={openAddHubModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer flex items-center gap-2"
              >
                <span>➕</span> Thiết Lập Trạm Mới
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddDriverModal(undefined, 'MOTORBIKE')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🛵</span> + Tuyển Shipper Hub
                </button>
                <button
                  onClick={() => openAddDriverModal(undefined, 'TRUCK')}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚛</span> + Tài Xế Xe Tải SOC
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-3 bg-white">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder={
                subView === 'HUBS'
                  ? 'Tìm bưu cục theo Tên, Mã trạm, Tỉnh/thành, Quận/huyện, Địa chỉ...'
                  : 'Tìm theo Tên tài xế, Số điện thoại, Biển số xe, Tuyến phụ trách...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          {subView === 'HUBS' ? (
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setHubTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    hubTypeFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({hubs.length})
                </button>
                <button
                  onClick={() => setHubTypeFilter('DESTINATION_HUB')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    hubTypeFilter === 'DESTINATION_HUB'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>🏢</span> Hub Phát ({totalDeliveryHubCount})
                </button>
                <button
                  onClick={() => setHubTypeFilter('SORTING_CENTER')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    hubTypeFilter === 'SORTING_CENTER'
                      ? 'bg-sky-600 text-white shadow-3xs'
                      : 'text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  <span>🏭</span> Mega SOC ({totalSocCount})
                </button>
              </div>

              {/* Province Filter */}
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer font-medium"
              >
                <option value="ALL">Khu vực: Tất cả ({existingProvinces.length})</option>
                {existingProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 w-full md:w-auto">
              {/* Vehicle Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setVehicleFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    vehicleFilter === 'ALL'
                      ? 'bg-white text-slate-900 shadow-3xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({allDrivers.length})
                </button>
                <button
                  onClick={() => setVehicleFilter('MOTORBIKE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    vehicleFilter === 'MOTORBIKE'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>🛵</span> Xe Máy ({motorbikeDrivers.length})
                </button>
                <button
                  onClick={() => setVehicleFilter('VAN')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    vehicleFilter === 'VAN'
                      ? 'bg-indigo-600 text-white shadow-3xs'
                      : 'text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  <span>🚐</span> Xe Van ({vanDrivers.length})
                </button>
                <button
                  onClick={() => setVehicleFilter('TRUCK')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                    vehicleFilter === 'TRUCK'
                      ? 'bg-sky-600 text-white shadow-3xs'
                      : 'text-sky-700 hover:bg-sky-50'
                  }`}
                >
                  <span>🚛</span> Xe Tải Tuyến ({truckDrivers.length})
                </button>
              </div>

              {/* View Mode Switcher: TABLE vs TREE */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setDriverViewMode('TABLE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    driverViewMode === 'TABLE'
                      ? 'bg-slate-900 text-white shadow-3xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📋</span> Bảng Lọc Thu Gọn
                </button>
                <button
                  onClick={() => setDriverViewMode('TREE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    driverViewMode === 'TREE'
                      ? 'bg-emerald-600 text-white shadow-3xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🌳</span> Cây Phân Cấp SOC ➔ Hubs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BỘ LỌC PHÂN CẤP 2 TẦNG (Cụm Mega SOC ➔ Bưu Cục Hubs ➔ Shippers) */}
        {subView === 'DRIVERS' && (
          <div className="bg-slate-50/80 border-b border-slate-200/80 p-4 space-y-3.5">
            {/* TẦNG 1: CHỌN CỤM VÙNG MEGA SOC */}
            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-black text-slate-800 flex items-center gap-1.5">
                  <span>🏭</span> 1. Chọn Cụm Vùng Quản Lý (Mega SOC):
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedSocId === 'ALL'
                    ? 'Đang hiển thị toàn quốc • Chọn 1 SOC để lọc các Hub con'
                    : `Đang lọc: ${activeSelectedSoc?.name || 'Cụm SOC'}`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedSocId('ALL')
                    setSelectedHubFilter('ALL')
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    selectedSocId === 'ALL'
                      ? 'bg-slate-900 text-white shadow-3xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>🌐</span> Toàn Mạng Lưới ({allDrivers.length})
                </button>

                {megaSocs.map((soc) => {
                  const socMeta = getParentSoc(soc)
                  // Đếm tổng số tài xế thuộc cụm SOC này (cả xe tải SOC và các shipper thuộc Hub con)
                  const socTotalDrivers = allDrivers.filter((d) => {
                    if (d.hubId === soc.id) return true
                    const dHub = hubs.find((h) => h.id === d.hubId) || d.hub
                    return dHub && getParentSoc(dHub).id === soc.id
                  })

                  const isSelected = selectedSocId === soc.id

                  return (
                    <button
                      key={soc.id}
                      onClick={() => {
                        setSelectedSocId(soc.id)
                        setSelectedHubFilter('ALL')
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-sky-600 text-white shadow-3xs'
                          : 'bg-white text-slate-700 hover:bg-sky-50 border border-slate-200'
                      }`}
                    >
                      <span>🏭</span>
                      <span>{socMeta.shortName}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-mono'
                      }`}>
                        {socTotalDrivers.length}
                      </span>
                      <span className={`text-[10px] font-normal hidden lg:inline ${
                        isSelected ? 'text-sky-100' : 'text-slate-400'
                      }`}>
                        ({socMeta.region})
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* TẦNG 2: CHỌN BƯU CỤC HUB THUỘC SOC ĐƯỢC CHỌN */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-black text-slate-800 flex items-center gap-1.5">
                  <span>🏢</span> 2. Chọn Bưu Cục Hub Để Xem Đội Ngũ Shipper Của Riêng Hub Đó:
                </span>
                <span className="text-[11px] text-emerald-700 font-bold">
                  {selectedHubFilter !== 'ALL'
                    ? `✓ Đã chọn: ${activeSelectedHub?.name || (selectedHubFilter === 'TRUCKS_ONLY' ? 'Xe Tải Linehaul SOC' : 'Bưu Cục')}`
                    : 'Bấm vào một bưu cục để xem gọn danh sách'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedHubFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedHubFilter === 'ALL'
                      ? 'bg-emerald-700 text-white shadow-3xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Tất Cả Cơ Sở Của Cụm</span>
                </button>

                {activeChildHubs.map((hub) => {
                  const hubDrivers = allDrivers.filter((d) => d.hubId === hub.id)
                  const isSelected = selectedHubFilter === hub.id
                  const cleanName = hub.name.replace('Bưu Cục Giao Hàng ', '').replace('Bưu Cục ', '')

                  return (
                    <button
                      key={hub.id}
                      onClick={() => setSelectedHubFilter(hub.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-3xs'
                          : 'bg-white text-slate-700 hover:bg-emerald-50 border border-slate-200'
                      }`}
                    >
                      <span>🏢</span>
                      <span>{cleanName}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-white/20 text-white' : hubDrivers.length > 0 ? 'bg-emerald-50 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {hubDrivers.length}
                      </span>
                    </button>
                  )
                })}

                {/* Nếu SOC có xe tải Linehaul */}
                {selectedSocId !== 'ALL' && activeSocTruckDrivers.length > 0 && (
                  <button
                    onClick={() => setSelectedHubFilter('TRUCKS_ONLY')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      selectedHubFilter === 'TRUCKS_ONLY'
                        ? 'bg-sky-600 text-white shadow-3xs'
                        : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-200'
                    }`}
                  >
                    <span>🚛</span>
                    <span>Xe Tải Linehaul SOC</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selectedHubFilter === 'TRUCKS_ONLY' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800 font-bold'
                    }`}>
                      {activeSocTruckDrivers.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE HUB CONTEXT CARD (Hiện ra khi Admin chọn 1 Hub cụ thể) */}
        {subView === 'DRIVERS' && selectedHubFilter !== 'ALL' && activeSelectedHub && (
          <div className="p-4 bg-emerald-50/80 border-b border-emerald-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏢</span>
                <span className="font-black text-emerald-950 text-sm">{activeSelectedHub.name}</span>
                <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded font-mono text-[10px] font-bold">
                  {activeSelectedHub.code}
                </span>
                <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md text-[10px] font-bold">
                  Trực thuộc: {getParentSoc(activeSelectedHub).shortName}
                </span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                📍 {activeSelectedHub.address}, {activeSelectedHub.district}, {activeSelectedHub.province} • Đang hiển thị đúng <b>{filteredDrivers.length} nhân sự shipper</b> của riêng Hub này (không bị gom lẫn lộn).
              </p>
            </div>

            <button
              onClick={() => openAddDriverModal(activeSelectedHub, 'MOTORBIKE')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-3xs cursor-pointer"
            >
              <span>➕</span> Tuyển Shipper Cho {activeSelectedHub.name.replace('Bưu Cục Giao Hàng ', '').replace('Bưu Cục ', '')}
            </button>
          </div>
        )}

        {/* ACTIVE SOC TRUCKS CONTEXT CARD */}
        {subView === 'DRIVERS' && selectedHubFilter === 'TRUCKS_ONLY' && activeSelectedSoc && (
          <div className="p-4 bg-sky-50/80 border-b border-sky-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚛</span>
                <span className="font-black text-sky-950 text-sm">Đội Xe Tải Tuyến Chính Linehaul • {activeSelectedSoc.name}</span>
                <span className="px-1.5 py-0.5 bg-sky-200/80 text-sky-900 rounded font-mono text-[10px] font-bold">
                  {activeSelectedSoc.code}
                </span>
              </div>
              <p className="text-[11px] text-sky-900/80 leading-relaxed">
                📍 {activeSelectedSoc.address}, {activeSelectedSoc.province} • Chạy tuyến vận chuyển đường dài liên tỉnh (8T - 20ft) • Đang hiển thị <b>{filteredDrivers.length} tài xế xe tải</b>.
              </p>
            </div>

            <button
              onClick={() => openAddDriverModal(activeSelectedSoc, 'TRUCK')}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-3xs cursor-pointer"
            >
              <span>➕</span> Tuyển Tài Xế Xe Tải Tuyến
            </button>
          </div>
        )}

        {/* VIEW 1: BẢNG QUẢN LÝ BƯU CỤC & SOC */}
        {subView === 'HUBS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã Trạm</th>
                  <th className="py-3 px-4">Tên Trạm / Cơ Sở</th>
                  <th className="py-3 px-4">Phân Loại Hạ Tầng</th>
                  <th className="py-3 px-4">Vị Trí & Khu Vực</th>
                  <th className="py-3 px-4 text-center">Đội Ngũ Phụ Trách</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Quản Trị Cơ Sở</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p>Đang tải dữ liệu mạng lưới bưu cục...</p>
                    </td>
                  </tr>
                ) : filteredHubs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy bưu cục hoặc trạm nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredHubs.map((hub) => {
                    const hubDrivers = allDrivers.filter(d => d.hubId === hub.id)
                    const isSOC = hub.type === 'SORTING_CENTER'
                    const motorDrivers = hubDrivers.filter(d => d.vehicleType === 'MOTORBIKE')
                    const vanDrivers = hubDrivers.filter(d => d.vehicleType === 'VAN')
                    const truckFleet = hubDrivers.filter(d => d.vehicleType === 'TRUCK')
                    const lastMileCount = motorDrivers.length + vanDrivers.length

                    return (
                      <tr key={hub.id} className="hover:bg-slate-50/70 transition">
                        {/* Hub Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span className={`px-2 py-0.5 rounded border ${
                            isSOC 
                              ? 'bg-sky-50 border-sky-200 text-sky-800' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          }`}>
                            {hub.code}
                          </span>
                        </td>

                        {/* Hub Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{isSOC ? '🏭' : '🏢'}</span>
                            <span>{hub.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">ID: {hub.id}</div>
                        </td>

                        {/* Infrastructure Type Badge */}
                        <td className="py-3.5 px-4">
                          {isSOC ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-200">
                                <span>🏭</span> TRUNG TÂM PHÂN LOẠI SOC
                              </span>
                              <p className="text-[10px] text-sky-600 font-semibold mt-0.5">Kho tổng • Tuyến xe tải Linehaul</p>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span>🏢</span> BƯU CỤC GIAO HÀNG (HUB)
                              </span>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Trạm phát • Shipper Last-mile</p>
                            </div>
                          )}
                        </td>

                        {/* Address */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-semibold text-slate-800 truncate" title={hub.address}>
                            {hub.address}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {hub.district ? `${hub.district}, ` : ''}{hub.province}
                          </p>
                        </td>

                        {/* Drivers Assigned Breakdown */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedHubForDrivers(hub)}
                            className="inline-flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 transition cursor-pointer min-w-32"
                          >
                            {isSOC ? (
                              <>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                  <span>🚫</span> 0 Shipper phát
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-black text-sky-800 mt-0.5">
                                  <span>🚛</span> {truckFleet.length} Xe Tải Tuyến
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-800">
                                  <span>🛵</span> {lastMileCount} Shipper phát
                                </span>
                                {truckFleet.length > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 mt-0.5">
                                    <span>🚛</span> {truckFleet.length} Xe gom
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            HOẠT ĐỘNG
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isSOC ? (
                              <button
                                onClick={() => openAddDriverModal(hub, 'TRUCK')}
                                title="Thêm tài xế xe tải tuyến cho kho SOC"
                                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1"
                              >
                                <span>🚛</span> + Xe Tải Tuyến
                              </button>
                            ) : (
                              <button
                                onClick={() => openAddDriverModal(hub, 'MOTORBIKE')}
                                title="Thêm Shipper giao hàng cho bưu cục này"
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer text-xs font-bold flex items-center gap-1"
                              >
                                <span>➕</span> Thêm Shipper
                              </button>
                            )}
                            <button
                              onClick={() => openEditHubModal(hub)}
                              title="Chỉnh sửa thông tin cơ sở"
                              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteHub(hub)}
                              title="Xóa cơ sở"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2A: BẢNG QUẢN LÝ TÀI XẾ THEO BỘ LỌC PHÂN CẤP */}
        {subView === 'DRIVERS' && driverViewMode === 'TABLE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tài Xế / Nhân Sự</th>
                  <th className="py-3 px-4">Số Điện Thoại</th>
                  <th className="py-3 px-4">Trực Thuộc Cơ Sở</th>
                  <th className="py-3 px-4">Phương Tiện & Biển Số</th>
                  <th className="py-3 px-4">Nghiệp Vụ & Tuyến Phụ Trách</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p>Đang tải danh sách tài xế từ cơ sở dữ liệu...</p>
                    </td>
                  </tr>
                ) : filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy tài xế nào thuộc cơ sở hoặc bộ lọc này.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const hubObj = hubs.find(h => h.id === driver.hubId) || driver.hub
                    const isTruck = driver.vehicleType === 'TRUCK'
                    const isVan = driver.vehicleType === 'VAN'
                    const isHubSOC = hubObj?.type === 'SORTING_CENTER'

                    return (
                      <tr key={driver.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                              isTruck ? 'bg-sky-100 text-sky-800' : isVan ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isTruck ? '🚛' : isVan ? '🚐' : '🛵'}
                            </span>
                            <div>
                              <div>{driver.name}</div>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase mt-0.5 ${
                                isTruck 
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                                  : isVan
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {isTruck ? 'Tài Xế Xe Tải Tuyến' : isVan ? 'Shipper Bán Tải (Van)' : 'Shipper Xe Máy Giao Hàng'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {driver.phone}
                        </td>

                        {/* Assigned Hub */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-lg border ${
                            isHubSOC
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <span>{isHubSOC ? '🏭' : '🏢'}</span>
                            <span>{hubObj?.name || 'Chưa gán cơ sở'}</span>
                          </span>
                        </td>

                        {/* Vehicle Number & Type */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-800">{driver.vehicleNumber}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {isTruck ? '🚚 Xe tải Linehaul' : isVan ? '🚐 Xe tải nhẹ / Van' : '🛵 Xe máy'}
                          </div>
                        </td>

                        {/* Operating Area */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <p className="font-medium">
                            {driver.operatingArea || (driver.assignedDistrict ? `${driver.assignedDistrict}, ${driver.assignedProvince}` : 'Toàn khu vực phụ trách')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {isTruck ? 'Chạy tuyến đường dài liên tỉnh / liên trạm' : 'Tuyến giao phát chặng cuối'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {driver.status === 'AVAILABLE' ? 'SẴN SÀNG' : driver.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditDriverModal(driver)}
                              title="Sửa hồ sơ tài xế"
                              className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteDriver(driver)}
                              title="Xóa tài xế"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2B: CHẾ ĐỘ CÂY PHÂN CẤP TRỰC QUAN (SOC ➔ HUBS ➔ SHIPPERS TREE VIEW) */}
        {subView === 'DRIVERS' && driverViewMode === 'TREE' && (
          <div className="p-6 space-y-6 bg-slate-50/50">
            {megaSocs
              .filter((soc) => selectedSocId === 'ALL' || selectedSocId === soc.id)
              .map((soc) => {
                const socMeta = getParentSoc(soc)
                const childHubs = destHubs.filter((h) => getParentSoc(h).id === soc.id)
                const socTrucks = allDrivers.filter((d) => d.hubId === soc.id)
                const totalClusterDrivers = allDrivers.filter((d) => {
                  if (d.hubId === soc.id) return true
                  const dHub = hubs.find((h) => h.id === d.hubId) || d.hub
                  return dHub && getParentSoc(dHub).id === soc.id
                })

                return (
                  <div key={soc.id} className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                    {/* SOC Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-xl text-sky-700">
                          🏭
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-base">{soc.name}</h4>
                            <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-mono text-[10px] font-bold">
                              {soc.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {soc.address}, {soc.province} • {socMeta.region}
                          </p>
                        </div>
                      </div>

                      <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full text-xs font-bold">
                        {childHubs.length} Hubs Vệ Tinh • {totalClusterDrivers.length} Nhân Sự
                      </span>
                    </div>

                    {/* Xe tải Tuyến Linehaul SOC */}
                    {socTrucks.length > 0 && (
                      <div className="bg-sky-50/40 border border-sky-100 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sky-900 flex items-center gap-1.5">
                            <span>🚛</span> Đội Xe Tải Tuyến Chính Linehaul ({socTrucks.length} tài xế):
                          </span>
                          <button
                            onClick={() => openAddDriverModal(soc, 'TRUCK')}
                            className="text-[11px] font-bold text-sky-700 hover:text-sky-900 cursor-pointer"
                          >
                            + Tuyển Thêm Xe Tải
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {socTrucks.map((driver) => (
                            <div key={driver.id} className="bg-white border border-sky-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-3xs">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-sm">
                                  🚛
                                </span>
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{driver.name}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {driver.phone} • {driver.vehicleNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditDriverModal(driver)}
                                  className="p-1.5 text-slate-400 hover:text-sky-700 text-xs cursor-pointer"
                                  title="Sửa"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteDriver(driver)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 text-xs cursor-pointer"
                                  title="Xóa"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lưới các Bưu Cục Hub con & Shipper */}
                    <div className="space-y-2">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                        Mạng Lưới Các Bưu Cục Giao Hàng Con ({childHubs.length} Hubs):
                      </span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {childHubs.map((hub) => {
                          const hubDrivers = allDrivers.filter((d) => d.hubId === hub.id)

                          return (
                            <div key={hub.id} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                <div className="space-y-0.5">
                                  <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>🏢</span>
                                    <span>{hub.name}</span>
                                    <span className="px-1.5 py-0.2 bg-white text-slate-600 rounded text-[9px] font-mono border border-slate-200">
                                      {hub.code}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {hub.district}, {hub.province}
                                  </div>
                                </div>

                                <button
                                  onClick={() => openAddDriverModal(hub, 'MOTORBIKE')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>➕</span> Tuyển
                                </button>
                              </div>

                              {/* Danh sách Shipper của Hub này */}
                              {hubDrivers.length === 0 ? (
                                <div className="text-center py-3 text-[11px] text-slate-400 italic bg-white/60 rounded-xl border border-dashed border-slate-200">
                                  Chưa có shipper gán vào bưu cục này.
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {hubDrivers.map((driver) => (
                                    <div
                                      key={driver.id}
                                      className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-3xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">
                                          {driver.vehicleType === 'VAN' ? '🚐' : driver.vehicleType === 'TRUCK' ? '🚛' : '🛵'}
                                        </span>
                                        <div>
                                          <div className="font-bold text-slate-900 text-xs">{driver.name}</div>
                                          <div className="text-[10px] text-slate-500 font-mono">
                                            {driver.phone} • {driver.vehicleNumber}
                                          </div>
                                          <div className="text-[9px] text-slate-400 line-clamp-1">
                                            {driver.operatingArea || 'Tuyến bưu cục phụ trách'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          SẴN SÀNG
                                        </span>
                                        <button
                                          onClick={() => openEditDriverModal(driver)}
                                          className="p-1 text-slate-400 hover:text-sky-700 text-xs cursor-pointer"
                                          title="Sửa"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDriver(driver)}
                                          className="p-1 text-slate-400 hover:text-rose-600 text-xs cursor-pointer"
                                          title="Xóa"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Driver List Drawer / Modal (Khi bấm xem tài xế của một cơ sở) */}
      {selectedHubForDrivers && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                  selectedHubForDrivers.type === 'SORTING_CENTER'
                    ? 'bg-sky-50 border-sky-200 text-sky-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  {selectedHubForDrivers.type === 'SORTING_CENTER' ? '🏭' : '🏢'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedHubForDrivers.type === 'SORTING_CENTER' ? 'Đoàn Xe Tải Tuyến Đường Dài: ' : 'Đội Ngũ Shipper Phát Hàng: '}
                    <span className={selectedHubForDrivers.type === 'SORTING_CENTER' ? 'text-sky-700' : 'text-emerald-700'}>
                      {selectedHubForDrivers.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mã trạm: {selectedHubForDrivers.code} • Phân loại: {
                      selectedHubForDrivers.type === 'SORTING_CENTER' ? 'Trung Tâm Phân Loại (Mega SOC)' : 'Bưu Cục Giao Hàng (Hub)'
                    } • Địa bàn: {selectedHubForDrivers.province}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedHubForDrivers.type === 'SORTING_CENTER' ? (
                  <button
                    onClick={() => openAddDriverModal(selectedHubForDrivers, 'TRUCK')}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <span>🚛</span> + Thêm Xe Tải Tuyến
                  </button>
                ) : (
                  <button
                    onClick={() => openAddDriverModal(selectedHubForDrivers, 'MOTORBIKE')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <span>➕</span> + Tuyển Shipper Mới
                  </button>
                )}
                <button
                  onClick={() => setSelectedHubForDrivers(null)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Danh sách tài xế */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Notice for SOC */}
              {selectedHubForDrivers.type === 'SORTING_CENTER' && (
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-2.5 text-xs text-sky-900">
                  <span className="text-base shrink-0">ℹ️</span>
                  <div>
                    <p className="font-bold">Nghiệp vụ Trung Tâm Phân Loại (SOC):</p>
                    <p className="text-[11px] text-sky-700 mt-0.5">
                      Kho phân loại tổng chỉ quản lý đội <b>Xe tải Linehaul trung chuyển</b> giữa các vùng/miền. Không phát hàng lẻ tận nhà và <b>không có shipper xe máy</b>. Shipper giao hàng trực thuộc các <b>Bưu Cục Giao Hàng (Hub)</b>.
                    </p>
                  </div>
                </div>
              )}

              {allDrivers.filter(d => d.hubId === selectedHubForDrivers.id).length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <span className="text-4xl">{selectedHubForDrivers.type === 'SORTING_CENTER' ? '🚛' : '🛵'}</span>
                  <p className="text-xs font-semibold">Chưa có phương tiện hay tài xế nào trực thuộc cơ sở này.</p>
                  <button
                    onClick={() => openAddDriverModal(
                      selectedHubForDrivers, 
                      selectedHubForDrivers.type === 'SORTING_CENTER' ? 'TRUCK' : 'MOTORBIKE'
                    )}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-3xs cursor-pointer hover:bg-emerald-700 transition"
                  >
                    {selectedHubForDrivers.type === 'SORTING_CENTER' ? '+ Điều Phối Xe Tải Cho Kho' : '+ Tuyển Shipper Cho Bưu Cục'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {allDrivers.filter(d => d.hubId === selectedHubForDrivers.id).map((driver) => {
                    const isTruck = driver.vehicleType === 'TRUCK'
                    return (
                      <div
                        key={driver.id}
                        className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex justify-between items-start text-xs shadow-3xs hover:border-slate-300 transition"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm">{driver.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {driver.status === 'AVAILABLE' ? 'SẴN SÀNG' : driver.status}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium">📞 SĐT: <b className="text-slate-900">{driver.phone}</b></p>
                          <p className="text-slate-600 font-medium">
                            {isTruck ? '🚛' : '🚗'} Biển số: <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{driver.vehicleNumber}</span> ({
                              isTruck ? 'Xe Tải Tuyến' : driver.vehicleType === 'VAN' ? 'Xe Bán Tải' : 'Xe Máy Giao Hàng'
                            })
                          </p>
                          {driver.operatingArea && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              📍 Tuyến phụ trách: {driver.operatingArea}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditDriverModal(driver)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer text-xs font-bold"
                            title="Sửa thông tin tài xế"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-bold"
                            title="Xóa tài xế"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedHubForDrivers(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Thêm / Sửa Bưu Cục Tích Hợp Bản Đồ & 3 Cấp Hành Chính (Chuẩn Checkout) */}
      <HubCreateEditModal
        isOpen={isHubModalOpen}
        onClose={() => setIsHubModalOpen(false)}
        editingHub={editingHub}
        onSuccess={fetchData}
        triggerAuditLog={triggerAuditLog}
      />

      {/* MODAL 2: Thêm / Sửa Tài Xế */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{driverFormData.vehicleType === 'TRUCK' ? '🚛' : '🛵'}</span> 
                {editingDriver ? 'Cập Nhật Hồ Sơ Nhân Sự Vận Tải' : (
                  driverFormData.vehicleType === 'TRUCK' ? 'Thêm Tài Xế Xe Tải Tuyến Đường Dài' : 'Tuyển Shipper Giao Hàng Bưu Cục'
                )}
              </h3>
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              {/* Loại Phương Tiện / Nghiệp Vụ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Loại Phương Tiện & Nghiệp Vụ *</label>
                <select
                  value={driverFormData.vehicleType}
                  onChange={(e) => {
                    const newType = e.target.value
                    // If switching to MOTORBIKE/VAN and selected hub is a SOC, switch to first delivery hub
                    let currentHub = hubs.find(h => h.id === driverFormData.hubId)
                    let newHubId = driverFormData.hubId
                    if (newType !== 'TRUCK' && currentHub?.type === 'SORTING_CENTER') {
                      const firstDeliveryHub = hubs.find(h => h.type !== 'SORTING_CENTER')
                      newHubId = firstDeliveryHub ? firstDeliveryHub.id : ''
                      currentHub = firstDeliveryHub
                    }
                    setDriverFormData({
                      ...driverFormData,
                      vehicleType: newType,
                      hubId: newHubId,
                      assignedDistrict: currentHub?.district || '',
                      assignedProvince: currentHub?.province || ''
                    })
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition"
                >
                  <option value="MOTORBIKE">🛵 Xe Máy Giao Hàng (Shipper chặng cuối - Bưu Cục Hub)</option>
                  <option value="VAN">🚐 Xe Bán Tải / Van (Hàng cồng kềnh - Bưu Cục Hub)</option>
                  <option value="TRUCK">🚚 Xe Tải Tuyến Đường Dài Linehaul (Kho Tổng SOC & Trung Chuyển)</option>
                </select>
              </div>

              {/* Cơ Sở Trực Thuộc */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Trực Thuộc Cơ Sở / Bưu Cục *</span>
                  {driverFormData.vehicleType !== 'TRUCK' && (
                    <span className="text-[10px] text-emerald-600 font-semibold">Chỉ áp dụng Bưu Cục Hub</span>
                  )}
                </label>
                <select
                  required
                  value={driverFormData.hubId}
                  onChange={(e) => {
                    const chosen = hubs.find(h => h.id === e.target.value)
                    setDriverFormData({
                      ...driverFormData,
                      hubId: e.target.value,
                      assignedProvince: chosen?.province || driverFormData.assignedProvince,
                      assignedDistrict: chosen?.district || driverFormData.assignedDistrict
                    })
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition"
                >
                  <option value="">-- Chọn Cơ Sở Tiếp Nhận --</option>
                  {driverFormData.vehicleType === 'TRUCK' ? (
                    <>
                      <optgroup label="🏭 Trung Tâm Phân Loại (Mega SOC)">
                        {hubs.filter(h => h.type === 'SORTING_CENTER').map(h => (
                          <option key={h.id} value={h.id}>
                            [SOC] [{h.code}] {h.name} - ({h.province})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🏢 Bưu Cục Giao Hàng (Hub)">
                        {hubs.filter(h => h.type !== 'SORTING_CENTER').map(h => (
                          <option key={h.id} value={h.id}>
                            [HUB] [{h.code}] {h.name} - ({h.province})
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    hubs.filter(h => h.type !== 'SORTING_CENTER').map(h => (
                      <option key={h.id} value={h.id}>
                        [HUB] [{h.code}] {h.name} - ({h.district ? `${h.district}, ` : ''}{h.province})
                      </option>
                    ))
                  )}
                </select>
                {driverFormData.vehicleType !== 'TRUCK' && (
                  <p className="text-[10px] text-amber-700 font-medium">
                    💡 Shipper giao hàng tận nơi chỉ trực thuộc Bưu cục Hub, không phân bổ vào kho SOC.
                  </p>
                )}
              </div>

              {/* Thông tin cá nhân */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Họ Và Tên *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.name}
                    onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                    placeholder="VD: Nguyễn Văn Giao..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    value={driverFormData.phone}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    placeholder="VD: 0908123456..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Biển số xe & Tuyến phụ trách */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Biển Số Xe *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.vehicleNumber}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder={driverFormData.vehicleType === 'TRUCK' ? 'VD: 51C-777.66...' : 'VD: 59-A1 123.45...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tuyến / Địa Bàn Hoạt Động</label>
                  <input
                    type="text"
                    value={driverFormData.operatingArea}
                    onChange={(e) => setDriverFormData({ ...driverFormData, operatingArea: e.target.value })}
                    placeholder={
                      driverFormData.vehicleType === 'TRUCK'
                        ? 'VD: Tuyến Bắc - Nam (Hà Nội ➔ TP.HCM)...'
                        : 'VD: Phường 13, Phường 14...'
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Tỉnh / Quận */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tỉnh/Thành Phụ Trách</label>
                  <input
                    type="text"
                    value={driverFormData.assignedProvince}
                    onChange={(e) => setDriverFormData({ ...driverFormData, assignedProvince: e.target.value })}
                    placeholder="VD: Hồ Chí Minh..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quận/Huyện Phụ Trách</label>
                  <input
                    type="text"
                    value={driverFormData.assignedDistrict}
                    onChange={(e) => setDriverFormData({ ...driverFormData, assignedDistrict: e.target.value })}
                    placeholder="VD: Quận Tân Bình..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-3xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Đang lưu...' : (editingDriver ? 'Lưu Thay Đổi' : 'Tạo Hồ Sơ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
