import React, { useState } from 'react'
import type { Shipment } from './DriverOrdersTab'

export interface DriverDeliveryConfirmModalProps {
  shipment: Shipment | null
  onClose: () => void
  onConfirm: (shipmentId: string, proofImage?: string, note?: string) => Promise<void>
  actionLoading: boolean
}

export const DriverDeliveryConfirmModal: React.FC<DriverDeliveryConfirmModalProps> = ({
  shipment,
  onClose,
  onConfirm,
  actionLoading
}) => {
  if (!shipment) return null

  const cod = shipment.codAmount || 0
  const isCod = cod > 0
  const [paymentTab, setPaymentTab] = useState<'CASH' | 'VIETQR'>('CASH')
  const [deliveryNote, setDeliveryNote] = useState<string>('Giao tận tay người nhận')
  const [proofImage, setProofImage] = useState<string>('')
  const [isCapturingProof, setIsCapturingProof] = useState<boolean>(false)

  const formatMoney = (val: number) => (val || 0).toLocaleString('vi-VN') + 'đ'

  // Tạo URL VietQR động chuẩn NAPAS 247 cho trường hợp khách thanh toán chuyển khoản tại chỗ
  const bankAccount = '102874928172' // Tài khoản Escrow Logistics ZeroMall
  const bankCode = 'ICB' // VietinBank
  const memoText = `ZMX ${shipment.trackingNumber}`
  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${cod}&addInfo=${encodeURIComponent(memoText)}&accountName=ZEROMALL%20ESCROW%20LOGISTICS`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsCapturingProof(true)
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      setProofImage(b64)
      setIsCapturingProof(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSimulateCapture = () => {
    // Giả lập chụp nhanh ảnh gói hàng tại địa chỉ thực tế có watermark
    const now = new Date()
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const dateStr = now.toLocaleDateString('vi-VN')
    
    // Tạo canvas đơn giản có watermark GPS & Giờ giao thực tế
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Background gradient giả lập bưu kiện trước cửa
      const grad = ctx.createLinearGradient(0, 0, 0, 480)
      grad.addColorStop(0, '#334155')
      grad.addColorStop(1, '#0f172a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 640, 480)

      // Vẽ biểu tượng kiện hàng
      ctx.fillStyle = '#f59e0b'
      ctx.fillRect(200, 160, 240, 200)
      ctx.fillStyle = '#b45309'
      ctx.fillRect(240, 160, 30, 200)
      ctx.fillRect(200, 240, 240, 30)

      // Watermark SPX Logistics
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`SPX PROOF OF DELIVERY (POD)`, 24, 40)
      
      ctx.font = '13px sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.fillText(`Mã vận đơn: ${shipment.trackingNumber}`, 24, 70)
      ctx.fillText(`Thời gian: ${timeStr} - ${dateStr}`, 24, 95)
      ctx.fillText(`Khách nhận: ${shipment.buyerName} (${shipment.buyerPhone})`, 24, 120)
      ctx.fillText(`Địa chỉ: ${shipment.deliveryAddress.slice(0, 55)}...`, 24, 440)
      
      setProofImage(canvas.toDataURL('image/jpeg', 0.85))
    }
  }

  const handleSubmit = async () => {
    const fullNote = isCod 
      ? `${deliveryNote} • ${paymentTab === 'CASH' ? 'Thu tiền mặt COD' : 'Khách quét mã VietQR'} (${formatMoney(cod)})`
      : `${deliveryNote} • Đơn đã thanh toán Online (COD 0đ)`
    
    await onConfirm(shipment.id, proofImage || undefined, fullNote)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-left">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4.5 flex justify-between items-center shadow-xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📦</span>
              <h3 className="font-black text-sm tracking-wide uppercase">Xác Nhận Giao Hàng & Thu Tiền</h3>
            </div>
            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
              Mã ZMX: <b>{shipment.trackingNumber}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 overflow-y-auto space-y-4 flex-1">
          
          {/* Thông tin người nhận & Địa chỉ */}
          <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">{shipment.buyerName}</span>
              <a href={`tel:${shipment.buyerPhone}`} className="text-emerald-700 font-black hover:underline flex items-center gap-1">
                <span>📞</span> {shipment.buyerPhone}
              </a>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              📍 {shipment.deliveryAddress}
            </p>
          </div>

          {/* KHỐI 1: XỬ LÝ TIỀN THU HỘ COD */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3 bg-white shadow-3xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Tiền Thu Hộ (COD)
              </span>
              <span className={`text-base font-black ${isCod ? 'text-rose-600' : 'text-emerald-600'}`}>
                {isCod ? formatMoney(cod) : '0đ (Đã thanh toán Online)'}
              </span>
            </div>

            {isCod ? (
              <div className="space-y-3 pt-1">
                {/* Switch Phương Thức Thanh Toán Tại Chỗ */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentTab('CASH')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentTab === 'CASH'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>💵</span> Thu Tiền Mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTab('VIETQR')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentTab === 'VIETQR'
                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>📱</span> Quét Mã VietQR
                  </button>
                </div>

                {/* Tab Tiền Mặt */}
                {paymentTab === 'CASH' && (
                  <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5">
                      <span>💡</span> Hãy đếm kỹ tiền mặt trước khi đưa hàng:
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Thu đúng <b>{formatMoney(cod)}</b>. Tiền mặt sẽ được cộng vào <b>Ví Thu Hộ COD</b> của bạn và cần nộp lại cho bưu cục cuối ca.
                    </p>
                  </div>
                )}

                {/* Tab Quét Mã VietQR Động Tại Cửa */}
                {paymentTab === 'VIETQR' && (
                  <div className="bg-indigo-50/60 border border-indigo-200/80 p-3.5 rounded-xl space-y-2 text-center">
                    <p className="text-xs font-bold text-indigo-900">
                      Đưa mã này cho khách quét bằng ứng dụng ngân hàng:
                    </p>
                    <div className="bg-white p-2.5 rounded-xl inline-block border border-indigo-200 shadow-xs">
                      <img
                        src={qrUrl}
                        alt="VietQR Thu Hộ COD"
                        className="w-48 h-48 mx-auto object-contain"
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      Nội dung: <b className="text-indigo-700">{memoText}</b> • Số tiền: <b className="text-rose-600">{formatMoney(cod)}</b>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tự động gạch nợ sau khi tài khoản Escrow ZeroMall nhận được tiền.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <span className="text-lg">✓</span>
                <span>Khách đã thanh toán trước qua Ví / Thẻ. <b>Không thu thêm bất kỳ khoản tiền nào</b> của khách hàng.</span>
              </div>
            )}
          </div>

          {/* KHỐI 2: BẰNG CHỨNG GIAO HÀNG (PROOF OF DELIVERY - POD) */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3 bg-white shadow-3xs">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span>📸</span> Chụp Ảnh Chứng Từ Giao (POD)
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Chuẩn SPX Express
              </span>
            </div>

            {proofImage ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-300">
                <img src={proofImage} alt="POD Proof" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setProofImage('')}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  ✕ Chụp lại
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCapture}
                  className="py-3 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="text-lg">📷</span>
                  <span>Chụp Nhanh Bưu Kiện</span>
                  <span className="text-[9px] text-emerald-600 font-normal">Dập Watermark GPS & Giờ</span>
                </button>
                <label className="py-3 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <span className="text-lg">📁</span>
                  <span>Tải Ảnh Từ Máy</span>
                  <span className="text-[9px] text-slate-400 font-normal">Ảnh chụp gói hàng</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            )}

            {/* Vị trí / Địa điểm để hàng */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-600">Ghi chú phương thức giao:</label>
              <select
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-emerald-600 transition"
              >
                <option value="Giao tận tay người nhận">Giao tận tay người nhận (Khách ký nhận)</option>
                <option value="Khách đồng ý để trước cửa nhà">Khách đồng ý để trước cửa nhà</option>
                <option value="Gửi tại bàn lễ tân / Bàn bảo vệ toà nhà">Gửi tại bàn lễ tân / Bàn bảo vệ toà nhà</option>
                <option value="Người thân / Hàng xóm nhận hộ">Người thân / Hàng xóm nhận hộ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={actionLoading || isCapturingProof}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {actionLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang ghi nhận bưu kiện...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Hoàn Tất Giao Hàng {isCod ? `& Thu ${formatMoney(cod)}` : ''}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
