import React from 'react'
import type { ProvinceItem, DistrictItem, WardItem, LatLngCoords } from './types'
import { AddressLocationSelects } from './AddressLocationSelects'
import { AddressMapPicker } from './AddressMapPicker'

interface AddressFormViewProps {
  formName: string
  setFormName: (val: string) => void
  formPhone: string
  setFormPhone: (val: string) => void
  phoneError: string
  setPhoneError: (val: string) => void
  formDetails: string
  setFormDetails: (val: string) => void
  formIsDefault: boolean
  setFormIsDefault: (val: boolean) => void

  // Administrative Selects Props
  provinces: ProvinceItem[]
  selectedProvinceCode: number | ''
  onSelectProvince: (code: number | '') => void

  districts: DistrictItem[]
  selectedDistrictCode: number | ''
  onSelectDistrict: (code: number | '') => void

  wards: WardItem[]
  selectedWardCode: number | ''
  onSelectWard: (code: number | '') => void

  // Map Picker Props
  goongApiKey: string
  mapCoords: LatLngCoords
  setMapCoords: (coords: LatLngCoords) => void
  mapZoom?: number
  onAddressMatched: (prov: string, dist: string, ward: string, fullAddress?: string) => void
  isActiveTab: boolean
}

export const AddressFormView: React.FC<AddressFormViewProps> = ({
  formName,
  setFormName,
  formPhone,
  setFormPhone,
  phoneError,
  setPhoneError,
  formDetails,
  setFormDetails,
  formIsDefault,
  setFormIsDefault,

  provinces,
  selectedProvinceCode,
  onSelectProvince,

  districts,
  selectedDistrictCode,
  onSelectDistrict,

  wards,
  selectedWardCode,
  onSelectWard,

  goongApiKey,
  mapCoords,
  setMapCoords,
  mapZoom = 15,
  onAddressMatched,
  isActiveTab
}) => {
  return (
    <div className="space-y-5 text-left text-sm font-semibold">
      {/* 1. Goong Map Search & Interactive Pinning */}
      <AddressMapPicker
        goongApiKey={goongApiKey}
        mapCoords={mapCoords}
        setMapCoords={setMapCoords}
        mapZoom={mapZoom}
        onAddressMatched={onAddressMatched}
        isActiveTab={isActiveTab}
      />

      {/* 2. Họ và tên & Số điện thoại (2 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder=" "
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="peer w-full border border-slate-202 rounded-lg p-3 pt-6 pb-2 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 bg-white transition-all duration-150 text-sm"
          />
          <label className="absolute left-3 top-1 text-[10px] text-slate-400 font-bold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-[#ee4d2d] peer-focus:font-bold pointer-events-none">
            Họ và tên
          </label>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder=" "
            value={formPhone}
            onChange={(e) => {
              setFormPhone(e.target.value)
              if (phoneError) setPhoneError('')
            }}
            className={`peer w-full border ${phoneError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#ee4d2d]'} rounded-lg p-3 pt-6 pb-2 focus:outline-none font-medium text-slate-800 bg-white transition-all duration-150 text-sm`}
          />
          <label className={`absolute left-3 top-1 text-[10px] ${phoneError ? 'text-red-500' : 'text-slate-400 peer-focus:text-[#ee4d2d]'} font-bold transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold pointer-events-none`}>
            Số điện thoại
          </label>
          {phoneError && (
            <p className="text-red-500 text-xs mt-1 font-bold pl-1 leading-tight">{phoneError}</p>
          )}
        </div>
      </div>

      {/* 3. Dropdown 3 cấp hành chính (Tỉnh / Quận / Phường) */}
      <AddressLocationSelects
        provinces={provinces}
        selectedProvinceCode={selectedProvinceCode}
        onSelectProvince={onSelectProvince}
        districts={districts}
        selectedDistrictCode={selectedDistrictCode}
        onSelectDistrict={onSelectDistrict}
        wards={wards}
        selectedWardCode={selectedWardCode}
        onSelectWard={onSelectWard}
      />

      {/* 4. Ô nhập địa chỉ cụ thể */}
      <div className="relative">
        <textarea
          placeholder="Địa chỉ cụ thể (Số nhà, tòa nhà, ngõ ngách...)"
          rows={2}
          value={formDetails}
          onChange={(e) => setFormDetails(e.target.value)}
          className="w-full border border-slate-202 rounded-lg p-3.5 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 bg-white transition-all text-sm"
        />
      </div>

      {/* 5. Checkbox Đặt làm mặc định */}
      <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none w-fit">
        <input
          type="checkbox"
          checked={formIsDefault}
          onChange={(e) => setFormIsDefault(e.target.checked)}
          className="w-4.5 h-4.5 rounded border-slate-300 text-[#ee4d2d] focus:ring-[#ee4d2d] cursor-pointer"
        />
        <span className="text-slate-700 font-bold text-xs sm:text-sm">Đặt làm địa chỉ mặc định</span>
      </label>
    </div>
  )
}
