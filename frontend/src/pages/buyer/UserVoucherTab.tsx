import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/api.config'
import { useNavigate } from 'react-router-dom'

interface UserVoucherTabProps {
  user: any
}

interface Voucher {
  id: string
  shopId: string
  name: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minSpend: number
  maxDiscount: number | null
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
}

export const UserVoucherTab: React.FC<UserVoucherTabProps> = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHIPPING' | 'SHOP' | 'PLATFORM'>('ALL')
  const [inputCode, setInputCode] = useState('')
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [savedVoucherIds, setSavedVoucherIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load saved voucher IDs from localStorage
  const loadSavedVouchers = () => {
    try {
      const stored = localStorage.getItem('zm_saved_vouchers')
      if (stored) {
        setSavedVoucherIds(JSON.parse(stored))
      } else {
        setSavedVoucherIds([])
      }
    } catch (e) {
      console.error('Error reading saved vouchers', e)
    }
  }

  // Load active real vouchers from Database via discount-service
  const fetchActiveVouchers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/discounts/all-active`)
      if (res.ok) {
        const data = await res.json()
        setVouchers(data)
      }
    } catch (err) {
      console.error('Error fetching real active vouchers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavedVouchers()
    fetchActiveVouchers()
  }, [])

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveMessage(null)

    if (!inputCode.trim()) return

    const uppercaseCode = inputCode.trim().toUpperCase()

    // Find the voucher in real active database list
    const realVoucher = vouchers.find(v => v.code === uppercaseCode)
    
    if (!realVoucher) {
      setSaveMessage({ text: 'Mã voucher này không tồn tại hoặc đã hết hạn sử dụng!', type: 'error' })
      return
    }

    // Check if already saved in wallet
    if (savedVoucherIds.includes(realVoucher.id)) {
      setSaveMessage({ text: 'Voucher này đã có sẵn trong ví của bạn rồi!', type: 'success' })
      return
    }

    // Save to localStorage
    const newSavedIds = [...savedVoucherIds, realVoucher.id]
    localStorage.setItem('zm_saved_vouchers', JSON.stringify(newSavedIds))
    setSavedVoucherIds(newSavedIds)
    
    setInputCode('')
    setSaveMessage({ text: `Đã lưu thành công mã ${realVoucher.code} vào ví voucher của bạn!`, type: 'success' })
  }

  const handleToggleSave = (voucherId: string) => {
    let newSavedIds: string[]
    if (savedVoucherIds.includes(voucherId)) {
      // If already saved, we navigate them to shop or home to use it
      navigate('/')
      return
    } else {
      newSavedIds = [...savedVoucherIds, voucherId]
      setSaveMessage({ text: 'Đã lưu voucher vào ví thành công!', type: 'success' })
    }

    localStorage.setItem('zm_saved_vouchers', JSON.stringify(newSavedIds))
    setSavedVoucherIds(newSavedIds)
  }

  // Filter vouchers based on tab selected
  const filteredVouchers = vouchers.filter(v => {
    // In our simplified setup, shipping offers have code starting with 'FREE' or 'SHIP'
    const isShipType = v.code.startsWith('FREE') || v.code.startsWith('SHIP')
    
    if (activeTab === 'ALL') return true
    if (activeTab === 'SHIPPING') return isShipType
    if (activeTab === 'SHOP') return !isShipType // All real vouchers belong to shops
    return false
  })

  // Format currency
  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ'
  }

  return (
    <div className="space-y-6 text-left selection:bg-[#ee4d2d] selection:text-white">
      
      {/* Header Banner Section */}
      <div className="pb-5 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Kho Voucher</h2>
          <p className="text-xs text-slate-500 mt-1">Lưu trữ và quản lý các mã giảm giá từ cửa hàng. Voucher đã lưu sẽ tự động hiển thị khi thanh toán đơn hàng.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] text-white font-semibold rounded-sm text-xs transition duration-150 cursor-pointer shadow-3xs shrink-0 self-start sm:self-center"
        >
          Tìm thêm Voucher
        </button>
      </div>

      {/* Add Voucher Form Section */}
      <div className="bg-slate-50 p-4 rounded-sm border border-slate-200/70 space-y-3">
        <form onSubmit={handleSaveVoucher} className="flex gap-3 text-xs items-center">
          <label className="text-slate-600 font-semibold shrink-0">Nhập mã Voucher</label>
          <input 
            type="text" 
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Ví dụ: NHAPMAVOUCHER..."
            className="flex-1 max-w-[400px] px-3.5 py-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#ee4d2d] uppercase text-xs"
          />
          <button 
            type="submit" 
            className="px-5 py-2 bg-[#ee4d2d] hover:bg-[#d03d20] disabled:opacity-50 text-white font-bold rounded-sm cursor-pointer transition shadow-3xs text-xs"
            disabled={!inputCode.trim()}
          >
            Lưu vào ví
          </button>
        </form>

        {saveMessage && (
          <div className={`p-2.5 rounded-sm text-[11px] font-semibold border ${
            saveMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Categories Tabs Section */}
      <div className="flex border-b border-slate-200 text-xs font-semibold text-slate-600 bg-white">
        {[
          { label: 'Tất cả', id: 'ALL' },
          { label: 'Miễn Phí Vận Chuyển', id: 'SHIPPING' },
          { label: 'Voucher từ Shop', id: 'SHOP' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-center border-b-2 transition ${
              activeTab === tab.id 
                ? 'border-[#ee4d2d] text-[#ee4d2d]' 
                : 'border-transparent hover:text-[#ee4d2d] cursor-pointer'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vouchers Grid List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#ee4d2d] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-450">Đang tải danh sách voucher thật...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-150 rounded-sm">
          <span className="text-4xl block">🎫</span>
          <p className="text-xs text-slate-400">Không tìm thấy voucher thật nào đang hoạt động thuộc danh mục này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVouchers.map(v => {
            const isShipping = v.code.startsWith('FREE') || v.code.startsWith('SHIP')
            const isSaved = savedVoucherIds.includes(v.id)
            const discountValue = v.type === 'percentage' ? `${v.value}%` : formatMoney(v.value)
            
            return (
              <div 
                key={v.id} 
                className="flex bg-white rounded-sm border border-slate-200 shadow-3xs overflow-hidden h-[110px]"
              >
                
                {/* Left Ticket Side (Voucher Color block) */}
                <div className={`w-[95px] flex flex-col items-center justify-center text-white p-2 text-center relative shrink-0 ${
                  isShipping ? 'bg-sky-500' : 'bg-orange-500'
                }`}>
                  <span className="text-xl mb-1">{isShipping ? '🚚' : '🎫'}</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider leading-none">
                    {isShipping ? 'Vận chuyển' : 'Giảm giá'}
                  </span>
                  
                  {/* Left-Right Răng cưa Ticket Effect */}
                  <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-1 translate-x-1/2 z-10">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white border-l border-slate-200" />
                    ))}
                  </div>
                </div>

                {/* Middle content section */}
                <div className="flex-1 p-3 min-w-0 flex flex-col justify-between text-xs border-r border-dashed border-slate-200 relative">
                  <div className="space-y-0.5 text-left">
                    <h4 className="font-extrabold text-[#ee4d2d] truncate text-[13px]">Giảm {discountValue}</h4>
                    <p className="text-[11px] text-slate-700 font-bold truncate">{v.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Đơn tối thiểu {formatMoney(v.minSpend)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Hạn dùng: {new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                    <span className="text-sky-600 font-semibold">Mã: {v.code}</span>
                  </div>
                </div>

                {/* Right Action side */}
                <div className="w-[85px] flex flex-col items-center justify-center p-2 shrink-0">
                  <button 
                    onClick={() => handleToggleSave(v.id)}
                    className={`px-3 py-1.5 rounded-sm text-[10px] font-bold transition duration-150 cursor-pointer shadow-3xs ${
                      isSaved 
                        ? 'bg-[#ee4d2d] text-white hover:bg-[#d03d20]' 
                        : 'border border-[#ee4d2d] text-[#ee4d2d] bg-white hover:bg-orange-50'
                    }`}
                  >
                    {isSaved ? 'Dùng ngay' : 'Lưu'}
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
