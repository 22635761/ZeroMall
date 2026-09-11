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

          <div className="relative aspect-4/3 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
            {capturedImage ? (
              <img src={capturedImage} alt="Kiện hàng" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4 text-slate-400 space-y-2">
                <span className="text-4xl block">📦</span>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  {cameraError || 'Đang mở Camera...'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  🔄 Thử Lại Mở Camera
                </button>
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

          {!capturedImage && isCameraActive && (
            <button
              type="button"
              onClick={capturePhoto}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span className="text-base">📸</span> Chụp Ảnh Kiện Hàng Ngay
            </button>
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
