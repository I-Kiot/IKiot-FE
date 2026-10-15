"use client"

import { useMemo } from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatBucket, formatCompactVND, formatVND, generateDateBuckets } from "../shared/format"

const chartConfig = {
  revenue: { label: "Kỳ này", color: "var(--primary)" },
  previous: { label: "Kỳ trước", color: "var(--muted-foreground)" },
}

/** Revenue over the chosen period with the equal-length period before laid over it, aligned day-for-day (or month-for-month). */
export function SalesChart() {
  const { revenue, previousRevenue, revenueDateRange, isLoading } = useDashboard()

  const data = useMemo(() => {
    if (!revenueDateRange) return []
    const { fromDate, toDate, groupBy, previousFromDate, previousToDate } = revenueDateRange
    const buckets = generateDateBuckets(fromDate, toDate, groupBy)
    const previousBuckets = generateDateBuckets(previousFromDate, previousToDate, groupBy)
    const current = new Map((revenue?.series ?? []).map((p) => [p.bucket, p.revenue]))
    const previous = new Map((previousRevenue?.series ?? []).map((p) => [p.bucket, p.revenue]))

    return buckets.map((bucket, index) => {
      const previousBucket = previousBuckets[index]
      return {
        bucket,
        previousBucket,
        revenue: current.get(bucket) ?? 0,
        previous: previousBucket ? (previous.get(previousBucket) ?? 0) : null,
      }
    })
  }, [revenue, previousRevenue, revenueDateRange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng doanh thu</CardTitle>
        <CardDescription>Đơn hàng đã hoàn tất, đặt cạnh kỳ liền trước có cùng độ dài</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !revenue ? (
          <Skeleton className="h-[320px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={formatBucket}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(v: number) => formatCompactVND(v)}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as { bucket: string; previousBucket?: string } | undefined
                      if (!row) return ""
                      return row.previousBucket
                        ? `${formatBucket(row.bucket)} (so với ${formatBucket(row.previousBucket)})`
                        : formatBucket(row.bucket)
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums">{formatVND(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--color-previous)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
