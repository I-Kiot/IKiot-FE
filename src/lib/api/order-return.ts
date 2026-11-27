// Track D. Hợp đồng: Ikiot_BE/docs/api-contract-order-flow.md §5.
import client from '@/lib/api/client';
import type {
  CreateOrderReturnPayload,
  RefundInput,
  InspectOrderReturnPayload,
  OrderReturn,
  OrderReturnQuery,
  Paginated,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

export const orderReturnApi = {
  getList: async (params?: OrderReturnQuery): Promise<Paginated<OrderReturn>> => {
    const res = await client.get<Paginated<OrderReturn>>('/order-returns', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: string): Promise<OrderReturn> => {
    const res = await client.get<Envelope<OrderReturn>>(`/order-returns/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateOrderReturnPayload): Promise<OrderReturn> => {
    const res = await client.post<Envelope<OrderReturn>>('/order-returns', payload);
    return res.data.data;
  },

  /** Giao thất bại, hàng đã về shop: shipment và đơn thành RETURNED, tồn kho được hoàn lại. */
  confirmFailedDelivery: async (
    shipmentId: string,
    note?: string,
    refund?: RefundInput,
  ): Promise<OrderReturn> => {
    const res = await client.post<Envelope<OrderReturn>>('/order-returns/confirm-failed-delivery', {
      shipmentId,
      note,
      ...(refund ? { refund } : {}),
    });
    return res.data.data;
  },

  /** REQUESTED → INSPECTING: hàng đã về shop. */
  receive: async (id: string): Promise<OrderReturn> => {
    const res = await client.post<Envelope<OrderReturn>>(`/order-returns/${id}/receive`, {});
    return res.data.data;
  },

  inspect: async (id: string, payload: InspectOrderReturnPayload): Promise<OrderReturn> => {
    const res = await client.post<Envelope<OrderReturn>>(`/order-returns/${id}/inspect`, payload);
    return res.data.data;
  },

  cancel: async (id: string): Promise<OrderReturn> => {
    const res = await client.post<Envelope<OrderReturn>>(`/order-returns/${id}/cancel`, {});
    return res.data.data;
  },

  /** D-10, D-11: gắn đơn mới của khách mua lại hàng hỏng (GĐ2 – 3B). */
  setReplacementOrder: async (id: string, orderId: string): Promise<OrderReturn> => {
    const res = await client.patch<Envelope<OrderReturn>>(`/order-returns/${id}/replacement-order`, {
      orderId,
    });
    return res.data.data;
  },
};
