import React, { useState, useEffect } from 'react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const [shopName, setShopName] = useState<string | null>(null)
  const [loadingShop, setLoadingShop] = useState(false)

  useEffect(() => {
    if (isOpen && user && user.shopId) {
      setLoadingShop(true)
      fetch(`http://localhost:8000/auth/shops/${user.shopId}`)
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error('Not found')
        })
        .then((data) => {
          setShopName(data.name)
        })
        .catch((err) => {
          console.error('Error loading shop details for profile:', err)
          setShopName(null)
        })
        .finally(() => {
          setLoadingShop(false)
        })
    } else {
      setShopName(null)
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  // Helper to format role names beautifully
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'BUYER':
        return { text: 'Người Mua Hàng', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
      case 'SHOP_OWNER':
        return { text: 'Chủ Cửa Hàng', color: 'bg-blue-50 text-blue-600 border-blue-200' }
      case 'SHOP_STAFF':
        return { text: 'Nhân Viên Cửa Hàng', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
      case 'ADMIN':
        return { text: 'Quản Trị Viên', color: 'bg-red-50 text-red-600 border-red-200' }
      default:
        return { text: role, color: 'bg-slate-50 text-slate-600 border-slate-200' }
    }
  }

  const badge = getRoleBadge(user.role)
  const userInitials = user.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 relative text-center bg-slate-50/50">
          <h2 className="font-extrabold text-lg text-slate-800">Thông Tin Tài Khoản</h2>
          <button 
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-left">
          {/* Avatar and general info banner */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
              {userInitials}
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">{user.name}</h3>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                {badge.text}
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-4 text-xs font-semibold text-slate-500">
            {/* Email */}
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span>Địa chỉ Email</span>
              <span className="text-slate-800">{user.email}</span>
            </div>

            {/* ID */}
            <div className="flex justify-between items-center py-1 border-b border-slate-50">
              <span>Mã tài khoản (ID)</span>
              <span className="text-slate-400 font-mono text-[10px] select-all">{user.id}</span>
            </div>

            {/* Shop Info (If seller or staff) */}
            {user.shopId && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span>Cửa hàng liên kết</span>
                <span className="text-slate-800">
                  {loadingShop ? 'Đang tải...' : (shopName || 'Cửa hàng của bạn')}
                </span>
              </div>
            )}

            {/* Shop ID (if applicable) */}
            {user.shopId && (
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span>Mã cửa hàng (Shop ID)</span>
                <span className="text-slate-400 font-mono text-[10px] select-all">{user.shopId}</span>
              </div>
            )}

            {/* Region/Note */}
            <div className="flex justify-between items-center py-1">
              <span>Trạng thái hoạt động</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                Đang trực tuyến
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
