/**
 * Hai khái niệm khác nhau cùng gọi là "vai trò" - đừng lẫn:
 *
 *  - **`UserRole`** là *loại tài khoản*, cố định trong code backend
 *    (`User.systemRole`): chủ cửa hàng, nhân viên, quản trị nền tảng. Tenant không sửa
 *    được. Dùng cho hiển thị và cho các gate ở FE.
 *  - **`Role`** (bên dưới) là *vai trò của cửa hàng*: một dòng trong bảng `Role` do chủ
 *    cửa hàng tự tạo, đặt tên và gắn quyền. Đây là thứ trang `/staffs/roles` quản lý và
 *    là thứ `User.roleId` trỏ tới.
 */
export type UserRole =
  | "ADMIN"
  | "TENANT_OWNER"
  | "STAFF"
  | "CUSTOMER"
  // Hai giá trị của bản backend cũ. Không tài khoản mới nào mang chúng nữa, nhưng một
  // user còn nằm trong localStorage từ trước có thể vẫn có - giữ lại để hiển thị đúng
  // thay vì rơi ra chuỗi thô.
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
  actions: string[]
}
