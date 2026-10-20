// [API – Production request] Track B. Contract: Ikiot_BE/docs/api-contract-order-flow.md §3.
import client from '@/lib/api/client';
import type {
  CreateProductionRequestPayload,
  Paginated,
  ProductionListPage,
  ProductionListQuery,
  ProductionRequest,
  ProductionRequestLinePayload,
  ProductionRequestQuery,
  ReceiveProductionPayload,
  UpdateProductionRequestStatusPayload,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

export const productionRequestApi = {
  getList: async (params?: ProductionRequestQuery): Promise<Paginated<ProductionRequest>> => {
    const res = await client.get<Paginated<ProductionRequest>>('/production-requests', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: string): Promise<ProductionRequest> => {
    const res = await client.get<Envelope<ProductionRequest>>(`/production-requests/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateProductionRequestPayload): Promise<ProductionRequest> => {
    const res = await client.post<Envelope<ProductionRequest>>('/production-requests', payload);
    return res.data.data;
  },

  /** DRAFT only; `items`, when sent, replaces every line. */
  update: async (
    id: string,
    payload: Partial<CreateProductionRequestPayload>,
  ): Promise<ProductionRequest> => {
    const res = await client.patch<Envelope<ProductionRequest>>(
      `/production-requests/${id}`,
      payload,
    );
    return res.data.data;
  },

  updateStatus: async (
    id: string,
    payload: UpdateProductionRequestStatusPayload,
  ): Promise<ProductionRequest> => {
    const res = await client.patch<Envelope<ProductionRequest>>(
      `/production-requests/${id}/status`,
      payload,
    );
    return res.data.data;
  },

  /** "Thêm vào yêu cầu" from the production list - DRAFT requests only. */
  addItem: async (
    id: string,
    payload: ProductionRequestLinePayload,
  ): Promise<ProductionRequest> => {
    const res = await client.post<Envelope<ProductionRequest>>(
      `/production-requests/${id}/items`,
      payload,
    );
    return res.data.data;
  },

  remove: async (id: string): Promise<void> => {
    await client.delete(`/production-requests/${id}`);
  },

  /** B-5: record goods the workshop delivered. The only way workshop goods enter stock. */
  receive: async (
    id: string,
    payload: ReceiveProductionPayload,
  ): Promise<ProductionRequest & { stockMovementId: string }> => {
    const res = await client.post<Envelope<ProductionRequest & { stockMovementId: string }>>(
      `/production-requests/${id}/receive`,
      payload,
    );
    return res.data.data;
  },

  /** B-4: what has to be made, worked out when read. */
  getProductionList: async (params?: ProductionListQuery): Promise<ProductionListPage> => {
    const res = await client.get<ProductionListPage>('/production-list', { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
      summary: res.data.summary,
    };
  },
};
