import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'

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
}

export const LogisticsHubsFleetTab: React.FC<LogisticsHubsFleetTabProps> = ({ triggerAuditLog }) => {
  const [hubs, setHubs] = useState<Hub[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('ALL')

  // Modals state
  const [isHubModalOpen, setIsHubModalOpen] = useState(false)
  const [editingHub, setEditingHub] = useState<Hub | null>(null)
  const [hubFormData, setHubFormData] = useState({
    code: '',
    name: '',
    type: 'DESTINATION_HUB',
    province: '',
    district: '',
    address: ''
  })

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

  const fetchHubs = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/delivery/hubs`)
      if (res.ok) {
        const data = await res.json()
        setHubs(Array.isArray(data) ? data : [])
        // If a hub is currently selected for viewing drivers, update it
        if (selectedHubForDrivers) {
          const updated = data.find((h: Hub) => h.id === selectedHubForDrivers.id)
          if (updated) setSelectedHubForDrivers(updated)
        }
      }
    } catch (err) {
      console.error('Error fetching hubs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHubs()
  }, [])

  // List of unique provinces from existing hubs for quick filter
  const existingProvinces = Array.from(new Set(hubs.map(h => h.province).filter(Boolean)))

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

    return matchesSearch && matchesProvince
  })

  // Total drivers across all hubs
  const totalDriversCount = hubs.reduce((acc, h) => acc + (h.drivers?.length || h._count?.drivers || 0), 0)
  const totalSocCount = hubs.filter(h => h.type === 'SORTING_CENTER').length
  const totalDeliveryHubCount = hubs.filter(h => h.type !== 'SORTING_CENTER').length

  // Handle Hub Form Submit
  const handleSaveHub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hubFormData.code.trim() || !hubFormData.name.trim() || !hubFormData.province.trim() || !hubFormData.address.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc của Bưu cục!')
      return
    }

    setSubmitting(true)
    try {
      const url = editingHub 
        ? `${API_BASE_URL}/delivery/hubs/${editingHub.id}` 
        : `${API_BASE_URL}/delivery/hubs`
      const method = editingHub ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubFormData)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Không thể lưu bưu cục')
      }

      alert(editingHub ? 'Cập nhật bưu cục thành công!' : 'Tạo mới bưu cục thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`${editingHub ? 'Cập nhật' : 'Tạo mới'} Bưu cục [${hubFormData.code}] ${hubFormData.name}`)
      }
      setIsHubModalOpen(false)
      setEditingHub(null)
      fetchHubs()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Đã xảy ra lỗi'))
    } finally {
      setSubmitting(false)
    }
  }

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
      fetchHubs()
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

      alert(editingDriver ? 'Cập nhật thông tin tài xế thành công!' : 'Thêm tài xế vào bưu cục thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`${editingDriver ? 'Cập nhật' : 'Thêm mới'} Tài xế ${driverFormData.name} (${driverFormData.phone})`)
      }
      setIsDriverModalOpen(false)
      setEditingDriver(null)
      fetchHubs()
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
      fetchHubs()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa tài xế'))
    }
  }

  const openAddHubModal = () => {
    setEditingHub(null)
    setHubFormData({
      code: `HUB${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type: 'DESTINATION_HUB',
      province: '',
      district: '',
      address: ''
    })
    setIsHubModalOpen(true)
  }

  const openEditHubModal = (hub: Hub) => {
    setEditingHub(hub)
    setHubFormData({
      code: hub.code,
      name: hub.name,
      type: hub.type,
      province: hub.province,
      district: hub.district || '',
      address: hub.address
    })
    setIsHubModalOpen(true)
  }

  const openAddDriverModal = (hub?: Hub) => {
    const targetHubId = hub?.id || (hubs[0]?.id || '')
    setEditingDriver(null)
    setDriverFormData({
      name: '',
      phone: '',
      vehicleNumber: '',
      vehicleType: 'MOTORBIKE',
      hubId: targetHubId,
      assignedDistrict: hub?.district || '',
      assignedProvince: hub?.province || '',
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
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl text-emerald-600 shrink-0">
            🏢
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Mạng Lưới Hub</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{hubs.length} Bưu Cục</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Trải dài trên toàn quốc</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-2xl text-sky-600 shrink-0">
            🏭
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kho Trung Chuyển (SOC)</div>
            <div className="text-2xl font-black text-sky-900 mt-0.5">{totalSocCount} Trạm SOC</div>
            <div className="text-[10px] text-sky-600 font-semibold mt-0.5">Phân loại liên tỉnh & xe tải</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl text-indigo-600 shrink-0">
            🛵
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bưu Cục Giao Hàng (Hub)</div>
            <div className="text-2xl font-black text-indigo-900 mt-0.5">{totalDeliveryHubCount} Bưu Cục</div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">Tiếp nhận & giao tận tay khách</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl text-amber-600 shrink-0">
            👮‍♂️
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đội Xe & Tài Xế</div>
            <div className="text-2xl font-black text-amber-900 mt-0.5">{totalDriversCount} Shipper</div>
            <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Sẵn sàng nhận cuốc trên App</div>
          </div>
        </div>
      </div>

      {/* Main Operations Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-3xs overflow-hidden">
        {/* Header Action Bar */}
        <div className="p-5 border-b border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>🚚</span> Quản Lý Hệ Thống Bưu Cục & Mạng Lưới Tài Xế SPX Express
            </h2>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Thiết lập hạ tầng trung chuyển, tạo trạm giao nhận và quản lý đội ngũ shipper toàn sàn TMĐT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => openAddDriverModal()}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer flex items-center gap-2"
            >
              <span>🛵</span> Thêm Tài Xế Mới
            </button>
            <button
              onClick={openAddHubModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-3xs transition cursor-pointer flex items-center gap-2"
            >
              <span>➕</span> Thêm Bưu Cục Mới
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 bg-white">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Tìm kiếm bưu cục theo Tên, Mã trạm, Tỉnh/Thành, Quận/Huyện, Địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Tỉnh/Thành:</span>
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer w-full sm:w-auto"
            >
              <option value="ALL">Tất cả ({existingProvinces.length} tỉnh/thành)</option>
              {existingProvinces.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hubs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Bưu Cục</th>
                <th className="py-3 px-4">Tên Bưu Cục & Trạm</th>
                <th className="py-3 px-4">Loại Trạm</th>
                <th className="py-3 px-4">Địa Chỉ & Khu Vực</th>
                <th className="py-3 px-4 text-center">Đội Tài Xế</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Đang tải danh sách bưu cục từ cơ sở dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredHubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy bưu cục nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredHubs.map((hub) => {
                  const driverCount = hub.drivers?.length || hub._count?.drivers || 0
                  const isSOC = hub.type === 'SORTING_CENTER'
                  return (
                    <tr key={hub.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                          {hub.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{hub.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">ID: {hub.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSOC ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-sky-50 text-sky-700 border border-sky-200">
                            <span>🏭</span> TRUNG CHUYỂN SOC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span>🏢</span> BƯU CỤC GIAO HÀNG
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate" title={hub.address}>
                          {hub.address}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {hub.district ? `${hub.district}, ` : ''}{hub.province}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHubForDrivers(hub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <span>🛵</span>
                          <span>{driverCount} Tài Xế</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          HOẠT ĐỘNG
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openAddDriverModal(hub)}
                            title="Thêm Shipper trực thuộc bưu cục này"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                          >
                            ➕ Thêm Tài Xế
                          </button>
                          <button
                            onClick={() => openEditHubModal(hub)}
                            title="Chỉnh sửa thông tin bưu cục"
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition cursor-pointer text-xs font-semibold"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteHub(hub)}
                            title="Xóa bưu cục"
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
      </div>

      {/* Driver List Drawer / Modal (Khi bấm xem tài xế của một bưu cục) */}
      {selectedHubForDrivers && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl text-amber-700">
                  🛵
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Đội Ngũ Tài Xế Trực Thuộc Bưu Cục: <span className="text-emerald-700">{selectedHubForDrivers.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mã trạm: {selectedHubForDrivers.code} • Địa bàn: {selectedHubForDrivers.province}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddDriverModal(selectedHubForDrivers)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <span>➕</span> Thêm Tài Xế Mới
                </button>
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
              {(!selectedHubForDrivers.drivers || selectedHubForDrivers.drivers.length === 0) ? (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <span className="text-4xl">🛵</span>
                  <p className="text-xs font-semibold">Chưa có tài xế nào trực thuộc bưu cục này.</p>
                  <button
                    onClick={() => openAddDriverModal(selectedHubForDrivers)}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-3xs cursor-pointer hover:bg-emerald-700 transition"
                  >
                    + Tuyển / Thêm Tài Xế Ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedHubForDrivers.drivers.map((driver) => (
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
                          🚗 Biển số: <span className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{driver.vehicleNumber}</span> ({driver.vehicleType})
                        </p>
                        {driver.assignedDistrict && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            📍 Tuyến phụ trách: {driver.assignedDistrict}, {driver.assignedProvince}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditDriverModal(driver)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer text-xs font-bold"
                          title="Sửa thông tin tài xế"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteDriver(driver)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-bold"
                          title="Xóa tài xế"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
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

      {/* MODAL 1: Thêm / Sửa Bưu Cục */}
      {isHubModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🏢</span> {editingHub ? 'Cập Nhật Thông Tin Bưu Cục' : 'Tạo Bưu Cục Vận Chuyển Mới'}
              </h3>
              <button
                onClick={() => setIsHubModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mã Bưu Cục (Mã Code) *</label>
                  <input
                    type="text"
                    required
                    value={hubFormData.code}
                    onChange={(e) => setHubFormData({ ...hubFormData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: HB01, HCM01..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Loại Bưu Cục *</label>
                  <select
                    value={hubFormData.type}
                    onChange={(e) => setHubFormData({ ...hubFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition"
                  >
                    <option value="DESTINATION_HUB">🏢 Bưu Cục Giao Hàng (Hub)</option>
                    <option value="SORTING_CENTER">🏭 Trung Tâm Khai Thác (SOC)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tên Bưu Cục Đầy Đủ *</label>
                <input
                  type="text"
                  required
                  value={hubFormData.name}
                  onChange={(e) => setHubFormData({ ...hubFormData, name: e.target.value })}
                  placeholder="VD: Bưu Cục SPX Hòa Bình Hub, Tân Bình SOC..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tỉnh / Thành Phố *</label>
                  <input
                    type="text"
                    required
                    value={hubFormData.province}
                    onChange={(e) => setHubFormData({ ...hubFormData, province: e.target.value })}
                    placeholder="VD: Hòa Bình, TP. Hồ Chí Minh..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quận / Huyện / Thị Xã</label>
                  <input
                    type="text"
                    value={hubFormData.district}
                    onChange={(e) => setHubFormData({ ...hubFormData, district: e.target.value })}
                    placeholder="VD: TP. Hòa Bình, Tân Bình..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Địa Chỉ Cụ Thể (Số nhà, Đường, Phường/Xã) *</label>
                <input
                  type="text"
                  required
                  value={hubFormData.address}
                  onChange={(e) => setHubFormData({ ...hubFormData, address: e.target.value })}
                  placeholder="VD: Số 123 Đường Cù Chính Lan, Phường Đồng Tiến, TP. Hòa Bình"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsHubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-3xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Đang lưu...' : (editingHub ? 'Lưu Thay Đổi' : 'Tạo Bưu Cục')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Thêm / Sửa Tài Xế */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🛵</span> {editingDriver ? 'Cập Nhật Hồ Sơ Tài Xế' : 'Thêm Tài Xế / Shipper Mới'}
              </h3>
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Trực Thuộc Bưu Cục *</label>
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
                  <option value="">-- Chọn Bưu Cục --</option>
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>
                      [{h.code}] {h.name} - ({h.province})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Họ Và Tên Tài Xế *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.name}
                    onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                    placeholder="VD: Bùi Văn Hòa, Nguyễn Văn A..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Số Điện Thoại Liên Hệ *</label>
                  <input
                    type="tel"
                    required
                    value={driverFormData.phone}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    placeholder="VD: 0981234567..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Biển Số Xe *</label>
                  <input
                    type="text"
                    required
                    value={driverFormData.vehicleNumber}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="VD: 28A-888.88, 59X1-12345..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Loại Phương Tiện *</label>
                  <select
                    value={driverFormData.vehicleType}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition"
                  >
                    <option value="MOTORBIKE">🛵 Xe Máy Giao Hàng</option>
                    <option value="VAN">🚐 Xe Bán Tải / Van</option>
                    <option value="TRUCK">🚚 Xe Tải Trung Chuyển</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tỉnh Phụ Trách</label>
                  <input
                    type="text"
                    value={driverFormData.assignedProvince}
                    onChange={(e) => setDriverFormData({ ...driverFormData, assignedProvince: e.target.value })}
                    placeholder="VD: Hòa Bình..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Quận/Huyện Phụ Trách</label>
                  <input
                    type="text"
                    value={driverFormData.assignedDistrict}
                    onChange={(e) => setDriverFormData({ ...driverFormData, assignedDistrict: e.target.value })}
                    placeholder="VD: TP. Hòa Bình..."
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
                  {submitting ? 'Đang lưu...' : (editingDriver ? 'Lưu Thay Đổi' : 'Tạo Tài Xế')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
