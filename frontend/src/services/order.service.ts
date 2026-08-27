import { apiRequest } from './api.service';
import type { Order } from '../models/order.model';

export const orderService = {
  async createOrder(orderData: any): Promise<Order> {
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async fetchBuyerOrders(buyerId: string): Promise<Order[]> {
    return apiRequest<Order[]>(`/orders/buyer/${buyerId}`);
  },

  async fetchOrderById(orderId: string): Promise<Order> {
    return apiRequest<Order>(`/orders/${orderId}`);
  },

  async fetchSellerOrders(shopId: string, token: string): Promise<Order[]> {
    return apiRequest<Order[]>(`/orders/seller/${shopId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  async updateOrderStatus(
    orderId: string,
    status: string,
    ghnOrderCode?: string,
    token?: string,
    refundReason?: string,
    refundDescription?: string,
    refundEmail?: string
  ): Promise<Order> {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return apiRequest<Order>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status,
        ghnOrderCode,
        refundReason,
        refundDescription,
        refundEmail
      }),
    });
  },
};
