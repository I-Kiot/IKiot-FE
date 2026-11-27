/** Nhân viên thuộc đúng một nơi làm việc. */
export function validateStaffWorkplace(
  branchId?: string,
  warehouseId?: string,
): string | null {
  if (branchId?.trim() && warehouseId?.trim()) {
    return "Nhân viên chỉ thuộc một nơi làm việc: chọn chi nhánh hoặc kho, không chọn cả hai";
  }
  return null;
}
