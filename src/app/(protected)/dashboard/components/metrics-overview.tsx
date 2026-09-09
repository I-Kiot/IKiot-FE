"use client"

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3
} from "lucide-react"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatVND, formatNumber, formatPercent } from "../shared/format"

export function MetricsOverview() {
  const { overview, isLoading } = useDashboard()

  if (isLoading && !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[150px] w-full" />
        ))}
      </div>
    )
  }

  if (!overview) return null

  const metrics = [
    {
      title: "Tổng doanh thu",
      value: formatVND(overview.revenue),
      change: formatPercent(overview.changePct.revenue),
      trend: (overview.changePct.revenue ?? 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      footer: "Doanh thu trong kỳ",
      subfooter: "Chỉ tính đơn đã hoàn tất",
    },
    {
      title: "Khách hàng",
      value: formatNumber(overview.customerCount),
      change: formatPercent(overview.changePct.customerCount),
      trend: (overview.changePct.customerCount ?? 0) >= 0 ? "up" : "down",
      icon: Users,
      footer: "Khách hàng có phát sinh đơn",
      subfooter: "Trong khoảng thời gian đã chọn",
    },
    {
      title: "Tổng đơn hàng",
      value: formatNumber(overview.orderCount),
      change: formatPercent(overview.changePct.orderCount),
      trend: (overview.changePct.orderCount ?? 0) >= 0 ? "up" : "down",
      icon: ShoppingCart,
      footer: "Đơn hàng đã hoàn tất",
      subfooter: "So với kỳ trước liền kề",
    },
    {
      title: "Giá trị đơn trung bình",
      value: formatVND(overview.aov),
      change: formatPercent(overview.changePct.aov),
      trend: (overview.changePct.aov ?? 0) >= 0 ? "up" : "down",
      icon: BarChart3,
      footer: "Giá trị trung bình",
      subfooter: "Doanh thu / số đơn hàng",
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {metrics.map((metric) => {
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title} className=" cursor-pointer">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <TrendIcon className="h-4 w-4" />
                  {metric.change}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.footer} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground">
                {metric.subfooter}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
