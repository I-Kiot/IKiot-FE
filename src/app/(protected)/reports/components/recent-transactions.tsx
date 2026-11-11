"use client"

import { useCallback, useState } from "react"
import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statsApi, type RevenueByStaff as RevenueByStaffData, type RevenueByStaffGroupBy } from "@/lib/api/stats"
import { useAsyncData } from "../../dashboard/hooks/use-async-data"
import { useDashboard } from "./dashboard-provider"
import { formatVND, formatNumber, negativeClass } from "@/lib/stats-format"

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

/** Ba cách tính người: phụ trách đơn (mặc định), người lên đơn, người thu tiền (theo tiền thực thu). */
const GROUP_BY_OPTIONS: { value: RevenueByStaffGroupBy; label: string; description: string }[] = [
  { value: "assignee", label: "Người phụ trách", description: "Doanh thu thuần theo người phụ trách đơn (đơn quầy tính cho người lên đơn)" },
  { value: "creator", label: "Người lên đơn", description: "Doanh thu thuần theo người tạo đơn" },
  { value: "collector", label: "Người thu tiền", description: "Tiền thực thu theo người thu (ngày thu tiền, không phải ngày hoàn thành đơn)" },
]

export function RevenueByStaff() {
  const { revenueDateRange, place } = useDashboard()
  const [groupBy, setGroupBy] = useState<RevenueByStaffGroupBy>("assignee")

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
  const staff = data?.staff ?? []
  const option = GROUP_BY_OPTIONS.find((o) => o.value === groupBy) ?? GROUP_BY_OPTIONS[0]

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-4">
        <div className="space-y-1.5">
          <CardTitle>Doanh thu theo nhân viên</CardTitle>
          <CardDescription>{option.description}</CardDescription>
        </div>
        <Select value={groupBy} onValueChange={(value) => setGroupBy(value as RevenueByStaffGroupBy)}>
          <SelectTrigger className="w-44 cursor-pointer" aria-label="Tính theo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GROUP_BY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="cursor-pointer">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className={`space-y-4 transition-opacity ${isLoading && data ? "opacity-60" : ""}`}>
        {isLoading && !data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : failed ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Không tải được doanh thu theo nhân viên</div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Users className="h-8 w-8" />
            Chưa có doanh thu nhân viên trong khoảng thời gian này
          </div>
        ) : (
          staff.map((member) => {
            const displayName = member.staffName ?? member.userId
            return (
              <div key={member.userId} className="flex p-3 rounded-lg border gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initialsOf(displayName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center flex-wrap justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatNumber(member.orderCount)} đơn · TB {formatVND(member.aov)}/đơn
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${negativeClass(member.revenue)}`}>{formatVND(member.revenue)}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
