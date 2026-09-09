// [API – Warehouse]
import client from "@/lib/api/client";
import type {
  Warehouse,
  WarehouseQueryParams,
  WarehouseListResponse,
  WarehouseCreatePayload,
  WarehouseUpdatePayload,
} from "@/types/warehouse";

export const warehouseApi = {
  getList: async (params?: WarehouseQueryParams): Promise<WarehouseListResponse> => {
    const res = await client.get<WarehouseListResponse>("/warehouses", { params });
    return res.data;
  },
  getById: async (id: string): Promise<Warehouse> => {
    const res = await client.get<{ data: Warehouse }>(`/warehouses/${id}`);
    return res.data.data;
  },
  create: async (payload: WarehouseCreatePayload): Promise<Warehouse> => {
    const res = await client.post<{ data: Warehouse }>("/warehouses", payload);
    return res.data.data;
  },
  update: async (id: string, payload: WarehouseUpdatePayload): Promise<Warehouse> => {
    const res = await client.patch<{ data: Warehouse }>(`/warehouses/${id}`, payload);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => {
    await client.delete(`/warehouses/${id}`);
  },

  /** PATCH /warehouses/:id/manager - chỉ định người phụ trách kho (không đổi vai trò). */
  assignManager: async (
    warehouseId: string,
    staffId: string,
  ): Promise<void> => {
    await client.patch(`/warehouses/${warehouseId}/manager`, { staffId });
  },
};
