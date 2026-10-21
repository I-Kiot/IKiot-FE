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

  // Paths that are always allowed for any authenticated user
  const publicProtectedRoutes = [
    "/settings",
    "/calendar",
    "/tasks",
    "/mail",
    "/faqs",
    "/pricing",
  ];

  // Check if current route is a public protected route
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

  // `/shipments/<id>` is where a shipment notification lands. It only looks the shipment up and
  // redirects (to /shipper for its driver, to /shipments for everyone else), and the API 404s one the
  // caller cannot see - so it must not need `shipments:read`, which a plain shipper does not hold.
  if (/^\/shipments\/[^/]+$/.test(pathname)) {
    return <>{children}</>;
  }

  // Same list the sidebar draws: account-kind config narrowed by this role's permissions.
  const allowedUrls = getAllowedSidebarUrls(user.role);

  // Perform prefix matching check
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
              {/* min-w-0: con của flex mặc định không hẹp hơn nội dung, nên bảng rộng sẽ đẩy cả trang
                  rộng ra thay vì cuộn ngang trong khung của nó. Nhánh sidebar bên phải dưới đây cũng vậy. */}
              <SidebarInset className="min-w-0">
                <PageFooterProvider>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
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
              <SidebarInset className="min-w-0">
                <PageFooterProvider>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
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
