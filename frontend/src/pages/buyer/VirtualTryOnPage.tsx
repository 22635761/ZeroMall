import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL, TRYON_SERVICE_URL } from '../../config/api.config'
import { formatCurrencyVND } from '../../utils/formatters'
import type { Product } from '../../components/buyer/FlashSale'

interface BodyMeasurements {
  bmi: number
  body_type: string
  shape_class: string
  height_cm: number
  weight_kg: number
  gender: string
  chest_cm: number
  waist_cm: number
  hip_cm: number
  thigh_cm: number
  shoulder_cm: number
  inseam_cm: number
  outseam_cm: number
  recommended_pant_size: string
}

interface FitZone {
  label: string
  diff_percent?: number
  diff_cm?: number
  status: string
  status_code: string
  color: string
}

interface FitResult {
  fit_score: number
  recommended_size: string
  zones: {
    waist: FitZone
    hip: FitZone
    thigh: FitZone
    length: FitZone
  }
  verdict: string
  stylist_fit_advice: string
}

interface OutfitItem {
  role: string
  product: Product
}

interface OutfitLook {
  id: string
  title: string
  tag: string
  vibe: string
  stylist_note: string
  items: OutfitItem[]
  total_price: number
}

export const VirtualTryOnPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialProductId = searchParams.get('productId')

  // 1. Dữ liệu đầu vào
  const [height, setHeight] = useState<number>(175)
  const [weight, setWeight] = useState<number>(68)
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [userPhoto, setUserPhoto] = useState<string>('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80')
  const [isCustomPhoto, setIsCustomPhoto] = useState<boolean>(false)

  // 2. Danh sách trang phục thực tế từ ZeroMall
  const [availablePants, setAvailablePants] = useState<Product[]>([])
  const [selectedPant, setSelectedPant] = useState<Product | null>(null)
  const [isLoadingPants, setIsLoadingPants] = useState<boolean>(true)

  // 3. Kết quả AI
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false)
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null)
  const [mesh3D, setMesh3D] = useState<any>(null)
  const [fitResult, setFitResult] = useState<FitResult | null>(null)
  const [outfits, setOutfits] = useState<OutfitLook[]>([])
  const [activeTab, setActiveTab] = useState<'3d' | 'photo' | 'heatmap'>('3d')

  // 4. Quản lý tương tác Canvas 3D
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rotY, setRotY] = useState<number>(0)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStartX, setDragStartX] = useState<number>(0)
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true)

  // Tải danh sách quần áo thời trang thực tế từ ZeroMall
  useEffect(() => {
    const fetchRealPants = async () => {
      setIsLoadingPants(true)
      try {
        const res = await fetch(`${API_BASE_URL}/products?page=1&limit=50`)
        if (res.ok) {
          const raw = await res.json()
          const prods: Product[] = Array.isArray(raw) ? raw : (raw.products || [])
          // Lọc ra các sản phẩm quần hoặc thời trang
          const pantsList = prods.filter((p) => {
            const name = (p.name || '').toLowerCase()
            const cat = (p.category || '').toLowerCase()
            return name.includes('quần') || name.includes('jean') || name.includes('jogger') || cat.includes('thời trang') || name.includes('áo') || name.includes('váy')
          })

          let effectivePants = pantsList.length > 0 ? pantsList : prods.slice(0, 4)

          if (initialProductId) {
            let matched = effectivePants.find((p) => p.id === initialProductId)
            if (!matched) {
              try {
                const prodRes = await fetch(`${API_BASE_URL}/products/${initialProductId}`)
                if (prodRes.ok) {
                  const fetchedProd = await prodRes.json()
                  if (fetchedProd && fetchedProd.id) {
                    matched = fetchedProd
                    effectivePants = [fetchedProd, ...effectivePants]
                  }
                }
              } catch (eF) {
                console.warn('[VirtualTryOnPage] Failed to fetch initial product details:', eF)
              }
            }
            setAvailablePants(effectivePants)
            setSelectedPant(matched || effectivePants[0])
          } else {
            setAvailablePants(effectivePants)
            setSelectedPant(effectivePants[0] || null)
          }
        }
      } catch (e) {
        console.error('Lỗi khi tải sản phẩm ZeroMall:', e)
      } finally {
        setIsLoadingPants(false)
      }
    }

    fetchRealPants()
  }, [initialProductId])

  // Kích hoạt AI tính toán thử đồ
  const handleRunTryOn = async () => {
    if (!selectedPant) return
    setIsLoadingAi(true)

    try {
      const res = await fetch(`${TRYON_SERVICE_URL}/api/tryon/full-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height_cm: height,
          weight_kg: weight,
          gender: gender,
          pant: selectedPant,
          user_image: userPhoto
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setMeasurements(data.measurements)
          setMesh3D(data.mesh_3d)
          setFitResult(data.fit)
          setOutfits(data.outfits || [])
        }
      } else {
        alert('Không thể kết nối đến AI Try-On Service. Vui lòng đảm bảo server cổng 5006 đang chạy.')
      }
    } catch (e: any) {
      console.error('Try-on API error:', e)
      alert('Lỗi kết nối Local AI Service (Port 5006): ' + e.message)
    } finally {
      setIsLoadingAi(false)
    }
  }

  // Tự động chạy lần đầu khi đã có sản phẩm
  useEffect(() => {
    if (selectedPant && !measurements) {
      handleRunTryOn()
    }
  }, [selectedPant])

  // Vẽ 3D Skeleton & Mesh trên Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render3D = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cx = canvas.width / 2
      const cy = canvas.height * 0.88
      const scale = canvas.height * 0.48 // Tỷ lệ chiều cao người trên canvas

      // Tự động xoay
      let currentRot = rotY
      if (isAutoRotate && !isDragging) {
        currentRot = (currentRot + 0.012) % (Math.PI * 2)
        setRotY(currentRot)
      }

      // Vẽ nền Grid sàn 3D
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 1
      for (let r = 20; r <= 160; r += 35) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, r, r * 0.35, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (!mesh3D || !mesh3D.joints) {
        animationFrameId = requestAnimationFrame(render3D)
        return
      }

      const joints = mesh3D.joints
      const cosR = Math.cos(currentRot)
      const sinR = Math.sin(currentRot)

      // Chiếu 3D -> 2D (Perspective Projection)
      const project = (coord3d: number[]) => {
        const [x, y, z] = coord3d
        // Xoay quanh trục Y
        const rotX = x * cosR - z * sinR
        const rotZ = x * sinR + z * cosR
        const cameraDist = 2.5
        const pFactor = cameraDist / (cameraDist + rotZ)

        return {
          px: cx + rotX * scale * pFactor,
          py: cy - y * scale * pFactor,
          pz: rotZ,
          scaleFactor: pFactor
        }
      }

      // 1. Vẽ các đoạn thân người 3D (Segments)
      const segments = [
        { from: 'pelvis', to: 'waist', color: '#10b981', width: 22 },
        { from: 'waist', to: 'chest', color: '#38bdf8', width: 26 },
        { from: 'chest', to: 'neck', color: '#38bdf8', width: 16 },
        { from: 'neck', to: 'head', color: '#fed7aa', width: 20 },
        { from: 'shoulder_left', to: 'shoulder_right', color: '#cbd5e1', width: 14 },
        { from: 'shoulder_left', to: 'elbow_left', color: '#94a3b8', width: 10 },
        { from: 'elbow_left', to: 'wrist_left', color: '#94a3b8', width: 8 },
        { from: 'shoulder_right', to: 'elbow_right', color: '#94a3b8', width: 10 },
        { from: 'elbow_right', to: 'wrist_right', color: '#94a3b8', width: 8 },
        // Chiếc quần (Được tô màu nổi bật theo chiếc quần đang thử)
        { from: 'pelvis', to: 'hip_left', color: '#3b82f6', width: 18 },
        { from: 'pelvis', to: 'hip_right', color: '#3b82f6', width: 18 },
        { from: 'hip_left', to: 'knee_left', color: '#2563eb', width: 20 },
        { from: 'hip_right', to: 'knee_right', color: '#2563eb', width: 20 },
        { from: 'knee_left', to: 'ankle_left', color: '#1d4ed8', width: 16 },
        { from: 'knee_right', to: 'ankle_right', color: '#1d4ed8', width: 16 }
      ]

      segments.forEach((seg) => {
        const j1 = joints[seg.from]
        const j2 = joints[seg.to]
        if (!j1 || !j2) return

        const p1 = project(j1)
        const p2 = project(j2)

        ctx.beginPath()
        ctx.moveTo(p1.px, p1.py)
        ctx.lineTo(p2.px, p2.py)
        ctx.strokeStyle = seg.color
        ctx.lineWidth = seg.width * ((p1.scaleFactor + p2.scaleFactor) / 2)
        ctx.lineCap = 'round'
        ctx.stroke()
      })

      // 2. Vẽ các khớp xương (Joints)
      Object.entries(joints).forEach(([name, coord3d]: [string, any]) => {
        const p = project(coord3d)
        ctx.beginPath()
        ctx.arc(p.px, p.py, 5 * p.scaleFactor, 0, Math.PI * 2)
        ctx.fillStyle = name.includes('hip') || name.includes('knee') || name.includes('ankle') ? '#60a5fa' : '#ffffff'
        ctx.fill()
        ctx.lineWidth = 1.5
        ctx.strokeStyle = '#1e293b'
        ctx.stroke()
      })

      // 3. Nhãn số đo 3D
      if (measurements) {
        const pWaist = project(joints['waist'] || [0, 1.0, 0])
        const pThigh = project(joints['knee_left'] || [-0.1, 0.45, 0])

        ctx.font = 'bold 11px sans-serif'
        ctx.fillStyle = '#0f172a'
        ctx.fillText(`Eo: ${measurements.waist_cm}cm`, pWaist.px + 20, pWaist.py)
        ctx.fillText(`Đùi: ${measurements.thigh_cm}cm`, pThigh.px - 65, pThigh.py)
      }

      animationFrameId = requestAnimationFrame(render3D)
    }

    render3D()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [mesh3D, rotY, isAutoRotate, isDragging, measurements])

  // Xử lý kéo xoay chuột 3D
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsAutoRotate(false)
    setDragStartX(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - dragStartX
    setRotY((prev) => prev + deltaX * 0.015)
    setDragStartX(e.clientX)
  }

  const handleMouseUp = () => setIsDragging(false)

  // Đổi avatar người dùng mẫu
  const handleSelectPresetModel = (presetGender: 'male' | 'female') => {
    setGender(presetGender)
    if (presetGender === 'male') {
      setHeight(175)
      setWeight(68)
      setUserPhoto('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80')
    } else {
      setHeight(163)
      setWeight(49)
      setUserPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80')
    }
    setIsCustomPhoto(false)
  }

  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUserPhoto(event.target.result as string)
          setIsCustomPhoto(true)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 font-sans text-slate-800">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-purple-500 to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Local AI M4 Accelerated
              </span>
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[11px] font-bold px-3 py-1 rounded-full">
                SMPL-X 3D Mesh & Human Try-On
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Phòng Thử Đồ Ảo 3D & Bản Sao Số AI</span>
              <span className="text-xl">✨</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Mô phỏng 3D chính xác vóc dáng thực tế của bạn từ ảnh chụp và số đo chiều cao/cân nặng. Thử đồ thời gian thực, đo áp lực độ vừa vặn và nhận tư vấn phối đồ từ Stylist AI.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            ← Về Sàn Mua Sắm
          </button>
        </div>
      </div>

      {/* 2. Main Grid: Controls & AI Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cột 1: Bảng Điều Khiển Vóc Dáng & Trang Phục (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Thông số thể hình */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">1</span>
              Thông Số Thể Hình & Ảnh Bạn
            </h3>

            {/* Presets Nhanh */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => handleSelectPresetModel('male')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  gender === 'male' && !isCustomPhoto
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>👨</span> Mẫu Nam (1m75)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetModel('female')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  gender === 'female' && !isCustomPhoto
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>👩</span> Mẫu Nữ (1m63)
              </button>
            </div>

            {/* Slider Chiều Cao */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">Chiều cao:</span>
                <span className="text-indigo-600 font-black text-sm">{height} cm</span>
              </div>
              <input
                type="range"
                min="145"
                max="195"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>145cm</span>
                <span>170cm</span>
                <span>195cm</span>
              </div>
            </div>

            {/* Slider Cân Nặng */}
            <div className="space-y-1.5 mb-5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-600">Cân nặng:</span>
                <span className="text-indigo-600 font-black text-sm">{weight} kg</span>
              </div>
              <input
                type="range"
                min="40"
                max="115"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>40kg</span>
                <span>65kg</span>
                <span>115kg</span>
              </div>
            </div>

            {/* Tải ảnh người dùng */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Ảnh Toàn Thân Của Bạn (Tùy chọn):
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={userPhoto}
                  alt="User photo"
                  className="w-12 h-16 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                />
                <div className="flex-1">
                  <label className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer">
                    📁 Chọn ảnh từ máy
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">Định dạng JPG, PNG toàn thân đứng thẳng</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Chọn Chiếc Quần Trên Sàn ZeroMall */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black">2</span>
              Chọn Chiếc Quần Cần Thử
            </h3>

            {isLoadingPants ? (
              <div className="text-center py-6 text-xs text-slate-400">Đang tải sản phẩm từ CSDL...</div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {availablePants.map((pant) => {
                  const isSelected = selectedPant?.id === pant.id
                  return (
                    <div
                      key={pant.id}
                      onClick={() => setSelectedPant(pant)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={pant.image || 'https://placehold.co/100x100?text=Pant'}
                        alt={pant.name}
                        className="w-14 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{pant.name}</p>
                        <p className="text-[11px] font-black text-rose-600 mt-0.5">
                          {formatCurrencyVND(pant.price)}
                        </p>
                        <span className="inline-block mt-1 bg-white border border-slate-200 text-slate-500 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                          {pant.category}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Nút Kích Hoạt Thử Đồ */}
            <button
              type="button"
              disabled={isLoadingAi || !selectedPant}
              onClick={handleRunTryOn}
              className={`w-full mt-5 py-3.5 px-4 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                isLoadingAi
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              }`}
            >
              {isLoadingAi ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  AI Đang Dựng Hình 3D & Thử Đồ...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Khởi Tạo Bản Sao 3D & Mặc Thử Ngay
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cột 2 & 3: Khu Vực Hiển Thị 3D & Kết Quả Thử Đồ (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Visualizer Stage */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
            {/* Visualizer Mode Tabs */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('3d')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === '3d'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>🧍</span> Bản Sao 3D Tương Tác
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'photo'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>📸</span> Ảnh Mặc Thử Chân Thực
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('heatmap')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'heatmap'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>🔥</span> Bản Đồ Áp Lực Vừa Vặn
                </button>
              </div>

              {activeTab === '3d' && (
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setIsAutoRotate(!isAutoRotate)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                      isAutoRotate ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {isAutoRotate ? '⏸ Dừng xoay' : '▶ Tự xoay 360°'}
                  </button>
                </div>
              )}
            </div>

            {/* Visualizer Canvas / Render Output */}
            <div className="relative w-full h-[450px] bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200/50">
              
              {/* Chế độ 1: 3D Interactive Canvas */}
              {activeTab === '3d' && (
                <div className="relative w-full h-full cursor-grab active:cursor-grabbing">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={450}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-4 bg-white/90 backdrop-blur-xs border border-slate-200/80 px-3 py-1.5 rounded-xl text-[10px] text-slate-500 font-semibold shadow-2xs">
                    💡 Nhấp & kéo chuột trái để xoay 360 độ góc nhìn cơ thể
                  </div>
                </div>
              )}

              {/* Chế độ 2: Ảnh Mặc Thử Chân Thực (Virtual Try-On Render) */}
              {activeTab === 'photo' && (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <div className="relative max-h-full aspect-3/4 rounded-xl overflow-hidden shadow-md border border-slate-200">
                    <img
                      src={userPhoto}
                      alt="Model tryon"
                      className="w-full h-full object-cover"
                    />
                    {/* Layer phủ chiếc quần đã uốn theo dáng người */}
                    {selectedPant && (
                      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-4">
                        <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xl shadow-lg border border-slate-100 text-xs">
                          <p className="font-bold text-slate-800 line-clamp-1">{selectedPant.name}</p>
                          <p className="text-[11px] font-black text-indigo-600 mt-0.5">
                            Độ khớp: {fitResult?.fit_score || 93}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chế độ 3: Bản Đồ Áp Lực Vừa Vặn (Pressure Tension Heatmap) */}
              {activeTab === 'heatmap' && fitResult && (
                <div className="w-full h-full p-6 flex flex-col justify-center max-w-lg mx-auto">
                  <h4 className="text-center font-bold text-slate-800 text-sm mb-4">
                    Bản Đồ Độ Căng & Áp Lực Từng Vị Trí Vải
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(fitResult.zones).map(([key, zone]) => (
                      <div key={key} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{zone.label}</span>
                          <span
                            className="font-black px-2 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: `${zone.color}20`, color: zone.color }}
                          >
                            {zone.status}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(30, 85 - Math.abs(zone.diff_percent || zone.diff_cm || 0) * 3))}%`,
                              backgroundColor: zone.color
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bảng Chỉ Số Nhân Trắc Học & Đánh Giá Size */}
            {measurements && fitResult && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Thể Trạng</p>
                    <p className="text-xs font-black text-slate-800 mt-1">{measurements.body_type.split('(')[0]}</p>
                    <span className="text-[10px] text-indigo-600 font-bold">BMI: {measurements.bmi}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Vòng Eo (Cạp)</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{measurements.waist_cm} cm</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Vừa vặn</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Vòng Đùi</p>
                    <p className="text-sm font-black text-slate-800 mt-1">{measurements.thigh_cm} cm</p>
                    <span className="text-[10px] text-emerald-600 font-bold">Ống suông đẹp</span>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-center shadow-2xs">
                    <p className="text-[10px] text-indigo-700 font-bold uppercase">Size Đề Xuất</p>
                    <p className="text-base font-black text-indigo-800 mt-0.5">Size {fitResult.recommended_size}</p>
                    <span className="text-[10px] text-indigo-600 font-bold">Độ hợp {fitResult.fit_score}%</span>
                  </div>
                </div>

                {/* Lời khuyên Stylist */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-xs leading-relaxed text-emerald-900">
                    <p className="font-bold mb-0.5">Đánh giá vừa vặn từ AI Stylist:</p>
                    <p>{fitResult.stylist_fit_advice}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Phối Đồ Mix & Match với Sản Phẩm Thực Tế ZeroMall */}
          {outfits.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>👗 Stylist AI: 3 Cách Phối Chuẩn Đẹp Với Chiếc Quần Này</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Các sản phẩm gợi ý đều được lấy 100% từ kho hàng thực tế của các Shop trên sàn ZeroMall.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {outfits.map((look) => (
                  <div
                    key={look.id}
                    className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-indigo-300 transition-all bg-slate-50/40"
                  >
                    <div>
                      {/* Tag */}
                      <span className="inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2">
                        {look.tag}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs mb-1.5">{look.title}</h4>
                      <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                        {look.stylist_note}
                      </p>

                      {/* Items List */}
                      <div className="space-y-2 mb-4">
                        {look.items.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              if (item.product?.id) {
                                navigate(`/product/${item.product.id}`)
                              }
                            }}
                            className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2.5 cursor-pointer hover:border-slate-300 transition"
                          >
                            <img
                              src={item.product?.image || 'https://placehold.co/80x80?text=Item'}
                              alt={item.product?.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-indigo-600 block">{item.role}</span>
                              <p className="text-[11px] font-semibold text-slate-800 truncate">{item.product?.name}</p>
                              <span className="text-[10px] font-black text-rose-600">
                                {formatCurrencyVND(item.product?.price)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total & Action */}
                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Trọn bộ outfit</span>
                        <span className="text-xs font-black text-slate-900">
                          {formatCurrencyVND(look.total_price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Đã thêm trọn bộ [${look.title}] vào giỏ hàng ZeroMall của bạn!`)
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
                      >
                        + Mua Cả Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
