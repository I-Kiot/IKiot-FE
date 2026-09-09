"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationInboxStore } from "@/store/notification-inbox-store";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  variant?: "outline" | "ghost" | "default";
}

export function NotificationBell({
  variant = "outline",
}: NotificationBellProps) {
  const router = useRouter();
  const {
    items,
    unreadCount,
    fetchInbox,
    markAsRead,
    markAllAsRead,
    deleteOne,
    deleteAll,
  } = useNotificationInboxStore();

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const handleClick = async (
    id: string,
    link?: string,
    referenceId?: string,
  ) => {
    await markAsRead(id);
    if (link) {
      if ((link === "/tickets" || link === "/sales/invoices") && referenceId) {
        if (window.location.pathname === link) {
          window.dispatchEvent(
            new CustomEvent("open-item", {
              detail: { type: link, id: referenceId },
            }),
          );
        }
        router.push(`${link}?id=${referenceId}`);
      } else {
        router.push(link);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteOne(id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className="relative cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-5 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-semibold text-sm">Thông báo</span>
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
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  !item.isRead && "bg-muted/30",
                )}
              >
                <button
                  onClick={() =>
                    handleClick(item.id, item.link, item.referenceId)
                  }
                  className="flex w-full flex-col gap-1 text-left cursor-pointer"
                >
                  <div className="flex items-start gap-2 pr-7">
                    {!item.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </button>

                {/* Delete button - shows on row hover */}
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  title="Xóa thông báo này"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
