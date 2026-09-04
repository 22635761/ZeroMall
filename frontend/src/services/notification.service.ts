import { apiRequest } from './api.service';
import { API_BASE_URL } from '../config/api.config';
import { io, Socket } from 'socket.io-client';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'CHAT';
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export async function fetchNotifications(
  userId: string,
  type = 'ALL',
  page = 1,
  limit = 20,
) {
  return apiRequest<{
    items: NotificationItem[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/notifications?userId=${userId}&type=${type}&page=${page}&limit=${limit}`);
}

export async function fetchUnreadNotificationCount(userId: string) {
  return apiRequest<{ unreadCount: number }>(`/notifications/unread-count?userId=${userId}`);
}

export async function markNotificationAsRead(id: string, userId: string) {
  return apiRequest<{ success: boolean; unreadCount: number }>(
    `/notifications/${id}/read?userId=${userId}`,
    { method: 'PATCH' },
  );
}

export async function markAllNotificationsAsRead(userId: string) {
  return apiRequest<{ success: boolean; unreadCount: number }>(
    `/notifications/read-all?userId=${userId}`,
    { method: 'PATCH' },
  );
}

let socket: Socket | null = null;

export function connectNotificationSocket(
  userId: string,
  onNewNotification: (notification: NotificationItem, unreadCount: number) => void,
  onUnreadUpdate: (unreadCount: number) => void,
) {
  if (!userId) return null;

  if (!socket) {
    socket = io(`${API_BASE_URL}/notifications`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }

  socket.emit('join_user', { userId });

  socket.on('new_notification', (data: { notification: NotificationItem; unreadCount: number }) => {
    onNewNotification(data.notification, data.unreadCount);
  });

  socket.on('unread_count_updated', (data: { unreadCount: number }) => {
    onUnreadUpdate(data.unreadCount);
  });

  return socket;
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
