/**
 * Which top-level (no submenu) entries to draw.
 *
 * `sidebarRoleConfig` lists what an account kind *can* reach and the filters decide what
 * this particular role may - but until now only submenus were filtered, so a leaf could
 * only be all-or-nothing. That is why "Tổng quan", "Trợ lý AI" and "Sổ thu chi" were left
 * out of the `STAFF` block entirely: the same mistake `giaoDich` carried until 2026-09-09,
 * an entry no permission could ever reveal.
 *
 * Each key names the permission its screen is gated on server-side. A URL that is absent
 * from the map is drawn for everyone - the leaves that need no permission beyond an
 * account, and the ones nothing has been decided for yet.
 */
import { allows } from "./role-permissions";

const LEAF_NAV_PERMISSION: Record<string, readonly [string, string]> = {
  // Both screens read the `/stats/*` aggregations - `reports:read` in `StatsController`.
  // "Sổ thu chi" is one of them (`/stats/cashflow` + `/stats/cashflow/transactions`), not
  // the `cash_flows` module, so `cash_flows:read` is the wrong gate for it.
  "/dashboard": ["reports", "read"],
  "/cashflow": ["reports", "read"],
  // Listing conversations; sending a message additionally needs `ai_chat:create`.
  "/chat": ["ai_chat", "read"],
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
