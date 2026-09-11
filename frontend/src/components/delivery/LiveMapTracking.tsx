import React, { useEffect, useRef } from 'react'

declare const L: any

interface LiveMapTrackingProps {
  trackingData: any
  goongApiKey?: string
}

// Hàm chuẩn hóa chuỗi tiếng Việt (loại bỏ dấu) để tìm kiếm địa chỉ chính xác
const removeVietnameseTones = (str: string): string => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

// Bảng tọa độ tiêu chuẩn của 63 Tỉnh Thành & các Quận/Huyện trọng điểm tại Việt Nam
const VIETNAM_COORDS_MAP: { [key: string]: [number, number] } = {
  // Hà Nội & miền Bắc
  'ba vi': [21.1500, 105.3800],
  'me linh': [21.1837, 105.7196],
  'quang minh': [21.1837, 105.7196],
  'cau giay': [21.0333, 105.7939],
  'dong da': [21.0180, 105.8260],
  'hoan kiem': [21.0285, 105.8542],
  'hai ba trung': [21.0069, 105.8550],
  'tay ho': [21.0667, 105.8250],
  'thanh xuan': [20.9950, 105.8050],
  'ha dong': [20.9700, 105.7700],
  'long bien': [21.0360, 105.8900],
  'gia lam': [21.0100, 105.9500],
  'dong anh': [21.1400, 105.8500],
  'soc son': [21.2600, 105.8500],
  'son tay': [21.1300, 105.5000],
  'nam tu liem': [21.0150, 105.7650],
  'bac tu liem': [21.0600, 105.7600],
  'ha noi': [21.0285, 105.8542],
  'hanoi': [21.0285, 105.8542],
  'hai phong': [20.8449, 106.6881],
  'quang ninh': [21.0064, 107.2925],
  'bac ninh': [21.1861, 106.0763],
  'hai duong': [20.9372, 106.3152],
  'hung yen': [20.6464, 106.0511],
  'thai binh': [20.4463, 106.3365],
  'nam dinh': [20.4200, 106.1683],
  'ninh binh': [20.2506, 105.9745],
  'vinh phuc': [21.3609, 105.5474],
  'phu tho': [21.3228, 105.2280],
  'thai nguyen': [21.5942, 105.8482],

  // TP. Hồ Chí Minh & miền Nam
  'tan binh': [10.8014, 106.6538],
  'binh thanh': [10.8020, 106.7030],
  'thanh my tay': [10.8020, 106.7030],
  'quan 1': [10.7756, 106.7004],
  'quan 3': [10.7844, 106.6844],
  'quan 4': [10.7600, 106.7050],
  'quan 5': [10.7550, 106.6650],
  'quan 6': [10.7480, 106.6350],
  'quan 7': [10.7340, 106.7219],
  'quan 8': [10.7200, 106.6400],
  'quan 10': [10.7716, 106.6672],
  'quan 11': [10.7630, 106.6500],
  'quan 12': [10.8672, 106.6414],
  'go vap': [10.8388, 106.6653],
  'phu nhuan': [10.7981, 106.6800],
  'tan phu': [10.7900, 106.6300],
  'binh tan': [10.7500, 106.6000],
  'thu duc': [10.8494, 106.7537],
  'hoc mon': [10.8850, 106.5900],
  'cu chi': [10.9700, 106.5000],
  'nha be': [10.6700, 106.7300],
  'binh chanh': [10.6800, 106.5800],
  'can gio': [10.4100, 106.9600],
  'ho chi minh': [10.7769, 106.7009],
  'sai gon': [10.7769, 106.7009],
  'tphcm': [10.7769, 106.7009],

  // Đồng Nai & Đông Nam Bộ
  'bien hoa': [10.9574, 106.8427],
  'long khanh': [10.9388, 107.2408],
  'nhon trach': [10.6900, 106.8900],
  'long thanh': [10.7700, 106.9500],
  'trang bom': [10.9700, 107.0100],
  'vinh cuu': [11.1200, 106.9500],
  'dong nai': [10.9574, 106.8427],
  'binh duong': [10.9800, 106.6500],
  'thu dau mot': [10.9800, 106.6500],
  'ba ria': [10.4966, 107.1685],
  'vung tau': [10.3460, 107.0843],
  'tay ninh': [11.3100, 106.1000],
  'binh phuoc': [11.5333, 106.8833],

  // Miền Trung & Tây Nguyên
  'da nang': [16.0544, 108.2022],
  'hue': [16.4637, 107.5909],
  'thua thien hue': [16.4637, 107.5909],
  'quang nam': [15.5394, 108.0191],
  'quang ngai': [15.1205, 108.7923],
  'binh dinh': [14.1667, 108.9000],
  'quy nhon': [13.7830, 109.2197],
  'phu yen': [13.0882, 109.0929],
  'tuy hoa': [13.0882, 109.0929],
  'khanh hoa': [12.2388, 109.1967],
  'nha trang': [12.2388, 109.1967],
  'lam dong': [11.9404, 108.4583],
  'da lat': [11.9404, 108.4583],
  'dak lak': [12.6667, 108.0500],
  'buon ma thuot': [12.6667, 108.0500],
  'thanh hoa': [19.8067, 105.7852],
  'nghe an': [18.6733, 105.6813],
  'vinh': [18.6733, 105.6813],
  'ha tinh': [18.3559, 105.8877],
  'quang binh': [17.4833, 106.6000],
  'quang tri': [16.7500, 107.1833],

  // Miền Tây (ĐBSCL)
  'can tho': [10.0452, 105.7469],
  'an giang': [10.3759, 105.4185],
  'long xuyen': [10.3759, 105.4185],
  'chau doc': [10.7000, 105.1167],
  'tien giang': [10.4200, 106.3300],
  'my tho': [10.3600, 106.3600],
  'ben tre': [10.2400, 106.3750],
  'vinh long': [10.2500, 105.9700],
  'dong thap': [10.4600, 105.6300],
  'cao lanh': [10.4600, 105.6300],
  'hau giang': [9.7800, 105.4700],
  'soc trang': [9.6000, 105.9700],
  'bac lieu': [9.2900, 105.7200],
  'ca mau': [9.1800, 105.1500],
  'kien giang': [10.0100, 105.0800],
  'rach gia': [10.0100, 105.0800],
  'phu quoc': [10.2289, 103.9572],
}

