"use client";

// Bốn chỉ số đầu trang: doanh thu, số đơn, giá trị đơn trung bình, lợi nhuận gộp - kèm % so với kỳ trước.

import { useCallback } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, Info, Minus, ReceiptText, ShoppingCart, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { statsApi, type StatsOverview } from "@/lib/api/stats";
import { formatNumber, formatVND } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { TONE_TEXT, TONE_TILE, type Tone } from "../shared/tones";

interface Metric {
  key: string;
  title: string;
  value: string;
  change: number | null;
  icon: LucideIcon;
  tone: Tone;
  /** Ghi chú khi con số cần đọc kèm điều kiện (lợi nhuận ước tính). */
  note?: string;
}

function metricsOf(overview: StatsOverview): Metric[] {
  const profitNote =
    overview.linesMissingCost > 0
      ? `Ước tính: ${formatNumber(overview.linesMissingCost)} dòng hàng chưa có giá vốn đang được tính giá vốn 0, nên lợi nhuận có thể cao hơn thực tế.`
      : "Doanh thu − phí ship − phí sàn − giá vốn hàng đã bán.";
  return [
    { key: "revenue", title: "Doanh thu", value: formatVND(overview.revenue), change: overview.changePct.revenue, icon: Banknote, tone: "orange" },
    { key: "orders", title: "Đơn hàng", value: formatNumber(overview.orderCount), change: overview.changePct.orderCount, icon: ReceiptText, tone: "blue" },
    { key: "aov", title: "Giá trị đơn TB", value: formatVND(overview.aov), change: overview.changePct.aov, icon: ShoppingCart, tone: "violet" },
    { key: "profit", title: "Lợi nhuận gộp ước tính", value: formatVND(overview.grossProfit), change: overview.changePct.grossProfit, icon: TrendingUp, tone: "emerald", note: profitNote },
  ];
}

/** Mũi tên + dấu + số: tăng/giảm đọc được cả khi không phân biệt được màu. */
function ChangeBadge({ change, previousLabel }: { change: number | null; previousLabel: string }) {
  if (change === null) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3.5" aria-hidden />
        Chưa có số liệu {previousLabel} để so sánh
      </p>
    );
  }
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="flex flex-wrap items-center gap-1 text-xs">
      <span className={`flex items-center gap-0.5 font-medium tabular-nums ${up ? TONE_TEXT.emerald : TONE_TEXT.red}`}>
        <Icon className="size-3.5" aria-hidden />
        {up ? "+" : "−"}
        {Math.abs(change)}%
      </span>
      <span className="text-muted-foreground">so với {previousLabel}</span>
    </p>
  );
}

export function KpiCards() {
  const { resolved, branchId } = useOverview();
  const load = useCallback(
    () => statsApi.getOverview({ fromDate: resolved.fromDate, toDate: resolved.toParam, branchId }),
    [resolved, branchId],
  );
  const { data, isLoading, failed } = useAsyncData(load);

  if (!data && isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[124px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || failed) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">Không tải được các chỉ số kinh doanh. Bấm làm mới để thử lại.</Card>
    );
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
      {metricsOf(data).map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.key} className="gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${TONE_TILE[metric.tone]}`}>
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                {metric.title}
                {metric.note && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="cursor-help rounded-sm" aria-label={metric.note}>
                        <Info className={`size-3.5 ${data.linesMissingCost > 0 ? TONE_TEXT.amber : ""}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{metric.note}</TooltipContent>
                  </Tooltip>
                )}
              </span>
            </div>
            <p className="truncate text-2xl font-semibold tabular-nums" title={metric.value}>
              {metric.value}
            </p>
            <ChangeBadge change={metric.change} previousLabel={resolved.previousLabel} />
          </Card>
        );
      })}
    </div>
  );
}
