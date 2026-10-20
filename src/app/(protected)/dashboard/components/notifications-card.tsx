"use client";

// 4 thông báo mới nhất, đọc từ cùng kho với chuông thông báo trên header - đánh dấu đã đọc ở
// một chỗ thì chỗ kia cũng thấy, và socket đẩy thông báo mới vào cả hai.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationInboxStore } from "@/store/notification-inbox-store";
import type { AppNotification } from "@/lib/api/notification";
import { WidgetCard, WidgetMessage } from "./widget-card";

const SHOWN = 4;

export function NotificationsCard() {
  const router = useRouter();
  const items = useNotificationInboxStore((state) => state.items);
  const isLoading = useNotificationInboxStore((state) => state.isLoading);
  const fetchInbox = useNotificationInboxStore((state) => state.fetchInbox);
  const markAsRead = useNotificationInboxStore((state) => state.markAsRead);

  // Chuông trên header thường đã tải kho rồi; chỉ tải khi kho còn trống.
  useEffect(() => {
    if (useNotificationInboxStore.getState().items.length === 0) void fetchInbox();
  }, [fetchInbox]);

  const open = (notification: AppNotification) => {
    void markAsRead(notification.id);
    if (notification.link) router.push(notification.link);
  };

  let body;
  if (items.length === 0 && isLoading) {
    body = (
      <div className="space-y-3">
        {Array.from({ length: SHOWN }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  } else if (items.length === 0) {
    body = <WidgetMessage>Chưa có thông báo nào.</WidgetMessage>;
  } else {
    body = (
      <ul className="-mx-2 space-y-0.5">
        {items.slice(0, SHOWN).map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => open(notification)}
              className="flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
            >
              {/* Chấm chưa đọc đi kèm chữ đậm, không chỉ dựa vào màu. */}
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-orange-500"}`}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className={`line-clamp-1 text-sm ${notification.isRead ? "" : "font-semibold"}`}>
                  {notification.title}
                  {!notification.isRead && <span className="sr-only"> (chưa đọc)</span>}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{notification.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    // Không có "Xem tất cả": chưa có trang hộp thư riêng, danh sách đầy đủ nằm ở chuông trên header.
    <WidgetCard title="Thông báo" icon={Bell} tone="blue">
      {body}
    </WidgetCard>
  );
}
