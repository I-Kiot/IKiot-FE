"use client"

// Cơ cấu (tỷ trọng) của một tổng: donut + bảng chú thích có tên, giá trị và % ở cạnh, nên đọc được cả khi không phân biệt màu.
// Tối đa 5 lát có màu theo thứ tự cố định; phần còn lại gộp vào "Khác". Giá trị không dương không vẽ được thành lát nên bị bỏ.

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCompactVND, formatNumber, formatVND } from "@/lib/stats-format"
import { MAX_SLICES, OTHER_THEME, SERIES_THEMES } from "../shared/palette"

// Kiểu (không phải interface) để recharts nhận làm dòng dữ liệu (cần index signature ngầm).
export type ShareItem = {
  key: string
  label: string
  value: number
}

type Slice = ShareItem & {
  slot: string
  share: number
}

function slicesOf(items: ShareItem[]): Slice[] {
  const positive = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
  const total = positive.reduce((sum, item) => sum + item.value, 0)
  if (total <= 0) return []
  // Quá 5 mục: giữ 4 mục lớn nhất, phần còn lại gộp thành lát "Khác" (xám) - không bao giờ cần màu thứ 6.
  const head = positive.length > MAX_SLICES ? positive.slice(0, MAX_SLICES - 1) : positive
  const rest = positive.slice(head.length)
  const slices: Slice[] = head.map((item, i) => ({ ...item, slot: `s${i}`, share: item.value / total }))
  if (rest.length > 0) {
    const value = rest.reduce((sum, item) => sum + item.value, 0)
    slices.push({ key: "other", label: `Khác (${rest.length})`, value, slot: "other", share: value / total })
  }
  return slices
}

const config: ChartConfig = {
  ...Object.fromEntries(SERIES_THEMES.map((theme, i) => [`s${i}`, { label: `s${i}`, theme }])),
  other: { label: "Khác", theme: OTHER_THEME },
}

interface ShareDonutProps {
  title: string
  description: string
  items: ShareItem[] | null
  isLoading: boolean
  emptyText?: string
}

export function ShareDonut({ title, description, items, isLoading, emptyText = "Không có số liệu trong kỳ" }: ShareDonutProps) {
  const slices = items ? slicesOf(items) : []
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!items && isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : slices.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative size-[180px] shrink-0">
              <ChartContainer config={config} className="aspect-square size-full" aria-label={title}>
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, _name, item) => {
                          const slice = item.payload as Slice
                          return (
                            <div className="flex w-full items-center justify-between gap-4">
                              <span className="text-muted-foreground">{slice.label}</span>
                              <span className="font-mono font-medium tabular-nums">
                                {formatVND(Number(value))} · {formatNumber(Math.round(slice.share * 1000) / 10)}%
                              </span>
                            </div>
                          )
                        }}
                      />
                    }
                  />
                  {/* Viền 2px màu nền giữa các lát. */}
                  <Pie data={slices} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="100%" stroke="var(--card)" strokeWidth={2}>
                    {slices.map((slice) => (
                      <Cell key={slice.key} fill={`var(--color-${slice.slot})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Tổng</span>
                <span className="text-sm font-semibold tabular-nums">{formatCompactVND(total)}</span>
              </div>
            </div>
            <ul className="w-full min-w-0 space-y-2 text-sm">
              {slices.map((slice) => (
                <li key={slice.key} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: `var(--color-${slice.slot})` }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate" title={slice.label}>
                    {slice.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatCompactVND(slice.value)}</span>
                  <span className="w-12 text-right font-medium tabular-nums">{formatNumber(Math.round(slice.share * 1000) / 10)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
