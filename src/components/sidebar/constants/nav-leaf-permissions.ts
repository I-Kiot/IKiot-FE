/** Quyền cần có của các mục sidebar; URL không có trong map thì ai cũng thấy. */
import { allows } from "./role-permissions";

const LEAF_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  // Cần `reports:read`.
  "/dashboard": ["reports", "read"],
  "/reports": ["reports", "read"],
  // Các mục báo cáo và thống kê cần `reports:read`.
  "/reports/staff": ["reports", "read"],
  "/reports/sales-journal": ["reports", "read"],
  "/reports/unreconciled": ["reports", "read"],
  "/statistics": ["reports", "read"],
  "/cashflow": ["reports", "read"],
  // `/workshop/*` cần `production:deliver`, BE tự cấp cho tài khoản gắn xưởng.
  "/workshop": ["production", "deliver"],
  // "/shipper" ai cũng mở được, chỉ thấy lần giao của mình.
};

export function canAccessLeafNavItem(
  url: string,
  userRole?: string | null,
): boolean {
  const pair = LEAF_NAV_PERMISSION[url];
  if (!pair) return true;
  return allows(userRole, pair[0], pair[1]);
}

export function filterLeafNavItems<T extends { title: string; url: string }>(
  items: T[],
  userRole?: string | null,
): T[] {
  return items.filter((item) => canAccessLeafNavItem(item.url, userRole));
}
