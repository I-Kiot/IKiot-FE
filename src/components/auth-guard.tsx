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
      // Fetch latest profile from backend on mount (e.g. F5 refresh)
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
        // Rooms are no longer joined from here. The backend puts the socket into
        // `user:<id>`, `tenant:<id>` and `admin` itself, from the JWT it verified on
        // connect - the old server let any client join any room by name, including
        // "admin", so this was also how a socket could subscribe to broadcasts meant for
        // the operators.
        const { getSocket } = require("@/lib/socket");
        const socket = getSocket();

        if (user.role === "ADMIN") {
          
          // Fetch initial unread count & open tickets count
          const { useNotificationStore } = require("@/store/notification-store");
          useNotificationStore.getState().fetchUnreadCount();
          useNotificationStore.getState().fetchOpenTicketsCount();

          // Listen for new system notifications to increment count
          const handleNewNotification = () => {
            useNotificationStore.getState().incrementUnreadCount();
          };
          socket.on("system-notification", handleNewNotification);

          // Listen for ticket updates to refresh open tickets count
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
