/**
 * Tài khoản này có được khóa hoặc xóa hồ sơ nhân viên khác không. Chỉ nhận người gọi vì không còn phân cấp role để so. Người đang điều hành chi nhánh/kho bị backend từ chối xóa, dialog hiện lý do.
 */
export function canManageStaffRow(userRole: string | undefined | null): boolean {
  if (!userRole) return false;
  // Backend kiểm tra lại; nút ẩn để khỏi bị từ chối bất ngờ.
  return userRole === "TENANT_OWNER" || userRole === "ADMIN";
}

export const canDeactivateStaffRow = canManageStaffRow;
export const canDeleteStaffRow = canManageStaffRow;
