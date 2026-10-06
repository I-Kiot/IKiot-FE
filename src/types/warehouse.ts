export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  status: WarehouseStatus;
  phoneNumber?: string[];
  email?: string | null;
  /** D-4: `false` marks a damaged-goods warehouse - it takes defective / damaged returns and is never sold from. */
  isSellable?: boolean;
  /** D-4: where this warehouse's own damaged goods go (another non-sellable warehouse). */
  damagedLocationId?: string | null;
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
  /** D-4: `false` makes this a damaged-goods warehouse. Defaults to true server-side. */
  isSellable?: boolean;
  damagedLocationId?: string | null;
}

export interface WarehouseUpdatePayload {
  name?: string;
  phoneNumber?: string[];
  address?: string;
  email?: string;
  status?: WarehouseStatus;
  isSellable?: boolean;
  damagedLocationId?: string | null;
}