// Bảng thông tin 3 Bưu Cục Hub trọng điểm của ZMX Logistics
const HUBS_CONFIG: { [id: string]: { id: string; name: string; code: string; province: string; district: string; coords: [number, number] } } = {
  'hub-hn-01': {
    id: 'hub-hn-01',
    name: 'Kho Trung Chuyển Mê Linh SOC',
    code: 'HN01',
    province: 'Hà Nội',
    district: 'Huyện Mê Linh',
    coords: [21.1837, 105.7196],
  },
  'hub-hcm-01': {
    id: 'hub-hcm-01',
    name: 'Kho Tổng Tân Bình SOC',
    code: 'HCM01',
    province: 'Hồ Chí Minh',
    district: 'Quận Tân Bình',
    coords: [10.8014, 106.6538],
  },
  'hub-dn-01': {
    id: 'hub-dn-01',
    name: 'Bưu Cục Giao Hàng Biên Hòa Hub',
    code: 'DN01',
    province: 'Đồng Nai',
    district: 'TP. Biên Hòa',
    coords: [10.9574, 106.8427],
  },
}

// Hàm phân tích địa chỉ đa nguồn thông minh
const parseAddressSmart = (rawText: string, obj?: any) => {
  let province = obj?.province || ''
  let district = obj?.district || ''
  let ward = obj?.ward || ''
  let detail = obj?.address || ''

  if (!province || !district) {
    const parts = (rawText || '').split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0 && !province) province = parts[parts.length - 1]
    if (parts.length > 1 && !district) district = parts[parts.length - 2]
    if (parts.length > 2 && !ward) ward = parts[parts.length - 3]
    if (!detail) detail = parts.slice(0, Math.max(1, parts.length - 2)).join(', ')
  }

  const cleanProv = province.replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim()
  const cleanDist = district.replace(/^(quận|huyện|thị xã|thành phố|tp\.?)\s+/i, '').trim()

  const displayLabel = [district || cleanDist, province || cleanProv].filter(Boolean).join(', ')
  const fullText = [detail, ward, district, province].filter(Boolean).join(', ') || rawText

  return {
    province: cleanProv || province,
    district: cleanDist || district,
    ward,
    detail,
    displayLabel: displayLabel || 'Địa chỉ vận chuyển',
    fullText,
  }
}

