import React from 'react';
import { ShopeeChatWindow } from '../common/ShopeeChatWindow';

interface SellerChatManagerProps {
  user: any;
  shopId?: string;
}

export const SellerChatManager: React.FC<SellerChatManagerProps> = ({ user, shopId }) => {
  const effectiveShopId = shopId || user?.shopId;

  return (
    <div className="w-full h-[calc(100vh-200px)] min-h-[580px] bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden relative font-sans">
      <ShopeeChatWindow
        user={user}
        mode="SELLER"
        isOpen={true}
        shopId={effectiveShopId}
        isEmbedded={true}
      />
    </div>
  );
};
