import React, { useState, useEffect } from 'react'

interface ShopVoucher {
  id: string
  shopId: string
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minSpend: number
  maxDiscount: number | null // null means unlimited/no cap
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  createdAt: string
}

interface ShopVouchersProps {
  user: any
}

export const ShopVouchers: React.FC<ShopVouchersProps> = ({ user }) => {
  const shopId = user?.shopId || ''

  // Vouchers state
  const [vouchers, setVouchers] = useState<ShopVoucher[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'expired'>('all')

  // Form states
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState<number>(10)
  const [minSpend, setMinSpend] = useState<number>(100000)
  const [isCapped, setIsCapped] = useState(true)
  const [maxDiscount, setMaxDiscount] = useState<number>(5000)
  const [usageLimit, setUsageLimit] = useState<number>(100)
  
  // Set defaults for start/end dates (today to +7 days)
  const getLocalDateTimeString = (date: Date) => {
    const tzoffset = date.getTimezoneOffset() * 60000
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16)
    return localISOTime
  }

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    setStartDate(getLocalDateTimeString(now))
    setEndDate(getLocalDateTimeString(nextWeek))
  }, [isCreating])

  // Load vouchers from backend API
  const loadVouchers = async () => {
    if (!shopId) return
    try {
      const response = await fetch(`http://localhost:8000/discounts?shopId=${shopId}`)
      if (!response.ok) throw new Error('Không thể tải danh sách mã giảm giá')
      const data = await response.json()
      setVouchers(data)
    } catch (e) {
      console.error('Failed to load shop vouchers', e)
    }
  }

  useEffect(() => {
    loadVouchers()
  }, [shopId])

  // Save voucher to backend
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validations
    if (!name.trim()) {
      alert('Vui lòng nhập tên chương trình!')
      return
    }
    if (!code.trim() || code.length < 3 || code.length > 8) {
      alert('Mã giảm giá phải từ 3 đến 8 ký tự viết hoa!')
      return
    }
    if (!/^[A-Z0-9]+$/.test(code)) {
      alert('Mã giảm giá chỉ được chứa chữ cái viết hoa và chữ số!')
      return
    }
    if (value <= 0) {
      alert('Giá trị giảm giá phải lớn hơn 0!')
      return
    }
    if (type === 'percentage' && value > 100) {
      alert('Phần trăm giảm giá không thể lớn hơn 100%!')
      return
    }
    if (minSpend < 0) {
      alert('Giá trị đơn hàng tối thiểu không thể âm!')
      return
    }
    if (type === 'percentage' && isCapped && (!maxDiscount || maxDiscount <= 0)) {
      alert('Vui lòng nhập mức giảm tối đa hợp lệ hoặc chọn Không giới hạn!')
      return
    }
    if (usageLimit <= 0) {
      alert('Tổng lượt sử dụng phải lớn hơn 0!')
      return
    }
    if (new Date(startDate) >= new Date(endDate)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu!')
      return
    }

    try {
      // Check duplicate code locally
      const duplicate = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase())
      if (duplicate) {
        alert(`Mã giảm giá ${code.toUpperCase()} đã tồn tại trong cửa hàng của bạn!`)
        return
      }

      const payload = {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        type,
        value,
        minSpend,
        maxDiscount: type === 'percentage' && isCapped ? maxDiscount : null,
        usageLimit,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      }

      const response = await fetch(`http://localhost:8000/discounts?shopId=${shopId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Lỗi khi lưu mã giảm giá')
      }
      
      // Reset form & reload
      setName('')
      setCode('')
      setType('percentage')
      setValue(10)
      setMinSpend(100000)
      setIsCapped(true)
      setMaxDiscount(5000)
      setUsageLimit(100)
      setIsCreating(false)
      await loadVouchers()
    } catch (e: any) {
      console.error('Failed to create shop voucher', e)
      alert(e.message || 'Đã xảy ra lỗi khi tạo mã giảm giá.')
    }
  }

  // Delete voucher from backend
  const handleDeleteVoucher = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã giảm giá này không?')) {
      try {
        const response = await fetch(`http://localhost:8000/discounts/${id}`, {
          method: 'DELETE'
        })
        if (!response.ok) throw new Error('Không thể xóa mã giảm giá')
        await loadVouchers()
      } catch (e) {
        console.error('Failed to delete voucher', e)
        alert('Đã xảy ra lỗi khi xóa mã giảm giá.')
      }
    }
  }

  // Filter vouchers based on activeTab
  const getFilteredVouchers = () => {
    const now = new Date()
    return vouchers.filter(v => {
      const start = new Date(v.startDate)
      const end = new Date(v.endDate)
      
      const isActive = now >= start && now <= end && v.usedCount < v.usageLimit
      const isUpcoming = now < start
      const isExpired = now > end || v.usedCount >= v.usageLimit

      if (activeTab === 'active') return isActive
      if (activeTab === 'upcoming') return isUpcoming
      if (activeTab === 'expired') return isExpired
      return true // 'all'
    })
  }

  // Format currencies
  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + 'đ'
  }

  const filteredList = getFilteredVouchers()

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      
      {/* Top Banner Control */}
      <div className="flex justify-between items-center bg-white p-5 border border-slate-200/60 rounded-2xl shadow-3xs">
        <div>
          <h2 className="text-sm font-extrabold text-slate-700">Quản Lý Mã Giảm Giá Của Shop</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Tạo mã giảm giá để thu hút khách hàng, kích cầu mua sắm tại shop.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
        >
          🎟️ Tạo Mã Giảm Giá Mới
        </button>
      </div>

      {/* LIST OF VOUCHERS SCREEN */}
      <div className="space-y-6">
        
        {/* Tabs Menu & Table Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                activeTab === 'all' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Tất cả ({vouchers.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                activeTab === 'active' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Đang diễn ra ({vouchers.filter(v => {
                const now = new Date();
                return now >= new Date(v.startDate) && now <= new Date(v.endDate) && v.usedCount < v.usageLimit;
              }).length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                activeTab === 'upcoming' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sắp diễn ra ({vouchers.filter(v => new Date() < new Date(v.startDate)).length})
            </button>
            <button
              onClick={() => setActiveTab('expired')}
              className={`px-6 py-4 text-xs font-bold border-b-2 cursor-pointer transition ${
                activeTab === 'expired' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Đã kết thúc ({vouchers.filter(v => new Date() > new Date(v.endDate) || v.usedCount >= v.usageLimit).length})
            </button>
          </div>

          {/* List Content */}
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3">
              <span className="text-4xl">🎟️</span>
              <p className="text-xs font-bold text-slate-500">Không tìm thấy mã giảm giá nào phù hợp.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="text-xs text-emerald-600 hover:underline font-bold cursor-pointer"
              >
                Nhấp vào đây để tạo mới ngay.
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Tên chương trình / Mã</th>
                    <th className="p-4">Loại hình / Mức giảm</th>
                    <th className="p-4">Đơn tối thiểu</th>
                    <th className="p-4">Đã dùng / Tổng lượt</th>
                    <th className="p-4">Thời gian hoạt động</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4 pr-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredList.map((voucher) => {
                    const now = new Date()
                    const start = new Date(voucher.startDate)
                    const end = new Date(voucher.endDate)
                    
                    let statusText = 'Đang diễn ra'
                    let statusStyle = 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    
                    if (now < start) {
                      statusText = 'Sắp diễn ra'
                      statusStyle = 'bg-blue-50 text-blue-600 border border-blue-100'
                    } else if (now > end) {
                      statusText = 'Đã kết thúc (Hết hạn)'
                      statusStyle = 'bg-slate-100 text-slate-400 border border-slate-200'
                    } else if (voucher.usedCount >= voucher.usageLimit) {
                      statusText = 'Đã hết số lượng'
                      statusStyle = 'bg-amber-50 text-amber-600 border border-amber-100'
                    }

                    return (
                      <tr key={voucher.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 pl-6 space-y-1 max-w-xs">
                          <p className="font-extrabold text-slate-800 leading-tight">{voucher.name}</p>
                          <p className="font-mono text-[10px] text-slate-400 font-bold uppercase">{voucher.code}</p>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="font-black text-slate-850">
                            {voucher.type === 'percentage' 
                              ? `Giảm ${voucher.value}%` 
                              : `Giảm ${formatVND(voucher.value)}`
                            }
                          </p>
                          {voucher.type === 'percentage' && (
                            <p className="text-[10px] text-slate-400 font-bold">
                              {voucher.maxDiscount ? `Tối đa ${formatVND(voucher.maxDiscount)}` : 'Không giới hạn mức giảm'}
                            </p>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          {formatVND(voucher.minSpend)}
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800">{voucher.usedCount}</span>
                            <span className="text-slate-350">/</span>
                            <span className="text-slate-400 font-medium">{voucher.usageLimit}</span>
                          </div>
                          {/* Simple visual progress bar */}
                          <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${Math.min((voucher.usedCount / voucher.usageLimit) * 100, 100)}%` }} 
                            />
                          </div>
                        </td>
                        <td className="p-4 space-y-0.5 text-[10px] text-slate-400 font-bold">
                          <p>Bắt đầu: {new Date(voucher.startDate).toLocaleString('vi-VN')}</p>
                          <p>Kết thúc: {new Date(voucher.endDate).toLocaleString('vi-VN')}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusStyle}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleDeleteVoucher(voucher.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-750 transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE VOUCHER MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs text-slate-800 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-[#f8fafc] border border-slate-200/60 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] text-left">
            {/* Header */}
            <div className="bg-white p-4.5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-sm text-[#ee4d2d] flex items-center gap-1.5">
                <span>🎟️</span> Tạo Mã Giảm Giá Mới Của Shop
              </h3>
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer bg-slate-100 hover:bg-slate-200/70 p-1 px-2.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body Container */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Card */}
              <div className="lg:col-span-8 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-3xs">
                <form onSubmit={handleCreateVoucher} className="space-y-5 text-xs font-semibold text-slate-750">
                  
                  {/* Voucher Name */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Tên chương trình giảm giá</label>
                    <div className="md:col-span-9">
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Tri ân khách hàng mua sắm"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Tên chương trình chỉ để người bán quản lý, không hiển thị cho người mua.</p>
                    </div>
                  </div>

                  {/* Voucher Code */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Mã giảm giá (Code)</label>
                    <div className="md:col-span-9 flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: SHOP10"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="w-full md:w-60 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition uppercase font-bold"
                      />
                      <span className="text-[10px] text-slate-400 font-medium">Từ 3-8 chữ cái viết hoa & chữ số.</span>
                    </div>
                  </div>

                  {/* Expiry Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <label className="md:col-span-3 text-slate-500 font-bold md:pt-3">Thời hạn sử dụng</label>
                    <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Bắt đầu</span>
                        <input
                          type="datetime-local"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Kết thúc</span>
                        <input
                          type="datetime-local"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="font-extrabold text-slate-800 text-xs mb-4 flex items-center gap-1">
                      <span>⚙️</span> Thiết lập mức giảm giá
                    </h4>
                  </div>

                  {/* Discount Type */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Loại giảm giá</label>
                    <div className="md:col-span-9 flex flex-col md:flex-row md:items-center gap-4 text-xs font-bold text-slate-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discount_type"
                          checked={type === 'percentage'}
                          onChange={() => {
                            setType('percentage')
                            setValue(10)
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Khuyến mãi theo phần trăm (%)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="discount_type"
                          checked={type === 'fixed'}
                          onChange={() => {
                            setType('fixed')
                            setValue(20000)
                          }}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Số tiền giảm cố định (đ)</span>
                      </label>
                    </div>
                  </div>

                  {/* Value Input */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Mức giảm giá</label>
                    <div className="md:col-span-9 flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        max={type === 'percentage' ? 100 : undefined}
                        value={value}
                        onChange={(e) => setValue(Number(e.target.value))}
                        className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-bold"
                      />
                      <span className="font-bold text-slate-650">{type === 'percentage' ? '%' : 'VNĐ'}</span>
                    </div>
                  </div>

                  {/* Min Spend */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Giá trị đơn tối thiểu</label>
                    <div className="md:col-span-9 flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min={0}
                        value={minSpend}
                        onChange={(e) => setMinSpend(Number(e.target.value))}
                        className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-bold"
                      />
                      <span className="font-bold text-slate-650">VNĐ</span>
                      <p className="text-[10px] text-slate-400 font-medium ml-2">Số tiền tối thiểu đơn hàng cần đạt để áp dụng.</p>
                    </div>
                  </div>

                  {/* Max Discount Cap (for Percentage Type) */}
                  {type === 'percentage' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <label className="md:col-span-3 text-slate-500 font-bold">Mức giảm tối đa</label>
                      <div className="md:col-span-9 space-y-3">
                        <div className="flex items-center gap-4 text-slate-700">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="cap_type"
                              checked={isCapped}
                              onChange={() => setIsCapped(true)}
                              className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Giới hạn mức giảm</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="cap_type"
                              checked={!isCapped}
                              onChange={() => setIsCapped(false)}
                              className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Không giới hạn</span>
                          </label>
                        </div>

                        {isCapped && (
                          <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                            <input
                              type="number"
                              required={isCapped}
                              min={100}
                              value={maxDiscount}
                              onChange={(e) => setMaxDiscount(Number(e.target.value))}
                              className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-bold"
                            />
                            <span className="font-bold text-slate-650">VNĐ</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-2">(Ví dụ: Giảm 10% tối đa 5k cho đơn hàng trên 100k)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Usage Limit */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <label className="md:col-span-3 text-slate-500 font-bold">Lượt sử dụng tối đa</label>
                    <div className="md:col-span-9 flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(Number(e.target.value))}
                        className="w-40 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-bold"
                      />
                      <span className="font-bold text-slate-650">Lượt</span>
                      <p className="text-[10px] text-slate-400 font-medium ml-2">Tổng số lần mã này có thể được người mua sử dụng.</p>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-6 py-2.5 border border-slate-250 font-bold text-slate-500 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                    >
                      Tạo Mã Giảm Giá
                    </button>
                  </div>

                </form>
              </div>

              {/* Premium Preview Card */}
              <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-2xl p-6 shadow-3xs sticky top-0">
                <h3 className="font-extrabold text-sm text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
                  <span>👀</span> Bản Xem Trước (Buyer View)
                </h3>

                {/* Voucher Card Shape Mockup */}
                <div className="relative border border-amber-250/70 bg-linear-to-r from-amber-50/50 to-white rounded-xl overflow-hidden shadow-2xs flex h-28 select-none">
                  {/* Ticket Punch Circles */}
                  <div className="w-24 bg-linear-to-b from-[#f97316] to-[#ea580c] flex flex-col items-center justify-center text-white px-2 border-r-2 border-dashed border-white/60 relative">
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-b border-slate-150 rounded-full z-10" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-t border-slate-150 rounded-full z-10" />
                    
                    <span className="text-xl">🎟️</span>
                    <span className="text-[10px] font-black uppercase mt-1 tracking-wider text-amber-100">CỦA SHOP</span>
                  </div>

                  {/* Ticket Right Content Section */}
                  <div className="flex-1 p-3.5 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] bg-orange-100 text-[#ee4d2d] px-1.5 py-0.2 rounded-xs font-black uppercase tracking-wider scale-95 shrink-0">
                          Voucher Shop
                        </span>
                        <span className="text-[10px] font-black text-slate-700 font-mono truncate max-w-[80px]">
                          {code ? code.toUpperCase() : 'CODE'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-850 text-[11px] leading-tight mt-1">
                        {type === 'percentage' 
                          ? `Giảm ${value}% Đơn tối thiểu ${formatVND(minSpend)}`
                          : `Giảm ${formatVND(value)} Đơn tối thiểu ${formatVND(minSpend)}`
                        }
                      </h4>
                      {type === 'percentage' && (
                        <p className="text-[9px] text-[#ee4d2d] font-bold">
                          {isCapped ? `Tối đa ${formatVND(maxDiscount)}` : 'Không giới hạn mức giảm'}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-[8px] text-slate-400 font-medium">
                        Hết hạn: {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                      <button type="button" disabled className="bg-[#ee4d2d] text-white font-extrabold text-[9px] px-2.5 py-1 rounded-sm shadow-2xs opacity-90 scale-95 pointer-events-none uppercase">
                        Dùng Sau
                      </button>
                    </div>
                  </div>
                </div>

                {/* Explanatory text */}
                <div className="mt-5 p-3.5 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed">
                  💡 <strong>Thông tin hiển thị:</strong> Khách hàng sẽ thấy mã giảm giá này tại trang Giỏ Hàng & Checkout của họ nếu đơn hàng của họ chứa sản phẩm thuộc Shop của bạn và thỏa mãn giá trị đơn tối thiểu.
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
