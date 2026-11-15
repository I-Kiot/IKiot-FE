"use client"

import { useCallback } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  statsApi,
  type RevenueByStaff as RevenueByStaffData,
  type RevenueByStaffGroupBy,
  type StatsOverview,
} from "@/lib/api/stats"
import {
  ORDER_STATUS_LABELS,
  formatBucket,
  formatDayVi,
  formatNumber,
  formatPercent,
  formatVND,
  generateDateBuckets,
  negativeClass,
} from "@/lib/stats-format"
import { useAsyncData } from "../../dashboard/hooks/use-async-data"
import { useDashboard } from "./dashboard-provider"
import { Money, ReportTable, sharePct, sumOf, type ReportColumn } from "./report-table"

const REVENUE_NOTE = "Doanh thu thuần ghi theo ngày đơn hoàn thành, đã trừ hàng trả."

// ---------------------------------------------------------------- Kết quả bán hàng

type ResultFormat = "money" | "count" | "percent"

interface ResultRow {
  label: string
  format: ResultFormat
  strong?: boolean
  pick: (overview: StatsOverview) => number
}

/** Tỷ suất lợi nhuận gộp trên doanh thu thuần, một chữ số thập phân. */
const marginOf = (o: StatsOverview): number => (o.revenue > 0 ? Math.round((o.grossProfit / o.revenue) * 1000) / 10 : 0)

const RESULT_ROWS: ResultRow[] = [
  { label: "Doanh thu bán hàng", format: "money", pick: (o) => o.grossSales ?? 0 },
  { label: "Hàng bán bị trả lại", format: "money", pick: (o) => o.returns ?? 0 },
  { label: "Thu nhập khác", format: "money", pick: (o) => o.otherIncome ?? 0 },
  { label: "Doanh thu thuần", format: "money", strong: true, pick: (o) => o.revenue },
  { label: "Giá vốn hàng bán", format: "money", pick: (o) => o.costOfGoods ?? 0 },
  { label: "Chi phí vận chuyển thực", format: "money", pick: (o) => o.shippingCost ?? 0 },
  { label: "Phí sàn", format: "money", pick: (o) => o.channelFee ?? 0 },
  { label: "Lợi nhuận gộp", format: "money", strong: true, pick: (o) => o.grossProfit },
  { label: "Tỷ suất lợi nhuận gộp", format: "percent", pick: marginOf },
  { label: "Số đơn hoàn tất", format: "count", pick: (o) => o.orderCount },
  { label: "Số đơn có hàng trả", format: "count", pick: (o) => o.returnCount ?? 0 },
  { label: "Số khách mua hàng", format: "count", pick: (o) => o.customerCount },
  { label: "Giá trị đơn trung bình", format: "money", pick: (o) => o.aov },
]

function formatResult(value: number, format: ResultFormat): string {
  if (format === "money") return formatVND(value)
  if (format === "percent") return `${formatNumber(value)}%`
  return formatNumber(value)
}

/** % thay đổi so với kỳ trước; kỳ trước bằng 0 thì không có mốc để so. */
function changeOf(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10
}

