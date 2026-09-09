"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useAuthStore } from "@/store/auth-store";
import { sidebarRoleConfig } from "@/components/sidebar/constants/sidebar-role";
import { type UserRole } from "@/components/sidebar/constants/types";
import { UnauthorizedPage } from "@/components/unauthorized";

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

  // Special handling for checkout (allowed for all except ADMIN)
  const isCheckout = pathname === "/check-out" || pathname.startsWith("/check-out/");
  if (isCheckout && user.role !== "ADMIN") {
    return <>{children}</>;
  }

  if (isPublicProtected) {
    return <>{children}</>;
  }

  // Get allowed URLs based on role config
  const roleConfig = sidebarRoleConfig[user.role as UserRole] || [];
  const allowedUrls: string[] = [];

  roleConfig.forEach((group) => {
    group.items.forEach((item) => {
      if (item.url && item.url !== "#" && !item.url.startsWith("/#")) {
        allowedUrls.push(item.url);
      }
      if (item.items) {
        item.items.forEach((subItem) => {
          if (subItem.url && subItem.url !== "#" && !subItem.url.startsWith("/#")) {
            allowedUrls.push(subItem.url);
          }
        });
      }
    });
  });

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
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                      {children}
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </>
          ) : (
            <>
              <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                  <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                      {children}
                    </div>
                  </div>
                </div>
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
