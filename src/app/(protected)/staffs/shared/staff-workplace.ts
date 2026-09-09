/**
 * A staff member works at exactly one location.
 *
 * This used to only apply to the fixed `STAFF` role, because BRANCH_MANAGER and
 * WAREHOUSE_MANAGER each implied their own kind of posting. Those roles are gone and the
 * backend now rejects a body naming both for **anybody** (`normalizeWorkplaceUpdateData`),
 * so the rule lost its exception rather than its meaning.
 */
export function validateStaffWorkplace(
  branchId?: string,
  warehouseId?: string,
): string | null {
  if (branchId?.trim() && warehouseId?.trim()) {
    return "Nhân viên chỉ thuộc một nơi làm việc: chọn chi nhánh hoặc kho, không chọn cả hai";
  }
  return null;
}
