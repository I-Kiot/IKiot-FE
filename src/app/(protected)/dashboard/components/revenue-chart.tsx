"use client";

// Biểu đồ doanh thu theo giờ / ngày / tháng của kỳ đang chọn: doanh thu (vùng), số đơn (cột) và
// doanh thu kỳ liền trước (nét đứt) để thấy lúc nào bán tăng hay giảm.

import { useCallback, useState, type ReactNode } from "react";
import { Area, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { statsApi, type RevenueGroupBy, type RevenueSeries } from "@/lib/api/stats";
import { formatCompactVND, formatNumber, formatVND } from "@/lib/stats-format";
import { useAsyncData } from "../hooks/use-async-data";
import { useOverview } from "./overview-provider";
import { bucketLabel, bucketsOf, formatDayVi, type ResolvedRange } from "../shared/overview-range";
import { CHART_ACCENT, TONE_TILE } from "../shared/tones";

const chartConfig = {
  revenue: { label: "Doanh thu", theme: CHART_ACCENT },
  previous: { label: "Kỳ trước", color: "var(--muted-foreground)" },
  orders: { label: "Số đơn", theme: { light: "oklch(0.623 0.214 259.815)", dark: "oklch(0.707 0.165 254.624)" } },
} satisfies ChartConfig;

const UNIT_LABELS: Record<RevenueGroupBy, string> = { hour: "giờ", day: "ngày", month: "tháng" };

interface ChartRow {
  bucket: string;
  previousBucket: string | null;
  revenue: number;
  orders: number;
  previous: number | null;
}

/** Ghép số liệu thưa của BE vào đủ mọi mốc trên trục, đặt kỳ trước cạnh kỳ này. */
function rowsOf(current: RevenueSeries, previous: RevenueSeries, range: ResolvedRange): ChartRow[] {
  const buckets = bucketsOf(range.fromDate, range.toDate, range.groupBy);
  const previousBuckets = bucketsOf(range.previousFromDate, range.previousToDate, range.groupBy);
  const currentByBucket = new Map(current.series.map((point) => [point.bucket, point]));
  const previousByBucket = new Map(previous.series.map((point) => [point.bucket, point.revenue]));
  // Hai kỳ dài bằng nhau nên mốc thứ i của kỳ này đặt cạnh mốc thứ i của kỳ trước.
  return buckets.map((bucket, index) => {
    const previousBucket = previousBuckets[index] ?? null;
    return {
      bucket,
      previousBucket,
      revenue: currentByBucket.get(bucket)?.revenue ?? 0,
      orders: currentByBucket.get(bucket)?.orderCount ?? 0,
      previous: previousBucket === null ? null : (previousByBucket.get(previousBucket) ?? 0),
    };
  });
}

export function RevenueChart() {
  const { resolved, branchId } = useOverview();
  const [showPrevious, setShowPrevious] = useState(true);

  // Kỳ này và kỳ trước được tải cùng nhau, nên hai đường luôn thuộc cùng một lần chọn kỳ.
  const load = useCallback(async () => {
    const [current, previous] = await Promise.all([
      statsApi.getRevenue({ fromDate: resolved.fromDate, toDate: resolved.toParam, groupBy: resolved.groupBy, branchId }),
      statsApi.getRevenue({
        fromDate: resolved.previousFromDate,
        toDate: resolved.previousToDate,
        groupBy: resolved.groupBy,
        branchId,
      }),
    ]);
    // Kỳ đi kèm số liệu: trong lúc tải kỳ mới, số liệu cũ (đang mờ) vẫn vẽ trên trục của kỳ cũ.
    return { current, previous, range: resolved };
  }, [resolved, branchId]);
  const { data, isLoading, failed } = useAsyncData(load);

  const rows = data ? rowsOf(data.current, data.previous, data.range) : [];
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const unit = UNIT_LABELS[resolved.groupBy];

  // Vùng biểu đồ có ba trạng thái: lần đầu đang tải, lỗi, và có số liệu (mờ đi khi đang tải lại).
  let chartArea: ReactNode;
  if (!data && isLoading) {
    chartArea = <Skeleton className="h-[280px] w-full" />;
  } else if (failed) {
    chartArea = (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Không tải được biểu đồ doanh thu.
      </div>
    );
  } else {
    chartArea = (
        <ChartContainer
          config={chartConfig}
          className={`h-[280px] w-full transition-opacity ${isLoading ? "opacity-60" : ""}`}
          aria-label={`Biểu đồ doanh thu theo ${unit}`}
        >
          <ComposedChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="bucket"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              minTickGap={20}
              tickFormatter={bucketLabel}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="revenue"
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(value: number) => formatCompactVND(value)}
              tick={{ fontSize: 12 }}
            />
            <YAxis yAxisId="orders" orientation="right" axisLine={false} tickLine={false} width={32} allowDecimals={false} tick={{ fontSize: 12 }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as ChartRow | undefined;
                    if (!row) return "";
                    return row.previousBucket && showPrevious
                      ? `${bucketLabel(row.bucket)} (kỳ trước: ${bucketLabel(row.previousBucket)})`
                      : bucketLabel(row.bucket);
                  }}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {name === "orders" ? formatNumber(Number(value)) : formatVND(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar yAxisId="orders" dataKey="orders" fill="var(--color-orders)" fillOpacity={0.35} radius={[3, 3, 0, 0]} maxBarSize={18} />
            {showPrevious && (
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="previous"
                stroke="var(--color-previous)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
            )}
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              fill="url(#dashboardRevenueFill)"
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ChartContainer>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="flex items-center gap-3">
          <span className={`flex size-9 items-center justify-center rounded-lg ${TONE_TILE.orange}`}>
            <ChartLine className="size-5" aria-hidden />
          </span>
          <div>
            <CardTitle>Doanh thu theo {unit}</CardTitle>
            <CardDescription>
              {formatDayVi(resolved.fromDate)}
              {resolved.toDate !== resolved.fromDate ? ` – ${formatDayVi(resolved.toDate)}` : ""} · đơn đã hoàn tất
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="show-previous" checked={showPrevious} onCheckedChange={setShowPrevious} className="cursor-pointer" />
          <Label htmlFor="show-previous" className="cursor-pointer text-sm text-muted-foreground">
            So với {resolved.previousLabel}
          </Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
            <p className="text-lg font-semibold tabular-nums">{formatVND(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Số đơn</p>
            <p className="text-lg font-semibold tabular-nums">{formatNumber(totalOrders)}</p>
          </div>
        </div>

        {chartArea}

        {/* Chú thích bằng chữ + mẫu nét, không chỉ dựa vào màu. */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-orange-500/70" aria-hidden />
            Doanh thu
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500/40" aria-hidden />
            Số đơn (trục phải)
          </span>
          {showPrevious && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted-foreground" aria-hidden />
              Doanh thu {resolved.previousLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
