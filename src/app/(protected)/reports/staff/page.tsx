"use client"

// [Page – Báo cáo nhân viên] Doanh thu theo nhân viên của kỳ; chọn một nhân viên để xem từng đơn tạo nên doanh thu đó.

import { Suspense, useCallback, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  NO_STAFF_ID,
  statsApi,
  type RevenueByStaffEntry,
  type RevenueByStaffGroupBy,
  type RevenueByStaffItem,
} from "@/lib/api/stats"
import { formatDayVi, formatNumber, formatVND, JOURNAL_ENTRY_TYPE_LABELS, negativeClass, paymentMethodLabel } from "@/lib/stats-format"
import { useAsyncData } from "../../dashboard/hooks/use-async-data"
import { RankingReportPage, type RankingContext, type RankingQuery } from "../components/ranking-report-page"
import { DEFAULT_REPORT_PAGE_SIZE, ReportTable } from "../components/report-table"

/** Bốn cách tính người: nhân viên bán hàng (mặc định), phụ trách đơn, người lên đơn, người thu tiền (theo tiền thực thu). */
const STAFF_GROUP_BY: { value: RevenueByStaffGroupBy; label: string; description: string; entries: string }[] = [
  {
    value: "seller",
    label: "Nhân viên bán hàng",
    description: "Doanh thu thuần theo nhân viên bán hàng chọn lúc tạo đơn (đơn quầy là người bán)",
    entries: "Bút toán sổ doanh thu của các đơn do nhân viên bán: bán ghi ngày đơn hoàn thành, trả hàng ghi âm ngày trả",
  },
  {
    value: "assignee",
    label: "Người phụ trách",
    description: "Doanh thu thuần theo người phụ trách đơn (đơn quầy tính cho người lên đơn)",
    entries: "Bút toán sổ doanh thu của các đơn nhân viên phụ trách: bán ghi ngày đơn hoàn thành, trả hàng ghi âm ngày trả",
  },
  {
    value: "creator",
    label: "Người lên đơn",
    description: "Doanh thu thuần theo người tạo đơn",
    entries: "Bút toán sổ doanh thu của các đơn nhân viên tạo: bán ghi ngày đơn hoàn thành, trả hàng ghi âm ngày trả",
  },
  {
    value: "collector",
    label: "Người thu tiền",
    description: "Tiền thực thu theo người thu (ngày thu tiền, không phải ngày hoàn thành đơn)",
    entries: "Từng khoản thu tiền đơn do nhân viên thu, theo ngày thu",
  },
]

const ALL_STAFF = "all"
const NO_STAFF_LABEL = "Không gắn nhân viên"

const KIND_VARIANT: Record<string, "success" | "error" | "secondary"> = {
  SALE: "success",
  RETURN: "error",
  OTHER_INCOME: "secondary",
}

const staffKey = (userId: string | null) => userId ?? NO_STAFF_ID

/** Nhân viên đang xem trên URL (`?staff=<id>|none`), giữ các tham số khác. */
function useStaffParam() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const staff = searchParams.get("staff") ?? ALL_STAFF
  const setStaff = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === ALL_STAFF) params.delete("staff")
      else params.set("staff", next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )
  return { staff, setStaff }
}

