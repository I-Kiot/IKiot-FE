import { sidebarRoleConfig } from "../constants/sidebar-role";
import { type UserRole, type NavGroup } from "../constants/types";

export function getSidebar(role?: string): NavGroup[] {
  if (!role) return [];
  return sidebarRoleConfig[role as UserRole] ?? [];
}
