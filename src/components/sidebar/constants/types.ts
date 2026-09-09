import { type LucideIcon } from "lucide-react";

/** The account kinds the backend actually issues (`User.systemRole`). */
export type UserRole = "ADMIN" | "TENANT_OWNER" | "STAFF" | "CUSTOMER";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
