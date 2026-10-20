"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatNumber, formatVND } from "@/lib/stats-format"

export function TopCustomers() {
  const { topCustomers, isLoading } = useDashboard()
  const customers = topCustomers?.customers ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Khách hàng mua nhiều nhất</CardTitle>
        <CardDescription>Xếp hạng theo doanh thu, không gồm khách vãng lai</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !topCustomers ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Users className="size-8" />
            Chưa có khách hàng định danh nào mua trong kỳ này
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.customerId} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{customer.name ?? "Khách hàng"}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.phone ? `${customer.phone} · ` : ""}
                  {formatNumber(customer.orderCount)} đơn
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums">{formatVND(customer.revenue)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