/** Bảng kết quả bán hàng của kỳ, đặt cạnh khoảng cùng độ dài ngay trước đó. */
export function SalesResultReport() {
  const { overview, previousOverview, revenueDateRange, isLoading } = useDashboard()
  const range = revenueDateRange
  const periodLabel = (from?: string, to?: string) => (from && to ? `${formatDayVi(from)} – ${formatDayVi(to)}` : "")

  const columns: ReportColumn<ResultRow>[] = [
    { header: "Chỉ tiêu", cell: (row) => row.label },
    {
      header: `Kỳ này${range ? ` (${periodLabel(range.fromDate, range.toDate)})` : ""}`,
      numeric: true,
      cell: (row) => {
        const value = overview ? row.pick(overview) : 0
        return <span className={negativeClass(value)}>{formatResult(value, row.format)}</span>
      },
    },
    {
      header: `Kỳ trước${range ? ` (${periodLabel(range.previousFromDate, range.previousToDate)})` : ""}`,
      numeric: true,
      cell: (row) => (previousOverview ? formatResult(row.pick(previousOverview), row.format) : "-"),
    },
    {
      header: "Chênh lệch",
      numeric: true,
      cell: (row) => {
        if (!overview || !previousOverview) return "-"
        const delta = row.pick(overview) - row.pick(previousOverview)
        return <span className={negativeClass(delta)}>{formatResult(delta, row.format)}</span>
      },
    },
    {
      header: "% thay đổi",
      numeric: true,
      cell: (row) => {
        // Tỷ suất đã là phần trăm: chênh lệch tính bằng điểm phần trăm ở cột trước, không tính % của %.
        if (!overview || !previousOverview || row.format === "percent") return "-"
        const pct = changeOf(row.pick(overview), row.pick(previousOverview))
        return <span className={pct !== null ? negativeClass(pct) : ""}>{formatPercent(pct)}</span>
      },
    },
  ]

  const missingCost = overview?.linesMissingCost ?? 0
  return (
    <ReportTable
      title="Kết quả bán hàng"
      description="Doanh thu, giá vốn và lợi nhuận gộp của kỳ, so với khoảng cùng độ dài ngay trước đó"
      columns={columns}
      rows={overview ? RESULT_ROWS : []}
      rowKey={(row) => row.label}
      isStrong={(row) => Boolean(row.strong)}
      isLoading={isLoading && !overview}
      note={
        <>
          {REVENUE_NOTE} Doanh thu bán hàng gồm tiền hàng và phí vận chuyển thu của khách; thu nhập khác là tiền giữ lại khi huỷ
          hoặc trả hàng. Lợi nhuận gộp = doanh thu thuần − giá vốn − chi phí vận chuyển thực − phí sàn.
          {missingCost > 0
            ? ` Có ${formatNumber(missingCost)} dòng hàng đã bán chưa có giá vốn nên lợi nhuận gộp đang cao hơn thực tế.`
            : ""}
        </>
      }
    />
  )
}

// ---------------------------------------------------------------- Theo thời gian

interface TimeRow {
  bucket: string
  orderCount: number
  returns: number
  revenue: number
}

/** Doanh thu từng ngày (hoặc từng tháng với kỳ dài); ngày không có đơn vẫn có dòng. */
export function SalesByTimeReport() {
  const { revenueSeries, revenueDateRange, isLoading } = useDashboard()
  const byBucket = new Map((revenueSeries?.series ?? []).map((point) => [point.bucket, point]))
  const rows: TimeRow[] =
    revenueSeries && revenueDateRange
      ? generateDateBuckets(revenueDateRange.fromDate, revenueDateRange.toDate, revenueDateRange.groupBy).map((bucket) => {
          const point = byBucket.get(bucket)
          return {
            bucket,
            orderCount: point?.orderCount ?? 0,
            returns: point?.returns ?? 0,
            revenue: point?.revenue ?? 0,
          }
        })
      : []
  const orders = sumOf(rows, (r) => r.orderCount)
  const revenue = sumOf(rows, (r) => r.revenue)
  const byMonth = revenueDateRange?.groupBy === "month"

  return (
    <ReportTable
      title={byMonth ? "Doanh thu theo tháng" : "Doanh thu theo ngày"}
      description="Số đơn hoàn tất, hàng trả và doanh thu thuần của từng mốc trong kỳ"
      isLoading={isLoading && !revenueSeries}
      rows={rows}
      rowKey={(row) => row.bucket}
      columns={[
        {
          header: byMonth ? "Tháng" : "Ngày",
          cell: (row) => (byMonth ? formatBucket(row.bucket) : formatDayVi(row.bucket)),
          footer: "Cộng",
        },
        { header: "Số đơn", numeric: true, cell: (row) => formatNumber(row.orderCount), footer: formatNumber(orders) },
        {
          header: "Hàng trả",
          numeric: true,
          cell: (row) => <Money value={row.returns} />,
          footer: <Money value={sumOf(rows, (r) => r.returns)} />,
        },
        {
          header: "Doanh thu thuần",
          numeric: true,
          cell: (row) => <Money value={row.revenue} />,
          footer: <Money value={revenue} />,
        },
        {
          header: "Giá trị đơn TB",
          numeric: true,
          cell: (row) => (row.orderCount > 0 ? formatVND(Math.round(row.revenue / row.orderCount)) : "-"),
          footer: orders > 0 ? formatVND(Math.round(revenue / orders)) : "-",
        },
      ]}
      note={REVENUE_NOTE}
    />
  )
}

