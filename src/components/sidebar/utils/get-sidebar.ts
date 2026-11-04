import { sidebarRoleConfig } from "../constants/sidebar-role";
import { type UserRole, type NavGroup } from "../constants/types";
import { allows } from "../constants/role-permissions";
import { filterLeafNavItems } from "../constants/nav-leaf-permissions";
import { filterOrderFlowNavItems } from "../constants/nav-order-flow-permissions";
import { filterHrNavItems } from "@/app/(protected)/staffs/shared/nav-hr-permissions";
import { filterExchangeNavItems } from "@/app/(protected)/exchange/shared/nav-exchange-permissions";

export function getSidebar(role?: string): NavGroup[] {
  if (!role) return [];
  return sidebarRoleConfig[role as UserRole] ?? [];
}

/**
 * `sidebarRoleConfig` quy định loại tài khoản tới được đâu; bộ lọc quyền quyết định role này được thấy gì. Cha có mọi con bị lọc thì bị ẩn; leaf đi qua `filterLeafNavItems`.
 * Sidebar và `RoutePermissionGuard` cùng dùng hàm này, nên màn ẩn khỏi menu cũng bị chặn khi gõ URL tay.
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
                items: filterOrderFlowNavItems(
                  filterExchangeNavItems(filterHrNavItems(item.items, role), role),
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

/** Mọi URL thật mà sidebar đã lọc trỏ tới (bỏ các mục placeholder `#`). */
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
