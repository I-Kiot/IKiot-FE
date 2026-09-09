"use client"

import { Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "./dashboard-provider"
import { formatVND, formatNumber } from "../shared/format"

function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

export function RevenueByStaff() {
  const { revenueByStaff, isLoading } = useDashboard()
  const staff = revenueByStaff?.staff ?? []

  return (
    <Card className="cursor-pointer">
      <CardHeader className="pb-4">
        <CardTitle>Doanh thu theo nhân viên</CardTitle>
        <CardDescription>Xếp hạng theo doanh thu đơn hàng đã hoàn tất</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !revenueByStaff ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
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
                    <p className="text-sm font-medium">{formatVND(member.revenue)}</p>
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
