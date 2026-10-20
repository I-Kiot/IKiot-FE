"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { ProductionRequestsTable } from "./components/production-requests-table";

/** B-6: production requests (`/exchange/production-requests`, contract §3). Same permission as its sidebar entry. */
export default function ProductionRequestsPage() {
  const canView = allows(getSessionRole(), "production_requests", "read");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Yêu cầu sản xuất" },
        ]}
        title="Yêu cầu sản xuất"
        description="Đặt xưởng làm hàng, theo dõi và nhận hàng xưởng giao về"
        actions={
          <Button variant="outline" asChild>
            <Link href="/exchange/production-list">Danh sách cần sản xuất</Link>
          </Button>
        }
      />
      {canView ? (
        <ProductionRequestsTable />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem yêu cầu sản xuất. Vui lòng liên hệ quản trị viên
            nếu bạn cần truy cập.
          </p>
        </div>
      )}
    </div>
  );
}
