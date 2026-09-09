export type BranchStatus = "ACTIVE" | "INACTIVE";

export interface Branch {
  id: string;
  name: string;
  phoneNumber: string[];
  address?: string;
  email?: string;
  status: BranchStatus;
  /** Who runs this location. Appointed through `PATCH /:id/manager`, not by holding a
   *  particular role - the rewrite moved that from `User.role` onto the location itself. */
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
}

export interface BranchUpdatePayload {
  name?: string;
  phoneNumber?: string[];
  address?: string;
  email?: string;
  status?: BranchStatus;
}