// Hàm giải mã tọa độ địa lý chuẩn xác cho bất kỳ địa danh nào ở Việt Nam
const resolveVietnamCoords = (
  fullText: string,
  province: string,
  district: string,
  savedLat?: number | null,
  savedLng?: number | null
): [number, number] => {
  // 1. Nếu có tọa độ GPS lưu sẵn hợp lệ và khớp miền địa lý, sử dụng ngay
  if (savedLat && savedLng && savedLat > 8.0 && savedLat < 24.0 && savedLng > 102.0 && savedLng < 110.0) {
    const normProv = removeVietnameseTones(province)
    const isNorthern = ['ha noi', 'vinh phuc', 'bac ninh', 'hai phong', 'quang ninh', 'thai nguyen'].some(k => normProv.includes(k))
    const isSouthern = ['ho chi minh', 'sai gon', 'dong nai', 'binh duong', 'long an', 'can tho'].some(k => normProv.includes(k))

    // Kiểm tra tính nhất quán (ví dụ: không lấy tọa độ lat 10.x cho Hà Nội)
    if (isNorthern && savedLat > 18.0) return [savedLat, savedLng]
    if (isSouthern && savedLat < 15.0) return [savedLat, savedLng]
    if (!isNorthern && !isSouthern) return [savedLat, savedLng]
  }

  // 2. Tìm theo Quận/Huyện trước (độ chính xác cao nhất)
  const normDistrict = removeVietnameseTones(district)
  for (const [key, coords] of Object.entries(VIETNAM_COORDS_MAP)) {
    if (normDistrict && (normDistrict === key || normDistrict.includes(key) || key.includes(normDistrict))) {
      return coords
    }
  }

  // 3. Tìm theo chuỗi địa chỉ đầy đủ
  const normFull = removeVietnameseTones(fullText)
  for (const [key, coords] of Object.entries(VIETNAM_COORDS_MAP)) {
    if (normFull.includes(key)) {
      return coords
    }
  }

  // 4. Tìm theo Tỉnh/Thành
  const normProv = removeVietnameseTones(province)
  for (const [key, coords] of Object.entries(VIETNAM_COORDS_MAP)) {
    if (normProv && (normProv === key || normProv.includes(key) || key.includes(normProv))) {
      return coords
    }
  }

  // Mặc định fallback theo khu vực
  if (normProv.includes('ha noi') || normFull.includes('ha noi')) return [21.0285, 105.8542]
  if (normProv.includes('dong nai') || normFull.includes('dong nai')) return [10.9574, 106.8427]
  return [10.7769, 106.7009] // TP.HCM
}

// Hàm xác định Bưu Cục phù hợp dựa theo Tỉnh/Thành
const resolveHubForProvince = (provinceName: string, preferredHubId?: string) => {
  if (preferredHubId && HUBS_CONFIG[preferredHubId]) {
    return HUBS_CONFIG[preferredHubId]
  }

  const norm = removeVietnameseTones(provinceName)
  // Miền Bắc -> Mê Linh SOC
  if (['ha noi', 'vinh phuc', 'bac ninh', 'hai phong', 'quang ninh', 'hai duong', 'hung yen', 'thai binh', 'nam dinh', 'ninh binh', 'phu tho', 'thai nguyen', 'tuyen quang', 'yen bai', 'bac giang'].some(k => norm.includes(k))) {
    return HUBS_CONFIG['hub-hn-01']
  }
  // Đồng Nai -> Biên Hòa Hub
  if (norm.includes('dong nai') || norm.includes('bien hoa')) {
    return HUBS_CONFIG['hub-dn-01']
  }
  // TP.HCM & các tỉnh miền Nam -> Tân Bình SOC
  return HUBS_CONFIG['hub-hcm-01']
}

