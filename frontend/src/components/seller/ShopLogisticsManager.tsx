import React, { useState, useEffect } from 'react'
import { LiveMapTracking } from '../delivery/LiveMapTracking'

interface Shipment {
  id: string
  orderId: string
  trackingNumber: string
  buyerName: string
  buyerPhone: string
  deliveryAddress: string
  codAmount: number
  shippingFee: number
  status: string
  createdAt: string
  currentHub?: { name: string }
  package?: { weight: number; itemsSummary?: string }
  trackingLogs: Array<{ status: string; title: string; description: string; timestamp: string }>
}

interface Settlement {
  id: string
  periodStart: string
  periodEnd: string
  totalCod: number
  shippingFee: number
  platformFee: number
  netAmount: number
  status: string
  settledAt?: string
  createdAt: string
}

interface ShopLogisticsManagerProps {
  user: any
  activeSubMenu?: string
}

export const ShopLogisticsManager: React.FC<ShopLogisticsManagerProps> = ({ user, activeSubMenu }) => {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [generatingSettlement, setGeneratingSettlement] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [shipRes, setRes] = await Promise.all([
        fetch(`http://localhost:8000/delivery/shipments`),
        fetch(`http://localhost:8000/delivery/settlements?sellerId=${user?.shopId || 'seller-default'}`),
      ])
      if (shipRes.ok) setShipments(await shipRes.json())
      if (setRes.ok) setSettlements(await setRes.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.shopId])

  const handleGenerateSettlement = async () => {
    setGeneratingSettlement(true)
    try {
      const res = await fetch(`http://localhost:8000/delivery/settlements/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user?.shopId || 'seller-default',
        }),
      })
      if (res.ok) {
        alert('Đã kết toán bảng kê đối soát COD thành công!')
        await fetchData()
      } else {
        alert('Không có giao dịch COD mới cần kết toán.')
      }
    } catch (e) {
      console.error(e)
      alert('Lỗi tạo bảng kê đối soát')
    } finally {
      setGeneratingSettlement(false)
    }
  }

  const formatMoney = (val: number) => val.toLocaleString('vi-VN') + 'đ'

  return (
    <div className="space-y-6 text-left">
      {/* Sub-view: COD & SETTLEMENT */}
      {activeSubMenu === 'spx-settlement' ? (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>💵</span> Bảng Kê Đối Soát COD ZeroMall Express (ZMX)
              </h2>
              <p className="text-xs text-slate-400">Xem doanh thu thu hộ COD, khấu trừ phí vận chuyển và số tiền thực nhận</p>
            </div>
            <button
              onClick={handleGenerateSettlement}
              disabled={generatingSettlement}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              {generatingSettlement ? 'Đang tạo...' : '➕ Yêu Cầu Kết Toán COD Mới'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Mã Bảng Kê</th>
                  <th className="py-3 px-4">Chu Kỳ Đối Soát</th>
                  <th className="py-3 px-4">Tổng Thu COD</th>
                  <th className="py-3 px-4">Phí Vận Chuyển / Sàn</th>
                  <th className="py-3 px-4">Thực Nhận</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-400">Đang tải bảng kê...</td></tr>
                ) : settlements.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-slate-400">Chưa có bảng kê đối soát nào.</td></tr>
                ) : (
                  settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">#{s.id.slice(0, 8)}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(s.periodStart).toLocaleDateString('vi-VN')} - {new Date(s.periodEnd).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">{formatMoney(s.totalCod)}</td>
                      <td className="py-3.5 px-4 text-rose-500 font-medium">-{formatMoney(s.shippingFee + s.platformFee)}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">{formatMoney(s.netAmount)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-md">
                          {s.status === 'APPROVED' ? 'Đã Thanh Toán' : s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sub-view: SHIPMENTS MANAGEMENT */
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>🚚</span> Quản Lý Vận Đơn ZeroMall Express (ZMX)
              </h2>
              <p className="text-xs text-slate-400">Theo dõi hành trình bưu kiện và tiến độ giao hàng thời gian thực</p>
            </div>
            <button
              onClick={() => fetchData()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              🔄 Làm Mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Mã Vận Đơn ZMX</th>
                  <th className="py-3 px-4">Người Nhận / Địa Chỉ</th>
                  <th className="py-3 px-4">Kiện Hàng / COD</th>
                  <th className="py-3 px-4">Trạng Thái Vận Chuyển</th>
                  <th className="py-3 px-4 text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400">Đang tải vận đơn...</td></tr>
                ) : shipments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400">Chưa có vận đơn nào.</td></tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 space-y-0.5">
                        <div>{s.trackingNumber}</div>
                        <div className="text-[10px] text-slate-400 font-normal">Đơn: #{s.orderId.slice(0, 10)}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-800">{s.buyerName} ({s.buyerPhone})</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{s.deliveryAddress}</div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-700 font-medium line-clamp-1">{s.package?.itemsSummary || 'Kiện hàng tiêu chuẩn'}</div>
                        <div className="text-[11px] font-bold text-emerald-600">
                          {s.codAmount > 0 ? `COD: ${formatMoney(s.codAmount)}` : 'Đã thanh toán Online'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          s.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          s.status === 'OUT_FOR_DELIVERY' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {s.status === 'CREATED' && 'Mới Tạo'}
                          {s.status === 'PICKUP_ASSIGNED' && 'Đã Gán Lấy Hàng'}
                          {s.status === 'PICKED_UP' && 'Đã Lấy Hàng'}
                          {s.status === 'AT_ORIGIN_HUB' && 'Tại Kho Xuất Phát'}
                          {s.status === 'SORTING' && 'Đang Phân Loại'}
                          {s.status === 'IN_TRANSIT' && 'Đang Trung Chuyển'}
                          {s.status === 'AT_DESTINATION_HUB' && 'Đã Đến Kho Phát'}
                          {s.status === 'OUT_FOR_DELIVERY' && 'Đang Giao Hàng'}
                          {s.status === 'DELIVERED' && 'Giao Thành Công'}
                          {s.status === 'DELIVERY_FAILED' && 'Giao Thất Bại'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedShipment(s)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          📜 Xem Hành Trình
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Timeline */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <span>🚚</span> Hành Trình Vận Đơn {selectedShipment.trackingNumber}
                </h3>
                <p className="text-[11px] text-slate-400">Đơn hàng: #{selectedShipment.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* 🗺️ BẢN ĐỒ HÀNH TRÌNH TƯƠNG TÁC GOONG MAP / OSM LIVE */}
            <LiveMapTracking
              trackingData={selectedShipment}
              goongApiKey={import.meta.env.VITE_GOONG_API_KEY}
            />

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              {selectedShipment.trackingLogs.map((log, index) => (
                <div key={index} className="flex gap-3 relative text-xs">
                  {index !== selectedShipment.trackingLogs.length - 1 && (
                    <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-100"></div>
                  )}
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 z-10 text-[9px] font-bold ${
                    index === 0 ? 'bg-[#ee4d2d] text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index === 0 ? '●' : '○'}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <span className={`font-bold ${index === 0 ? 'text-[#ee4d2d]' : 'text-slate-700'}`}>{log.title}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-normal leading-relaxed">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
