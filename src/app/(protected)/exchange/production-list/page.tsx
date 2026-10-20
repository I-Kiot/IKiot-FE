"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { ProductionListTable } from "./components/production-list-table";

/** B-4 · B-6: the production list (`/exchange/production-list`, contract §3) - what has to be made. Shortage notifications link here. */
export default function ProductionListPage() {
  const canView = allows(getSessionRole(), "production_requests", "read");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Danh sách cần sản xuất" },
        ]}
        title="Danh sách cần sản xuất"
        description="Hàng các đơn đang cần mà tồn kho và hàng đã đặt xưởng chưa đủ - tính tại thời điểm xem"
        actions={
          <Button variant="outline" asChild>
            <Link href="/exchange/production-requests">Yêu cầu sản xuất</Link>
          </Button>
        }
      />
      {canView ? (
        // useSearchParams (a notification's locationId / productItemId) needs a Suspense boundary.
        <Suspense fallback={null}>
          <ProductionListTable />
        </Suspense>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem danh sách cần sản xuất. Vui lòng liên hệ quản trị
            viên nếu bạn cần truy cập.
          </p>
        </div>
      )}
    </div>
  );
}
