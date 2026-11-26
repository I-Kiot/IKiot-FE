// Route hành trình đơn.
import client from '@/lib/api/client';
import type {
  AssigneeOption,
  CancelOrderPayload,
  CancelOrderResult,
  SourceLocation,
  ConfirmOrderPayload,
  CreateOrderJourneyPayload,
  HandOverReadyOrder,
  OrderAlerts,
  OrderDetail,
  OrderItemCustomization,
  OrderJourneyQuery,
  OrderListItem,
  PackableOrder,
  PackResult,
  Paginated,
  PickupCollectPayload,
  PickupCollectResult,
  PickupHandOverPayload,
  Shipment,
  ConfirmRemittancePayload,
  OrderPriority,
  RefundMethod,
  UpdateOrderPayload,
} from '@/types/order-flow';

import type { OrderEvent } from '@/types/order-event';

type Envelope<T> = { success: boolean; data: T };

/** Số đơn mỗi trang mặc định của màn Đóng hàng (người dùng đổi được ở ô "Hiển thị"). */
export const PACK_PAGE_SIZE = 10;

export const orderJourneyApi = {
  getList: async (params?: OrderJourneyQuery): Promise<Paginated<OrderListItem>> => {
    const res = await client.get<Paginated<OrderListItem>>('/orders', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** Số đếm cho cảnh báo ở sidebar và banner phía trên danh sách. */
  getAlerts: async (branchId?: string): Promise<OrderAlerts> => {
    const res = await client.get<Envelope<OrderAlerts>>('/orders/alerts', {
      params: { branchId },
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<OrderDetail> => {
    const res = await client.get<Envelope<OrderDetail>>(`/orders/${id}`);
    return res.data.data;
  },

  /** Nhật ký thao tác của đơn, cũ nhất trước (BE không phân trang). */
  getEvents: async (id: string): Promise<OrderEvent[]> => {
    const res = await client.get<Envelope<OrderEvent[]>>(`/orders/${id}/events`);
    return res.data.data;
  },

  /** Đơn tay được tạo ở trạng thái CONFIRMED (hợp đồng §2, A-2), không có bản nháp. */
  create: async (payload: CreateOrderJourneyPayload): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>('/orders', payload);
    return res.data.data;
  },

  /** Sửa đơn trước khi giao. */
  update: async (id: string, payload: UpdateOrderPayload): Promise<OrderDetail> => {
    const res = await client.patch<Envelope<OrderDetail>>(`/orders/${id}`, payload);
    return res.data.data;
  },

  /** A-8: đổi độ ưu tiên đơn mà không cần mở form sửa. */
  setPriority: async (id: string, priority: OrderPriority): Promise<OrderDetail> => {
    const res = await client.patch<Envelope<OrderDetail>>(`/orders/${id}/priority`, { priority });
    return res.data.data;
  },

  /** A-10: chủ shop đã nhận đủ tiền shipper thu - RECEIVED → COMPLETED. */
  confirmRemittance: async (id: string, payload: ConfirmRemittancePayload): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/confirm-remittance`, payload);
    return res.data.data;
  },

  /** Hoàn phần khách trả dư của đơn đã chốt (quyền `returns:inspect`). */
  refundExcess: async (
    id: string,
    payload: { amount: number; method: RefundMethod; note?: string },
  ): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/refund-excess`, payload);
    return res.data.data;
  },

  /** Quyết định tiền treo của đơn đã kết thúc. */
  settleHeld: async (
    id: string,
    payload:
      | { action: 'REFUND'; amount: number; method: RefundMethod; note?: string }
      | { action: 'KEEP'; note?: string },
  ): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/settle-held`, payload);
    return res.data.data;
  },

  confirm: async (id: string, payload: ConfirmOrderPayload = {}): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>(`/orders/${id}/confirm`, payload);
    return res.data.data;
  },

  /** Người có thể phụ trách đơn. */
  assignees: async (id: string): Promise<AssigneeOption[]> => {
    const res = await client.get<Envelope<AssigneeOption[]>>(`/orders/${id}/assignees`);
    return res.data.data;
  },

  /** Đổi người phụ trách: chủ shop, người đang phụ trách (giao lại), hoặc `orders:update`. */
  assign: async (id: string, assigneeId: string): Promise<OrderDetail> => {
    const res = await client.patch<Envelope<OrderDetail>>(`/orders/${id}/assignee`, {
      assigneeId,
    });
    return res.data.data;
  },

  /** Lần gọi đầu biến dòng thành custom (SKU mới của cùng sản phẩm); các lần sau sửa thông số. */
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

  /** Chi nhánh và kho mà đơn lấy hàng được (không có kho hàng hỏng). */
  sourceLocations: async (): Promise<SourceLocation[]> => {
    const res = await client.get<Envelope<SourceLocation[]>>('/orders/source-locations');
    return res.data.data;
  },

  /** Huỷ đơn trước khi hàng rời kho. Đơn đang giữ tiền thì bắt buộc `refundAmount` (0 = shop giữ lại). */
  cancel: async (id: string, payload: CancelOrderPayload): Promise<CancelOrderResult> => {
    const res = await client.post<Envelope<CancelOrderResult>>(`/orders/${id}/cancel`, payload);
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

  /** Đơn giao tận nơi đã đóng gói, chờ giao cho vận chuyển. */
  listHandOverReady: async (page: number, limit: number): Promise<Paginated<HandOverReadyOrder>> => {
    const res = await client.get<Paginated<HandOverReadyOrder>>('/orders', {
      params: { status: 'PACKED', fulfillmentType: 'HOME_DELIVERY', page, limit },
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** Thu số còn lại tại quầy cho đơn khách tới lấy. */
  pickupCollect: async (id: string, payload: PickupCollectPayload): Promise<PickupCollectResult> => {
    const res = await client.post<Envelope<PickupCollectResult>>(`/orders/${id}/pickup/collect`, payload);
    return res.data.data;
  },

  /** Đơn khách tới lấy đã thu đủ: giao hàng cho khách, trừ tồn, PACKED → COMPLETED. */
  pickupHandOver: async (id: string, payload: PickupHandOverPayload = {}): Promise<void> => {
    await client.post(`/orders/${id}/pickup/hand-over`, payload);
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
