export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  status: WarehouseStatus;
  /** Who runs this location. Appointed through `PATCH /:id/manager`, not by holding a
   *  particular role - the rewrite moved that from `User.role` onto the location itself. */
  managerId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WarehouseQueryParams {
  search?: string;
  status?: WarehouseStatus;
  page?: number;
  limit?: number;
}

export interface WarehouseListResponse {
  success: boolean;
  message: string;
  data: Warehouse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WarehouseCreatePayload {
  name: string;
  /**
   * **Required** - `CreateWarehouseDto` declares `@IsArray() @ArrayNotEmpty()`, the same
   * rule a branch has carried since warehouses gained contact details. This type omitted
   * it, so `POST /warehouses` was a 400 the UI had no field to satisfy.
   */
  phoneNumber: string[];
  address?: string;
  email?: string;
}

export interface WarehouseUpdatePayload {
  name?: string;
  phoneNumber?: string[];
  address?: string;
  email?: string;
  status?: WarehouseStatus;
}
