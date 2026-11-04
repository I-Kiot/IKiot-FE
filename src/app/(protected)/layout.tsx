"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useTabBadge } from "@/hooks/use-tab-badge";
import { useAuthStore } from "@/store/auth-store";
import {
  canOpenCheckout,
  getAllowedSidebarUrls,
} from "@/components/sidebar/utils/get-sidebar";
import { UnauthorizedPage } from "@/components/unauthorized";
import { PageFooterProvider, PageFooterSlot } from "@/components/layouts/page-footer";

function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  // Các đường dẫn luôn được phép với mọi người đã đăng nhập
  const publicProtectedRoutes = [
    "/settings",
    "/calendar",
    "/tasks",
    "/mail",
    "/faqs",
    "/pricing",
  ];

  const isPublicProtected = publicProtectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isCheckout = pathname === "/check-out" || pathname.startsWith("/check-out/");
  if (isCheckout) {
    return canOpenCheckout(user.role) ? <>{children}</> : <UnauthorizedPage />;
  }

  if (isPublicProtected) {
    return <>{children}</>;
  }

  // `/shipments/<id>` là nơi thông báo đơn giao dẫn tới: route chỉ tra cứu rồi chuyển hướng (shipper sang /shipper, người khác sang /shipments).
  // API trả 404 với đơn không được xem, nên route không yêu cầu `shipments:read` (shipper thường không có quyền này).
  if (/^\/shipments\/[^/]+$/.test(pathname)) {
    return <>{children}</>;
  }

  // Cùng danh sách với sidebar: cấu hình theo loại tài khoản, thu hẹp theo quyền của role.
  const allowedUrls = getAllowedSidebarUrls(user.role);

  const isAllowed = allowedUrls.some(
    (allowedUrl) => pathname === allowedUrl || pathname.startsWith(allowedUrl + "/"),
  );

  if (!isAllowed) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useNotificationSocket();
  useTabBadge();
  const { config } = useSidebarConfig();
  const pathname = usePathname();
  // Cuộn xảy ra trong khung nội dung (không còn là cả cửa sổ), nên chuyển trang phải tự đưa nó về đầu.
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (pathname === "/check-out") {
    return (
      <AuthGuard>
        <RoutePermissionGuard>
          <div className="min-h-screen w-full bg-background">{children}</div>
        </RoutePermissionGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <RoutePermissionGuard>
        <SidebarProvider
          style={
            {
              "--sidebar-width": "16rem",
              "--sidebar-width-icon": "3rem",
              "--header-height": "calc(var(--spacing) * 14)",
            } as React.CSSProperties
          }
          className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
        >
          {config.side === "left" ? (
            <>
              <AppSidebar
                variant={config.variant}
                collapsible={config.collapsible}
                side={config.side}
              />
              {/* min-w-0: flex child mặc định không hẹp hơn nội dung; thiếu class này bảng rộng sẽ đẩy cả trang thay vì cuộn trong khung. */}
              <SidebarInset className="h-svh min-w-0 overflow-hidden">
                <PageFooterProvider>
                  <SiteHeader />
                  {/* Chỉ vùng này cuộn: header và chân trang (phân trang) đứng yên, thanh cuộn không lên tới header. */}
                  <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {children}
                      </div>
                    </div>
                  </div>
                  <PageFooterSlot />
                </PageFooterProvider>
              </SidebarInset>
            </>
          ) : (
            <>
              <SidebarInset className="h-svh min-w-0 overflow-hidden">
                <PageFooterProvider>
                  <SiteHeader />
                  {/* Chỉ vùng này cuộn: header và chân trang (phân trang) đứng yên, thanh cuộn không lên tới header. */}
                  <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {children}
                      </div>
                    </div>
                  </div>
                  <PageFooterSlot />
                </PageFooterProvider>
              </SidebarInset>
              <AppSidebar
                variant={config.variant}
                collapsible={config.collapsible}
                side={config.side}
              />
            </>
          )}
        </SidebarProvider>
      </RoutePermissionGuard>
    </AuthGuard>
  );
}
