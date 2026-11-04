/** Vai trò là dòng do chủ cửa hàng tạo (`User.roleId` → `Role` của tenant, xem `GET /roles`), không phải union cố định; màn hình hiện đúng tên vai trò. */
export interface StaffRoleRef {
  id: string;
  name: string;
}

export type StaffStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type StaffGender = "MALE" | "FEMALE" | "OTHER";

export interface StaffProfile {
  identificationId?: string;
  address?: string;
  gender?: StaffGender;
  dob?: string;
  avatarUrl?: string;
  taxNumber?: string;
}

export interface Staff {
  id: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  warehouseId?: string;
  warehouseName?: string;
  /** Nhân viên xưởng: xưởng (NCC loại WORKSHOP) người này thuộc về. */
  workshopId?: string;
  workshopName?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  roleId: string | null;
  roleName: string;
  status: StaffStatus;
  joinedAt: string;
  profile?: StaffProfile;
  accountNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponse {
  data: Staff[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StaffListQuery {
  page: number;
  limit: number;
  search: string;
  roleId: string | "all";
  status: StaffStatus | "all";
  branchId: string;
  warehouseId: string;
}

export interface StaffQueryParams {
  page?: number;
  limit?: number;
  roleId?: string;
  status?: StaffStatus;
  branchId?: string | null;
  warehouseId?: string | null;
  search?: string;
}

export interface StaffProfilePayload {
  identificationId?: string;
  address?: string;
  gender?: StaffGender;
  dob?: string;
  avatarUrl?: string;
  taxNumber?: string;
}

export interface CreateStaffPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  roleId: string;
  branchId?: string | null;
  warehouseId?: string | null;
  workshopId?: string | null;
  hireDate?: string;
  profile?: StaffProfilePayload;
  newPassword?: string;
  reEnterPassword?: string;
}

export interface UpdateStaffPayload {
  firstName?: string;
  /** Vai trò của tenant mà tài khoản đang giữ; `PATCH /users/:id` nhận trường này. */
  roleId?: string;
  lastName?: string;
  email?: string;
  /** Không gửi qua PATCH /staff - đổi manager dùng API gán Branch/Warehouse. */
  branchId?: string | null;
  warehouseId?: string | null;
  /** `null` bỏ gắn xưởng; `undefined` giữ nguyên. */
  workshopId?: string | null;
  hireDate?: string;
  profile?: StaffProfilePayload;
  accountNote?: string;
}

export interface CreateStaffAccountPayload {
  newPassword: string;
  reEnterPassword: string;
}

export interface StaffManagerActionPayload {
  replacementManagerId?: string;
}

export interface StaffRoleOption {
  /** Id dòng `Role` - thứ `POST /users` và `?roleId=` cần. */
  value: string;
  label: string;
}
