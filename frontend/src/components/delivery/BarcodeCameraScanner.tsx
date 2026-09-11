import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

interface BarcodeCameraScannerProps {
  onScanSuccess: (decodedText: string) => void
  onClose?: () => void
  isInline?: boolean
}

// Hàm phát âm thanh "BEEP" chuẩn máy quét kho PDA
const playScannerBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1900, ctx.currentTime) // Tần số 1900 Hz tiếng tít đanh
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch {
    // Bỏ qua nếu trình duyệt chưa kích hoạt AudioContext
  }
}

export const BarcodeCameraScanner: React.FC<BarcodeCameraScannerProps> = ({
  onScanSuccess,
  onClose,
  isInline = false,
}) => {
  const containerId = useRef(`barcode-scanner-${Math.random().toString(36).slice(2, 8)}`).current
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [cameraError, setCameraError] = useState<'INSECURE_CONTEXT' | 'PERMISSION_DENIED' | 'NOT_FOUND' | string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [cooldown, setCooldown] = useState(false)
  const [isFileScanning, setIsFileScanning] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileContainerId = useRef(`file-scanner-${Math.random().toString(36).slice(2, 8)}`).current

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || isLocalhost)

  // 1. Lấy danh sách Camera của thiết bị
  useEffect(() => {
    let isMounted = true

    if (!isSecure) {
      setCameraError('INSECURE_CONTEXT')
      return
    }

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Ưu tiên camera sau (environment/back)
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('sau') ||
            d.label.toLowerCase().includes('environment')
          )
          setSelectedCameraId(backCam ? backCam.id : devices[0].id)
        } else {
          setCameraError('NOT_FOUND')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Lỗi lấy danh sách camera:', err)
        if (!isSecure) {
          setCameraError('INSECURE_CONTEXT')
        } else {
          setCameraError('PERMISSION_DENIED')
        }
      })

    return () => {
      isMounted = false
    }
  }, [isSecure])

  // Xử lý quét mã từ file ảnh tải lên
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsFileScanning(true)
    try {
      const html5QrCode = new Html5Qrcode(fileContainerId)
      const decodedText = await html5QrCode.scanFile(file, false)
      if (decodedText) {
        const clean = decodedText.trim()
        playScannerBeep()
        setLastScanned(clean)
        onScanSuccess(clean)
      }
    } catch (err: any) {
      alert('Không nhận diện được mã vạch trong ảnh đã tải lên. Vui lòng chụp rõ nét hơn hoặc nhập mã tay.')
    } finally {
      setIsFileScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 2. Khởi động / dừng luồng quét Camera
  useEffect(() => {
    if (!selectedCameraId) return

    const html5QrCode = new Html5Qrcode(containerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.ITF,
      ],
      verbose: false,
    })

    scannerRef.current = html5QrCode

    const config = {
      fps: 12,
      qrbox: { width: 280, height: 160 },
      aspectRatio: 1.777778,
    }

    html5QrCode
      .start(
        selectedCameraId,
        config,
        (decodedText) => {
          if (cooldown) return
          const cleanText = decodedText.trim()
          if (!cleanText) return

          // Phát âm thanh Beep
          playScannerBeep()

          setLastScanned(cleanText)
          setCooldown(true)

          // Gọi callback xử lý mã
          onScanSuccess(cleanText)

          // Tránh quét lặp lại trong 1.8 giây
          setTimeout(() => {
            setCooldown(false)
          }, 1800)
        },
        () => {
          // Bỏ qua lỗi nhận diện frame rỗng
        }
      )
      .then(() => {
        setIsScanning(true)
        setCameraError(null)
      })
      .catch((err) => {
        console.error('Lỗi khởi động Html5Qrcode:', err)
        setCameraError('Không thể mở luồng video từ Camera đã chọn. Vui lòng thử chọn Camera khác.')
        setIsScanning(false)
      })

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch((e) => console.warn('Lỗi dừng camera:', e))
      }
    }
  }, [selectedCameraId, containerId])

  return (
    <div className={`relative overflow-hidden ${isInline ? 'rounded-2xl border-2 border-emerald-400 bg-slate-950 shadow-lg' : 'w-full'}`}>
      {/* Thanh Header Điều Khiển Camera */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
          <span className="font-bold">
            {isScanning ? '📷 Camera Đang Quét Mã Vạch...' : 'Đang kết nối Camera...'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Chọn camera nếu có nhiều camera */}
          {cameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium"
            >
              {cameras.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
              title="Tắt Camera"
            >
              ✕ Tắt Camera
            </button>
          )}
        </div>
      </div>

      {/* Input ẩn để tải ảnh mã vạch lên quét khi Camera bị chặn */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <div id={fileContainerId} style={{ display: 'none' }} />

      {/* Lỗi Chrome Chặn Hoặc Chưa Cấp Quyền Camera */}
      {cameraError === 'INSECURE_CONTEXT' && (
        <div className="p-4 bg-amber-950/90 text-amber-200 text-xs border-b border-amber-800 space-y-2.5">
          <div className="flex items-center gap-2 font-black text-amber-300">
            <span className="text-base">🔒</span>
            <span>Google Chrome Chặn Camera Do Tên Miền HTTP (.local)</span>
          </div>
          <p className="text-[11px] text-amber-100/90 leading-relaxed font-medium">
            Chính sách bảo mật của Chrome <b>chỉ kích hoạt Camera trên HTTPS hoặc localhost</b>.
            Tên miền <code className="px-1.5 py-0.5 bg-amber-900/60 rounded text-amber-300 font-mono">{typeof window !== 'undefined' ? window.location.host : ''}</code> đang chạy HTTP nên trình duyệt tự động khóa Camera.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href="http://localhost:3000/delivery"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition inline-flex items-center gap-1.5 shadow-md"
            >
              <span>🚀</span>
              <span>Chuyển Sang http://localhost:3000/delivery (Mở Cam Ngay)</span>
            </a>
            <button
              type="button"
              disabled={isFileScanning}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-200 rounded-xl font-black text-xs transition border border-amber-700/60 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>{isFileScanning ? 'Đang giải mã...' : 'Tải Ảnh Kiện Hàng Để Quét'}</span>
            </button>
          </div>
          <div className="pt-1 text-[10px] text-amber-300/80 font-mono">
            💡 Mẹo dùng tiếp tên miền .local: Vào <b>chrome://flags/#unsafely-treat-insecure-origin-as-secure</b> ➔ Thêm URL này ➔ Enabled ➔ Relaunch.
          </div>
        </div>
      )}

      {cameraError === 'PERMISSION_DENIED' && (
        <div className="p-4 bg-rose-950/90 text-rose-200 text-xs border-b border-rose-800 space-y-2.5">
          <div className="flex items-center gap-2 font-black text-rose-300">
            <span className="text-base">🚫</span>
            <span>Trình Duyệt Chưa Cấp Quyền Truy Cập Camera</span>
          </div>
          <p className="text-[11px] text-rose-100/90 leading-relaxed font-medium">
            Chrome đang chặn Camera của trang này do quyền bị từ chối trước đó.
            <br />
            <b>👉 Cách mở lại:</b> Bấm vào biểu tượng <b>Cài đặt trang web</b> (icon 2 gạch trượt hoặc ổ khóa bên trái thanh nhập URL) ➔ Chuyển mục <b>Camera</b> sang <b>"Cho phép" (Allow)</b> ➔ Bấm nút Tải Lại Trang bên dưới.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl font-black text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-md"
            >
              <span>🔄</span>
              <span>Tải Lại Trang (F5)</span>
            </button>
            <button
              type="button"
              disabled={isFileScanning}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-black text-xs transition border border-slate-700 cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>{isFileScanning ? 'Đang giải mã...' : 'Tải Ảnh Kiện Hàng Để Quét'}</span>
            </button>
          </div>
        </div>
      )}

      {cameraError && cameraError !== 'INSECURE_CONTEXT' && cameraError !== 'PERMISSION_DENIED' && (
        <div className="p-4 bg-rose-950/90 text-rose-200 text-xs font-bold border-b border-rose-800 space-y-2 text-center">
          <p>⚠️ {cameraError === 'NOT_FOUND' ? 'Không tìm thấy thiết bị Camera trên máy này' : cameraError}</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              disabled={isFileScanning}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer"
            >
              📁 Tải Ảnh Kiện Hàng Lên Quét Thay Thế
            </button>
          </div>
        </div>
      )}

      {/* Viewfinder Quét Mã Vạch */}
      <div className="relative w-full max-h-[360px] flex items-center justify-center bg-black overflow-hidden">
        <div id={containerId} className="w-full max-w-md mx-auto" />

        {/* Khung ngắm & Tia Laser Scan Line */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Khung nhắm Barcode */}
            <div className={`relative w-[280px] h-[160px] rounded-2xl border-2 transition-all duration-300 ${
              cooldown ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.8)] scale-105' : 'border-emerald-500/80'
            }`}>
              {/* 4 Góc Reticle */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></span>
              <span className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></span>
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></span>
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></span>

              {/* Tia Laser Quét Đỏ/Xanh Chạy Lên Xuống */}
              {!cooldown && (
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-pulse"
                  style={{
                    animation: 'laserScan 1.8s ease-in-out infinite alternate',
                  }}
                />
              )}

              {/* Hiệu ứng khi quét trúng */}
              {cooldown && (
                <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-xs flex items-center justify-center rounded-2xl animate-in zoom-in-95">
                  <div className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg">
                    ✓ ĐÃ QUÉT THÀNH CÔNG
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thông Báo Mã Vừa Quét Được */}
      {lastScanned && (
        <div className="bg-emerald-950/90 text-emerald-300 px-4 py-2 border-t border-emerald-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <span>⚡ Mã vừa quét:</span>
            <b className="text-white text-sm bg-emerald-900 px-2 py-0.5 rounded border border-emerald-600">{lastScanned}</b>
          </div>
          <span className="text-[10px] text-emerald-400 shrink-0 font-sans font-bold">
            {cooldown ? 'Đang kích hoạt xử lý...' : 'Sẵn sàng quét tiếp'}
          </span>
        </div>
      )}

      {/* Hướng Dẫn Nhanh */}
      <div className="bg-slate-900/90 text-slate-400 px-4 py-2 text-[10px] text-center font-medium border-t border-slate-800 flex justify-center items-center gap-4">
        <span>💡 Hướng mã vạch kiện hàng (Barcode / QR Code) vào khung ngắm</span>
        <span>•</span>
        <span>Âm thanh tít tự động kích hoạt</span>
      </div>

      <style>{`
        @keyframes laserScan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        #${containerId} video {
          object-fit: cover !important;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  )
}
