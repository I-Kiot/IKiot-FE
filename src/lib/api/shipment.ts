// [API – Shipment] Track C. Contract: Ikiot_BE/docs/api-contract-order-flow.md §4.
import client from '@/lib/api/client';
import type {
  CreateShipmentPayload,
  DeliverShipmentPayload,
  Paginated,
  Shipment,
  ShipmentEventPayload,
  ShipmentQuery,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

export const shipmentApi = {
  getList: async (params?: ShipmentQuery): Promise<Paginated<Shipment>> => {
    const res = await client.get<Paginated<Shipment>>('/shipments', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** The shipper's own open deliveries (`/shipper`). */
  getMine: async (): Promise<Shipment[]> => {
    const res = await client.get<Envelope<Shipment[]>>('/shipments/mine');
    return res.data.data;
  },

  getById: async (id: string): Promise<Shipment> => {
    const res = await client.get<Envelope<Shipment>>(`/shipments/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateShipmentPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>('/shipments', payload);
    return res.data.data;
  },

  addEvent: async (id: string, payload: ShipmentEventPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/events`, payload);
    return res.data.data;
  },

  /** INTERNAL: needs at least one proof photo URL (upload via `/uploads` first). */
  deliver: async (id: string, payload: DeliverShipmentPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/deliver`, payload);
    return res.data.data;
  },

  fail: async (id: string, note: string): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/fail`, { note });
    return res.data.data;
  },
};
