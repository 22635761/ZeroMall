import React, { useState, useEffect } from 'react'
import type { LatLngCoords } from './types'

interface AddressMapPickerProps {
  goongApiKey: string
  mapCoords: LatLngCoords
  setMapCoords: (coords: LatLngCoords) => void
  mapZoom?: number
  onAddressMatched: (prov: string, dist: string, ward: string, fullAddress?: string) => void
  isActiveTab: boolean
}

export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  goongApiKey,
  mapCoords,
  setMapCoords,
  mapZoom = 15,
  onAddressMatched,
  isActiveTab
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)

  // 1. Goong autocomplete suggestions
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
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, goongApiKey])

  // 2. Leaflet Map initialization and cleanup
  useEffect(() => {
    if (!isActiveTab) {
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

      const container = document.getElementById('leaflet-map-selector-modal')
      if (!container) return

      const map = L.map(container, {
        zoomControl: false
      }).setView([mapCoords.lat, mapCoords.lng], mapZoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      const marker = L.marker([mapCoords.lat, mapCoords.lng], {
        draggable: true
      }).addTo(map)

      setMapInstance(map)
      setMapMarker(marker)

      const reverseGeocode = (lat: number, lng: number) => {
        if (!goongApiKey || goongApiKey === 'YOUR_GOONG_API_KEY_HERE') return

        fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${goongApiKey}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.results && data.results.length > 0) {
              const firstResult = data.results[0]
              const compound = firstResult.compound || {}
              const prov = compound.province || ''
              const dist = compound.district || ''
              const wrd = compound.commune || ''

              onAddressMatched(prov, dist, wrd, firstResult.formatted_address || '')
            }
          })
          .catch((err) => {
            console.error('Error reverse geocoding:', err)
          })
      }

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setMapCoords({ lat: pos.lat, lng: pos.lng })
        reverseGeocode(pos.lat, pos.lng)
      })

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
  }, [isActiveTab])

  // 3. Tự động flyTo vị trí khi mapCoords hoặc mapZoom thay đổi (khi người dùng chọn Tỉnh / Quận / Phường)
  useEffect(() => {
    if (!mapInstance || !mapMarker || !mapCoords) return

    const curCenter = mapInstance.getCenter()
    const dist = Math.hypot(curCenter.lat - mapCoords.lat, curCenter.lng - mapCoords.lng)

    // Nếu khoảng cách thay đổi đáng kể (> 0.0005 deg ~ 50m), thực hiện flyTo mượt mà
    if (dist > 0.0005) {
      mapInstance.flyTo([mapCoords.lat, mapCoords.lng], mapZoom, {
        duration: 1.2
      })
      mapMarker.setLatLng([mapCoords.lat, mapCoords.lng])
    }
  }, [mapCoords.lat, mapCoords.lng, mapZoom, mapInstance, mapMarker])

  // 4. Khi người dùng chọn kết quả gợi ý từ Goong AutoComplete
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

          onAddressMatched(prov, dist, wrd, result.formatted_address || '')

          if (result.geometry && result.geometry.location) {
            const loc = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng
            }
            setMapCoords(loc)

            if (mapInstance && mapMarker) {
              mapInstance.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 })
              mapMarker.setLatLng([loc.lat, loc.lng])
            }
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching suggestion detail:', err)
      })
  }

  return (
    <div className="space-y-4">
      {/* Goong Autocomplete Search */}
      {goongApiKey && goongApiKey !== 'YOUR_GOONG_API_KEY_HERE' ? (
        <div className="relative space-y-1.5 text-xs">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            🔎 Tìm nhanh bằng bản đồ (Goong Map)
          </label>
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
                  {p.structured_formatting.secondary_text && (
                    <span className="text-slate-400 font-normal ml-1">({p.structured_formatting.secondary_text})</span>
                  )}
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

      {/* Map Pin Alert & Leaflet Map Container */}
      <div className="space-y-3 pt-1">
        <div className="bg-[#fff9e6] border border-[#ffe699] rounded-xl p-4 flex items-start gap-3 text-xs text-[#b38600] leading-normal text-left">
          <span className="text-base mt-0.5">🔔</span>
          <div className="space-y-0.5">
            <p className="font-bold text-[#997300] text-sm">Vui lòng ghim địa chỉ chính xác</p>
            <p className="text-[#806000]/90 font-medium">
              Hãy chắc chắn vị trí trên bản đồ được ghim đúng để Shopee gửi hàng cho bạn nhé!
            </p>
          </div>
        </div>

        {/* Leaflet Interactive Map Selector */}
        <div
          id="leaflet-map-selector-modal"
          className="relative h-44 bg-slate-100 rounded-xl overflow-hidden border border-slate-202 z-10"
        />
      </div>
    </div>
  )
}
