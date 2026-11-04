"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import Loading from "@/app/loading";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const authStatus = isAuthenticated();
    if (!authStatus) {
      router.push("/sign-in");
    } else {
      // Lấy profile mới nhất từ backend khi mount (vd. F5 reload)
      fetchMe()
        .then(() => {
          setAuthenticated(true);
          setIsChecking(false);
        })
        .catch((err) => {
          console.error("AuthGuard user fetch error:", err);
          setAuthenticated(true);
          setIsChecking(false);
        });
    }
  }, [router, fetchMe]);

  useEffect(() => {
    if (authenticated && user) {
      try {
        // Không join room ở đây nữa: backend tự đưa socket vào `user:<id>`, `tenant:<id>`, `admin` từ JWT đã xác thực lúc connect.
        // Server cũ cho client join room bất kỳ theo tên, kể cả "admin", nên socket có thể nghe broadcast dành cho vận hành.
        const { getSocket } = require("@/lib/socket");
        const socket = getSocket();

        if (user.role === "ADMIN") {
          
          // Lấy số thông báo chưa đọc và số ticket đang mở ban đầu
          const { useNotificationStore } = require("@/store/notification-store");
          useNotificationStore.getState().fetchUnreadCount();
          useNotificationStore.getState().fetchOpenTicketsCount();

          // Lắng nghe thông báo hệ thống mới để tăng số đếm
          const handleNewNotification = () => {
            useNotificationStore.getState().incrementUnreadCount();
          };
          socket.on("system-notification", handleNewNotification);

          // Lắng nghe cập nhật ticket để làm mới số ticket đang mở
          const handleTicketUpdate = () => {
            useNotificationStore.getState().fetchOpenTicketsCount();
          };
          socket.on("ticket-update", handleTicketUpdate);

          return () => {
            socket.off("system-notification", handleNewNotification);
            socket.off("ticket-update", handleTicketUpdate);
          };
        }
      } catch (err) {
        console.error("Socket room connection/join error:", err);
      }
    }
  }, [authenticated, user]);

  if (isChecking || !authenticated) {
    return <Loading />;
  }

  return <>{children}</>;
}
