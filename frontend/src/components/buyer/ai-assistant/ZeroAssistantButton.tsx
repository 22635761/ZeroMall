import React, { useState, useEffect } from 'react';

interface ZeroAssistantButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ZeroAssistantButton: React.FC<ZeroAssistantButtonProps> = ({
  onClick,
  isOpen,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Hiện tooltip mời gọi nhẹ nhàng sau 3 giây khi vào trang
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 3000);

    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (isOpen) return null;

  return (
    <div className="fixed bottom-22 right-6 z-40 flex items-center gap-2.5 font-sans">
      {/* Tooltip bong bóng mời gọi mua sắm */}
      {showTooltip && (
        <div
          onClick={onClick}
          className="hidden sm:flex items-center gap-2 bg-white text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-xl border border-indigo-100 animate-in fade-in slide-in-from-right duration-300 cursor-pointer hover:bg-slate-50 relative group"
        >
          <span className="text-base">💡</span>
          <span>
            Tìm đồ theo giá, quà tặng? <strong className="text-indigo-600 font-bold">ZeroAI</strong> tư vấn ngay!
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-slate-400 hover:text-slate-600 ml-1 text-xs"
          >
            ✕
          </button>
          <div className="absolute right-0 top-1/2 -mr-1.5 -translate-y-1/2 w-3 h-3 bg-white border-t border-r border-indigo-100 rotate-45"></div>
        </div>
      )}

      {/* Hero Floating Button (Pill Design Stacked Above Chat) */}
      <button
        onClick={onClick}
        aria-label="Mở Trợ Lý Mua Sắm ZeroAI"
        className="h-11 px-4 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/25 relative group"
      >
        {/* Subtle Pulsing Ring */}
        <span className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20 pointer-events-none"></span>

        {/* Mascot Robot Icon */}
        <span className="text-lg group-hover:rotate-12 transition duration-200">🤖</span>

        {/* Label */}
        <span className="tracking-wide">ZeroAI</span>

        {/* Online Status Dot */}
        <span className="w-2 h-2 bg-emerald-400 rounded-full border border-indigo-700 shadow-xs"></span>
      </button>
    </div>
  );
};
