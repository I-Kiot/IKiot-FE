import { sidebarRoleConfig } from "../constants/sidebar-role";
import { type UserRole, type NavGroup } from "../constants/types";
import { allows } from "../constants/role-permissions";
import { filterLeafNavItems } from "../constants/nav-leaf-permissions";
import { filterHrNavItems } from "@/app/(protected)/staffs/shared/nav-hr-permissions";
import { filterExchangeNavItems } from "@/app/(protected)/exchange/shared/nav-exchange-permissions";

export function getSidebar(role?: string): NavGroup[] {
  if (!role) return [];
  return sidebarRoleConfig[role as UserRole] ?? [];
}

/**
 * `sidebarRoleConfig` says what the account kind *can* reach; the permission filters say
 * what this particular role may. A parent whose children are all filtered away is dropped
 * rather than drawn as a menu that opens onto nothing; a leaf goes through
 * `filterLeafNavItems`, which keeps the ones no permission has been named for.
 *
 * Both the sidebar and `RoutePermissionGuard` read this, so a screen hidden from the menu
 * is also refused when its URL is typed by hand instead of merely failing its first fetch.
 */
export function getFilteredSidebar(role?: string | null): NavGroup[] {
  return getSidebar(role ?? undefined)
    .map((group) => ({
      ...group,
      items: filterLeafNavItems(group.items, role)
        .map((item) =>
          item.items
            ? {
                ...item,
                items: filterExchangeNavItems(
                  filterHrNavItems(item.items, role),
                  role,
                ),
              }
            : item,
        )
        .filter((item) => !item.items || item.items.length > 0),
    }))
    .filter((group) => group.items.length > 0);
}

export function getHomeRoute(role?: string | null): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "STAFF") return "/products";
  return "/dashboard";
}

export function canOpenCheckout(role?: string | null): boolean {
  if (!role || role === "ADMIN") return false;
  return allows(role, "orders", "create");
}

/** Every concrete URL the filtered sidebar links to (placeholder `#` entries excluded). */
export function getAllowedSidebarUrls(role?: string | null): string[] {
  const urls: string[] = [];
  const isReal = (url?: string) => !!url && url !== "#" && !url.startsWith("/#");
  for (const group of getFilteredSidebar(role)) {
    for (const item of group.items) {
      if (isReal(item.url)) urls.push(item.url);
      for (const sub of item.items ?? []) {
        if (isReal(sub.url)) urls.push(sub.url);
      }
    }
  }
  return urls;
}
