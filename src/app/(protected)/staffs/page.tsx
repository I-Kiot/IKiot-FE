"use client";

import { getSessionRole } from "@/lib/auth";
import { canViewStaff } from "@/components/sidebar/constants/role-permissions";
import { StaffsButtonGroup } from "./components/staffs-button-group";
import { StaffsDialogs } from "./components/staffs-dialogs";
import { StaffsProvider } from "./components/staffs-provider";
import { StaffsTable } from "./components/staffs-table";

import { PageHeader } from "@/components/page-header";

function StaffsPageContent() {
  const canView = canViewStaff(getSessionRole());

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-sm">
          Tài khoản của bạn không có quyền xem module nhân viên. Vui lòng liên hệ
          quản trị viên nếu bạn cần truy cập.
        </p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Nhân viên" },
          { label: "Danh sách" },
        ]}
        title="Nhân viên"
        actions={<StaffsButtonGroup />}
      />
      <StaffsTable />
    </>
  );
}

export default function StaffsPage() {
  const canView = canViewStaff(getSessionRole());

  return (
    <StaffsProvider enabled={canView}>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <StaffsPageContent />
      </div>
      {canView && <StaffsDialogs />}
    </StaffsProvider>
  );
}
