"use client"

import { Store } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatNumber, formatVND, negativeClass } from "@/lib/stats-format"

/** Tỷ trọng doanh thu theo chi nhánh; chỉ có ý nghĩa khi người xem thấy từ hai chi nhánh trở lên. */
export function BranchRevenue() {
  const { revenueByBranch, isLoading } = useDashboard()
  const branches = revenueByBranch?.branches ?? []
  const max = Math.max(...branches.map((b) => b.revenue), 1)
  // Doanh thu thuần có thể âm: thanh chỉ vẽ phần dương, số âm vẫn hiện ở chữ.
  const total = branches.reduce((sum, b) => sum + b.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo chi nhánh</CardTitle>
        <CardDescription>Doanh thu thuần (theo ngày hoàn thành, đã trừ trả hàng) của từng chi nhánh trong kỳ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !revenueByBranch ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : branches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Store className="size-8" />
            Chưa có doanh thu trong kỳ này
          </div>
        ) : (
          branches.map((branch) => (
            <div key={branch.branchId} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{branch.branchName ?? "Chi nhánh"}</span>
                <span className={`shrink-0 tabular-nums ${negativeClass(branch.revenue)}`}>{formatVND(branch.revenue)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(Math.max(branch.revenue, 0) / max) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(branch.orderCount)} đơn · TB {formatVND(branch.aov)} ·{" "}
                {total > 0 ? Math.round((branch.revenue / total) * 100) : 0}% tổng
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