// ---------------------------------------------------------------- Theo hàng hóa

export function SalesByProductReport() {
  const { topProducts, isLoading } = useDashboard()
  const rows = topProducts?.products ?? []
  const revenue = sumOf(rows, (r) => r.revenue)

  return (
    <ReportTable
      title="Doanh thu theo hàng hóa"
      description="Số lượng và tiền hàng bán ra của từng mặt hàng trong kỳ, đã trừ hàng trả; xếp theo doanh thu"
      isLoading={isLoading && !topProducts}
      rows={rows}
      rowKey={(row) => row.productItemId}
      columns={[
        { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
        { header: "Hàng hóa", cell: (row) => row.productName, footer: "Cộng" },
        {
          header: "Số lượng bán",
          numeric: true,
          cell: (row) => formatNumber(row.quantity),
          footer: formatNumber(sumOf(rows, (r) => r.quantity)),
        },
        { header: "Doanh thu", numeric: true, cell: (row) => <Money value={row.revenue} />, footer: <Money value={revenue} /> },
        { header: "Tỷ trọng", numeric: true, cell: (row) => sharePct(row.revenue, revenue) },
      ]}
      note="Tối đa 50 mặt hàng có doanh thu cao nhất. Món trong combo có dòng riêng với doanh thu 0 (tiền nằm ở dòng combo)."
    />
  )
}

// ---------------------------------------------------------------- Theo chi nhánh / nhân viên / khách hàng

/** Bốn cột số chung của các bảng doanh thu theo đối tượng. */
function revenueColumns<T extends { orderCount: number; revenue: number; aov: number }>(rows: T[]): ReportColumn<T>[] {
  const revenue = sumOf(rows, (r) => r.revenue)
  return [
    {
      header: "Số đơn",
      numeric: true,
      cell: (row) => formatNumber(row.orderCount),
      footer: formatNumber(sumOf(rows, (r) => r.orderCount)),
    },
    { header: "Doanh thu thuần", numeric: true, cell: (row) => <Money value={row.revenue} />, footer: <Money value={revenue} /> },
    { header: "Giá trị đơn TB", numeric: true, cell: (row) => formatVND(row.aov), footer: "" },
    { header: "Tỷ trọng", numeric: true, cell: (row) => sharePct(row.revenue, revenue), footer: "" },
  ]
}

export function SalesByBranchReport() {
  const { revenueByBranch, isLoading } = useDashboard()
  const rows = revenueByBranch?.branches ?? []

  return (
    <ReportTable
      title="Doanh thu theo chi nhánh"
      description="Doanh thu thuần của từng chi nhánh trong kỳ"
      isLoading={isLoading && !revenueByBranch}
      rows={rows}
      rowKey={(row) => row.branchId}
      columns={[
        { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
        { header: "Chi nhánh", cell: (row) => row.branchName ?? "Chi nhánh", footer: "Cộng" },
        ...revenueColumns(rows),
      ]}
      note={REVENUE_NOTE}
    />
  )
}

/** Ba cách tính người: phụ trách đơn (mặc định), người lên đơn, người thu tiền (theo tiền thực thu). */
const STAFF_GROUP_BY: { value: RevenueByStaffGroupBy; label: string; description: string }[] = [
  { value: "assignee", label: "Người phụ trách", description: "Doanh thu thuần theo người phụ trách đơn (đơn quầy tính cho người lên đơn)" },
  { value: "creator", label: "Người lên đơn", description: "Doanh thu thuần theo người tạo đơn" },
  { value: "collector", label: "Người thu tiền", description: "Tiền thực thu theo người thu (ngày thu tiền, không phải ngày hoàn thành đơn)" },
]

export function SalesByStaffReport() {
  const { revenueDateRange, place, staffGroupBy: groupBy, setStaffGroupBy: setGroupBy } = useDashboard()

  // Kỳ chưa quy ra ngày (lần tải đầu của trang): chưa gọi, vẫn hiện khung chờ.
  const load = useCallback(
    () =>
      !revenueDateRange
        ? new Promise<RevenueByStaffData>(() => {})
        : statsApi.getRevenueByStaff({
            fromDate: revenueDateRange.fromDate,
            toDate: revenueDateRange.toDate,
            branchId: place,
            groupBy,
          }),
    [revenueDateRange, place, groupBy],
  )
  const { data, isLoading, failed } = useAsyncData(load)
  const rows = data?.staff ?? []
  const option = STAFF_GROUP_BY.find((o) => o.value === groupBy) ?? STAFF_GROUP_BY[0]

  return (
    <ReportTable
      title="Doanh thu theo nhân viên"
      description={option.description}
      isLoading={isLoading && !data}
      emptyText={failed ? "Không tải được doanh thu theo nhân viên" : undefined}
      rows={rows}
      rowKey={(row, index) => row.userId ?? `none-${index}`}
      actions={
        <Select value={groupBy} onValueChange={(value) => setGroupBy(value as RevenueByStaffGroupBy)}>
          <SelectTrigger className="w-44 cursor-pointer" aria-label="Tính theo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STAFF_GROUP_BY.map((o) => (
              <SelectItem key={o.value} value={o.value} className="cursor-pointer">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      columns={[
        { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
        { header: "Nhân viên", cell: (row) => row.staffName ?? "Không gắn nhân viên", footer: "Cộng" },
        ...revenueColumns(rows),
      ]}
    />
  )
}

export function SalesByCustomerReport() {
  const { topCustomers, isLoading } = useDashboard()
  const rows = topCustomers?.customers ?? []

  return (
    <ReportTable
      title="Doanh thu theo khách hàng"
      description="Khách mua nhiều nhất trong kỳ, xếp theo doanh thu thuần; không gồm khách vãng lai"
      isLoading={isLoading && !topCustomers}
      rows={rows}
      rowKey={(row) => row.customerId}
      columns={[
        { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
        { header: "Khách hàng", cell: (row) => row.name ?? "Không rõ", footer: "Cộng" },
        { header: "Số điện thoại", cell: (row) => row.phone ?? "-", footer: "" },
        ...revenueColumns(rows),
      ]}
      note="Tối đa 50 khách có doanh thu cao nhất; tỷ trọng tính trên tổng của các khách trong bảng."
    />
  )
}

// ---------------------------------------------------------------- Đơn hàng theo trạng thái

export function OrdersByStatusReport() {
  const { ordersByStatus, isLoading } = useDashboard()
  const rows = ordersByStatus?.statuses ?? []
  const total = ordersByStatus?.totalCount ?? 0

  return (
    <ReportTable
      title="Đơn hàng theo trạng thái"
      description="Mọi đơn tạo trong kỳ, gồm cả đơn huỷ và trả hàng"
      isLoading={isLoading && !ordersByStatus}
      rows={rows}
      rowKey={(row) => row.status}
      columns={[
        { header: "Trạng thái", cell: (row) => ORDER_STATUS_LABELS[row.status] ?? row.status, footer: "Cộng" },
        { header: "Số đơn", numeric: true, cell: (row) => formatNumber(row.count), footer: formatNumber(total) },
        { header: "Tỷ lệ", numeric: true, cell: (row) => sharePct(row.count, total), footer: "" },
        {
          header: "Giá trị đơn",
          numeric: true,
          cell: (row) => formatVND(row.total),
          footer: formatVND(sumOf(rows, (r) => r.total)),
        },
      ]}
      note="Giá trị đơn là tổng tiền của đơn theo trạng thái hiện tại, không phải doanh thu đã ghi nhận."
    />
  )
}
