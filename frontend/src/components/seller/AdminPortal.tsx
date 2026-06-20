import React, { useState, useEffect } from 'react'

interface AdminPortalProps {
  user: any
  onLogout: () => void
  onBackToHome: () => void
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  user,
  onLogout,
  onBackToHome
}) => {
  const [shops, setShops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL') // 'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchShops = async () => {
    setLoading(true)
    try {
      // Fetch all shops and filter/sort client-side or use status query
      const url = statusFilter === 'ALL' 
        ? `http://localhost:8000/auth/shops`
        : `http://localhost:8000/auth/shops?status=${statusFilter}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Không thể tải danh sách cửa hàng')
      const data = await response.json()
      setShops(data)
    } catch (err: any) {
      console.error(err)
      alert(`Lỗi: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [statusFilter])

  const handleApprove = async (shopId: string, action: 'APPROVED' | 'REJECTED') => {
    setActionLoadingId(shopId)
    try {
      const response = await fetch(`http://localhost:8000/auth/shops/${shopId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      })

      if (!response.ok) throw new Error('Không thể cập nhật trạng thái cửa hàng')
      
      // Refresh list
      await fetchShops()
      alert(action === 'APPROVED' ? 'Đã phê duyệt shop hoạt động!' : 'Đã từ chối đơn đăng ký shop.')
    } catch (err: any) {
      alert(`Lỗi khi xử lý: ${err.message}`)
    } finally {
      setActionLoadingId(null)
    }
  }

  // Count helper
  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (shop.email && shop.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans text-left">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 h-16 flex items-center justify-between px-6 z-40 sticky top-0 shadow-3xs">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToHome}>
          <span className="text-2xl">🌱</span>
          <span className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
            Zero<span className="text-emerald-600">Mall</span> 
            <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-sm">
              ADMIN CONTROL PANEL
            </span>
          </span>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <button 
            onClick={onBackToHome}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition flex items-center gap-1.5 cursor-pointer bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg"
          >
            🛒 Về Trang Mua Sắm
          </button>
          
          <span className="text-slate-200">|</span>

          {/* Admin Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center font-bold text-rose-600 text-xs shadow-3xs">
              🛡️
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-slate-700 leading-tight">{user?.name || 'Admin User'}</p>
              <p className="text-[10px] text-rose-500 capitalize font-bold mt-0.5">Quản trị viên</p>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="text-xs font-bold text-red-500 hover:text-red-650 transition cursor-pointer"
          >
            Đăng Xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-6">
        
        {/* Statistics Dashboard Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Tổng cửa hàng</p>
            <p className="text-2xl font-black text-slate-700 mt-1">{shops.length}</p>
            <p className="text-[9px] text-slate-400 mt-1">Trong trạng thái lọc hiện tại</p>
          </div>
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <p className="text-[10px] text-amber-500 font-bold uppercase">Đang chờ duyệt</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              {statusFilter === 'PENDING_APPROVAL' ? filteredShops.length : 'Lọc để xem'}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Cần được xử lý sớm</p>
          </div>
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Đã kích hoạt</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {statusFilter === 'APPROVED' ? filteredShops.length : 'Lọc để xem'}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Sẵn sàng bán hàng</p>
          </div>
          <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-2xs">
            <p className="text-[10px] text-rose-500 font-bold uppercase">Bị từ chối</p>
            <p className="text-2xl font-black text-rose-500 mt-1">
              {statusFilter === 'REJECTED' ? filteredShops.length : 'Lọc để xem'}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Yêu cầu hoàn trả thông tin</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'PENDING_APPROVAL', label: '⏳ Chờ phê duyệt' },
              { id: 'APPROVED', label: '✅ Đã kích hoạt' },
              { id: 'REJECTED', label: '❌ Bị từ chối' },
              { id: 'ALL', label: '🌐 Tất cả cửa hàng' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  statusFilter === filter.id
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-655 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="🔍 Tìm shop theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Shops Listing */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-slate-500 mt-4">Đang tải danh sách các shop từ hệ thống...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-3xl p-6 shadow-2xs text-center space-y-3">
            <span className="text-4xl">📭</span>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Trống</p>
              <p className="text-xs text-slate-400">Không tìm thấy cửa hàng nào khớp với bộ lọc hiện tại.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredShops.map(shop => {
              // Parse pickupAddress & shippingSettings
              let parsedAddress: any = null
              let parsedShipping: any = { express: false, fast: false, saver: false, bulky: false }
              
              if (shop.pickupAddress) {
                try {
                  parsedAddress = typeof shop.pickupAddress === 'string'
                    ? JSON.parse(shop.pickupAddress)
                    : shop.pickupAddress
                } catch (e) {}
              }

              if (shop.shippingSettings) {
                try {
                  parsedShipping = typeof shop.shippingSettings === 'string'
                    ? JSON.parse(shop.shippingSettings)
                    : shop.shippingSettings
                } catch (e) {}
              }

              return (
                <div key={shop.id} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  {/* Shop Top Banner */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên Cửa Hàng</span>
                      <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        🏪 {shop.name}
                      </h3>
                      <p className="text-[10px] text-slate-450 font-semibold">ID: {shop.id}</p>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider border ${
                      shop.status === 'PENDING_APPROVAL' 
                        ? 'bg-amber-50 text-amber-550 border-amber-100'
                        : shop.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : shop.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-500 border-rose-100'
                            : 'bg-slate-50 text-slate-500 border-slate-150'
                    }`}>
                      {shop.status === 'PENDING_APPROVAL' && 'Chờ duyệt'}
                      {shop.status === 'APPROVED' && 'Hoạt động'}
                      {shop.status === 'REJECTED' && 'Bị từ chối'}
                      {shop.status === 'DRAFT' && 'Nháp'}
                    </span>
                  </div>

                  {/* Shop Details */}
                  <div className="p-5 space-y-4 text-xs font-semibold text-slate-700 flex-1">
                    <div className="grid grid-cols-2 gap-3 pb-3.5 border-b border-slate-50">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Số điện thoại</p>
                        <p>{shop.phoneNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Email liên hệ</p>
                        <p className="truncate">{shop.email || 'N/A'}</p>
                      </div>
                    </div>

                    {parsedAddress && (
                      <div className="pb-3.5 border-b border-slate-50">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Địa chỉ lấy hàng</p>
                        <p className="text-slate-655 font-medium leading-relaxed">
                          <strong>{parsedAddress.fullName}</strong> ({parsedAddress.phoneNumber})<br />
                          {parsedAddress.detailAddress}, {parsedAddress.ward}, {parsedAddress.district}, {parsedAddress.province}
                        </p>
                        {parsedAddress.coordinates && (
                          <span className="inline-block bg-sky-50 text-sky-600 border border-sky-100 text-[8px] font-black px-1.5 py-0.2 rounded-sm mt-1">
                            📍 Tọa độ GPS: {parsedAddress.coordinates.lat.toFixed(6)}, {parsedAddress.coordinates.lng.toFixed(6)}
                          </span>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1.5">Vận chuyển đăng ký</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedShipping.express && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded-sm text-[10px]">Hỏa Tốc</span>}
                        {parsedShipping.fast && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded-sm text-[10px]">Nhanh</span>}
                        {parsedShipping.saver && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded-sm text-[10px]">Tiết Kiệm</span>}
                        {parsedShipping.bulky && <span className="bg-slate-100 text-slate-655 px-2 py-0.5 rounded-sm text-[10px]">Hàng Cồng Kềnh</span>}
                        {!parsedShipping.express && !parsedShipping.fast && !parsedShipping.saver && !parsedShipping.bulky && (
                          <span className="text-slate-400 italic">Chưa chọn hình thức nào</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approve/Reject Actions */}
                  {shop.status === 'PENDING_APPROVAL' && (
                    <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                      <button
                        onClick={() => handleApprove(shop.id, 'APPROVED')}
                        disabled={actionLoadingId !== null}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                      >
                        {actionLoadingId === shop.id ? 'Đang xử lý...' : 'Phê Duyệt Hoạt Động ✓'}
                      </button>
                      <button
                        onClick={() => handleApprove(shop.id, 'REJECTED')}
                        disabled={actionLoadingId !== null}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl py-2.5 font-bold text-xs transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
                      >
                        {actionLoadingId === shop.id ? 'Đang xử lý...' : 'Từ Chối Đăng Ký ✕'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
