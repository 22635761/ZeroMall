import React from 'react';
import { ShopeeChatWindow } from '../common/ShopeeChatWindow';

interface CsLiveChatTabProps {
  user: any;
}

export const CsLiveChatTab: React.FC<CsLiveChatTabProps> = ({ user }) => {
  return (
    <div className="space-y-4 text-left">
      <div className="bg-white border border-slate-200/70 rounded-2xl p-4 shadow-3xs flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <span>🎧</span> Tiếp Nhận Yêu Cầu Hỗ Trợ Khách Hàng (Live Chat CSKH)
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Trực tiếp giải đáp thắc mắc, xử lý sự cố thanh toán, đơn hàng và các khiếu nại của khách hàng gửi tới Sàn ZeroMall.
          </p>
        </div>
        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang Trực Tuyến CSKH
        </span>
      </div>

      <div className="w-full h-[620px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative font-sans">
        <ShopeeChatWindow
          user={user}
          mode="SELLER"
          isOpen={true}
          shopId="PLATFORM_SUPPORT"
          isEmbedded={true}
        />
      </div>
    </div>
  );
};
