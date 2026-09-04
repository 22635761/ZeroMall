import React, { useState } from 'react'
import { API_BASE_URL } from '../../config/api.config'

interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  codAmount: number
  status: string
  currentHubId?: string
  currentHub?: { name: string; code: string }
  package?: { weight: number; itemsSummary?: string }
}

interface Hub {
  id: string
  code: string
  name: string
  type: string
  province: string
  district: string
}

interface HubOperatorStationProps {
  currentUser: any
  hubs: Hub[]
  shipments: Shipment[]
  onRefresh: () => void
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string, hubId?: string, note?: string) => Promise<void>
  actionLoading: boolean
}

export const HubOperatorStation: React.FC<HubOperatorStationProps> = ({
  currentUser,
  hubs,
  shipments,
  onRefresh,
  onUpdateStatus,
  actionLoading,
}) => {
  // Chọn Kho làm việc hiện tại
  const [selectedHubId, setSelectedHubId] = useState<string>(() => hubs[0]?.id || 'hub-hcm-01')
  // Tab nghiệp vụ kho:
  // 1. INBOUND_PICKUP: Tiếp nhận hàng Shipper gom về từ Shop
  // 2. SORTING_LINEHAUL: Phân loại & Xuất xe tải đường dài
  // 3. INBOUND_RECEIVING: Tiếp nhận xe tải đến kho phát
  // 4. DISPATCH_LASTMILE: Chia kiện cho Shipper giao tận nhà
  const [stationTab, setStationTab] = useState<'INBOUND_PICKUP' | 'SORTING_LINEHAUL' | 'INBOUND_RECEIVING' | 'DISPATCH_LASTMILE'>('INBOUND_PICKUP')
  
  // Barcode Scanner Input
  const [scannedCode, setScannedCode] = useState('')
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currentHub = hubs.find((h) => h.id === selectedHubId) || hubs[0]

  // Helper xác định đơn hàng thuộc Bưu Cục Phát nào dựa trên địa chỉ người nhận
  const isDestinedForCurrentHub = (s: Shipment, hub: Hub | undefined) => {
    if (!hub) return true
    const addr = (s.deliveryAddress || '').toLowerCase()
    const hubProv = (hub.province || '').toLowerCase()
    const hubDist = (hub.district || '').toLowerCase()
    const hubCode = (hub.code || '').toLowerCase()

    if (hubCode === 'dn01' || hubProv.includes('đồng nai') || hubDist.includes('biên hòa')) {
      return addr.includes('đồng nai') || addr.includes('biên hòa')
    }
    if (hubCode === 'hn01' || hubProv.includes('hà nội') || hubDist.includes('mê linh')) {
      return addr.includes('hà nội') || addr.includes('mê linh')
    }
    if (hubCode === 'hcm01' || hubProv.includes('hồ chí minh') || hubDist.includes('tân bình')) {
      return addr.includes('hồ chí minh') || addr.includes('hcm') || addr.includes('sài gòn') || (!addr.includes('đồng nai') && !addr.includes('hà nội'))
    }
    return false
  }

  // Phân loại danh sách theo trạng thái kho & ĐÚNG BƯU CỤC
  // 1. Nhận từ Shipper: Các đơn gom về kho gốc hiện tại
  const pickupInboundList = shipments.filter((s) => s.status === 'PICKED_UP')
  
  // 2. Phân loại & Xuất xe: Các đơn đang nằm tại kho hiện tại chờ xuất xe
  const sortingList = shipments.filter((s) => ['AT_ORIGIN_HUB', 'SORTING'].includes(s.status) && (s.currentHubId === currentHub?.id || !s.currentHubId))
  
  // 3. Tiếp nhận xe tải đến: Chỉ hiện các đơn ĐANG TRÊN XE TẢI (IN_TRANSIT) HƯỚNG VỀ BƯU CỤC ĐÍCH HIỆN TẠI
  const inTransitList = shipments.filter((s) => s.status === 'IN_TRANSIT' && isDestinedForCurrentHub(s, currentHub))
  
  // 4. Chia tuyến Shipper giao: Các đơn đã nằm tại bưu cục đích hiện tại
  const destinationList = shipments.filter((s) => s.status === 'AT_DESTINATION_HUB' && isDestinedForCurrentHub(s, currentHub))

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedCode.trim()) return

    const code = scannedCode.trim().toUpperCase()
    const targetShipment = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === code || s.orderId.toUpperCase() === code
    )

    if (!targetShipment) {
      setScanMessage({ type: 'error', text: `❌ Không tìm thấy vận đơn khớp với mã [${code}]` })
      setScannedCode('')
      return
    }

    try {
      if (stationTab === 'INBOUND_PICKUP') {
        await onUpdateStatus(targetShipment.id, 'AT_ORIGIN_HUB', undefined, currentHub?.id, `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`)
        setScanMessage({ type: 'success', text: `✅ Đã nhập kho xuất phát: ${targetShipment.trackingNumber}` })
      } else if (stationTab === 'SORTING_LINEHAUL') {
        await onUpdateStatus(targetShipment.id, 'IN_TRANSIT', undefined, currentHub?.id, `Kiện hàng đã được phân loại & đóng lên xe tải trung chuyển rời ${currentHub?.name}`)
        setScanMessage({ type: 'success', text: `🚚 Đã xuất xe trung chuyển Linehaul: ${targetShipment.trackingNumber}` })
      } else if (stationTab === 'INBOUND_RECEIVING') {
        await onUpdateStatus(targetShipment.id, 'AT_DESTINATION_HUB', undefined, currentHub?.id, `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`)
        setScanMessage({ type: 'success', text: `🏢 Đã nhập bưu cục phát: ${targetShipment.trackingNumber}` })
      } else if (stationTab === 'DISPATCH_LASTMILE') {
        // Tự động tìm Shipper thuộc khu vực bưu cục phát
        await fetch(`${API_BASE_URL}/delivery/shipments/${targetShipment.id}/auto-dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'DELIVERY' }),
        })
        setScanMessage({ type: 'success', text: `🛵 Đã tự động phân tuyến cho Shipper phụ trách: ${targetShipment.trackingNumber}` })
        onRefresh()
      }
      setScannedCode('')
    } catch (e: any) {
      setScanMessage({ type: 'error', text: `⚠️ Lỗi xử lý: ${e.message || 'Không thể cập nhật'}` })
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header Trạm Khai Thác Kho & Chọn Bưu Cục Làm Việc */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏭</span>
              <h2 className="text-xl font-black tracking-tight">Trạm Khai Thác & Phân Loại Bưu Kiện (Sorting Hub Station)</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Vận hành phân luồng bưu phẩm tự động, nhận bàn giao từ Shipper, đóng xe tải liên tỉnh và chia tuyến phát
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-2xl border border-slate-700">
            <span className="text-xs font-bold text-slate-300">🏢 Bưu Cục Hiện Tại:</span>
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} - {h.name} ({h.province})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barcode Scanner Bar */}
        <form onSubmit={handleScanSubmit} className="pt-2 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3 text-slate-400 text-sm">📟</span>
            <input
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder="QUÉT MÃ VẠCH HOẶC NHẬP MÃ VẬN ĐƠN (ZMX...) ĐỂ BÀN GIAO TỨC THÌ..."
              className="w-full pl-11 pr-4 py-3 bg-slate-800 border-2 border-emerald-500/80 rounded-2xl text-xs font-mono font-bold text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:bg-slate-700 transition"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>⚡ Quét & Bàn Giao</span>
          </button>
        </form>

        {scanMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold animate-in fade-in duration-150 ${
            scanMessage.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border border-rose-500 text-rose-300'
          }`}>
            {scanMessage.text}
          </div>
        )}
      </div>

      {/* 2. Bốn Chặng Nghiệp Vụ Kho (4-Step Hub Pipeline) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'INBOUND_PICKUP',
            title: '1. Nhận Từ Shipper Lấy',
            desc: 'Quét bưu kiện Shipper First-Mile mang về kho',
            count: pickupInboundList.length,
            icon: '📦',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
          },
          {
            id: 'SORTING_LINEHAUL',
            title: '2. Phân Loại & Đóng Xe Tải',
            desc: 'Phân luồng & xuất xe tải luân chuyển Linehaul',
            count: sortingList.length,
            icon: '🚛',
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'border-sky-200',
          },
          {
            id: 'INBOUND_RECEIVING',
            title: '3. Tiếp Nhận Xe Tải Đến',
            desc: 'Nhập bưu kiện từ xe tải về Bưu cục phát',
            count: inTransitList.length,
            icon: '🏢',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-200',
          },
          {
            id: 'DISPATCH_LASTMILE',
            title: '4. Chia Tuyến Shipper Giao',
            desc: 'Bàn giao cho Shipper Last-Mile đi phát',
            count: destinationList.length,
            icon: '🛵',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStationTab(tab.id as any)}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
              stationTab === tab.id
                ? `${tab.bg} ${tab.border} border-2 shadow-xs ring-2 ring-emerald-500/20`
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-base font-black px-2 py-0.5 rounded-lg ${tab.color} ${tab.bg} border ${tab.border}`}>
                {tab.count}
              </span>
            </div>
            <div>
              <h4 className="font-black text-xs text-slate-800 leading-tight">{tab.title}</h4>
              <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{tab.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Bảng Danh Sách Bưu Kiện Đang Ở Khâu Đã Chọn */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
            <span>📋</span> Danh Sách Bưu Kiện Chờ Xử Lý Tại Khâu Này
          </h3>
          <button
            onClick={onRefresh}
            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            🔄 Cập Nhật
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Mã Vận Đơn ZMX</th>
                <th className="py-3 px-4">Địa Chỉ Đích / Người Nhận</th>
                <th className="py-3 px-4">Thông Tin Kiện Hàng</th>
                <th className="py-3 px-4">Trạng Thái Kho</th>
                <th className="py-3 px-4 text-right">Thao Tác Nhanh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stationTab === 'INBOUND_PICKUP' ? pickupInboundList :
                stationTab === 'SORTING_LINEHAUL' ? sortingList :
                stationTab === 'INBOUND_RECEIVING' ? inTransitList : destinationList
              ).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 space-y-0.5">
                    <div>{s.trackingNumber}</div>
                    <div className="text-[10px] text-slate-400 font-normal">Đơn: #{s.orderId}</div>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5 max-w-xs">
                    <div className="font-bold text-slate-900">{s.buyerName} ({s.buyerPhone})</div>
                    <div className="text-xs text-slate-500 line-clamp-1">{s.deliveryAddress}</div>
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="text-slate-800 font-medium">{s.package?.itemsSummary || 'Bưu phẩm ZMX'}</div>
                    <div className="text-[11px] text-slate-400">Trọng lượng: {s.package?.weight || 0.5}kg</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {stationTab === 'INBOUND_PICKUP' && (
                      <button
                        onClick={() => onUpdateStatus(s.id, 'AT_ORIGIN_HUB', undefined, currentHub?.id, `Nhân viên kho [${currentUser.name}] đã quét nhận bàn giao từ Shipper về ${currentHub?.name}`)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                      >
                        📥 Nhập Kho Bưu Cục
                      </button>
                    )}

                    {stationTab === 'SORTING_LINEHAUL' && (
                      <button
                        onClick={() => onUpdateStatus(s.id, 'IN_TRANSIT', undefined, currentHub?.id, `Kiện hàng đã được phân loại & đóng lên xe tải trung chuyển rời ${currentHub?.name}`)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                      >
                        🚛 Xuất Xe Linehaul
                      </button>
                    )}

                    {stationTab === 'INBOUND_RECEIVING' && (
                      <button
                        onClick={() => onUpdateStatus(s.id, 'AT_DESTINATION_HUB', undefined, currentHub?.id, `Xe tải trung chuyển đã đến và bàn giao bưu kiện vào ${currentHub?.name}`)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                      >
                        🏢 Nhập Bưu Cục Phát
                      </button>
                    )}

                    {stationTab === 'DISPATCH_LASTMILE' && (
                      <button
                        onClick={async () => {
                          await fetch(`${API_BASE_URL}/delivery/shipments/${s.id}/auto-dispatch`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'DELIVERY' }),
                          })
                          alert('Đã tự động định tuyến và gán cho Shipper khu vực!')
                          onRefresh()
                        }}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-3xs"
                      >
                        🛵 Gán Tuyến Cho Shipper
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
