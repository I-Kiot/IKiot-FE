"use client"

import { Store } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatNumber, formatVND } from "@/lib/stats-format"

/** Revenue share per branch - only meaningful when the viewer sees more than one. */
export function BranchRevenue() {
  const { revenueByBranch, isLoading } = useDashboard()
  const branches = revenueByBranch?.branches ?? []
  const max = Math.max(...branches.map((b) => b.revenue), 1)
  const total = branches.reduce((sum, b) => sum + b.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo chi nhánh</CardTitle>
        <CardDescription>So sánh hiệu quả giữa các chi nhánh trong kỳ</CardDescription>
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
                <span className="shrink-0 tabular-nums">{formatVND(branch.revenue)}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(branch.revenue / max) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(branch.orderCount)} đơn · TB {formatVND(branch.aov)} ·{" "}
                {total ? Math.round((branch.revenue / total) * 100) : 0}% tổng
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
