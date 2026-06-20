import React, { useState, useEffect } from 'react'

interface Address {
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

interface ShopOnboardingProps {
  user: any
  initialShopDetails?: any
  onSuccess: (updatedShop: any) => void
  onBackToHome: () => void
}

export const ShopOnboarding: React.FC<ShopOnboardingProps> = ({
  user,
  initialShopDetails,
  onSuccess,
  onBackToHome
}) => {
  const [currentStep, setCurrentStep] = useState(1) // 1 to 5
  
  // Step 1: Shop Info states
  const [shopName, setShopName] = useState(() => {
    return initialShopDetails?.name || user?.shopName || ''
  })
  const [email, setEmail] = useState(() => {
    return initialShopDetails?.email || user?.email || ''
  })
  const [phone, setPhone] = useState(() => {
    return initialShopDetails?.phoneNumber || user?.phoneNumber || ''
  })
  const [pickupAddress, setPickupAddress] = useState<Address | null>(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        return typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
      } catch (e) {
        console.error('Error parsing initial pickup address:', e)
      }
    }
    return null
  })
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  
  // Step 2: Shipping states
  const [shippingMethods, setShippingMethods] = useState(() => {
    if (initialShopDetails?.shippingSettings) {
      try {
        return typeof initialShopDetails.shippingSettings === 'string'
          ? JSON.parse(initialShopDetails.shippingSettings)
          : initialShopDetails.shippingSettings
      } catch (e) {
        console.error('Error parsing initial shipping settings:', e)
      }
    }
    return {
      express: true, // Hỏa Tốc
      fast: true,    // Nhanh
      saver: true,   // Tiết kiệm
      bulky: false   // Hàng cồng kềnh
    }
  })
  
  // Address Modal Fields
  const [modalName, setModalName] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.fullName || user?.name || ''
      } catch (e) {}
    }
    return user?.name || ''
  })
  const [modalPhone, setModalPhone] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.phoneNumber || ''
      } catch (e) {}
    }
    return ''
  })
  const [modalProvince, setModalProvince] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.province || ''
      } catch (e) {}
    }
    return ''
  })
  const [modalDistrict, setModalDistrict] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.district || ''
      } catch (e) {}
    }
    return ''
  })
  const [modalWard, setModalWard] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.ward || ''
      } catch (e) {}
    }
    return ''
  })
  const [modalDetailAddress, setModalDetailAddress] = useState(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.detailAddress || ''
      } catch (e) {}
    }
    return ''
  })
  const [modalCoordinates, setModalCoordinates] = useState<{ lat: number; lng: number } | undefined>(() => {
    if (initialShopDetails?.pickupAddress) {
      try {
        const addr = typeof initialShopDetails.pickupAddress === 'string'
          ? JSON.parse(initialShopDetails.pickupAddress)
          : initialShopDetails.pickupAddress
        return addr?.coordinates || undefined
      } catch (e) {}
    }
    return undefined
  })
  
  // Goong API states
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const goongApiKey = import.meta.env.VITE_GOONG_API_KEY || ''

  // Leaflet Map states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)
  const [selectedMapCoords, setSelectedMapCoords] = useState<{ lat: number; lng: number }>({ lat: 10.762622, lng: 106.660172 })
  const [selectedMapAddress, setSelectedMapAddress] = useState<string>('')
  const [selectedMapCompound, setSelectedMapCompound] = useState<any>({ province: '', district: '', ward: '', detail: '' })
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSuggestions, setMapSuggestions] = useState<any[]>([])
  const [mapSearchLoading, setMapSearchLoading] = useState(false)
  
  // Load suggestions from Goong autocomplete API
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

  const handleSelectSuggestion = (placeId: string) => {
    if (!goongApiKey) return
    setLoadingSuggestions(true)
    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'OK' && data.result) {
          const result = data.result
          const compound = result.compound || {}
          
          setModalProvince(compound.province || '')
          setModalDistrict(compound.district || '')
          setModalWard(compound.commune || '')
          setModalDetailAddress(result.formatted_address || '')
          
          if (result.geometry && result.geometry.location) {
            setModalCoordinates({
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            })
          }
          setSuggestions([])
          setSearchQuery('')
        }
      })
      .catch((err) => {
        console.error('Error fetching Goong place details:', err)
      })
      .finally(() => {
        setLoadingSuggestions(false)
      })
  }

  // Reverse Geocoding via Goong
  const reverseGeocode = (lat: number, lng: number) => {
    if (!goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setSelectedMapAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Goong API key chưa cấu hình)`)
      return
    }

    fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          const firstResult = data.results[0]
          setSelectedMapAddress(firstResult.formatted_address || '')
          
          const compound = firstResult.compound || {}
          setSelectedMapCompound({
            province: compound.province || '',
            district: compound.district || '',
            ward: compound.commune || '',
            detail: firstResult.formatted_address || ''
          })
        } else {
          setSelectedMapAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
        }
      })
      .catch((err) => {
        console.error('Error reverse geocoding:', err)
        setSelectedMapAddress(`Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      })
  }

  // Load map suggestions from Goong Autocomplete
  useEffect(() => {
    if (!mapSearchQuery.trim() || !goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') {
      setMapSuggestions([])
      return
    }
    
    const delayDebounceFn = setTimeout(() => {
      setMapSearchLoading(true)
      fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${goongApiKey}&input=${encodeURIComponent(mapSearchQuery)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'OK' && data.predictions) {
            setMapSuggestions(data.predictions)
          } else {
            setMapSuggestions([])
          }
        })
        .catch((err) => {
          console.error('Error autocomplete map search:', err)
          setMapSuggestions([])
        })
        .finally(() => {
          setMapSearchLoading(false)
        })
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [mapSearchQuery, goongApiKey])

  // Map Instance Initializer
  useEffect(() => {
    if (!isMapModalOpen) {
      setMapInstance(null)
      setMapMarker(null)
      return
    }

    const timer = setTimeout(() => {
      const L = (window as any).L
      if (!L) {
        console.error('Leaflet is not loaded!')
        return
      }

      // Initial coordinates: try to use modalCoordinates, or default to HCMC
      const initCoords = modalCoordinates || { lat: 10.762622, lng: 106.660172 }
      setSelectedMapCoords(initCoords)

      // Create map
      const map = L.map('leaflet-map-selector', {
        zoomControl: false
      }).setView([initCoords.lat, initCoords.lng], 15)

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)

      // Add Zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map)

      // Create draggable marker
      const marker = L.marker([initCoords.lat, initCoords.lng], {
        draggable: true
      }).addTo(map)

      setMapInstance(map)
      setMapMarker(marker)

      // Fetch geocode for initial location
      reverseGeocode(initCoords.lat, initCoords.lng)

      // Handle marker drag end
      marker.on('dragend', () => {
         const position = marker.getLatLng()
         setSelectedMapCoords({ lat: position.lat, lng: position.lng })
         reverseGeocode(position.lat, position.lng)
      })

      // Handle map click
      map.on('click', (e: any) => {
         const clickCoords = e.latlng
         marker.setLatLng(clickCoords)
         setSelectedMapCoords({ lat: clickCoords.lat, lng: clickCoords.lng })
         reverseGeocode(clickCoords.lat, clickCoords.lng)
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [isMapModalOpen])

  const handleSelectMapSuggestion = (placeId: string) => {
    if (!goongApiKey) return
    setMapSearchLoading(true)
    fetch(`https://rsapi.goong.io/Place/Detail?api_key=${goongApiKey}&place_id=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
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
          
          if (result.geometry && result.geometry.location) {
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
          setMapSuggestions([])
          setMapSearchQuery('')
        }
      })
      .catch((err) => {
        console.error('Error place detail in map search:', err)
      })
      .finally(() => {
        setMapSearchLoading(false)
      })
  }

  const handleMapLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        }
        setSelectedMapCoords(coords)
        if (mapInstance && mapMarker) {
          mapInstance.setView([coords.lat, coords.lng], 16)
          mapMarker.setLatLng([coords.lat, coords.lng])
        }
        reverseGeocode(coords.lat, coords.lng)
      },
      () => {
        const coords = {
          lat: 10.762622 + (Math.random() - 0.5) * 0.1,
          lng: 106.660172 + (Math.random() - 0.5) * 0.1
        }
        setSelectedMapCoords(coords)
        if (mapInstance && mapMarker) {
          mapInstance.setView([coords.lat, coords.lng], 16)
          mapMarker.setLatLng([coords.lat, coords.lng])
        }
        reverseGeocode(coords.lat, coords.lng)
      }
    )
  }

  const handleConfirmMapSelection = () => {
    setModalProvince(selectedMapCompound.province)
    setModalDistrict(selectedMapCompound.district)
    setModalWard(selectedMapCompound.ward)
    setModalDetailAddress(selectedMapCompound.detail)
    setModalCoordinates(selectedMapCoords)
    setIsMapModalOpen(false)
  }

  // Handle Save Address in Modal
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalName.trim() || !modalPhone.trim() || !modalProvince.trim() || !modalDistrict.trim() || !modalWard.trim() || !modalDetailAddress.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin địa chỉ!')
      return
    }
    
    setPickupAddress({
      fullName: modalName,
      phoneNumber: modalPhone,
      province: modalProvince,
      district: modalDistrict,
      ward: modalWard,
      detailAddress: modalDetailAddress,
      coordinates: modalCoordinates
    })
    setIsAddressModalOpen(false)
  }

  // Handle Submit Onboarding
  const handleSubmitOnboarding = async () => {
    if (!user?.shopId) return
    try {
      const response = await fetch(`http://localhost:8000/auth/shops/${user.shopId}/onboarding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phoneNumber: phone,
          pickupAddress: JSON.stringify(pickupAddress),
          shippingSettings: JSON.stringify(shippingMethods)
        })
      })

      if (!response.ok) throw new Error('Không thể gửi thông tin đăng ký shop')
      const updatedShop = await response.json()
      onSuccess(updatedShop)
    } catch (err: any) {
      alert(`Đã xảy ra lỗi: ${err.message}`)
    }
  }

  const stepsList = [
    { num: 1, name: 'Thông tin Shop' },
    { num: 2, name: 'Cài đặt vận chuyển' },
    { num: 3, name: 'Thông tin thuế' },
    { num: 4, name: 'Thông tin định danh' },
    { num: 5, name: 'Hoàn tất' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 font-sans text-left">
      {/* Mini Header */}
      <header className="bg-white border-b border-slate-200/80 py-4 shadow-3xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
            <span className="text-2xl">🌱</span>
            <span className="text-lg font-black tracking-tight text-slate-800">
              Zero<span className="text-emerald-600">Mall</span> 
              <span className="text-slate-400 font-normal text-sm ml-2">Đăng Ký Người Bán</span>
            </span>
          </div>
          <button 
            onClick={onBackToHome}
            className="text-xs font-semibold text-slate-500 hover:text-red-500 transition cursor-pointer"
          >
            🏠 Thoát ra ngoài
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8 sm:py-12">
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden flex flex-col justify-between">
          
          {/* Stepper Header */}
          <div className="bg-slate-50/50 border-b border-slate-100 p-6 sm:p-8">
            <div className="relative flex items-center justify-between">
              {/* Stepper Bar Background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-1"></div>
              {/* Active Progress Bar */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 -z-1"
                style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
              ></div>
              
              {stepsList.map((step) => {
                const isActive = step.num === currentStep
                const isCompleted = step.num < currentStep
                return (
                  <div key={step.num} className="flex flex-col items-center relative">
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isActive 
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-50 shadow-md'
                          : isCompleted 
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : step.num}
                    </div>
                    <span 
                      className={`text-[9px] sm:text-[10px] font-bold mt-2 uppercase tracking-wider text-center max-w-[80px] leading-tight ${
                        isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stepper Content */}
          <div className="p-6 sm:p-10 min-h-[350px]">
            
            {/* STEP 1: SHOP INFO */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Cửa Hàng</h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Vui lòng cung cấp các thông tin cơ bản cho cửa hàng của bạn để người mua có thể liên lạc và vận chuyển đơn hàng.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Shop Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên Shop <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      maxLength={30}
                      placeholder="Nhập tên shop..."
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                    <div className="text-[10px] text-slate-400 text-right">{shopName.length}/30</div>
                  </div>

                  {/* Pickup Address */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Địa chỉ lấy hàng <span className="text-red-500">*</span></label>
                    {pickupAddress ? (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex justify-between items-start">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-700">{pickupAddress.fullName} | {pickupAddress.phoneNumber}</p>
                          <p className="text-slate-500 text-[11px] leading-relaxed">
                            {pickupAddress.detailAddress}, {pickupAddress.ward}, {pickupAddress.district}, {pickupAddress.province}
                          </p>
                          {pickupAddress.coordinates && (
                            <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-sm mt-1">
                              📍 Đã định vị
                            </span>
                          )}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setIsAddressModalOpen(true)}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Thay đổi
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddressModalOpen(true)}
                        className="w-full border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-400 hover:text-emerald-600 transition"
                      >
                        <span className="text-xl">➕</span>
                        <span className="text-xs font-bold">Thêm địa chỉ lấy hàng mới</span>
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email liên hệ <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      placeholder="shop@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="09xxxxxxxx..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SHIPPING SETTINGS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <h2 className="text-lg font-black text-slate-800">Cài Đặt Phương Thức Vận Chuyển</h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Kích hoạt các phương thức vận chuyển phù hợp mà shop bạn có hỗ trợ giao nhận sản phẩm.
                  </p>
                </div>

                <div className="space-y-4 border border-slate-100 rounded-2xl p-5 bg-slate-50/20">
                  {/* Express */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Hỏa Tốc</p>
                      <p className="text-[10px] text-slate-400">Giao hàng cực nhanh trong vòng 1-2 tiếng</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.express}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, express: !prev.express }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Fast */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Nhanh</p>
                      <p className="text-[10px] text-slate-400">Phương thức giao hàng mặc định thông dụng nhất</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.fast}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, fast: !prev.fast }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Saver */}
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Tiết Kiệm</p>
                      <p className="text-[10px] text-slate-400 font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-sm px-1.5 py-0.5 w-fit scale-90 origin-left">Phổ biến nhất</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.saver}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, saver: !prev.saver }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Bulky */}
                  <div className="flex justify-between items-center py-2.5">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-800 text-xs">Hàng Cồng Kềnh</p>
                      <p className="text-[10px] text-slate-400">Dành riêng cho sản phẩm có kích thước lớn hoặc nặng</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={shippingMethods.bulky}
                        onChange={() => setShippingMethods((prev: any) => ({ ...prev, bulky: !prev.bulky }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-4 after:width-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: TAX INFO (SKIPPED) */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-10">
                <span className="text-5xl">📄</span>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Thuế</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Theo quy định của sàn, thông tin thuế sẽ giúp tự động hóa hóa đơn và nghĩa vụ tài chính.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold p-3.5 rounded-xl mt-4">
                    ℹ️ Bước này hiện không bắt buộc trên môi trường Demo. Bạn có thể bấm <strong>Tiếp theo</strong> để bỏ qua.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: IDENTITY INFO (SKIPPED) */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-10">
                <span className="text-5xl">🆔</span>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-lg font-black text-slate-800">Thông Tin Định Danh</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Xác minh căn cước công dân và thông tin chủ sở hữu doanh nghiệp để bảo mật tài khoản.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold p-3.5 rounded-xl mt-4">
                    ℹ️ Bước này hiện không bắt buộc trên môi trường Demo. Bạn có thể bấm <strong>Tiếp theo</strong> để bỏ qua.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: COMPLETION */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1.5 text-center">
                  <span className="text-5xl">🎉</span>
                  <h2 className="text-lg font-black text-slate-800 mt-2">Hoàn Tất Đăng Ký</h2>
                  <p className="text-xs text-slate-400">Xem lại tóm tắt thông tin shop của bạn trước khi gửi duyệt.</p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30 text-xs font-semibold space-y-3.5 max-w-xl mx-auto">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Tên Cửa Hàng:</span>
                    <span className="text-slate-800">{shopName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Email Shop:</span>
                    <span className="text-slate-800">{email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400">Số Điện Thoại:</span>
                    <span className="text-slate-800">{phone}</span>
                  </div>
                  <div className="flex justify-between items-start py-1 border-b border-slate-50 gap-4">
                    <span className="text-slate-400 shrink-0">Địa Chỉ Lấy Hàng:</span>
                    <span className="text-slate-800 text-right">
                      {pickupAddress?.detailAddress}, {pickupAddress?.ward}, {pickupAddress?.district}, {pickupAddress?.province}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-1 gap-4">
                    <span className="text-slate-400 shrink-0">Vận Chuyển Kích Hoạt:</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {shippingMethods.express && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Hỏa Tốc</span>}
                      {shippingMethods.fast && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Nhanh</span>}
                      {shippingMethods.saver && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Tiết Kiệm</span>}
                      {shippingMethods.bulky && <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-sm text-[10px]">Hàng Cồng Kềnh</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Stepper Footer Controls */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Quay lại
            </button>

            {currentStep < 5 ? (
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    if (!shopName.trim() || !email.trim() || !phone.trim() || !pickupAddress) {
                      alert('Vui lòng hoàn thành tất cả thông tin và thêm địa chỉ lấy hàng trước khi tiếp tục!')
                      return
                    }
                  }
                  setCurrentStep((prev) => prev + 1)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Tiếp theo
              </button>
            ) : (
              <button
                onClick={handleSubmitOnboarding}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Gửi cho Admin duyệt 🚀
              </button>
            )}
          </div>

        </div>
      </main>

      {/* --- ADD ADDRESS MODAL --- */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 relative text-left">
              <h2 className="font-extrabold text-base text-slate-800">Thêm Địa Chỉ Mới</h2>
              <button 
                onClick={() => setIsAddressModalOpen(false)}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveAddress} className="p-6 space-y-4 text-left overflow-y-auto max-h-[70vh]">
              {/* Goong Autocomplete Search */}
              {goongApiKey && goongApiKey !== 'YOUR_GOONG_API_KEY_HERE' ? (
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">🔎 Tìm nhanh bằng bản đồ (Goong Map)</label>
                  <input 
                    type="text" 
                    placeholder="Nhập tên địa điểm, số nhà, tên đường..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-slate-250 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                  {loadingSuggestions && (
                    <div className="absolute right-3.5 top-[27px] w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-14 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {suggestions.map((p) => (
                        <div 
                          key={p.place_id} 
                          onClick={() => handleSelectSuggestion(p.place_id)}
                          className="px-4 py-2.5 hover:bg-slate-50 text-[11px] font-semibold text-slate-650 cursor-pointer transition"
                        >
                          <span className="font-bold text-slate-800">{p.structured_formatting.main_text}</span>
                          <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold p-2.5 rounded-lg">
                  ⚠️ Goong API Key chưa được cài đặt trong .env (VITE_GOONG_API_KEY). Bạn có thể tự điền các trường địa chỉ thủ công bên dưới.
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Họ & Tên</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: Đặng Tuyết..."
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số điện thoại</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ví dụ: 093xxxxxx..."
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Province, District, Ward */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-xl border border-slate-100">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Địa chỉ vùng miền</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 font-bold">Tỉnh/Thành phố</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Thành phố..."
                      value={modalProvince}
                      onChange={(e) => setModalProvince(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 font-bold">Quận/Huyện</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Quận/Huyện..."
                      value={modalDistrict}
                      onChange={(e) => setModalDistrict(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 font-bold">Phường/Xã</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Phường/Xã..."
                      value={modalWard}
                      onChange={(e) => setModalWard(e.target.value)}
                      className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Detailed Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Địa chỉ chi tiết (Số nhà, đường...)</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Ví dụ: 123 Đường Lê Lợi..."
                  value={modalDetailAddress}
                  onChange={(e) => setModalDetailAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* GPS Positioning Status */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="text-lg">📍</span>
                <div className="flex-1 text-[10px]">
                  <p className="font-bold text-slate-700">Định vị & Bản đồ địa lý</p>
                  <p className="text-slate-400">Định vị GPS tự động hoặc chọn vị trí trực quan trên bản đồ</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMapModalOpen(true)}
                    className="bg-white border border-slate-250 text-slate-650 hover:text-emerald-600 hover:border-emerald-500/30 px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer flex items-center gap-1"
                  >
                    🗺️ Chọn trên bản đồ
                  </button>
                  {modalCoordinates ? (
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center justify-center">
                      Đã Khớp
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        // Get location of user manually or generate mock
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setModalCoordinates({
                              lat: pos.coords.latitude,
                              lng: pos.coords.longitude
                            })
                          },
                          () => {
                            // Fallback to random coordinates for testing
                            setModalCoordinates({
                              lat: 10.762622 + (Math.random() - 0.5) * 0.1,
                              lng: 106.660172 + (Math.random() - 0.5) * 0.1
                            })
                          }
                        )
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-extrabold transition cursor-pointer"
                    >
                      Định vị GPS
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-250 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
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
      )}

      {/* --- SELECT LOCATION ON MAP MODAL --- */}
      {isMapModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[120] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col h-[75vh] relative animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center relative bg-white shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800">Chọn địa điểm</h3>
              <button 
                onClick={() => setIsMapModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-655 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative bg-slate-100 h-full overflow-hidden">
              {/* Map div */}
              <div id="leaflet-map-selector" className="w-full h-full z-10"></div>

              {/* Absolute Search Positioned inside Map */}
              <div className="absolute top-4 left-4 z-20 w-72 sm:w-80">
                <div className="relative shadow-md rounded-xl overflow-hidden border border-slate-200">
                  <input 
                    type="text" 
                    placeholder="Nhập vị trí..."
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
                        onClick={() => handleSelectMapSuggestion(p.place_id)}
                        className="px-4 py-2.5 hover:bg-slate-50 text-[11px] font-semibold text-slate-650 cursor-pointer transition text-left"
                      >
                        <span className="font-bold text-slate-800">{p.structured_formatting.main_text}</span>
                        <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Absolute Locate Me Button */}
              <button
                type="button"
                onClick={handleMapLocateMe}
                className="absolute top-4 right-4 z-20 bg-[#ee4d2d] hover:bg-[#d63c1e] text-white text-[10px] font-bold px-3 py-2 rounded-lg shadow-md transition cursor-pointer"
              >
                Định vị địa điểm của tôi
              </button>

              {/* Absolute Overlay Confirm Card */}
              <div className="absolute bottom-4 left-4 right-4 md:left-8 md:right-8 z-20 bg-white/95 backdrop-blur-xs rounded-2xl p-4 shadow-xl border border-slate-200/50 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start gap-2.5 text-left flex-1">
                  <span className="text-xl shrink-0">📍</span>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-black text-slate-700">Địa điểm đã chọn</p>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-sm sm:max-w-md">
                      {selectedMapAddress || 'Đang lấy địa chỉ...'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmMapSelection}
                  className="w-full sm:w-auto bg-[#ee4d2d] hover:bg-[#d63c1e] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition shrink-0 cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-400">
        © 2026 ZeroMall. Hệ Thống Đăng Ký Người Bán Chuyên Nghiệp.
      </footer>
    </div>
  )
}
