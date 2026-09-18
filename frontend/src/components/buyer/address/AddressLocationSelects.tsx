import React from 'react'
import type { ProvinceItem, DistrictItem, WardItem } from './types'

interface AddressLocationSelectsProps {
  provinces: ProvinceItem[]
  selectedProvinceCode: number | ''
  onSelectProvince: (code: number | '') => void

  districts: DistrictItem[]
  selectedDistrictCode: number | ''
  onSelectDistrict: (code: number | '') => void

  wards: WardItem[]
  selectedWardCode: number | ''
  onSelectWard: (code: number | '') => void
}

export const AddressLocationSelects: React.FC<AddressLocationSelectsProps> = ({
  provinces,
  selectedProvinceCode,
  onSelectProvince,
  districts,
  selectedDistrictCode,
  onSelectDistrict,
  wards,
  selectedWardCode,
  onSelectWard
}) => {
  return (
    <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <span>🏛️</span> Khu vực hành chính (Tỉnh / Quận / Phường)
        </p>
        <span className="text-[9px] bg-red-50 text-[#ee4d2d] px-2 py-0.5 rounded-full font-bold">
          Bắt buộc
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
            onChange={(e) => onSelectProvince(e.target.value ? Number(e.target.value) : '')}
            className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] transition cursor-pointer text-slate-800 font-medium"
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
            onChange={(e) => onSelectDistrict(e.target.value ? Number(e.target.value) : '')}
            disabled={!selectedProvinceCode}
            className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
            onChange={(e) => onSelectWard(e.target.value ? Number(e.target.value) : '')}
            disabled={!selectedDistrictCode}
            className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] transition cursor-pointer text-slate-800 font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
  )
}