/** Dropdown nhân viên: những người có số liệu trong kỳ và nơi đang xem. */
function StaffSelect({
  context,
  groupBy,
  value,
  onChange,
}: {
  context: RankingContext
  groupBy: RevenueByStaffGroupBy
  value: string
  onChange: (value: string) => void
}) {
  const { fromDate, toDate, branchId } = context
  // Nhớ tên đã thấy để vẫn hiện đúng tên khi đổi sang kỳ mà nhân viên đang chọn không có số liệu.
  const [knownNames, setKnownNames] = useState<Record<string, string>>({})
  const load = useCallback(
    () =>
      statsApi.getRevenueByStaff({ fromDate, toDate, branchId, groupBy }).then((res) => {
        setKnownNames((prev) => {
          const next = { ...prev }
          for (const row of res.staff) next[staffKey(row.userId)] = row.staffName ?? NO_STAFF_LABEL
          return next
        })
        return res
      }),
    [fromDate, toDate, branchId, groupBy],
  )
  const { data } = useAsyncData(load)

  const options = (data?.staff ?? [])
    .map((row) => ({ value: staffKey(row.userId), label: row.staffName ?? NO_STAFF_LABEL }))
    .sort((a, b) => a.label.localeCompare(b.label, "vi"))
  if (value !== ALL_STAFF && !options.some((o) => o.value === value)) {
    options.unshift({
      value,
      label: knownNames[value] ?? (value === NO_STAFF_ID ? NO_STAFF_LABEL : "Nhân viên đã chọn"),
    })
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-52 cursor-pointer" aria-label="Nhân viên">
        <SelectValue placeholder="Tất cả nhân viên" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_STAFF} className="cursor-pointer">
          Tất cả nhân viên
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="cursor-pointer">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Từng đơn / khoản thu tạo nên doanh thu của một nhân viên, dòng Cộng khớp dòng của họ trên bảng xếp hạng. */
function StaffEntriesTable({
  context,
  groupBy,
  userId,
  onBack,
}: {
  context: RankingContext
  groupBy: RevenueByStaffGroupBy
  userId: string
  onBack: () => void
}) {
  const { fromDate, toDate, branchId } = context
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_REPORT_PAGE_SIZE)
  const load = useCallback(
    () => statsApi.getRevenueByStaffEntries({ fromDate, toDate, branchId, groupBy, userId, page, limit: pageSize }),
    [fromDate, toDate, branchId, groupBy, userId, page, pageSize],
  )
  const { data, isLoading, failed } = useAsyncData(load)
  const rows = data?.data ?? []
  const summary = data?.summary
  const option = STAFF_GROUP_BY.find((o) => o.value === groupBy) ?? STAFF_GROUP_BY[0]
  const isCollector = groupBy === "collector"
  const name = userId === NO_STAFF_ID ? NO_STAFF_LABEL : (data?.staffName ?? "nhân viên")

  return (
    <ReportTable<RevenueByStaffEntry>
      title={`Đơn hàng của ${name}`}
      description={
        summary
          ? `${option.entries}. ${formatNumber(summary.orderCount)} đơn · ${formatVND(summary.revenue)} · giá trị đơn TB ${formatVND(summary.aov)}`
          : option.entries
      }
      actions={
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Tất cả nhân viên
        </Button>
      }
      isLoading={isLoading && !data}
      emptyText={failed ? "Không tải được đơn hàng của nhân viên" : "Nhân viên không có đơn nào trong kỳ"}
      rows={rows}
      rowKey={(row) => row.id}
      columns={[
        { header: "STT", className: "w-14", cell: (_, index) => index + 1 },
        { header: isCollector ? "Ngày thu" : "Ngày ghi sổ", className: "whitespace-nowrap", cell: (row) => formatDayVi(row.date), footer: "Cộng" },
        isCollector
          ? { header: "Phương thức", cell: (row) => paymentMethodLabel(row.paymentMethod), footer: "" }
          : {
              header: "Loại",
              cell: (row) => (
                <Badge variant={KIND_VARIANT[row.kind] ?? "secondary"}>{JOURNAL_ENTRY_TYPE_LABELS[row.kind] ?? row.kind}</Badge>
              ),
              footer: "",
            },
        {
          header: "Đơn hàng",
          cell: (row) =>
            row.orderId ? (
              <Link href={`/sales/orders/${row.orderId}`} className="font-medium text-primary hover:underline">
                {row.orderCode ?? "Xem đơn"}
              </Link>
            ) : (
              "-"
            ),
          footer: summary ? `${formatNumber(summary.orderCount)} đơn` : "",
        },
        { header: "Khách hàng", cell: (row) => row.customerName ?? "-", footer: "" },
        { header: "Chi nhánh", cell: (row) => row.branchName ?? "-", footer: "" },
        {
          header: isCollector ? "Số tiền thu" : "Doanh thu thuần",
          numeric: true,
          cell: (row) => <span className={negativeClass(row.amount)}>{formatVND(row.amount)}</span>,
          footer: summary ? <span className={negativeClass(summary.revenue)}>{formatVND(summary.revenue)}</span> : "",
        },
      ]}
      note={
        isCollector
          ? "Một đơn có thể có nhiều khoản thu (cọc, phần còn lại); số đơn đếm mỗi đơn một lần."
          : "Số đơn chỉ đếm dòng Bán hàng; Trả hàng (âm) và Thu nhập khác cộng vào doanh thu thuần của kỳ chúng được ghi."
      }
      pagination={{
        page,
        pageSize,
        total: data?.pagination.total ?? rows.length,
        unit: isCollector ? "khoản thu" : "bút toán",
        disabled: isLoading,
        onPageChange: setPage,
        onPageSizeChange: (size) => {
          setPageSize(size)
          setPage(1)
        },
      }}
    />
  )
}

function StaffReport() {
  const [groupBy, setGroupBy] = useState<RevenueByStaffGroupBy>("seller")
  const { staff, setStaff } = useStaffParam()
  const option = STAFF_GROUP_BY.find((o) => o.value === groupBy) ?? STAFF_GROUP_BY[0]

  const load = useCallback(
    async (query: RankingQuery) => {
      const res = await statsApi.getRevenueByStaff({ ...query, groupBy })
      return { rows: res.staff, summary: res.summary, pagination: res.pagination }
    },
    [groupBy],
  )

  const groupBySelect = (
    <Select value={groupBy} onValueChange={(value) => setGroupBy(value as RevenueByStaffGroupBy)}>
      <SelectTrigger className="w-48 cursor-pointer" aria-label="Tính theo">
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
  )

  return (
    <RankingReportPage<RevenueByStaffItem>
      pageTitle="Báo cáo nhân viên"
      pageDescription="Doanh thu của từng nhân viên trong kỳ; chọn một nhân viên để xem các đơn của họ"
      tableTitle="Doanh thu theo nhân viên"
      tableDescription={option.description}
      nameColumn={{
        header: "Nhân viên",
        cell: (row) => (
          <button
            type="button"
            className="cursor-pointer text-left font-medium text-primary hover:underline"
            onClick={() => setStaff(staffKey(row.userId))}
          >
            {row.staffName ?? NO_STAFF_LABEL}
          </button>
        ),
      }}
      rowKey={(row, index) => row.userId ?? `none-${index}`}
      unit="nhân viên"
      exportSection="staff"
      exportSlug="doanh-thu-theo-nhan-vien"
      exportParams={{ staffGroupBy: groupBy }}
      load={load}
      actions={groupBySelect}
      filters={(context) => (
        <>
          {staff === ALL_STAFF ? null : groupBySelect}
          <StaffSelect context={context} groupBy={groupBy} value={staff} onChange={setStaff} />
        </>
      )}
      detail={(context) =>
        staff === ALL_STAFF ? null : (
          <StaffEntriesTable
            key={`${staff}|${groupBy}|${context.fromDate}|${context.toDate}|${context.branchId ?? ""}`}
            context={context}
            groupBy={groupBy}
            userId={staff}
            onBack={() => setStaff(ALL_STAFF)}
          />
        )
      }
    />
  )
}

/** Bọc Suspense vì kỳ đọc từ URL (`useSearchParams`). */
export default function StaffReportPage() {
  return (
    <Suspense fallback={null}>
      <StaffReport />
    </Suspense>
  )
}
