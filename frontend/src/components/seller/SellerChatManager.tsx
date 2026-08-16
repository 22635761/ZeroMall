import React from 'react';
import { ShopeeChatWindow } from '../common/ShopeeChatWindow';

interface SellerChatManagerProps {
  user: any;
  shopId?: string;
}

export const SellerChatManager: React.FC<SellerChatManagerProps> = ({ user, shopId }) => {
  const effectiveShopId = shopId || user?.shopId;

  return (
    <div className="w-full h-[660px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative font-sans">
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
