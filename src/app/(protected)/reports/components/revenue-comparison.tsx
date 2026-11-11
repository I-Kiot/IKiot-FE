"use client"

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDashboard } from "./dashboard-provider"
import { COMPARISON_LABELS, formatCompactVND, formatInstantShort, formatNumber, formatVND, negativeClass } from "@/lib/stats-format"

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" />
        Mới
      </span>
    )
  }
  const up = pct >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        up
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400",
      )}
    >
      <Icon className="size-3" />
      {up ? "+" : ""}
      {pct}%
    </span>
  )
}

/** Doanh thu tại các mốc lịch cố định, mỗi mốc so với cùng khoảng đã trôi của kỳ trước; không phụ thuộc bộ chọn kỳ. */
export function RevenueComparison() {
  const { comparison, isLoading } = useDashboard()

  return (
    <Card>
      <CardHeader>
        <CardTitle>So sánh doanh thu thuần theo mốc thời gian</CardTitle>
        <CardDescription>
          Doanh thu thuần theo ngày hoàn thành, đã trừ trả hàng. Mỗi mốc được so với cùng khoảng thời gian đã trôi qua của kỳ trước (ví dụ: 1–15 tháng này so với 1–15 tháng trước)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !comparison ? (
          <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : !comparison ? null : (
          <div className="grid gap-4 sm:grid-cols-2 @5xl:grid-cols-5">
            {comparison.comparisons.map((item) => {
              const label = COMPARISON_LABELS[item.key]
              const max = Math.max(item.current.revenue, item.previous.revenue, 1)
              const barWidth = (value: number) => `${(Math.max(value, 0) / max) * 100}%`
              return (
                <div key={item.key} className="flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{label.title}</span>
                    <DeltaBadge pct={item.changePct.revenue} />
                  </div>

                  <div>
                    <p className={cn("text-xl font-semibold tabular-nums", negativeClass(item.current.revenue))} title={formatVND(item.current.revenue)}>
                      {formatCompactVND(item.current.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.current.orderCount)} đơn · TB {formatCompactVND(item.current.aov)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>{label.current}</span>
                        <span className="tabular-nums">
                          {formatInstantShort(item.current.fromDate)} – {formatInstantShort(item.current.toDate)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: barWidth(item.current.revenue) }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>
                          {label.previous} · {formatCompactVND(item.previous.revenue)}
                        </span>
                        <span className="tabular-nums">
                          {formatInstantShort(item.previous.fromDate)} – {formatInstantShort(item.previous.toDate)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-muted-foreground/40"
                          style={{ width: barWidth(item.previous.revenue) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
