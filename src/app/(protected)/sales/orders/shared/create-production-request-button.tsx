"use client";

import * as React from "react";
import { Factory, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { warnNoPermission } from "@/components/permission-button";
import { CreateInboundDialog } from "@/app/(protected)/exchange/imports/components/create-inbound-dialog";
import { creatableInboundSources } from "@/app/(protected)/exchange/shared/inbound-source";
import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import { orderJourneyApi } from "@/lib/api/order-journey";
import { getSessionRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { OrderDetail } from "@/types/order-flow";
import { coveredMessage, productionCoverageOf, productionPrefillOf } from "./production-prefill";

type Props = {
  orderId: string;
  /**
   * Chi tiết đơn đang có sẵn (màn chi tiết). Bỏ trống thì tải `GET /orders/:id` lúc bấm (danh sách đơn):
   * dòng của danh sách không có customization / isManufacturable, và số thiếu lúc tải danh sách có thể đã cũ.
   */
  order?: OrderDetail;
};

/**
 * Nút "Tạo YCSX" trên một đơn: mở popup "Tạo mới" của màn Nhập hàng ở nguồn Xưởng,
 * điền sẵn các dòng đang thiếu hàng của đơn (người dùng vẫn sửa được). Vẫn đổi qua Nhà cung cấp được.
 */
export function CreateProductionRequestButton({ orderId, order }: Props) {
  const [initialLines, setInitialLines] = React.useState<DraftLine[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Kết quả tải chi tiết về sau khi nút đã unmount (panel đóng) thì bỏ qua.
  const alive = React.useRef(true);
  React.useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Cùng luật quyền với nút "Tạo mới" ở màn Nhập hàng.
  const creatable = creatableInboundSources(getSessionRole());
  const canCreateRequest = creatable.includes("WORKSHOP");

  // Mọi dòng thiếu đã có YCSX mở che đủ: nút khoá, đặt thêm sẽ bị BE từ chối (PRODUCTION_EXCEEDS_ORDER_SHORTAGE).
  const coverage = order ? productionCoverageOf(order) : null;

  function openWith(detail: OrderDetail) {
    const detailCoverage = productionCoverageOf(detail);
    if (detailCoverage.fullyCovered) {
      toast.info(coveredMessage(detailCoverage.codes));
      return;
    }
    const prefill = productionPrefillOf(detail);
    if (prefill.notManufacturableCount > 0) {
      toast.info(`${prefill.notManufacturableCount} mặt hàng thiếu phải nhập từ NCC`);
    }
    setInitialLines(prefill.lines);
  }

  async function handleClick() {
    if (!canCreateRequest) {
      warnNoPermission("production_requests:create");
      return;
    }
    if (order) {
      openWith(order);
      return;
    }
    setLoading(true);
    try {
      const detail = await orderJourneyApi.getById(orderId);
      if (alive.current) openWith(detail);
    } catch {
      if (alive.current) toast.error("Không tải được chi tiết đơn hàng");
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  if (coverage?.fullyCovered) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Nút disabled không nhận hover, nên tooltip gắn vào span bao ngoài. */}
          <span tabIndex={0} className="inline-flex">
            <Button variant="outline" size="sm" disabled className="pointer-events-none">
              <Factory />
              Tạo YCSX
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>{coveredMessage(coverage.codes)}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn("cursor-pointer", !canCreateRequest && "opacity-50")}
        disabled={loading}
        onClick={() => void handleClick()}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Factory />}
        Tạo YCSX
      </Button>

      {initialLines && (
        <CreateInboundDialog
          defaultSource="WORKSHOP"
          options={creatable}
          initialRequestLines={initialLines}
          onOpenChange={(open) => {
            if (!open) setInitialLines(null);
          }}
          onImportCreated={() => setInitialLines(null)}
          onRequestCreated={() => setInitialLines(null)}
        />
      )}
    </>
  );
}
