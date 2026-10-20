"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { useSalesBranch } from "@/app/(protected)/check-out/_hooks/use-sales-branch";
import { CreateOrderForm } from "./components/create-order-form";

/**
 * Tạo đơn hàng (đơn tay: đặt trước, giao tận nơi hoặc hẹn lấy). Màn riêng trong menu Đơn hàng từ 2026-10-16 -
 * trước đó là tab thứ hai của /check-out, cạnh bán tại quầy, và hai kiểu đơn dễ bị nhầm với nhau. /check-out
 * giờ chỉ còn bán tại quầy; link cũ `/check-out?mode=order` được chuyển về đây.
 */
function CreateOrderContent() {
  const sales = useSalesBranch();
  const canCreate = allows(getSessionRole(), "orders", "create");

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Đơn hàng", href: "/sales/orders" },
          { label: "Tạo đơn hàng" },
        ]}
        title="Tạo đơn hàng"
        description="Đơn đặt trước của khách: chọn người phụ trách, kho xuất từng dòng và hẹn ngày giao. Bán lấy ngay tại quầy dùng nút Bán tại quầy."
      />
      {canCreate ? (
        <CreateOrderForm sales={sales} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền tạo đơn</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền tạo đơn hàng. Vui lòng liên hệ quản trị viên nếu bạn cần quyền này.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/sales/orders">Về danh sách đơn</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CreateOrderPage() {
  // useSearchParams (inside CreateOrderForm, for `replacementFor`) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CreateOrderContent />
    </Suspense>
  );
}
