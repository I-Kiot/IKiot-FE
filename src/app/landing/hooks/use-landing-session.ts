"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/store/hooks/use-auth";
import { getHomeRoute } from "@/components/sidebar/utils/get-sidebar";

const noopSubscribe = () => () => {};

/**
 * Đọc user đã lưu (localStorage) để đổi nút "Đăng nhập / Đăng ký" thành "Vào trang quản lý".
 * Không gọi /auth/me vì trang landing công khai; `user` chỉ có sau khi mount để tránh lệch hydration.
 */
export function useLandingSession() {
  const { user, logout } = useAuth();
  // false khi render phía server và lúc hydrate, true ở client - không cần state + effect.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const session = mounted ? user : null;
  const displayName = session
    ? [session.profile?.lastName, session.profile?.firstName]
        .filter(Boolean)
        .join(" ")
        .trim() || session.phoneNumber
    : null;

  return {
    user: session,
    displayName,
    homeHref: getHomeRoute(session?.role),
    logout,
  };
}
