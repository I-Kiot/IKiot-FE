"use client";

import { PageHeader } from "@/components/page-header";
import { getSessionRole } from "@/lib/auth";
import { canAccessHrNavItem } from "@/app/(protected)/staffs/shared/nav-hr-permissions";
import { HolidaysButtonGroup } from "./components/holidays-button-group";
import { HolidaysDialogs } from "./components/holidays-dialogs";
import { HolidaysProvider } from "./components/holidays-provider";
import { HolidaysTable } from "./components/holidays-table";

export default function HolidaysPage() {
  const canManage = canAccessHrNavItem("holidays", getSessionRole());

  return (
    <HolidaysProvider enabled={canManage}>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Nhân viên", href: "/staffs" },
            { label: "Ngày lễ" },
          ]}
          title="Ngày lễ"
          actions={canManage ? <HolidaysButtonGroup /> : undefined}
        />

        {canManage ? (
          <HolidaysTable />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
            <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Chỉ chủ doanh nghiệp mới có quyền quản lý ngày lễ.
            </p>
          </div>
        )}
      </div>
      {canManage && <HolidaysDialogs />}
    </HolidaysProvider>
  );
}
