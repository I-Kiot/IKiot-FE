"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { ProductionDeliveriesTable } from "./components/production-deliveries-table";

/** Phiếu xưởng giao (2026-10-09): nơi nhận kiểm hàng xưởng báo giao rồi xác nhận (tăng tồn) hoặc từ chối. */
export default function ProductionDeliveriesPage() {
  const canView = allows(getSessionRole(), "production_requests", "read");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Phiếu xưởng giao" },
        ]}
        title="Phiếu xưởng giao"
        description="Xưởng báo giao hàng theo yêu cầu sản xuất. Kiểm hàng thực tế rồi xác nhận - lúc đó mới nhập kho và ghi công nợ xưởng."
        actions={
          <Button variant="outline" asChild>
            <Link href="/exchange/production-requests">Yêu cầu sản xuất</Link>
          </Button>
        }
      />
      {canView ? (
        // useSearchParams (thông báo dẫn tới kèm ?status=PENDING) cần Suspense boundary.
        <Suspense fallback={null}>
          <ProductionDeliveriesTable />
        </Suspense>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem phiếu xưởng giao. Vui lòng liên hệ quản trị viên
            nếu bạn cần truy cập.
          </p>
        </div>
      )}
    </div>
  );
}
