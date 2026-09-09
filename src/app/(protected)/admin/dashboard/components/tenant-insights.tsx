"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "./admin-dashboard-provider";
import { formatNumber, generateDateBuckets } from "../../../dashboard/shared/format";

const chartConfig = { count: { label: "Cửa hàng mới", color: "var(--primary)" } };

const SUB_STATUS: { key: keyof AdminSubStatus; label: string; cls: string }[] = [
  { key: "TRIAL", label: "Dùng thử", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { key: "ACTIVE", label: "Đang hoạt động", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
  { key: "PAST_DUE", label: "Quá hạn", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  { key: "EXPIRED", label: "Hết hạn", cls: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
  { key: "CANCELLED", label: "Đã huỷ", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
];

type AdminSubStatus = {
  TRIAL: number;
  ACTIVE: number;
  PAST_DUE: number;
  EXPIRED: number;
  CANCELLED: number;
};

export function TenantInsights() {
  const { data, isLoading } = useAdminDashboard();

  const period = data?.period;
  const growth = data?.tenantGrowth ?? [];
  const groupBy = data?.revenue.groupBy ?? "day";
  const byStatus = data?.subscriptions.byStatus;

  const chartData = period
    ? generateDateBuckets(period.fromDate.slice(0, 10), period.toDate.slice(0, 10), groupBy).map(
        (bucket) => ({ bucket, count: growth.find((g) => g.bucket === bucket)?.count ?? 0 }),
      )
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Tăng trưởng cửa hàng</CardTitle>
        <CardDescription>Số cửa hàng đăng ký mới theo thời gian & tình trạng gói</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 @3xl:grid-cols-3 gap-6">
        <div className="@3xl:col-span-2">
          {isLoading && !data ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={24} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={30} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="flex flex-col justify-center gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tình trạng gói</p>
          {isLoading && !data ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
          ) : (
            SUB_STATUS.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                <span className="text-sm font-bold tabular-nums">
                  {formatNumber(byStatus?.[s.key] ?? 0)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
