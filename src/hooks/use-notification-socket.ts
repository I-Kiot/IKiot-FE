"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { onForegroundMessage } from "@/lib/fcm";
import { useNotificationInboxStore } from "@/store/notification-inbox-store";
import type { AppNotification } from "@/lib/api/notification";
import { useAuth } from "@/hooks/use-auth";

export function useNotificationSocket() {
  const { user } = useAuth();
  const receive = useNotificationInboxStore((state) => state.receive);

  useEffect(() => {
    if (!user?.id) return;

    // Room đã được AuthGuard join sẵn - ở đây chỉ lắng nghe.
    const socket = getSocket();

    const handle = (notification: AppNotification) => {
      receive(notification);
      toast.success(notification.title, {
        description: notification.description,
      });
    };

    socket.on("notification", handle);
    return () => {
      socket.off("notification", handle);
    };
  }, [user?.id, receive]);

  useEffect(() => {
    // Khi tab đang focus, service worker KHÔNG tự hiện popup (trình duyệt cố ý
    // nhường app tự quyết) → bắn toast. Nếu bỏ đoạn này, user đang mở app sẽ
    // không thấy gì cả.
    return onForegroundMessage((payload) => {
      toast.success(payload.notification?.title ?? "Thông báo", {
        description: payload.notification?.body,
      });
    });
  }, []);
}
