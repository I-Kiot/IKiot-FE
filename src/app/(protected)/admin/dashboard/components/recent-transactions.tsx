"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboard } from "./admin-dashboard-provider";
import { formatVND } from "../../../dashboard/shared/format";

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PAID: { label: "Thành công", variant: "default" },
  PENDING: { label: "Chờ thanh toán", variant: "secondary" },
  FAILED: { label: "Thất bại", variant: "destructive" },
  REFUNDED: { label: "Hoàn tiền", variant: "outline" },
};

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN");
}

export function RecentTransactions() {
  const { data, isLoading } = useAdminDashboard();
  const invoices = data?.recentInvoices ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Giao dịch gần đây</CardTitle>
          <CardDescription>Hoá đơn gói dịch vụ mới nhất</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="cursor-pointer" asChild>
          <Link href="/admin/transactions">
            <Eye className="h-4 w-4 mr-2" />
            Xem tất cả
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && !data ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Chưa có giao dịch nào.</p>
        ) : (
          invoices.map((inv) => {
            const st = STATUS[inv.status] ?? STATUS.PENDING;
            return (
              <div key={inv.id} className="flex p-3 rounded-lg border gap-3 items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{initials(inv.tenantId?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 items-center flex-wrap justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.tenantId?.name || "Cửa hàng"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {inv.planId?.planName || inv.planId?.planCode || "-"}
                      {inv.paymentReference ? ` · ${inv.paymentReference}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">{formatVND(inv.amount)}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(inv.paidAt || inv.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
