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
  /** Chi tiết đơn có sẵn, bỏ trống thì tải lúc bấm. */
  order?: OrderDetail;
  locationId?: string;
};

/** Nút "Tạo YCSX" trên đơn, điền sẵn các dòng thiếu. */
export function CreateProductionRequestButton({ orderId, order }: Props) {
  // Dòng và nơi nhận điền sẵn cho popup; null = popup đóng.
  const [prefill, setPrefill] = React.useState<{ lines: DraftLine[]; locationId: string | undefined } | null>(null);
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

  // Mọi dòng thiếu đã có YCSX che đủ thì khoá nút.
  const coverage = order ? productionCoverageOf(order) : null;

  function openWith(detail: OrderDetail) {
    const detailCoverage = productionCoverageOf(detail);
    if (detailCoverage.fullyCovered) {
      toast.info(coveredMessage(detailCoverage.messages));
      return;
    }
    const prefill = productionPrefillOf(detail);
    if (prefill.notManufacturableCount > 0) {
      toast.info(`${prefill.notManufacturableCount} mặt hàng thiếu phải nhập từ NCC`);
    }
    if (prefill.skipped.length > 0) {
      toast.info(`Bỏ qua: ${prefill.skipped.join("; ")}`);
    }
    setPrefill({ lines: prefill.lines, locationId: prefill.locationId });
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
        <TooltipContent>{coveredMessage(coverage.messages)}</TooltipContent>
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

      {prefill && (
        <CreateInboundDialog
          defaultSource="WORKSHOP"
          options={creatable}
          initialRequestLines={prefill.lines}
          initialRequestLocationId={prefill.locationId}
          onOpenChange={(open) => {
            if (!open) setPrefill(null);
          }}
          onImportCreated={() => setPrefill(null)}
          onRequestCreated={() => setPrefill(null)}
        />
      )}
    </>
  );
}
