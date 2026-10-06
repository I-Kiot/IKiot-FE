// [API – Order journey] Track A routes (BE `orders/`), used by track D's screens.
// Contract: Ikiot_BE/docs/api-contract-order-flow.md §2. The till keeps using `orderApi`
// (`order.ts`), which posts to `/orders/pos` since A-2.
import client from '@/lib/api/client';
import type {
  ConfirmOrderPayload,
  CreateOrderJourneyPayload,
  HandOverReadyOrder,
  OrderDetail,
  OrderItemCustomization,
  OrderJourneyQuery,
  OrderListItem,
  PackableOrder,
  PackResult,
  Paginated,
  Shipment,
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

  /** A manual order is born CONFIRMED (contract §2, A-2); there is no draft. */
  create: async (payload: CreateOrderJourneyPayload): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>('/orders', payload);
    return res.data.data;
  },

  /** Before the order ships (A-8). */
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

  /** Một trang đơn PACKED (đã đóng gói, chờ giao cho vận chuyển) trong phạm vi chi nhánh của người gọi. */
  listHandOverReady: async (page: number, limit: number): Promise<Paginated<HandOverReadyOrder>> => {
    const res = await client.get<Paginated<HandOverReadyOrder>>('/orders', {
      params: { status: 'PACKED', page, limit },
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** PICKED_UP → SHIPPING (C-2): trừ tồn kho đúng phần đã khoá lúc đóng gói. Trả về lần giao của đơn. */
  ship: async (id: string, note?: string): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(
      `/orders/${id}/ship`,
      note ? { note } : {},
    );
    return res.data.data;
  },
};
