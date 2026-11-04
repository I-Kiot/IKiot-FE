/**
 * Ai được làm gì với lịch làm. Mỗi cổng hỏi quyền qua `allows()`, không theo tên role. Phạm vi xem lịch theo nơi làm việc (chi nhánh/kho) của tài khoản.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionBranchId, getSessionWarehouseId } from "@/lib/auth";

export type ScheduleListScope = "all" | "branch" | "warehouse" | "own";

export function canViewSchedule(userRole?: string | null): boolean {
  return allows(userRole, 'schedules', 'read');
}

export function canCreateSchedule(userRole?: string | null): boolean {
  return allows(userRole, 'schedules', 'create');
}

export function canDeleteSchedule(userRole?: string | null): boolean {
  return allows(userRole, 'schedules', 'delete');
}

export function canUpdateSchedule(userRole?: string | null): boolean {
  return allows(userRole, 'schedules', 'update');
}

/** Không được sửa/xóa ca mà chính mình được gán. */
export function isBranchManagerOwnScheduleAssignee(
  _userRole?: string | null,
  sessionUserId?: string | null,
  assigneeUserId?: string | null,
): boolean {
  if (!sessionUserId || !assigneeUserId) return false;
  // Không tự sửa ca của chính mình, bất kể role: đây là việc hai bên là cùng một người.
  return String(sessionUserId) === String(assigneeUserId);
}

export function resolveScheduleAssigneeUserId(
  assigneeUserId?: string | null,
  assignees?: { userId: string }[],
): string | null {
  if (assigneeUserId) return assigneeUserId;
  if (assignees?.length === 1) return assignees[0].userId;
  return null;
}

export function canDeleteScheduleAssignee(
  userRole?: string | null,
  sessionUserId?: string | null,
  assigneeUserId?: string | null,
): boolean {
  if (!canDeleteSchedule(userRole)) return false;
  if (
    isBranchManagerOwnScheduleAssignee(userRole, sessionUserId, assigneeUserId)
  ) {
    return false;
  }
  return true;
}

export function canUpdateScheduleAssignee(
  userRole?: string | null,
  sessionUserId?: string | null,
  assigneeUserId?: string | null,
): boolean {
  if (!canUpdateSchedule(userRole)) return false;
  if (
    isBranchManagerOwnScheduleAssignee(userRole, sessionUserId, assigneeUserId)
  ) {
    return false;
  }
  return true;
}

export function canManageShiftTemplates(userRole?: string | null): boolean {
  return allows(userRole, 'schedules', 'update');
}

export function canFilterScheduleByStaff(userRole?: string | null): boolean {
  // Ai xem được nhiều hơn ca của mình thì được lọc theo nhân viên.
  return allows(userRole, 'schedules', 'read_all') ||
    allows(userRole, 'schedules', 'readBR') ||
    allows(userRole, 'schedules', 'readWH');
}

export function getScheduleListScope(
  userRole?: string | null,
): ScheduleListScope | null {
  if (!userRole) return null;
  // Nơi làm việc quyết định phạm vi; chủ shop không gắn với nơi nào nên thấy tất cả.
  if (getSessionBranchId()) return "branch";
  if (getSessionWarehouseId()) return "warehouse";
  if (userRole === "TENANT_OWNER" || userRole === "ADMIN") return "all";
  return "own";
}

export function getScheduleScopeLabel(userRole?: string | null): string | null {
  switch (getScheduleListScope(userRole)) {
    case "all":
      return "Toàn bộ tenant";
    case "branch":
      return "Nhân viên trong chi nhánh";
    case "warehouse":
      return "Nhân viên trong kho";
    case "own":
      return "Ca của tôi";
    default:
      return null;
  }
}
