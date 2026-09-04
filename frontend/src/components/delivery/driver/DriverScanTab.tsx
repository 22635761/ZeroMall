import React, { useState, useRef } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

/**
 * Interface cho đơn vận chuyển
 */
export interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  codAmount: number
  status: string
  package?: { weight: number; itemsSummary?: string }
  assignments?: Array<{
    id: string
    driverId?: string
    type: string
    status: string
  }>
  currentHubId?: string
  currentHub?: { id?: string; name: string; code?: string }
}

/**
 * Props cho component DriverScanTab
 */
export interface DriverScanTabProps {
  currentUser: any
  driverProfile: any
  shipments: Shipment[]
  onUpdateStatus: (shipmentId: string, status: string, failureReason?: string) => Promise<void>
  onRefresh: () => void
  actionLoading: boolean
}

/**
 * Interface cho bản ghi lịch sử quét barcode
 */
interface ScanHistoryItem {
  code: string
  result: string
  time: string
  isSuccess: boolean
}

export const DriverScanTab: React.FC<DriverScanTabProps> = ({
  currentUser,
  driverProfile,
  shipments,
  onUpdateStatus,
  onRefresh,
  actionLoading,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanStatusMsg, setScanStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isLocalProcessing, setIsLocalProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Lưu lại lịch sử quét (tối đa 5 lần gần nhất)
   */
  const addToHistory = (code: string, result: string, isSuccess: boolean) => {
    const time = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setScanHistory((prev) => [{ code, result, time, isSuccess }, ...prev].slice(0, 5))
  }

  /**
   * Xử lý quét barcode và tự động nhận diện ngữ cảnh đơn hàng
   */
  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const rawCode = barcodeInput.trim()
    if (!rawCode) return

    const normalizedCode = rawCode.toLowerCase()

    // 1. Tìm kiếm đơn hàng trong danh sách nội bộ
    let matchedShipment = shipments.find(
      (s) =>
        s.trackingNumber?.toLowerCase() === normalizedCode ||
        s.orderId?.toLowerCase() === normalizedCode
    )

    // 2. Nếu không có trong danh sách local, tra cứu trực tiếp từ API hệ thống
    if (!matchedShipment) {
      try {
        const fetchRes = await fetch(`${API_BASE_URL}/delivery/tracking/${encodeURIComponent(rawCode)}`)
        if (fetchRes.ok) {
          matchedShipment = await fetchRes.json()
        }
      } catch (err) {
        console.warn('Cannot fetch tracking info:', err)
      }
    }

    if (!matchedShipment) {
      const errorMsg = `Không tìm thấy kiện hàng nào với mã: ${rawCode}`
      setScanStatusMsg({ type: 'error', text: errorMsg })
      addToHistory(rawCode, errorMsg, false)
      return
    }

    setIsLocalProcessing(true)
    setScanStatusMsg(null)

    try {
      // Tự động phân loại luồng dựa theo trạng thái đơn hàng
      switch (matchedShipment.status) {
        case 'IN_TRANSIT':
        case 'AT_DESTINATION_HUB': {
          // Gán tài xế nhận đơn giao từ bưu cục đến khách
          if (driverProfile?.id) {
            const assignRes = await fetch(
              `${API_BASE_URL}/delivery/shipments/${matchedShipment.id}/assign`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: driverProfile?.id,
                  type: 'DELIVERY',
                }),
              }
            )

            if (!assignRes.ok) {
              const data = await assignRes.json().catch(() => ({}))
              throw new Error(data.message || `Lỗi gán đơn hàng xuất kho (${assignRes.status})`)
            }
          }

          // Cập nhật trạng thái đang đi giao
          await onUpdateStatus(matchedShipment.id, 'OUT_FOR_DELIVERY')
          const successMsg = `🛵 Xuất kho đi giao: ${matchedShipment.trackingNumber}`
          setScanStatusMsg({ type: 'success', text: successMsg })
          addToHistory(matchedShipment.trackingNumber, successMsg, true)
          setBarcodeInput('')
          onRefresh()
          break
        }

        case 'CREATED':
        case 'WAITING_PICKUP':
        case 'PICKUP_ASSIGNED':
        case 'PICKING_UP': {
          // Nếu tài xế chưa được gán lấy hàng, tự động gán tài xế này
          if (driverProfile?.id && !matchedShipment.assignments?.some((a: any) => a.driverId === driverProfile.id && a.type === 'PICKUP')) {
            try {
              await fetch(`${API_BASE_URL}/delivery/shipments/${matchedShipment.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  driverId: driverProfile.id,
                  type: 'PICKUP',
                }),
              })
            } catch (e) {
              console.warn(e)
            }
          }

          // Xác nhận đã lấy hàng từ người gửi/shop
          await onUpdateStatus(matchedShipment.id, 'PICKED_UP')
          const successMsg = `📦 Đã lấy hàng từ Shop: ${matchedShipment.trackingNumber}`
          setScanStatusMsg({ type: 'success', text: successMsg })
          addToHistory(matchedShipment.trackingNumber, successMsg, true)
          setBarcodeInput('')
          onRefresh()
          break
        }

        case 'OUT_FOR_DELIVERY': {
          // Xác nhận đã giao hàng thành công cho người nhận
          await onUpdateStatus(matchedShipment.id, 'DELIVERED')
          const successMsg = `✅ Giao thành công: ${matchedShipment.trackingNumber}`
          setScanStatusMsg({ type: 'success', text: successMsg })
          addToHistory(matchedShipment.trackingNumber, successMsg, true)
          setBarcodeInput('')
          onRefresh()
          break
        }

        default: {
          const warningMsg = `Đơn hàng ở trạng thái [${matchedShipment.status}] không thể xử lý bằng quét mã`
          setScanStatusMsg({ type: 'error', text: warningMsg })
          addToHistory(matchedShipment.trackingNumber, warningMsg, false)
          break
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Có lỗi xảy ra trong quá trình xử lý mã vận đơn'
      setScanStatusMsg({ type: 'error', text: errMsg })
      addToHistory(matchedShipment.trackingNumber, errMsg, false)
    } finally {
      setIsLocalProcessing(false)
      // Tự động focus lại ô quét mã
      inputRef.current?.focus()
    }
  }

  const isLoading = actionLoading || isLocalProcessing

  return (
    <div className="max-w-md mx-auto space-y-4 pb-8">
      {/* Header khu vực quét mã */}
      <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">📷</span>
          <div>
            <h2 className="text-xl font-bold tracking-wide">Quét Mã Vận Đơn</h2>
            <p className="text-emerald-200 text-xs mt-0.5">
              {currentUser?.name ? `Tài xế: ${currentUser.name} • ` : ''}Quét barcode để tự động nhận diện
            </p>
          </div>
        </div>
      </div>

      {/* Form nhập & quét barcode */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleScanSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Mã Barcode / Tracking Number
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Nhập hoặc quét mã ZMX..."
                autoFocus
                disabled={isLoading}
                className="w-full font-mono text-base px-4 py-3.5 bg-slate-50 border-2 border-dashed border-emerald-300 focus:border-emerald-600 focus:bg-white rounded-xl outline-none transition text-slate-800 placeholder-slate-400 disabled:opacity-60"
              />
              {barcodeInput && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('')
                    inputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !barcodeInput.trim()}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base rounded-xl shadow transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="animate-spin text-lg">⏳</span>
                <span>Đang xử lý kiện hàng...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Quét</span>
              </>
            )}
          </button>
        </form>

        {/* Thông báo kết quả quét */}
        {scanStatusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-sm font-medium border flex items-start space-x-2.5 transition-all ${
              scanStatusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span className="text-base flex-shrink-0">
              {scanStatusMsg.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="break-words leading-relaxed">{scanStatusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Lịch sử quét mã gần đây */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <span>⏱️</span>
            <span>Lịch Sử Quét Gần Nhất</span>
          </span>
          <span className="text-xs font-normal text-slate-400">
            {scanHistory.length > 0 ? `${scanHistory.length} lượt` : 'Trống'}
          </span>
        </h3>

        {scanHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Chưa có lịch sử quét nào trong phiên làm việc
          </div>
        ) : (
          <div className="space-y-2">
            {scanHistory.map((item, index) => (
              <div
                key={index}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  item.isSuccess
                    ? 'bg-emerald-50/50 border-emerald-100 text-slate-700'
                    : 'bg-rose-50/50 border-rose-100 text-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-900 truncate">
                      {item.code}
                    </span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    {item.result}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm">
                  {item.isSuccess ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hướng dẫn ngữ cảnh quét mã */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Hướng Dẫn Quy Trình Quét Mã
        </h3>
        <div className="space-y-2 text-xs">
          {/* Bước 1 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
            <span className="text-xl flex-shrink-0">📦</span>
            <div>
              <p className="font-semibold text-slate-800">1. Tại Shop / Người gửi</p>
              <p className="text-slate-500 mt-0.5">
                Quét mã = Xác nhận lấy hàng thành công từ Shop.
              </p>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
            <span className="text-xl flex-shrink-0">🏢</span>
            <div>
              <p className="font-semibold text-slate-800">2. Tại Bưu Cục Phát</p>
              <p className="text-slate-500 mt-0.5">
                Quét mã = Gán đơn & Xuất kho mang đi giao.
              </p>
            </div>
          </div>

          {/* Bước 3 */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
            <span className="text-xl flex-shrink-0">🏠</span>
            <div>
              <p className="font-semibold text-slate-800">3. Tại Nhà Khách Hàng</p>
              <p className="text-slate-500 mt-0.5">
                Quét mã = Xác nhận giao hàng thành công.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
