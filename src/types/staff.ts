/**
 * A role is a **row the shop owner created**, not one of three fixed values.
 *
 * The rewritten backend replaced `User.role` (BRANCH_MANAGER | WAREHOUSE_MANAGER | STAFF)
 * with `User.roleId` pointing at a tenant-owned `Role` the owner defines and grants
 * permissions to - see `GET /roles`. So there is no union to enumerate here any more, and
 * what a screen shows is the role's own name.
 */
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

export interface StaffLeaveBalance {
  annualLeaveDays: number;
  remainingDays: number;
}

export interface Staff {
  id: string;
  tenantId: string;
  branchId: string;
  branchName: string;
  warehouseId?: string;
  warehouseName?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  roleId: string | null;
  roleName: string;
  status: StaffStatus;
  joinedAt: string;
  /** Assigned paysheet from User.paySheetId (POST/PATCH /staff). */
  paySheetId?: string | null;
  paySheetName?: string;
  profile?: StaffProfile;
  accountNote?: string;
  leaveBalance?: StaffLeaveBalance;
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
  /** Optional - createStaffDTO accepts paySheetId. */
  paySheetId?: string | null;
  hireDate?: string;
  profile?: StaffProfilePayload;
  newPassword?: string;
  reEnterPassword?: string;
}

export interface UpdateStaffPayload {
  firstName?: string;
  /** The tenant role this account holds - `PATCH /users/:id` accepts it. */
  roleId?: string;
  lastName?: string;
  email?: string;
  /** Không gửi qua PATCH /staff - đổi manager dùng API gán Branch/Warehouse. */
  branchId?: string | null;
  warehouseId?: string | null;
  /**
   * PATCH /staff data.paySheetId - ObjectId string, or null to remove assignment
   * (OpenAPI UpdateStaffRequest).
   */
  paySheetId?: string | null;
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
  /** The role row id - what `POST /users` and `?roleId=` want. */
  value: string;
  label: string;
}
