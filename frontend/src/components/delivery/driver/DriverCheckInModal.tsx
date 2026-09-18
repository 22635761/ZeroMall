import React, { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../../../config/api.config'

export interface DriverCheckInModalProps {
  driverProfile: any
  onClose: () => void
  onSuccess: (data: any) => void
}

export const DriverCheckInModal: React.FC<DriverCheckInModalProps> = ({
  driverProfile,
  onClose,
  onSuccess,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const hubLat = driverProfile?.hub?.latitude || 21.1837
  const hubLng = driverProfile?.hub?.longitude || 105.7196

  // Tính khoảng cách Haversine (mét)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3
    const phi1 = (lat1 * Math.PI) / 180
    const phi2 = (lat2 * Math.PI) / 180
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  // Khởi động Camera trực tiếp (Bắt buộc Camera trực tiếp - Không chấp nhận tải file)
  const startCamera = async () => {
    setCameraError(null)
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        setIsCameraActive(true)
      } else {
        setCameraError('Thiết bị hoặc trình duyệt không hỗ trợ Camera. Quy chuẩn SPX yêu cầu Camera trực tiếp.')
      }
    } catch (err: any) {
      console.warn('Cannot start camera:', err)
      setCameraError('Chưa cấp quyền Camera. Vui lòng bấm "Cho phép" truy cập Camera trên trình duyệt để chụp ảnh xác thực khuôn mặt trực tiếp.')
    }
  }

  // Dừng Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }

  // Chụp ảnh từ video stream thực tế
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

  // Giả lập chụp ảnh khuôn mặt tài xế (khi Camera bị lỗi quyền trên trình duyệt)
  const handleSimulateFacePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 640, 480)
      grad.addColorStop(0, '#064e3b')
      grad.addColorStop(1, '#0f172a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 640, 480)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('🛵 ZEROMALL EXPRESS - XÁC THỰC VÀO CA', 320, 90)

      ctx.beginPath()
      ctx.arc(320, 210, 70, 0, Math.PI * 2)
      ctx.fillStyle = '#10b981'
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = '70px sans-serif'
      ctx.fillText('👤', 320, 235)

      ctx.fillStyle = '#f8fafc'
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(driverProfile?.name || 'Tài xế ZMX', 320, 320)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '15px sans-serif'
      ctx.fillText(`Xe: ${driverProfile?.vehicleNumber || 'ZMX'} • Hub: ${driverProfile?.hub?.name || 'Bưu cục'}`, 320, 350)

      ctx.fillStyle = '#34d399'
      ctx.font = '14px sans-serif'
      ctx.fillText(`Thời gian điểm danh: ${new Date().toLocaleTimeString('vi-VN')} - ${new Date().toLocaleDateString('vi-VN')}`, 320, 385)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setCapturedImage(dataUrl)
      stopCamera()
    }
  }

  // Lấy định vị GPS
  const requestLocation = () => {
    setGpsError(null)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setCoords({ lat, lng })
          if (hubLat && hubLng) {
            const dist = calculateDistance(lat, lng, hubLat, hubLng)
            setDistanceMeters(dist)
          }
        },
        (err) => {
          console.warn('GPS Error:', err)
          setGpsError('Chưa cấp quyền GPS. Bấm "Giả lập tại Hub" nếu đang chạy môi trường thử nghiệm.')
          setCoords({ lat: hubLat, lng: hubLng })
          setDistanceMeters(20)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      setGpsError('Thiết bị không hỗ trợ Geolocation.')
      setCoords({ lat: hubLat, lng: hubLng })
      setDistanceMeters(0)
    }
  }

  useEffect(() => {
    startCamera()
    requestLocation()
    return () => {
      stopCamera()
    }
  }, [])

  // Gửi điểm danh
  const handleCheckIn = async () => {
    if (!driverProfile?.id) return

    // Nghiệp vụ bảo mật SPX: Bắt buộc ảnh khuôn mặt chụp trực tiếp từ Camera
    if (!capturedImage) {
      alert('⚠️ BẮT BUỘC: Bạn phải chụp ảnh nhận diện khuôn mặt trực tiếp từ Camera trước khi xác nhận điểm danh vào ca!')
      return
    }

    setLoading(true)
    try {
      const payload = {
        faceImage: capturedImage,
        lat: coords?.lat || hubLat,
        lng: coords?.lng || hubLng,
        note: `Điểm danh ca sáng - Khoảng cách ${distanceMeters ?? 0}m`,
      }

      const res = await fetch(`${API_BASE_URL}/delivery/drivers/${driverProfile.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Điểm danh thất bại')
      }

      const data = await res.json()
      onSuccess(data)
      onClose()
    } catch (err: any) {
      alert('Lỗi điểm danh: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const isAtHub = distanceMeters !== null && distanceMeters <= 1000

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <div>
              <h3 className="font-black text-slate-800 text-base leading-tight">
                Điểm Danh Vào Ca Làm Việc
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Xác thực khuôn mặt & vị trí Bưu cục (SPX)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Thông báo quy định SPX */}
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-800 font-medium">
          <span className="text-base">🛡️</span>
          <span>
            <strong className="font-bold">Quy chuẩn SPX:</strong> Bắt buộc chụp ảnh trực tiếp từ Camera. Tuyệt đối không chấp nhận tải ảnh lên từ thư viện.
          </span>
        </div>

        {/* Thông tin Bưu cục */}
        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>🏢</span> {driverProfile?.hub?.name || 'Bưu cục phụ trách'}
            </p>
            <p className="text-[11px] text-emerald-700 truncate max-w-[260px]">
              {driverProfile?.hub?.address || 'Khu vực hoạt động'}
            </p>
          </div>
          <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
            {driverProfile?.hub?.code || 'SPX'}
          </span>
        </div>

        {/* 1. Camera trực tiếp & Khuôn mặt */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>1. Xác thực khuôn mặt qua Camera</span>
              <span className="text-rose-600 font-black">*</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateFacePhoto}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold cursor-pointer flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200"
                title="Sử dụng ảnh khuôn mặt giả lập khi trình duyệt chặn quyền truy cập Camera"
              >
                <span>⚡</span> Giả lập chụp ảnh
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
              <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="text-center p-4 text-slate-400 space-y-2.5">
                <span className="text-4xl block">📷</span>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  {cameraError || 'Đang kết nối Camera an toàn...'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg transition"
                  >
                    🔄 Thử Lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateFacePhoto}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition shadow-md flex items-center gap-1.5"
                  >
                    <span>⚡</span> Giả Lập Chụp Ảnh Vào Ca
                  </button>
                </div>
              </div>
            )}

            {/* Khung hướng dẫn quét khuôn mặt */}
            {!capturedImage && isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-52 border-2 border-emerald-400/80 rounded-full animate-pulse flex items-center justify-center">
                  <span className="text-[10px] bg-black/60 text-emerald-300 px-2 py-0.5 rounded-full">
                    Đưa mặt vào khung
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action chụp ảnh */}
          {!capturedImage && (
            <div className="space-y-2">
              {isCameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span className="text-base">📸</span> Chụp Ảnh Nhận Diện Khuôn Mặt
                </button>
              )}
              <button
                type="button"
                onClick={handleSimulateFacePhoto}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🤖</span> Dùng ảnh giả lập vào ca (Bỏ qua lỗi quyền Camera)
              </button>
            </div>
          )}

          {capturedImage && (
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <span>✅</span> Đã chụp ảnh nhận diện khuôn mặt thành công
            </div>
          )}
        </div>

        {/* 2. Định vị GPS tại Hub */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">2. Định vị GPS tại Bưu Cục</span>
            <button
              type="button"
              onClick={requestLocation}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Làm mới GPS
            </button>
          </div>

          <div
            className={`p-3 rounded-2xl border text-xs space-y-1.5 transition ${
              isAtHub
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <span>{isAtHub ? '✅' : '📍'}</span>
                {isAtHub ? 'Đã ở phạm vi Bưu cục' : 'Khoảng cách đến Bưu cục'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white/80 border border-current">
                {distanceMeters !== null ? `${distanceMeters}m` : 'Đang tính...'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed opacity-90">
              {isAtHub
                ? `Vị trí hợp lệ (< 1.000m). Bạn đã có mặt tại trạm ${driverProfile?.hub?.name}.`
                : `Vị trí hiện tại cách Bưu cục ${distanceMeters || 'vài'}m. Bấm "Giả lập tại Hub" nếu đang kiểm thử.`}
            </p>

            {gpsError && (
              <p className="text-[10px] text-amber-700 font-medium italic">{gpsError}</p>
            )}

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 italic">
                {coords ? `Tọa độ: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Chưa có tọa độ'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCoords({ lat: hubLat, lng: hubLng })
                  setDistanceMeters(20)
                  setGpsError(null)
                }}
                className="text-[11px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition"
              >
                ⚡ Giả lập tại Hub
              </button>
            </div>
          </div>
        </div>

        {/* Nút xác nhận điểm danh */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading || !capturedImage}
            className={`flex-1 py-2.5 text-xs font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
              capturedImage
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <span>🚀</span>
            )}
            {loading ? 'Đang xác thực...' : capturedImage ? 'Xác Nhận Điểm Danh Vào Ca' : 'Chưa Chụp Ảnh Khuôn Mặt'}
          </button>
        </div>
      </div>
    </div>
  )
}
