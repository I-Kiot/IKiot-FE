// [API – Fulfillment] Track C. Contract: Ikiot_BE/docs/api-contract-order-flow.md §4.
import client from '@/lib/api/client';
import type {
  AddFulfillmentPackagePayload,
  Fulfillment,
  FulfillmentQuery,
  OrderListItem,
  Paginated,
  UpdateFulfillmentItemsPayload,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

export const fulfillmentApi = {
  getList: async (params?: FulfillmentQuery): Promise<Paginated<Fulfillment>> => {
    const res = await client.get<Paginated<Fulfillment>>('/fulfillments', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** READY_TO_PACK orders that have no fulfillment yet. */
  getReadyOrders: async (locationId?: string): Promise<OrderListItem[]> => {
    const res = await client.get<Envelope<OrderListItem[]>>('/fulfillments/ready-orders', {
      params: locationId ? { locationId } : undefined,
    });
    return res.data.data;
  },

  getById: async (id: string): Promise<Fulfillment> => {
    const res = await client.get<Envelope<Fulfillment>>(`/fulfillments/${id}`);
    return res.data.data;
  },

  create: async (payload: {
    orderId: string;
    assigneeId?: string;
    dueDate?: string;
  }): Promise<Fulfillment> => {
    const res = await client.post<Envelope<Fulfillment>>('/fulfillments', payload);
    return res.data.data;
  },

  updateItems: async (id: string, payload: UpdateFulfillmentItemsPayload): Promise<Fulfillment> => {
    const res = await client.patch<Envelope<Fulfillment>>(`/fulfillments/${id}/items`, payload);
    return res.data.data;
  },

  addPackage: async (id: string, payload: AddFulfillmentPackagePayload): Promise<Fulfillment> => {
    const res = await client.post<Envelope<Fulfillment>>(`/fulfillments/${id}/packages`, payload);
    return res.data.data;
  },

  /** The person in charge confirms the goods are intact - this is what deducts the stock. */
  verify: async (id: string): Promise<Fulfillment> => {
    const res = await client.post<Envelope<Fulfillment>>(`/fulfillments/${id}/verify`, {});
    return res.data.data;
  },

  handOver: async (id: string): Promise<Fulfillment> => {
    const res = await client.post<Envelope<Fulfillment>>(`/fulfillments/${id}/hand-over`, {});
    return res.data.data;
  },

  cancel: async (id: string, note?: string): Promise<Fulfillment> => {
    const res = await client.post<Envelope<Fulfillment>>(`/fulfillments/${id}/cancel`, { note });
    return res.data.data;
  },
};
