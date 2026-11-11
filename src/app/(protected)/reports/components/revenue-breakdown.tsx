"use client"

import * as React from "react"
import { Label, Pie, PieChart, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatCompactVND, negativeClass, paymentMethodLabel } from "@/lib/stats-format"

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function RevenueBreakdown() {
  const id = "revenue-breakdown"
  const { revenueByPaymentMethod, isLoading } = useDashboard()

  const breakdown = revenueByPaymentMethod?.breakdown ?? []
  // Tiền thực thu ròng có thể âm (hoàn nhiều hơn thu): biểu đồ tròn chỉ vẽ phần dương, danh sách vẫn nêu đủ.
  const totalRevenue = breakdown.reduce((sum, item) => sum + Math.max(item.revenue, 0), 0)

  const chartData = breakdown.map((item, index) => ({
    method: item.paymentMethod || "UNKNOWN",
    label: paymentMethodLabel(item.paymentMethod),
    amount: item.revenue,
    orderCount: item.orderCount,
    percent: totalRevenue > 0 && item.revenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const pieData = chartData.filter((item) => item.amount > 0)

  const [activeMethod, setActiveMethod] = React.useState<string | null>(null)

  const activeIndex = React.useMemo(() => {
    if (!chartData.length) return 0
    const index = chartData.findIndex((item) => item.method === activeMethod)
    return index === -1 ? 0 : index
  }, [activeMethod, chartData])

  const chartConfig = React.useMemo(() => {
    return chartData.reduce((config, item) => {
      config[item.method] = { label: item.label, color: item.fill }
      return config
    }, {} as Record<string, { label: string; color: string }>)
  }, [chartData])

  return (
    <Card data-chart={id} className="flex flex-col cursor-pointer">
      <ChartStyle id={id} config={chartConfig} />
      <CardHeader className="pb-2">
        <CardTitle>Cơ cấu doanh thu</CardTitle>
        <CardDescription>Tiền thực thu ròng theo phương thức (đã trừ hoàn tiền và tiền thối), tính theo ngày thu tiền</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center">
        {isLoading && !revenueByPaymentMethod ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground py-12">
            Chưa có dữ liệu doanh thu trong khoảng thời gian này
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <div className="flex justify-center">
              <ChartContainer
                id={id}
                config={chartConfig}
                className="mx-auto aspect-square w-full max-w-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData}
                    dataKey="amount"
                    nameKey="method"
                    innerRadius={60}
                    strokeWidth={5}
                    activeShape={({
                      outerRadius = 0,
                      ...props
                    }: PieSectorDataItem) => (
                      <g>
                        <Sector {...props} outerRadius={outerRadius + 10} />
                        <Sector
                          {...props}
                          outerRadius={outerRadius + 25}
                          innerRadius={outerRadius + 12}
                        />
                      </g>
                    )}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          const active = chartData[activeIndex]
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {formatCompactVND(active.amount)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                {active.label}
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              {chartData.map((item, index) => {
                const isActive = index === activeIndex

                return (
                  <div
                    key={item.method}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveMethod(item.method)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${negativeClass(item.amount)}`}>{formatCompactVND(item.amount)}</div>
                      <div className="text-sm text-muted-foreground">{item.amount > 0 ? `${item.percent}%` : `${item.orderCount} đơn`}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
