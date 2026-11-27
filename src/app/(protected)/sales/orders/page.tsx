"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { OrdersProvider } from "./components/orders-provider";
import { OrdersTable } from "./components/orders-table";
import { OrdersCopyButton } from "./components/orders-copy-button";
import { OrdersImportDialog } from "./components/orders-import-dialog";

/** Danh sách hành trình đơn (D-1, `GET /orders`, contract §2); cùng quyền với mục sidebar. */
export default function OrdersPage() {
  const role = getSessionRole();
  const canView = allows(role, "orders", "read");
  const canCreate = allows(role, "orders", "create");
  const [importOpen, setImportOpen] = useState(false);

  return (
    // Provider bọc cả header; cần Suspense.
    <Suspense>
      <OrdersProvider enabled={canView}>
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
              <div className="flex items-center gap-2">
                <OrdersCopyButton />
                <PermissionButton
                  allowed={canCreate}
                  permission="orders:create"
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                >
                  <Upload className="size-4" />
                  Nhập file
                </PermissionButton>
                <PermissionButton allowed={canCreate} permission="orders:create" asChild>
                  <Link href="/sales/orders/new">
                    <Plus className="size-4" />
                    Tạo đơn
                  </Link>
                </PermissionButton>
              </div>
            }
          />
          {canView ? (
            <OrdersTable />
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
        {canCreate && <OrdersImportDialog open={importOpen} onOpenChange={setImportOpen} />}
      </OrdersProvider>
    </Suspense>
  );
}
