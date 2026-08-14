import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  connectNotificationSocket,
} from '../../services/notification.service';
import type { NotificationItem } from '../../services/notification.service';

interface NotificationPopoverProps {
  user: any;
  /** Pass true when rendered inside Seller Portal so ORDER clicks navigate there */
  isSeller?: boolean;
  /** Optional callback so parent can switch menus (used by SellerPortal) */
  onNavigateToMenu?: (menu: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  user,
  isSeller = false,
  onNavigateToMenu,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ORDER' | 'PROMOTION' | 'SYSTEM'>('ALL');
  const [loading, setLoading] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // useNavigate is safe here because this component is always rendered
  // inside a Router context (both buyer Header and SellerPortal use BrowserRouter).
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    // not inside a Router – gracefully degrade
  }

  const userId = user?.id || user?._id || user?.userId;

  useEffect(() => {
    if (!userId) return;

    fetchUnreadNotificationCount(userId)
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});

    const socket = connectNotificationSocket(
      userId,
      (newNotif, updatedUnreadCount) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount(updatedUnreadCount);
      },
      (updatedUnreadCount) => {
        setUnreadCount(updatedUnreadCount);
      },
    );

    return () => {
      socket?.off('new_notification');
      socket?.off('unread_count_updated');
    };
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetchNotifications(userId, activeTab, 1, 15);
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadNotifications();
  }, [isOpen, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead || !userId) return;
    try {
      const res = await markNotificationAsRead(id, userId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount(res.unreadCount);
    } catch (e) {
      console.error('Error marking read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all read:', e);
    }
  };

  /** Deep-link handler: called AFTER marking as read */
  const handleNotificationClick = async (item: NotificationItem) => {
    // 1. Mark as read first
    await handleMarkAsRead(item.id, item.isRead);

    // 2. Close popover
    setIsOpen(false);

    const meta = (item as any).metadata as Record<string, any> | null;
    const action = meta?.action as string | undefined;

    // 3. Navigate based on notification type / action
    if (item.type === 'ORDER' || action === 'VIEW_ORDER') {
      if (isSeller) {
        // Seller side → switch to Orders menu
        if (onNavigateToMenu) {
          onNavigateToMenu('orders');
        } else {
          window.location.href = '/seller?menu=orders';
        }
      } else {
        // Buyer side → go to My Purchases
        if (navigate) {
          navigate('/user/purchase');
        } else {
          window.location.href = '/user/purchase';
        }
      }
      return;
    }

    if (action === 'OPEN_CHAT') {
      const shopId = meta?.shopId;
      const shopName = meta?.shopName || '';
      if (shopId) {
        window.dispatchEvent(
          new CustomEvent('open_chat_with_shop', {
            detail: { shopId, shopName },
          }),
        );
      }
      return;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return '📦';
      case 'PROMOTION': return '🏷️';
      case 'SYSTEM': return '⚙️';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 hover:text-emerald-600 transition bg-transparent border-none p-0 cursor-pointer text-xs text-slate-600 font-medium relative"
      >
        <span className="text-base">🔔</span>
        <span>Thông Báo</span>
        {unreadCount > 0 && (
          <span className="ml-0.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-2xl z-55 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-slate-700">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span>Thông Báo Mới Nhất</span>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold text-emerald-600">
                  ({unreadCount} chưa đọc)
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline cursor-pointer bg-transparent border-none p-0"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-white text-xs">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'ORDER', label: 'Đơn hàng' },
              { key: 'PROMOTION', label: 'Khuyến mãi' },
              { key: 'SYSTEM', label: 'Hệ thống' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 text-center font-medium transition border-b-2 cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-emerald-500 text-emerald-600 font-bold bg-emerald-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <span className="text-2xl block mb-1">📭</span>
                Chưa có thông báo nào trong mục này.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 transition cursor-pointer flex gap-3 ${
                    item.isRead
                      ? 'bg-white hover:bg-slate-50'
                      : 'bg-emerald-50/30 hover:bg-emerald-50/60 font-semibold'
                  }`}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          !item.isRead ? 'font-bold text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {item.content}
                    </p>
                  </div>
                  {!item.isRead && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 self-center"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
