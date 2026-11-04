export type BranchStatus = "ACTIVE" | "INACTIVE";

export interface Branch {
  id: string;
  name: string;
  phoneNumber: string[];
  address?: string;
  email?: string;
  status: BranchStatus;
  /** Kho xuất hàng mặc định của đơn chi nhánh này; để trống = chính chi nhánh. */
  defaultFulfillmentLocationId?: string | null;
  /** D-4: nơi hàng hỏng / lỗi của chi nhánh này chuyển đến (một kho không bán được). */
  damagedLocationId?: string | null;
  /** Người quản lý địa điểm, gán qua `PATCH /:id/manager` chứ không theo vai trò tài khoản. */
  managerId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BranchQueryParams {
  search?: string;
  status?: BranchStatus;
  page?: number;
  limit?: number;
}

export interface BranchListResponse {
  success: boolean;
  message: string;
  data: Branch[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BranchCreatePayload {
  name: string;
  phoneNumber: string[];
  address?: string;
  email?: string;
  damagedLocationId?: string | null;
}

export interface BranchUpdatePayload {
  name?: string;
  phoneNumber?: string[];
  address?: string;
  email?: string;
  status?: BranchStatus;
  damagedLocationId?: string | null;
}
