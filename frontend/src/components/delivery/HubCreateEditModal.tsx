import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import type { LatLngCoords } from '../buyer/address/types'
import { useVietnamAddress } from '../buyer/address/useVietnamAddress'
import { AddressLocationSelects } from '../buyer/address/AddressLocationSelects'
import { AddressMapPicker } from '../buyer/address/AddressMapPicker'
import { fetchCoordinatesByAddress } from '../../services/geocoding.service'

export interface Hub {
  id: string
  code: string
  name: string
  address: string
  province: string
  district: string
  ward?: string
  latitude?: number
  longitude?: number
  type: string
  status: string
  drivers?: any[]
  _count?: { shipments?: number; drivers?: number }
  createdAt?: string
}

interface HubCreateEditModalProps {
  isOpen: boolean
  onClose: () => void
  editingHub: Hub | null
  onSuccess: () => void
  triggerAuditLog?: (action: string) => Promise<void>
  goongApiKey?: string
}

export const HubCreateEditModal: React.FC<HubCreateEditModalProps> = ({
  isOpen,
  onClose,
  editingHub,
  onSuccess,
  triggerAuditLog,
  goongApiKey = import.meta.env.VITE_GOONG_API_KEY || ''
}) => {
  // Form fields
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('DESTINATION_HUB')
  const [detailAddress, setDetailAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Map states
  const [mapCoords, setMapCoords] = useState<LatLngCoords>({ lat: 10.762622, lng: 106.660172 })
  const [mapZoom, setMapZoom] = useState<number>(15)

  // 3-level Vietnam Administrative Selects
  const {
    provinces,
    selectedProvinceCode,
    districts,
    selectedDistrictCode,
    wards,
    selectedWardCode,
    chosenProvince,
    chosenDistrict,
    chosenWard,
    handleSelectProvince,
    handleSelectDistrict,
    handleSelectWard,
    resetSelection,
    autoMatchAddressComponents
  } = useVietnamAddress()

  // Initialize or reset when modal opens / editingHub changes
  useEffect(() => {
    if (!isOpen) return

    if (editingHub) {
      setCode(editingHub.code || '')
      setName(editingHub.name || '')
      setType(editingHub.type || 'DESTINATION_HUB')
      setDetailAddress(editingHub.address || '')

      if (editingHub.latitude && editingHub.longitude) {
        setMapCoords({ lat: Number(editingHub.latitude), lng: Number(editingHub.longitude) })
        setMapZoom(16)
      } else {
        setMapCoords({ lat: 10.762622, lng: 106.660172 })
        setMapZoom(14)
      }

      if (editingHub.province) {
        autoMatchAddressComponents(editingHub.province, editingHub.district || '', editingHub.ward || '')
      }
    } else {
      setCode(`HUB${Math.floor(100 + Math.random() * 900)}`)
      setName('')
      setType('DESTINATION_HUB')
      setDetailAddress('')
      setMapCoords({ lat: 10.762622, lng: 106.660172 })
      setMapZoom(14)
      resetSelection()
    }
  }, [isOpen, editingHub])

  // 1. Khi chọn Tỉnh/Thành -> Bay bản đồ tới Tỉnh
  const onSelectProvinceWithMapFly = async (provinceCode: number | '') => {
    handleSelectProvince(provinceCode)
    if (!provinceCode) return
    const prov = provinces.find((p) => p.code === provinceCode)
    if (prov) {
      const coords = await fetchCoordinatesByAddress(`${prov.name}, Việt Nam`, goongApiKey)
      if (coords) {
        setMapCoords(coords)
        setMapZoom(11)
      }
    }
  }

  // 2. Khi chọn Quận/Huyện -> Bay bản đồ tới Quận/Huyện
  const onSelectDistrictWithMapFly = async (districtCode: number | '') => {
    handleSelectDistrict(districtCode)
    if (!districtCode) return
    const dist = districts.find((d) => d.code === districtCode)
    if (dist) {
      const coords = await fetchCoordinatesByAddress(`${dist.name}, ${chosenProvince}, Việt Nam`, goongApiKey)
      if (coords) {
        setMapCoords(coords)
        setMapZoom(14)
      }
    }
  }

  // 3. Khi chọn Phường/Xã -> Bay bản đồ tới Phường/Xã
  const onSelectWardWithMapFly = async (wardCode: number | '') => {
    handleSelectWard(wardCode)
    if (!wardCode) return
    const ward = wards.find((w) => w.code === wardCode)
    if (ward) {
      const coords = await fetchCoordinatesByAddress(
        `${ward.name}, ${chosenDistrict}, ${chosenProvince}, Việt Nam`,
        goongApiKey
      )
      if (coords) {
        setMapCoords(coords)
        setMapZoom(16)
      }
    }
  }

  // 4. Khi chọn từ gợi ý tìm kiếm hoặc kéo thả ghim trên map
  const handleAddressMatched = (prov: string, dist: string, ward: string, fullAddress?: string) => {
    if (fullAddress && !detailAddress) {
      setDetailAddress(fullAddress)
    }
    autoMatchAddressComponents(prov, dist, ward)
    setMapZoom(16)
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      alert('Vui lòng nhập Mã Bưu Cục!')
      return
    }
    if (!name.trim()) {
      alert('Vui lòng nhập Tên Bưu Cục!')
      return
    }
    if (!chosenProvince) {
      alert('Vui lòng chọn Tỉnh / Thành Phố!')
      return
    }
    if (!chosenDistrict) {
      alert('Vui lòng chọn Quận / Huyện / Thị Xã (Đây là địa bàn nhận diện đơn hàng của Bưu cục)!')
      return
    }
    if (!detailAddress.trim()) {
      alert('Vui lòng nhập Địa chỉ cụ thể của Bưu cục!')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        province: chosenProvince,
        district: chosenDistrict,
        ward: chosenWard || undefined,
        address: detailAddress.trim(),
        latitude: mapCoords.lat,
        longitude: mapCoords.lng
      }

      const url = editingHub
        ? `${API_BASE_URL}/delivery/hubs/${editingHub.id}`
        : `${API_BASE_URL}/delivery/hubs`
      const method = editingHub ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || 'Không thể lưu thông tin bưu cục')
      }

      alert(editingHub ? 'Cập nhật bưu cục thành công!' : 'Tạo mới bưu cục thành công!')
      if (triggerAuditLog) {
        await triggerAuditLog(`${editingHub ? 'Cập nhật' : 'Tạo mới'} Bưu cục [${payload.code}] ${payload.name}`)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Đã xảy ra lỗi'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span>{editingHub ? 'Cập Nhật Thông Tin Bưu Cục' : 'Tạo Bưu Cục Vận Chuyển Mới'}</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Định vị bản đồ trực quan & thiết lập khu vực hoạt động cho bưu cục
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Basic Info: Mã & Loại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Mã Bưu Cục (Mã Code) *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: HB01, HCM_GV01..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Loại Bưu Cục *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer transition"
              >
                <option value="DESTINATION_HUB">🏢 Bưu Cục Giao Hàng (Hub)</option>
                <option value="SORTING_CENTER">🏭 Trung Tâm Khai Thác (SOC)</option>
              </select>
            </div>
          </div>

          {/* 2. Tên Bưu Cục */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tên Bưu Cục Đầy Đủ *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bưu Cục SPX Gò Vấp Hub, Tân Bình SOC, Hòa Bình Hub..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* 3. Bản Đồ Định Vị Tương Tác Leaflet (Tương tự Checkout) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>📍 Bản Đồ Định Vị Tương Tác & Tìm Kiếm Địa Điểm</span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Tọa độ: {mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
              </span>
            </label>
            <AddressMapPicker
              goongApiKey={goongApiKey}
              mapCoords={mapCoords}
              setMapCoords={setMapCoords}
              mapZoom={mapZoom}
              onAddressMatched={handleAddressMatched}
              isActiveTab={isOpen}
              mapContainerId="hub-interactive-map-selector"
              theme="emerald"
              searchPlaceholder="Tìm kiếm tên đường, địa điểm bưu cục để ghim tự động..."
            />
          </div>

          {/* 4. Dropdown 3 Cấp Hành Chính Việt Nam (Tỉnh / Quận / Phường) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Khu Vực Hành Chính Phụ Trách *
              </label>
              {chosenDistrict && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  🎯 Phụ trách đơn: {chosenDistrict}, {chosenProvince}
                </span>
              )}
            </div>
            <AddressLocationSelects
              provinces={provinces}
              selectedProvinceCode={selectedProvinceCode}
              onSelectProvince={onSelectProvinceWithMapFly}
              districts={districts}
              selectedDistrictCode={selectedDistrictCode}
              onSelectDistrict={onSelectDistrictWithMapFly}
              wards={wards}
              selectedWardCode={selectedWardCode}
              onSelectWard={onSelectWardWithMapFly}
              theme="emerald"
            />
            <p className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              💡 <span className="font-bold text-slate-700">Cơ chế định tuyến:</span> Khi chọn Tỉnh/Quận, bản đồ sẽ tự động bay tới vị trí đó. Mọi đơn hàng có kho Shop hoặc địa chỉ nhận tại <span className="font-bold text-emerald-700">{chosenDistrict || 'Quận/Huyện này'}</span> sẽ được hệ thống tự động gán về bưu cục này để điều phối lấy/giao!
            </p>
          </div>

          {/* 5. Địa Chỉ Cụ Thể (Số nhà, Đường...) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Địa Chỉ Cụ Thể (Số nhà, Tên đường...) *</label>
            <input
              type="text"
              required
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="VD: Số 123 Quang Trung, Phường 10"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Đang lưu...' : (editingHub ? 'Lưu Thay Đổi' : 'Tạo Bưu Cục')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
