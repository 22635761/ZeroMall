import React, { useRef } from 'react'
import type { Order } from '../../models/order.model'

interface InvoiceDetailModalProps {
  order: Order
  shopDetails?: any
  shopName?: string
  onClose: () => void
}

const formatVND = (amount: number) => {
  return Math.round(amount || 0).toLocaleString('vi-VN') + 'đ'
}

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  order,
  shopDetails,
  shopName,
  onClose
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  // Calculate financials based on immutable snapshot prices
  const itemSubtotal = order.items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const totalCost = order.items.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity || 1), 0)
  const shopDiscount = (order as any).shopDiscountAmount || 0
  const platformDiscount = (order as any).platformDiscountAmount || 0
  const netSubtotal = Math.max(0, itemSubtotal - shopDiscount)
  const commRate = (order as any).commissionRate ?? 5
  const commAmount = Math.round(netSubtotal * (commRate / 100))
  const netPayout = Math.max(0, netSubtotal - commAmount)
  const grossProfit = netPayout - totalCost

  const invoiceNo = `HD-${order.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`
  const resolvedShopName = shopDetails?.name || shopName || 'Gian Hàng ZeroMall Chính Hãng'
  const shopAddress = shopDetails?.pickupAddress || shopDetails?.address || shopDetails?.pickupProvince || 'Hệ thống kho vận ZeroMall Việt Nam'
  const shopPhone = shopDetails?.phone || shopDetails?.pickupPhone || '1900 1234'
  const shopEmail = shopDetails?.email || 'seller-support@zeromall.vn'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-left print:p-0 print:bg-white print:static">
      
      {/* Printable CSS style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:max-w-none print:border-none print:rounded-none print:shadow-none">
        
        {/* Top Modal Bar (Excluded from printing) */}
        <div className="no-print bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧾</span>
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                HÓA ĐƠN BÁN HÀNG ĐIỆN TỬ (E-INVOICE)
              </h3>
              <p className="text-[11px] text-slate-400">
                Bảo lưu bất biến đơn giá tại thời điểm giao dịch phục vụ báo cáo tài chính
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="In hóa đơn hoặc lưu thành file PDF"
            >
              <span>🖨️</span> In Hóa Đơn / Lưu PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white" id="printable-invoice" ref={printAreaRef}>
          
          {/* Invoice Header */}
          <div className="border-b-2 border-slate-800 pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
                  🌱
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Zero<span className="text-emerald-600">Mall</span> E-COMMERCE
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Sàn Thương Mại Điện Tử & Hệ Thống Hóa Đơn Bán Hàng
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Bản Thể Hiện Hóa Đơn Điện Tử
                </span>
                <p className="text-xs font-mono font-black text-slate-800">
                  Số: <span className="text-rose-600">{invoiceNo}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Ký hiệu (Serial): <strong className="font-mono text-slate-700">ZM/26E</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Ngày lập: <strong className="text-slate-700">{formatDate(order.createdAt)}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Seller and Buyer 2-Column Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs text-slate-700">
            
            {/* Đơn vị bán hàng */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold uppercase text-[11px]">
                <span>🏪</span> Đơn Vị Bán Hàng (Seller)
              </div>
              <p className="text-sm font-black text-slate-900">{resolvedShopName}</p>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <p>📍 <strong>Địa chỉ kho:</strong> {shopAddress}</p>
                <p>📞 <strong>Hotline:</strong> {shopPhone}</p>
                <p>✉️ <strong>Email:</strong> {shopEmail}</p>
                <p>🆔 <strong>Mã Shop:</strong> <span className="font-mono text-slate-800">{order.shopId || (shopDetails?.id ?? 'N/A')}</span></p>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-blue-700 font-extrabold uppercase text-[11px]">
                <span>👤</span> Thông Tin Người Mua (Buyer)
              </div>
              <p className="text-sm font-black text-slate-900">{order.buyerName || 'Khách Hàng ZeroMall'}</p>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <p>📞 <strong>Số điện thoại:</strong> {order.buyerPhone || 'N/A'}</p>
                <p>📍 <strong>Địa chỉ giao nhận:</strong> {order.shippingAddress || 'N/A'}</p>
                <p>✉️ <strong>Email:</strong> {order.buyerEmail || 'N/A'}</p>
                <p>💳 <strong>Hình thức thanh toán:</strong> {order.paymentMethod === 'WALLET' ? 'Ví ZeroPay' : order.paymentMethod === 'VNPAY' ? 'Cổng VNPAY / Ngân hàng' : order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}</p>
              </div>
            </div>

          </div>

          {/* Items Table with Snapshot Immutable Prices */}
          <div className="py-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                📦 Danh Mục Hàng Hóa & Đơn Giá Bán Thực Tế (Bất Biến)
              </h4>
              <span className="text-[10px] text-slate-400 italic">
                * Đơn giá bảo lưu tại thời điểm đặt đơn, không bị ảnh hưởng khi shop đổi giá
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3">Tên Sản Phẩm & Phân Loại</th>
                    <th className="py-3 px-3 text-right">Đơn Giá Gốc</th>
                    <th className="py-3 px-3 text-right">Đơn Giá Bán</th>
                    <th className="py-3 px-3 text-center">Số Lượng</th>
                    <th className="py-3 px-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {order.items.map((item, index) => {
                    const rowTotal = (item.price || 0) * (item.quantity || 1)
                    return (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          {item.variant && (
                            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Phân loại: {item.variant}
                            </p>
                          )}
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5">
                            Mã SP: {item.productId}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 line-through">
                          {item.originalPrice && item.originalPrice > item.price
                            ? formatVND(item.originalPrice)
                            : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {formatVND(item.price)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          x{item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          {formatVND(rowTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary & Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 pb-6 border-b border-slate-200 text-xs">
            
            {/* Note & Status details */}
            <div className="space-y-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase">📌 Trạng Thái Đơn & Vận Hành</p>
                <div className="text-[11px] space-y-1 text-slate-600">
                  <p>• Trạng thái đơn hàng: <strong className="text-slate-800 font-bold">{order.status}</strong></p>
                  <p>• Mã đơn gốc: <strong className="font-mono text-slate-800">#{order.id}</strong></p>
                  {order.trackingCode && (
                    <p>• Mã vận đơn ZMX: <strong className="font-mono text-slate-800">{order.trackingCode}</strong></p>
                  )}
                  {order.shopVoucherCode && (
                    <p>• Voucher Shop đã áp dụng: <strong className="font-mono text-rose-600">{order.shopVoucherCode}</strong></p>
                  )}
                  {order.platformVoucherCode && (
                    <p>• Voucher Sàn đã áp dụng: <strong className="font-mono text-purple-600">{order.platformVoucherCode}</strong></p>
                  )}
                </div>
              </div>

              {/* Internal accounting COGS note for Seller */}
              {totalCost > 0 && (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 text-[11px] text-amber-800">
                  <p className="font-bold">📊 Hạch toán giá vốn kế toán:</p>
                  <p>Tổng giá vốn hàng xuất (COGS): <strong>{formatVND(totalCost)}</strong> | Lợi nhuận gộp ước tính: <strong className="text-emerald-700">{formatVND(grossProfit)}</strong></p>
                </div>
              )}
            </div>

            {/* Financial Calculations Box */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Tổng tiền hàng (Tiền SP):</span>
                <span className="font-bold text-slate-800">{formatVND(itemSubtotal)}</span>
              </div>

              {shopDiscount > 0 && (
                <div className="flex justify-between items-center text-rose-600 font-medium">
                  <span>Giảm giá Voucher Shop:</span>
                  <span className="font-bold">-{formatVND(shopDiscount)}</span>
                </div>
              )}

              {platformDiscount > 0 && (
                <div className="flex justify-between items-center text-purple-600 font-medium">
                  <span>Giảm giá Voucher Sàn:</span>
                  <span className="font-bold">-{formatVND(platformDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Phí vận chuyển (ĐVVC thu):</span>
                <span>{formatVND(order.shippingFee)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-slate-900 font-bold">
                <span>Tổng khách thanh toán:</span>
                <span className="text-base font-black text-slate-900">{formatVND(order.totalAmount)}</span>
              </div>

              {/* Seller Net Payout */}
              <div className="border-t border-dashed border-slate-200 pt-2 text-[11px] space-y-1">
                <div className="flex justify-between items-center text-amber-700">
                  <span>Phí chiết khấu Sàn TMĐT ({commRate}% tiền hàng):</span>
                  <span className="font-bold">-{formatVND(commAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-black text-sm pt-1">
                  <span>Doanh thu thực thu về Ví Shop:</span>
                  <span className="text-base text-emerald-600">
                    {['CANCELLED', 'REFUNDED', 'RETURNED'].includes(order.status) ? '0đ (Đã hủy)' : formatVND(netPayout)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Legal Signatures and QR Code */}
          <div className="pt-8 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
              
              {/* Buyer Signature */}
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase text-[11px]">Người Mua Hàng</p>
                <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[11px] text-slate-500 font-medium">{order.buyerName}</span>
                </div>
              </div>

              {/* Seller Signature */}
              <div className="space-y-1">
                <p className="font-black text-slate-800 uppercase text-[11px]">Người Bán Hàng</p>
                <p className="text-[10px] text-slate-400 italic">(Ký, đóng dấu điện tử)</p>
                <div className="h-16 flex items-center justify-center">
                  <div className="border-2 border-emerald-600 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transform -rotate-3 bg-emerald-50/70">
                    ✓ ĐÃ XÁC THỰC BỞI SHOP
                  </div>
                </div>
              </div>

              {/* Platform Digital Stamp */}
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <p className="font-black text-slate-800 uppercase text-[11px]">Hệ Thống ZeroMall</p>
                <p className="text-[10px] text-slate-400 italic">(Chữ ký số điện tử)</p>
                <div className="h-16 flex items-center justify-center">
                  <div className="border-2 border-slate-800 text-slate-800 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-100">
                    🛡️ KÝ SỐ SECURE SHA-256
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
              Hóa đơn điện tử được khởi tạo và lưu trữ trên Hệ Thống Quản Trị TMĐT ZeroMall. Mọi dữ liệu giá snapshot đều có giá trị pháp lý bất biến đối soát tài chính.
            </div>
          </div>

        </div>

        {/* Modal Footer (Excluded from printing) */}
        <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Mã hóa đơn: <strong className="font-mono text-slate-700">{invoiceNo}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🖨️</span> In Hóa Đơn
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}
