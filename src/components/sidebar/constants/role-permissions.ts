import { getCachedUser } from "@/lib/auth";

/**
 * What the signed-in account is allowed to do.
 *
 * This file used to hold allowlists of **role names** - a copy of the old backend's fixed
 * six-role `permissions.json`. That model is gone: a shop defines its own roles and grants
 * each one a set of `(resource, action)` pairs from a code-owned catalogue, so an account
 * kind no longer implies any particular permission. The lists here were consequently
 * checking for `BRANCH_MANAGER` and `WAREHOUSE_MANAGER`, values nothing carries any more.
 *
 * `GET /auth/me` returns the caller's live permission list (`AuthService.me` hands back the
 * exact set `JwtStrategy` resolved for that request), and the helpers below ask it.
 *
 * **These gates decide what to draw, never what is allowed.** Every route is enforced
 * server-side; hiding a button the backend would refuse is a courtesy, and showing one it
 * would refuse is a bad error message, not a breach.
 */

/** Mirrors `PermissionsGuard`: these two hold everything and short-circuit before any check. */
function holdsEverything(role?: string | null): boolean {
  return role === "TENANT_OWNER" || role === "ADMIN";
}

/**
 * Whether the caller holds `resource:action`.
 *
 * The permission list is empty for owners and platform admins - empty means "not
 * applicable", never "nothing" - so the short-circuit above has to come first.
 *
 * A shift supervisor's temporary grants are in the list too, and they **expire by the
 * clock**: this reads a snapshot taken at the last `/auth/me`, so a supervisor whose shift
 * just ended may still see a button for a moment. The server re-evaluates every request.
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

// Products
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

// Brands
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

// Categories
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

// Suppliers
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

// Staff
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

/** TENANT_OWNER can filter list by branch; BM is auto-scoped by BE. */
export function canFilterStaffByBranch(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/** TENANT_OWNER can filter list by warehouse. */
export function canFilterStaffByWarehouse(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/** BM create form: branch locked to their workplace. */
/** Khoá ô chi nhánh khi người tạo đã thuộc về một chi nhánh cụ thể. */
export function shouldLockBranchOnCreate(branchId?: string | null): boolean {
  return Boolean(branchId);
}

/** Chỉ TO gán nhân viên vào kho; BM chỉ quản lý chi nhánh. */
export function canAssignWarehouseOnStaffForm(role?: string | null): boolean {
  return role === "TENANT_OWNER";
}

/** Manager role/workplace cannot be edited via PATCH /staff - BE blocks. */
/**
 * Whether this account may change somebody's role and workplace.
 *
 * It used to refuse when the *target* was a BRANCH_MANAGER or WAREHOUSE_MANAGER, because
 * moving a manager meant reassigning their location in the same edit. Those roles are gone
 * and appointment is its own endpoint, so the only question left is whether the caller may
 * update staff at all.
 */
/**
 * Quản lý vai trò và phân quyền - chỉ chủ cửa hàng (và quản trị nền tảng).
 *
 * Đây là bản sao của `OwnerOrAdminGuard` ở backend, và nó **cố ý không** đi qua danh mục
 * quyền: nếu "sửa phân quyền" tự nó là một quyền chọn được, thì một vai trò tự tạo có thể
 * tự cấp cho mình quyền đó và mở rộng vô hạn.
 */
export function canManageRoles(role?: string | null): boolean {
  return role === "TENANT_OWNER" || role === "ADMIN";
}

/**
 * Whether this account may set somebody's role and workplace on the staff form.
 *
 * It has to follow the form's mode, because the backend gates the two writes separately:
 * `POST /users` needs `users:create`, `PATCH /users/:id` needs `users:update`. Asking only
 * for `update` locked the role dropdown for a manager who may hire but not edit - and
 * `POST /users` **requires** a `roleId`, so that account could open the form and never
 * submit it.
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

/** Thăng STAFF → BM/WM qua form sửa - chỉ TENANT_OWNER. */
// Leave requests - aligned with BE permissions.json leaveRequests actions
export function canViewLeaveRequests(role?: string | null): boolean {
  return allows(role, 'leaveRequests', 'read_mine');
}
export function canReviewLeaveRequest(role?: string | null): boolean {
  return allows(role, 'leaveRequests', 'approve');
}

/**
 * Whether this account may approve *this particular* request.
 *
 * Two rules survive from the old version, and one does not:
 *  - **Nobody reviews their own request.** The backend enforces it; hiding the button keeps
 *    the refusal from being a surprise.
 *  - Holding `leaveRequests:approve` is the rest of it.
 *
 * What is gone is the hierarchy - "a branch manager may only approve STAFF, their own kind
 * goes to the owner". That compared two fixed roles, and roles are shop-defined rows now, so
 * there is nothing to rank. The backend dropped the same rule when the module was ported.
 */
export function canReviewLeaveRequestTarget(
  reviewerRole?: string | null,
  options?: {
    requestUserId?: string | null;
    currentUserId?: string | null;
  },
): boolean {
  if (!canReviewLeaveRequest(reviewerRole)) return false;

  const requestUserId = options?.requestUserId
    ? String(options.requestUserId).trim()
    : "";
  const currentUserId = options?.currentUserId
    ? String(options.currentUserId).trim()
    : "";

  if (requestUserId && currentUserId && requestUserId === currentUserId) {
    return false;
  }
  return true;
}
export function canCreateEmergencyLeave(role?: string | null): boolean {
  return allows(role, 'leaveRequests', 'create_emergency');
}
/**
 * Filing your own leave.
 *
 * `POST /leave-requests` carries **no `@Permissions` decorator** - deliberately: anybody
 * with an account may ask for time off. So this is "are you signed in", not a permission.
 */
export function canCreatePersonalLeave(role?: string | null): boolean {
  return Boolean(role);
}
/** BR / WH / STAFF: POST /leave-requests/:id/cancel. */
export function canCancelOwnLeave(role?: string | null): boolean {
  return allows(role, 'leaveRequests', 'cancel');
}

// Billing
export function canManageBilling(role?: string | null): boolean {
  return allows(role, 'subscriptions', 'manage');
}

// AI Chat
export function canUseAIChat(role?: string | null): boolean {
  return allows(role, 'ai_chat', 'create');
}

// Account settings
/**
 * Editing the full profile through `PATCH /auth/me`.
 *
 * Not a catalogue pair: `AuthService.updateMe` branches on `systemRole` itself
 * (`canEditFullProfile`), so this mirrors that check rather than a permission.
 */
export function canEditAccountProfile(role?: string | null): boolean {
  return holdsEverything(role);
}

// Promotions
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

// Cash drawers
/** Mở ca / chốt ca - `cash_drawers:open` trong danh mục quyền. */
export function canManageCashDrawer(role?: string | null): boolean {
  return allows(role, 'cash_drawers', 'open');
}

/** Ghi phiếu giao–nhận ca. */
export function canReportShift(role?: string | null): boolean {
  return allows(role, 'cash_drawers', 'report');
}

