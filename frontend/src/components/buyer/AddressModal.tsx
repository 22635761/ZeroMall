import React, { useState, useEffect } from 'react'
import type { ShippingAddress } from './CartPage'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  addresses: ShippingAddress[]
  setAddresses: React.Dispatch<React.SetStateAction<ShippingAddress[]>>
  activeAddressId: string
  setActiveAddressId: (id: string) => void
  goongApiKey: string
  VIETNAM_PROVINCES: string[]
  removeVietnameseTones: (str: string) => string
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  addresses,
  setAddresses,
  activeAddressId,
  setActiveAddressId,
  goongApiKey,
  VIETNAM_PROVINCES,
  removeVietnameseTones
}) => {
  const [addressModalTab, setAddressModalTab] = useState<'list' | 'form'>('list')
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [tempSelectedAddressId, setTempSelectedAddressId] = useState<string>(activeAddressId)

  // Form states
  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formDetails, setFormDetails] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [showRegionDropdown, setShowRegionDropdown] = useState(false)

  // 3-level administrative location states
  const [chosenProvince, setChosenProvince] = useState('')
  const [chosenDistrict, setChosenDistrict] = useState('')
  const [chosenWard, setChosenWard] = useState('')

  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showWardDropdown, setShowWardDropdown] = useState(false)

  const [districtQuery, setDistrictQuery] = useState('')
  const [wardQuery, setWardQuery] = useState('')

  const [districtSuggestions, setDistrictSuggestions] = useState<any[]>([])
  const [wardSuggestions, setWardSuggestions] = useState<any[]>([])

  const [loadingDistrict, setLoadingDistrict] = useState(false)
  const [loadingWard, setLoadingWard] = useState(false)

  // Goong autocomplete states
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Leaflet Map states
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number }>({ lat: 10.762622, lng: 106.660172 })

  // Sync selection with active ID when active address changes or modal opens
  useEffect(() => {
    setTempSelectedAddressId(activeAddressId)
  }, [activeAddressId, isOpen])

  const resetAddressForm = () => {
    setEditingAddressId(null)
    setFormName('')
    setFormPhone('')
    setFormRegion('')
    setFormDetails('')
    setFormIsDefault(false)
    setPhoneError('')
    setChosenProvince('')
    setChosenDistrict('')
    setChosenWard('')
    setDistrictQuery('')
    setWardQuery('')
    setDistrictSuggestions([])
    setWardSuggestions([])
  }

  // Load suggestions from Goong autocomplete API for Quick Search
  useEffect(() => {
    if (!searchQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setSuggestions([])
      return
    }
    
    const delayDebounceFn = setTimeout(() => {
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
          console.error('Error fetching Goong autocomplete:', err)
          setSuggestions([])
        })
        .finally(() => {
          setLoadingSuggestions(false)
        })
    }, 400) // Debounce 400ms

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, goongApiKey])

  // Load suggestions for District
  useEffect(() => {
    if (!chosenProvince || !districtQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setDistrictSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      setLoadingDistrict(true)
      const fullInput = `${chosenProvince} ${districtQuery}`
      fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(fullInput)}&types=administrative`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'OK' && data.predictions) {
            setDistrictSuggestions(data.predictions)
          } else {
            setDistrictSuggestions([])
          }
        })
        .catch((err) => {
          console.error('Error fetching Goong district autocomplete:', err)
          setDistrictSuggestions([])
        })
        .finally(() => {
          setLoadingDistrict(false)
        })
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [districtQuery, chosenProvince, goongApiKey])

  // Load suggestions for Ward
  useEffect(() => {
    if (!chosenProvince || !chosenDistrict || !wardQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setWardSuggestions([])
      return
    }

    const delayDebounceFn = setTimeout(() => {
      setLoadingWard(true)
      const fullInput = `${chosenDistrict}, ${chosenProvince} ${wardQuery}`
      fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(fullInput)}&types=administrative`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'OK' && data.predictions) {
            setWardSuggestions(data.predictions)
          } else {
            setWardSuggestions([])
          }
        })
        .catch((err) => {
          console.error('Error fetching Goong ward autocomplete:', err)
          setWardSuggestions([])
        })
        .finally(() => {
          setLoadingWard(false)
        })
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [wardQuery, chosenDistrict, chosenProvince, goongApiKey])

  // Leaflet Map initialization and cleanup
  useEffect(() => {
    if (addressModalTab !== 'form' || !isOpen) {
      if (mapInstance) {
        mapInstance.remove()
        setMapInstance(null)
        setMapMarker(null)
      }
      return
    }

    const timer = setTimeout(() => {
      const L = (window as any).L
      if (!L) {
        console.error('Leaflet is not loaded!')
        return
      }

      // Initial coordinates
      let initCoords = { lat: 10.762622, lng: 106.660172 }
      if (editingAddressId) {
        const editingAddr = addresses.find(a => a.id === editingAddressId)
        if (editingAddr && editingAddr.lat && editingAddr.lng) {
          initCoords = { lat: editingAddr.lat, lng: editingAddr.lng }
        }
      }
      setMapCoords(initCoords)

      const container = document.getElementById('leaflet-map-selector-modal')
      if (!container) return

      const map = L.map(container, {
        zoomControl: false
      }).setView([initCoords.lat, initCoords.lng], 15)

      // Add Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      // Add zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Create draggable marker
      const marker = L.marker([initCoords.lat, initCoords.lng], {
        draggable: true
      }).addTo(map)

      setMapInstance(map)
      setMapMarker(marker)

      // Reverse geocoding helper
      const reverseGeocode = (lat: number, lng: number) => {
        if (!goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') return
        
        fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.results && data.results.length > 0) {
              const firstResult = data.results[0]
              setFormDetails(firstResult.formatted_address || '')
              
              const compound = firstResult.compound || {}
              const prov = compound.province || ''
              const dist = compound.district || ''
              const wrd = compound.commune || ''

              setChosenProvince(prov)
              setChosenDistrict(dist)
              setChosenWard(wrd)
              setDistrictQuery(dist)
              setWardQuery(wrd)

              const resolvedRegion = `${wrd ? wrd + ', ' : ''}${dist ? dist + ', ' : ''}${prov}`
              setFormRegion(resolvedRegion)
            }
          })
          .catch((err) => {
            console.error('Error reverse geocoding:', err)
          })
      }

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setMapCoords({ lat: pos.lat, lng: pos.lng })
        reverseGeocode(pos.lat, pos.lng)
      })

      // Click event
      map.on('click', (e: any) => {
        const clickCoords = e.latlng
        marker.setLatLng(clickCoords)
        setMapCoords({ lat: clickCoords.lat, lng: clickCoords.lng })
        reverseGeocode(clickCoords.lat, clickCoords.lng)
      })
    }, 150)

    return () => {
      clearTimeout(timer)
    }
  }, [addressModalTab, isOpen])

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

  const handleEditAddressClick = (addr: ShippingAddress) => {
    setEditingAddressId(addr.id)
    setFormName(addr.name)
    setFormPhone(addr.phone)
    setFormRegion(addr.region)
    setFormDetails(addr.details)
    setFormIsDefault(addr.isDefault)
    setPhoneError('')
    setMapCoords({
      lat: addr.lat || 10.762622,
      lng: addr.lng || 106.660172
    })

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
    setChosenProvince(prov)
    setChosenDistrict(dist)
    setChosenWard(wrd)
    setDistrictQuery(dist)
    setWardQuery(wrd)

    setAddressModalTab('form')
  }

  const handleConfirmAddressSelection = () => {
    setActiveAddressId(tempSelectedAddressId)
    onClose()
  }

  const handleSelectGoongSuggestion = (placeId: string) => {
    if (!goongApiKey) return
    setSuggestions([])
    setSearchQuery('')
    
    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.result) {
          const result = data.result
          const compound = result.compound || {}
          
          const prov = compound.province || ''
          const dist = compound.district || ''
          const wrd = compound.commune || ''

          setChosenProvince(prov)
          setChosenDistrict(dist)
          setChosenWard(wrd)
          setDistrictQuery(dist)
          setWardQuery(wrd)

          const resolvedRegion = `${wrd ? wrd + ', ' : ''}${dist ? dist + ', ' : ''}${prov}`
          setFormRegion(resolvedRegion)
          setFormDetails(result.formatted_address || '')
          
          if (result.geometry && result.geometry.location) {
            const loc = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            }
            setMapCoords(loc)
            
            if (mapInstance && mapMarker) {
              mapInstance.setView([loc.lat, loc.lng], 15)
              mapMarker.setLatLng([loc.lat, loc.lng])
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching suggestion detail:', err)
      })
  }

  const handleSelectProvince = (provinceName: string) => {
    setChosenProvince(provinceName)
    setChosenDistrict('')
    setChosenWard('')
    setDistrictQuery('')
    setWardQuery('')
    setFormRegion(provinceName)
    setShowRegionDropdown(false)
    setShowDistrictDropdown(true)
    
    if (!goongApiKey) return
    
    fetch(`https://rsapi.goong.io/Geocode?address=${encodeURIComponent(provinceName + ', Việt Nam')}&api_key=${goongApiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const firstResult = data.results[0]
          if (firstResult.geometry && firstResult.geometry.location) {
            const loc = {
              lat: firstResult.geometry.location.lat,
              lng: firstResult.geometry.location.lng
            }
            setMapCoords(loc)
            
            if (mapInstance && mapMarker) {
              mapInstance.flyTo([loc.lat, loc.lng], 11)
              mapMarker.setLatLng([loc.lat, loc.lng])
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error geocoding province:', err)
      })
  }

  const handleSelectDistrictSuggestion = (placeId: string) => {
    if (!goongApiKey) return
    setDistrictSuggestions([])
    
    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.result) {
          const result = data.result
          const compound = result.compound || {}
          const distName = compound.district || result.name || ''
          
          setChosenDistrict(distName)
          setDistrictQuery(distName)
          setShowDistrictDropdown(false)
          setShowWardDropdown(true)
          
          if (result.geometry && result.geometry.location) {
            const loc = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            }
            setMapCoords(loc)
            
            if (mapInstance && mapMarker) {
              mapInstance.flyTo([loc.lat, loc.lng], 13)
              mapMarker.setLatLng([loc.lat, loc.lng])
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching district detail:', err)
      })
  }

  const handleSelectWardSuggestion = (placeId: string) => {
    if (!goongApiKey) return
    setWardSuggestions([])
    
    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.result) {
          const result = data.result
          const compound = result.compound || {}
          const wardName = compound.commune || result.name || ''
          
          setChosenWard(wardName)
          setWardQuery(wardName)
          setShowWardDropdown(false)
          
          const fullRegion = `${wardName}, ${chosenDistrict}, ${chosenProvince}`
          setFormRegion(fullRegion)
          
          if (result.geometry && result.geometry.location) {
            const loc = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            }
            setMapCoords(loc)
            
            if (mapInstance && mapMarker) {
              mapInstance.flyTo([loc.lat, loc.lng], 15)
              mapMarker.setLatLng([loc.lat, loc.lng])
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching ward detail:', err)
      })
  }

  const handleSaveFormAddress = () => {
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

    const updatedAddresses = [...addresses]

    if (editingAddressId) {
      const idx = updatedAddresses.findIndex(a => a.id === editingAddressId)
      if (idx > -1) {
        updatedAddresses[idx] = {
          ...updatedAddresses[idx],
          name: formName.trim(),
          phone: formPhone.trim(),
          region: formRegion,
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
        region: formRegion,
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

    setAddresses(updatedAddresses)
    const targetId = editingAddressId || updatedAddresses[updatedAddresses.length - 1].id
    if (formIsDefault || updatedAddresses.length === 1) {
      setActiveAddressId(targetId)
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
            // List of addresses (Image 1 style)
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setTempSelectedAddressId(addr.id)}
                  className={`flex items-start gap-4 p-5 border rounded-xl hover:bg-slate-50/50 transition cursor-pointer relative ${
                    tempSelectedAddressId === addr.id ? 'border-[#ee4d2d]/60 bg-[#feeee9]/10' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="mt-1 flex items-center justify-center">
                    <input
                      type="radio"
                      name="checkout_address"
                      checked={tempSelectedAddressId === addr.id}
                      onChange={() => setTempSelectedAddressId(addr.id)}
                      className="w-4.5 h-4.5 text-[#ee4d2d] focus:ring-[#ee4d2d] border-slate-300 rounded-full cursor-pointer accent-[#ee4d2d]"
                    />
                  </div>
                  <div className="flex-1 space-y-1 text-left text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-850 text-base">{addr.name}</span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="text-slate-500 font-semibold">{addr.phone}</span>
                    </div>
                    <p className="text-slate-605 font-medium leading-relaxed pr-16">
                      {addr.details}
                    </p>
                    <p className="text-slate-500 font-medium text-xs">
                      {addr.region}
                    </p>
                    {addr.isDefault && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-[#ee4d2d] border border-[#ee4d2d]/60 px-1.5 py-0.2 rounded-sm uppercase tracking-wider bg-[#feeee9]/20">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditAddressClick(addr);
                    }}
                    className="text-sm text-sky-655 hover:text-sky-500 hover:underline font-bold transition absolute top-5 right-5 cursor-pointer"
                  >
                    Cập nhật
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Add/Edit Address Form (Image 2 style)
            <div className="space-y-5 text-left text-sm font-semibold">
              
              {/* Goong Autocomplete Search */}
              {goongApiKey && goongApiKey !== 'YOUR_GOONG_API_KEY_HERE' ? (
                <div className="relative space-y-1.5 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🔎 Tìm nhanh bằng bản đồ (Goong Map)</label>
                  <input
                    type="text"
                    placeholder="Nhập tên địa điểm, số nhà, tên đường..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                    className="w-full border border-slate-200 rounded-lg p-3 pr-10 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 bg-white transition-all text-xs"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3.5 top-[30px] w-4 h-4 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin"></div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {suggestions.map((p: any) => (
                        <div
                          key={p.place_id}
                          onClick={() => handleSelectGoongSuggestion(p.place_id)}
                          className="px-4 py-3 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition text-left"
                        >
                          <span className="font-extrabold text-slate-805">{p.structured_formatting.main_text}</span>
                          <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold p-3 rounded-lg leading-normal">
                  ⚠️ Goong API Key chưa được cài đặt trong .env (VITE_GOONG_API_KEY). Bạn có thể tự điền các trường địa chỉ thủ công bên dưới.
                </div>
              )}

              {/* Họ và tên & Số điện thoại in 2 columns */}
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
                      setFormPhone(e.target.value);
                      if (phoneError) setPhoneError('');
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

              {/* Tỉnh / Thành phố */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chọn Tỉnh/Thành Phố"
                  value={chosenProvince}
                  onChange={(e) => {
                    setChosenProvince(e.target.value)
                    setShowRegionDropdown(true)
                    setFormRegion(e.target.value)
                  }}
                  onFocus={() => {
                    setShowRegionDropdown(true)
                    setShowDistrictDropdown(false)
                    setShowWardDropdown(false)
                  }}
                  onBlur={() => setTimeout(() => setShowRegionDropdown(false), 200)}
                  className="w-full border border-slate-202 rounded-lg p-3.5 pr-10 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 bg-white text-sm"
                />
                <div 
                  onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                  className="absolute inset-y-0 right-3.5 flex items-center cursor-pointer text-slate-400 text-xs"
                >
                  ▼
                </div>
                {showRegionDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {(() => {
                      const query = removeVietnameseTones(chosenProvince).toLowerCase().trim()
                      const filteredProvinces = VIETNAM_PROVINCES.filter(province => {
                        if (!query) return true
                        return removeVietnameseTones(province).toLowerCase().includes(query)
                      })

                      if (filteredProvinces.length === 0) {
                        return (
                          <div className="px-4 py-3 text-xs text-slate-400 font-medium text-left">
                            Không tìm thấy tỉnh thành phù hợp.
                          </div>
                        )
                      }

                      return filteredProvinces.map((prov) => (
                        <div
                          key={prov}
                          onClick={() => {
                            handleSelectProvince(prov)
                          }}
                          className="px-4 py-3 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition text-left"
                        >
                          {prov}
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>

              {/* Quận / Huyện */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={chosenProvince ? "Nhập tên Quận/Huyện để tìm..." : "Vui lòng chọn Tỉnh/Thành Phố trước"}
                  value={districtQuery}
                  disabled={!chosenProvince}
                  onChange={(e) => {
                    setDistrictQuery(e.target.value)
                    setShowDistrictDropdown(true)
                  }}
                  onFocus={() => {
                    if (chosenProvince) {
                      setShowDistrictDropdown(true)
                      setShowRegionDropdown(false)
                      setShowWardDropdown(false)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowDistrictDropdown(false), 200)}
                  className="w-full border border-slate-202 rounded-lg p-3.5 pr-10 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 bg-white text-sm"
                />
                {loadingDistrict && (
                  <div className="absolute right-3.5 top-[18px] w-4 h-4 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin"></div>
                )}
                {showDistrictDropdown && chosenProvince && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {!districtQuery.trim() ? (
                      <div className="px-4 py-3 text-xs text-slate-400 font-medium text-left">
                        Vui lòng nhập tên Quận/Huyện (ví dụ: Biên Hòa) để tìm kiếm bằng Goong Map.
                      </div>
                    ) : districtSuggestions.length === 0 && !loadingDistrict ? (
                      <div className="px-4 py-3 text-xs text-slate-400 font-medium text-left">
                        Không tìm thấy quận huyện nào.
                      </div>
                    ) : (
                      districtSuggestions.map((sug: any) => (
                        <div
                          key={sug.place_id}
                          onClick={() => {
                            handleSelectDistrictSuggestion(sug.place_id)
                          }}
                          className="px-4 py-3 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition text-left"
                        >
                          <span className="font-extrabold text-slate-805">{sug.structured_formatting.main_text}</span>
                          {sug.structured_formatting.secondary_text && (
                            <span className="text-slate-400 font-normal ml-1">({sug.structured_formatting.secondary_text})</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Phường / Xã */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={chosenDistrict ? "Nhập tên Phường/Xã để tìm..." : "Vui lòng chọn Quận/Huyện trước"}
                  value={wardQuery}
                  disabled={!chosenDistrict}
                  onChange={(e) => {
                    setWardQuery(e.target.value)
                    setShowWardDropdown(true)
                  }}
                  onFocus={() => {
                    if (chosenDistrict) {
                      setShowWardDropdown(true)
                      setShowRegionDropdown(false)
                      setShowDistrictDropdown(false)
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowWardDropdown(false), 200)}
                  className="w-full border border-slate-202 rounded-lg p-3.5 pr-10 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 bg-white text-sm"
                />
                {loadingWard && (
                  <div className="absolute right-3.5 top-[18px] w-4 h-4 border-2 border-[#ee4d2d] border-t-transparent rounded-full animate-spin"></div>
                )}
                {showWardDropdown && chosenDistrict && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {!wardQuery.trim() ? (
                      <div className="px-4 py-3 text-xs text-slate-400 font-medium text-left">
                        Vui lòng nhập tên Phường/Xã (ví dụ: Tân Biên) để tìm kiếm bằng Goong Map.
                      </div>
                    ) : wardSuggestions.length === 0 && !loadingWard ? (
                      <div className="px-4 py-3 text-xs text-slate-400 font-medium text-left">
                        Không tìm thấy phường xã nào.
                      </div>
                    ) : (
                      wardSuggestions.map((sug: any) => (
                        <div
                          key={sug.place_id}
                          onClick={() => {
                            handleSelectWardSuggestion(sug.place_id)
                          }}
                          className="px-4 py-3 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer transition text-left"
                        >
                          <span className="font-extrabold text-slate-805">{sug.structured_formatting.main_text}</span>
                          {sug.structured_formatting.secondary_text && (
                            <span className="text-slate-400 font-normal ml-1">({sug.structured_formatting.secondary_text})</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Specific Address Input */}
              <div className="relative">
                <textarea
                  placeholder="Địa chỉ cụ thể"
                  rows={2}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full border border-slate-202 rounded-lg p-3.5 focus:border-[#ee4d2d] focus:outline-none font-medium text-slate-800 bg-white transition-all text-sm"
                />
              </div>

              {/* Map Pin Alert & Leaflet Map Container */}
              <div className="space-y-3 pt-1">
                <div className="bg-[#fff9e6] border border-[#ffe699] rounded-xl p-4 flex items-start gap-3 text-xs text-[#b38600] leading-normal text-left">
                  <span className="text-base mt-0.5">🔔</span>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[#997300] text-sm">Vui lòng ghim địa chỉ chính xác</p>
                    <p className="text-[#806000]/90 font-medium">Hãy chắc chắn vị trí trên bản đồ được ghim đúng để Shopee gửi hàng cho bạn nhé!</p>
                  </div>
                </div>

                {/* Leaflet Interactive Map Selector */}
                <div id="leaflet-map-selector-modal" className="relative h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-202 z-10">
                  {/* Leaflet instance mounts here */}
                </div>
              </div>

              {/* Set as default checkbox */}
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
                    resetAddressForm();
                    setAddressModalTab('form');
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
