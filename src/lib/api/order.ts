// [API – Order]
import client from '@/lib/api/client';
import type { Order, OrderCreatePayload, OrderCreateResponse, OrderStatus, OrderPaymentMethod } from '@/types/order';
import { useAuthStore } from '@/store/auth-store';
import { branchIdOf } from '@/lib/location-key';

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentMethod?: OrderPaymentMethod;
  customerId?: string;
  branchId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PayOfflinePayload {
  paymentMethod?: Exclude<OrderPaymentMethod, 'SEPAY'>;
  customerPay?: number;
  note?: string;
}

export const orderApi = {
  create: async (payload: OrderCreatePayload): Promise<OrderCreateResponse> => {
    const res = await client.post<OrderCreateResponse>('/orders', payload);
    return res.data;
  },
  /** Khách bỏ QR SePay và trả tại quầy - chốt đơn theo phương thức offline. */
  payOffline: async (id: string, payload: PayOfflinePayload = {}): Promise<Order> => {
    const res = await client.post<{ success: boolean; data: Order }>(
      `/orders/${id}/pay-offline`,
      { paymentMethod: 'CASH', ...payload },
    );
    return res.data.data;
  },
  getById: async (id: string): Promise<Order> => {
    const res = await client.get<{ success: boolean; data: Order }>(`/orders/${id}`);
    return res.data.data;
  },
  getList: async (params?: OrderQueryParams): Promise<OrderListResponse> => {
    const branchId = branchIdOf(useAuthStore.getState().locationKey);

    const mergedParams = {
      ...(branchId ? { branchId } : {}),
      ...params,
    };

    const res = await client.get<OrderListResponse>('/orders', { params: mergedParams });
    return res.data;
  },
};
