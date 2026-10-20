"use client";

import { useSyncExternalStore } from "react";
import { useAuth } from "@/store/hooks/use-auth";
import { getHomeRoute } from "@/components/sidebar/utils/get-sidebar";

const noopSubscribe = () => () => {};

/**
 * Người đang xem trang landing có đang đăng nhập không, để đổi nút "Đăng nhập / Đăng ký" thành
 * "Vào trang quản lý". Đọc user đã lưu (localStorage) - không gọi /auth/me: trang landing là trang
 * công khai, phiên hết hạn thì bấm vào sẽ được trang quản lý đưa về /sign-in như mọi khi.
 *
 * `user` chỉ có sau khi mount: lúc render phía server không có localStorage, đọc ngay sẽ lệch HTML
 * (hydration mismatch). Trước khi mount thì coi như chưa đăng nhập.
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