export const LiveMapTracking: React.FC<LiveMapTrackingProps> = ({ trackingData, goongApiKey: _goongApiKey }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // 1. Phân tích địa chỉ Người Gửi (Pickup)
  const pickupInfo = parseAddressSmart(
    trackingData.pickupAddress?.address || trackingData.sellerPickupAddress || '',
    trackingData.pickupAddress
  )

  // 2. Phân tích địa chỉ Người Nhận (Delivery)
  const deliveryInfo = parseAddressSmart(trackingData.deliveryAddress || '')

  // 3. Tọa độ Nơi Gửi & Nơi Nhận
  const originCoords = resolveVietnamCoords(
    pickupInfo.fullText,
    pickupInfo.province,
    pickupInfo.district,
    trackingData.pickupAddress?.latitude,
    trackingData.pickupAddress?.longitude
  )

  const destCoords = resolveVietnamCoords(
    deliveryInfo.fullText,
    deliveryInfo.province,
    deliveryInfo.district
  )

  // 4. Bưu Cục Xuất Phát (Origin Hub) & Bưu Cục Phát (Destination Hub)
  const originHub = resolveHubForProvince(
    pickupInfo.province,
    trackingData.currentHubId || trackingData.currentHub?.id
  )

  const destHub = resolveHubForProvince(deliveryInfo.province)

  const isInterHub = originHub.id !== destHub.id

  // Trích xuất thông tin chuyến xe tải & Seal nếu đang IN_TRANSIT
  const linehaulLog = trackingData.trackingLogs?.find(
    (l: any) => l.description?.includes('Xe tải') || l.description?.includes('Seal')
  )
  const truckMatch = linehaulLog?.description?.match(/\[([0-9A-Z\-\.]+)\]/) || linehaulLog?.description?.match(/Xe tải\s+([0-9A-Z\-\.]+)/i)
  const sealMatch = linehaulLog?.description?.match(/Seal:\s*\[?([A-Z0-9\-]+)\]?/i)
  const driverMatch = linehaulLog?.description?.match(/Bác tài:\s*([^\(•]+)/i)

  const truckPlate = truckMatch ? truckMatch[1] : null
  const sealCode = sealMatch ? sealMatch[1] : null
  const truckDriver = driverMatch ? driverMatch[1].trim() : null

  // 5. Xác định vị trí kiện hàng đang ở đâu thời gian thực
  const status = trackingData.status || 'CREATED'
  let currentCoords: [number, number] = originCoords
  let liveIconEmoji = '📦'
  let liveTitle = 'Đơn Hàng Đang Tại Shop'
  let liveSub = `Chờ Shipper đến lấy (${pickupInfo.district || pickupInfo.province})`
  let liveBgColor = 'bg-amber-600'

  if (status === 'CREATED' || status === 'WAITING_PICKUP') {
    currentCoords = originCoords
    liveIconEmoji = '📦'
    liveTitle = 'Đơn Hàng Đang Tại Shop'
    liveSub = `Chờ Shipper đến lấy (${pickupInfo.district || pickupInfo.province})`
    liveBgColor = 'bg-amber-600'
  } else if (status === 'PICKUP_ASSIGNED' || status === 'PICKING_UP') {
    const driverName = trackingData.assignments?.[0]?.driver?.name || 'Shipper ZMX'
    currentCoords = [originCoords[0] + 0.003, originCoords[1] + 0.003]
    liveIconEmoji = '🛵'
    liveTitle = `Shipper: ${driverName}`
    liveSub = `Đang đến Shop lấy hàng (${pickupInfo.district || pickupInfo.province})`
    liveBgColor = 'bg-orange-600'
  } else if (status === 'PICKED_UP') {
    // Tài xế đang chở kiện hàng về Kho Xuất Phát
    currentCoords = [
      (originCoords[0] + originHub.coords[0]) / 2,
      (originCoords[1] + originHub.coords[1]) / 2,
    ]
    liveIconEmoji = '📦'
    liveTitle = 'Đã Lấy Hàng Thành Công'
    liveSub = `Shipper đang chuyển kiện về ${originHub.name}`
    liveBgColor = 'bg-blue-600'
  } else if (status === 'AT_ORIGIN_HUB' || status === 'SORTING') {
    // Kiện hàng đang lưu kho tại Kho Xuất Phát
    currentCoords = originHub.coords
    liveIconEmoji = '🏢'
    liveTitle = 'Đang Tại Kho Xuất Phát'
    liveSub = `Đang phân loại tại ${originHub.name}`
    liveBgColor = 'bg-indigo-600'
  } else if (status === 'IN_TRANSIT') {
    // Xe tải Linehaul đang chạy giữa 2 Hub
    currentCoords = [
      (originHub.coords[0] + destHub.coords[0]) / 2,
      (originHub.coords[1] + destHub.coords[1]) / 2,
    ]
    liveIconEmoji = '🚛'
    liveTitle = truckPlate ? `Xe Tải [${truckPlate}]` : 'Đang Vận Chuyển Liên Tỉnh'
    liveSub = sealCode
      ? `Khóa Seal: ${sealCode} • Tuyến: ${originHub.code} ➔ ${destHub.code}`
      : `Xe tải trung chuyển đang chạy từ ${originHub.code} ➔ ${destHub.code}`
    liveBgColor = 'bg-amber-600'
  } else if (status === 'AT_DESTINATION_HUB') {
    // Đã nhập kho Bưu cục phát
    currentCoords = destHub.coords
    liveIconEmoji = '🏢'
    liveTitle = `Đã Tới Bưu Cục Phát`
    liveSub = `Đang chia tuyến phát tại ${destHub.name}`
    liveBgColor = 'bg-indigo-600'
  } else if (status === 'OUT_FOR_DELIVERY') {
    const driverName = trackingData.assignments?.[0]?.driver?.name || 'Shipper ZMX'
    currentCoords = [destCoords[0] - 0.004, destCoords[1] - 0.004]
    liveIconEmoji = '🛵'
    liveTitle = `Shipper: ${driverName}`
    liveSub = `Đang giao hàng đến bạn (${deliveryInfo.district || deliveryInfo.province})`
    liveBgColor = 'bg-emerald-600'
  } else if (status === 'DELIVERED') {
    currentCoords = destCoords
    liveIconEmoji = '🎁'
    liveTitle = 'Đã Giao Thành Công'
    liveSub = `Người nhận đã nhận tại ${deliveryInfo.displayLabel}`
    liveBgColor = 'bg-emerald-600'
  }

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || typeof L === 'undefined') return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView(currentCoords, 11)

    mapInstanceRef.current = map

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Helper tạo Marker có thẻ Badge chữ
    const createLabeledMarker = (
      emoji: string,
      title: string,
      subtitle: string,
      colorClass: string,
      isCurrent = false
    ) => {
      return L.divIcon({
        className: 'custom-labeled-marker',
        html: `
          <div class="flex flex-col items-center pointer-events-auto cursor-pointer" style="transform: translate(-50%, -100%);">
            <div class="px-2.5 py-1 rounded-xl shadow-lg border text-[11px] font-black whitespace-nowrap mb-1 flex items-center gap-1.5 ${
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

            <div class="relative flex items-center justify-center">
              ${isCurrent ? '<span class="absolute w-9 h-9 rounded-full bg-orange-400 animate-ping opacity-75"></span>' : ''}
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

    // 📍 1. Marker Nơi Gửi (Kho Người Bán)
    L.marker(originCoords, {
      icon: createLabeledMarker('🏪', `Kho Gửi: ${pickupInfo.district || pickupInfo.province}`, `Shop ${trackingData.pickupAddress?.name || 'Người Bán'}`, 'bg-sky-600', false),
    }).addTo(map).bindPopup(`<b>🏪 Nơi Gửi:</b> ${pickupInfo.fullText}`)

    // 📍 2. Marker Kho Xuất Phát (Origin Hub)
    L.marker(originHub.coords, {
      icon: createLabeledMarker('🏢', `Kho Gửi: ${originHub.name}`, `Bưu Cục ${originHub.province}`, 'bg-indigo-600', false),
    }).addTo(map).bindPopup(`<b>🏢 Bưu Cục Xuất Phát:</b> ${originHub.name}<br>${originHub.district}, ${originHub.province}`)

    // 📍 3. Marker Bưu Cục Phát (Destination Hub - Nếu liên tỉnh)
    if (isInterHub) {
      L.marker(destHub.coords, {
        icon: createLabeledMarker('🏢', `Bưu Cục Phát: ${destHub.name}`, `Trạm Phát ${destHub.province}`, 'bg-violet-600', false),
      }).addTo(map).bindPopup(`<b>🏢 Bưu Cục Phát:</b> ${destHub.name}<br>${destHub.district}, ${destHub.province}`)
    }

    // 📍 4. Marker Điểm Nhận (Nhà Người Mua)
    L.marker(destCoords, {
      icon: createLabeledMarker('🏠', `Nơi Nhận: ${trackingData.buyerName || 'Người Mua'}`, `${deliveryInfo.displayLabel}`, 'bg-rose-600', false),
    }).addTo(map).bindPopup(`<b>🏠 Nơi Nhận:</b> ${trackingData.buyerName || 'Khách Hàng'}<br>${deliveryInfo.fullText}`)

    // 📍 5. ⭐ LIVE PACKAGE PIN (Vị trí thực tế của kiện hàng) ⭐
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

    // 6. Vẽ Polyline nối toàn bộ lộ trình
    const routePoints: [number, number][] = isInterHub
      ? [originCoords, originHub.coords, destHub.coords, destCoords]
      : [originCoords, originHub.coords, destCoords]

    const polyline = L.polyline(routePoints, {
      color: '#059669',
      weight: 4,
      opacity: 0.85,
      dashArray: status === 'DELIVERED' ? undefined : '6, 8',
    }).addTo(map)

    // Tự động căn chỉnh bao quát toàn bộ lộ trình
    map.fitBounds(polyline.getBounds(), { padding: [60, 60] })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [trackingData, status])

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
              {status === 'AT_ORIGIN_HUB' && `🏢 Đang lưu tại: ${originHub.name} (Chờ phân luồng)`}
              {status === 'SORTING' && `🏢 Đang phân loại tại: ${originHub.name}`}
              {status === 'IN_TRANSIT' && (
                truckPlate
                  ? `🚛 Xe tải [${truckPlate}] (Bác tài: ${truckDriver || 'Tài xế'}) • Seal: [${sealCode || 'N/A'}] đang chạy ➔ ${destHub.name}`
                  : `🚛 Xe tải đang luân chuyển từ ${originHub.name} ➔ ${destHub.name}`
              )}
              {status === 'AT_DESTINATION_HUB' && `🏢 Đã đến: ${destHub.name} (Chờ Shipper nhận tuyến)`}
              {status === 'OUT_FOR_DELIVERY' && `🛵 Shipper đang đi giao tận tay tại: ${deliveryInfo.displayLabel}`}
              {status === 'DELIVERED' && '✅ Đã giao thành công tại nhà người nhận'}
              {status === 'PICKED_UP' && `📦 Shipper đã lấy từ Shop: Đang mang về ${originHub.name}`}
              {status === 'CREATED' && `🏪 Đang đóng gói tại: ${pickupInfo.displayLabel}`}
              {status === 'WAITING_PICKUP' && `🏪 Chờ Shipper đến lấy tại: ${pickupInfo.displayLabel}`}
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
          ['AT_ORIGIN_HUB', 'SORTING', 'PICKED_UP', 'CREATED', 'WAITING_PICKUP', 'PICKUP_ASSIGNED'].includes(status)
            ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">1. Nơi Gửi</div>
          <div className="text-xs font-bold truncate" title={pickupInfo.fullText}>{pickupInfo.displayLabel}</div>
        </div>

        <div className={`p-2 rounded-xl border ${
          ['IN_TRANSIT', 'AT_DESTINATION_HUB'].includes(status)
            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">2. Bưu Cục Phát</div>
          <div className="text-xs font-bold truncate" title={destHub.name}>{destHub.name}</div>
        </div>

        <div className={`p-2 rounded-xl border ${
          ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <div className="text-[10px] uppercase font-black text-slate-400">3. Nơi Nhận</div>
          <div className="text-xs font-bold truncate" title={deliveryInfo.fullText}>{deliveryInfo.displayLabel}</div>
        </div>
      </div>
    </div>
  )
}
