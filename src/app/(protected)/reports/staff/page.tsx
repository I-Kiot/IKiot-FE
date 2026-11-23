"use client"

// [Page – Báo cáo nhân viên] Doanh thu theo nhân viên của kỳ, phân trang; dòng Cộng là tổng cả kỳ.

import { Suspense, useCallback, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statsApi, type RevenueByStaffGroupBy, type RevenueByStaffItem } from "@/lib/api/stats"
import { RankingReportPage, type RankingQuery } from "../components/ranking-report-page"

/** Ba cách tính người: phụ trách đơn (mặc định), người lên đơn, người thu tiền (theo tiền thực thu). */
const STAFF_GROUP_BY: { value: RevenueByStaffGroupBy; label: string; description: string }[] = [
  { value: "assignee", label: "Người phụ trách", description: "Doanh thu thuần theo người phụ trách đơn (đơn quầy tính cho người lên đơn)" },
  { value: "creator", label: "Người lên đơn", description: "Doanh thu thuần theo người tạo đơn" },
  { value: "collector", label: "Người thu tiền", description: "Tiền thực thu theo người thu (ngày thu tiền, không phải ngày hoàn thành đơn)" },
]

function StaffReport() {
  const [groupBy, setGroupBy] = useState<RevenueByStaffGroupBy>("assignee")
  const option = STAFF_GROUP_BY.find((o) => o.value === groupBy) ?? STAFF_GROUP_BY[0]

  const load = useCallback(
    async (query: RankingQuery) => {
      const res = await statsApi.getRevenueByStaff({ ...query, groupBy })
      return { rows: res.staff, summary: res.summary, pagination: res.pagination }
    },
    [groupBy],
  )

  return (
    <RankingReportPage<RevenueByStaffItem>
      pageTitle="Báo cáo nhân viên"
      pageDescription="Doanh thu của từng nhân viên trong kỳ; xuất Excel đúng bảng đang xem"
      tableTitle="Doanh thu theo nhân viên"
      tableDescription={option.description}
      nameColumn={{ header: "Nhân viên", cell: (row) => row.staffName ?? "Không gắn nhân viên" }}
      rowKey={(row, index) => row.userId ?? `none-${index}`}
      unit="nhân viên"
      exportSection="staff"
      exportSlug="doanh-thu-theo-nhan-vien"
      exportParams={{ staffGroupBy: groupBy }}
      load={load}
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
