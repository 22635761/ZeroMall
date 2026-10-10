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

interface AdminHubsTabProps {
  triggerAuditLog?: (action: string) => Promise<void>
}

export const AdminHubsTab: React.FC<AdminHubsTabProps> = ({ triggerAuditLog }) => {
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

  // Open Driver Modal
  const handleOpenAddDriver = (hub: Hub, driverToEdit?: Driver) => {
    if (driverToEdit) {
      setEditingDriver(driverToEdit)
      setDriverFormData({
        name: driverToEdit.name,
        phone: driverToEdit.phone,
        vehicleNumber: driverToEdit.vehicleNumber,
        vehicleType: driverToEdit.vehicleType || 'MOTORBIKE',
        hubId: driverToEdit.hubId,
        assignedDistrict: driverToEdit.assignedDistrict || hub.district,
        assignedProvince: driverToEdit.assignedProvince || hub.province,
        operatingArea: driverToEdit.operatingArea || ''
      })
    } else {
      setEditingDriver(null)
      setDriverFormData({
        name: '',
        phone: '',
        vehicleNumber: '',
        vehicleType: 'MOTORBIKE',
        hubId: hub.id,
        assignedDistrict: hub.district,
        assignedProvince: hub.province,
        operatingArea: `${hub.district}, ${hub.province}`
      })
    }
    setIsDriverModalOpen(true)
  }

  // Handle Save Driver
  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driverFormData.name.trim() || !driverFormData.phone.trim() || !driverFormData.vehicleNumber.trim()) {
      alert('Vui lòng điền Họ tên, Số điện thoại và Biển số xe của tài xế!')
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

      alert(editingDriver ? 'Cập nhật tài xế thành công!' : 'Thêm tài xế mới thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`${editingDriver ? 'Cập nhật' : 'Thêm'} tài xế ${driverFormData.name} (${driverFormData.phone}) cho Bưu cục ${selectedHubForDrivers?.name || ''}`)
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
    if (!window.confirm(`Bạn có chắc muốn xóa tài xế "${driver.name}" (${driver.phone})?`)) {
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
        await triggerAuditLog(`Xóa tài xế ${driver.name} (${driver.phone})`)
      }
      fetchHubs()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể xóa tài xế'))
    }
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Stats Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>🚚</span> Quản Lý Mạng Lưới Bưu Cục & Tài Xế SPX
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Quản trị các Trạm Khai Thác SOC, Bưu Cục Giao Hàng Hub và phân bổ đội ngũ tài xế trên toàn quốc
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHub(null)
            setHubFormData({
              code: '',
              name: '',
              type: 'DESTINATION_HUB',
              province: '',
              district: '',
              address: ''
            })
            setIsHubModalOpen(true)
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>➕</span> Thêm Bưu Cục Mới
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Bưu Cục</div>
          <div className="text-2xl font-black text-slate-800 mt-1">{hubs.length}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Toàn quốc</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kho Tổng SOC</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{totalSocCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Trung chuyển liên tỉnh</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bưu Cục Giao Hàng Hub</div>
          <div className="text-2xl font-black text-teal-600 mt-1">{totalDeliveryHubCount}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Giao chặng cuối (Last-mile)</div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Tài Xế (Shipper)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalDriversCount}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Đang trực tuyến</div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bưu cục, mã code, tỉnh thành, quận huyện..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Tỉnh/Thành:</span>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
          >
            <option value="ALL">Tất cả tỉnh thành ({existingProvinces.length})</option>
            {existingProvinces.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Bảng Danh Sách Bưu Cục */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Mã & Tên Bưu Cục</th>
                <th className="py-3.5 px-4">Phân Loại Trạm</th>
                <th className="py-3.5 px-4">Địa Chỉ Trụ Sở</th>
                <th className="py-3.5 px-4 text-center">Tài Xế (Shipper)</th>
                <th className="py-3.5 px-4 text-center">Vận Đơn Qua Trạm</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Đang tải danh sách bưu cục...
                  </td>
                </tr>
              ) : filteredHubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy bưu cục nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredHubs.map((hub) => {
                  const driverList = hub.drivers || []
                  const driverCount = driverList.length || hub._count?.drivers || 0
                  const isSoc = hub.type === 'SORTING_CENTER'

                  return (
                    <tr key={hub.id} className="hover:bg-slate-50/60 transition group">
                      {/* Mã & Tên Bưu Cục */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <span>{isSoc ? '🏢' : '🏬'}</span>
                          <span>{hub.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">
                          Mã Trạm: {hub.code}
                        </div>
                      </td>

                      {/* Phân Loại Trạm */}
                      <td className="py-3.5 px-4">
                        {isSoc ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md font-bold text-[10px]">
                            🏢 Kho Khai Thác Tổng (SOC)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/80 rounded-md font-bold text-[10px]">
                            🏬 Bưu Cục Giao Hàng (Hub)
                          </span>
                        )}
                      </td>

                      {/* Địa Chỉ */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-1">{hub.address}</div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          📍 {hub.district ? `${hub.district}, ` : ''}{hub.province}
                        </div>
                      </td>

                      {/* Tài Xế Trực Thuộc */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedHubForDrivers(hub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs transition cursor-pointer"
                        >
                          <span>🛵</span> {driverCount} Tài xế
                        </button>
                      </td>

                      {/* Số Vận Đơn */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {hub._count?.shipments ?? 0} đơn
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedHubForDrivers(hub)
                            handleOpenAddDriver(hub)
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition cursor-pointer border border-emerald-200"
                          title="Tuyển / Thêm tài xế mới cho bưu cục này"
                        >
                          ➕ Thêm Shipper
                        </button>

                        <button
                          onClick={() => {
                            setEditingHub(hub)
                            setHubFormData({
                              code: hub.code,
                              name: hub.name,
                              type: hub.type,
                              province: hub.province,
                              district: hub.district,
                              address: hub.address
                            })
                            setIsHubModalOpen(true)
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          ✏️ Sửa
                        </button>

                        <button
                          onClick={() => handleDeleteHub(hub)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition cursor-pointer border border-rose-200"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: TẠO / SỬA BƯU CỤC */}
      {isHubModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>🏬</span> {editingHub ? 'Chỉnh Sửa Bưu Cục' : 'Tạo Bưu Cục Mới'}
              </h3>
              <button
                onClick={() => setIsHubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHub} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mã Bưu Cục (Code) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingHub}
                    value={hubFormData.code}
                    onChange={(e) => setHubFormData({ ...hubFormData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: HB01, HP01, DN02"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phân Loại Trạm <span className="text-rose-500">*</span>:
                  </label>
                  <select
                    value={hubFormData.type}
                    onChange={(e) => setHubFormData({ ...hubFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="DESTINATION_HUB">Bưu Cục Giao Hàng Hub (Chặng cuối)</option>
                    <option value="SORTING_CENTER">Kho Tổng Khai Thác SOC (Trung chuyển)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tên Bưu Cục <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={hubFormData.name}
                  onChange={(e) => setHubFormData({ ...hubFormData, name: e.target.value })}
                  placeholder="VD: Bưu Cục SPX Hòa Bình Hub, Kho Tổng Củ Chi SOC..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tỉnh / Thành Phố <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.province}
                    onChange={(e) => setHubFormData({ ...hubFormData, province: e.target.value })}
                    placeholder="VD: Tỉnh Hoà Bình, Hà Nội, TP.HCM..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quận / Huyện <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={hubFormData.district}
                    onChange={(e) => setHubFormData({ ...hubFormData, district: e.target.value })}
                    placeholder="VD: Thành phố Hòa Bình, Quận Tân Bình..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Địa Chỉ Trụ Sở Cụ Thể <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={hubFormData.address}
                  onChange={(e) => setHubFormData({ ...hubFormData, address: e.target.value })}
                  placeholder="VD: 123 Trần Hưng Đạo, Phường Phương Lâm"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsHubModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : (editingHub ? 'Lưu Thay Đổi' : 'Tạo Bưu Cục')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: XEM & QUẢN LÝ TÀI XẾ CỦA BƯU CỤC */}
      {selectedHubForDrivers && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <div className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                  Mã Trạm: {selectedHubForDrivers.code}
                </div>
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2 mt-0.5">
                  <span>🛵</span> Đội Ngũ Tài Xế (Shipper) - {selectedHubForDrivers.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  📍 {selectedHubForDrivers.address}, {selectedHubForDrivers.district}, {selectedHubForDrivers.province}
                </p>
              </div>
              <button
                onClick={() => setSelectedHubForDrivers(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-700">
                Tổng số: <b className="text-emerald-700">{(selectedHubForDrivers.drivers || []).length} tài xế</b>
              </div>
              <button
                onClick={() => handleOpenAddDriver(selectedHubForDrivers)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>➕</span> Thêm Tài Xế Cho Bưu Cục Này
              </button>
            </div>

            {/* Drivers Table */}
            <div className="overflow-y-auto flex-1 border border-slate-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                  <tr className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5">Họ & Tên Tài Xế</th>
                    <th className="py-3 px-3.5">Phương Tiện & Biển Số</th>
                    <th className="py-3 px-3.5">Tuyến Hoạt Động</th>
                    <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                    <th className="py-3 px-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedHubForDrivers.drivers || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        Bưu cục này hiện chưa có tài xế nào. Bấm nút <b>"Thêm Tài Xế"</b> ở trên để tuyển tài xế đầu tiên!
                      </td>
                    </tr>
                  ) : (
                    (selectedHubForDrivers.drivers || []).map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3.5">
                          <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{d.vehicleType === 'TRUCK' ? '🚛' : d.vehicleType === 'VAN' ? '🚐' : '🛵'}</span>
                            <span>{d.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            📞 {d.phone}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-800 font-mono">{d.vehicleNumber}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">
                            {d.vehicleType === 'TRUCK' ? 'Xe tải đường dài' : d.vehicleType === 'VAN' ? 'Xe Van/Bán tải' : 'Xe máy nội đô'}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <div className="text-slate-700 font-medium line-clamp-1">{d.operatingArea || 'Toàn quận/huyện'}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {d.assignedDistrict || selectedHubForDrivers.district}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            d.status === 'AVAILABLE' || d.status === 'ONLINE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : d.status === 'BUSY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {d.status === 'AVAILABLE' || d.status === 'ONLINE' ? '🟢 Sẵn Sàng Nhận Đơn' : d.status === 'BUSY' ? '🟡 Đang Đi Giao' : '⚪ Nghỉ Ca (Offline)'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenAddDriver(selectedHubForDrivers, d)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(d)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition cursor-pointer border border-rose-200"
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedHubForDrivers(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: THÊM / SỬA TÀI XẾ (DRIVER MODAL) */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <span>🛵</span> {editingDriver ? 'Cập Nhật Tài Xế' : 'Thêm Tài Xế Mới'}
              </h3>
              <button
                onClick={() => setIsDriverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriver} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bưu Cục Trực Thuộc:
                </label>
                <select
                  value={driverFormData.hubId}
                  onChange={(e) => {
                    const foundHub = hubs.find(h => h.id === e.target.value)
                    setDriverFormData({
                      ...driverFormData,
                      hubId: e.target.value,
                      assignedDistrict: foundHub?.district || '',
                      assignedProvince: foundHub?.province || ''
                    })
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  {hubs.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.code}) - {h.province}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ Và Tên Tài Xế <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={driverFormData.name}
                  onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                  placeholder="VD: Bùi Văn Hòa, Nguyễn Văn Giao..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số Điện Thoại <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="tel"
                    required
                    value={driverFormData.phone}
                    onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                    placeholder="VD: 0988123456"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Biển Số Xe <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={driverFormData.vehicleNumber}
                    onChange={(e) => setDriverFormData({ ...driverFormData, vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="VD: 28-A1 999.88"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Loại Phương Tiện:
                </label>
                <select
                  value={driverFormData.vehicleType}
                  onChange={(e) => setDriverFormData({ ...driverFormData, vehicleType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                >
                  <option value="MOTORBIKE">🛵 Xe máy (Lấy & Giao nội thành)</option>
                  <option value="VAN">🚐 Xe Van / Bán tải (Hàng cồng kềnh / Shop lớn)</option>
                  <option value="TRUCK">🚛 Xe tải đường dài (Trung chuyển Linehaul)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tuyến Giao Nhận Phụ Trách (Operating Area):
                </label>
                <input
                  type="text"
                  value={driverFormData.operatingArea}
                  onChange={(e) => setDriverFormData({ ...driverFormData, operatingArea: e.target.value })}
                  placeholder="VD: Phường Phương Lâm, Phường Tân Thịnh..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsDriverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : (editingDriver ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
