/**
 * Who may do what with the shift roster.
 *
 * These were sets of role names mirroring the old backend's `permissions.json`. Their two
 * manager values no longer exist, so every gate here had collapsed to "TENANT_OWNER only" -
 * hiding rostering from the very staff the shop had granted it to. Each one now asks the
 * permission catalogue through `allows()`.
 *
 * The location scope below moved the same way: which slice of the roster you see follows
 * from **where you are posted**, not from a role name.
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

/** BM không được sửa/xóa ca được gán cho chính mình. */
export function isBranchManagerOwnScheduleAssignee(
  _userRole?: string | null,
  sessionUserId?: string | null,
  assigneeUserId?: string | null,
): boolean {
  if (!sessionUserId || !assigneeUserId) return false;
  // Anybody who manages the roster is barred from editing the shift they are on -
  // the rule was never about the role, only about being both parties at once.
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
  // Anyone who can see more than their own shifts can filter within them.
  return allows(userRole, 'schedules', 'read_all') ||
    allows(userRole, 'schedules', 'readBR') ||
    allows(userRole, 'schedules', 'readWH');
}

export function getScheduleListScope(
  userRole?: string | null,
): ScheduleListScope | null {
  if (!userRole) return null;
  // Where you are posted decides the slice - an owner is posted nowhere and sees everything.
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
