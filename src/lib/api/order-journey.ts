// Route track A (BE `orders/`), dùng cho màn của track D. Hợp đồng: Ikiot_BE/docs/api-contract-order-flow.md §2.
// Quầy bán vẫn dùng `orderApi` (`order.ts`), đã POST tới `/orders/pos` từ A-2.
import client from '@/lib/api/client';
import type {
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
  UpdateOrderPayload,
} from '@/types/order-flow';

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

  /** Đơn tay được tạo ở trạng thái CONFIRMED (hợp đồng §2, A-2), không có bản nháp. */
  create: async (payload: CreateOrderJourneyPayload): Promise<OrderDetail> => {
    const res = await client.post<Envelope<OrderDetail>>('/orders', payload);
    return res.data.data;
  },

  /** A-8: sửa trước khi đơn giao. Chỉ sửa dòng khi CONFIRMED; đặt cọc lệch với tiền đã thu trả ORDER_DEPOSIT_CHANGED (xem `DepositChange`). */
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

  /** Một trang đơn PACKED giao tận nơi (đã đóng gói, chờ giao cho vận chuyển) trong phạm vi chi nhánh của người gọi. Đơn khách tới lấy không qua vận chuyển nên không có trong danh sách này. */
  listHandOverReady: async (page: number, limit: number): Promise<Paginated<HandOverReadyOrder>> => {
    const res = await client.get<Paginated<HandOverReadyOrder>>('/orders', {
      params: { status: 'PACKED', fulfillmentType: 'HOME_DELIVERY', page, limit },
    });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** Đơn khách tới lấy, đang chờ khách (PACKED): thu số còn lại tại quầy. Tiền mặt ghi luôn; QR trả `payment.qrUrl` chờ tiền về. */
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
