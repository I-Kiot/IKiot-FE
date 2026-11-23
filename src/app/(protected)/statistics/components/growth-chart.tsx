"use client"

// Tăng trưởng kiểu báo cáo tài chính: cột doanh thu theo tháng (12 tháng) hoặc quý (8 quý) gần nhất, và ngay dưới là
// % tăng trưởng so với cùng kỳ năm trước. Hai thước đo khác đơn vị nên là hai biểu đồ chung trục thời gian, không gộp hai trục y.
// Mốc cố định theo lịch, không theo bộ chọn kỳ (như so sánh mốc thời gian); tháng / quý hiện tại tính đến hôm nay.

import { useCallback, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { statsApi } from "@/lib/api/stats"
import { formatCompactVND, formatNumber, formatVND } from "@/lib/stats-format"
import { useAsyncData } from "../../dashboard/hooks/use-async-data"
import { presetPeriod } from "../../reports/hooks/use-dashboard-stats"
import { GROWTH_DOWN_THEME, GROWTH_UP_THEME, SERIES_THEMES } from "../shared/palette"

type Grain = "month" | "quarter"

/** Số mốc hiển thị; cần thêm một năm phía trước để tính cùng kỳ năm trước. */
const SHOWN: Record<Grain, number> = { month: 12, quarter: 8 }
/** Đủ 8 quý + 4 quý cùng kỳ = 36 tháng. */
const MONTHS_LOADED = 36

const revenueConfig = { revenue: { label: "Doanh thu thuần", theme: SERIES_THEMES[0] } } satisfies ChartConfig
const growthConfig = {
  up: { label: "Tăng", theme: GROWTH_UP_THEME },
  down: { label: "Giảm", theme: GROWTH_DOWN_THEME },
} satisfies ChartConfig

interface GrowthRow {
  key: string
  label: string
  revenue: number
  /** % so với cùng kỳ năm trước; null khi cùng kỳ chưa có doanh thu. */
  yoy: number | null
}

/** `YYYY-MM` của tháng lệch `offset` tháng so với `YYYY-MM`. */
function shiftMonth(month: string, offset: number): string {
  const total = Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1 + offset
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`
}

function rowsOf(byMonth: Map<string, number>, thisMonth: string, grain: Grain): GrowthRow[] {
  // Mỗi mốc là danh sách tháng của nó: tháng là chính nó, quý là ba tháng của quý.
  const periods: { key: string; label: string; months: string[] }[] = []
  if (grain === "month") {
    for (let i = MONTHS_LOADED - 1; i >= 0; i--) {
      const month = shiftMonth(thisMonth, -i)
      periods.push({ key: month, label: `T${month.slice(5)}/${month.slice(2, 4)}`, months: [month] })
    }
  } else {
    const startOfQuarter = shiftMonth(thisMonth, -((Number(thisMonth.slice(5, 7)) - 1) % 3))
    for (let i = MONTHS_LOADED / 3 - 1; i >= 0; i--) {
      const first = shiftMonth(startOfQuarter, -3 * i)
      const quarter = Math.floor((Number(first.slice(5, 7)) - 1) / 3) + 1
      periods.push({
        key: `${first.slice(0, 4)}-Q${quarter}`,
        label: `Q${quarter}/${first.slice(2, 4)}`,
        months: [first, shiftMonth(first, 1), shiftMonth(first, 2)],
      })
    }
  }
  const revenueOf = (months: string[]) => months.reduce((sum, m) => sum + (byMonth.get(m) ?? 0), 0)
  const yearBack = grain === "month" ? 12 : 4
  return periods.slice(-SHOWN[grain]).map((period, i, shown) => {
    const index = periods.length - shown.length + i
    const revenue = revenueOf(period.months)
    const before = revenueOf(periods[index - yearBack]?.months ?? [])
    return {
      key: period.key,
      label: period.label,
      revenue,
      yoy: before > 0 ? Math.round(((revenue - before) / before) * 1000) / 10 : null,
    }
  })
}

const formatPct = (value: number) => `${value > 0 ? "+" : ""}${formatNumber(value)}%`

export function GrowthChart({ branchId }: { branchId?: string }) {
  const [grain, setGrain] = useState<Grain>("month")

  const load = useCallback(async () => {
    const today = presetPeriod("7d").toDate
    const thisMonth = today.slice(0, 7)
    const series = await statsApi.getRevenue({
      fromDate: `${shiftMonth(thisMonth, -(MONTHS_LOADED - 1))}-01`,
      toDate: today,
      groupBy: "month",
      branchId,
    })
    return { thisMonth, byMonth: new Map(series.series.map((point) => [point.bucket.slice(0, 7), point.revenue])) }
  }, [branchId])
  const { data, isLoading, failed } = useAsyncData(load)

  const rows = data ? rowsOf(data.byMonth, data.thisMonth, grain) : []
  const growthRows = rows.map((row) => ({ ...row, growth: row.yoy ?? 0 }))
  const grainLabel = grain === "month" ? "tháng" : "quý"

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle>Tăng trưởng doanh thu</CardTitle>
          <CardDescription>
            Doanh thu thuần {SHOWN[grain]} {grainLabel} gần nhất và % so với cùng kỳ năm trước; {grainLabel} hiện tại tính đến hôm nay
          </CardDescription>
        </div>
        <Tabs value={grain} onValueChange={(value) => setGrain(value as Grain)}>
          <TabsList className="h-8">
            <TabsTrigger value="month" className="cursor-pointer text-xs">
              Theo tháng
            </TabsTrigger>
            <TabsTrigger value="quarter" className="cursor-pointer text-xs">
              Theo quý
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-2">
        {!data && isLoading ? (
          <Skeleton className="h-[360px] w-full" />
        ) : failed ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">Không tải được số liệu tăng trưởng.</div>
        ) : (
          <>
            <ChartContainer config={revenueConfig} className="aspect-auto h-[240px] w-full" aria-label={`Doanh thu theo ${grainLabel}`}>
              <BarChart data={rows} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(value: number) => formatCompactVND(value)}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.3 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => String(label)}
                      formatter={(value, _name, item) => {
                        const row = item.payload as GrowthRow
                        return (
                          <div className="grid w-full gap-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Doanh thu thuần</span>
                              <span className="font-mono font-medium tabular-nums">{formatVND(Number(value))}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">So với cùng kỳ</span>
                              <span className="font-mono font-medium tabular-nums">{row.yoy === null ? "-" : formatPct(row.yoy)}</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>

            <p className="text-xs font-medium text-muted-foreground">% so với cùng kỳ năm trước</p>
            <ChartContainer config={growthConfig} className="aspect-auto h-[120px] w-full" aria-label="Tăng trưởng so với cùng kỳ năm trước">
              <BarChart data={growthRows} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
                <XAxis dataKey="label" hide />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(value: number) => `${formatNumber(value)}%`}
                  tick={{ fontSize: 12 }}
                />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
                <ChartTooltip
                  cursor={{ fillOpacity: 0.3 }}
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(label) => String(label)}
                      formatter={(_value, _name, item) => {
                        const row = item.payload as GrowthRow
                        return (
                          <span className="font-mono font-medium tabular-nums">
                            {row.yoy === null ? "Chưa có cùng kỳ năm trước" : `${formatPct(row.yoy)} so với cùng kỳ`}
                          </span>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="growth" radius={4} maxBarSize={40}>
                  {growthRows.map((row) => (
                    <Cell key={row.key} fill={row.growth < 0 ? "var(--color-down)" : "var(--color-up)"} />
                  ))}
                  {/* Nhãn số ở từng cột: dấu +/− cho biết tăng hay giảm, không chỉ dựa vào màu. */}
                  <LabelList
                    dataKey="yoy"
                    position="top"
                    className="fill-muted-foreground"
                    fontSize={11}
                    formatter={(value: unknown) => (typeof value === "number" ? formatPct(value) : "")}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
