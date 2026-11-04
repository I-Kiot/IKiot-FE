/**
 * Các mục sidebar không có submenu cần vẽ. `sidebarRoleConfig` quy định loại tài khoản tới được đâu, còn bộ lọc quyền quyết định role này được thấy gì.
 * Trước đây bộ lọc chỉ áp cho submenu nên leaf chỉ bật/tắt được toàn bộ. URL không có trong map thì ai cũng thấy.
 */
import { allows } from "./role-permissions";

const LEAF_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  // Hai màn đọc các tổng hợp `/stats/*` nên cần `reports:read` (StatsController), kể cả Sổ thu chi; không dùng `cash_flows:read`.
  "/dashboard": ["reports", "read"],
  "/reports": ["reports", "read"],
  "/cashflow": ["reports", "read"],
  // Nhân viên xưởng: mọi route /workshop/* cần `production:deliver` (và tài khoản gắn xưởng - trang tự báo nếu chưa).
  "/workshop": ["production", "deliver"],
  // "/shipper" (Đơn giao của tôi) cố ý không có ở đây: shipper có thể là chủ shop hay người phụ
  // trách đơn - không cần `shipments:deliver` (chốt 2026-10-06) - và `GET /shipments/mine` chỉ trả
  // lần giao của chính người gọi, nên ai cũng mở được mà không thấy gì của người khác.
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
