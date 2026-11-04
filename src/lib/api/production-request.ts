// Track B. Hợp đồng: Ikiot_BE/docs/api-contract-order-flow.md §3.
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

  /** Chỉ cho DRAFT; `items` nếu gửi lên sẽ thay toàn bộ dòng. */
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

  /** "Thêm vào yêu cầu" từ danh sách sản xuất; chỉ cho yêu cầu DRAFT. */
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

  /** B-5: ghi nhận hàng xưởng đã giao; đây là đường duy nhất để hàng xưởng nhập kho. */
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

  /** B-4: số lượng cần sản xuất, tính khi đọc. */
  getProductionList: async (params?: ProductionListQuery): Promise<ProductionListPage> => {
    const res = await client.get<ProductionListPage>('/production-list', { params });
    return {
      data: res.data.data,
      pagination: res.data.pagination,
      summary: res.data.summary,
    };
  },
};
