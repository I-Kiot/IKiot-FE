export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  status: WarehouseStatus;
  phoneNumber?: string[];
  email?: string | null;
  /** Người quản lý địa điểm, gán qua `PATCH /:id/manager` chứ không theo vai trò tài khoản. */
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
  /** Bắt buộc, không được rỗng (`CreateWarehouseDto`). Type cũ thiếu trường này nên `POST /warehouses` luôn 400. */
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
