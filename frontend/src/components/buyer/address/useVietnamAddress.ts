import { useState, useMemo } from 'react'
import type { ProvinceItem, DistrictItem, WardItem } from './types'
import { cleanAdminName } from '../../../utils/vietnameseTones'
import vietnamAddressData from '../../../data/vietnam-address-tree.json'

export const useVietnamAddress = () => {
  const provinces = useMemo<ProvinceItem[]>(() => {
    return (vietnamAddressData as ProvinceItem[]).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    )
  }, [])

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | ''>('')
  const [districts, setDistricts] = useState<DistrictItem[]>([])
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | ''>('')
  const [wards, setWards] = useState<WardItem[]>([])
  const [selectedWardCode, setSelectedWardCode] = useState<number | ''>('')

  const [chosenProvince, setChosenProvince] = useState('')
  const [chosenDistrict, setChosenDistrict] = useState('')
  const [chosenWard, setChosenWard] = useState('')

  // 1. Khi người dùng chọn Tỉnh / Thành phố
  const handleSelectProvince = (provCode: number | '') => {
    setSelectedProvinceCode(provCode)
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setChosenDistrict('')
    setChosenWard('')

    if (!provCode) {
      setChosenProvince('')
      setDistricts([])
      setWards([])
      return
    }

    const prov = provinces.find(p => p.code === provCode)
    if (prov) {
      setChosenProvince(prov.name)
      const sortedDistricts = [...prov.districts].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setDistricts(sortedDistricts)
      setWards([])
    }
  }

  // 2. Khi người dùng chọn Quận / Huyện
  const handleSelectDistrict = (distCode: number | '') => {
    setSelectedDistrictCode(distCode)
    setSelectedWardCode('')
    setChosenWard('')

    if (!distCode) {
      setChosenDistrict('')
      setWards([])
      return
    }

    const dist = districts.find(d => d.code === distCode)
    if (dist) {
      setChosenDistrict(dist.name)
      const sortedWards = [...dist.wards].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      setWards(sortedWards)
    }
  }

  // 3. Khi người dùng chọn Phường / Xã
  const handleSelectWard = (wardCode: number | '') => {
    setSelectedWardCode(wardCode)

    if (!wardCode) {
      setChosenWard('')
      return
    }

    const ward = wards.find(w => w.code === wardCode)
    if (ward) {
      setChosenWard(ward.name)
    }
  }

  // 4. Reset toàn bộ lựa chọn hành chính
  const resetSelection = () => {
    setSelectedProvinceCode('')
    setSelectedDistrictCode('')
    setSelectedWardCode('')
    setChosenProvince('')
    setChosenDistrict('')
    setChosenWard('')
    setDistricts([])
    setWards([])
  }

  // 5. Tự động so khớp 3 cấp hành chính khi chọn từ Goong Map hoặc reverse-geocoding
  const autoMatchAddressComponents = (provName: string, distName: string, wardName: string) => {
    const cleanP = cleanAdminName(provName)
    const cleanD = cleanAdminName(distName)
    const cleanW = cleanAdminName(wardName)

    // Khớp Tỉnh / TP
    const foundProv = provinces.find(p => cleanAdminName(p.name) === cleanP)
    if (!foundProv) {
      setChosenProvince(provName)
      setChosenDistrict(distName)
      setChosenWard(wardName)
      return
    }

    setChosenProvince(foundProv.name)
    setSelectedProvinceCode(foundProv.code)

    const sortedDistricts = [...foundProv.districts].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    setDistricts(sortedDistricts)

    // Khớp Quận / Huyện
    const foundDist = sortedDistricts.find(d => cleanAdminName(d.name) === cleanD)
    if (!foundDist) {
      setChosenDistrict(distName)
      setChosenWard(wardName)
      setSelectedDistrictCode('')
      setWards([])
      return
    }

    setChosenDistrict(foundDist.name)
    setSelectedDistrictCode(foundDist.code)

    const sortedWards = [...foundDist.wards].sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    setWards(sortedWards)

    // Khớp Phường / Xã
    const foundWard = sortedWards.find(w => cleanAdminName(w.name) === cleanW)
    if (foundWard) {
      setChosenWard(foundWard.name)
      setSelectedWardCode(foundWard.code)
    } else {
      setChosenWard(wardName)
      setSelectedWardCode('')
    }
  }

  return {
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
    autoMatchAddressComponents,
    setChosenProvince,
    setChosenDistrict,
    setChosenWard,
    setSelectedProvinceCode,
    setSelectedDistrictCode,
    setSelectedWardCode
  }
}
