import React, { useState, useEffect } from 'react';
import { ShopeeChatWindow } from '../common/ShopeeChatWindow';
import { fetchConversations } from '../../services/chat.service';

interface ChatWidgetProps {
  user?: any;
  targetShopId?: string;
  targetShopName?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  user,
  targetShopId = '6e6e9cbe-c4cd-43a2-b71c-de2b32e9a30c',
  targetShopName = 'ZeroMall Store',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeShopId, setActiveShopId] = useState(targetShopId);
  const [activeShopName, setActiveShopName] = useState(targetShopName);
  const [unreadCount, setUnreadCount] = useState(0);

  const buyerId = user?.id || user?._id || user?.userId;

  // Listen to global open chat event from product detail / shop pages
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      if (e.detail?.shopId) {
        setActiveShopId(e.detail.shopId);
        setActiveShopName(e.detail.shopName || 'Shop');
        setIsOpen(true);
      }
    };

    window.addEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    };
  }, []);

  // Fetch unread count for floating badge
  useEffect(() => {
    if (!buyerId) return;
    fetchConversations({ buyerId })
      .then((list) => {
        const total = list.reduce((sum, c) => sum + (c.unreadBuyerCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});
  }, [buyerId, isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-slate-800">
      {/* Floating Shopee Style Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-13 px-5 rounded-full bg-gradient-to-r from-[#ee4d2d] to-rose-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer transition duration-200 border-none relative group"
        >
          <span className="text-lg">💬</span>
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="bg-white text-[#ee4d2d] text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Shopee Chat Split Window */}
      <ShopeeChatWindow
        user={user}
        mode="BUYER"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialShopId={activeShopId}
        initialShopName={activeShopName}
      />
    </div>
  );
};
