import React from 'react'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenLogin: () => void
  onOpenRegister: () => void
  title?: string
  description?: string
  icon?: string
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  onOpenRegister,
  title = 'Bạn chưa đăng nhập tài khoản',
  description = 'Vui lòng đăng nhập hoặc tạo tài khoản ZeroMall để xem giỏ hàng, lưu trữ sản phẩm và tiến hành đặt hàng.',
  icon = '🛒'
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200 font-sans">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-sm font-bold"
          title="Đóng"
        >
          ✕
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-xs border border-orange-100">
          {icon}
        </div>

        {/* Text Details */}
        <div className="space-y-2 text-left sm:text-center">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => {
              onClose()
              onOpenLogin()
            }}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-orange-500/20 transition duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🔑</span> Đăng Nhập Ngay
          </button>

          <button
            onClick={() => {
              onClose()
              onOpenRegister()
            }}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs border border-slate-200 transition duration-200 cursor-pointer"
          >
            Tạo Tài Khoản Mới
          </button>

          <button
            onClick={onClose}
            className="w-full py-1 text-slate-400 hover:text-slate-600 text-[11px] font-semibold transition cursor-pointer"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}
