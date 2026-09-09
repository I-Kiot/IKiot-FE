/**
 * Which "Giao dịch" submenu entries to draw.
 *
 * The group was missing from the STAFF sidebar entirely - not hidden by a permission check,
 * just absent from `sidebarRoleConfig` - so a role granted every permission in the catalogue
 * still had no way to reach imports, transfers or stock adjustments. That was a leftover
 * from the fixed-role era, when only `BRANCH_MANAGER`/`WAREHOUSE_MANAGER` (values nothing
 * carries any more) were meant to see it.
 *
 * Each entry now names the permission its screen is gated on server-side, the same way
 * `nav-hr-permissions.ts` does for the HR menu.
 */
import { allows } from "@/components/sidebar/constants/role-permissions";

const EXCHANGE_NAV_PERMISSION = {
  // Reading the list is the entry point for every one of these screens; creating,
  // approving and receiving are gated per button inside them.
  suppliers: ["suppliers", "read"],
  imports: ["stock_movement", "read"],
  exports: ["stock_movement", "read"],
  adjustments: ["stock_movement", "read"],
} as const;

export type ExchangeNavItemKey = keyof typeof EXCHANGE_NAV_PERMISSION;

export function canAccessExchangeNavItem(
  item: ExchangeNavItemKey,
  userRole?: string | null,
): boolean {
  if (!userRole) return false;
  const [resource, action] = EXCHANGE_NAV_PERMISSION[item];
  return allows(userRole, resource, action);
}

export function filterExchangeNavItems<
  T extends { title: string; url: string },
>(items: T[], userRole?: string | null): T[] {
  const urlToKey: Record<string, ExchangeNavItemKey> = {
    "/exchange/suppliers": "suppliers",
    "/exchange/imports": "imports",
    "/exchange/exports": "exports",
    "/exchange/adjustments": "adjustments",
  };

  return items.filter((item) => {
    const key = urlToKey[item.url];
    if (!key) return true;
    return canAccessExchangeNavItem(key, userRole);
  });
}
