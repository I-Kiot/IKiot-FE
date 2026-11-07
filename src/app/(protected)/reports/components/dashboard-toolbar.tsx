"use client"

import { Calendar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDashboard } from "./dashboard-provider"
import { RANGE_OPTIONS, type DashboardRange } from "../hooks/use-dashboard-stats"
import { formatDayVi } from "@/lib/stats-format"

/** Chọn kỳ tại một chỗ; kỳ này điều khiển mọi widget bên dưới, trừ so sánh mốc cố định. */
export function DashboardToolbar() {
  const { range, setRange, revenueDateRange, refetch, isLoading } = useDashboard()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-4" />
        {revenueDateRange ? (
          <span>
            Kỳ báo cáo:{" "}
            <span className="font-medium text-foreground">
              {formatDayVi(revenueDateRange.fromDate)} – {formatDayVi(revenueDateRange.toDate)}
            </span>
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Select value={range} onValueChange={(value) => setRange(value as DashboardRange)}>
          <SelectTrigger className="w-44 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} aria-label="Làm mới">
          <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>
    </div>
  )
}
