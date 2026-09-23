import type { Shipment, Hub, Assignment } from './types'

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CREATED: { label: 'Mới Tạo', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  WAITING_PICKUP: { label: 'Chờ Lấy Hàng', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  PICKUP_ASSIGNED: { label: 'Đã Gán Shipper Lấy', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  PICKED_UP: { label: 'Shipper Đã Lấy', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  AT_ORIGIN_HUB: { label: 'Tại Kho Gửi', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
  SORTING: { label: 'Đang Phân Loại', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  IN_TRANSIT: { label: 'Đang Trung Chuyển', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  AT_DESTINATION_HUB: { label: 'Tại Bưu Cục Phát', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  DELIVERY_ASSIGNED: { label: 'Chờ Shipper Nhận', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  OUT_FOR_DELIVERY: { label: 'Đang Giao', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  DELIVERED: { label: 'Đã Giao', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  DELIVERY_FAILED: { label: 'Giao Thất Bại', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  RETURNING: { label: 'Đang Hoàn', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  RETURNED: { label: 'Đã Hoàn', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
}

export function timeAgo(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function extractLinehaulInfo(s: Shipment) {
  const log = s.trackingLogs?.find(
    (l) => l.description?.includes('Xe tải') || l.description?.includes('Seal')
  )
  if (!log) return null

  const text = log.description || ''
  const truckMatch = text.match(/\[([0-9A-Z\-\.]+)\]/) || text.match(/Xe tải\s+([0-9A-Z\-\.]+)/i)
  const sealMatch = text.match(/Seal:\s*\[?([A-Z0-9\-]+)\]?/i)
  const driverMatch = text.match(/Bác tài:\s*([^\(•]+)/i)
  const phoneMatch = text.match(/SĐT:\s*([0-9\+\.]+)/i) || text.match(/\(([0-9\+\.\s]+)\)/)

  return {
    truckNumber: truckMatch ? truckMatch[1] : 'Xe Tải Linehaul',
    sealNumber: sealMatch ? sealMatch[1] : null,
    driver: driverMatch ? driverMatch[1].trim() : null,
    driverPhone: phoneMatch ? phoneMatch[1].trim() : '',
    time: log.timestamp,
  }
}

export function isDestinedForCurrentHub(s: Shipment, currentHub?: Hub | null): boolean {
  if (!currentHub) return true

  // Với đơn hàng hoàn (Return reverse logistics), tuyến đích là Kho của Shop (pickupAddress của đơn gốc hoặc deliveryAddress đã map thành Kho Shop)
  let addr = (s.deliveryAddress || '').toLowerCase()
  if (s.isReturn || s.returnData || addr.startsWith('kho shop:') || addr.includes('gửi về shop:')) {
    const shopAddrParts = [
      s.pickupAddress?.province,
      s.pickupAddress?.district,
      s.pickupAddress?.address,
      addr,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    addr = shopAddrParts
  } else if (s.pickupAddress && (s as any).isReturn) {
    addr = `${s.pickupAddress.province || ''} ${s.pickupAddress.district || ''} ${s.pickupAddress.address || ''}`.toLowerCase()
  }

  const hubProv = (currentHub.province || '').toLowerCase()
  const hubDist = (currentHub.district || '').toLowerCase()
  const hubCode = (currentHub.code || '').toLowerCase()

  if (hubCode === 'dn01' || hubProv.includes('đồng nai') || hubDist.includes('biên hòa')) {
    return addr.includes('đồng nai') || addr.includes('biên hòa')
  }
  if (hubCode === 'hn01' || hubProv.includes('hà nội') || hubDist.includes('mê linh')) {
    return addr.includes('hà nội') || addr.includes('mê linh')
  }
  if (hubCode === 'hcm01' || hubProv.includes('hồ chí minh') || hubDist.includes('tân bình')) {
    return (
      addr.includes('hồ chí minh') ||
      addr.includes('hcm') ||
      addr.includes('sài gòn') ||
      (!addr.includes('đồng nai') && !addr.includes('hà nội'))
    )
  }
  return false
}

export function playBeepSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    osc.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.08)
  } catch {}
}

export function getPickupDriver(s: Shipment): Assignment | undefined {
  return s.assignments?.find((a) => a.type === 'PICKUP' && a.status === 'COMPLETED')
}

export function getDeliveryDriver(s: Shipment): Assignment | undefined {
  return s.assignments?.find(
    (a) => a.type === 'DELIVERY' && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)
  )
}
