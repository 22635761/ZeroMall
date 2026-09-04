import React from 'react'

interface ProductDescriptionSectionProps {
  product: any
  shopDetails?: any
}

export const ProductDescriptionSection: React.FC<ProductDescriptionSectionProps> = ({ product, shopDetails }) => {
  const getOriginLocation = () => {
    if (!shopDetails?.pickupAddress) return 'Chưa cập nhật địa chỉ kho'
    try {
      const pickup = typeof shopDetails.pickupAddress === 'string'
        ? JSON.parse(shopDetails.pickupAddress)
        : shopDetails.pickupAddress
      
      const parts = [pickup.ward, pickup.district, pickup.province].filter(Boolean)
      if (parts.length > 0) return parts.join(', ')
      return pickup.detailAddress || pickup.province || 'Chưa cập nhật địa chỉ kho'
    } catch {
      return typeof shopDetails.pickupAddress === 'string' ? shopDetails.pickupAddress : 'Chưa cập nhật địa chỉ kho'
    }
  }

  return (
    <div className="space-y-5">
      {/* Attributes Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
          Chi Tiết Sản Phẩm
        </h2>
        <div className="space-y-3.5 text-xs text-slate-500 pt-1">
          <div className="flex">
            <span className="w-32 shrink-0 font-medium">Danh Mục</span>
            <span className="text-slate-800">{product.category || 'Khác'}</span>
          </div>
          <div className="flex">
            <span className="w-32 shrink-0 font-medium">Thương hiệu</span>
            <span className="text-slate-[#ee4d2d] font-bold">{product.brand || 'No Brand'}</span>
          </div>
          <div className="flex">
            <span className="w-32 shrink-0 font-medium">Hạn bảo hành</span>
            <span className="text-slate-800">{product.warranty || 'Theo chính sách nhà sản xuất'}</span>
          </div>
          <div className="flex">
            <span className="w-32 shrink-0 font-medium">Gửi từ</span>
            <span className="text-slate-800 font-semibold">{getOriginLocation()}</span>
          </div>
        </div>
      </div>

      {/* Detailed text description */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/50 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3">
          Mô Tả Sản Phẩm
        </h2>
        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-2 pt-1 font-normal">
          {product.description || 'Không có mô tả sản phẩm chi tiết.'}
        </div>
      </div>
    </div>
  )
}

