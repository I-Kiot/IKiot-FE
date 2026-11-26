/** Được khoá / xoá hồ sơ nhân viên khác không. */
export function canManageStaffRow(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  // Backend kiểm tra lại; nút ẩn để khỏi bị từ chối bất ngờ.
  return userRole === "TENANT_OWNER" || userRole === "ADMIN";
}

export const canDeactivateStaffRow = canManageStaffRow;
export const canDeleteStaffRow = canManageStaffRow;
