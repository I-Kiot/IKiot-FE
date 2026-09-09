"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "./admin-dashboard-provider";
import { formatNumber } from "../../../dashboard/shared/format";

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function RevenueBreakdown() {
  const { data, isLoading } = useAdminDashboard();

  const dist = data?.subscriptions.planDistribution ?? [];
  const chartData = dist.map((d, i) => ({
    key: d.planCode || d.planId,
    label: d.planName || d.planCode || "Không xác định",
    count: d.count,
    fill: PALETTE[i % PALETTE.length],
  }));

  const total = chartData.reduce((s, d) => s + d.count, 0);

  const chartConfig: ChartConfig = React.useMemo(() => {
    const cfg: ChartConfig = { count: { label: "Cửa hàng" } };
    chartData.forEach((d) => {
      cfg[d.key] = { label: d.label, color: d.fill };
    });
    return cfg;
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Phân bổ gói dịch vụ</CardTitle>
        <CardDescription>Số cửa hàng đang dùng theo từng gói (TRIAL/ACTIVE/PAST_DUE)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        {isLoading && !data ? (
          <Skeleton className="h-[260px] w-full" />
        ) : total === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Chưa có gói nào đang hoạt động.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[260px]"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={60} strokeWidth={5}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                              {formatNumber(total)}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground text-sm">
                              cửa hàng
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="flex flex-col justify-center space-y-2">
              {chartData.map((item) => (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums">{formatNumber(item.count)}</div>
                    <div className="text-xs text-muted-foreground">
                      {total ? Math.round((item.count / total) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
