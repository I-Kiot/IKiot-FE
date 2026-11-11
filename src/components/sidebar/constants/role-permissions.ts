import { getCachedUser } from "@/lib/auth";

/**
 * Quyền của tài khoản đang đăng nhập. Các hàm ở đây chỉ quyết định hiển thị, không quyết định cho phép: backend vẫn kiểm tra mọi route.
 * Danh sách quyền lấy từ `GET /auth/me`. Không dùng tên role (BRANCH_MANAGER, ...) nữa vì role do từng shop tự định nghĩa.
 */

/** Khớp với `PermissionsGuard`: hai role này có toàn quyền và được bỏ qua mọi kiểm tra. */
function holdsEverything(role?: string | null): boolean {
  return role === "TENANT_OWNER" || role === "ADMIN";
}

/**
 * Caller có `resource:action` không. Chủ shop và admin có danh sách quyền rỗng (nghĩa là không áp dụng), nên phải kiểm tra `holdsEverything` trước.
 * Quyền tạm của ca hết hạn theo giờ, nhưng đây chỉ đọc snapshot lúc `/auth/me` nên có thể còn hiện nút một lúc. Backend kiểm tra lại mọi request.
 */
export function allows(
  role: string | null | undefined,
  resource: string,
  action: string,
): boolean {
  if (!role) return false;
  if (holdsEverything(role)) return true;
  return getCachedUser()?.permissions?.includes(`${resource}:${action}`) ?? false;
}

export function canViewProducts(role?: string | null): boolean {
  return allows(role, 'products', 'read');
}
export function canCreateProduct(role?: string | null): boolean {
  return allows(role, 'products', 'create');
}
export function canUpdateProduct(role?: string | null): boolean {
  return allows(role, 'products', 'update');
}
export function canDeleteProduct(role?: string | null): boolean {
  return allows(role, 'products', 'delete');
}

export function canViewBrands(role?: string | null): boolean {
  return allows(role, 'brands', 'read');
}
export function canCreateBrand(role?: string | null): boolean {
  return allows(role, 'brands', 'create');
}
export function canUpdateBrand(role?: string | null): boolean {
  return allows(role, 'brands', 'update');
}
export function canDeleteBrand(role?: string | null): boolean {
  return allows(role, 'brands', 'delete');
}

export function canViewCategories(role?: string | null): boolean {
  return allows(role, 'categories', 'read');
}
export function canCreateCategory(role?: string | null): boolean {
  return allows(role, 'categories', 'create');
}
export function canUpdateCategory(role?: string | null): boolean {
  return allows(role, 'categories', 'update');
}
export function canDeleteCategory(role?: string | null): boolean {
  return allows(role, 'categories', 'delete');
}

export function canCreateSupplier(role?: string | null): boolean {
  return allows(role, 'suppliers', 'create');
}
export function canUpdateSupplier(role?: string | null): boolean {
  return allows(role, 'suppliers', 'update');
}
export function canDeleteSupplier(role?: string | null): boolean {
  return allows(role, 'suppliers', 'delete');
}

export function canRemoveInventoryLocation(role?: string | null): boolean {
  return allows(role, 'inventory', 'delete');
}

export function canManageStaff(role?: string | null): boolean {
  return allows(role, 'users', 'update');
}
export function canViewStaff(role?: string | null): boolean {
  return allows(role, 'users', 'read');
}
export function canCreateStaff(role?: string | null): boolean {
  return allows(role, 'users', 'create');
}
export function canUpdateStaff(role?: string | null): boolean {
  return allows(role, 'users', 'update');
}
export function canManageStaffAccount(role?: string | null): boolean {
  return allows(role, 'users', 'update');
}
export function canDeleteStaff(role?: string | null): boolean {
  return allows(role, 'users', 'delete');
}

/** TENANT_OWNER lọc danh sách theo chi nhánh; BM đã được backend tự giới hạn theo chi nhánh của mình. */
export function canFilterStaffByBranch(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/** TENANT_OWNER lọc danh sách theo kho. */
export function canFilterStaffByWarehouse(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/** Khoá ô chi nhánh khi người tạo đã thuộc về một chi nhánh cụ thể. */
export function shouldLockBranchOnCreate(branchId?: string | null): boolean {
  return Boolean(branchId);
}

/** Chỉ TO gán nhân viên vào kho; BM chỉ quản lý chi nhánh. */
export function canAssignWarehouseOnStaffForm(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/**
 * Quản lý vai trò và phân quyền: chỉ chủ shop và admin nền tảng. Cố ý không đi qua danh mục quyền, vì nếu "sửa phân quyền" là một quyền chọn được thì vai trò tự tạo có thể tự cấp cho mình.
 */
export function canManageRoles(role?: string | null): boolean {
  return role === "TENANT_OWNER" || role === "ADMIN";
}

/**
 * Có được đặt role và chi nhánh/kho của người khác trên form nhân viên không. Tạo cần `users:create`, sửa cần `users:update`.
 * Chỉ kiểm tra `update` thì người được tạo nhân viên nhưng không sửa được sẽ bị khoá dropdown role, trong khi `POST /users` bắt buộc `roleId`.
 */
export function canEditStaffRoleAndWorkplace(
  role: string | undefined | null,
  isEdit = true,
): boolean {
  return isEdit ? canUpdateStaff(role) : canCreateStaff(role);
}


/** PATCH /branches/:id/manager - chỉ TENANT_OWNER. */
export function canAssignBranchManager(role?: string | null): boolean {
  return allows(role, 'branches', 'assign_manager');
}

/** PATCH /warehouses/:id/manager - chỉ TENANT_OWNER. */
export function canAssignWarehouseManager(role?: string | null): boolean {
  return allows(role, 'warehouses', 'assign_manager');
}

export function canManageBilling(role?: string | null): boolean {
  return allows(role, 'subscriptions', 'manage');
}

export function canUseAIChat(role?: string | null): boolean {
  return allows(role, 'ai_chat', 'create');
}

/**
 * Sửa đầy đủ hồ sơ qua `PATCH /auth/me`. Không phải cặp quyền: `AuthService.updateMe` tự kiểm tra `systemRole`, nên hàm này đối chiếu lại logic đó.
 */
export function canEditAccountProfile(role?: string | null): boolean {
  return holdsEverything(role);
}

export function canViewPromotions(role?: string | null): boolean {
  return allows(role, 'promotions', 'read');
}
export function canCreatePromotion(role?: string | null): boolean {
  return allows(role, 'promotions', 'create');
}
export function canUpdatePromotion(role?: string | null): boolean {
  return canCreatePromotion(role);
}
export function canDeletePromotion(role?: string | null): boolean {
  return canCreatePromotion(role);
}

/** Mở két - `cash_drawers:open`. Chốt két là mã riêng (`canFinalizeCashDrawer`). */
export function canManageCashDrawer(role?: string | null): boolean {
  return allows(role, 'cash_drawers', 'open');
}

/** Chốt két cuối ngày - `cash_drawers:finalize`. */
export function canFinalizeCashDrawer(role?: string | null): boolean {
  return allows(role, 'cash_drawers', 'finalize');
}

/** Ghi phiếu giao–nhận ca. */
export function canReportShift(role?: string | null): boolean {
  return allows(role, 'cash_drawers', 'report');
}

