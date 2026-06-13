import React, { useState, useEffect } from 'react'

interface AddProductFormProps {
  onSuccess: (product?: any) => void
  onCancel: () => void
  initialData?: any
}

interface UploadedImage {
  id: string
  file: File
  url: string
  progress: number
  isCover: boolean
}

interface UploadedVideo {
  file: File | null
  url: string
  progress: number
  error: string | null
}

interface VariationGroup {
  name: string // e.g., Màu sắc, Kích thước
  options: string[] // e.g., ['Đỏ', 'Xanh']
}

interface VariationRow {
  key: string
  name: string
  price: string
  stock: string
  sku: string
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, onCancel, initialData }) => {
  // Tabs: 'basic' | 'sales' | 'shipping' | 'other'
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'shipping' | 'other'>('basic')

  // --- Form States ---
  // Basic Info
  const [images, setImages] = useState<UploadedImage[]>([])
  const [imageRatio, setImageRatio] = useState<'1:1' | '3:4'>('1:1')
  const [videoMode, setVideoMode] = useState<'upload' | 'link'>('upload')
  const [videoFile, setVideoFile] = useState<UploadedVideo>({ file: null, url: '', progress: 0, error: null })
  const [videoLink, setVideoLink] = useState('')
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [description, setDescription] = useState('')

  // Sales Info
  const [hasVariations, setHasVariations] = useState(false)
  const [variationGroups, setVariationGroups] = useState<VariationGroup[]>([
    { name: 'Màu sắc', options: [] }
  ])
  const [variationRows, setVariationRows] = useState<VariationRow[]>([])
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  // Simple pricing (if no variations)
  const [simplePrice, setSimplePrice] = useState('')
  const [simpleStock, setSimpleStock] = useState('')

  // Shipping
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [shippingProviders, setShippingProviders] = useState({
    spx: true,
    ghtk: true,
    ghn: true
  })

  // Other Info
  const [condition, setCondition] = useState('new')
  const [isPreOrder, setIsPreOrder] = useState(false)
  const [preOrderDays, setPreOrderDays] = useState('7')
  const [parentSku, setParentSku] = useState('')

  // UI States
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Categories list
  const categoriesList = [
    'Điện Thoại & Phụ Kiện',
    'Thời Trang Nam',
    'Thời Trang Nữ',
    'Thiết Bị Điện Gia Dụng',
    'Máy Tính & Laptop',
    'Sức Khỏe & Sắc Đẹp',
    'Nhà Cửa & Đời Sống',
    'Giày Dép',
    'Mẹ & Bé',
    'Thể Thao & Du Lịch'
  ]

  // Pre-populate form if initialData is provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setProductName(initialData.name || '')
      setCategory(initialData.category || '')
      setBrand(initialData.brand || '')
      setDescription(initialData.description || '')
      
      // Images
      if (initialData.image) {
        setImages([
          {
            id: 'cover-init',
            file: null as any,
            url: initialData.image,
            progress: 100,
            isCover: true
          }
        ])
      }
      
      // Variations
      if (initialData.hasVariations) {
        setHasVariations(true)
        setVariationGroups(initialData.variationGroups || [])
        setVariationRows(initialData.variationRows || [])
      } else {
        setHasVariations(false)
        setSimplePrice(String(initialData.price || ''))
        setSimpleStock(String(initialData.stock || ''))
      }
      
      // Shipping
      setWeight(String(initialData.weight || ''))
      setLength(String(initialData.length || ''))
      setWidth(String(initialData.width || ''))
      setHeight(String(initialData.height || ''))
      
      // Other Info
      setCondition(initialData.condition || 'new')
      setIsPreOrder(initialData.isPreOrder || false)
      setPreOrderDays(String(initialData.preOrderDays || '7'))
      setParentSku(initialData.sku || '')
    }
  }, [initialData])

  // Helper to compute variation price range text
  const getVariationPriceRange = (rows: VariationRow[]) => {
    const prices = rows.map(r => parseFloat(r.price)).filter(p => !isNaN(p))
    if (prices.length === 0) return '0đ'
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max) return `${min.toLocaleString('vi-VN')}đ`
    return `${min.toLocaleString('vi-VN')}đ - ${max.toLocaleString('vi-VN')}đ`
  }

  // --- Real-time Validation & Tips Sidebar Checklist ---
  const isImageValid = images.length >= 1
  const isVideoValid = videoMode === 'upload' ? !!videoFile.url : (videoLink.trim().length > 10 && (videoLink.includes('youtube.com') || videoLink.includes('youtu.be') || videoLink.includes('tiktok.com')))
  const isNameValid = productName.trim().length > 0
  const isDescValid = description.trim().length > 0
  const isBrandValid = brand.trim().length > 0

  // --- Parse YouTube Video ID for Iframe Preview ---
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  const youtubeId = getYouTubeId(videoLink)

  // --- Image Upload Simulator ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    
    // Shopee allows max 9 images
    const remainingSlots = 9 - images.length
    const filesToUpload = filesArray.slice(0, remainingSlots)

    if (filesArray.length > remainingSlots) {
      alert(`Bạn chỉ có thể thêm tối đa 9 hình ảnh. Đã bỏ qua ${filesArray.length - remainingSlots} ảnh dư.`);
    }

    filesToUpload.forEach((file) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newImage: UploadedImage = {
        id,
        file,
        url: '',
        progress: 0,
        isCover: false
      }

      setImages((prev) => {
        // Set first image as cover by default if no cover image exists
        const hasCover = prev.some((img) => img.isCover)
        if (!hasCover && prev.length === 0) {
          newImage.isCover = true
        }
        return [...prev, newImage]
      })

      // Simulate Upload Progress (Cloudinary Simulation)
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 10
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(interval)
          setImages((prev) =>
            prev.map((img) =>
              img.id === id
                ? { ...img, progress: 100, url: URL.createObjectURL(file) }
                : img
            )
          )
        } else {
          setImages((prev) =>
            prev.map((img) =>
              img.id === id ? { ...img, progress: currentProgress } : img
            )
          )
        }
      }, 150)
    })

    // Reset input
    e.target.value = ''
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id)
      // If the removed image was the cover, assign cover to the next available one
      const wasCover = prev.find((img) => img.id === id)?.isCover
      if (wasCover && filtered.length > 0) {
        filtered[0].isCover = true
      }
      return filtered
    })
  }

  const setAsCover = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        isCover: img.id === id
      }))
    )
  }

  // --- Video Upload Simulator ---
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    // Validate size (< 15MB for quick demo, max 30MB as per Shopee requirements)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      setVideoFile({
        file: null,
        url: '',
        progress: 0,
        error: 'Tệp video vượt quá giới hạn 15MB! Vui lòng chọn tệp nhỏ hơn.'
      })
      return
    }

    if (!file.type.startsWith('video/')) {
      setVideoFile({
        file: null,
        url: '',
        progress: 0,
        error: 'Chỉ chấp nhận định dạng tệp Video (MP4)!'
      })
      return
    }

    // Initialize state
    setVideoFile({
      file,
      url: '',
      progress: 0,
      error: null
    })

    // Simulate upload progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 15) + 5
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(interval)
        setVideoFile({
          file,
          url: URL.createObjectURL(file),
          progress: 100,
          error: null
        })
      } else {
        setVideoFile((prev) => ({
          ...prev,
          progress: currentProgress
        }))
      }
    }, 180)
  }

  const removeVideo = () => {
    setVideoFile({ file: null, url: '', progress: 0, error: null })
  }

  // --- Variations Manager ---
  const addVariationGroup = () => {
    if (variationGroups.length >= 2) return
    setVariationGroups((prev) => [...prev, { name: 'Kích thước', options: [] }])
  }

  const removeVariationGroup = (index: number) => {
    setVariationGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGroupNameChange = (index: number, name: string) => {
    setVariationGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name } : g))
    )
  }

  const addOptionToGroup = (groupIndex: number, optionText: string) => {
    if (!optionText.trim()) return
    setVariationGroups((prev) =>
      prev.map((g, i) => {
        if (i === groupIndex) {
          if (g.options.includes(optionText.trim())) return g
          return { ...g, options: [...g.options, optionText.trim()] }
        }
        return g
      })
    )
  }

  const removeOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setVariationGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, options: g.options.filter((_, oi) => oi !== optionIndex) }
          : g
      )
    )
  }

  // Dynamically compute variation combinations table
  useEffect(() => {
    if (!hasVariations) {
      setVariationRows([])
      return
    }

    const activeGroups = variationGroups.filter((g) => g.options.length > 0)
    if (activeGroups.length === 0) {
      setVariationRows([])
      return
    }

    let combinations: string[][] = [[]]
    activeGroups.forEach((group) => {
      const nextCombs: string[][] = []
      combinations.forEach((comb) => {
        group.options.forEach((opt) => {
          nextCombs.push([...comb, opt])
        })
      })
      combinations = nextCombs
    })

    const rows: VariationRow[] = combinations.map((comb) => {
      const key = comb.join(' - ')
      // Keep existing values if possible to avoid wiping out user data
      const existing = variationRows.find((r) => r.key === key)
      return {
        key,
        name: key,
        price: existing?.price || '',
        stock: existing?.stock || '',
        sku: existing?.sku || ''
      }
    })

    setVariationRows(rows)
  }, [hasVariations, variationGroups])

  // Bulk edit price and stock
  const applyBulkEdit = () => {
    if (!bulkPrice && !bulkStock) return
    setVariationRows((prev) =>
      prev.map((row) => ({
        ...row,
        price: bulkPrice ? bulkPrice : row.price,
        stock: bulkStock ? bulkStock : row.stock
      }))
    )
    setBulkPrice('')
    setBulkStock('')
  }

  const updateVariationRow = (key: string, field: 'price' | 'stock' | 'sku', value: string) => {
    setVariationRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  // --- Shipping Calculator ---
  const parsedWeight = parseFloat(weight) || 0
  const getShippingCost = (baseFee: number) => {
    if (parsedWeight <= 0) return 0
    // Standard weight tiered increments
    if (parsedWeight <= 500) return baseFee
    if (parsedWeight <= 2000) return baseFee + 7000
    return baseFee + 18000
  }

  // --- Submit & Validation ---
  const validateForm = (newErrors: Record<string, string>) => {
    if (images.length < 1) {
      newErrors.images = 'Cần thêm ít nhất 1 ảnh sản phẩm.'
    }
    if (!productName.trim()) {
      newErrors.name = 'Cần điền tên sản phẩm.'
    }
    if (!category) {
      newErrors.category = 'Cần chọn ngành hàng.'
    }
    if (!brand.trim()) {
      newErrors.brand = 'Cần điền thương hiệu.'
    }
    if (!description.trim()) {
      newErrors.description = 'Cần điền mô tả sản phẩm.'
    }

    if (!hasVariations) {
      if (!simplePrice || parseFloat(simplePrice) <= 0) {
        newErrors.price = 'Cần nhập giá bán hợp lệ (>0đ).'
      }
      if (!simpleStock || parseInt(simpleStock) < 0) {
        newErrors.stock = 'Cần nhập tồn kho hợp lệ (>=0).'
      }
    } else {
      const hasEmptyPrice = variationRows.some((r) => !r.price || parseFloat(r.price) <= 0)
      const hasEmptyStock = variationRows.some((r) => !r.stock || parseInt(r.stock) < 0)
      if (variationRows.length === 0) {
        newErrors.variations = 'Cần thêm tùy chọn phân loại.'
      } else {
        if (hasEmptyPrice) newErrors.variations = 'Điền đầy đủ giá cho các phân loại.'
        if (hasEmptyStock) newErrors.variations = 'Điền đầy đủ tồn kho cho các phân loại.'
      }
    }

    if (!weight || parseFloat(weight) <= 0) {
      newErrors.weight = 'Cần nhập cân nặng sản phẩm (>0gr).'
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent, displayStatus: 'active' | 'hidden') => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const isValid = validateForm(newErrors)
    setErrors(newErrors)

    if (!isValid) {
      const firstError = Object.values(newErrors)[0] || 'Vui lòng kiểm tra lại các trường thông tin.'
      setToastMessage(`⚠️ ${firstError}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
      
      // Auto switch to tab with errors
      if (newErrors.images || newErrors.name || newErrors.category || newErrors.brand || newErrors.description) {
        setActiveTab('basic')
      } else if (newErrors.price || newErrors.stock || newErrors.variations) {
        setActiveTab('sales')
      } else if (newErrors.weight) {
        setActiveTab('shipping')
      }
      return
    }

    const productData = {
      id: initialData?.id || Math.random().toString(36).substring(2, 9),
      name: productName,
      image: images.find(img => img.isCover)?.url || images[0]?.url || '',
      category,
      brand,
      description,
      price: hasVariations
        ? getVariationPriceRange(variationRows)
        : parseFloat(simplePrice),
      stock: hasVariations
        ? variationRows.reduce((acc, row) => acc + (parseInt(row.stock) || 0), 0)
        : parseInt(simpleStock),
      sales: initialData?.sales || 0,
      status: displayStatus === 'active' ? 'active' : 'hidden',
      sku: parentSku,
      variationsText: hasVariations
        ? variationGroups.map(g => `${g.name}: ${g.options.join(', ')}`).join(' | ')
        : '',
      hasVariations,
      variationGroups,
      variationRows,
      weight,
      length,
      width,
      height,
      condition,
      isPreOrder,
      preOrderDays
    }

    // Success Mock action
    setToastMessage(initialData ? 'Đã cập nhật sản phẩm thành công!' : (displayStatus === 'active' ? 'Đã lưu và hiển thị sản phẩm thành công!' : 'Đã lưu tạm (ẩn) sản phẩm thành công!'))
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
      onSuccess(productData)
    }, 1800)
  }

  return (
    <div className="flex gap-6 items-start animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-[100] bg-slate-900/95 text-white text-xs font-bold px-6 py-4.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-md animate-in slide-in-from-top-6 duration-200">
          <span>{toastMessage.includes('thành công') ? '✅' : '⚠️'}</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: Tips / Checklist (25% width) */}
      <aside className="w-1/4 bg-white border border-slate-200/70 rounded-3xl p-5 sticky top-24 shrink-0 shadow-2xs select-none space-y-4">
        <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">Gợi ý điền Thông tin</h4>
        
        <ul className="space-y-4 text-xs font-semibold text-slate-500">
          <li className="flex items-start gap-2.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isImageValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isImageValid ? '✓' : '•'}
            </span>
            <span className={isImageValid ? 'text-slate-800 font-bold' : ''}>Thêm ít nhất 1 hình ảnh</span>
          </li>
          
          <li className="flex items-start gap-2.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isVideoValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isVideoValid ? '✓' : '•'}
            </span>
            <span className={isVideoValid ? 'text-slate-800 font-bold' : ''}>Thêm video sản phẩm</span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isNameValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isNameValid ? '✓' : '•'}
            </span>
            <span className={isNameValid ? 'text-slate-800 font-bold' : ''}>
              Điền tên sản phẩm
              <span className="block text-[10px] text-slate-400 font-medium mt-0.5">({productName.length}/120 ký tự)</span>
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isDescValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isDescValid ? '✓' : '•'}
            </span>
            <span className={isDescValid ? 'text-slate-800 font-bold' : ''}>
              Điền mô tả sản phẩm
              <span className="block text-[10px] text-slate-400 font-medium mt-0.5">({description.length} ký tự)</span>
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
              isBrandValid ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              {isBrandValid ? '✓' : '•'}
            </span>
            <span className={isBrandValid ? 'text-slate-800 font-bold' : ''}>Thêm thương hiệu</span>
          </li>
        </ul>
      </aside>

      {/* RIGHT MAIN CONTAINER: Form (75% width) */}
      <div className="flex-1 bg-white border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'basic' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'sales' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Thông tin bán hàng
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'shipping' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Vận chuyển
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'other' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Thông tin khác
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 flex-1 text-left space-y-6">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin cơ bản</h3>
              
              {/* Product Images (Grid 0/9) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>* Hình ảnh sản phẩm</span>
                    <span className="text-[10px] font-medium text-slate-400 normal-case">({images.length}/9 hình ảnh)</span>
                  </label>
                  
                  {/* Ratio switcher */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setImageRatio('1:1')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                        imageRatio === '1:1' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
                      }`}
                    >
                      Hình ảnh tỷ lệ 1:1
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageRatio('3:4')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                        imageRatio === '3:4' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
                      }`}
                    >
                      Hình ảnh tỷ lệ 3:4
                    </button>
                  </div>
                </div>

                {errors.images && (
                  <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.images}</p>
                )}

                {/* Images Upload Grid */}
                <div className="grid grid-cols-5 gap-3.5 pt-1">
                  
                  {/* Map uploaded images */}
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative group bg-slate-50 border rounded-2xl overflow-hidden shadow-3xs flex items-center justify-center transition-all ${
                        imageRatio === '1:1' ? 'aspect-square' : 'aspect-[3/4]'
                      } ${img.isCover ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}
                    >
                      {img.url ? (
                        <>
                          <img src={img.url} alt="product" className="w-full h-full object-cover" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                            {/* Top row actions */}
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold hover:bg-red-600 transition cursor-pointer shadow-sm"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Bottom row actions */}
                            {!img.isCover && (
                              <button
                                type="button"
                                onClick={() => setAsCover(img.id)}
                                className="w-full bg-white/95 text-[9px] font-black text-slate-800 py-1 rounded-md hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                              >
                                Đặt làm ảnh bìa
                              </button>
                            )}
                          </div>

                          {/* Cover Tag badge */}
                          {img.isCover && (
                            <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                              Ảnh bìa
                            </span>
                          )}
                        </>
                      ) : (
                        // Uploading State Loader
                        <div className="p-3 w-full text-center space-y-2">
                          <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin mx-auto"></div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${img.progress}%` }}></div>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold block">{img.progress}%</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty upload slot (if < 9 images) */}
                  {images.length < 9 && (
                    <label className={`border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer p-4 group transition-all ${
                      imageRatio === '1:1' ? 'aspect-square' : 'aspect-[3/4]'
                    }`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <span className="text-xl text-slate-400 group-hover:scale-115 group-hover:text-emerald-500 transition duration-150">🖼️</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-2 group-hover:text-emerald-500">
                        Thêm hình ảnh
                      </span>
                      <span className="text-[8px] text-slate-300 font-medium mt-1">({images.length}/9)</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Video (Optional with upload progress and YT integration) */}
              <div className="space-y-2 border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Video sản phẩm <span className="text-[10px] font-medium text-slate-400 normal-case">(Tùy chọn)</span>
                  </label>

                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => setVideoMode('upload')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                        videoMode === 'upload' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
                      }`}
                    >
                      Tải tệp video lên
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode('link')}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md cursor-pointer transition ${
                        videoMode === 'link' ? 'bg-white text-slate-700 shadow-3xs' : 'text-slate-400'
                      }`}
                    >
                      Dùng Link YouTube/TikTok
                    </button>
                  </div>
                </div>

                {/* Upload Mode UI */}
                {videoMode === 'upload' ? (
                  <div className="grid grid-cols-3 gap-4">
                    {videoFile.url ? (
                      <div className="relative border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center col-span-2 shadow-2xs">
                        <video src={videoFile.url} controls className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition shadow-md z-10 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : videoFile.progress > 0 ? (
                      <div className="border border-slate-200 rounded-2xl p-6 text-center space-y-3 col-span-2 bg-slate-50/50 flex flex-col justify-center">
                        <span className="animate-spin text-2xl mx-auto">⏳</span>
                        <div className="w-1/2 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-150" style={{ width: `${videoFile.progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">Đang tải video lên Cloudinary... {videoFile.progress}%</p>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50/20 transition duration-150 flex flex-col items-center justify-center col-span-2 group">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                        />
                        <span className="text-2xl text-slate-400 group-hover:scale-115 group-hover:text-emerald-500 transition">🎥</span>
                        <span className="text-[11px] text-slate-500 font-bold mt-2 group-hover:text-emerald-500">Tải video lên</span>
                        <span className="text-[9px] text-slate-400 mt-1 max-w-xs leading-normal">
                          Kích thước tối đa 15Mb, định dạng MP4, độ dài 10s-60s.
                        </span>
                      </label>
                    )}

                    {videoFile.error && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded-r-2xl text-[10px] font-semibold flex items-center justify-center">
                        ⚠️ {videoFile.error}
                      </div>
                    )}
                  </div>
                ) : (
                  // YouTube / TikTok Link Integration
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={videoLink}
                        onChange={(e) => setVideoLink(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                      <p className="text-[9px] text-slate-400 font-medium leading-normal">
                        Dán đường dẫn đầy đủ của video YouTube hoặc TikTok. Video sẽ tải trực tiếp từ nguồn ngoài giúp tiết kiệm băng thông tối đa.
                      </p>
                    </div>

                    {/* YouTube Preview Iframe */}
                    {youtubeId ? (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden aspect-video bg-slate-900 shadow-2xs">
                        <iframe
                          title="Preview"
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1`}
                          allowFullScreen
                        />
                      </div>
                    ) : videoLink.trim() ? (
                      <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 text-center flex items-center justify-center text-[10px] font-semibold text-slate-400">
                        Link chưa được nhận diện hoặc chưa hỗ trợ xem trước
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl border-dashed bg-slate-50/50 p-4 text-center flex items-center justify-center text-[10px] font-semibold text-slate-300">
                        Chưa có link video
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div className="space-y-1 border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Tên sản phẩm</label>
                  <span className="text-[9px] text-slate-400 font-bold">{productName.length}/120</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên sản phẩm (Ví dụ: Điện thoại Apple iPhone 15 Pro Max 256GB - Hàng Chính Hãng)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value.substring(0, 120))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.name}</p>
                )}
              </div>

              {/* Category & Brand row */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Ngành hàng</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition cursor-pointer"
                  >
                    <option value="">-- Chọn ngành hàng phù hợp --</option>
                    {categoriesList.map((cat, i) => (
                      <option key={i} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.category}</p>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Thương hiệu</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: OEM, Apple, Samsung, Sony..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  {errors.brand && (
                    <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.brand}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Mô tả sản phẩm</label>
                  <span className="text-[9px] text-slate-400 font-bold">{description.length}/3000</span>
                </div>
                <textarea
                  required
                  rows={6}
                  placeholder="Nhập thông tin chi tiết về sản phẩm (Tính năng, công dụng, chất liệu, thông số kỹ thuật chi tiết...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.substring(0, 3000))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none leading-relaxed"
                />
                {errors.description && (
                  <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.description}</p>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SALES INFO (Pricing & Variations) */}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin bán hàng</h3>

              {/* Variations Toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-700">Phân loại hàng hóa (Biến thể sản phẩm)</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Áp dụng cho sản phẩm có nhiều lựa chọn như màu sắc, kích thước, dung lượng...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasVariations(!hasVariations)}
                  className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    hasVariations ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transition-transform duration-200 ${
                    hasVariations ? 'translate-x-5.5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Variaton Builder Panel */}
              {hasVariations ? (
                <div className="space-y-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
                  
                  {/* Map groups */}
                  {variationGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="border-b border-slate-100 pb-4 last:border-none last:pb-0 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                          Nhóm phân loại {groupIdx + 1}
                        </span>
                        
                        {groupIdx > 0 && (
                          <button
                            type="button"
                            onClick={() => removeVariationGroup(groupIdx)}
                            className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            Xóa nhóm
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 items-start">
                        {/* Group Name input */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Tên nhóm</label>
                          <input
                            type="text"
                            placeholder="Ví dụ: Màu sắc, Kích thước..."
                            value={group.name}
                            onChange={(e) => handleGroupNameChange(groupIdx, e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>

                        {/* Options Input tags */}
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase">Tùy chọn phân loại</label>
                          
                          <div className="flex flex-wrap gap-1.5 border border-slate-200 rounded-lg p-1.5 bg-white min-h-[36px]">
                            {/* Tags list */}
                            {group.options.map((opt, optIdx) => (
                              <span
                                key={optIdx}
                                className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 cursor-default"
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => removeOptionFromGroup(groupIdx, optIdx)}
                                  className="text-[9px] text-slate-400 hover:text-red-500 font-bold"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}

                            {/* Tag Input */}
                            <input
                              type="text"
                              placeholder="Gõ rồi bấm Enter..."
                              className="flex-1 min-w-[100px] border-none outline-none text-xs p-0 px-1 focus:ring-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addOptionToGroup(groupIdx, e.currentTarget.value)
                                  e.currentTarget.value = ''
                                }
                              }}
                              onBlur={(e) => {
                                addOptionToGroup(groupIdx, e.target.value)
                                e.target.value = ''
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add group button (max 2) */}
                  {variationGroups.length < 2 && (
                    <button
                      type="button"
                      onClick={addVariationGroup}
                      className="border border-dashed border-emerald-600/40 hover:border-emerald-600 text-emerald-600 text-[10px] font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full bg-white transition cursor-pointer"
                    >
                      ➕ Thêm Nhóm Phân Loại (Kích thước, Dung lượng...)
                    </button>
                  )}

                  {/* Bulk edit / Table header */}
                  {variationRows.length > 0 && (
                    <div className="border-t border-slate-200 pt-5 space-y-4">
                      <div className="flex justify-between items-center bg-slate-100 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Thiết lập hàng loạt</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Giá chung (VND)"
                            value={bulkPrice}
                            onChange={(e) => setBulkPrice(e.target.value)}
                            className="w-32 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                          <input
                            type="number"
                            placeholder="Kho chung"
                            value={bulkStock}
                            onChange={(e) => setBulkStock(e.target.value)}
                            className="w-24 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={applyBulkEdit}
                            className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
                          >
                            Áp dụng
                          </button>
                        </div>
                      </div>

                      {errors.variations && (
                        <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.variations}</p>
                      )}

                      {/* Combinations Lưới Table */}
                      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-3xs max-h-72 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-500">
                            <tr>
                              <th className="text-left p-3">Tên Phân loại</th>
                              <th className="text-left p-3 w-1/3">Giá bán (VND) *</th>
                              <th className="text-left p-3 w-1/4">Kho hàng *</th>
                              <th className="text-left p-3 w-1/4">SKU phân loại</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {variationRows.map((row) => (
                              <tr key={row.key} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-bold text-slate-800">{row.name}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      required
                                      value={row.price}
                                      onChange={(e) => updateVariationRow(row.key, 'price', e.target.value)}
                                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">đ</span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    required
                                    value={row.stock}
                                    onChange={(e) => updateVariationRow(row.key, 'stock', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="text"
                                    placeholder="SKU-..."
                                    value={row.sku}
                                    onChange={(e) => updateVariationRow(row.key, 'sku', e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                // Simple Pricing Form (If no variations enabled)
                <div className="grid grid-cols-2 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Giá bán sản phẩm (VND)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        required
                        placeholder="Nhập giá bán (ví dụ: 150000)"
                        value={simplePrice}
                        onChange={(e) => setSimplePrice(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
                      />
                      <span className="text-xs font-extrabold text-slate-400">đ</span>
                    </div>
                    {errors.price && (
                      <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.price}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">* Tồn kho (Số lượng)</label>
                    <input
                      type="number"
                      required
                      placeholder="Số lượng sản phẩm sẵn sàng..."
                      value={simpleStock}
                      onChange={(e) => setSimpleStock(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white transition"
                    />
                    {errors.stock && (
                      <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.stock}</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: SHIPPING (Weight, Dimensions & Logistic Provider costs) */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Vận chuyển</h3>

              {/* Weight & Size fields */}
              <div className="grid grid-cols-4 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
                
                {/* Weight */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">* Cân nặng sau đóng gói</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      required
                      placeholder="Cân nặng..."
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                    />
                    <span className="text-[10px] font-extrabold text-slate-400">gr</span>
                  </div>
                  {errors.weight && (
                    <p className="text-[10px] text-red-500 font-semibold">⚠️ {errors.weight}</p>
                  )}
                </div>

                {/* Length */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kích thước Dài (cm)</label>
                  <input
                    type="number"
                    placeholder="Dài..."
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Width */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rộng (cm)</label>
                  <input
                    type="number"
                    placeholder="Rộng..."
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cao (cm)</label>
                  <input
                    type="number"
                    placeholder="Cao..."
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>

              </div>

              {/* Shipping Fee Dynamic Estimation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">Đơn vị vận chuyển liên kết</h4>
                
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                  
                  {/* SPX Express */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shippingProviders.spx}
                        onChange={(e) => setShippingProviders(prev => ({ ...prev, spx: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">SPX Express</p>
                        <p className="text-[9px] text-slate-400 font-medium">Đối tác vận chuyển hỏa tốc và giao nhanh tiêu chuẩn của Shopee</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-600">
                        {getShippingCost(15000) > 0 ? `${getShippingCost(15000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
                    </div>
                  </div>

                  {/* Giao Hàng Tiết Kiệm (GHTK) */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shippingProviders.ghtk}
                        onChange={(e) => setShippingProviders(prev => ({ ...prev, ghtk: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Giao Hàng Tiết Kiệm (GHTK)</p>
                        <p className="text-[9px] text-slate-400 font-medium">Bảo đảm giao hàng liên tỉnh nhanh chóng trong 24-48h</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-600">
                        {getShippingCost(18000) > 0 ? `${getShippingCost(18000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
                    </div>
                  </div>

                  {/* Giao Hàng Nhanh (GHN) */}
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={shippingProviders.ghn}
                        onChange={(e) => setShippingProviders(prev => ({ ...prev, ghn: e.target.checked }))}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Giao Hàng Nhanh (GHN)</p>
                        <p className="text-[9px] text-slate-400 font-medium">Bản đồ phủ sóng rộng, hỗ trợ lấy hàng tận nơi miễn phí</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-600">
                        {getShippingCost(20000) > 0 ? `${getShippingCost(20000).toLocaleString('vi-VN')}đ` : 'Chưa định giá'}
                      </span>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5">Tiền cước ước tính</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: OTHER INFO (Condition, Pre-order, SKU) */}
          {activeTab === 'other' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <h3 className="font-extrabold text-sm text-slate-800 border-l-4 border-emerald-600 pl-2">Thông tin khác</h3>

              <div className="grid grid-cols-2 gap-4 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
                {/* Condition */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tình trạng</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 bg-white transition cursor-pointer"
                  >
                    <option value="new">Mới 100% (Nguyên seal/nguyên hộp)</option>
                    <option value="used">Đã qua sử dụng (Like new, 99%, 95%...)</option>
                  </select>
                </div>

                {/* SKU */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mã SKU Sản Phẩm (Mã kho)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: IP15-PROMAX-256G-BLK"
                    value={parentSku}
                    onChange={(e) => setParentSku(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Preorder toggle */}
              <div className="space-y-3 border border-slate-150 p-5 rounded-2xl bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Hàng đặt trước (Pre-order)</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Bật nếu bạn cần thời gian chuẩn bị hàng lâu hơn (từ 7-15 ngày) thay vì gửi hàng trong 2 ngày thông thường.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPreOrder(!isPreOrder)}
                    className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                      isPreOrder ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-xs transition-transform duration-200 ${
                      isPreOrder ? 'translate-x-5.5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {isPreOrder && (
                  <div className="flex items-center gap-3 mt-3.5 bg-white p-3.5 rounded-xl border border-slate-200 max-w-xs animate-in slide-in-from-top-2 duration-150">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Thời gian chuẩn bị:</label>
                    <select
                      value={preOrderDays}
                      onChange={(e) => setPreOrderDays(e.target.value)}
                      className="border border-slate-250 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 bg-white w-full cursor-pointer font-bold"
                    >
                      <option value="7">7 ngày</option>
                      <option value="10">10 ngày</option>
                      <option value="12">12 ngày</option>
                      <option value="15">15 ngày</option>
                    </select>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Form Footer Buttons (Bottom sticky bar) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/60 flex justify-between items-center">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-3xs bg-white"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'hidden')}
              className="border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-3xs bg-white"
            >
              Lưu & Ẩn
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'active')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer"
            >
              {initialData ? 'Cập nhật sản phẩm' : 'Lưu & Hiển thị'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
