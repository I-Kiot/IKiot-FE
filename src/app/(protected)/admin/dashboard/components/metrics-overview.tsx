"use client";

import { TrendingUp, TrendingDown, DollarSign, Store, Landmark, UserPlus } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "./admin-dashboard-provider";
import { formatCompactVND, formatNumber, formatPercent } from "../../../dashboard/shared/format";

export function MetricsOverview() {
  const { data, isLoading } = useAdminDashboard();

  if (isLoading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const metrics = [
    {
      title: "Doanh thu trong kỳ",
      value: formatCompactVND(data.revenue.inPeriod),
      change: data.revenue.changePct,
      icon: DollarSign,
      footer: `${formatNumber(data.revenue.invoiceCountInPeriod)} hoá đơn đã thanh toán`,
      subfooter: `Tổng luỹ kế: ${formatCompactVND(data.revenue.total)}`,
    },
    {
      title: "Tổng cửa hàng",
      value: formatNumber(data.tenants.total),
      change: null,
      icon: Store,
      footer: `${formatNumber(data.tenants.active)} đang hoạt động · ${formatNumber(data.tenants.suspended)} tạm khoá`,
      subfooter: `${formatNumber(data.subscriptions.byStatus.TRIAL)} đang dùng thử`,
    },
    {
      title: "Cửa hàng mới",
      value: formatNumber(data.tenants.newInPeriod),
      change: data.tenants.changePct,
      icon: UserPlus,
      footer: "Đăng ký mới trong kỳ",
      subfooter: `Tỷ lệ trial→trả phí: ${data.subscriptions.conversionRate === null ? "-" : data.subscriptions.conversionRate + "%"}`,
    },
    {
      title: "Đã liên kết SePay",
      value: `${formatNumber(data.sepay.linked)}/${formatNumber(data.sepay.total)}`,
      change: null,
      icon: Landmark,
      footer: `${formatNumber(data.tickets.open)} ticket đang mở`,
      subfooter: `${formatNumber(data.tickets.resolved)} ticket đã xử lý`,
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const up = (metric.change ?? 0) >= 0;
        const TrendIcon = up ? TrendingUp : TrendingDown;
        const Icon = metric.icon;
        return (
          <Card key={metric.title}>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {metric.title}
              </CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              {metric.change !== null && (
                <CardAction>
                  <Badge variant="outline" className={up ? "text-green-600" : "text-red-600"}>
                    <TrendIcon className="h-4 w-4" />
                    {formatPercent(metric.change)}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 font-medium">{metric.footer}</div>
              <div className="text-muted-foreground line-clamp-1">{metric.subfooter}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
