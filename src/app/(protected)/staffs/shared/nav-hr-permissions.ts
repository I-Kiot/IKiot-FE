/**
 * Which HR submenu entries to draw.
 *
 * These were allowlists of role names copied from the old backend's `permissions.json`.
 * Two of the four values in them - `BRANCH_MANAGER`, `WAREHOUSE_MANAGER` - no longer exist,
 * so the lists were quietly hiding the whole HR menu from every staff account. Each entry
 * now names the permission its screen is actually gated on server-side, and `allows()`
 * answers.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";

const HR_NAV_PERMISSION = {
  staffList: ["users", "read"],
  schedule: ["schedules", "read"],
  leaveRequests: ["leaveRequests", "read_mine"],
  holidays: ["holidays", "read"],
  payroll: ["payroll", "read"],
  // Your own payslips: `GET /payroll/my-payslips` needs nothing but an account.
  myPayroll: null,
} as const;

export type HrNavItemKey = keyof typeof HR_NAV_PERMISSION;

export function canAccessHrNavItem(
  item: HrNavItemKey,
  userRole?: string | null,
): boolean {
  if (!userRole) return false;
  const pair = HR_NAV_PERMISSION[item];
  if (!pair) return true;
  return allows(userRole, pair[0], pair[1]);
}

export function filterHrNavItems<
  T extends { title: string; url: string },
>(items: T[], userRole?: string | null): T[] {
  const urlToKey: Record<string, HrNavItemKey> = {
    "/staffs": "staffList",
    "/staffs/schedule": "schedule",
    "/staffs/schedule/leave-requests": "leaveRequests",
    "/staffs/holidays": "holidays",
    "/staffs/payroll": "payroll",
    "/staffs/payroll/my-payslips": "myPayroll",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessHrNavItem(key, userRole);
  });
}
