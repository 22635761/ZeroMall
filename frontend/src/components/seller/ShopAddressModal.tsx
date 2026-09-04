import React, { useState, useEffect, useRef } from 'react'
import { cleanAdminName } from '../../utils/vietnameseTones'

interface GHNProvince {
  ProvinceID: number
  ProvinceName: string
  Code?: string
  NameExtension?: string[]
}

interface GHNDistrict {
  DistrictID: number
  ProvinceID: number
  DistrictName: string
  Code?: string
  NameExtension?: string[]
}

interface GHNWard {
  WardCode: string
  DistrictID: number
  WardName: string
  NameExtension?: string[]
}

export interface AddressData {
  fullName: string
  phoneNumber: string
  province: string
  district: string
  ward: string
  detailAddress: string
  ghnProvinceId?: number
  ghnDistrictId?: number
  ghnWardCode?: string
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
  const ghnToken = import.meta.env.VITE_GHN_TOKEN || '8ce5ea5c-29bd-11f1-85f0-528b13e85476'

  // Form states
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [detailAddress, setDetailAddress] = useState('')
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  // GHN Administrative lists & selected IDs
  const [provinces, setProvinces] = useState<GHNProvince[]>([])
  const [districts, setDistricts] = useState<GHNDistrict[]>([])
  const [wards, setWards] = useState<GHNWard[]>([])

  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('')
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('')
  const [selectedWardCode, setSelectedWardCode] = useState<string>('')

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  // Goong autocomplete states
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Map Modal states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([])
  const [mapSearchLoading, setMapSearchLoading] = useState(false)
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({ lat: 10.762622, lng: 106.660172 })
  const [selectedMapAddress, setSelectedMapAddress] = useState('')
  const [selectedMapCompound, setSelectedMapCompound] = useState<{ province: string; district: string; ward: string; detail: string }>({ province: '', district: '', ward: '', detail: '' })
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)

  const isMounted = useRef(true)
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  // 1. Tải danh sách 63 Tỉnh/Thành phố từ GHN Master Data khi mở modal
  useEffect(() => {
    if (!isOpen) return

    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const res = await fetch('https://online-gateway.ghn.vn/shiip/public-api/master-data/province', {
          headers: { 'Token': ghnToken }
        })
        const json = await res.json()
        if (json.code === 200 && Array.isArray(json.data)) {
          // Sắp xếp tiếng Việt theo thứ tự bảng chữ cái
          const sorted = [...json.data].sort((a: GHNProvince, b: GHNProvince) => 
            a.ProvinceName.localeCompare(b.ProvinceName, 'vi')
          )
          if (isMounted.current) setProvinces(sorted)
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách Tỉnh/Thành phố từ GHN:', err)
      } finally {
        if (isMounted.current) setLoadingProvinces(false)
      }
    }

    fetchProvinces()
  }, [isOpen, ghnToken])

  // 2. Điền thông tin ban đầu nếu có (khi edit hoặc mở lại)
  useEffect(() => {
    if (!isOpen) return
    if (initialAddress) {
      setFullName(initialAddress.fullName || '')
      setPhoneNumber(initialAddress.phoneNumber || '')
      setDetailAddress(initialAddress.detailAddress || '')
      setCoordinates(initialAddress.coordinates || null)
      if (initialAddress.ghnProvinceId) {
        setSelectedProvinceId(initialAddress.ghnProvinceId)
      }
    } else {
      setFullName('')
      setPhoneNumber('')
      setDetailAddress('')
      setCoordinates(null)
      setSelectedProvinceId('')
      setSelectedDistrictId('')
      setSelectedWardCode('')
    }
  }, [isOpen, initialAddress])

  // 3. Khi Tỉnh/Thành phố thay đổi -> Tải danh sách Quận/Huyện của Tỉnh đó
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([])
      setSelectedDistrictId('')
      setWards([])
      setSelectedWardCode('')
      return
    }

    const fetchDistricts = async () => {
      setLoadingDistricts(true)
      try {
        const res = await fetch('https://online-gateway.ghn.vn/shiip/public-api/master-data/district', {
          method: 'POST',
          headers: { 
            'Token': ghnToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ province_id: Number(selectedProvinceId) })
        })
        const json = await res.json()
        if (json.code === 200 && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: GHNDistrict, b: GHNDistrict) => 
            a.DistrictName.localeCompare(b.DistrictName, 'vi')
          )
          if (isMounted.current) {
            setDistricts(sorted)
            // Nếu initialAddress có district khớp, tự động chọn
            if (initialAddress?.ghnDistrictId) {
              const matched = sorted.find(d => d.DistrictID === initialAddress.ghnDistrictId)
              if (matched) setSelectedDistrictId(matched.DistrictID)
            } else if (initialAddress?.district) {
              const cleanInitDist = cleanAdminName(initialAddress.district)
              const matched = sorted.find(d => cleanAdminName(d.DistrictName) === cleanInitDist)
              if (matched) setSelectedDistrictId(matched.DistrictID)
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách Quận/Huyện từ GHN:', err)
      } finally {
        if (isMounted.current) setLoadingDistricts(false)
      }
    }

    fetchDistricts()
  }, [selectedProvinceId, ghnToken])

  // 4. Khi Quận/Huyện thay đổi -> Tải danh sách Phường/Xã của Quận đó
  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([])
      setSelectedWardCode('')
      return
    }

    const fetchWards = async () => {
      setLoadingWards(true)
      try {
        const res = await fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${selectedDistrictId}`, {
          method: 'POST',
          headers: { 
            'Token': ghnToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ district_id: Number(selectedDistrictId) })
        })
        const json = await res.json()
        if (json.code === 200 && Array.isArray(json.data)) {
          const sorted = [...json.data].sort((a: GHNWard, b: GHNWard) => 
            a.WardName.localeCompare(b.WardName, 'vi')
          )
          if (isMounted.current) {
            setWards(sorted)
            if (initialAddress?.ghnWardCode) {
              const matched = sorted.find(w => w.WardCode === initialAddress.ghnWardCode)
              if (matched) setSelectedWardCode(matched.WardCode)
            } else if (initialAddress?.ward) {
              const cleanInitWard = cleanAdminName(initialAddress.ward)
              const matched = sorted.find(w => cleanAdminName(w.WardName) === cleanInitWard)
              if (matched) setSelectedWardCode(matched.WardCode)
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách Phường/Xã từ GHN:', err)
      } finally {
        if (isMounted.current) setLoadingWards(false)
      }
    }

    fetchWards()
  }, [selectedDistrictId, ghnToken])

  // Helper tìm và đồng bộ Tỉnh/Huyện/Xã từ chuỗi địa chỉ (Goong Map / Reverse Geocode)
  const autoMatchAddressComponents = async (provName: string, distName: string, wardName: string, detailStr?: string) => {
    if (detailStr) setDetailAddress(detailStr)

    const cleanP = cleanAdminName(provName)
    const cleanD = cleanAdminName(distName)
    const cleanW = cleanAdminName(wardName)

    // 1. Tìm Tỉnh trong danh sách provinces
    const matchedP = provinces.find(p => {
      if (cleanAdminName(p.ProvinceName) === cleanP) return true
      return p.NameExtension?.some(ext => cleanAdminName(ext) === cleanP)
    })

    if (!matchedP) return
    setSelectedProvinceId(matchedP.ProvinceID)

    // 2. Tải danh sách Quận của Tỉnh này
    try {
      const distRes = await fetch('https://online-gateway.ghn.vn/shiip/public-api/master-data/district', {
        method: 'POST',
        headers: { 'Token': ghnToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ province_id: matchedP.ProvinceID })
      })
      const distJson = await distRes.json()
      if (distJson.code === 200 && Array.isArray(distJson.data)) {
        setDistricts(distJson.data)
        const matchedD = distJson.data.find((d: GHNDistrict) => {
          if (cleanAdminName(d.DistrictName) === cleanD) return true
          return d.NameExtension?.some((ext: string) => cleanAdminName(ext) === cleanD)
        })

        if (!matchedD) return
        setSelectedDistrictId(matchedD.DistrictID)

        // 3. Tải danh sách Phường/Xã của Quận này
        const wardRes = await fetch(`https://online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${matchedD.DistrictID}`, {
          method: 'POST',
          headers: { 'Token': ghnToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ district_id: matchedD.DistrictID })
        })
        const wardJson = await wardRes.json()
        if (wardJson.code === 200 && Array.isArray(wardJson.data)) {
          setWards(wardJson.data)
          const matchedW = wardJson.data.find((w: GHNWard) => {
            if (cleanAdminName(w.WardName) === cleanW) return true
            return w.NameExtension?.some((ext: string) => cleanAdminName(ext) === cleanW)
          })

          if (matchedW) {
            setSelectedWardCode(matchedW.WardCode)
          }
        }
      }
    } catch (e) {
      console.error('Lỗi khi tự động so khớp địa chỉ GHN:', e)
    }
  }

  // Goong Map Autocomplete debounce
  useEffect(() => {
    if (!searchQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      setLoadingSuggestions(true)
      fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'OK' && data.predictions) {
            setSuggestions(data.predictions)
          } else {
            setSuggestions([])
          }
        })
        .catch((err) => {
          console.error('Error Goong autocomplete:', err)
          setSuggestions([])
        })
        .finally(() => setLoadingSuggestions(false))
    }, 350)

    return () => clearTimeout(timer)
  }, [searchQuery, goongApiKey])

  const handleSelectSuggestion = async (placeId: string) => {
    if (!goongApiKey) return
    setLoadingSuggestions(true)
    try {
      const res = await fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      const data = await res.json()
      if (data.status === 'OK' && data.result) {
        const result = data.result
        const compound = result.compound || {}
        
        if (result.geometry?.location) {
          setCoordinates({
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          })
        }

        await autoMatchAddressComponents(
          compound.province || '',
          compound.district || '',
          compound.commune || '',
          result.formatted_address || ''
        )

        setSuggestions([])
        setSearchQuery('')
      }
    } catch (err) {
      console.error('Error fetching Goong place details:', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  // Reverse Geocoding
  const reverseGeocode = (lat: number, lng: number) => {
    if (!goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setSelectedMapAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      return
    }

    fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const first = data.results[0]
          setSelectedMapAddress(first.formatted_address || '')
          const compound = first.compound || {}
          setSelectedMapCompound({
            province: compound.province || '',
            district: compound.district || '',
            ward: compound.commune || '',
            detail: first.formatted_address || ''
          })
        }
      })
      .catch((e) => console.error(e))
  }

  // Leaflet Map Modal Initializer
  useEffect(() => {
    if (!isMapModalOpen) {
      setMapInstance(null)
      setMapMarker(null)
      return
    }

    const timer = setTimeout(() => {
      if (typeof L === 'undefined') return
      const container = document.getElementById('leaflet-shop-address-map')
      if (!container) return

      const initCoords = coordinates || { lat: 10.762622, lng: 106.660172 }
      setSelectedMapCoords(initCoords)

      const map = L.map('leaflet-shop-address-map', { zoomControl: false }).setView([initCoords.lat, initCoords.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const marker = L.marker([initCoords.lat, initCoords.lng], { draggable: true }).addTo(map)
      setMapInstance(map)
      setMapMarker(marker)

      reverseGeocode(initCoords.lat, initCoords.lng)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setSelectedMapCoords({ lat: pos.lat, lng: pos.lng })
        reverseGeocode(pos.lat, pos.lng)
      })

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        setSelectedMapCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
        reverseGeocode(e.latlng.lat, e.latlng.lng)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [isMapModalOpen])

  const handleConfirmMapSelection = async () => {
    setCoordinates(selectedMapCoords)
    if (selectedMapCompound.province) {
      await autoMatchAddressComponents(
        selectedMapCompound.province,
        selectedMapCompound.district,
        selectedMapCompound.ward,
        selectedMapCompound.detail
      )
    } else if (selectedMapAddress) {
      setDetailAddress(selectedMapAddress)
    }
    setIsMapModalOpen(false)
  }

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Vui lòng nhập Họ & Tên người liên hệ kho!')
      return
    }

    const cleanPhone = phoneNumber.replace(/[\s\(\)\-\+]/g, '')
    if (!/^(0|\+?84)\d{9,10}$/.test(cleanPhone)) {
      alert('Vui lòng nhập Số điện thoại hợp lệ (10 số)!')
      return
    }

    if (!selectedProvinceId) {
      alert('Vui lòng chọn Tỉnh/Thành phố từ danh sách!')
      return
    }

    if (!selectedDistrictId) {
      alert('Vui lòng chọn Quận/Huyện từ danh sách!')
      return
    }

    if (!selectedWardCode) {
      alert('Vui lòng chọn Phường/Xã từ danh sách!')
      return
    }

    if (!detailAddress.trim()) {
      alert('Vui lòng nhập Địa chỉ chi tiết (Số nhà, tên đường...)!')
      return
    }

    const selectedProv = provinces.find(p => p.ProvinceID === Number(selectedProvinceId))
    const selectedDist = districts.find(d => d.DistrictID === Number(selectedDistrictId))
    const selectedWard = wards.find(w => w.WardCode === selectedWardCode)

    onSave({
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      province: selectedProv ? selectedProv.ProvinceName : '',
      district: selectedDist ? selectedDist.DistrictName : '',
      ward: selectedWard ? selectedWard.WardName : '',
      detailAddress: detailAddress.trim(),
      ghnProvinceId: selectedProv ? selectedProv.ProvinceID : undefined,
      ghnDistrictId: selectedDist ? selectedDist.DistrictID : undefined,
      ghnWardCode: selectedWardCode || undefined,
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
              <p className="text-[11px] text-slate-400 mt-0.5">Địa chỉ bưu tá ZMX sẽ đến nhận hàng từ Shop</p>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200/60 transition text-slate-400 hover:text-slate-700 cursor-pointer text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Modal Body / Form */}
          <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
            
            {/* Goong Autocomplete Search */}
            {goongApiKey && goongApiKey !== 'YOUR_GOONG_API_KEY_HERE' && (
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <span>🔎</span> Tìm nhanh bằng bản đồ (Goong Map)
                </label>
                <input 
                  type="text" 
                  placeholder="Nhập tên địa điểm, số nhà, tên đường để tự động điền..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-3xs"
                />
                {loadingSuggestions && (
                  <div className="absolute right-3.5 top-[30px] w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                )}

                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {suggestions.map((p) => (
                      <div 
                        key={p.place_id} 
                        onClick={() => handleSelectSuggestion(p.place_id)}
                        className="px-4 py-2.5 hover:bg-emerald-50/50 text-[11px] font-semibold text-slate-700 cursor-pointer transition"
                      >
                        <span className="font-bold text-emerald-800">{p.structured_formatting.main_text}</span>
                        <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Name & Phone */}
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

            {/* 3 CẤP ĐỊA CHỈ HÀNH CHÍNH (TỈNH / QUẬN / PHƯỜNG) - 100% DROPDOWN CHUẨN SHOPEE / GHN */}
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
                    value={selectedProvinceId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : ''
                      setSelectedProvinceId(val)
                    }}
                    disabled={loadingProvinces}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer text-slate-800 font-medium"
                  >
                    <option value="">
                      {loadingProvinces ? '⏳ Đang tải 63 Tỉnh/Thành...' : '-- Chọn Tỉnh / TP --'}
                    </option>
                    {provinces.map((p) => (
                      <option key={p.ProvinceID} value={p.ProvinceID}>
                        {p.ProvinceName}
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
                    value={selectedDistrictId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : ''
                      setSelectedDistrictId(val)
                    }}
                    disabled={!selectedProvinceId || loadingDistricts}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedProvinceId 
                        ? '-- Chọn Tỉnh/TP trước --' 
                        : loadingDistricts 
                          ? '⏳ Đang tải Quận/Huyện...' 
                          : '-- Chọn Quận / Huyện --'}
                    </option>
                    {districts.map((d) => (
                      <option key={d.DistrictID} value={d.DistrictID}>
                        {d.DistrictName}
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
                    onChange={(e) => setSelectedWardCode(e.target.value)}
                    disabled={!selectedDistrictId || loadingWards}
                    className="w-full border border-slate-250 bg-white rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!selectedDistrictId 
                        ? '-- Chọn Quận/Huyện trước --' 
                        : loadingWards 
                          ? '⏳ Đang tải Phường/Xã...' 
                          : '-- Chọn Phường / Xã --'}
                    </option>
                    {wards.map((w) => (
                      <option key={w.WardCode} value={w.WardCode}>
                        {w.WardName}
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
                    : 'Ghim vị trí chính xác để Shipper tìm kho nhanh hơn'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="bg-white border border-slate-250 text-slate-700 hover:text-emerald-600 hover:border-emerald-500/50 px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition cursor-pointer flex items-center gap-1 shadow-3xs"
                >
                  🗺️ Ghim bản đồ
                </button>
                {coordinates ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center">
                    ✓ Đã có GPS
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setCoordinates({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude
                          })
                        },
                        () => {
                          setCoordinates({
                            lat: 10.762622 + (Math.random() - 0.5) * 0.05,
                            lng: 106.660172 + (Math.random() - 0.5) * 0.05
                          })
                        }
                      )
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition cursor-pointer shadow-3xs"
                  >
                    Định vị GPS
                  </button>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-50 transition cursor-pointer text-slate-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Lưu lại
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- SELECT LOCATION ON MAP MODAL --- */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[120] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-[75vh] relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center relative bg-white shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                <span>🗺️</span> Chọn vị trí kho hàng trên bản đồ
              </h3>
              <button 
                type="button"
                onClick={() => setIsMapModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative bg-slate-100 h-full overflow-hidden">
              <div id="leaflet-shop-address-map" className="w-full h-full z-10"></div>

              {/* Absolute Search Positioned inside Map */}
              <div className="absolute top-4 left-4 z-20 w-72 sm:w-80">
                <div className="relative shadow-md rounded-xl overflow-hidden border border-slate-200">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm địa chỉ trên bản đồ..."
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    className="w-full bg-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition pr-8 text-slate-800"
                  />
                  {mapSearchLoading && (
                    <div className="absolute right-3 top-3 w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                {mapSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {mapSuggestions.map((p) => (
                      <div 
                        key={p.place_id} 
                        onClick={async () => {
                          if (!goongApiKey) return
                          setMapSearchLoading(true)
                          try {
                            const res = await fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${p.place_id}`)
                            const data = await res.json()
                            if (data.status === 'OK' && data.result) {
                              const result = data.result
                              const compound = result.compound || {}
                              setSelectedMapCompound({
                                province: compound.province || '',
                                district: compound.district || '',
                                ward: compound.commune || '',
                                detail: result.formatted_address || ''
                              })
                              setSelectedMapAddress(result.formatted_address || '')
                              if (result.geometry?.location) {
                                const loc = {
                                  lat: result.geometry.location.lat,
                                  lng: result.geometry.location.lng
                                }
                                setSelectedMapCoords(loc)
                                if (mapInstance && mapMarker) {
                                  mapInstance.setView([loc.lat, loc.lng], 16)
                                  mapMarker.setLatLng([loc.lat, loc.lng])
                                }
                              }
                            }
                          } catch (err) {
                            console.error(err)
                          } finally {
                            setMapSearchLoading(false)
                            setMapSuggestions([])
                            setMapSearchQuery('')
                          }
                        }}
                        className="px-4 py-2.5 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer transition text-left"
                      >
                        <span className="font-bold text-slate-800">{p.structured_formatting.main_text}</span>
                        <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Map Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white shrink-0">
              <div className="text-xs">
                <p className="font-bold text-slate-700 truncate max-w-sm">{selectedMapAddress || 'Đang xác định địa chỉ...'}</p>
                <p className="text-[10px] text-slate-400 font-mono">Tọa độ: {selectedMapCoords.lat.toFixed(6)}, {selectedMapCoords.lng.toFixed(6)}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMapSelection}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Xác nhận địa điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
