"use client"

// Khung trang báo cáo xếp hạng.

import { useCallback, useState, type ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { ExportExcelButton } from "@/components/export-excel-button"
import { PageHeader } from "@/components/page-header"
import { ReportDateRangeFilter } from "@/components/report-date-range-filter"
import { ReportLocationSelect } from "@/components/report-location-select"
import { Button } from "@/components/ui/button"
import { useReportLocation } from "@/hooks/use-report-location"
import { useReportPeriod } from "@/hooks/use-report-period"
import { statsApi, type RankingPagination, type RankingSummary, type RevenueByStaffGroupBy } from "@/lib/api/stats"
import { useAsyncData } from "../../dashboard/hooks/use-async-data"
import type { ReportPeriod } from "../hooks/use-dashboard-stats"
import { DEFAULT_REPORT_PAGE_SIZE, ReportTable, type ReportColumn } from "./report-table"
import { revenueColumns } from "./sales-reports"

export interface RankingRow {
  orderCount: number
  revenue: number
  aov: number
}

export interface RankingPage<T> {
  rows: T[]
  summary: RankingSummary
  pagination?: RankingPagination
}

export interface RankingQuery {
  fromDate: string
  toDate: string
  branchId?: string
  page: number
  limit: number
}

interface RankingReportPageProps<T extends RankingRow> {
  /** Tên trong breadcrumb và tiêu đề trang. */
  pageTitle: string
  pageDescription: string
  tableTitle: string
  tableDescription: string
  /** Cột tên (sau STT); các cột số dùng chung `revenueColumns`. */
  nameColumn: ReportColumn<T>
  rowKey: (row: T, index: number) => string
  /** Tên đơn vị trên thanh phân trang, vd. "nhân viên". */
  unit: string
  /** `section` của `/stats/export/report` và tên file. */
  exportSection: "staff" | "branch"
  exportSlug: string
  /** Tham số thêm của file xuất, theo lựa chọn đang xem (vd. cách tính người). */
  exportParams?: { staffGroupBy?: RevenueByStaffGroupBy }
  /** Phải `useCallback` theo các lựa chọn riêng của trang: đổi hàm là tải lại. */
  load: (query: RankingQuery) => Promise<RankingPage<T>>
  /** Bộ lọc riêng của bảng, đặt ở góc phải tiêu đề bảng. */
  actions?: ReactNode
  note?: ReactNode
}

export function RankingReportPage<T extends RankingRow>({
  pageTitle,
  pageDescription,
  tableTitle,
  tableDescription,
  nameColumn,
  rowKey,
  unit,
  exportSection,
  exportSlug,
  exportParams,
  load,
  actions,
  note,
}: RankingReportPageProps<T>) {
  const { period, setPeriod: setPeriodParam } = useReportPeriod()
  const location = useReportLocation()
  const { branchId, warehouseId, place } = location

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_REPORT_PAGE_SIZE)
  const [reloadKey, setReloadKey] = useState(0)

  // Đổi kỳ hay nơi xem thì về trang đầu.
  const setPeriod = (next: ReportPeriod) => {
    setPage(1)
    setPeriodParam(next)
  }
  const setLocationKey = (key: string) => {
    setPage(1)
    location.setLocationKey(key)
  }

  const request = useCallback(
    () => load({ fromDate: period.fromDate, toDate: period.toDate, branchId: place, page, limit: pageSize }),
    [load, period.fromDate, period.toDate, place, page, pageSize],
  )
  const { data, isLoading, failed } = useAsyncData(request, reloadKey)
  const rows = data?.rows ?? []

  const exportFile = () =>
    statsApi.exportReport({
      fromDate: period.fromDate,
      toDate: period.toDate,
      branchId,
      warehouseId,
      section: exportSection,
      ...exportParams,
    })

  return (
    <div className="flex-1 space-y-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Báo cáo", href: "/reports" }, { label: pageTitle }]}
        title={pageTitle}
        description={pageDescription}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ExportExcelButton load={exportFile} filename={`${exportSlug}_${period.fromDate}_${period.toDate}.xlsx`} />
        <ReportLocationSelect location={{ ...location, setLocationKey }} />
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

      <ReportTable
        title={tableTitle}
        description={tableDescription}
        actions={actions}
        isLoading={isLoading && !data}
        emptyText={failed ? `Không tải được ${tableTitle.toLowerCase()}` : undefined}
        rows={rows}
        rowKey={rowKey}
        columns={[
          { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
          { ...nameColumn, footer: "Cộng" },
          ...revenueColumns(rows, data?.summary),
        ]}
        note={note}
        pagination={{
          page,
          pageSize,
          total: data?.pagination?.total ?? rows.length,
          unit,
          disabled: isLoading,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
      />
    </div>
  )
}
