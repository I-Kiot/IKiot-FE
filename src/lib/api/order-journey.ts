// [API – Order journey] Track A routes (BE `orders/`), used by track D's screens.
// Contract: Ikiot_BE/docs/api-contract-order-flow.md §2. The till keeps using `orderApi`
// (`order.ts`), which posts to `/orders/pos` since A-2.
import client from '@/lib/api/client';
import type {
  ConfirmOrderPayload,
  CreateOrderJourneyPayload,
  OrderDetail,
  OrderItemCustomization,
  OrderJourneyQuery,
  OrderListItem,
  Paginated,
  UpdateDraftOrderPayload,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

export const orderJourneyApi = {
  getList: async (params?: OrderJourneyQuery): Promise<Paginated<OrderListItem>> => {
    const res = await client.get<Paginated<OrderListItem>>('/orders', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: string): Promise<OrderDetail> => {
    const res = await client.get<Envelope<OrderDetail>>(`/orders/${id}`);
    return res.data.data;
  },

  /** `asDraft: true` saves a quote; otherwise the order is created and confirmed at once. */
  create: async (payload: CreateOrderJourneyPayload): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>('/orders', payload);
    return res.data.data;
  },

  /** DRAFT only. */
  updateDraft: async (id: string, payload: UpdateDraftOrderPayload): Promise<OrderDetail> => {
    const res = await client.patch<Envelope<OrderDetail>>(`/orders/${id}`, payload);
    return res.data.data;
  },

  confirm: async (id: string, payload: ConfirmOrderPayload = {}): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/confirm`, payload);
    return res.data.data;
  },

  assign: async (id: string, assigneeId: string): Promise<OrderDetail> => {
    const res = await client.patch<Envelope<OrderDetail>>(`/orders/${id}/assignee`, {
      assigneeId,
    });
    return res.data.data;
  },

  /** Turns a line custom on first call (new SKU of the same product); edits the specs after. */
  setCustomization: async (
    id: string,
    itemId: string,
    payload: OrderItemCustomization,
  ): Promise<OrderDetail> => {
    const res = await client.put<Envelope<OrderDetail>>(
      `/orders/${id}/items/${itemId}/customization`,
      payload,
    );
    return res.data.data;
  },

  cancel: async (id: string, reason?: string): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/cancel`, { reason });
    return res.data.data;
  },
};
