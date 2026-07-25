import React, { useState, useEffect } from 'react'
import { AddProductTipsSidebar } from './add-product/AddProductTipsSidebar'
import { AddProductBasicTab } from './add-product/AddProductBasicTab'
import { AddProductSalesTab } from './add-product/AddProductSalesTab'
import { AddProductShippingTab } from './add-product/AddProductShippingTab'
import { AddProductOtherTab } from './add-product/AddProductOtherTab'

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
  name: string
  options: string[]
}

interface VariationRow {
  key: string
  name: string
  price: string
  originalPrice: string
  stock: string
  sku: string
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'sales' | 'shipping' | 'other'>('basic')

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
  const [bulkOriginalPrice, setBulkOriginalPrice] = useState('')
  const [bulkStock, setBulkStock] = useState('')
  const [simplePrice, setSimplePrice] = useState('')
  const [simpleOriginalPrice, setSimpleOriginalPrice] = useState('')
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

  useEffect(() => {
    if (initialData) {
      setProductName(initialData.name || '')
      setCategory(initialData.category || '')
      setBrand(initialData.brand || '')
      setDescription(initialData.description || '')
      
      if (initialData.images && Array.isArray(initialData.images) && initialData.images.length > 0) {
        setImages(initialData.images.map((imgUrl: string, idx: number) => ({
          id: `init-${idx}-${Math.random().toString(36).substring(2, 5)}`,
          file: null as any,
          url: imgUrl,
          progress: 100,
          isCover: imgUrl === initialData.image || (idx === 0 && !initialData.images.includes(initialData.image))
        })))
      } else if (initialData.image) {
        setImages([
          {
            id: 'cover-init',
            file: null as any,
            url: initialData.image,
            progress: 100,
            isCover: true
          }
        ])
      } else {
        setImages([])
      }

      if (initialData.video) {
        const isExtLink = initialData.video.includes('youtube.com') || 
                          initialData.video.includes('youtu.be') || 
                          initialData.video.includes('tiktok.com');
        if (isExtLink) {
          setVideoMode('link')
          setVideoLink(initialData.video)
        } else {
          setVideoMode('upload')
          setVideoFile({
            file: null,
            url: initialData.video,
            progress: 100,
            error: null
          })
        }
      } else {
        setVideoFile({ file: null, url: '', progress: 0, error: null })
        setVideoLink('')
      }
      
      if (initialData.hasVariations) {
        setHasVariations(true)
        setVariationGroups(initialData.variationGroups || [])
        setVariationRows(initialData.variationRows || [])
      } else {
        setHasVariations(false)
        setSimplePrice(String(initialData.price || ''))
        setSimpleOriginalPrice(initialData.originalPrice ? String(initialData.originalPrice) : '')
        setSimpleStock(String(initialData.stock || ''))
      }
      
      setWeight(String(initialData.weight || ''))
      setLength(String(initialData.length || ''))
      setWidth(String(initialData.width || ''))
      setHeight(String(initialData.height || ''))
      
      setCondition(initialData.condition || 'new')
      setIsPreOrder(initialData.isPreOrder || false)
      setPreOrderDays(String(initialData.preOrderDays || '7'))
      setParentSku(initialData.sku || '')
    }
  }, [initialData])



