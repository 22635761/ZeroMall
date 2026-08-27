import React, { useEffect, useRef } from 'react'

declare const L: any

interface LiveMapTrackingProps {
  trackingData: any
  goongApiKey?: string
}

export const LiveMapTracking: React.FC<LiveMapTrackingProps> = ({ trackingData, goongApiKey }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Danh mục tọa độ chuẩn của các Hub & Tỉnh Thành tại Việt Nam
  const LOCATION_COORDS: { [key: string]: [number, number] } = {
    'Tân Bình': [10.8014, 106.6538],
    'Hồ Chí Minh': [10.7769, 106.7009],
    'Sài Gòn': [10.7769, 106.7009],
    'Quận 1': [10.7756, 106.7004],
    'Quận 10': [10.7716, 106.6672],
    'Biên Hòa': [10.9574, 106.8427],
    'Đồng Nai': [10.9574, 106.8427],
    'Mê Linh': [21.1837, 105.7196],
    'Hà Nội': [21.0285, 105.8542],
    'Cầu Giấy': [21.0333, 105.7939],
    'An Giang': [10.3759, 105.4185],
    'hub-hcm-01': [10.8014, 106.6538], // Kho Tổng Tân Bình SOC (TP.HCM)
    'hub-dn-01': [10.9574, 106.8427],  // Bưu Cục Biên Hòa Hub (Đồng Nai)
    'hub-hn-01': [21.1837, 105.7196],  // Kho Trung Chuyển Mê Linh SOC (Hà Nội)
  }

  const resolveCoords = (text: string, defaultCoords: [number, number]): [number, number] => {
    if (!text) return defaultCoords
    for (const [name, coords] of Object.entries(LOCATION_COORDS)) {
      if (text.toLowerCase().includes(name.toLowerCase())) {
        return coords
      }
    }
    return defaultCoords
  }

  useEffect(() => {
    if (!mapContainerRef.current || typeof L === 'undefined') return

    // 1. Tọa độ & Địa chỉ Điểm Gửi (Đọc từ địa chỉ kho thực tế của Shop)
    const rawPickupAddress = trackingData.pickupAddress?.address || trackingData.sellerPickupAddress || ''
    let pickupProvince = 'TP. Hồ Chí Minh'
    let pickupDistrict = 'Tân Bình'
    let originCoords: [number, number] = [10.8014, 106.6538] // Mặc định Tân Bình SOC

    if (rawPickupAddress) {
      originCoords = resolveCoords(rawPickupAddress, [10.8014, 106.6538])
      if (rawPickupAddress.toLowerCase().includes('biên hòa') || rawPickupAddress.toLowerCase().includes('đồng nai')) {
        pickupProvince = 'Đồng Nai'
        pickupDistrict = 'Biên Hòa'
        originCoords = [10.9574, 106.8427]
      } else if (rawPickupAddress.toLowerCase().includes('hà nội') || rawPickupAddress.toLowerCase().includes('mê linh')) {
        pickupProvince = 'Hà Nội'
        pickupDistrict = 'Mê Linh'
        originCoords = [21.1837, 105.7196]
      } else if (rawPickupAddress.toLowerCase().includes('phú nhuận')) {
        pickupProvince = 'TP. Hồ Chí Minh'
        pickupDistrict = 'Phú Nhuận'
        originCoords = [10.7981, 106.6800]
      } else if (rawPickupAddress.toLowerCase().includes('gò vấp')) {
        pickupProvince = 'TP. Hồ Chí Minh'
        pickupDistrict = 'Gò Vấp'
        originCoords = [10.8388, 106.6653]
      }
    }
    
    // 2. Tọa độ & Địa chỉ Điểm Nhận (Nhà người mua)
    const rawDeliveryAddress = trackingData.deliveryAddress || ''
    let destProvince = 'Đồng Nai'
    let destDistrict = 'Biên Hòa'
    let destCoords: [number, number] = [10.9574, 106.8427]

    if (rawDeliveryAddress) {
      destCoords = resolveCoords(rawDeliveryAddress, [10.9574, 106.8427])
      if (rawDeliveryAddress.toLowerCase().includes('gò vấp')) {
        destProvince = 'Hồ Chí Minh'
        destDistrict = 'Gò Vấp'
        destCoords = [10.8388, 106.6653]
      } else if (rawDeliveryAddress.toLowerCase().includes('tân bình')) {
        destProvince = 'Hồ Chí Minh'
        destDistrict = 'Tân Bình'
        destCoords = [10.8014, 106.6538]
      } else if (rawDeliveryAddress.toLowerCase().includes('quận 1')) {
        destProvince = 'Hồ Chí Minh'
        destDistrict = 'Quận 1'
        destCoords = [10.7756, 106.7004]
      } else if (rawDeliveryAddress.toLowerCase().includes('phú nhuận')) {
        destProvince = 'Hồ Chí Minh'
        destDistrict = 'Phú Nhuận'
        destCoords = [10.7981, 106.6800]
      } else if (rawDeliveryAddress.toLowerCase().includes('mê linh') || rawDeliveryAddress.toLowerCase().includes('hà nội')) {
        destProvince = 'Hà Nội'
        destDistrict = 'Mê Linh'
        destCoords = [21.1837, 105.7196]
      }
    }

    // 3. Tọa độ Bưu Cục Phát (Hub phát tại tỉnh đích)
    let destHubCoords: [number, number] = destCoords
    let destHubName = `${destDistrict} Hub`
    if (destProvince.includes('Hồ Chí Minh') || destProvince.includes('HCM')) {
      destHubCoords = [10.8014, 106.6538]
      destHubName = 'Tân Bình SOC (TP.HCM)'
    } else if (destProvince.includes('Đồng Nai')) {
      destHubCoords = [10.9574, 106.8427]
      destHubName = 'Biên Hòa Hub'
    } else if (destProvince.includes('Hà Nội')) {
      destHubCoords = [21.1837, 105.7196]
      destHubName = 'Mê Linh SOC'
    }

    const isSameDistrict = originCoords[0] === destCoords[0] && originCoords[1] === destCoords[1]

    // 4. Xác định vị trí kiện hàng đang ở đâu hiện tại
    const status = trackingData.status || 'CREATED'
    let currentCoords: [number, number] = originCoords

    if (status === 'CREATED' || status === 'WAITING_PICKUP') {
      currentCoords = originCoords
    } else if (status === 'PICKUP_ASSIGNED' || status === 'PICKING_UP') {
      // Tài xế đang trên đường đến lấy
      currentCoords = [originCoords[0] + 0.003, originCoords[1] + 0.003]
    } else if (status === 'PICKED_UP') {
      currentCoords = [originCoords[0] + 0.005, originCoords[1] + 0.005]
    } else if (status === 'AT_ORIGIN_HUB' || status === 'SORTING') {
      currentCoords = originCoords
    } else if (status === 'IN_TRANSIT') {
      // Xe tải đang chạy trên đường quốc lộ nối giữa 2 kho
      currentCoords = [
        (originCoords[0] + destCoords[0]) / 2,
        (originCoords[1] + destCoords[1]) / 2,
      ]
    } else if (status === 'AT_DESTINATION_HUB') {
      currentCoords = destHubCoords
    } else if (status === 'OUT_FOR_DELIVERY') {
      // Shipper đang đi giao gần nhà khách
      currentCoords = [destCoords[0] - 0.004, destCoords[1] - 0.004]
    } else if (status === 'DELIVERED') {
      currentCoords = destCoords
    }

    // Khởi tạo Map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(currentCoords, 12)

    mapInstanceRef.current = map

    // Tile Layer: OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Hàm tạo Marker có Chữ & Màu sắc rõ ràng (Badge Label)
    // Hàm tạo Marker có Chữ & Màu sắc rõ ràng (Badge Label)
    const createLabeledMarker = (emoji: string, title: string, subtitle: string, colorClass: string, isCurrent = false) => {
      return L.divIcon({
        className: 'custom-labeled-marker',
        html: `
          <div class="flex flex-col items-center pointer-events-auto cursor-pointer group" style="transform: translate(-50%, -100%);">
            <!-- Label Tag Trên Đầu Marker -->
            <div class="px-2.5 py-1 rounded-xl shadow-lg border text-[11px] font-black whitespace-nowrap mb-1.5 flex items-center gap-1.5 ${
              isCurrent 
                ? 'bg-[#ee4d2d] border-red-300 text-white animate-bounce ring-4 ring-orange-200' 
                : 'bg-white/95 border-slate-300 text-slate-800 backdrop-blur-xs'
            }">
              <span>${emoji}</span>
              <div class="flex flex-col text-left leading-tight">
                <span>${title}</span>
                <span class="text-[9px] ${isCurrent ? 'text-orange-100 font-bold' : 'text-slate-400 font-normal'}">${subtitle}</span>
              </div>
            </div>

            <!-- Pin Icon -->
            <div class="relative flex items-center justify-center">
              ${isCurrent ? '<span class="absolute w-10 h-10 rounded-full bg-orange-400 animate-ping opacity-75"></span>' : ''}
              <div class="w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center shadow-lg border-2 border-white text-sm font-black z-10">
                ${emoji}
              </div>
            </div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })
    }

    // 📍 1. Ghim ĐIỂM GỬI (Kho Người Bán)
    L.marker(originCoords, {
      icon: createLabeledMarker('🏪', `Kho Gửi: ${pickupDistrict}`, `Kho người bán (${pickupProvince})`, 'bg-sky-600', false),
    }).addTo(map).bindPopup(`<b>🏪 Nơi Gửi:</b> Kho Người Bán ZeroMall<br><span style="font-size:11px;color:#666;">${rawPickupAddress || `${pickupDistrict}, ${pickupProvince}`}</span>`)

    // 📍 2. Ghim BƯU CỤC ĐÍCH (nếu đơn hàng khác tỉnh cần luân chuyển qua Hub)
    if (!isSameDistrict) {
      L.marker(destHubCoords, {
        icon: createLabeledMarker('🏢', `Bưu Cục: ${destHubName}`, `Trạm Giao Nhận ${destProvince}`, 'bg-indigo-600', false),
      }).addTo(map).bindPopup(`<b>🏢 Bưu Cục Phát:</b> ${destHubName}<br><span style="font-size:11px;color:#666;">${destDistrict}, ${destProvince}</span>`)
    }

    // 📍 3. Ghim ĐIỂM NHẬN (Nhà Người Mua)
    L.marker(destCoords, {
      icon: createLabeledMarker('🏠', `Điểm Nhận: ${trackingData.buyerName || 'Người Nhận'}`, `${destDistrict}, ${destProvince}`, 'bg-rose-600', false),
    }).addTo(map).bindPopup(`<b>🏠 Nơi Nhận:</b> ${trackingData.buyerName || 'Khách hàng'}<br><span style="font-size:11px;color:#666;">${trackingData.deliveryAddress}</span>`)

    // 📍 4. ⭐ GHIM ICON VỊ TRÍ ĐƠN HÀNG ĐANG NẰM Ở ĐÂU HIỆN TẠI (PACKAGE LIVE PIN) ⭐
    let liveIconEmoji = '📦'
    let liveTitle = 'Vị Trí Đơn Hàng'
    let liveSub = 'Đang đóng gói tại Shop'
    let liveBgColor = 'bg-[#ee4d2d]'

    if (status === 'CREATED' || status === 'WAITING_PICKUP') {
      liveIconEmoji = '📦'
      liveTitle = 'Đơn Hàng Đang Tại Shop'
      liveSub = `Chờ Shipper đến lấy (${pickupDistrict})`
      liveBgColor = 'bg-amber-600'
    } else if (status === 'PICKUP_ASSIGNED' || status === 'PICKING_UP') {
      const driverName = trackingData.assignments?.[0]?.driver?.name || 'Shipper ZMX'
      liveIconEmoji = '🛵'
      liveTitle = `Shipper: ${driverName}`
      liveSub = 'Đang đến Shop lấy hàng'
      liveBgColor = 'bg-orange-600'
    } else if (status === 'PICKED_UP') {
      liveIconEmoji = '📦'
      liveTitle = 'Đã Lấy Hàng'
      liveSub = 'Shipper đang chuyển về bưu cục'
      liveBgColor = 'bg-blue-600'
    } else if (status === 'AT_ORIGIN_HUB' || status === 'SORTING') {
      liveIconEmoji = '🏢'
      liveTitle = 'Đang Tại Bưu Cục Xuất Phát'
      liveSub = `Đang phân loại tại Kho ${pickupDistrict}`
      liveBgColor = 'bg-indigo-600'
    } else if (status === 'IN_TRANSIT') {
      liveIconEmoji = '🚛'
      liveTitle = 'Đang Vận Chuyển Liên Tỉnh'
      liveSub = `Xe tải đang chạy đến ${destHubName}`
      liveBgColor = 'bg-amber-600'
    } else if (status === 'AT_DESTINATION_HUB') {
      liveIconEmoji = '🏢'
      liveTitle = `Đã Tới ${destHubName}`
      liveSub = 'Đang chia tuyến cho Shipper giao'
      liveBgColor = 'bg-indigo-600'
    } else if (status === 'OUT_FOR_DELIVERY') {
      const driverName = trackingData.assignments?.[0]?.driver?.name || 'Shipper ZMX'
      liveIconEmoji = '🛵'
      liveTitle = `Shipper: ${driverName}`
      liveSub = `Đang giao hàng đến bạn (${destDistrict})`
      liveBgColor = 'bg-emerald-600'
    } else if (status === 'DELIVERED') {
      liveIconEmoji = '🎁'
      liveTitle = 'Đã Giao Thành Công'
      liveSub = 'Đã nhận tại địa chỉ của bạn'
      liveBgColor = 'bg-emerald-600'
    }

    // Ghim Marker Live Package
    L.marker(currentCoords, {
      icon: createLabeledMarker(liveIconEmoji, `📍 ${liveTitle}`, liveSub, liveBgColor, true),
      zIndexOffset: 1000,
    }).addTo(map).bindPopup(`
      <div style="font-size:12px;padding:2px;">
        <b style="color:#ee4d2d;">📍 VỊ TRÍ HIỆN TẠI CỦA ĐƠN HÀNG:</b><br>
        <span style="font-weight:bold;color:#1e293b;">${liveTitle}</span><br>
        <span style="color:#64748b;font-size:11px;">${liveSub}</span>
      </div>
    `)

    // 5. Vẽ đường nối Tuyến Hành Trình (Polyline)
    const routePoints: [number, number][] = isSameDistrict ? [originCoords, destCoords] : [originCoords, destHubCoords, destCoords]
    const polyline = L.polyline(routePoints, {
      color: '#059669',
      weight: 4,
      opacity: 0.85,
      dashArray: status === 'DELIVERED' ? undefined : '6, 8',
    }).addTo(map)

    // Tự động căn chỉnh góc nhìn thấy toàn bộ lộ trình
    map.fitBounds(polyline.getBounds(), { padding: [60, 60] })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [trackingData, goongApiKey])

  // Helper phân tích tỉnh thành & quận huyện chuẩn xác từ chuỗi địa chỉ bất kỳ
  const parseAddress = (addrText: string) => {
    if (!addrText) return { province: 'Việt Nam', district: 'Khu vực phát', label: 'Địa chỉ' }
    const parts = addrText.split(',').map((p) => p.trim()).filter(Boolean)
    const province = parts.length > 0 ? parts[parts.length - 1] : ''
    const district = parts.length > 1 ? parts[parts.length - 2] : parts[0] || ''
    const label = `${district}${province ? `, ${province}` : ''}`
    return { province, district, label }
  }

  // Lấy text hiển thị động 100% từ dữ liệu thực tế
  const rawPickup = trackingData.pickupAddress?.address || trackingData.sellerPickupAddress || ''
  const pickupInfo = parseAddress(rawPickup)
  const rawDelivery = trackingData.deliveryAddress || ''
  const deliveryInfo = parseAddress(rawDelivery)
  const currentHubName = trackingData.currentHub?.name || `${deliveryInfo.district} Hub`

  return (
    <div className="space-y-2 text-left">
      {/* Container Bản đồ */}
      <div className="relative w-full h-[280px] sm:h-[320px] rounded-3xl overflow-hidden border-2 border-slate-200 shadow-md bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Thanh Trạng Thái Đang Ở Đâu Phủ Trên Bản Đồ */}
        <div className="absolute top-3 left-3 right-3 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 rounded-2xl shadow-lg flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
              <span className="text-xs font-black text-slate-900 tracking-tight truncate">
                Vị Trí Hiện Tại Của Bưu Kiện
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold truncate">
              {trackingData.status === 'AT_ORIGIN_HUB' && `🏢 Đang lưu tại: ${trackingData.currentHub?.name || 'Kho Bưu Cục Xuất Phát'} (Chờ phân luồng)`}
              {trackingData.status === 'SORTING' && `🏢 Đang phân loại tại: ${trackingData.currentHub?.name || 'Trạm SOC'}`}
              {trackingData.status === 'IN_TRANSIT' && `🚛 Xe tải đang trên đường luân chuyển đến: ${currentHubName}`}
              {trackingData.status === 'AT_DESTINATION_HUB' && `🏢 Đã đến: ${currentHubName} (Chờ Shipper nhận tuyến)`}
              {trackingData.status === 'OUT_FOR_DELIVERY' && `🛵 Shipper đang đi giao tận tay tại: ${deliveryInfo.label}`}
              {trackingData.status === 'DELIVERED' && '✅ Đã giao thành công tại nhà người nhận'}
              {trackingData.status === 'PICKED_UP' && '📦 Shipper đã lấy từ Shop: Đang mang về Kho Bưu Cục'}
              {trackingData.status === 'CREATED' && `🏪 Đang đóng gói tại: ${pickupInfo.label}`}
            </p>
          </div>

          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black uppercase shrink-0 border border-emerald-200">
            ZMX LIVE
          </span>
        </div>

        {/* Chú Thích Bản Đồ Dưới Góc Phải */}
        <div className="absolute bottom-2.5 right-2.5 z-20 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2.5 shadow-md border border-slate-700">
          <span className="flex items-center gap-1 text-orange-400"><span>📍</span> Đơn Hàng</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1"><span>🏪</span> Kho Gửi</span>
          <span className="flex items-center gap-1"><span>🏢</span> Bưu Cục</span>
          <span className="flex items-center gap-1"><span>🛵</span> Shipper</span>
          <span className="flex items-center gap-1"><span>🏠</span> Nhà Bạn</span>
        </div>
      </div>

      {/* Tóm tắt 3 Chặng Hành Trình Lộ Tuyến Ngay Dưới Bản Đồ */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className={`p-2 rounded-xl border ${
          ['AT_ORIGIN_HUB', 'SORTING', 'PICKED_UP', 'CREATED'].includes(trackingData.status)
            ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">1. Nơi Gửi</div>
          <div className="text-xs font-bold truncate">{pickupInfo.label || 'Shop Người Bán'}</div>
        </div>

        <div className={`p-2 rounded-xl border ${
          ['IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(trackingData.status)
            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">2. Bưu Cục Phát</div>
          <div className="text-xs font-bold truncate">{currentHubName}</div>
        </div>

        <div className={`p-2 rounded-xl border ${
          ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(trackingData.status)
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">3. Nơi Nhận</div>
          <div className="text-xs font-bold truncate">{deliveryInfo.label || 'Địa chỉ người nhận'}</div>
        </div>
      </div>
    </div>
  )
}
