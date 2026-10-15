"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatCompactVND, formatNumber } from "../shared/format"

// Monday first, as the working week reads in Vietnam; values are Postgres DOW (0 = Sunday).
const WEEKDAYS = [
  { dow: 1, label: "T2" },
  { dow: 2, label: "T3" },
  { dow: 3, label: "T4" },
  { dow: 4, label: "T5" },
  { dow: 5, label: "T6" },
  { dow: 6, label: "T7" },
  { dow: 0, label: "CN" },
]
const HOURS = Array.from({ length: 24 }, (_, h) => h)

/** When the till is busy: revenue by weekday x hour of the shop's local day. */
export function SalesHeatmap() {
  const { salesHeatmap, isLoading } = useDashboard()

  const { grid, max, bestSlot } = useMemo(() => {
    const grid = new Map<string, { revenue: number; orderCount: number }>()
    let max = 0
    let bestSlot: { weekday: number; hour: number; revenue: number } | null = null
    for (const cell of salesHeatmap?.cells ?? []) {
      grid.set(`${cell.weekday}-${cell.hour}`, { revenue: cell.revenue, orderCount: cell.orderCount })
      if (cell.revenue > max) {
        max = cell.revenue
        bestSlot = cell
      }
    }
    return { grid, max, bestSlot }
  }, [salesHeatmap])

  const best = bestSlot as { weekday: number; hour: number; revenue: number } | null
  const bestLabel = best
    ? `${WEEKDAYS.find((w) => w.dow === best.weekday)?.label} · ${String(best.hour).padStart(2, "0")}h`
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Khung giờ bán chạy</CardTitle>
        <CardDescription>
          {bestLabel
            ? `Cao điểm: ${bestLabel} (${formatCompactVND(best!.revenue)})`
            : "Doanh thu theo thứ trong tuần và giờ trong ngày"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && !salesHeatmap ? (
          <Skeleton className="h-52 w-full" />
        ) : max === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu bán hàng trong kỳ này</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[520px] space-y-1">
              {WEEKDAYS.map((day) => (
                <div key={day.dow} className="flex items-center gap-1">
                  <span className="w-7 shrink-0 text-xs text-muted-foreground">{day.label}</span>
                  {HOURS.map((hour) => {
                    const cell = grid.get(`${day.dow}-${hour}`)
                    const ratio = cell ? cell.revenue / max : 0
                    return (
                      <div
                        key={hour}
                        className="h-6 flex-1 rounded-sm bg-primary"
                        style={{ opacity: cell ? 0.15 + ratio * 0.85 : 0.06 }}
                        title={
                          cell
                            ? `${day.label} ${String(hour).padStart(2, "0")}h: ${formatCompactVND(cell.revenue)} · ${formatNumber(cell.orderCount)} đơn`
                            : `${day.label} ${String(hour).padStart(2, "0")}h: không có đơn`
                        }
                      />
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-1 pt-1">
                <span className="w-7 shrink-0" />
                {HOURS.map((hour) => (
                  <span key={hour} className="flex-1 text-center text-[10px] text-muted-foreground">
                    {hour % 3 === 0 ? hour : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
