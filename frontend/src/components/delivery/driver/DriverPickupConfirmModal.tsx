import React, { useState, useEffect, useRef } from 'react'
import type { Shipment } from './DriverOrdersTab'

export interface DriverPickupConfirmModalProps {
  shipment: Shipment
  onClose: () => void
  onConfirm: (shipmentId: string, proofImage: string) => Promise<void>
  actionLoading: boolean
}

export const DriverPickupConfirmModal: React.FC<DriverPickupConfirmModalProps> = ({
  shipment,
  onClose,
  onConfirm,
  actionLoading,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Khởi động Camera (ưu tiên camera sau để chụp kiện hàng)
  const startCamera = async () => {
    setCameraError(null)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setIsCameraActive(true)
      } else {
        setCameraError('Thiết bị không hỗ trợ truy cập Camera.')
      }
    } catch (err: any) {
      console.warn('Cannot start camera:', err)
      setCameraError('Chưa cấp quyền Camera. Vui lòng bấm "Cho phép" để chụp ảnh kiện hàng.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth || 640
      canvas.height = videoRef.current.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCapturedImage(dataUrl)
        stopCamera()
      }
    }
  }

  // Giả lập chụp ảnh kiện hàng (khi Camera bị lỗi quyền trên trình duyệt)
  const handleSimulatePackagePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 640, 480)
      grad.addColorStop(0, '#1e293b')
      grad.addColorStop(1, '#0f172a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 640, 480)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📦 BẰNG CHỨNG LẤY HÀNG (POP)', 320, 80)

      ctx.fillStyle = '#10b981'
      ctx.font = 'bold 26px monospace'
      ctx.fillText(shipment.trackingNumber || 'ZMX PACKAGE', 320, 130)

      ctx.beginPath()
      ctx.roundRect(170, 160, 300, 160, 16)
      ctx.fillStyle = '#334155'
      ctx.fill()
      ctx.strokeStyle = '#34d399'
      ctx.lineWidth = 3
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = '55px sans-serif'
      ctx.fillText('📦', 320, 255)

      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(`Shop: ${shipment.pickupAddress?.name || 'Kho Người Bán'}`, 320, 360)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px sans-serif'
      ctx.fillText(`Người nhận: ${shipment.buyerName || 'Khách hàng'}`, 320, 390)

      ctx.fillStyle = '#34d399'
      ctx.font = '13px sans-serif'
      ctx.fillText(`Thời gian lấy: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}`, 320, 420)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setCapturedImage(dataUrl)
      stopCamera()
    }
  }

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const handleConfirm = async () => {
    if (!capturedImage) {
      alert('Vui lòng chụp ảnh kiện hàng tại Shop để làm bằng chứng bàn giao!')
      return
    }
    await onConfirm(shipment.id, capturedImage)
    onClose()
  }

  // Ghép địa chỉ kho
  const shopAddressParts = [
    shipment.pickupAddress?.address,
    shipment.pickupAddress?.ward,
    shipment.pickupAddress?.district,
    shipment.pickupAddress?.province,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim())
    .filter(Boolean)
  const uniqueParts: string[] = []
  for (const part of shopAddressParts) {
    if (!uniqueParts.some((p) => p.toLowerCase() === part.toLowerCase())) {
      uniqueParts.push(part)
    }
  }
  const shopAddress = uniqueParts.length > 0 ? uniqueParts.join(', ') : 'Chưa cập nhật địa chỉ kho'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <div>
              <h3 className="font-black text-slate-800 text-base leading-tight">
                Xác Nhận Đã Lấy Hàng Tại Shop
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Bằng chứng lấy hàng (Proof of Pickup - SPX)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Thông tin đơn hàng & Shop */}
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Mã vận đơn:</span>
            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {shipment.trackingNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">Shop:</span>
            <span className="font-bold text-slate-800">{shipment.pickupAddress?.name || 'Kho Người Bán'}</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed truncate" title={shopAddress}>
            📍 {shopAddress}
          </p>
        </div>

        {/* Khung chụp ảnh kiện hàng */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Chụp ảnh kiện hàng tại kho Shop</span>
              <span className="text-rose-600 font-black">*</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulatePackagePhoto}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold cursor-pointer flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200"
                title="Sử dụng ảnh kiện hàng giả lập khi trình duyệt chặn quyền truy cập Camera"
              >
                <span>⚡</span> Giả lập chụp kiện
              </button>
              {capturedImage && (
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImage(null)
                    startCamera()
                  }}
                  className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <span>🔄</span> Chụp lại
                </button>
              )}
            </div>
          </div>

          <div className="relative aspect-4/3 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
            {capturedImage ? (
              <img src={capturedImage} alt="Kiện hàng" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4 text-slate-400 space-y-2.5">
                <span className="text-4xl block">📦</span>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  {cameraError || 'Đang mở Camera...'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    🔄 Thử Lại Mở Camera
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePackagePhoto}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition shadow-md flex items-center gap-1.5"
                  >
                    <span>⚡</span> Giả Lập Chụp Kiện Hàng
                  </button>
                </div>
              </div>
            )}

            {/* Khung ngắm chụp kiện hàng */}
            {!capturedImage && isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-40 border-2 border-dashed border-emerald-400/90 rounded-2xl flex items-center justify-center">
                  <span className="text-[10px] bg-black/60 text-emerald-300 px-2 py-0.5 rounded-full">
                    Căn rõ kiện hàng & mã vận đơn
                  </span>
                </div>
              </div>
            )}
          </div>

          {!capturedImage && (
            <div className="space-y-2">
              {isCameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-base">📸</span> Chụp Ảnh Kiện Hàng Ngay
                </button>
              )}
              <button
                type="button"
                onClick={handleSimulatePackagePhoto}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🤖</span> Dùng ảnh giả lập kiện hàng (Bỏ qua lỗi quyền Camera)
              </button>
            </div>
          )}

          {capturedImage && (
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <span>✅</span> Đã chụp ảnh kiện hàng thành công
            </div>
          )}
        </div>

        {/* Nút hành động */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={actionLoading || !capturedImage}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              capturedImage
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {actionLoading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <span>📦</span>
            )}
            {actionLoading ? 'Đang lưu bằng chứng...' : capturedImage ? 'Xác Nhận Đã Nhận Kiện' : 'Chưa Chụp Ảnh Kiện Hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}
