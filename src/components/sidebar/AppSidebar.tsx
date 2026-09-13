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

import { useAuthStore } from "@/store/auth-store";
import { getFilteredSidebar } from "./utils/get-sidebar";

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
    // Line one is the person's name, line two the phone number they sign in with -
    // phoneNumber is the required identifier on the backend User, email is optional.
    const name =
      [user.profile?.lastName, user.profile?.firstName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      user.email ||
      defaultUserData.name;
    return {
      name,
      email: user.phoneNumber || user.email || "",
      avatar: user.profile?.avatarUrl || "",
    };
  }, [user]);

  const navGroups = React.useMemo(
    () => getFilteredSidebar(user?.role),
    [user?.role],
  );

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
