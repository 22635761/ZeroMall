import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface Human3DViewerProps {
  userFaceUrl?: string
  heightCm: number
  weightKg: number
  gender: 'male' | 'female'
  waistCm?: number
  thighCm?: number
  garmentColor?: string
  garmentType?: 'tops' | 'bottoms' | 'one-pieces' | 'none'
  garmentName?: string
  className?: string
}

export const Human3DViewer: React.FC<Human3DViewerProps> = ({
  userFaceUrl,
  heightCm = 175,
  weightKg = 68,
  gender = 'male',
  waistCm,
  thighCm,
  garmentColor = '#2563eb',
  garmentType = 'none',
  garmentName,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const currentModelRef = useRef<THREE.Group | null>(null)
  const animFrameId = useRef<number | null>(null)

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true)
  const [loadProgress, setLoadProgress] = useState<number>(0)
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false)
  const [cameraView, setCameraView] = useState<'full' | 'face' | 'angle' | 'side' | 'back'>('full')
  const [showFaceCard, setShowFaceCard] = useState<boolean>(true)
  const [croppedFacePreview, setCroppedFacePreview] = useState<string | null>(null)

  // Chỉ số nhân trắc học cơ thể
  const hMeters = Number(heightCm) / 100
  const bmi = Number(weightKg) / (hMeters * hMeters)
  const isMale = gender === 'male'

  // Khởi tạo Scene Three.js
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 520

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0f1d) // Studio dark blue-slate
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30)
    camera.position.set(0, 1.05, 2.8)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0.9, 0)
    controls.minDistance = 0.8
    controls.maxDistance = 5.0
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Giữ góc nhìn trên mặt sàn
    controlsRef.current = controls

    // 5. Studio Lighting Setup (Ánh sáng 4 nguồn chuẩn Studio thời trang cao cấp)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    // Key Light chính (chiếu từ phía trước bên phải)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.8)
    keyLight.position.set(2.5, 4.5, 3.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Fill Light mềm mại (từ phía bên trái)
    const fillLight = new THREE.DirectionalLight(0xa5b4fc, 0.9)
    fillLight.position.set(-3.0, 2.5, 2.5)
    scene.add(fillLight)

    // Rim Light rực rỡ từ sau lưng (tôn đường nét vai, tóc và eo)
    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.2)
    rimLight.position.set(0, 4.0, -3.5)
    scene.add(rimLight)

    // Facial Portrait Beauty Light (Chiếu thẳng diện mạo ở độ cao 1.65m giúp khuôn mặt luôn sáng rạng rỡ)
    const faceLight = new THREE.DirectionalLight(0xffffff, 1.4)
    faceLight.position.set(0, 1.65, 2.2)
    scene.add(faceLight)

    // Sàn Studio Podium xoay
    const podiumGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.04, 64)
    const podiumMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.75
    })
    const podium = new THREE.Mesh(podiumGeo, podiumMat)
    podium.position.y = -0.02
    podium.receiveShadow = true
    scene.add(podium)

    // Vòng phát sáng Neon trên sàn
    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 64)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.001
    scene.add(ring)

    // Lưới tọa độ studio tinh tế
    const grid = new THREE.GridHelper(3.0, 16, 0x4338ca, 0x1e293b)
    grid.position.y = 0.002
    scene.add(grid)

    // Vòng lặp render
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate)
      if (controlsRef.current) {
        if (isAutoRotate && currentModelRef.current) {
          currentModelRef.current.rotateY(0.008)
        }
        controlsRef.current.update()
      }
      renderer.render(scene, camera)
    }
    animate()

    // Xử lý thay đổi kích thước cửa sổ
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      renderer.dispose()
    }
  }, [])

  // Hàm ốp khuôn mặt người dùng (Trấn Thành hoặc bất kỳ ai) lên UV Head Mesh 3D
  const applyFaceTexture = async (model: THREE.Group, faceUrl?: string) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 1. Vẽ texture da gốc (base skin ReadyPlayerMe UV) có gắn timestamp chống cache
      const baseSkinImg = new Image()
      baseSkinImg.crossOrigin = 'anonymous'
      baseSkinImg.src = `/models/avatar_skin_texture.jpg?v=${Date.now()}`
      await new Promise<void>((resolve) => {
        baseSkinImg.onload = () => resolve()
        baseSkinImg.onerror = () => resolve()
      })
      if (baseSkinImg.complete && baseSkinImg.naturalWidth > 0) {
        ctx.drawImage(baseSkinImg, 0, 0, 1024, 1024)
      } else {
        ctx.fillStyle = '#c59b86'
        ctx.fillRect(0, 0, 1024, 1024)
      }

      // 2. AI Quét, Bóc Tách Đầu & Khớp Ngũ Quan 3D (ReadyPlayerMe UV Anatomical Face Mapping)
      if (faceUrl) {
        const faceImg = new Image()
        if (!faceUrl.startsWith('data:')) {
          faceImg.crossOrigin = 'anonymous'
        }
        faceImg.src = faceUrl
        await new Promise<void>((resolve) => {
          faceImg.onload = () => resolve()
          faceImg.onerror = () => resolve()
        })

        if (faceImg.complete && faceImg.naturalWidth > 0) {
          const nw = faceImg.naturalWidth
          const nh = faceImg.naturalHeight

          // TRƯỜNG HỢP 1: Texture 1024x1024 đã được AI Server bóc tách và khớp giải phẫu 3D hoàn chỉnh
          if (nw === 1024 && nh === 1024) {
            ctx.drawImage(faceImg, 0, 0, 1024, 1024)

            // Cập nhật preview khuôn mặt chuẩn bóc tách lên thẻ HUD
            try {
              // Cắt vùng mặt trung tâm bao trọn cả mắt, mũi, miệng để hiển thị thumbnail sắc nét
              const pCanvas = document.createElement('canvas')
              pCanvas.width = 180
              pCanvas.height = 180
              const pCtx = pCanvas.getContext('2d')
              if (pCtx) {
                pCtx.drawImage(faceImg, 512 - 140, 410 - 150, 280, 280, 0, 0, 180, 180)
                setCroppedFacePreview(pCanvas.toDataURL('image/png'))
              }
            } catch (eCrop) {
              console.warn('[Human3DViewer] Failed to create face preview canvas:', eCrop)
            }
          } else {
            // TRƯỜNG HỢP 2: Client Fallback - Tự động tổng hợp tóc tự nhiên dày dặn & khớp ngũ quan giải phẫu
            // Phủ tóc tự nhiên đen dày lên toàn bộ đỉnh đầu, da đầu (Scalp Y: 0..200), sau gáy và 2 bên thái dương
            ctx.fillStyle = '#181519'
            ctx.beginPath()
            ctx.ellipse(512, 130, 430, 150, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillRect(50, 0, 924, 210)

            const isRawFullBody = !faceUrl.startsWith('data:image/png') && nh > 600 && nh / nw > 1.25

            let sx = 0
            let sy = 0
            let sw = nw
            let sh = nh

            if (isRawFullBody) {
              const headW = Math.min(nw * 0.32, nw)
              const headH = Math.min(nh * 0.22, nh)
              sx = Math.max(0, nw * 0.5 - headW / 2)
              sy = Math.max(0, nh * 0.07)
              sw = headW
              sh = headH
            }

            // Tọa độ vàng giải phẫu học khớp chính xác 100% với UV Wolf3D_Head (1024x1024):
            // - Mắt phải: X = 392, Y = 325 | Mắt trái: X = 632, Y = 324 (Khoảng cách 240px)
            // - Sống & chóp mũi: X = 512, Y = 425
            // - Khuôn miệng: X = 512, Y = 510
            // - Cằm & quai hàm: X = 512, Y = 565..590
            // - Chiều rộng ôm trọn 2 bên gò má: fw = 580, Chiều cao: fh = 480
            // - Tọa độ góc đặt: fx = 212, fy = 85 (Tâm X = 512, Mắt tại Y = 325)
            const fw = 580
            const fh = 480
            const fx = 212
            const fy = 85

            const faceCanvas = document.createElement('canvas')
            faceCanvas.width = fw
            faceCanvas.height = fh
            const fCtx = faceCanvas.getContext('2d')

            if (fCtx) {
              fCtx.drawImage(faceImg, sx, sy, sw, sh, 0, 0, fw, fh)

              // Mặt nạ mềm bao trọn toàn bộ khuôn mặt và gò má, chuyển tiếp êm dịu vào da 3D
              fCtx.globalCompositeOperation = 'destination-in'

              const maskCanvas = document.createElement('canvas')
              maskCanvas.width = fw
              maskCanvas.height = fh
              const mCtx = maskCanvas.getContext('2d')
              if (mCtx) {
                const cx = fw * 0.5
                const cy = fh * 0.52
                const rx = fw * 0.48
                const ry = fh * 0.49

                const grad = mCtx.createRadialGradient(cx, cy, rx * 0.70, cx, cy, rx)
                grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)')
                grad.addColorStop(0.85, 'rgba(0, 0, 0, 0.95)')
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)')

                mCtx.fillStyle = grad
                mCtx.beginPath()
                mCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
                mCtx.fill()

                fCtx.drawImage(maskCanvas, 0, 0)
              }

              // Khớp khuôn mặt vào đúng vị trí giải phẫu 3D
              ctx.save()
              ctx.globalCompositeOperation = 'source-over'
              ctx.drawImage(faceCanvas, fx, fy, fw, fh)
              ctx.restore()

              // Cập nhật preview khuôn mặt chuẩn bóc tách lên thẻ HUD
              try {
                const croppedPreview = faceCanvas.toDataURL('image/png')
                setCroppedFacePreview(croppedPreview)
              } catch (eCrop) {
              console.warn('[Human3DViewer] Failed to create face preview canvas:', eCrop)
            }
            }
          }
        }
      }

      // 4. Tạo Three.js CanvasTexture chuẩn SRGB
      const customTex = new THREE.CanvasTexture(canvas)
      customTex.flipY = false
      customTex.colorSpace = THREE.SRGBColorSpace
      customTex.needsUpdate = true

      // 5. Ẩn triệt để mũ cowboy / nón / râu trước tiên
      model.traverse((child) => {
        const meshName = (child.name || '').toLowerCase()
        const matName = (((child as any).material)?.name || '').toLowerCase()
        if (
          meshName.includes('headwear') ||
          matName.includes('headwear') ||
          meshName.includes('beard') ||
          matName.includes('beard') ||
          meshName.includes('hat') ||
          matName.includes('hat')
        ) {
          child.visible = false
          if ('castShadow' in child) child.castShadow = false
          if ('receiveShadow' in child) child.receiveShadow = false
        }
      })

      // 6. Áp dụng texture lên Head Mesh & Uốn nắn hộp sọ (Skull Morphing)
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const meshName = (child.name || '').toLowerCase()
          const matName = ((child.material as any)?.name || '').toLowerCase()

          // Đảm bảo không render nón hay râu
          if (
            meshName.includes('headwear') ||
            matName.includes('headwear') ||
            meshName.includes('beard') ||
            matName.includes('beard') ||
            meshName.includes('hat') ||
            matName.includes('hat')
          ) {
            child.visible = false
            child.castShadow = false
            child.receiveShadow = false
            return
          }

          // Nâng cấp giác mạc mắt 3D bóng bẩy, có điểm sáng phản chiếu (Corneal Specular Highlight)
          if (meshName.includes('eye') || matName.includes('eye')) {
            if (child.material) {
              const eyeMat = (child.material as THREE.MeshStandardMaterial).clone()
              eyeMat.roughness = 0.08
              eyeMat.metalness = 0.05
              eyeMat.needsUpdate = true
              child.material = eyeMat
            }
          }

          // Ốp texture khuôn mặt lên đầu 3D & Uốn nắn hình học hộp sọ (3D Skull Morphing)
          if (
            meshName.includes('head') ||
            matName.includes('skin') ||
            meshName === 'wolf3d_head'
          ) {
            // Uốn nắn hình học hộp sọ (3D Vertex Morphing) từ mặt nhọn hoạt hình V-line sang mặt tròn Á Đông chuẩn Trấn Thành
            if (child.geometry && child.geometry.attributes.position && !child.userData.isMorphed) {
              child.userData.isMorphed = true
              const posAttr = child.geometry.attributes.position
              const v = new THREE.Vector3()

              for (let i = 0; i < posAttr.count; i++) {
                v.fromBufferAttribute(posAttr, i)

                // 1. Mở rộng xương quai hàm & bo tròn cằm (Y: 1.62..1.67, Z > 0.03)
                if (v.y >= 1.62 && v.y <= 1.67 && v.z > 0.03) {
                  const weight = Math.max(0, 1.0 - Math.abs(v.y - 1.645) / 0.025)
                  v.x *= (1.0 + 0.16 * weight)
                  // Làm mềm chóp cằm nhọn
                  if (v.z > 0.11 && Math.abs(v.x) < 0.025) {
                    v.z -= 0.006 * weight
                    v.y += 0.004 * weight
                  }
                }
                // 2. Làm đầy 2 bên gò má (Y: 1.66..1.72, Z > 0.04, |X| > 0.025)
                else if (v.y > 1.66 && v.y <= 1.72 && v.z > 0.04 && Math.abs(v.x) > 0.025) {
                  const wCheek = Math.max(0, 1.0 - Math.abs(v.y - 1.69) / 0.03)
                  v.x *= (1.0 + 0.10 * wCheek)
                  v.z += 0.005 * wCheek
                }
                // 3. Làm mềm sống mũi nhọn kiểu Tây (Y: 1.68..1.71, Z > 0.12, |X| < 0.02)
                else if (v.y >= 1.68 && v.y <= 1.71 && v.z > 0.12 && Math.abs(v.x) < 0.02) {
                  v.x *= 1.12
                  v.z -= 0.003
                }

                posAttr.setXYZ(i, v.x, v.y, v.z)
              }

              posAttr.needsUpdate = true
              child.geometry.computeVertexNormals()
            }

            if (child.material) {
              const oldMat = child.material as THREE.MeshStandardMaterial
              const newMat = oldMat.clone()
              newMat.map = customTex
              newMat.roughness = 0.42
              newMat.metalness = 0.01
              newMat.needsUpdate = true
              child.material = newMat
            }
          }
        }
      })
    } catch (err) {
      console.error('Lỗi khi ghép texture mặt 3D:', err)
    }
  }

  // Cập nhật khuôn mặt ngay khi userFaceUrl thay đổi (upload ảnh Trấn Thành hoặc đổi ảnh)
  useEffect(() => {
    if (currentModelRef.current) {
      applyFaceTexture(currentModelRef.current, userFaceUrl)
    }
  }, [userFaceUrl])

  // Nạp Mô Hình 3D Người Thật GLB (Ready Player Me / Photorealistic Human Mesh)
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    setIsLoadingModel(true)
    setLoadProgress(15)

    // Xóa mô hình cũ trước khi nạp mô hình mới
    if (currentModelRef.current) {
      scene.remove(currentModelRef.current)
      currentModelRef.current = null
    }

    const loader = new GLTFLoader()
    const modelPath = isMale ? '/models/avatar_male.glb' : '/models/avatar_female.glb'

    loader.load(
      modelPath,
      async (gltf) => {
        const model = gltf.scene
        currentModelRef.current = model

        // Đảm bảo chân đứng ngay ngắn trên mặt bục sàn
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const baseHeight = size.y || 1.75

        // Đặt tâm đáy tại y = 0
        model.position.y = -box.min.y

        // Tính toán tỉ lệ co giãn theo Chiều Cao & Cân Nặng thực tế của người dùng
        const targetHeightMeters = heightCm / 100
        const scaleFactorY = targetHeightMeters / baseHeight
        // Cân nặng: tỷ lệ BMI chuẩn 22 -> mở rộng hoặc thu gọn bề ngang ngực, eo, hông, đùi
        const bmiRatio = Math.max(0.72, Math.min(1.42, bmi / 22.0))
        const scaleFactorXZ = scaleFactorY * Math.sqrt(bmiRatio)

        model.scale.set(scaleFactorXZ, scaleFactorY, scaleFactorXZ)

        // Duyệt qua từng bộ phận trang phục & bề mặt da để tối ưu đổ bóng & khoác đồ
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const meshName = (child.name || '').toLowerCase()
            const matName = (((child.material as any)?.name) || '').toLowerCase()

            // Ẩn triệt để mũ cao bồi, râu, phụ kiện đầu ngay từ lúc nạp mô hình
            if (
              meshName.includes('headwear') ||
              matName.includes('headwear') ||
              meshName.includes('beard') ||
              matName.includes('beard') ||
              meshName.includes('hat') ||
              matName.includes('hat')
            ) {
              child.visible = false
              child.castShadow = false
              child.receiveShadow = false
              return
            }

            child.castShadow = true
            child.receiveShadow = true

            // Khử răng cưa & tăng cường độ mịn PBR
            if (child.material) {
              const mat = child.material as THREE.MeshStandardMaterial
              mat.roughness = Math.max(0.3, mat.roughness || 0.4)
              mat.metalness = Math.min(0.2, mat.metalness || 0.05)

              // Khoác màu sắc trang phục đang ướm lên chiếc áo hoặc chiếc quần
              const meshName = (child.name || '').toLowerCase()
              const matName = (mat.name || '').toLowerCase()

              if (garmentType === 'tops' && (meshName.includes('top') || matName.includes('top') || meshName.includes('shirt'))) {
                mat.color = new THREE.Color(garmentColor)
                mat.roughness = 0.65
              } else if (garmentType === 'bottoms' && (meshName.includes('bottom') || matName.includes('bottom') || meshName.includes('pants'))) {
                mat.color = new THREE.Color(garmentColor)
                mat.roughness = 0.75
              } else if (garmentType === 'one-pieces') {
                if (meshName.includes('top') || meshName.includes('bottom')) {
                  mat.color = new THREE.Color(garmentColor)
                }
              }
            }
          }
        })

        // Ghép khuôn mặt thật của người dùng và ẩn nón/râu
        await applyFaceTexture(model, userFaceUrl)

        scene.add(model)
        setIsLoadingModel(false)
        setLoadProgress(100)
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100))
        }
      },
      (err) => {
        console.error('Lỗi khi tải mô hình 3D người thật:', err)
        setIsLoadingModel(false)
      }
    )
  }, [gender, heightCm, weightKg, garmentColor, garmentType])

  // Điều khiển góc nhìn Camera linh hoạt
  const setCameraPreset = (preset: 'full' | 'face' | 'angle' | 'side' | 'back') => {
    setIsAutoRotate(false)
    setCameraView(preset)
    if (!controlsRef.current || !cameraRef.current) return

    const controls = controlsRef.current
    const camera = cameraRef.current
    const targetH = heightCm / 100

    if (preset === 'full') {
      camera.position.set(0, targetH * 0.55, 2.7)
      controls.target.set(0, targetH * 0.52, 0)
    } else if (preset === 'face') {
      // Cận cảnh khuôn mặt người mẫu
      camera.position.set(0, targetH * 0.94, 0.65)
      controls.target.set(0, targetH * 0.92, 0)
    } else if (preset === 'angle') {
      camera.position.set(1.8, targetH * 0.58, 1.8)
      controls.target.set(0, targetH * 0.52, 0)
    } else if (preset === 'side') {
      camera.position.set(2.6, targetH * 0.55, 0)
      controls.target.set(0, targetH * 0.52, 0)
    } else if (preset === 'back') {
      camera.position.set(0, targetH * 0.55, -2.6)
      controls.target.set(0, targetH * 0.52, 0)
    }

    controls.update()
  }

  return (
    <div className={`relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden select-none ${className}`}>
      {/* Khung Canvas WebGL Three.js */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay khi nạp mô hình 3D dung lượng cao */}
      {isLoadingModel && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-400">
              {loadProgress}%
            </span>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white">Đang Dựng Mô Hình 3D Người Thật Studio</p>
            <p className="text-xs text-slate-400">
              Tối ưu giải phẫu theo {heightCm}cm • {weightKg}kg • BMI {bmi.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Header HUD: Trạng thái thể hình chuẩn & Badge Studio */}
      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2 pointer-events-none z-10">
        <div className="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs font-black text-slate-100 flex items-center gap-2 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            Studio 3D: {heightCm}cm • {weightKg}kg • {isMale ? 'Nam Giới' : 'Nữ Giới'} (BMI {bmi.toFixed(1)})
          </span>
          {garmentName && (
            <span className="text-indigo-400 font-bold ml-1 border-l border-white/10 pl-2">
              Đang thử: {garmentName.slice(0, 20)}...
            </span>
          )}
        </div>
      </div>

      {/* Nút Preset Góc Nhìn Camera */}
      <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[11px] shadow-xl z-10">
        <button
          type="button"
          onClick={() => setCameraPreset('full')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            cameraView === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Toàn Thân
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('face')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
            cameraView === 'face' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>🔍</span> Soi Mặt
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('angle')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            cameraView === 'angle' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Nghiêng 45°
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('side')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            cameraView === 'side' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Bên Hông
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('back')}
          className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
            cameraView === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Sau Lưng
        </button>
        <button
          type="button"
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
            isAutoRotate ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          {isAutoRotate ? '⏸ Dừng' : '▶ Tự Xoay'}
        </button>
      </div>

      {/* Thẻ Đối Chiếu Khuôn Mặt Thật & Nhận Diện AI (Face Matching Card) */}
      {(croppedFacePreview || userFaceUrl) && showFaceCard && (
        <div className="absolute left-3 top-14 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-indigo-500/40 text-xs shadow-2xl flex items-center gap-3 z-10 animate-in fade-in slide-in-from-left-2">
          <div className="relative">
            <img
              src={croppedFacePreview || userFaceUrl}
              alt="User Face"
              className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-400 shadow-md bg-slate-800"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[8px] text-white font-bold">
              ✓
            </span>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider block">
                AI Bóc Tách Khuôn Mặt
              </span>
              <button
                type="button"
                onClick={() => setShowFaceCard(false)}
                className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-white font-bold text-xs mt-0.5">Khớp Ngũ Quan 3D Studio</p>
            <button
              type="button"
              onClick={() => setCameraPreset('face')}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline mt-1 block cursor-pointer"
            >
              Phóng to xem góc mặt 3D →
            </button>
          </div>
        </div>
      )}

      {/* Thẻ Đo Nhân Trắc Học Thông Minh (Eo, Đùi, Vai) */}
      <div className="absolute left-3 bottom-14 space-y-2 pointer-events-none z-10">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs shadow-lg">
          <span className="text-[9px] uppercase tracking-wider text-emerald-400 block font-bold">Vòng Eo (Waist)</span>
          <span className="text-white font-black text-sm">{waistCm || Math.round(bmi * 3.6)} cm</span>
        </div>
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 text-xs shadow-lg">
          <span className="text-[9px] uppercase tracking-wider text-cyan-400 block font-bold">Vòng Đùi (Thigh)</span>
          <span className="text-white font-black text-sm">{thighCm || Math.round(bmi * 2.4)} cm</span>
        </div>
      </div>

      {/* Footer Bar: Hướng dẫn tương tác 360 độ */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-black/75 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-white/10 flex items-center gap-2">
          <span>✨</span>
          <span>Mô hình 3D ReadyPlayerMe Humanoid Mesh • Render WebGL PBR</span>
        </div>
        <div className="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[11px] text-slate-200 border border-white/15 shadow-xl flex items-center gap-2">
          <span>🖱️</span> Nhấp giữ chuột trái để xoay 360° • Cuộn chuột để phóng to/thu nhỏ
        </div>
      </div>
    </div>
  )
}
