"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard, type AdminRange } from "./admin-dashboard-provider";
import { formatCompactVND, generateDateBuckets } from "../../../dashboard/shared/format";

const chartConfig = {
  revenue: { label: "Doanh thu", color: "var(--primary)" },
};

const RANGE_LABELS: Record<AdminRange, string> = {
  "7d": "7 ngày",
  "30d": "30 ngày",
  "90d": "90 ngày",
  "12m": "12 tháng",
};

export function SalesChart() {
  const { data, isLoading, range, setRange } = useAdminDashboard();

  const series = data?.revenue.series ?? [];
  const period = data?.period;
  const groupBy = data?.revenue.groupBy ?? "day";

  const chartData = period
    ? generateDateBuckets(period.fromDate.slice(0, 10), period.toDate.slice(0, 10), groupBy).map(
        (bucket) => ({
          bucket,
          revenue: series.find((s) => s.bucket === bucket)?.revenue ?? 0,
        }),
      )
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Doanh thu nền tảng</CardTitle>
          <CardDescription>Tiền các cửa hàng thanh toán gói dịch vụ</CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as AdminRange)}>
          <SelectTrigger className="w-32 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as AdminRange[]).map((r) => (
              <SelectItem key={r} value={r} className="cursor-pointer">
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <div className="px-6 pb-6">
          {isLoading && !data ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="bucket"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  width={70}
                  tickFormatter={(v) => formatCompactVND(v as number)}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => formatCompactVND(v as number)} />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#colorAdminRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
