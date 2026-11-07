"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PermissionButton } from "@/components/permission-button";
import { Button } from "@/components/ui/button";
import { getSessionRole } from "@/lib/auth";
import {
  creatableInboundSources,
  resolveInboundSource,
  viewableInboundSources,
  type InboundSource,
} from "@/app/(protected)/exchange/shared/inbound-source";
import { ProductionRequestDetailDialog } from "@/app/(protected)/exchange/production-requests/components/production-request-detail-dialog";
import { ProductionRequestsTable } from "@/app/(protected)/exchange/production-requests/components/production-requests-table";
import type { ProductionRequest } from "@/types/order-flow";
import { CreateInboundDialog } from "./create-inbound-dialog";
import { ImportsProvider } from "./imports-provider";
import { ImportsTable } from "./imports-table";
import { InboundSourceToggle } from "./inbound-source-toggle";

const PAGE_DESCRIPTION: Record<InboundSource, string> = {
  SUPPLIER: "Mua hàng từ nhà cung cấp và nhận hàng về kho",
  WORKSHOP: "Đặt xưởng làm hàng, theo dõi và nhận hàng xưởng giao về",
};

/**
 * Màn Nhập hàng gộp hai nguồn. Toggle ở đầu trang chỉ đổi bảng đang xem; nút "Tạo mới" mở dialog có toggle riêng.
 * URL (`?source=`) là nơi duy nhất giữ nguồn đang xem, nên link từ nơi khác và tải lại trang đều mở đúng bảng.
 */
export function ImportsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const role = getSessionRole();
  const viewable = viewableInboundSources(role);
  const creatable = creatableInboundSources(role);
  const source = resolveInboundSource(params.get("source"), viewable);

  const [creating, setCreating] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  // YCSX vừa tạo mở chi tiết ngay để bấm "Đã gửi xưởng", như màn yêu cầu sản xuất trước khi gộp.
  const [createdRequest, setCreatedRequest] = useState<ProductionRequest | null>(null);

  if (!source) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[
            { label: "Trang chủ", href: "/dashboard" },
            { label: "Giao dịch" },
            { label: "Nhập hàng" },
          ]}
          title="Nhập hàng"
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Tài khoản của bạn không có quyền xem nhập hàng. Vui lòng liên hệ quản trị viên nếu bạn
            cần truy cập.
          </p>
        </div>
      </div>
    );
  }

  function showSource(next: InboundSource) {
    router.replace(`${pathname}?source=${next}`, { scroll: false });
  }

  const reloadTable = () => setRefreshSignal((n) => n + 1);

  // Toggle trong dialog mặc định theo bảng đang xem, nếu tài khoản được tạo loại đó.
  const defaultCreateSource = creatable.includes(source) ? source : creatable[0];

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Nhập hàng" },
        ]}
        title="Nhập hàng"
        description={PAGE_DESCRIPTION[source]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {source === "WORKSHOP" && (
              <Button variant="outline" asChild>
                <Link href="/exchange/production-list">Danh sách cần sản xuất</Link>
              </Button>
            )}
            <PermissionButton
              allowed={creatable.length > 0}
              permission={source === "SUPPLIER" ? "stock_movement:create" : "production_requests:create"}
              className="cursor-pointer"
              onClick={() => setCreating(true)}
            >
              <Plus className="size-4" />
              Tạo mới
            </PermissionButton>
          </div>
        }
      />

      <InboundSourceToggle value={source} options={viewable} onChange={showSource} />

      {/* Mỗi lúc chỉ mount một bảng: bảng kia không gọi API nó có thể không có quyền, và response muộn của nó không còn ai nhận. */}
      {source === "SUPPLIER" ? (
        <ImportsProvider refreshSignal={refreshSignal}>
          <ImportsTable />
        </ImportsProvider>
      ) : (
        <ProductionRequestsTable refreshSignal={refreshSignal} />
      )}

      {creating && (
        <CreateInboundDialog
          defaultSource={defaultCreateSource}
          options={creatable}
          onOpenChange={setCreating}
          onImportCreated={() => {
            setCreating(false);
            showSource("SUPPLIER");
            reloadTable();
          }}
          onRequestCreated={(created) => {
            setCreating(false);
            setCreatedRequest(created);
            showSource("WORKSHOP");
            reloadTable();
          }}
        />
      )}
      <ProductionRequestDetailDialog
        key={
          createdRequest
            ? `${createdRequest.id}:${createdRequest.status}:${createdRequest.updatedAt}`
            : "none"
        }
        request={createdRequest}
        onOpenChange={(open) => {
          if (!open) setCreatedRequest(null);
        }}
        onChanged={(updated) => {
          setCreatedRequest(updated);
          reloadTable();
        }}
        onDeleted={() => {
          setCreatedRequest(null);
          reloadTable();
        }}
      />
    </div>
  );
}
