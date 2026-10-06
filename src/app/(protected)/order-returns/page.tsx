"use client";

import { PageHeader } from "@/components/page-header";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { ReturnsTable } from "./components/returns-table";

/** D-6: return orders (`/order-returns`, contract §5). Same permission as its sidebar entry. */
export default function OrderReturnsPage() {
  const canView = allows(getSessionRole(), "returns", "read");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Đơn hàng" },
          { label: "Hoàn hàng" },
        ]}
        title="Hoàn hàng"
        description="Tạo đơn hoàn và kiểm từng dòng hàng trả về"
      />
      {canView ? (
        <ReturnsTable />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem đơn hoàn. Vui lòng liên hệ quản trị viên nếu bạn
            cần truy cập.
          </p>
        </div>
      )}
    </div>
  );
}
