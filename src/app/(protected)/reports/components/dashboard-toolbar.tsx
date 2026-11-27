"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportDateRangeFilter } from "@/components/report-date-range-filter"
import { ReportLocationSelect } from "@/components/report-location-select"
import { ReportExportMenu } from "./report-export-menu"
import { useDashboard } from "./dashboard-provider"

/** Chọn nơi và kỳ tại một chỗ; hai lựa chọn này điều khiển mọi bảng của trang Tổng hợp. */
export function DashboardToolbar() {
  const { period, setPeriod, location, refetch, isLoading } = useDashboard()

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ReportExportMenu />
      <ReportLocationSelect location={location} />
      <ReportDateRangeFilter period={period} onChange={setPeriod} />
      <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} aria-label="Làm mới">
        <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
      </Button>
    </div>
  )
}
