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
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    shop.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650' : 
                    shop.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-655' : 'bg-rose-50 text-rose-650'
                  }`}>
                    {shop.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-b border-slate-50 py-3 text-slate-650">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Chủ sở hữu ID</span>
                    <span className="font-mono text-slate-700 truncate max-w-xs">{shop.ownerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Email đăng ký</span>
                    <span className="font-semibold text-slate-700">{shop.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Số điện thoại</span>
                    <span className="font-semibold text-slate-700">{shop.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Địa chỉ lấy hàng</span>
                    <p className="text-slate-650 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">{shop.pickupAddress || 'Chưa cung cấp'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Cấu hình vận chuyển</span>
                    <p className="text-slate-650 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">{shop.shippingSettings || 'Chưa cung cấp'}</p>
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
