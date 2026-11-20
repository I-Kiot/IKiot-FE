"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotificationStore } from "@/store/notification-store";
import { useOrderAlertsStore } from "@/store/order-alerts-store";
import { useProductionListAlertsStore } from "@/store/production-list-alerts-store";
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
// Bảng làm đổi số badge: đơn, tồn kho (thiếu/đủ hàng), YCSX + phiếu nhận xưởng, phiếu chuyển kho, vận đơn. Không truyền `ids` nên không toast.
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
  const openTicketsCount = useNotificationStore((state) => state.openTicketsCount);

  const hasSubItem = (url: string) =>
    items.some((item) => item.items?.some((subItem) => subItem.url === url));
  const hasOrdersEntry = hasSubItem(ORDERS_URL);
  // Số mặt hàng cần đặt xưởng hiện ở mục danh sách nhập hàng (popup "Danh sách cần sản xuất" nằm trong màn đó).
  const hasProductionNeedEntry = hasSubItem(IMPORTS_URL);

  const orderAlerts = useOrderAlertsStore((state) => state.alerts);
  const fetchOrderAlerts = useOrderAlertsStore((state) => state.fetchAlerts);
  const productionNeedCount = useProductionListAlertsStore((state) => state.needCount) ?? 0;
  const fetchProductionNeed = useProductionListAlertsStore((state) => state.fetchNeed);
  const locationKey = useAuthStore((state) => state.locationKey);
  // Số đơn cần chú ý (thiếu hàng + sắp đến hạn + quá hạn lấy hàng).
  const orderAlertCount = orderAlerts ? orderAlerts.short + orderAlerts.dueSoon + orderAlerts.pickupOverdue : 0;

  // Số cảnh báo theo mục con: badge đỏ hiện ở mục con đó và ở menu cha chứa nó.
  // `key` là loại cảnh báo: nếu một loại hiện ở nhiều mục con thì menu cha chỉ cộng một lần.
  const orderAlert = { key: "orders", count: orderAlertCount, label: `${orderAlertCount} đơn cần chú ý` };
  const productionNeedAlert = {
    key: "production-need",
    count: productionNeedCount,
    label: `${productionNeedCount} mặt hàng cần đặt xưởng`,
  };
  const alertByUrl: Record<string, { key: string; count: number; label: string }> = {
    [ORDERS_URL]: orderAlert,
    [IMPORTS_URL]: productionNeedAlert,
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

  // Realtime: sự kiện của người khác + tín hiệu ghi của chính tab này (xem `notifyLocalMutation`). Poll bên dưới là dự phòng.
  useLiveRefresh({
    resources: ALERT_RESOURCES,
    enabled: hasOrdersEntry || hasProductionNeedEntry,
    onChange: () => {
      refreshOrderAlerts();
      refreshProductionNeed();
    },
  });

  // Làm mới khi poll mỗi phút và khi đổi trang, để badge theo kịp đơn bán và phiếu nhập kho mà không cần socket riêng.
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
                          <SidebarMenuSubButton asChild className="cursor-pointer" isActive={pathname === subItem.url}>
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
                <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={pathname === item.url}>
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
