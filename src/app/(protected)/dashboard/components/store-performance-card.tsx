"use client";

// Hiệu suất cửa hàng trong kỳ, tính từ các đơn tạo trong kỳ (mọi trạng thái): tỷ lệ hoàn thành,
// huỷ, hoàn hàng. Thay cho "tỷ lệ phản hồi / đánh giá shop" ở ảnh thiết kế - hệ thống không có số liệu đó.

import { useCallback, type ReactNode } from "react";
import { Gauge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { statsApi, type OrdersByStatus } from "@/lib/api/stats";
import { formatNumber } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { WidgetCard, WidgetMessage } from "./widget-card";
import { TONE_TEXT, type Tone } from "../shared/tones";

interface Rate {
  label: string;
  /** Phần trăm một chữ số thập phân; null khi kỳ không có đơn nào. */
  value: number | null;
  count: number;
  tone: Tone;
  hint: string;
}

function countOf(data: OrdersByStatus, status: string): number {
  return data.statuses.find((row) => row.status === status)?.count ?? 0;
}

function percentOf(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function ratesOf(data: OrdersByStatus): Rate[] {
  const total = data.totalCount;
  const completed = countOf(data, "COMPLETED");
  const cancelled = countOf(data, "CANCELLED");
  const returned = countOf(data, "RETURNED");
  return [
    { label: "Hoàn thành", value: percentOf(completed, total), count: completed, tone: "emerald", hint: "đơn đã giao và thu đủ tiền" },
    { label: "Đã huỷ", value: percentOf(cancelled, total), count: cancelled, tone: "red", hint: "đơn bị huỷ trước khi giao" },
    { label: "Hoàn hàng", value: percentOf(returned, total), count: returned, tone: "amber", hint: "đơn khách trả lại toàn bộ" },
  ];
}

export function StorePerformanceCard() {
  const { resolved, branchId } = useOverview();
  const load = useCallback(
    () => statsApi.getOrdersByStatus({ fromDate: resolved.fromDate, toDate: resolved.toParam, branchId }),
    [resolved, branchId],
  );
  const { data, isLoading, failed } = useAsyncData(load);

  let body: ReactNode;
  if (!data && isLoading) {
    body = <Skeleton className="h-28 w-full" />;
  } else if (!data || failed) {
    body = <WidgetMessage>Không tải được hiệu suất cửa hàng.</WidgetMessage>;
  } else {
    body = (
      <div className={`space-y-2 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
        <p className="text-xs text-muted-foreground">
          Trên {formatNumber(data.totalCount)} đơn tạo trong kỳ
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ratesOf(data).map((rate) => (
            <div key={rate.label} className="rounded-lg border px-2.5 py-1.5" title={`${formatNumber(rate.count)} ${rate.hint}`}>
              <p className="text-xs text-muted-foreground">{rate.label}</p>
              <p className={`text-lg font-semibold tabular-nums ${rate.value === null ? "text-muted-foreground" : TONE_TEXT[rate.tone]}`}>
                {rate.value === null ? "—" : `${rate.value}%`}
              </p>
              <p className="text-xs tabular-nums text-muted-foreground">{formatNumber(rate.count)} đơn</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <WidgetCard title="Hiệu suất cửa hàng" icon={Gauge} tone="emerald" viewAll={{ href: "/reports", label: "Báo cáo" }}>
      {body}
    </WidgetCard>
  );
}
