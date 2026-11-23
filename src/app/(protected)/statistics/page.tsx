"use client"

// [Page – Thống kê] Biểu đồ tăng trưởng, tách khỏi trang Báo cáo (2026-11-23): KPI so kỳ trước, xu hướng theo ngày/tháng,
// cột tăng trưởng theo tháng/quý so cùng kỳ, cơ cấu doanh thu (donut), so sánh mốc thời gian và khung giờ bán chạy.
// Số liệu dạng bảng và file Excel ở menu Báo cáo; trang Tổng quan (/dashboard) giữ nguyên.

import { Suspense, useState } from "react"
import { RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ReportDateRangeFilter } from "@/components/report-date-range-filter"
import { ReportLocationSelect } from "@/components/report-location-select"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useReportLocation } from "@/hooks/use-report-location"
import { useReportPeriod } from "@/hooks/use-report-period"
import { paymentMethodLabel } from "@/lib/stats-format"
import { matchPreset, presetPeriod, type DashboardRange } from "../reports/hooks/use-dashboard-stats"
import { GrowthChart } from "./components/growth-chart"
import { KpiGrowth } from "./components/kpi-growth"
import { RevenueComparison } from "./components/revenue-comparison"
import { SalesHeatmap } from "./components/sales-heatmap"
import { ShareDonut } from "./components/share-donut"
import { TrendChart } from "./components/trend-chart"
import { useStatistics } from "./hooks/use-statistics"

/** Lựa chọn nhanh kiểu bảng giá chứng khoán; kỳ tuỳ ý chọn ở lịch bên cạnh. */
const QUICK_RANGES: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "1 tháng" },
  { value: "90d", label: "3 tháng" },
  { value: "12m", label: "1 năm" },
]
const isQuick = (value: DashboardRange | null): value is DashboardRange => QUICK_RANGES.some((o) => o.value === value)

function Statistics() {
  const { period, setPeriod } = useReportPeriod()
  const [reloadKey, setReloadKey] = useState(0)
  const location = useReportLocation()
  const { place } = location
  const { data, isLoading } = useStatistics(period, place, reloadKey)
  const preset = matchPreset(period)

  return (
    <div className="flex-1 space-y-6 px-4 pb-8 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Thống kê" }]}
        title="Thống kê"
        description="Tăng trưởng và cơ cấu doanh thu theo kỳ; số liệu dạng bảng và file Excel ở menu Báo cáo"
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={isQuick(preset) ? preset : ""}
          onValueChange={(value) => {
            // Bấm lại lựa chọn đang bật trả về "": giữ nguyên kỳ.
            if (value) setPeriod(presetPeriod(value as DashboardRange))
          }}
          aria-label="Kỳ nhanh"
        >
          {QUICK_RANGES.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} className="cursor-pointer px-3">
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <ReportLocationSelect location={location} />
        <ReportDateRangeFilter period={period} onChange={setPeriod} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={isLoading}
          aria-label="Làm mới"
        >
          <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
        </Button>
      </div>

      <KpiGrowth
        overview={data?.overview ?? null}
        previousOverview={data?.previousOverview ?? null}
        previousFrom={data?.range.previousFromDate}
        previousTo={data?.range.previousToDate}
        isLoading={isLoading}
      />

      <TrendChart series={data?.series ?? null} range={data?.range ?? null} isLoading={isLoading} />

      <GrowthChart branchId={place} />

      {/* Cơ cấu theo điểm bán chỉ có nghĩa khi xem toàn cửa hàng. */}
      <div className={`grid gap-6 ${location.isAll ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {location.isAll && (
          <ShareDonut
            title="Theo điểm bán"
            description="Tỷ trọng doanh thu thuần của từng chi nhánh"
            isLoading={isLoading}
            items={
              data?.byBranch
                ? data.byBranch.branches.map((b) => ({ key: b.branchId, label: b.branchName ?? "Chi nhánh", value: b.revenue }))
                : null
            }
          />
        )}
        <ShareDonut
          title="Theo phương thức thanh toán"
          description="Tỷ trọng tiền thực thu theo phương thức"
          isLoading={isLoading}
          items={
            data?.byPayment
              ? data.byPayment.breakdown.map((m) => ({ key: m.paymentMethod, label: paymentMethodLabel(m.paymentMethod), value: m.revenue }))
              : null
          }
        />
        <ShareDonut
          title="Theo hàng hóa"
          description="Tỷ trọng doanh thu của các mặt hàng bán chạy nhất"
          isLoading={isLoading}
          items={
            data?.topProducts
              ? data.topProducts.products.map((p) => ({ key: p.productItemId, label: p.productName, value: p.revenue }))
              : null
          }
        />
      </div>

      <RevenueComparison comparison={data?.comparison ?? null} isLoading={isLoading} />
      <SalesHeatmap salesHeatmap={data?.heatmap ?? null} isLoading={isLoading} />
    </div>
  )
}

/** Bọc Suspense vì kỳ đọc từ URL (`useSearchParams`). */
export default function StatisticsPage() {
  return (
    <Suspense fallback={null}>
      <Statistics />
    </Suspense>
  )
}
