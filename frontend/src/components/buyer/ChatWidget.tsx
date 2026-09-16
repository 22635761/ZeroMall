import React, { useState, useEffect } from 'react';
import { ShopeeChatWindow } from '../common/ShopeeChatWindow';
import { fetchConversations } from '../../services/chat.service';

interface ChatWidgetProps {
  user?: any;
  onOpenLogin?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ user, onOpenLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetShopId, setTargetShopId] = useState<string | null>(null);
  const [targetShopName, setTargetShopName] = useState<string | null>(null);
  const [targetProduct, setTargetProduct] = useState<any | null>(null);
  const [targetOrder, setTargetOrder] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const buyerId = user?.id || user?._id || user?.userId;

  // Listen to global open chat event from product detail / shop / order pages
  useEffect(() => {
    const handleOpenChat = (e: any) => {
      if (!user || !buyerId) {
        if (onOpenLogin) {
          onOpenLogin();
        } else {
          alert('Vui lòng đăng nhập để bắt đầu trò chuyện với Người bán hoặc CSKH sàn.');
        }
        return;
      }

      if (e.detail?.shopId) {
        setTargetShopId(e.detail.shopId);
        setTargetShopName(e.detail.shopName || null);
        setTargetProduct(e.detail.product || null);
        setTargetOrder(e.detail.order || null);
        setIsOpen(true);
      } else {
        setTargetShopId(null);
        setTargetShopName(null);
        setTargetProduct(null);
        setTargetOrder(null);
        setIsOpen(true);
      }
    };

    window.addEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    return () => {
      window.removeEventListener('open_chat_with_shop', handleOpenChat as EventListener);
    };
  }, [user, buyerId, onOpenLogin]);

  // Fetch unread count for floating badge
  useEffect(() => {
    if (!buyerId) {
      setUnreadCount(0);
      return;
    }
    fetchConversations({ buyerId })
      .then((list) => {
        const total = list.reduce((sum, c) => sum + (c.unreadBuyerCount || 0), 0);
        setUnreadCount(total);
      })
      .catch(() => {});
  }, [buyerId, isOpen]);

  const handleFloatingClick = () => {
    if (!user || !buyerId) {
      if (onOpenLogin) {
        onOpenLogin();
      } else {
        alert('Vui lòng đăng nhập để bắt đầu trò chuyện với Người bán hoặc CSKH sàn.');
      }
      return;
    }
    setTargetShopId(null);
    setTargetShopName(null);
    setTargetProduct(null);
    setTargetOrder(null);
    setIsOpen(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-slate-800">
      {/* Floating ZeroMall Branded Chat Button */}
      {!isOpen && (
        <button
          onClick={handleFloatingClick}
          className="h-13 px-5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm flex items-center gap-2.5 shadow-2xl hover:scale-105 active:scale-95 cursor-pointer transition duration-200 border-none relative group"
        >
          <span className="text-xl">💬</span>
          <span>Chat</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Shopee Style Chat Split Window for ZeroMall */}
      <ShopeeChatWindow
        user={user}
        mode="BUYER"
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setTargetShopId(null);
          setTargetShopName(null);
          setTargetProduct(null);
          setTargetOrder(null);
        }}
        onOpenLogin={onOpenLogin}
        initialShopId={targetShopId}
        initialShopName={targetShopName}
        initialProduct={targetProduct}
        initialOrder={targetOrder}
      />
    </div>
  );
};
