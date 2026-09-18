import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import type { Order } from '../../models/order.model'
import { formatOrderId } from '../../utils/orderUtils'

interface ShopHandoverModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  shopId: string
  shopName?: string
  onConfirmHandover: (order: Order) => Promise<void>
  loading: boolean
}

export const ShopHandoverModal: React.FC<ShopHandoverModalProps> = ({
  isOpen,
  onClose,
  order,
  shopId,
  shopName = 'Cửa hàng ZeroMall',
  onConfirmHandover,
  loading
}) => {
  const [sellerAddress, setSellerAddress] = useState<any>(null)
  const [loadingAddress, setLoadingAddress] = useState(false)

  useEffect(() => {
    if (!isOpen || !shopId) return
    const fetchAddress = async () => {
      setLoadingAddress(true)
      try {
        const res = await fetch(`${API_BASE_URL}/delivery/seller-address/${shopId}`)
        if (res.ok) {
          const data = await res.json()
          setSellerAddress(data)
        }
      } catch (e) {
        console.error('Error fetching seller address:', e)
      } finally {
        setLoadingAddress(false)
      }
    }
    fetchAddress()
  }, [isOpen, shopId])

  if (!isOpen || !order) return null

  const formatVND = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

  const isCOD = order.paymentMethod === 'cod'

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-left flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-xl shadow-xs">
              🚚
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base leading-tight">
                Bàn Giao Cho Đơn Vị Vận Chuyển
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Đơn hàng #{formatOrderId(order.id)} • ZeroMall Express (ZMX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Carrier & Method */}
          <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-black shrink-0 mt-0.5">
              ZMX
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-blue-900">ZeroMall Express (Đơn vị lấy hàng)</h4>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Lấy Hàng Tận Nơi (Pick-up)
                </span>
              </div>
              <p className="text-[11px] text-blue-800/80 mt-1 leading-relaxed">
                Tài xế ZMX khu vực sẽ nhận lệnh điều phối và trực tiếp đến kho hàng của bạn để nhận kiện hàng và quét mã vận đơn.
              </p>
            </div>
          </div>

          {/* Section 2: Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warehouse Pickup Address */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏢</span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Địa Chỉ Kho Lấy Hàng
                </span>
              </div>
              {loadingAddress ? (
                <div className="py-3 flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Đang tải thông tin kho...
                </div>
              ) : sellerAddress ? (
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-slate-800">
                    {sellerAddress.name || sellerAddress.contactName || shopName}
                    <span className="text-slate-400 font-normal ml-1.5 font-mono">
                      ({sellerAddress.phone})
                    </span>
                  </p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {sellerAddress.address}
                    {sellerAddress.ward ? `, ${sellerAddress.ward}` : ''}
                    {sellerAddress.district ? `, ${sellerAddress.district}` : ''}
                    {sellerAddress.province ? `, ${sellerAddress.province}` : ''}
                  </p>
                </div>
              ) : (
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-slate-800">{shopName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Kho mặc định đã đăng ký của Shop</p>
                </div>
              )}
            </div>

            {/* Buyer Delivery Address */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Địa Chỉ Giao (Người Nhận)
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800">
                  {order.buyerName}
                  <span className="text-slate-400 font-normal ml-1.5 font-mono">
                    ({order.buyerPhone})
                  </span>
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {order.shippingAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Package & COD Details */}
          <div className="border border-slate-200/70 rounded-2xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span>📦</span> Danh Sách Sản Phẩm Trong Kiện ({order.items.length})
              </span>
              <span className="text-xs font-bold text-slate-500">
                Tổng cộng: <span className="text-slate-800 font-black">{formatVND(order.totalAmount)}</span>
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg border border-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                    {item.variant && item.variant.trim() && item.variant !== 'Mặc định' && (
                      <span className="text-[10px] text-slate-400">Phân loại: {item.variant}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-slate-700">{formatVND(item.price)}</p>
                    <p className="text-[10px] text-slate-400">x{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* COD & Shipping Fee Summary */}
            <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Thu hộ COD:</span>
                {isCOD ? (
                  <span className="bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-lg text-xs">
                    {formatVND(order.totalAmount)} (Thu tiền khi giao)
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-lg text-xs">
                    0đ (Đã thanh toán Online)
                  </span>
                )}
              </div>
              <div className="text-slate-500 font-medium text-[11px]">
                Phí vận chuyển: <span className="font-bold text-slate-700">{formatVND(order.shippingFee || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Vận đơn ZMX sẽ được tạo tự động và đồng bộ sang cổng Delivery.
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={() => onConfirmHandover(order)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang khởi tạo vận đơn ZMX...
                </>
              ) : (
                <>
                  <span>🚚</span>
                  Bàn Giao Cho Đơn Vị Vận Chuyển (ZMX)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
