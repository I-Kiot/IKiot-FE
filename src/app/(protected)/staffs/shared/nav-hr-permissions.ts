/**
 * Mục menu HR hiện theo quyền mà màn hình đó bị chặn ở backend (`allows()`), không theo tên role. Danh sách role cũ đã làm ẩn cả menu HR.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";

const HR_NAV_PERMISSION = {
  staffList: ["users", "read"],
  schedule: ["schedules", "read"],
  holidays: ["holidays", "read"],
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
    "/staffs/holidays": "holidays",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessHrNavItem(key, userRole);
  });
}
