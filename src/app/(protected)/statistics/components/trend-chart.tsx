"use client"

// Xu hướng theo ngày / tháng của kỳ đang chọn.

import { useState } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RevenueSeries } from "@/lib/api/stats"
import { formatBucket, formatCompactVND, formatDayVi, formatNumber, formatVND, generateDateBuckets } from "@/lib/stats-format"
import type { RevenueDateRange } from "../../reports/hooks/use-dashboard-stats"
import { SERIES_THEMES } from "../shared/palette"

type Metric = "revenue" | "orders"

const chartConfig = {
  revenue: { label: "Doanh thu thuần", theme: SERIES_THEMES[0] },
  orders: { label: "Số đơn hoàn tất", theme: SERIES_THEMES[0] },
} satisfies ChartConfig

interface TrendChartProps {
  series: RevenueSeries | null
  range: RevenueDateRange | null
  isLoading: boolean
}

export function TrendChart({ series, range, isLoading }: TrendChartProps) {
  const [metric, setMetric] = useState<Metric>("revenue")
  const byBucket = new Map((series?.series ?? []).map((point) => [point.bucket, point]))
  // Mọi mốc của kỳ đều có điểm, kể cả ngày không bán, để đường không nối tắt qua chỗ trống.
  const rows =
    series && range
      ? generateDateBuckets(range.fromDate, range.toDate, range.groupBy).map((bucket) => ({
          bucket,
          revenue: byBucket.get(bucket)?.revenue ?? 0,
          orders: byBucket.get(bucket)?.orderCount ?? 0,
        }))
      : []
  const hasNegative = rows.some((row) => row[metric] < 0)
  const unit = range?.groupBy === "month" ? "tháng" : "ngày"
  const labelOf = (bucket: string) => (range?.groupBy === "month" ? formatBucket(bucket) : formatDayVi(bucket))

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Xu hướng theo {unit}</CardTitle>
          <CardDescription>
            {metric === "revenue" ? "Doanh thu thuần" : "Số đơn hoàn tất"} từng {unit} trong kỳ đang chọn
          </CardDescription>
        </div>
        <Tabs value={metric} onValueChange={(value) => setMetric(value as Metric)}>
          <TabsList className="h-8">
            <TabsTrigger value="revenue" className="cursor-pointer text-xs">
              Doanh thu
            </TabsTrigger>
            <TabsTrigger value="orders" className="cursor-pointer text-xs">
              Số đơn
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {!series && isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : rows.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Không có số liệu trong kỳ</div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className={`aspect-auto h-[280px] w-full transition-opacity ${isLoading ? "opacity-60" : ""}`}
            aria-label={`Biểu đồ ${metric === "revenue" ? "doanh thu" : "số đơn"} theo ${unit}`}
          >
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="statisticsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${metric})`} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={`var(--color-${metric})`} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(bucket: string) => formatBucket(bucket)}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={metric === "revenue" ? 72 : 40}
                allowDecimals={metric === "revenue"}
                tickFormatter={(value: number) => (metric === "revenue" ? formatCompactVND(value) : formatNumber(value))}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => labelOf(String(payload?.[0]?.payload?.bucket ?? ""))}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{chartConfig[metric].label}</span>
                        <span className="font-mono font-medium tabular-nums">
                          {metric === "revenue" ? formatVND(Number(value)) : formatNumber(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              {hasNegative && <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />}
              <Area
                type="monotone"
                dataKey={metric}
                stroke={`var(--color-${metric})`}
                fill="url(#statisticsTrendFill)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
