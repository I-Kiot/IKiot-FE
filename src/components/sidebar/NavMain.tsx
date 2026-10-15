"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/notification-store";
import { useOrderAlertsStore } from "@/store/order-alerts-store";
import { useAuthStore } from "@/store/auth-store";
import { parseLocationKey } from "@/lib/location-key";
import { getSessionRole } from "@/lib/auth";
import { allows } from "@/components/sidebar/constants/role-permissions";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  label,
  items,
}: {
  label: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      isActive?: boolean;
    }[];
  }[];
}) {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const openTicketsCount = useNotificationStore((state) => state.openTicketsCount);

  const ORDERS_URL = "/sales/orders";
  const hasOrdersEntry = items.some((item) =>
    item.items?.some((subItem) => subItem.url === ORDERS_URL),
  );
  const orderAlerts = useOrderAlertsStore((state) => state.alerts);
  const fetchOrderAlerts = useOrderAlertsStore((state) => state.fetchAlerts);
  const locationKey = useAuthStore((state) => state.locationKey);
  const orderAlertCount = orderAlerts ? orderAlerts.short + orderAlerts.dueSoon : 0;

  // Refreshed on a minute's poll and whenever the user moves between pages, so the badge
  // follows a sale or a stock receipt without a socket event of its own.
  useEffect(() => {
    if (!hasOrdersEntry || !allows(getSessionRole(), "orders", "read")) return;
    const scope = parseLocationKey(locationKey);
    const branchId = scope?.locationType === "BRANCH" ? scope.locationId : undefined;
    void fetchOrderAlerts(branchId);
    const timer = setInterval(() => void fetchOrderAlerts(branchId), 60_000);
    return () => clearInterval(timer);
  }, [hasOrdersEntry, locationKey, pathname, fetchOrderAlerts]);

  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar-expanded-groups");
    if (saved) {
      try {
        setOpenStates(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleOpenChange = (title: string, open: boolean) => {
    const next = { ...openStates, [title]: open };
    setOpenStates(next);
    localStorage.setItem("sidebar-expanded-groups", JSON.stringify(next));
  };

  // Check if any subitem is active to determine if parent should be open
  const shouldBeOpen = (item: typeof items[0]) => {
    if (item.isActive) return true;
    return item.items?.some((subItem) => pathname === subItem.url) || false;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={shouldBeOpen(item)}
            {...(isMounted
              ? {
                  open:
                    openStates[item.title] !== undefined
                      ? openStates[item.title]
                      : shouldBeOpen(item),
                  onOpenChange: (open) => handleOpenChange(item.title, open),
                }
              : {})}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {orderAlertCount > 0 &&
                        item.items.some((subItem) => subItem.url === ORDERS_URL) && (
                          <TriangleAlert
                            className="ml-auto size-4 shrink-0 text-amber-500"
                            aria-label="Có đơn cần chú ý"
                          />
                        )}
                      <ChevronRight
                        className={`${
                          orderAlertCount > 0 && item.items.some((subItem) => subItem.url === ORDERS_URL)
                            ? "ml-2"
                            : "ml-auto"
                        } shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={pathname === subItem.url}>
                            <Link
                              href={subItem.url}
                              target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                              rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                            >
                              <span>{subItem.title}</span>
                              {subItem.url === ORDERS_URL && orderAlertCount > 0 && (
                                <TriangleAlert
                                className="ml-auto size-4 shrink-0 text-amber-500"
                                aria-label="Có đơn cần chú ý"
                              />
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={pathname === item.url}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.url === "/admin/system-notifications" && unreadCount > 0 && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    )}
                    {item.url === "/admin/tickets" && openTicketsCount > 0 && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    )}
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
