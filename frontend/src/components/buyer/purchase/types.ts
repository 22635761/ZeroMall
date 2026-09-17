export interface PurchaseTabItem {
  id: string
  label: string
}

export const PURCHASE_TABS: PurchaseTabItem[] = [
  { label: 'Tất cả', id: 'ALL' },
  { label: 'Chờ xác nhận', id: 'PENDING_CONFIRMATION' },
  { label: 'Chờ lấy hàng', id: 'PROCESSING' },
  { label: 'Chờ giao hàng', id: 'SHIPPED' },
  { label: 'Đã giao', id: 'DELIVERED' },
  { label: 'Trả hàng', id: 'REFUND' },
  { label: 'Đã hủy', id: 'CANCELLED' }
]

export const mapStatusToTab = (status: string): string => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'UNPAID':
      return 'PENDING_CONFIRMATION'
    case 'PROCESSING':
    case 'PREPARING':
    case 'CONFIRMED':
    case 'AWAITING_SHIPMENT':
      return 'PROCESSING'
    case 'SHIPPED':
    case 'SHIPPING':
    case 'DELIVERING':
    case 'IN_TRANSIT':
      return 'SHIPPED'
    case 'DELIVERED':
    case 'COMPLETED':
    case 'SUCCESS':
      return 'DELIVERED'
    case 'REFUND_PENDING':
    case 'RETURN_PENDING':
    case 'RETURN_SHIPPED':
    case 'REFUND_DISPUTED':
    case 'REFUNDED':
    case 'RETURNED':
      return 'REFUND'
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED'
    default:
      return 'ALL'
  }
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'UNPAID':
      return 'CHỜ XÁC NHẬN'
    case 'PROCESSING':
    case 'PREPARING':
    case 'CONFIRMED':
    case 'AWAITING_SHIPMENT':
      return 'CHỜ LẤY HÀNG'
    case 'SHIPPED':
    case 'SHIPPING':
    case 'DELIVERING':
    case 'IN_TRANSIT':
      return 'CHỜ GIAO HÀNG'
    case 'DELIVERED':
    case 'COMPLETED':
    case 'SUCCESS':
      return 'ĐÃ GIAO'
    case 'CANCELLED':
    case 'CANCELED':
      return 'ĐÃ HỦY'
    case 'REFUND_PENDING':
      return 'TRẢ HÀNG (CHỜ DUYỆT)'
    case 'RETURN_PENDING':
      return 'TRẢ HÀNG (CHỜ TRẢ)'
    case 'RETURN_SHIPPED':
      return 'TRẢ HÀNG (ĐANG TRẢ)'
    case 'REFUND_DISPUTED':
      return 'TRẢ HÀNG (TRANH CHẤP)'
    case 'REFUNDED':
    case 'RETURNED':
      return 'TRẢ HÀNG (ĐÃ HOÀN TIỀN)'
    default:
      return status
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'UNPAID':
      return 'text-amber-600 font-extrabold'
    case 'PROCESSING':
    case 'PREPARING':
    case 'CONFIRMED':
      return 'text-blue-600 font-extrabold'
    case 'SHIPPED':
    case 'SHIPPING':
    case 'DELIVERING':
    case 'IN_TRANSIT':
      return 'text-purple-600 font-extrabold'
    case 'DELIVERED':
    case 'COMPLETED':
    case 'SUCCESS':
      return 'text-emerald-600 font-extrabold'
    case 'CANCELLED':
    case 'CANCELED':
      return 'text-slate-400 font-semibold'
    default:
      return 'text-[#ee4d2d] font-bold'
  }
}

export const getShopeeTypeNumber = (status: string): string => {
  switch (status) {
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return '1'
    case 'PROCESSING':
    case 'PREPARING':
      return '2'
    case 'SHIPPING':
    case 'IN_TRANSIT':
    case 'DELIVERING':
      return '3'
    case 'DELIVERED':
      return '4'
    case 'COMPLETED':
      return '6'
    case 'CANCELLED':
      return '7'
    case 'REFUND_PENDING':
    case 'RETURN_PENDING':
    case 'RETURN_SHIPPED':
    case 'REFUNDED':
      return '8'
    default:
      return '6'
  }
}

export const formatMoney = (amount: number): string => {
  return (amount || 0).toLocaleString('vi-VN') + 'đ'
}
