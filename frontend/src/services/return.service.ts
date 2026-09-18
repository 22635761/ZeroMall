import { apiRequest } from './api.service';

export interface ReturnItemDto {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variant?: string;
  price: number;
  quantity: number;
  refundAmount: number;
}

export interface ReturnEvidenceDto {
  fileUrl: string;
  fileType?: 'IMAGE' | 'VIDEO';
  description?: string;
}

export interface CreateReturnPayload {
  orderId: string;
  shipmentId?: string;
  sellerId: string;
  buyerId: string;
  resolution: 'REFUND_ONLY' | 'RETURN_REFUND';
  reason: string;
  reasonDetail?: string;
  refundAmount: number;
  items?: ReturnItemDto[];
  evidences?: ReturnEvidenceDto[];
  returnMethod?: 'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE';
}

export interface ReturnData {
  id: string;
  returnNumber: string;
  orderId: string;
  shipmentId: string;
  sellerId: string;
  buyerId: string;
  resolution: 'REFUND_ONLY' | 'RETURN_REFUND';
  reason: string;
  reasonDetail?: string;
  refundAmount: number;
  returnShippingFee: number;
  sellerShippingCharge: number;
  status: string;
  returnTrackingNumber?: string;
  returnMethod?: string;
  sellerDeadline?: string;
  buyerShipDeadline?: string;
  sellerInspectDeadline?: string;
  csAgentId?: string;
  csNote?: string;
  sellerNote?: string;
  sellerEvidenceUrl?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  items: Array<{
    id: string;
    orderItemId: string;
    productId: string;
    productName: string;
    productImage?: string;
    variant?: string;
    price: number;
    quantity: number;
    refundAmount: number;
  }>;
  evidences: Array<{
    id: string;
    uploadedBy: string;
    fileUrl: string;
    fileType: string;
    description?: string;
    createdAt: string;
  }>;
  negotiations: Array<{
    id: string;
    proposedBy: string;
    proposedAmount: number;
    message?: string;
    status: string;
    createdAt: string;
  }>;
  shipment?: any;
}

export const returnService = {
  async createReturn(payload: CreateReturnPayload): Promise<ReturnData> {
    return apiRequest<ReturnData>('/delivery/returns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getReturns(query?: {
    sellerId?: string;
    buyerId?: string;
    orderId?: string;
    status?: string;
    search?: string;
  }): Promise<ReturnData[]> {
    const params = new URLSearchParams();
    if (query?.sellerId) params.append('sellerId', query.sellerId);
    if (query?.buyerId) params.append('buyerId', query.buyerId);
    if (query?.orderId) params.append('orderId', query.orderId);
    if (query?.status) params.append('status', query.status);
    if (query?.search) params.append('search', query.search);

    const queryString = params.toString();
    return apiRequest<ReturnData[]>(`/delivery/returns${queryString ? `?${queryString}` : ''}`);
  },

  async getReturnById(id: string): Promise<ReturnData> {
    return apiRequest<ReturnData>(`/delivery/returns/${id}`);
  },

  async sellerRespond(
    id: string,
    payload: {
      action: 'APPROVE' | 'REJECT' | 'NEGOTIATE';
      note?: string;
      proposedAmount?: number;
      evidenceUrl?: string;
    }
  ): Promise<{ success: boolean; status: string; message: string; buyerShipDeadline?: string }> {
    return apiRequest(`/delivery/returns/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async buyerRespondNegotiation(
    id: string,
    payload: { accept: boolean; note?: string }
  ): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/delivery/returns/${id}/negotiate-respond`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async buyerShipReturn(
    id: string,
    payload: {
      returnMethod: 'ZMX_PICKUP' | 'ZMX_DROPOFF' | 'SELF_ARRANGE';
      externalTrackingNumber?: string;
      proofImage?: string;
    }
  ): Promise<{ success: boolean; returnTrackingNumber: string; status: string; message: string }> {
    return apiRequest(`/delivery/returns/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async markDeliveredToSeller(id: string): Promise<ReturnData> {
    return apiRequest<ReturnData>(`/delivery/returns/${id}/mark-delivered`, {
      method: 'PATCH',
    });
  },

  async sellerConfirmReceive(
    id: string,
    payload: {
      conditionOk: boolean;
      note?: string;
      restockAction?: 'RESTOCK' | 'SCRAP';
      evidenceUrl?: string;
    }
  ): Promise<{ success: boolean; status: string; message: string }> {
    return apiRequest(`/delivery/returns/${id}/confirm-receive`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async csArbitrate(
    id: string,
    payload: {
      decision: 'REFUND_BUYER' | 'REJECT_RETURN';
      note: string;
      csAgentId?: string;
    }
  ): Promise<{ success: boolean; status: string; message: string }> {
    return apiRequest(`/delivery/returns/${id}/arbitrate`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async cancelReturn(id: string, reason?: string): Promise<{ success: boolean; status: string; message: string }> {
    return apiRequest(`/delivery/returns/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },
};
