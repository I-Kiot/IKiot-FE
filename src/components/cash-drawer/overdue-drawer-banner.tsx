"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cashDrawerApi } from "@/lib/api/cash-drawer";
import { getCachedUser } from "@/lib/auth";
import { canFinalizeCashDrawer } from "@/components/sidebar/constants/role-permissions";
import type { OverdueCashDrawer } from "@/types/cash-drawer";

/** `2026-11-10` hoặc `2026-11-10T00:00:00.000Z` (cột date) -> `10/11`. Cắt chuỗi, không qua `Date`, để múi giờ máy không đẩy lệch một ngày. */
export function shortBusinessDate(businessDate: string): string {
  const [, month, day] = businessDate.slice(0, 10).split("-");
  return `${day}/${month}`;
}

/**
 * Cảnh báo két quên chốt từ ngày trước, ở màn két và màn bán tại quầy. Người có quyền chốt thấy nút vào chốt; người
 * khác được nhắc báo quản lý. Lỗi tải (ví dụ tài khoản không có quyền đọc két) thì không hiện gì - cảnh báo không được
 * chặn màn đang dùng.
 */
export function OverdueDrawerBanner({
  branchId,
  className,
}: {
  /** Chỉ cảnh báo cho chi nhánh này; bỏ trống = mọi chi nhánh người dùng xem được. */
  branchId?: string;
  className?: string;
}) {
  const [drawers, setDrawers] = useState<OverdueCashDrawer[]>([]);
  const canFinalize = canFinalizeCashDrawer(getCachedUser()?.role);

  useEffect(() => {
    let stale = false;
    cashDrawerApi
      .getOverdue(branchId)
      .then((list) => {
        if (!stale) setDrawers(list);
      })
      .catch(() => {
        if (!stale) setDrawers([]);
      });
    return () => {
      stale = true;
    };
  }, [branchId]);

  if (drawers.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {drawers.map((drawer) => (
        <div
          key={drawer.id}
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-foreground">
                Két ngày {shortBusinessDate(drawer.businessDate)}
                {drawer.branch?.name ? ` của ${drawer.branch.name}` : ""} chưa chốt
              </p>
              <p className="text-muted-foreground">
                {canFinalize
                  ? "Đếm tiền và chốt két trước khi mở két mới. Trong lúc chờ chốt, két này không bàn giao được."
                  : "Vui lòng báo quản lý đếm tiền và chốt két. Trong lúc chờ chốt, két này không bàn giao được."}
              </p>
            </div>
          </div>
          {canFinalize && (
            <Button asChild size="sm" variant="outline" className="shrink-0 self-start sm:self-center">
              <Link href={`/cash-drawers/${drawer.id}`}>Vào chốt két</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