  const isImageValid = images.length >= 1
  const isVideoValid = videoMode === 'upload' ? !!videoFile.url : (videoLink.trim().length > 10 && (videoLink.includes('youtube.com') || videoLink.includes('youtu.be') || videoLink.includes('tiktok.com')))
  const isNameValid = productName.trim().length > 0
  const isDescValid = description.trim().length > 0
  const isBrandValid = brand.trim().length > 0

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }
  const youtubeId = getYouTubeId(videoLink)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    const remainingSlots = 9 - images.length
    const filesToUpload = filesArray.slice(0, remainingSlots)

    if (filesArray.length > remainingSlots) {
      alert(`Bạn chỉ có thể thêm tối đa 9 hình ảnh. Đã bỏ qua ${filesArray.length - remainingSlots} ảnh dư.`)
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
        const hasCover = prev.some((img) => img.isCover)
        if (!hasCover && prev.length === 0) {
          newImage.isCover = true
        }
        return [...prev, newImage]
      })

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

      if (cloudName && uploadPreset) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', uploadPreset)

        const xhr = new XMLHttpRequest()
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, progress: percent } : img))
            )
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText)
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, url: res.secure_url, progress: 100 } : img))
            )
          } else {
            alert(`Lỗi upload ảnh ${file.name} lên Cloudinary`)
            setImages((prev) => prev.filter((img) => img.id !== id))
          }
        }

        xhr.onerror = () => {
          alert(`Lỗi kết nối khi upload ảnh ${file.name}`)
          setImages((prev) => prev.filter((img) => img.id !== id))
        }

        xhr.send(formData)
      } else {
        const fakeUrl = URL.createObjectURL(file)
        let prog = 0
        const interval = setInterval(() => {
          prog += 25
          if (prog >= 100) {
            clearInterval(interval)
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, url: fakeUrl, progress: 100 } : img))
            )
          } else {
            setImages((prev) =>
              prev.map((img) => (img.id === id ? { ...img, progress: prog } : img))
            )
          }
        }, 150)
      }
    })
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id)
      if (filtered.length > 0 && !filtered.some((img) => img.isCover)) {
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    if (file.size > 15 * 1024 * 1024) {
      setVideoFile({ file: null, url: '', progress: 0, error: 'Kích thước video không được vượt quá 15Mb' })
      return
    }

    setVideoFile({ file, url: '', progress: 10, error: null })

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (cloudName && uploadPreset) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setVideoFile((prev) => ({ ...prev, progress: percent }))
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText)
          setVideoFile({ file, url: res.secure_url, progress: 100, error: null })
        } else {
          setVideoFile({ file: null, url: '', progress: 0, error: 'Lỗi upload video lên Cloudinary' })
        }
      }

      xhr.onerror = () => {
        setVideoFile({ file: null, url: '', progress: 0, error: 'Lỗi kết nối khi upload video' })
      }

      xhr.send(formData)
    } else {
      const fakeUrl = URL.createObjectURL(file)
      let prog = 10
      const interval = setInterval(() => {
        prog += 30
        if (prog >= 100) {
          clearInterval(interval)
          setVideoFile({ file, url: fakeUrl, progress: 100, error: null })
        } else {
          setVideoFile((prev) => ({ ...prev, progress: prog }))
        }
      }, 300)
    }
  }

  const removeVideo = () => {
    setVideoFile({ file: null, url: '', progress: 0, error: null })
  }

  const addVariationGroup = () => {
    if (variationGroups.length >= 2) return
    const newName = variationGroups.length === 0 ? 'Màu sắc' : 'Kích thước'
    setVariationGroups((prev) => [...prev, { name: newName, options: [] }])
  }

  const removeVariationGroup = (index: number) => {
    setVariationGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGroupNameChange = (index: number, name: string) => {
    setVariationGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, name } : g))
    )
  }

  const addOptionToGroup = (groupIdx: number, option: string) => {
    const trimmed = option.trim()
    if (!trimmed) return
    setVariationGroups((prev) =>
      prev.map((g, i) => {
        if (i === groupIdx) {
          if (g.options.includes(trimmed)) return g
          return { ...g, options: [...g.options, trimmed] }
        }
        return g
      })
    )
  }

  const removeOptionFromGroup = (groupIdx: number, optIdx: number) => {
    setVariationGroups((prev) =>
      prev.map((g, i) => {
        if (i === groupIdx) {
          return { ...g, options: g.options.filter((_, idx) => idx !== optIdx) }
        }
        return g
      })
    )
  }

  useEffect(() => {
    if (!hasVariations) return

    const validGroups = variationGroups.filter((g) => g.name.trim() && g.options.length > 0)
    if (validGroups.length === 0) {
      setVariationRows([])
      return
    }

    let combinations: string[][] = [[]]
    validGroups.forEach((group) => {
      const nextCombos: string[][] = []
      combinations.forEach((combo) => {
        group.options.forEach((opt) => {
          nextCombos.push([...combo, opt])
        })
      })
      combinations = nextCombos
    })

    const newRows: VariationRow[] = combinations.map((combo) => {
      const key = combo.join(' - ')
      const existing = variationRows.find((r) => r.key === key)
      return (
        existing || {
          key,
          name: key,
          price: simplePrice || '100000',
          originalPrice: simpleOriginalPrice || '',
          stock: simpleStock || '50',
          sku: `${parentSku ? parentSku + '-' : ''}${key.replace(/\s+/g, '').toUpperCase()}`
        }
      )
    })

    setVariationRows(newRows)
  }, [hasVariations, variationGroups])

  const applyBulkEdit = () => {
    setVariationRows((prev) =>
      prev.map((row) => ({
        ...row,
        price: bulkPrice || row.price,
        originalPrice: bulkOriginalPrice || row.originalPrice,
        stock: bulkStock || row.stock
      }))
    )
  }

  const updateVariationRow = (key: string, field: keyof VariationRow, value: string) => {
    setVariationRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    )
  }

  const getShippingCost = (baseCost: number) => {
    const w = parseFloat(weight) || 0
    if (w <= 0) return 0
    if (w <= 500) return baseCost
    const extraWeight = w - 500
    const extraSteps = Math.ceil(extraWeight / 500)
    return baseCost + extraSteps * 5000
  }

  const handleSubmit = (e: React.FormEvent, targetStatus: 'active' | 'hidden' = 'active') => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (images.length === 0) {
      newErrors.images = 'Vui lòng tải lên ít nhất 1 hình ảnh sản phẩm'
    }
    if (!productName.trim()) {
      newErrors.name = 'Vui lòng nhập tên sản phẩm'
    }
    if (!category) {
      newErrors.category = 'Vui lòng chọn ngành hàng'
    }
    if (!brand.trim()) {
      newErrors.brand = 'Vui lòng nhập thương hiệu'
    }
    if (!description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả sản phẩm'
    }

    if (hasVariations) {
      if (variationRows.length === 0) {
        newErrors.variations = 'Vui lòng tạo ít nhất 1 tùy chọn phân loại'
      } else {
        const invalidRow = variationRows.find((r) => !r.price || parseFloat(r.price) <= 0 || !r.stock)
        if (invalidRow) {
          newErrors.variations = 'Tất cả các dòng phân loại phải điền đầy đủ giá và số lượng kho'
        }
      }
    } else {
      if (!simplePrice || parseFloat(simplePrice) <= 0) {
        newErrors.price = 'Giá bán phải lớn hơn 0'
      }
      if (!simpleStock || parseInt(simpleStock) < 0) {
        newErrors.stock = 'Vui lòng nhập số lượng tồn kho'
      }
    }

    if (!weight || parseFloat(weight) <= 0) {
      newErrors.weight = 'Vui lòng nhập cân nặng sau khi đóng gói'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      if (newErrors.images || newErrors.name || newErrors.category || newErrors.brand || newErrors.description) {
        setActiveTab('basic')
      } else if (newErrors.variations || newErrors.price || newErrors.stock) {
        setActiveTab('sales')
      } else if (newErrors.weight) {
        setActiveTab('shipping')
      }
      return
    }

    const coverImageObj = images.find((img) => img.isCover) || images[0]
    const coverImageUrl = coverImageObj ? coverImageObj.url : 'https://placehold.co/400x400?text=No+Image'
    const allImageUrls = images.map((img) => img.url).filter(Boolean)

    let finalPrice = 0
    let finalOriginalPrice: number | undefined = undefined
    let finalStock = 0

    if (hasVariations) {
      const prices = variationRows.map((r) => parseFloat(r.price)).filter((p) => !isNaN(p))
      finalPrice = Math.min(...prices)
      
      const origPrices = variationRows.map((r) => parseFloat(r.originalPrice)).filter((p) => !isNaN(p))
      if (origPrices.length > 0) {
        finalOriginalPrice = Math.min(...origPrices)
      }

      finalStock = variationRows.reduce((sum, r) => sum + (parseInt(r.stock) || 0), 0)
    } else {
      finalPrice = parseFloat(simplePrice)
      if (simpleOriginalPrice) {
        finalOriginalPrice = parseFloat(simpleOriginalPrice)
      }
      finalStock = parseInt(simpleStock)
    }

    const finalVideoUrl = videoMode === 'upload' ? videoFile.url : videoLink

    const newProduct = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: productName,
      description,
      price: finalPrice,
      originalPrice: finalOriginalPrice,
      stock: finalStock,
      category,
      brand,
      image: coverImageUrl,
      images: JSON.stringify(allImageUrls),
      video: finalVideoUrl,
      hasVariations,
      variationGroups: hasVariations ? JSON.stringify(variationGroups) : null,
      variationRows: hasVariations ? JSON.stringify(variationRows) : null,
      weight: parseFloat(weight),
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      height: parseFloat(height) || 0,
      condition,
      isPreOrder,
      preOrderDays: isPreOrder ? parseInt(preOrderDays) : 2,
      sku: parentSku,
      status: targetStatus,
      sales: initialData?.sales || 0,
      rating: initialData?.rating || 5.0,
      reviewsCount: initialData?.reviewsCount || 0
    }

    setToastMessage(initialData ? '🎉 Đã cập nhật sản phẩm thành công!' : '🎉 Đã thêm sản phẩm thành công!')
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
      onSuccess(newProduct)
    }, 1200)
  }

  return (
    <div className="flex gap-6 items-start max-w-7xl mx-auto py-6 px-4">
      {showToast && (
        <div className="fixed top-20 right-8 bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-xl z-50 animate-bounce text-xs flex items-center gap-2">
          {toastMessage}
        </div>
      )}

      {/* LEFT SIDEBAR: Tips / Checklist */}
      <AddProductTipsSidebar
        isImageValid={isImageValid}
        isVideoValid={isVideoValid}
        isNameValid={isNameValid}
        isDescValid={isDescValid}
        isBrandValid={isBrandValid}
        productName={productName}
        description={description}
      />

      {/* RIGHT MAIN CONTAINER: Form */}
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
          {activeTab === 'basic' && (
            <AddProductBasicTab
              images={images}
              imageRatio={imageRatio}
              setImageRatio={setImageRatio}
              errors={errors}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              setAsCover={setAsCover}
              videoMode={videoMode}
              setVideoMode={setVideoMode}
              videoFile={videoFile}
              handleVideoChange={handleVideoChange}
              removeVideo={removeVideo}
              videoLink={videoLink}
              setVideoLink={setVideoLink}
              youtubeId={youtubeId}
              productName={productName}
              setProductName={setProductName}
              category={category}
              setCategory={setCategory}
              categoriesList={categoriesList}
              brand={brand}
              setBrand={setBrand}
              description={description}
              setDescription={setDescription}
            />
          )}

          {activeTab === 'sales' && (
            <AddProductSalesTab
              hasVariations={hasVariations}
              setHasVariations={setHasVariations}
              variationGroups={variationGroups}
              removeVariationGroup={removeVariationGroup}
              handleGroupNameChange={handleGroupNameChange}
              removeOptionFromGroup={removeOptionFromGroup}
              addOptionToGroup={addOptionToGroup}
              addVariationGroup={addVariationGroup}
              variationRows={variationRows}
              bulkOriginalPrice={bulkOriginalPrice}
              setBulkOriginalPrice={setBulkOriginalPrice}
              bulkPrice={bulkPrice}
              setBulkPrice={setBulkPrice}
              bulkStock={bulkStock}
              setBulkStock={setBulkStock}
              applyBulkEdit={applyBulkEdit}
              updateVariationRow={updateVariationRow}
              errors={errors}
              simpleOriginalPrice={simpleOriginalPrice}
              setSimpleOriginalPrice={setSimpleOriginalPrice}
              simplePrice={simplePrice}
              setSimplePrice={setSimplePrice}
              simpleStock={simpleStock}
              setSimpleStock={setSimpleStock}
            />
          )}

          {activeTab === 'shipping' && (
            <AddProductShippingTab
              weight={weight}
              setWeight={setWeight}
              length={length}
              setLength={setLength}
              width={width}
              setWidth={setWidth}
              height={height}
              setHeight={setHeight}
              shippingProviders={shippingProviders}
              setShippingProviders={setShippingProviders}
              getShippingCost={getShippingCost}
              errors={errors}
            />
          )}

          {activeTab === 'other' && (
            <AddProductOtherTab
              condition={condition}
              setCondition={setCondition}
              parentSku={parentSku}
              setParentSku={setParentSku}
              isPreOrder={isPreOrder}
              setIsPreOrder={setIsPreOrder}
              preOrderDays={preOrderDays}
              setPreOrderDays={setPreOrderDays}
            />
          )}
        </div>

        {/* Form Footer Buttons */}
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
