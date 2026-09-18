import React, { useState, useEffect } from 'react'
import type { ShippingAddress } from '../../models/address.model'
import { API_BASE_URL } from '../../config/api.config'
import type { AddressModalProps, LatLngCoords } from './address/types'
import { useVietnamAddress } from './address/useVietnamAddress'
import { AddressListView } from './address/AddressListView'
import { AddressFormView } from './address/AddressFormView'
import { fetchCoordinatesByAddress } from '../../services/geocoding.service'

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addresses,
  setAddresses,
  activeAddressId,
  setActiveAddressId,
  goongApiKey,
  user
}) => {
  const [addressModalTab, setAddressModalTab] = useState<'list' | 'form'>('list')
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState<string>(activeAddressId)

  // Form states
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formDetails, setFormDetails] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [mapCoords, setMapCoords] = useState<LatLngCoords>({ lat: 10.762622, lng: 106.660172 })
  const [mapZoom, setMapZoom] = useState<number>(15)

  // Custom hook managing Vietnam 3-level administrative tree
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

  // Sync temp selection when activeAddressId changes or modal opens
  useEffect(() => {
    setTempSelectedAddressId(activeAddressId)
  }, [activeAddressId, isOpen])

  // Reset form inputs
  const resetAddressForm = () => {
    setEditingAddressId(null)
    setFormName('')
    setFormPhone('')
    setFormDetails('')
    setFormIsDefault(false)
    setPhoneError('')
    setMapZoom(15)
    resetSelection()
  }

  // Automatically open form directly if addresses are empty
  useEffect(() => {
    if (isOpen && addresses.length === 0) {
      resetAddressForm()
      setFormIsDefault(true)
      setAddressModalTab('form')
    } else if (isOpen) {
      setAddressModalTab('list')
    }
  }, [isOpen, addresses.length])

  // 1. Khi chọn Tỉnh/Thành -> Bản đồ bay tới Tỉnh đó (zoom 11)
  const onSelectProvinceWithMapFly = async (code: number | '') => {
    handleSelectProvince(code)
    if (!code) return
    const prov = provinces.find(p => p.code === code)
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
    const dist = districts.find(d => d.code === code)
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
    const ward = wards.find(w => w.code === code)
    if (ward) {
      const coords = await fetchCoordinatesByAddress(`${ward.name}, ${chosenDistrict}, ${chosenProvince}, Việt Nam`, goongApiKey)
      if (coords) {
        setMapCoords(coords)
        setMapZoom(15)
      }
    }
  }

  // Click edit an existing address
  const handleEditAddressClick = (addr: ShippingAddress) => {
    setEditingAddressId(addr.id)
    setFormName(addr.name)
    setFormPhone(addr.phone)
    setFormDetails(addr.details)
    setFormIsDefault(addr.isDefault)
    setPhoneError('')
    setMapCoords({
      lat: addr.lat || 10.762622,
      lng: addr.lng || 106.660172
    })
    setMapZoom(15)

    const parts = addr.region.split(',').map(p => p.trim())
    let prov = ''
    let dist = ''
    let wrd = ''
    if (parts.length >= 3) {
      prov = parts[parts.length - 1]
      dist = parts[parts.length - 2]
      wrd = parts[parts.length - 3]
    } else if (parts.length === 2) {
      prov = parts[1]
      dist = parts[0]
    } else if (parts.length === 1) {
      prov = parts[0]
    }

    autoMatchAddressComponents(prov, dist, wrd)
    setAddressModalTab('form')
  }

  // Handle map/geocoding match
  const handleAddressMatched = (prov: string, dist: string, ward: string, fullAddress?: string) => {
    if (fullAddress) setFormDetails(fullAddress)
    autoMatchAddressComponents(prov, dist, ward)
    setMapZoom(16)
  }

  // Confirm selection from list
  const handleConfirmAddressSelection = () => {
    setActiveAddressId(tempSelectedAddressId)
    onClose()
  }

  // Save address form
  const handleSaveFormAddress = async () => {
    if (!formName.trim()) {
      alert('Vui lòng nhập họ và tên')
      return
    }
    const cleanPhone = formPhone.replace(/[\s\(\)\-\+]/g, '')
    if (!/^\d{9,12}$/.test(cleanPhone)) {
      setPhoneError('Số điện thoại không hợp lệ')
      return
    }
    setPhoneError('')

    if (!chosenProvince) {
      alert('Vui lòng chọn Tỉnh/Thành Phố')
      return
    }
    if (!chosenDistrict) {
      alert('Vui lòng chọn Quận/Huyện')
      return
    }
    if (!chosenWard) {
      alert('Vui lòng chọn Phường/Xã')
      return
    }
    if (!formDetails.trim()) {
      alert('Vui lòng nhập địa chỉ cụ thể')
      return
    }

    const fullRegion = `${chosenWard}, ${chosenDistrict}, ${chosenProvince}`
    const updatedAddresses = [...addresses]

    if (editingAddressId) {
      const idx = updatedAddresses.findIndex(a => a.id === editingAddressId)
      if (idx > -1) {
        updatedAddresses[idx] = {
          ...updatedAddresses[idx],
          name: formName.trim(),
          phone: formPhone.trim(),
          region: fullRegion,
          details: formDetails.trim(),
          isDefault: formIsDefault,
          lat: mapCoords.lat,
          lng: mapCoords.lng
        }
      }
    } else {
      const newAddr: ShippingAddress = {
        id: `addr-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        region: fullRegion,
        details: formDetails.trim(),
        isDefault: formIsDefault,
        lat: mapCoords.lat,
        lng: mapCoords.lng
      }
      updatedAddresses.push(newAddr)
    }

    if (formIsDefault) {
      updatedAddresses.forEach(a => {
        if (a.id !== (editingAddressId || updatedAddresses[updatedAddresses.length - 1].id)) {
          a.isDefault = false
        }
      })
    } else {
      const hasDefault = updatedAddresses.some(a => a.isDefault)
      if (!hasDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true
      }
    }

    // Đồng bộ lên backend API nếu user đã đăng nhập
    if (user?.id) {
      try {
        const payload = {
          name: formName.trim(),
          phone: formPhone.trim(),
          region: fullRegion,
          details: formDetails.trim(),
          isDefault: formIsDefault || addresses.length === 0,
          lat: mapCoords.lat,
          lng: mapCoords.lng
        }

        if (editingAddressId && !editingAddressId.startsWith('addr-')) {
          const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses/${editingAddressId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const savedItem = await res.json()
            const idx = updatedAddresses.findIndex(a => a.id === editingAddressId)
            if (idx > -1) updatedAddresses[idx] = savedItem
          }
        } else {
          const res = await fetch(`${API_BASE_URL}/auth/users/${user.id}/addresses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          if (res.ok) {
            const createdItem = await res.json()
            if (editingAddressId) {
              const idx = updatedAddresses.findIndex(a => a.id === editingAddressId)
              if (idx > -1) updatedAddresses[idx] = createdItem
            } else {
              updatedAddresses[updatedAddresses.length - 1] = createdItem
            }
          }
        }
      } catch (err) {
        console.error('Error syncing address to backend in AddressModal:', err)
      }
    }

    setAddresses(updatedAddresses)
    const targetId = editingAddressId || updatedAddresses[updatedAddresses.length - 1]?.id
    if (formIsDefault || updatedAddresses.length === 1) {
      if (targetId) setActiveAddressId(targetId)
    }

    setAddressModalTab('list')
    setEditingAddressId(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-black text-slate-805 tracking-tight">
            {addressModalTab === 'list' ? 'Địa Chỉ Của Tôi' : (editingAddressId ? 'Cập nhật địa chỉ' : 'Địa chỉ mới')}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 transition cursor-pointer text-2xl font-light leading-none pb-1"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          {addressModalTab === 'list' ? (
            <AddressListView
              addresses={addresses}
              tempSelectedAddressId={tempSelectedAddressId}
              setTempSelectedAddressId={setTempSelectedAddressId}
              onEditAddress={handleEditAddressClick}
            />
          ) : (
            <AddressFormView
              formName={formName}
              setFormName={setFormName}
              formPhone={formPhone}
              setFormPhone={setFormPhone}
              phoneError={phoneError}
              setPhoneError={setPhoneError}
              formDetails={formDetails}
              setFormDetails={setFormDetails}
              formIsDefault={formIsDefault}
              setFormIsDefault={setFormIsDefault}
              provinces={provinces}
              selectedProvinceCode={selectedProvinceCode}
              onSelectProvince={onSelectProvinceWithMapFly}
              districts={districts}
              selectedDistrictCode={selectedDistrictCode}
              onSelectDistrict={onSelectDistrictWithMapFly}
              wards={wards}
              selectedWardCode={selectedWardCode}
              onSelectWard={onSelectWardWithMapFly}
              goongApiKey={goongApiKey}
              mapCoords={mapCoords}
              setMapCoords={setMapCoords}
              mapZoom={mapZoom}
              onAddressMatched={handleAddressMatched}
              isActiveTab={addressModalTab === 'form'}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          {addressModalTab === 'list' ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition cursor-pointer text-sm font-bold bg-white"
              >
                Hủy
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetAddressForm()
                    setAddressModalTab('form')
                  }}
                  className="px-5 py-2.5 bg-white border border-[#ee4d2d] text-[#ee4d2d] hover:bg-[#feeee9]/30 rounded-lg transition cursor-pointer text-sm font-bold flex items-center gap-1.5 shadow-3xs"
                >
                  <span className="text-base font-extrabold leading-none">+</span> Thêm Địa Chỉ Mới
                </button>
                <button
                  onClick={handleConfirmAddressSelection}
                  className="px-6 py-2.5 bg-[#ee4d2d] hover:bg-[#f05d40] text-white rounded-lg transition cursor-pointer shadow-sm text-sm font-bold"
                >
                  Xác nhận
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setAddressModalTab('list')}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition cursor-pointer text-sm font-bold bg-white"
              >
                Trở Lại
              </button>
              <button
                onClick={handleSaveFormAddress}
                className="px-7 py-2.5 bg-[#ee4d2d] hover:bg-[#f05d40] text-white rounded-lg transition cursor-pointer shadow-sm text-sm font-bold"
              >
                Hoàn thành
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
