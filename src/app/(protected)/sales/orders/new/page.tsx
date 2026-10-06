"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { CreateOrderForm } from "./components/create-order-form";

/** D-2: create a manual order (`POST /orders`, contract §2). Needs `orders:create`. */
export default function CreateOrderPage() {
  const canCreate = allows(getSessionRole(), "orders", "create");

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Đơn hàng" },
          { label: "Danh sách đơn", href: "/sales/orders" },
          { label: "Tạo đơn" },
        ]}
        title="Tạo đơn hàng"
        description="Đơn tạo tay vào thẳng bước Xác nhận, chọn người phụ trách và thu cọc ngay trên form"
      />
      {canCreate ? (
        <CreateOrderForm />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền tạo đơn</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền tạo đơn hàng. Vui lòng liên hệ quản trị viên nếu bạn cần
            quyền này.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/sales/orders">Về danh sách đơn</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
