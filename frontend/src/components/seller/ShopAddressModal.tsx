import React, { useState, useEffect } from 'react'
import type { LatLngCoords } from '../buyer/address/types'
import { useVietnamAddress } from '../buyer/address/useVietnamAddress'
import { AddressLocationSelects } from '../buyer/address/AddressLocationSelects'
import { AddressMapPicker } from '../buyer/address/AddressMapPicker'
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
  const [phoneError, setPhoneError] = useState('')

  // Detail address smart autocomplete states (Shopee style)
  const [detailSuggestions, setDetailSuggestions] = useState<any[]>([])
  const [loadingDetailSuggestions, setLoadingDetailSuggestions] = useState(false)
  const [isDetailFocused, setIsDetailFocused] = useState(false)

  // Map states
  const [mapCoords, setMapCoords] = useState<LatLngCoords>({ lat: 10.762622, lng: 106.660172 })
  const [mapZoom, setMapZoom] = useState<number>(15)

  // 3-level Vietnam administrative tree hook
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

  // Đồng bộ dữ liệu ban đầu khi mở modal
  useEffect(() => {
    if (!isOpen) return

    if (initialAddress) {
      setFullName(initialAddress.fullName || '')
      setPhoneNumber(initialAddress.phoneNumber || '')
      setDetailAddress(initialAddress.detailAddress || '')
      setPhoneError('')

      if (initialAddress.coordinates?.lat && initialAddress.coordinates?.lng) {
        setMapCoords({
          lat: initialAddress.coordinates.lat,
          lng: initialAddress.coordinates.lng
        })
        setMapZoom(16)
      } else {
        setMapCoords({ lat: 10.762622, lng: 106.660172 })
        setMapZoom(15)
      }

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
      setPhoneError('')
      setMapCoords({ lat: 10.762622, lng: 106.660172 })
      setMapZoom(15)
      resetSelection()
    }
  }, [isOpen, initialAddress])

  // 1. Khi chọn Tỉnh/Thành -> Bản đồ bay tới Tỉnh đó (zoom 11)
  const onSelectProvinceWithMapFly = async (code: number | '') => {
    handleSelectProvince(code)
    if (!code) return
    const prov = provinces.find((p) => p.code === code)
    if (prov) {
      const coords = await fetchCoordinatesByAddress(`${prov.name}, Việt Nam`, goongApiKey)
      if (coords) {
        setMapCoords(coords)
        setMapZoom(11)
      }
    }
  }

  // 2. Khi chọn Quận/Huyện -> Bản đồ bay tới Quận/Huyện đó (zoom 13)
  const onSelectDistrictWithMapFly = async (code: number | '') => {
    handleSelectDistrict(code)
    if (!code) return
    const dist = districts.find((d) => d.code === code)
    if (dist) {
      const coords = await fetchCoordinatesByAddress(`${dist.name}, ${chosenProvince}, Việt Nam`, goongApiKey)
      if (coords) {
        setMapCoords(coords)
        setMapZoom(13)
      }
    }
  }

  // 3. Khi chọn Phường/Xã -> Bản đồ bay tới Phường/Xã đó (zoom 15)
  const onSelectWardWithMapFly = async (code: number | '') => {
    handleSelectWard(code)
    if (!code) return
    const ward = wards.find((w) => w.code === code)
    if (ward) {
      const coords = await fetchCoordinatesByAddress(
        `${ward.name}, ${chosenDistrict}, ${chosenProvince}, Việt Nam`,
        goongApiKey
      )
      if (coords) {
        setMapCoords(coords)
        setMapZoom(15)
      }
    }
  }

  // 4. Khi chọn từ gợi ý Goong Map hoặc kéo thả ghim trên bản đồ
  const handleAddressMatched = (prov: string, dist: string, ward: string, fullAddress?: string) => {
    if (fullAddress) setDetailAddress(fullAddress)
    autoMatchAddressComponents(prov, dist, ward)
    setMapZoom(16)
  }

  // 5. Gợi ý địa chỉ chi tiết theo chuẩn Shopee (Goong Places Autocomplete)
  useEffect(() => {
    if (
      !detailAddress.trim() ||
      detailAddress.trim().length < 2 ||
      !goongApiKey ||
      goongApiKey === 'YOUR_GOONG_API_KEY_HERE'
    ) {
      setDetailSuggestions([])
      return
    }

    const timer = setTimeout(() => {
      setLoadingDetailSuggestions(true)
      const locParam =
        mapCoords?.lat && mapCoords?.lng
          ? `&location=${mapCoords.lat},${mapCoords.lng}`
          : ''
      fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(
          detailAddress
        )}${locParam}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'OK' && data.predictions) {
            setDetailSuggestions(data.predictions)
          } else {
            setDetailSuggestions([])
          }
        })
        .catch((err) => {
          console.error('Lỗi lấy gợi ý địa chỉ chi tiết:', err)
          setDetailSuggestions([])
        })
        .finally(() => {
          setLoadingDetailSuggestions(false)
        })
    }, 350)

    return () => clearTimeout(timer)
  }, [detailAddress, goongApiKey, mapCoords.lat, mapCoords.lng])

  // Chọn gợi ý địa chỉ chi tiết -> Bay map và khớp 3 cấp hành chính
  const handleSelectDetailSuggestion = (placeId: string, mainText: string) => {
    setDetailSuggestions([])
    setDetailAddress(mainText)

    if (!goongApiKey) return

    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.result) {
          const result = data.result
          const compound = result.compound || {}

          const prov = compound.province || ''
          const dist = compound.district || ''
          const wrd = compound.commune || ''

          if (prov || dist || wrd) {
            autoMatchAddressComponents(prov, dist, wrd)
          }

          if (result.geometry?.location) {
            const loc = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            }
            setMapCoords(loc)
            setMapZoom(16)
          }
        }
      })
      .catch((err) => {
        console.error('Lỗi lấy chi tiết vị trí gợi ý:', err)
      })
  }

  // Xử lý lưu địa chỉ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Vui lòng nhập họ và tên người phụ trách kho hàng!')
      return
    }

    const cleanPhone = phoneNumber.replace(/[\s\(\)\-\+]/g, '')
    if (!/^\d{9,12}$/.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ (cần từ 9 đến 12 số)')
      return
    }
    setPhoneError('')

    if (!chosenProvince) {
      alert('Vui lòng chọn Tỉnh / Thành phố!')
      return
    }
    if (!chosenDistrict) {
      alert('Vui lòng chọn Quận / Huyện!')
      return
    }
    if (!chosenWard) {
      alert('Vui lòng chọn Phường / Xã!')
      return
    }
    if (!detailAddress.trim()) {
      alert('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường...)!')
      return
    }

    onSave({
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      province: chosenProvince,
      district: chosenDistrict,
      ward: chosenWard,
      detailAddress: detailAddress.trim(),
      coordinates: mapCoords
    })

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span className="text-emerald-600">📍</span>
              {initialAddress ? 'Cập Nhật Địa Chỉ Lấy Hàng' : 'Thêm Địa Chỉ Lấy Hàng'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Điền thông tin kho hàng để tài xế ZeroMall Express (ZMX) đến nhận kiện hàng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-50 transition text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <form id="shop-address-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Goong Map Search & Interactive Inline Leaflet Map */}
            <AddressMapPicker
              goongApiKey={goongApiKey}
              mapCoords={mapCoords}
              setMapCoords={setMapCoords}
              mapZoom={mapZoom}
              onAddressMatched={handleAddressMatched}
              isActiveTab={isOpen}
              mapContainerId="seller-pickup-map-picker"
              theme="emerald"
              searchPlaceholder="Nhập địa chỉ kho hàng để tìm kiếm và định vị tự động..."
            />

            {/* 2. Họ và tên & Số điện thoại (2 Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Họ & Tên Người Phụ Trách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800 bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Số Điện Thoại Nhận Hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    if (phoneError) setPhoneError('')
                  }}
                  className={`w-full border ${phoneError ? 'border-red-500' : 'border-slate-200'} rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-medium text-slate-800 bg-white transition`}
                />
                {phoneError && (
                  <p className="text-red-500 text-[10px] font-bold mt-0.5">{phoneError}</p>
                )}
              </div>
            </div>

            {/* 3. Dropdown 3 cấp hành chính Việt Nam (Tỉnh / Quận / Phường) */}
            <div className="text-left">
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
            </div>

            {/* 4. Địa chỉ chi tiết (Số nhà, đường...) kèm Gợi ý thông minh kiểu Shopee */}
            <div className="space-y-1 text-left relative">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Địa Chỉ Chi Tiết (Số nhà, ngõ, tên đường...) <span className="text-red-500">*</span>
                </label>
                {loadingDetailSuggestions && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 animate-pulse">
                    <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                    Đang tìm gợi ý...
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  required
                  rows={2}
                  placeholder="Ví dụ: 4 Nguyễn Văn Bảo, hoặc nhập số nhà, ngõ, tên đường để hiện gợi ý..."
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  onFocus={() => setIsDetailFocused(true)}
                  onBlur={() => setTimeout(() => setIsDetailFocused(false), 250)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition resize-none font-medium text-slate-800 bg-white"
                />

                {/* Dropdown Gợi ý địa chỉ chi tiết theo chuẩn Shopee */}
                {isDetailFocused && detailSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>💡 Gợi ý địa điểm chính xác (Click để ghim bản đồ)</span>
                      <span className="text-emerald-600 font-semibold">{detailSuggestions.length} kết quả</span>
                    </div>
                    {detailSuggestions.map((p: any) => (
                      <div
                        key={p.place_id}
                        onMouseDown={() =>
                          handleSelectDetailSuggestion(
                            p.place_id,
                            p.structured_formatting?.main_text || p.description
                          )
                        }
                        className="px-3.5 py-2.5 hover:bg-emerald-50/60 text-xs font-semibold text-slate-700 cursor-pointer transition text-left flex items-start gap-2.5"
                      >
                        <span className="text-emerald-600 text-sm mt-0.5 shrink-0">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-800 text-xs truncate">
                            {p.structured_formatting?.main_text || p.description}
                          </p>
                          {p.structured_formatting?.secondary_text && (
                            <p className="text-slate-400 text-[11px] font-normal truncate mt-0.5">
                              {p.structured_formatting.secondary_text}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 5. Live GPS Coordinates Badge */}
            <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-xl text-left">
              <span className="text-base">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Tọa độ GPS kho lấy hàng
                </p>
                <p className="text-xs font-semibold text-emerald-700">
                  {mapCoords.lat.toFixed(6)}, {mapCoords.lng.toFixed(6)}
                </p>
              </div>
              <span className="text-[10px] bg-white text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                ✓ Đã Ghim
              </span>
            </div>

          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="shop-address-form"
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
          >
            <span>💾</span> Lưu Địa Chỉ
          </button>
        </div>

      </div>
    </div>
  )
}
