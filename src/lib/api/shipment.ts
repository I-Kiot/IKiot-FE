// [API – Shipment] Track C. Contract: Ikiot_BE/docs/api-contract-order-flow.md §4.
import client from '@/lib/api/client';
import type {
  CreateShipmentPayload,
  DeliverShipmentPayload,
  DriverOption,
  Paginated,
  Shipment,
  ShipmentEventPayload,
  ShipmentQuery,
  ShipmentSummary,
} from '@/types/order-flow';

type Envelope<T> = { success: boolean; data: T };

/** Số lần giao mỗi trang mặc định của màn Giao hàng. */
export const SHIPMENT_PAGE_SIZE = 10;

export const shipmentApi = {
  /** Các lần giao người gọi được xem (BE lọc theo chủ shop / người phụ trách / shipper / quyền tại kho, chi nhánh). */
  getList: async (params?: ShipmentQuery): Promise<Paginated<ShipmentSummary>> => {
    const res = await client.get<Paginated<ShipmentSummary>>('/shipments', { params });
    return { data: res.data.data, pagination: res.data.pagination };
  },

  /** The shipper's own open deliveries (`/shipper`, C-7). */
  getMine: async (): Promise<Shipment[]> => {
    const res = await client.get<Envelope<Shipment[]>>('/shipments/mine');
    return res.data.data;
  },

  getById: async (id: string): Promise<Shipment> => {
    const res = await client.get<Envelope<Shipment>>(`/shipments/${id}`);
    return res.data.data;
  },

  /** Người chọn được làm shipper cho đơn: chủ shop, người phụ trách, nhân viên có quyền giao hàng. */
  getDrivers: async (orderId: string): Promise<DriverOption[]> => {
    const res = await client.get<Envelope<DriverOption[]>>('/shipments/drivers', {
      params: { orderId },
    });
    return res.data.data;
  },

  /** "ĐVVC đã lấy hàng": đơn PACKED → PICKED_UP. */
  create: async (payload: CreateShipmentPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>('/shipments', payload);
    return res.data.data;
  },

  changeDriver: async (id: string, driverId: string): Promise<Shipment> => {
    const res = await client.patch<Envelope<Shipment>>(`/shipments/${id}/driver`, { driverId });
    return res.data.data;
  },

  /** Nhật trình "Đang đi giao". */
  addEvent: async (id: string, payload: ShipmentEventPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/events`, payload);
    return res.data.data;
  },

  /** INTERNAL: needs at least one proof photo URL (upload via `/uploads` first). C-5 / C-7. */
  deliver: async (id: string, payload: DeliverShipmentPayload): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/deliver`, payload);
    return res.data.data;
  },

  /** Giao không thành: shipment FAILED, đơn giữ Đang vận chuyển. */
  fail: async (id: string, note: string): Promise<Shipment> => {
    const res = await client.post<Envelope<Shipment>>(`/shipments/${id}/fail`, { note });
    return res.data.data;
  },
};
