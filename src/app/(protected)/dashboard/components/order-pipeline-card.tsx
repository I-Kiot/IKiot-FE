"use client";

// Tình trạng đơn đang chạy (đếm tại thời điểm xem, không theo kỳ). Mỗi dòng mở thẳng danh sách
// đã lọc tương ứng.

import { useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, ClipboardList, PackageCheck, Truck, TriangleAlert, Boxes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { statsApi, type OrderPipelineKey } from "@/lib/api/stats";
import { formatNumber } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { WidgetCard, WidgetMessage } from "./widget-card";
import { TONE_TEXT, TONE_TILE, type Tone } from "../shared/tones";

interface StageDisplay {
  label: string;
  icon: LucideIcon;
  tone: Tone;
  /** Danh sách đã lọc mà dòng này mở ra. */
  href: string;
}

/**
 * "Đang giao" gom PICKED_UP + SHIPPING nhưng danh sách đơn chỉ lọc được một trạng thái, nên nó mở
 * SHIPPING - phần lớn của nhóm. "Giao thất bại" không phải trạng thái đơn mà là chuyến giao FAILED,
 * nên nó mở màn Giao hàng.
 */
const STAGE_DISPLAY: Record<OrderPipelineKey, StageDisplay> = {
  PENDING_CONFIRMATION: { label: "Chờ xác nhận", icon: ClipboardList, tone: "amber", href: "/sales/orders?status=PENDING_CONFIRMATION" },
  PROCESSING: { label: "Đang xử lý / đóng gói", icon: Boxes, tone: "violet", href: "/sales/orders?status=CONFIRMED" },
  AWAITING_SHIPMENT: { label: "Chờ vận chuyển", icon: PackageCheck, tone: "blue", href: "/sales/orders?status=PACKED" },
  SHIPPING: { label: "Đang giao", icon: Truck, tone: "emerald", href: "/sales/orders?status=SHIPPING" },
  DELIVERY_FAILED: { label: "Giao thất bại / cần xử lý", icon: TriangleAlert, tone: "red", href: "/shipments?tab=shipments&status=FAILED" },
};

export function OrderPipelineCard() {
  const { branchId, liveVersion } = useOverview();
  const load = useCallback(() => statsApi.getOrderPipeline({ branchId }), [branchId]);
  const { data, isLoading, failed } = useAsyncData(load, liveVersion);

  let body: ReactNode;
  if (!data && isLoading) {
    body = (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    );
  } else if (!data || failed) {
    body = <WidgetMessage>Không tải được tình trạng đơn.</WidgetMessage>;
  } else {
    body = (
      <ul className={`-mx-2 space-y-0.5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        {data.stages.map((stage) => {
          const display = STAGE_DISPLAY[stage.key];
          const Icon = display.icon;
          // Đơn giao thất bại là việc gấp: có thì tô đỏ con số.
          const urgent = stage.key === "DELIVERY_FAILED" && stage.count > 0;
          return (
            <li key={stage.key}>
              <Link
                href={display.href}
                className="group flex min-h-11 items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`${display.label}: ${stage.count} đơn - xem danh sách`}
              >
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${TONE_TILE[display.tone]}`}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 text-sm">{display.label}</span>
                <span className={`text-base font-semibold tabular-nums ${urgent ? TONE_TEXT.red : ""}`}>
                  {formatNumber(stage.count)}
                </span>
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <WidgetCard title="Tình trạng đơn hàng" icon={ClipboardCheck} tone="orange" viewAll={{ href: "/sales/orders" }}>
      {body}
    </WidgetCard>
  );
}
