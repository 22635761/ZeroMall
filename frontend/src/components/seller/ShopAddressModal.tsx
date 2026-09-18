import React, { useState, useEffect, useRef, useMemo } from 'react'
import { cleanAdminName } from '../../utils/vietnameseTones'
import type { ProvinceItem, DistrictItem, WardItem } from '../buyer/address/types'
import vietnamAddressData from '../../data/vietnam-address-tree.json'
import { fetchCoordinatesByAddress } from '../../services/geocoding.service'

export interface AddressData {
  fullName: string
  phoneNumber: string
  province: string
  district: string
  ward: string
  detailAddress: string
  coordinates?: {
    lat: number
    lng: number
  }
}

interface ShopAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (address: AddressData) => void
  initialAddress?: AddressData | null
  goongApiKey?: string
}

declare const L: any

export const ShopAddressModal: React.FC<ShopAddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAddress,
  goongApiKey = import.meta.env.VITE_GOONG_API_KEY || ''
}) => {
  // Form states
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  // Local Vietnam administrative data
  const provinces = useMemo<ProvinceItem[]>(() => {
    return (vietnamAddressData as ProvinceItem[]).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    )
  }, [])

  const [districts, setDistricts] = useState<DistrictItem[]>([])
  const [wards, setWards] = useState<WardItem[]>([])

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | ''>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | ''>('')
  const [selectedWardCode, setSelectedWardCode] = useState<number | ''>('')

  // Goong autocomplete states
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Map Modal states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({ lat: 10.762622, lng: 106.660172 })
  const [selectedMapAddress, setSelectedMapAddress] = useState('')
  const [selectedMapCompound, setSelectedMapCompound] = useState<{ province: string; district: string; ward: string; detail: string }>({ province: '', district: '', ward: '', detail: '' })
  const [mapInstance, setMapInstance] = useState<any>(null)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // Helper tìm và đồng bộ Tỉnh/Huyện/Xã từ chuỗi địa chỉ
  const autoMatchAddressComponents = (provName: string, distName: string, wardName: string, detailStr?: string) => {
    if (detailStr) setDetailAddress(detailStr)

    const cleanP = cleanAdminName(provName)
    const cleanD = cleanAdminName(distName)
    const cleanW = cleanAdminName(wardName)

    const matchedP = provinces.find(p => cleanAdminName(p.name) === cleanP)
    if (!matchedP) return
    setSelectedProvinceCode(matchedP.code)

    const sortedDistricts = [...matchedP.districts].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    setDistricts(sortedDistricts)

    const matchedD = sortedDistricts.find(d => cleanAdminName(d.name) === cleanD)
    if (!matchedD) {
      setSelectedDistrictCode('')
      setWards([])
      return
    }
    setSelectedDistrictCode(matchedD.code)

    const sortedWards = [...matchedD.wards].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    setWards(sortedWards)

    const matchedW = sortedWards.find(w => cleanAdminName(w.name) === cleanW)
    if (matchedW) {
      setSelectedWardCode(matchedW.code)
    } else {
      setSelectedWardCode('')
    }
  }

  // Điền thông tin ban đầu nếu có
  useEffect(() => {
    if (!isOpen) return
    if (initialAddress) {
      setFullName(initialAddress.fullName || '')
      setPhoneNumber(initialAddress.phoneNumber || '')
      setDetailAddress(initialAddress.detailAddress || '')
      setCoordinates(initialAddress.coordinates || null)
      if (initialAddress.province) {
        autoMatchAddressComponents(
          initialAddress.province,
          initialAddress.district || '',
          initialAddress.ward || ''
        )
      }
    } else {
      setFullName('')
      setPhoneNumber('')
      setDetailAddress('')
      setCoordinates(null)
      setSelectedProvinceCode('')
      setSelectedDistrictCode('')
      setSelectedWardCode('')
      setDistricts([])
      setWards([])
    }
  }, [isOpen, initialAddress])

  // Khi người dùng đổi Tỉnh / TP
  const handleSelectProvince = async (provCode: number | '') => {
    setSelectedProvinceCode(provCode)
    setSelectedDistrictCode('')
    setSelectedWardCode('')

    if (!provCode) {
      setDistricts([])
      setWards([])
      return
    }

    const prov = provinces.find(p => p.code === provCode)
    if (prov) {
      const sorted = [...prov.districts].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setDistricts(sorted)
      setWards([])
      const coords = await fetchCoordinatesByAddress(`${prov.name}, Việt Nam`, goongApiKey)
      if (coords) {
        setCoordinates(coords)
        setSelectedMapCoords(coords)
      }
    }
  }

  // Khi người dùng đổi Quận / Huyện
  const handleSelectDistrict = async (distCode: number | '') => {
    setSelectedDistrictCode(distCode)
    setSelectedWardCode('')

    if (!distCode) {
      setWards([])
      return
    }

    const dist = districts.find(d => d.code === distCode)
    if (dist) {
      const sorted = [...dist.wards].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setWards(sorted)
      const provName = provinces.find(p => p.code === selectedProvinceCode)?.name || ''
      const coords = await fetchCoordinatesByAddress(`${dist.name}, ${provName}, Việt Nam`, goongApiKey)
      if (coords) {
        setCoordinates(coords)
        setSelectedMapCoords(coords)
      }
    }
  }

  // Khi người dùng đổi Phường / Xã
  const handleSelectWard = async (wardCode: number | '') => {
    setSelectedWardCode(wardCode)
    if (!wardCode) return
    const ward = wards.find(w => w.code === wardCode)
    if (ward) {
      const provName = provinces.find(p => p.code === selectedProvinceCode)?.name || ''
      const distName = districts.find(d => d.code === selectedDistrictCode)?.name || ''
      const coords = await fetchCoordinatesByAddress(`${ward.name}, ${distName}, ${provName}, Việt Nam`, goongApiKey)
      if (coords) {
        setCoordinates(coords)
        setSelectedMapCoords(coords)
      }
    }
  }

  // Goong Map Autocomplete debounce
  useEffect(() => {
    if (!searchQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (data.status === 'OK' && isMounted.current) {
          setSuggestions(data.predictions || [])
        }
      } catch (err) {
        console.error('Lỗi khi gợi ý địa chỉ:', err)
      } finally {
        if (isMounted.current) setLoadingSuggestions(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery, goongApiKey])

  // Chọn một địa điểm từ ô tìm kiếm nhanh
  const handleSelectSuggestion = async (placeId: string) => {
    setLoadingSuggestions(true)
    setSuggestions([])
    setSearchQuery('')

    try {
      const res = await fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      const data = await res.json()
      if (data.status === 'OK' && data.result) {
        const result = data.result
        const compound = result.compound || {}
        
        const provStr = compound.province || ''
        const distStr = compound.district || ''
        const wardStr = compound.commune || ''
        const fullAddr = result.formatted_address || ''

        autoMatchAddressComponents(provStr, distStr, wardStr, fullAddr)

        if (result.geometry?.location) {
          setCoordinates({
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          })
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết địa điểm:', err)
    } finally {
      if (isMounted.current) setLoadingSuggestions(false)
    }
  }

  // Reverse Geocoding khi kéo marker hoặc click bản đồ
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') return

    try {
      const res = await fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`)
      const data = await res.json()
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const first = data.results[0]
        const compound = first.compound || {}
        
        setSelectedMapAddress(first.formatted_address || '')
        setSelectedMapCompound({
          province: compound.province || '',
          district: compound.district || '',
          ward: compound.commune || '',
          detail: first.formatted_address || ''
        })
      }
    } catch (err) {
      console.error('Lỗi khi định vị tọa độ:', err)
    }
  }

  // Mở modal bản đồ Leaflet
  const handleOpenMapPicker = () => {
    const initLat = coordinates?.lat || 10.762622
    const initLng = coordinates?.lng || 106.660172
    setSelectedMapCoords({ lat: initLat, lng: initLng })
    setIsMapModalOpen(true)
    reverseGeocode(initLat, initLng)
  }

  // Khởi tạo bản đồ Leaflet khi map modal mở
  useEffect(() => {
    if (!isMapModalOpen) {
      if (mapInstance) {
        mapInstance.remove()
        setMapInstance(null)
      }
      return
    }

    const timer = setTimeout(() => {
      if (typeof L === 'undefined') return

      const container = document.getElementById('shop-address-map-picker')
      if (!container) return

      const map = L.map(container, { zoomControl: false }).setView([selectedMapCoords.lat, selectedMapCoords.lng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const marker = L.marker([selectedMapCoords.lat, selectedMapCoords.lng], {
        draggable: true
      }).addTo(map)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setSelectedMapCoords({ lat: pos.lat, lng: pos.lng })
        reverseGeocode(pos.lat, pos.lng)
      })

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        marker.setLatLng([lat, lng])
        setSelectedMapCoords({ lat, lng })
        reverseGeocode(lat, lng)
      })

      setMapInstance(map)
    }, 200)

    return () => clearTimeout(timer)
  }, [isMapModalOpen])

  // Lưu khi xác nhận ghim vị trí từ bản đồ
  const handleConfirmMapLocation = () => {
    setCoordinates(selectedMapCoords)
    if (selectedMapCompound.province) {
      autoMatchAddressComponents(
        selectedMapCompound.province,
        selectedMapCompound.district,
        selectedMapCompound.ward,
        selectedMapAddress || selectedMapCompound.detail
      )
    } else if (selectedMapAddress) {
      setDetailAddress(selectedMapAddress)
    }
    setIsMapModalOpen(false)
  }

  // Kiểm tra tính hợp lệ và Submit
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Vui lòng nhập Tên người liên hệ / Người đại diện kho!')
      return
    }

    const cleanPhone = phoneNumber.replace(/[\s\(\)\-\+]/g, '')
    if (!/^\d{9,12}$/.test(cleanPhone)) {
      alert('Vui lòng nhập Số điện thoại hợp lệ (9 - 12 chữ số)!')
      return
    }

    const selectedProv = provinces.find(p => p.code === Number(selectedProvinceCode))
    const selectedDist = districts.find(d => d.code === Number(selectedDistrictCode))
    const selectedWard = wards.find(w => w.code === Number(selectedWardCode))

    if (!selectedProv) {
      alert('Vui lòng chọn Tỉnh/Thành phố!')
      return
    }
    if (!selectedDist) {
      alert('Vui lòng chọn Quận/Huyện!')
      return
    }
    if (!selectedWard) {
      alert('Vui lòng chọn Phường/Xã!')
      return
    }

    if (!detailAddress.trim()) {
      alert('Vui lòng nhập Địa chỉ chi tiết (Số nhà, tên đường...)!')
      return
    }

    onSave({
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      province: selectedProv.name,
      district: selectedDist.name,
      ward: selectedWard.name,
      detailAddress: detailAddress.trim(),
      coordinates: coordinates || undefined
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 relative text-left flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="font-extrabold text-base text-slate-800 flex items-center gap-2">
                <span>📍</span> Thêm Địa Chỉ Lấy Hàng
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Điền thông tin kho hàng để tài xế ZeroMall Express (ZMX) đến nhận kiện hàng
              </p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSaveAddress} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-left">
            
            {/* Goong Autocomplete Search Bar */}
            {goongApiKey && goongApiKey !== 'YOUR_GOONG_API_KEY_HERE' ? (
              <div className="relative space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  🔎 Tìm nhanh vị trí kho (Goong Map)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ kho hàng để gợi ý tự động..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition shadow-3xs pr-9"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3 top-2.5 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-14 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {suggestions.map((p) => (
                      <div
                        key={p.place_id}
                        onClick={() => handleSelectSuggestion(p.place_id)}
                        className="px-4 py-2.5 hover:bg-emerald-50 text-xs font-semibold text-slate-700 cursor-pointer transition text-left"
                      >
                        <span className="font-extrabold text-slate-900">{p.structured_formatting.main_text}</span>
                        {p.structured_formatting.secondary_text && (
                          <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Họ tên & Số điện thoại */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Họ & Tên Người Phụ Trách <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Số Điện Thoại Nhận Hàng <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* 3 CẤP ĐỊA CHỈ HÀNH CHÍNH (TỈNH / QUẬN / PHƯỜNG) */}
            <div className="space-y-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/80">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span>🏛️</span> Địa chỉ vùng miền (Chuẩn Hành Chính VN)
                </p>
                <span className="text-[9px] bg-emerald-100/70 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                  Bắt buộc chọn
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Tỉnh / Thành phố */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">
                    Tỉnh / Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedProvinceCode}
                    onChange={(e) => handleSelectProvince(e.target.value ? Number(e.target.value) : '')}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer text-slate-800 font-medium"
                  >
                    <option value="">-- Chọn Tỉnh / TP --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Quận / Huyện */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">
                    Quận / Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedDistrictCode}
                    onChange={(e) => handleSelectDistrict(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedProvinceCode}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedProvinceCode ? '-- Chọn Tỉnh/TP trước --' : '-- Chọn Quận / Huyện --'}
                    </option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Phường / Xã */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-600 font-bold">
                    Phường / Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedWardCode}
                    onChange={(e) => handleSelectWard(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedDistrictCode}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedDistrictCode ? '-- Chọn Quận/Huyện trước --' : '-- Chọn Phường / Xã --'}
                    </option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Địa chỉ chi tiết (Số nhà, đường...) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Địa chỉ chi tiết (Số nhà, ngõ, tên đường...) <span className="text-red-500">*</span>
              </label>
              <textarea 
                required
                rows={2}
                placeholder="Ví dụ: 123 Đường Lê Lợi, Khu phố 4..."
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 transition resize-none shadow-3xs"
              />
            </div>

            {/* GPS & Bản đồ */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-xl">📍</span>
              <div className="flex-1 text-[10px]">
                <p className="font-bold text-slate-700">Tọa độ GPS & Định vị lấy hàng</p>
                <p className="text-slate-400">
                  {coordinates 
                    ? `Tọa độ: ${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}` 
                    : 'Ghim vị trí chính xác để Shipper ZMX tìm kho nhanh hơn'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenMapPicker}
                className="px-3 py-1.5 bg-white border border-emerald-500 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-50 transition cursor-pointer shadow-3xs"
              >
                {coordinates ? 'Thay Đổi Ghim' : '🗺️ Ghim Trên Bản Đồ'}
              </button>
            </div>

            {/* Submit & Cancel buttons */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Lưu Địa Chỉ
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* --- LEAFLET INTERACTIVE MAP MODAL --- */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Map Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <span>🗺️</span> Chọn Vị Trí Ghim Kho Hàng
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kéo thả ghim đỏ hoặc click trực tiếp vào vị trí chính xác của kho trên bản đồ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Leaflet Map Canvas */}
            <div className="flex-1 relative">
              <div id="shop-address-map-picker" className="w-full h-full" />
            </div>

            {/* Selected Address Preview & Footer */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vị trí đang ghim:</p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {selectedMapAddress || 'Đang cập nhật địa chỉ...'}
                </p>
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Tọa độ: {selectedMapCoords.lat.toFixed(6)}, {selectedMapCoords.lng.toFixed(6)}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMapLocation}
                  className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác Nhận Vị Trí Này
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
