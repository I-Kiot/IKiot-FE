"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/notification-store";
import { useOrderAlertsStore } from "@/store/order-alerts-store";
import { useProductionListAlertsStore } from "@/store/production-list-alerts-store";
import { useReconcileAlertsStore } from "@/store/reconcile-alerts-store";
import { CountBadge } from "@/components/count-badge";
import { useAuthStore } from "@/store/auth-store";
import { parseLocationKey } from "@/lib/location-key";
import { getSessionRole } from "@/lib/auth";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { useLiveRefresh } from "@/hooks/use-live-refresh";
import type { ChangeResource } from "@/types/change-feed";

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

const ORDERS_URL = "/sales/orders";
const IMPORTS_URL = "/exchange/imports";
const RECONCILE_URL = "/reports/unreconciled";

/** Mục menu ứng với trang đang mở: url dài nhất là tiền tố của đường dẫn, để trang con (vd. `/cashflow/sepay`) vẫn sáng mục cha của nó. */
function activeMenuUrl(pathname: string, urls: string[]): string | undefined {
  let best: string | undefined;
  for (const url of urls) {
    if (!url.startsWith("/") || url === "/" || url === "/#") continue;
    const matches = pathname === url || pathname.startsWith(`${url}/`);
    if (matches && (!best || url.length > best.length)) best = url;
  }
  return best;
}
// Các bảng làm đổi số badge.
const ALERT_RESOURCES: readonly ChangeResource[] = [
  "orders",
  "inventories",
  "production-requests",
  "production-deliveries",
  "stock-movements",
  "shipments",
];

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
  const activeUrl = activeMenuUrl(
    pathname,
    items.flatMap((item) => [item.url, ...(item.items ?? []).map((subItem) => subItem.url)]),
  );
  const openTicketsCount = useNotificationStore((state) => state.openTicketsCount);

  const hasSubItem = (url: string) =>
    items.some((item) => item.items?.some((subItem) => subItem.url === url));
  const hasOrdersEntry = hasSubItem(ORDERS_URL);
  // Số mặt hàng cần đặt xưởng.
  const hasProductionNeedEntry = hasSubItem(IMPORTS_URL);
  // Số khoản tiền cần xử lý trên màn Đối soát tiền.
  const hasReconcileEntry = hasSubItem(RECONCILE_URL);
  const reconcileCount = useReconcileAlertsStore((state) => state.count) ?? 0;
  const fetchReconcileCount = useReconcileAlertsStore((state) => state.fetchCount);

  const orderAlerts = useOrderAlertsStore((state) => state.alerts);
  const fetchOrderAlerts = useOrderAlertsStore((state) => state.fetchAlerts);
  const productionNeedCount = useProductionListAlertsStore((state) => state.needCount) ?? 0;
  const fetchProductionNeed = useProductionListAlertsStore((state) => state.fetchNeed);
  const locationKey = useAuthStore((state) => state.locationKey);
  // Số đơn cần chú ý (thiếu hàng + sắp đến hạn + quá hạn lấy hàng).
  const orderAlertCount = orderAlerts ? orderAlerts.short + orderAlerts.dueSoon + orderAlerts.pickupOverdue : 0;

  // Số cảnh báo theo mục con, menu cha cộng mỗi loại một lần.
  const orderAlert = { key: "orders", count: orderAlertCount, label: `${orderAlertCount} đơn cần chú ý` };
  const productionNeedAlert = {
    key: "production-need",
    count: productionNeedCount,
    label: `${productionNeedCount} mặt hàng cần đặt xưởng`,
  };
  const reconcileAlert = {
    key: "reconcile",
    count: reconcileCount,
    label: `${reconcileCount} khoản tiền cần đối soát`,
  };
  const alertByUrl: Record<string, { key: string; count: number; label: string }> = {
    [ORDERS_URL]: orderAlert,
    [IMPORTS_URL]: productionNeedAlert,
    [RECONCILE_URL]: reconcileAlert,
  };

  // Tổng cảnh báo của các mục con trong một menu cha, mỗi loại cảnh báo tính một lần.
  function parentAlertCount(subItems: { url: string }[]): number {
    const counted = new Set<string>();
    let total = 0;
    for (const subItem of subItems) {
      const alert = alertByUrl[subItem.url];
      if (!alert || counted.has(alert.key)) continue;
      counted.add(alert.key);
      total += alert.count;
    }
    return total;
  }

  const refreshOrderAlerts = useCallback(() => {
    if (!hasOrdersEntry || !allows(getSessionRole(), "orders", "read")) return;
    const scope = parseLocationKey(locationKey);
    const branchId = scope?.locationType === "BRANCH" ? scope.locationId : undefined;
    void fetchOrderAlerts(branchId);
  }, [hasOrdersEntry, locationKey, fetchOrderAlerts]);

  const refreshProductionNeed = useCallback(() => {
    if (!hasProductionNeedEntry || !allows(getSessionRole(), "production_requests", "read")) return;
    void fetchProductionNeed();
  }, [hasProductionNeedEntry, fetchProductionNeed]);

  // `GET /stats/unreconciled` cần `reports:read`; theo chi nhánh đang chọn như màn Đối soát.
  const refreshReconcile = useCallback(() => {
    if (!hasReconcileEntry || !allows(getSessionRole(), "reports", "read")) return;
    const scope = parseLocationKey(locationKey);
    void fetchReconcileCount(scope?.locationType === "BRANCH" ? scope.locationId : undefined);
  }, [hasReconcileEntry, locationKey, fetchReconcileCount]);

  // Tải lại badge khi có thay đổi.
  useLiveRefresh({
    resources: ALERT_RESOURCES,
    enabled: hasOrdersEntry || hasProductionNeedEntry || hasReconcileEntry,
    onChange: () => {
      refreshOrderAlerts();
      refreshProductionNeed();
      refreshReconcile();
    },
  });

  useEffect(() => {
    refreshReconcile();
    const timer = setInterval(refreshReconcile, 60_000);
    return () => clearInterval(timer);
  }, [refreshReconcile, pathname]);

  // Poll mỗi phút và khi đổi trang.
  useEffect(() => {
    if (!hasOrdersEntry || !allows(getSessionRole(), "orders", "read")) return;
    const scope = parseLocationKey(locationKey);
    const branchId = scope?.locationType === "BRANCH" ? scope.locationId : undefined;
    void fetchOrderAlerts(branchId);
    const timer = setInterval(() => void fetchOrderAlerts(branchId), 60_000);
    return () => clearInterval(timer);
  }, [hasOrdersEntry, locationKey, pathname, fetchOrderAlerts]);

  // Cùng nhịp cho số mặt hàng cần đặt xưởng. `GET /production-list` cần `production_requests:read`.
  useEffect(() => {
    if (!hasProductionNeedEntry || !allows(getSessionRole(), "production_requests", "read")) return;
    void fetchProductionNeed();
    const timer = setInterval(() => void fetchProductionNeed(), 60_000);
    return () => clearInterval(timer);
  }, [hasProductionNeedEntry, locationKey, pathname, fetchProductionNeed]);

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

  const shouldBeOpen = (item: typeof items[0]) => {
    if (item.isActive) return true;
    return item.items?.some((subItem) => subItem.url === activeUrl) || false;
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
                      <CountBadge
                        className="ml-auto"
                        count={parentAlertCount(item.items)}
                        label={`${parentAlertCount(item.items)} mục cần chú ý`}
                      />
                      <ChevronRight
                        className={`${
                          parentAlertCount(item.items) > 0 ? "ml-2" : "ml-auto"
                        } shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={subItem.url === activeUrl}>
                            <Link
                              href={subItem.url}
                              target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                              rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                            >
                              <span>{subItem.title}</span>
                              {alertByUrl[subItem.url] && (
                                <CountBadge
                                  className="ml-auto"
                                  count={alertByUrl[subItem.url].count}
                                  label={alertByUrl[subItem.url].label}
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
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={item.url === activeUrl}>
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
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
