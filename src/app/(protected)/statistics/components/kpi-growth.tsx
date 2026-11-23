"use client"

// Bốn chỉ tiêu chính của kỳ, mỗi chỉ tiêu kèm % thay đổi so với khoảng cùng độ dài ngay trước đó.

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { StatsOverview } from "@/lib/api/stats"
import { formatDayVi, formatNumber, formatVND } from "@/lib/stats-format"
import { cn } from "@/lib/utils"

/** % thay đổi một chữ số thập phân; kỳ trước bằng 0 thì không có mốc để so. */
export function changeOf(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

/** Huy hiệu tăng / giảm: mũi tên + dấu + số, màu chỉ là lớp phụ. */
export function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        Chưa có kỳ trước
      </span>
    )
  }
  const up = pct >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        up ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      <Icon className="size-3" aria-hidden />
      {up ? "+" : ""}
      {formatNumber(pct)}%
    </span>
  )
}

const KPIS: { label: string; pick: (o: StatsOverview) => number; money: boolean }[] = [
  { label: "Doanh thu thuần", pick: (o) => o.revenue, money: true },
  { label: "Lợi nhuận gộp", pick: (o) => o.grossProfit, money: true },
  { label: "Số đơn hoàn tất", pick: (o) => o.orderCount, money: false },
  { label: "Giá trị đơn trung bình", pick: (o) => o.aov, money: true },
]

interface KpiGrowthProps {
  overview: StatsOverview | null
  previousOverview: StatsOverview | null
  previousFrom?: string
  previousTo?: string
  isLoading: boolean
}

export function KpiGrowth({ overview, previousOverview, previousFrom, previousTo, isLoading }: KpiGrowthProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((kpi) => {
        const value = overview ? kpi.pick(overview) : 0
        const before = previousOverview ? kpi.pick(previousOverview) : null
        return (
          <Card key={kpi.label} className="gap-2 px-4 py-4">
            <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
            {!overview && isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="truncate text-2xl font-semibold tabular-nums">{kpi.money ? formatVND(value) : formatNumber(value)}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <DeltaBadge pct={before === null ? null : changeOf(value, before)} />
              {previousFrom && previousTo ? (
                <span>
                  so với {formatDayVi(previousFrom)} – {formatDayVi(previousTo)}
                </span>
              ) : null}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
