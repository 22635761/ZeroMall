import type { Product } from '../components/buyer/FlashSale'

/**
 * Định dạng số tiền VNĐ chuẩn (ví dụ: 250000 -> "250.000đ")
 * Xử lý an toàn cho cả số, chuỗi số thô hoặc chuỗi đã có ký tự tiền tệ
 */
export function formatCurrencyVND(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0đ'
  if (typeof val === 'number') {
    return `${Math.round(val).toLocaleString('vi-VN')}đ`
  }
  const str = String(val).trim()
  if (str.endsWith('đ') || str.endsWith('₫')) return str
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? '0đ' : `${Math.round(num).toLocaleString('vi-VN')}đ`
}

/**
 * Trích xuất giá trị số thực từ bất kỳ chuỗi giá tiền nào (ví dụ: "280.000đ" -> 280000)
 */
export function parseCurrencyNumber(val: number | string | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''))
  return isNaN(num) ? 0 : num
}

export function formatRawProduct(p: any): Product {
  let sellingPriceNum = parseFloat(String(p.price || 0).replace(/[^0-9]/g, '')) || 0
  let origPriceForMin = p.originalPrice ? (parseFloat(String(p.originalPrice).replace(/[^0-9]/g, '')) || 0) : 0

  let parsedVariationRows: any[] = []
  if (p.hasVariations && p.variationRows) {
    try {
      parsedVariationRows = typeof p.variationRows === 'string' ? JSON.parse(p.variationRows) : p.variationRows
    } catch (e) {
      console.error('Failed to parse variationRows', e)
    }
  }

  if (Array.isArray(parsedVariationRows) && parsedVariationRows.length > 0) {
    const validVariationPrices: { price: number; originalPrice: number }[] = []
    for (const row of parsedVariationRows) {
      const rPrice = parseFloat(String(row.price || 0).replace(/[^0-9]/g, '')) || 0
      const rOrig = row.originalPrice ? (parseFloat(String(row.originalPrice).replace(/[^0-9]/g, '')) || 0) : 0
      if (rPrice > 0) {
        validVariationPrices.push({ price: rPrice, originalPrice: rOrig })
      }
    }

    if (validVariationPrices.length > 0) {
      validVariationPrices.sort((a, b) => a.price - b.price)
      const cheapest = validVariationPrices[0]
      sellingPriceNum = cheapest.price
      if (cheapest.originalPrice > 0) {
        origPriceForMin = cheapest.originalPrice
      }
    }
  }

  const flashPriceStr = sellingPriceNum.toLocaleString('vi-VN') + 'đ'
  let originalPriceStr = ''
  if (origPriceForMin > sellingPriceNum) {
    originalPriceStr = origPriceForMin.toLocaleString('vi-VN') + 'đ'
  }

  let variants: string[] = []
  let parsedVariationGroups: any[] = []
  if (p.hasVariations && p.variationGroups) {
    try {
      parsedVariationGroups = typeof p.variationGroups === 'string' ? JSON.parse(p.variationGroups) : p.variationGroups
      if (Array.isArray(parsedVariationGroups)) {
        variants = parsedVariationGroups.flatMap((g: any) => g.options || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  let parsedImages: string[] = []
  try {
    parsedImages = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
  } catch (e) {
    console.error('Failed to parse images', e)
  }
  if (!parsedImages || parsedImages.length === 0) {
    parsedImages = p.image ? [p.image] : []
  }

  return {
    id: p.id,
    name: p.name,
    originalPrice: originalPriceStr,
    flashPrice: flashPriceStr,
    price: flashPriceStr,
    image: p.image || (parsedImages[0] ?? 'https://placehold.co/400x400?text=No+Image'),
    stock: p.stock !== undefined ? p.stock : 0,
    status: p.status || 'active',
    sold: p.sales || 0,
    total: (p.sales || 0) + (p.stock || 0),
    rating: p.rating ?? 0,
    reviewsCount: p.reviewsCount ?? 0,
    description: p.description,
    hasVariations: p.hasVariations,
    variationGroups: parsedVariationGroups,
    variationRows: parsedVariationRows,
    variants,
    images: parsedImages,
    video: p.video || '',
    category: p.category,
    brand: p.brand,
    shopId: p.shopId,
    weight: p.weight,
    length: p.length,
    width: p.width,
    height: p.height
  }
}
