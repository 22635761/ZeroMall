import React from 'react'

interface CsShopsTabProps {
  shops: any[]
  filteredShops: any[]
  statusFilter: string
  setStatusFilter: (filter: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  loading: boolean
  actionLoadingId: string | null
  handleApprove: (shopId: string, status: string) => Promise<void>
}

export const CsShopsTab: React.FC<CsShopsTabProps> = ({
  shops,
  filteredShops,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  loading,
  actionLoadingId,
  handleApprove
}) => {
  return (
    <>
      {/* Statistics Dashboard Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng cửa hàng</p>
          <p className="text-2xl font-black text-slate-700 mt-1">{shops.length}</p>
          <p className="text-[9px] text-slate-455 mt-1">Trong trạng thái lọc hiện tại</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
          <p className="text-[10px] text-amber-500 font-bold uppercase">Đang chờ duyệt</p>
          <p className="text-2xl font-black text-amber-555 mt-1">
            {statusFilter === 'PENDING_APPROVAL' ? filteredShops.length : 'Lọc để xem'}
          </p>
          <p className="text-[9px] text-slate-455 mt-1">Cần được xử lý sớm</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
          <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã kích hoạt</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {statusFilter === 'APPROVED' ? filteredShops.length : 'Lọc để xem'}
          </p>
          <p className="text-[9px] text-slate-455 mt-1">Sẵn sàng bán hàng</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs">
          <p className="text-[10px] text-rose-500 font-bold uppercase">Bị từ chối</p>
          <p className="text-2xl font-black text-rose-555 mt-1">
            {statusFilter === 'REJECTED' ? filteredShops.length : 'Lọc để xem'}
          </p>
          <p className="text-[9px] text-slate-455 mt-1">Yêu cầu hoàn trả thông tin</p>
        </div>
      </div>

      {/* Filters and Search controls */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'PENDING_APPROVAL', label: '⏳ Chờ phê duyệt' },
            { id: 'APPROVED', label: '✅ Đã kích hoạt' },
            { id: 'REJECTED', label: '❌ Bị từ chối' },
            { id: 'ALL', label: '🌐 Tất cả cửa hàng' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer border ${
                statusFilter === filter.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-3xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm shop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Grid content list of shops */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <p className="text-xs text-slate-400 font-bold uppercase animate-pulse">Đang tải dữ liệu cửa hàng...</p>
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-2xs">
          <p className="text-sm font-extrabold text-slate-400">Không tìm thấy yêu cầu cửa hàng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredShops.map(shop => (
            <div key={shop.id} className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-2xs flex flex-col justify-between hover:border-emerald-500/30 transition duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 leading-tight">{shop.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ID: {shop.id}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide border ${
                    shop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    shop.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                    shop.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {shop.status === 'PENDING_APPROVAL' ? '⏳ Chờ phê duyệt' :
                     shop.status === 'APPROVED' ? '✅ Đã kích hoạt' :
                     shop.status === 'REJECTED' ? '❌ Bị từ chối' :
                     shop.status === 'BLOCKED' ? '🔒 Đang bị khóa' : shop.status}
                  </span>
                </div>

                <div className="mt-4 space-y-3 border-t border-b border-slate-100 py-3 text-slate-650">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Chủ sở hữu ID</span>
                    <span className="font-mono text-[11px] text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 truncate max-w-[220px]" title={shop.ownerId}>
                      {shop.ownerId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Email đăng ký</span>
                    <span className="font-semibold text-slate-700">{shop.email || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Số điện thoại</span>
                    <span className="font-semibold text-slate-700">{shop.phoneNumber || 'Chưa cung cấp'}</span>
                  </div>

                  {/* 1. Formatted Pickup Address */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1">
                      <span>📦</span> Địa chỉ lấy hàng
                    </span>
                    {(() => {
                      let pickup: any = null
                      if (shop.pickupAddress) {
                        try {
                          pickup = typeof shop.pickupAddress === 'string' ? JSON.parse(shop.pickupAddress) : shop.pickupAddress
                        } catch {
                          pickup = null
                        }
                      }

                      if (!pickup || typeof pickup !== 'object') {
                        return (
                          <p className="text-slate-500 italic text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {shop.pickupAddress || 'Chưa cung cấp'}
                          </p>
                        )
                      }

                      const fullAddress = [
                        pickup.detailAddress,
                        pickup.ward,
                        pickup.district,
                        pickup.province
                      ].filter(Boolean).join(', ')

                      return (
                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>👤</span> {pickup.fullName || 'Người liên hệ'}
                            </span>
                            <span className="font-semibold text-slate-600 flex items-center gap-1">
                              <span>📞</span> {pickup.phoneNumber || shop.phoneNumber || 'Chưa có SĐT'}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium flex items-start gap-1.5 leading-relaxed">
                            <span className="shrink-0 mt-0.5">📍</span>
                            <span>{fullAddress || 'Chưa có chi tiết địa chỉ'}</span>
                          </p>
                          {(pickup.ghnProvinceId || pickup.ghnDistrictId || pickup.ghnWardCode) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">Mã GHN:</span>
                              {pickup.ghnProvinceId && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] rounded border border-emerald-200/60 font-bold">
                                  Tỉnh: {pickup.ghnProvinceId}
                                </span>
                              )}
                              {pickup.ghnDistrictId && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] rounded border border-emerald-200/60 font-bold">
                                  Huyện: {pickup.ghnDistrictId}
                                </span>
                              )}
                              {pickup.ghnWardCode && (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-mono text-[10px] rounded border border-emerald-200/60 font-bold">
                                  Xã: {pickup.ghnWardCode}
                                </span>
                              )}
                            </div>
                          )}
                          {pickup.coordinates && (
                            <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-0.5">
                              <span>🌐 Tọa độ:</span> {pickup.coordinates.lat?.toFixed(4)}, {pickup.coordinates.lng?.toFixed(4)}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* 2. Formatted Shipping Settings */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px] flex items-center gap-1">
                      <span>🚚</span> Cấu hình vận chuyển
                    </span>
                    {(() => {
                      let shipping: any = null
                      if (shop.shippingSettings) {
                        try {
                          shipping = typeof shop.shippingSettings === 'string' ? JSON.parse(shop.shippingSettings) : shop.shippingSettings
                        } catch {
                          shipping = null
                        }
                      }

                      if (!shipping || typeof shipping !== 'object') {
                        return (
                          <p className="text-slate-500 italic text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            {shop.shippingSettings || 'Chưa cung cấp'}
                          </p>
                        )
                      }

                      const channels = [
                        { key: 'express', label: 'Hỏa Tốc', icon: '⚡', enabled: !!shipping.express },
                        { key: 'fast', label: 'Nhanh', icon: '🚀', enabled: !!shipping.fast },
                        { key: 'saver', label: 'Tiết Kiệm', icon: '📦', enabled: !!shipping.saver },
                        { key: 'bulky', label: 'Hàng Cồng Kềnh', icon: '🚛', enabled: !!shipping.bulky },
                      ]

                      return (
                        <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                          {channels.map(ch => (
                            <div 
                              key={ch.key}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                                ch.enabled 
                                  ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/70 shadow-2xs' 
                                  : 'bg-white text-slate-400 border-slate-200/50 opacity-60'
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span>{ch.icon}</span> {ch.label}
                              </span>
                              <span className={`text-[10px] font-extrabold ${ch.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {ch.enabled ? 'Bật' : 'Tắt'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {shop.status === 'PENDING_APPROVAL' && (
                <div className="mt-4 flex gap-2">
                  <button
                    disabled={actionLoadingId === shop.id}
                    onClick={() => handleApprove(shop.id, 'APPROVED')}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg text-xs cursor-pointer shadow-3xs transition duration-150 disabled:opacity-50"
                  >
                    {actionLoadingId === shop.id ? 'Đang duyệt...' : 'Phê Duyệt'}
                  </button>
                  <button
                    disabled={actionLoadingId === shop.id}
                    onClick={() => handleApprove(shop.id, 'REJECTED')}
                    className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold rounded-lg text-xs cursor-pointer border border-rose-100 transition duration-150 disabled:opacity-50"
                  >
                    {actionLoadingId === shop.id ? 'Đang từ chối...' : 'Từ Chối'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
