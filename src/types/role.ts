/**
 * `UserRole` là loại tài khoản cố định ở BE (`User.systemRole`), dùng cho hiển thị và gate FE. `Role` là vai trò do chủ cửa hàng tạo và gắn quyền; `User.roleId` trỏ tới nó.
 */
export type UserRole =
  | "ADMIN"
  | "TENANT_OWNER"
  | "STAFF"
  | "CUSTOMER"
  // Hai giá trị của backend cũ: tài khoản mới không còn mang, nhưng user cũ trong localStorage có thể vẫn có - giữ để hiển thị đúng.
  | "BRANCH_MANAGER"
  | "WAREHOUSE_MANAGER";

export const ROLE_MAP: Record<UserRole, string> = {
  ADMIN: "Quản trị hệ thống",
  TENANT_OWNER: "Chủ cửa hàng",
  STAFF: "Nhân viên",
  CUSTOMER: "Khách hàng",
  BRANCH_MANAGER: "Quản lý chi nhánh",
  WAREHOUSE_MANAGER: "Quản lý kho",
};

export function getUserRoleLabel(role?: string): string {
  if (!role) return "-";
  return ROLE_MAP[role as UserRole] || role;
}

/** Một quyền: "làm được `action` trên `resource`". */
export interface PermissionGrant {
  resource: string
  action: string
}

/** Một dòng của danh mục quyền. `label` là tên tiếng Việt của nhóm tài nguyên. */
export interface PermissionCatalogEntry extends PermissionGrant {
  label: string
  /** Quyền này mở tính năng gì - BE ghi cho những quyền mà tên ngắn chưa đủ rõ, còn lại `null`. */
  description?: string | null
}

export interface Role {
  id: string
  name: string
  description?: string | null
  permissions: PermissionGrant[]
  /** Số tài khoản đang giữ vai trò này - xóa vai trò còn người giữ sẽ bị từ chối. */
  userCount: number
  createdAt?: string
  updatedAt?: string
}

export interface RoleCreatePayload {
  name: string
  description?: string
  permissions: PermissionGrant[]
}

export type RoleUpdatePayload = Partial<RoleCreatePayload>

/** Danh mục quyền đã gom theo tài nguyên - hình dạng mà giao diện chọn quyền cần. */
export interface PermissionResourceGroup {
  resource: string
  label: string
  hint?: string
  actions: string[]
  /** Mô tả theo action, chỉ có ở những quyền BE có ghi. */
  descriptions: Record<string, string>
}
