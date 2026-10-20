// [API – Phiếu giao xưởng] Nhân viên xưởng + nơi nhận (2026-10-09). Contract: Ikiot_BE/docs/api-contract-order-flow.md §3.
import client from '@/lib/api/client';
import type {
  CreateProductionDeliveryPayload,
  Paginated,
  ProductionDelivery,
  ProductionDeliveryQuery,
  ProductionRequest,
  ReceiveProductionPayload,
  WorkshopProductionRequestQuery,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

/** Màn của nhân viên xưởng: YCSX gửi cho xưởng mình (mọi kho), tạo / rút phiếu giao. Cần `production:deliver` và tài khoản đã gắn xưởng. */
export const workshopApi = {
  getRequests: async (
    params?: WorkshopProductionRequestQuery,
  ): Promise<Paginated<ProductionRequest>> => {
    const res = await client.get<Paginated<ProductionRequest>>('/workshop/production-requests', {
      params,
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getRequest: async (id: string): Promise<ProductionRequest> => {
    const res = await client.get<Envelope<ProductionRequest>>(`/workshop/production-requests/${id}`);
    return res.data.data;
  },

  /** Giao thiếu được. Chưa tăng tồn: nơi nhận đếm và xác nhận mới tăng. */
  createDelivery: async (
    requestId: string,
    payload: CreateProductionDeliveryPayload,
  ): Promise<ProductionRequest> => {
    const res = await client.post<Envelope<ProductionRequest>>(
      `/workshop/production-requests/${requestId}/deliveries`,
      payload,
    );
    return res.data.data;
  },

  cancelDelivery: async (id: string, reason: string): Promise<ProductionDelivery> => {
    const res = await client.post<Envelope<ProductionDelivery>>(`/workshop/deliveries/${id}/cancel`, {
      reason,
    });
    return res.data.data;
  },
};

/** Phía nơi nhận: phiếu xưởng giao chờ nhận, xác nhận (tăng tồn, `production:receive`) hoặc từ chối. */
export const productionDeliveryApi = {
  getList: async (params?: ProductionDeliveryQuery): Promise<Paginated<ProductionDelivery>> => {
    const res = await client.get<Paginated<ProductionDelivery>>('/production-deliveries', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: string): Promise<ProductionDelivery> => {
    const res = await client.get<Envelope<ProductionDelivery>>(`/production-deliveries/${id}`);
    return res.data.data;
  },

  /** Dòng phải có trên phiếu, số đếm ≤ số xưởng ghi; dòng không gửi = nhận 0. */
  receive: async (
    id: string,
    payload: ReceiveProductionPayload,
  ): Promise<ProductionRequest & { stockMovementId: string }> => {
    const res = await client.post<Envelope<ProductionRequest & { stockMovementId: string }>>(
      `/production-deliveries/${id}/receive`,
      payload,
    );
    return res.data.data;
  },

  cancel: async (id: string, reason: string): Promise<ProductionDelivery> => {
    const res = await client.post<Envelope<ProductionDelivery>>(`/production-deliveries/${id}/cancel`, {
      reason,
    });
    return res.data.data;
  },
};
