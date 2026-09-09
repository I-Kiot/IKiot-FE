"use client";

import Link from "next/link";
import { Eye, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "./admin-dashboard-provider";
import { formatVND, formatNumber } from "../../../dashboard/shared/format";

export function TopTenants() {
  const { data, isLoading } = useAdminDashboard();
  const tenants = data?.topTenants ?? [];
  const max = tenants[0]?.revenue || 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Top cửa hàng theo doanh thu</CardTitle>
          <CardDescription>Đóng góp doanh thu gói dịch vụ (luỹ kế)</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
          <Link href="/admin/users">
            <Eye className="h-4 w-4 mr-2" />
            Cửa hàng
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Chưa có doanh thu nào.</p>
        ) : (
          tenants.map((t, i) => (
            <div key={t.tenantId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i === 0 ? <Trophy className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">{t.name || "Cửa hàng"}</span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{formatVND(t.revenue)}</div>
                  <div className="text-xs text-muted-foreground">{formatNumber(t.invoiceCount)} hoá đơn</div>
                </div>
              </div>
              <Progress value={(t.revenue / max) * 100} className="h-1.5" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
