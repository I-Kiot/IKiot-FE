"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useDashboard } from "./dashboard-provider"
import { ORDER_STATUS_LABELS, formatNumber, formatVND } from "../shared/format"

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "bg-emerald-500",
  RECEIVED: "bg-emerald-400",
  SHIPPING: "bg-sky-500",
  PICKED_UP: "bg-sky-400",
  PACKED: "bg-indigo-400",
  CONFIRMED: "bg-blue-400",
  PENDING_CONFIRMATION: "bg-amber-400",
  PENDING: "bg-amber-400",
  CANCELLED: "bg-red-500",
  RETURNED: "bg-orange-500",
}

/** Where this period's orders stand - every status, so cancelled and returned orders are visible rather than silently left out of revenue. */
export function OrderStatusChart() {
  const { ordersByStatus, isLoading } = useDashboard()
  const statuses = ordersByStatus?.statuses ?? []
  const total = ordersByStatus?.totalCount ?? 0
  const count = (status: string) => statuses.find((s) => s.status === status)?.count ?? 0
  const lost = count("CANCELLED") + count("RETURNED")
  const lostPct = total ? Math.round((lost / total) * 1000) / 10 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tình trạng đơn hàng</CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatNumber(total)} đơn trong kỳ · ${lostPct}% hủy/trả`
            : "Tất cả đơn tạo trong kỳ, mọi trạng thái"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !ordersByStatus ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
        ) : statuses.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Chưa có đơn hàng trong kỳ này</div>
        ) : (
          <>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {statuses.map((s) => (
                <div
                  key={s.status}
                  className={cn("h-full", STATUS_COLOR[s.status] ?? "bg-muted-foreground/50")}
                  style={{ width: `${(s.count / total) * 100}%` }}
                  title={`${ORDER_STATUS_LABELS[s.status] ?? s.status}: ${s.count}`}
                />
              ))}
            </div>
            <ul className="space-y-2.5">
              {statuses.map((s) => (
                <li key={s.status} className="flex items-center gap-3 text-sm">
                  <span className={cn("size-2.5 shrink-0 rounded-full", STATUS_COLOR[s.status] ?? "bg-muted-foreground/50")} />
                  <span className="flex-1 truncate">{ORDER_STATUS_LABELS[s.status] ?? s.status}</span>
                  <span className="tabular-nums text-muted-foreground">{formatVND(s.total)}</span>
                  <span className="w-16 text-right font-medium tabular-nums">
                    {formatNumber(s.count)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({Math.round((s.count / total) * 100)}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
