import { apiRequest } from './api.service';

export const paymentService = {
  async chargePayment(chargeData: {
    orderId: string;
    buyerId: string;
    amount: number;
    paymentMethod: string;
  }) {
    return apiRequest('/payments/charge', {
      method: 'POST',
      body: JSON.stringify(chargeData),
    });
  },

  async fetchWalletBalance(buyerId: string): Promise<{ balance: number }> {
    return apiRequest<{ balance: number }>(`/payments/wallet/${buyerId}`);
  },

  async fetchSepayConfig(): Promise<{ bankId: string; bankAcc: string; bankName: string }> {
    return apiRequest<{ bankId: string; bankAcc: string; bankName: string }>('/payments/sepay-config');
  },

  async fetchSepayStatus(orderId: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(`/payments/status/${orderId}`);
  },

  async refundPayment(orderId: string, buyerId: string, amount: number) {
    return apiRequest('/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ orderId, buyerId, amount }),
    });
  },
};
