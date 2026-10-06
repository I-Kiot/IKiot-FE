"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { OrdersProvider } from "./components/orders-provider";
import { OrdersTable } from "./components/orders-table";

/** D-1: the order-journey list (`GET /orders`, contract §2). Same permission as its sidebar entry. */
export default function OrdersPage() {
  const role = getSessionRole();
  const canView = allows(role, "orders", "read");
  const canCreate = allows(role, "orders", "create");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Đơn hàng" },
          { label: "Danh sách đơn" },
        ]}
        title="Đơn hàng"
        description="Theo dõi đơn theo trạng thái, mức ưu tiên và tình trạng hàng trên kệ"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/sales/orders/new">
                <Plus className="size-4" />
                Tạo đơn
              </Link>
            </Button>
          ) : undefined
        }
      />
      {canView ? (
        <OrdersProvider>
          <OrdersTable />
        </OrdersProvider>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem đơn hàng. Vui lòng liên hệ quản trị viên
            nếu bạn cần truy cập.
          </p>
        </div>
      )}
    </div>
  );
}
