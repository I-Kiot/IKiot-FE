"use client";

import { useRouter, usePathname } from "next/navigation";
import { Bell, CreditCard, Landmark, LifeBuoy, Trash2, UserPlus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SystemNotification } from "@/lib/api/notification";
import { useNotificationStore } from "@/store/notification-store";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, { icon: typeof Bell; className: string }> = {
  SYSTEM_TRANSACTION: { icon: CreditCard, className: "bg-emerald-500/10 text-emerald-500" },
  SYSTEM_TENANT_CREATED: { icon: UserPlus, className: "bg-blue-500/10 text-blue-500" },
  SYSTEM_TICKET_CREATED: { icon: LifeBuoy, className: "bg-amber-500/10 text-amber-500" },
  SYSTEM_TENANT_BANK_UPDATED: { icon: Landmark, className: "bg-violet-500/10 text-violet-500" },
};
const DEFAULT_ICON = { icon: Bell, className: "bg-zinc-500/10 text-zinc-500" };

/**
 * Chuông thông báo hệ thống của ADMIN, cùng dáng với `NotificationBell` của shop. Thay cho màn
 * `/admin/system-notifications` cũ; dữ liệu nằm ở `useNotificationStore` (auth-guard tải lần đầu và nghe socket).
 */
export function AdminNotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const { items, unreadCount, markAsRead, markAllAsRead, deleteOne, deleteAll } =
    useNotificationStore();

  const open = async (notif: SystemNotification) => {
    if (!notif.isRead) await markAsRead(notif.id);
    if (notif.type === "SYSTEM_TICKET_CREATED" && notif.referenceId) {
      if (pathname === "/admin/tickets") {
        window.dispatchEvent(
          new CustomEvent("open-item", {
            detail: { type: "/admin/tickets", id: notif.referenceId },
          }),
        );
      }
      router.push(`/admin/tickets?ticketId=${notif.referenceId}`);
    } else if (notif.type === "SYSTEM_TENANT_CREATED" && notif.referenceId) {
      router.push(`/admin/users?tenantId=${notif.referenceId}`);
    } else if (notif.type === "SYSTEM_TRANSACTION") {
      router.push("/admin/transactions");
    } else if (notif.type === "SYSTEM_TENANT_BANK_UPDATED") {
      router.push("/admin/sepay");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative cursor-pointer">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo hệ thống</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">Thông báo hệ thống</span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-auto p-1 cursor-pointer"
              >
                Đánh dấu đã đọc tất cả
              </Button>
            )}
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAll()}
                className="text-xs h-auto p-1 cursor-pointer text-muted-foreground hover:text-destructive"
                title="Xóa tất cả thông báo"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Chưa có thông báo nào
            </p>
          ) : (
            items.map((item) => {
              const { icon: Icon, className } = TYPE_ICON[item.type] ?? DEFAULT_ICON;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group relative border-b px-4 py-3 transition-colors hover:bg-muted/50",
                    !item.isRead && "bg-muted/30",
                  )}
                >
                  <button
                    onClick={() => open(item)}
                    className="flex w-full items-start gap-3 pr-7 text-left cursor-pointer"
                  >
                    <div className={cn("rounded-lg p-1.5 shrink-0", className)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex items-start gap-2">
                        {!item.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => deleteOne(item.id)}
                    className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                    title="Xóa thông báo này"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
