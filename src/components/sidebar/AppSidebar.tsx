"use client";

import * as React from "react";
import { BranchSwitcher } from "@/components/switcher/branch-switcher";
import { SidebarNotification } from "./SidebarNotification";
import { NavMain } from "./NavMain";
import { NavUser } from "./NavUser";
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import { filterHrNavItems } from "@/app/(protected)/staffs/shared/nav-hr-permissions";
import { filterExchangeNavItems } from "@/app/(protected)/exchange/shared/nav-exchange-permissions";
import { filterLeafNavItems } from "./constants/nav-leaf-permissions";
import { useAuthStore } from "@/store/auth-store";
import { getSidebar } from "./utils/get-sidebar";

const defaultUserData = {
  name: "iKiot",
  email: "store@example.com",
  avatar: "",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  const formattedUser = React.useMemo(() => {
    if (!user) {
      return defaultUserData;
    }
    // email is optional on the backend User (phoneNumber is the required
    // identifier), so it can't be the last resort here - fall through to it.
    const name =
      [user.profile?.lastName, user.profile?.firstName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      user.email ||
      user.phoneNumber ||
      defaultUserData.name;
    return {
      name,
      email: user.email || user.phoneNumber || "",
      avatar: user.profile?.avatarUrl || "",
    };
  }, [user]);

  // `sidebarRoleConfig` says what the account kind *can* reach; the permission filters say
  // what this particular role may. A parent whose children are all filtered away is dropped
  // rather than drawn as a menu that opens onto nothing; a leaf goes through
  // `filterLeafNavItems`, which keeps the ones no permission has been named for.
  const navGroups = React.useMemo(() => {
    return getSidebar(user?.role)
      .map((group) => ({
        ...group,
        items: filterLeafNavItems(group.items, user?.role)
          .map((item) =>
            item.items
              ? {
                  ...item,
                  items: filterExchangeNavItems(
                    filterHrNavItems(item.items, user?.role),
                    user?.role,
                  ),
                }
              : item,
          )
          .filter((item) => !item.items || item.items.length > 0),
      }))
      .filter((group) => group.items.length > 0);
  }, [user?.role]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        {user?.role === "ADMIN" ? (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <Logo size={28} className="shrink-0" />
            <span className="font-semibold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
              iKiot Dashboard
            </span>
          </div>
        ) : (
          <BranchSwitcher />
        )}
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        {/* <SidebarNotification /> */}
        <NavUser user={formattedUser} role={user?.role} />
      </SidebarFooter>
    </Sidebar>
  );
}
