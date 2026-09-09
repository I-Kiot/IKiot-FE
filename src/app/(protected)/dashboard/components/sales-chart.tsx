"use client"

import { useMemo } from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import type { DashboardRange } from "../hooks/use-dashboard-stats"
import { generateDateBuckets } from "../shared/format"

const chartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "var(--primary)",
  },
}

export function SalesChart() {
  const { revenue, revenueDateRange, range, setRange, isLoading } = useDashboard()

  const data = useMemo(() => {
    if (!revenueDateRange) return (revenue?.series ?? []).map((point) => ({ bucket: point.bucket, revenue: point.revenue }))

    const buckets = generateDateBuckets(revenueDateRange.fromDate, revenueDateRange.toDate, revenueDateRange.groupBy)
    const seriesByBucket = new Map((revenue?.series ?? []).map((point) => [point.bucket, point.revenue]))
    return buckets.map((bucket) => ({ bucket, revenue: seriesByBucket.get(bucket) ?? 0 }))
  }, [revenue, revenueDateRange])

  return (
    <Card className="cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Doanh thu theo thời gian</CardTitle>
          <CardDescription>Doanh thu đơn hàng đã hoàn tất</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={range} onValueChange={(value) => setRange(value as DashboardRange)}>
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d" className="cursor-pointer">7 ngày qua</SelectItem>
              <SelectItem value="30d" className="cursor-pointer">30 ngày qua</SelectItem>
              <SelectItem value="90d" className="cursor-pointer">90 ngày qua</SelectItem>
              <SelectItem value="12m" className="cursor-pointer">12 tháng qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <div className="px-6 pb-6">
          {isLoading && !revenue ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="bucket"
                  axisLine={false}
                  tickLine={false}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#colorRevenue)"
                  strokeWidth={1}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
