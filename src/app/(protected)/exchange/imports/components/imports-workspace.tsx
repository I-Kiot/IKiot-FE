"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PermissionButton } from "@/components/permission-button";
import { CountBadge } from "@/components/count-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSessionRole } from "@/lib/auth";
import { productionRequestApi } from "@/lib/api/production-request";
import { useProductionListAlertsStore } from "@/store/production-list-alerts-store";
import {
  creatableInboundSources,
  resolveInboundSource,
  viewableInboundSources,
  type InboundSource,
} from "@/app/(protected)/exchange/shared/inbound-source";
import { ProductionRequestDetailDialog } from "@/app/(protected)/exchange/production-requests/components/production-request-detail-dialog";
import { ProductionRequestsTable } from "@/app/(protected)/exchange/production-requests/components/production-requests-table";
import { ProductionListTable } from "@/app/(protected)/exchange/production-requests/components/production-list-table";
import type { ProductionRequest } from "@/types/order-flow";
import { ImportsProvider } from "./imports-provider";
import { ImportsTable } from "./imports-table";
import { InboundSourceToggle } from "./inbound-source-toggle";

const PAGE_DESCRIPTION: Record<InboundSource, string> = {
  SUPPLIER: "Mua hàng từ nhà cung cấp và nhận hàng về kho",
  WORKSHOP: "Đặt xưởng làm hàng, theo dõi, nhận hoặc từ chối hàng xưởng giao về",
};

/**
 * Màn Nhập hàng gộp hai nguồn. Toggle ở đầu trang chỉ đổi bảng đang xem; nút "Tạo mới" sang trang `/exchange/imports/new`.
 * URL (`?source=`) là nơi duy nhất giữ nguồn đang xem, nên link từ nơi khác và tải lại trang đều mở đúng bảng.
 * `?requestId=` (trang tạo mới chuyển về sau khi tạo YCSX) mở chi tiết YCSX đó một lần rồi bị xoá khỏi URL.
 */
export function ImportsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const role = getSessionRole();
  const viewable = viewableInboundSources(role);
  const creatable = creatableInboundSources(role);
  const source = resolveInboundSource(params.get("source"), viewable);
  const openRequestId = params.get("requestId");
  // `?productionList=1`: link cũ `/exchange/production-list` (thông báo thiếu hàng) được chuyển về đây để mở popup.
  // Chỉ khi xem được bảng Xưởng, vì popup gọi API cần cùng quyền.
  const productionListFromUrl = params.get("productionList") === "1" && viewable.includes("WORKSHOP");

  const [refreshSignal, setRefreshSignal] = useState(0);
  // YCSX đang mở chi tiết (vừa tạo xong ở trang tạo mới).
  const [openedRequest, setOpenedRequest] = useState<ProductionRequest | null>(null);
  const [showingProductionList, setShowingProductionList] = useState(false);
  const productionNeedCount = useProductionListAlertsStore((state) => state.needCount) ?? 0;

  // Mở chi tiết YCSX theo `?requestId=`. Tải lỗi (đã xoá, không có quyền) thì chỉ bỏ qua.
  // Response muộn của một id cũ (người dùng đã rời đi) bị bỏ nhờ cờ `stale`.
  useEffect(() => {
    if (!openRequestId) return;
    let stale = false;
    productionRequestApi
      .getById(openRequestId)
      .then((request) => {
        if (!stale) setOpenedRequest(request);
      })
      .catch(() => undefined);
    // Xoá `requestId` để tải lại trang không mở lại dialog.
    router.replace(`${pathname}?source=WORKSHOP`, { scroll: false });
    return () => {
      stale = true;
    };
  }, [openRequestId, pathname, router]);

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
  const productionListOpen = showingProductionList || productionListFromUrl;

  // Trang tạo mới mặc định theo bảng đang xem, nếu tài khoản được tạo loại đó.
  const createSource = creatable.includes(source) ? source : creatable[0];

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
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowingProductionList(true)}
              >
                Danh sách cần sản xuất
                <CountBadge
                  count={productionNeedCount}
                  label={`${productionNeedCount} mặt hàng cần đặt xưởng`}
                />
              </Button>
            )}
            <PermissionButton
              allowed={creatable.length > 0}
              permission={source === "SUPPLIER" ? "stock_movement:create" : "production_requests:create"}
              className="cursor-pointer"
              onClick={() => router.push(`/exchange/imports/new?source=${createSource}`)}
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

      {/* Danh sách cần sản xuất chỉ còn dạng popup (trang riêng đã bỏ). Mở bằng nút, hoặc bằng `?productionList=1` trên URL. */}
      <Dialog
        open={productionListOpen}
        onOpenChange={(open) => {
          if (open) return;
          setShowingProductionList(false);
          // Bỏ cờ và bộ lọc của link thông báo khỏi URL, để tải lại trang không mở lại popup.
          if (productionListFromUrl) router.replace(`${pathname}?source=WORKSHOP`, { scroll: false });
          // Trong popup có thể đã thêm hàng vào YCSX: tải lại bảng khi đóng.
          reloadTable();
        }}
      >
        <DialogContent className="flex max-h-[94vh] flex-col sm:max-w-[min(1400px,96vw)]">
          <DialogHeader>
            <DialogTitle>Danh sách cần sản xuất</DialogTitle>
            <DialogDescription>
              Hàng các đơn đang cần mà tồn kho và hàng đã đặt xưởng chưa đủ - tính tại thời điểm xem
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Mount lúc mở: bảng đọc `locationId` / `productItemId` trên URL lúc khởi tạo. */}
            {productionListOpen && <ProductionListTable />}
          </div>
        </DialogContent>
      </Dialog>

      <ProductionRequestDetailDialog
        key={
          openedRequest
            ? `${openedRequest.id}:${openedRequest.status}:${openedRequest.updatedAt}`
            : "none"
        }
        request={openedRequest}
        onOpenChange={(open) => {
          if (!open) setOpenedRequest(null);
        }}
        onChanged={(updated) => {
          setOpenedRequest(updated);
          reloadTable();
        }}
        onDeleted={() => {
          setOpenedRequest(null);
          reloadTable();
        }}
      />
    </div>
  );
}
