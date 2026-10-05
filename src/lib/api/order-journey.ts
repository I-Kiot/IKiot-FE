// [API – Order journey] Track A routes (BE `orders/`), used by track D's screens.
// Contract: Ikiot_BE/docs/api-contract-order-flow.md §2. The till keeps using `orderApi`
// (`order.ts`) until A-2 moves it over.
import client from '@/lib/api/client';
import type {
  ConfirmOrderPayload,
  CreateOrderJourneyPayload,
  OrderDetail,
  OrderItemCustomization,
  OrderJourneyQuery,
  OrderListItem,
  PackableOrder,
  PackResult,
  Paginated,
  UpdateDraftOrderPayload,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

/** Số đơn mỗi trang mặc định của màn Đóng hàng (người dùng đổi được ở ô "Hiển thị"). */
export const PACK_PAGE_SIZE = 10;

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

  /** Một trang đơn CONFIRMED (chờ đóng gói) trong phạm vi chi nhánh của người gọi. */
  listPackable: async (page: number, limit = PACK_PAGE_SIZE): Promise<Paginated<PackableOrder>> => {
    const res = await client.get<Paginated<PackableOrder>>('/orders', {
      params: { status: 'CONFIRMED', page, limit },
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** CONFIRMED → PACKED (C-1): khoá hàng trên kệ và tự sinh kiện. */
  pack: async (id: string, note?: string): Promise<PackResult> => {
    const res = await client.post<Envelope<PackResult>>(
      `/orders/${id}/pack`,
      note ? { note } : {},
    );
    return res.data.data;
  },
};
