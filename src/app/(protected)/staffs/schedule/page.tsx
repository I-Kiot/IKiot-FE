"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSessionRole } from "@/lib/auth";
import {
  canCreateSchedule,
  canViewSchedule,
  getScheduleScopeLabel,
} from "@/app/(protected)/staffs/shared/schedule-permissions";
import { ScheduleButtonGroup } from "./components/schedule-button-group";
import { ScheduleCalendar } from "./components/schedule-calendar";

export default function StaffSchedulePage() {
  const userRole = getSessionRole();
  const canView = canViewSchedule(userRole);
  const isReadOnly = canView && !canCreateSchedule(userRole);
  const scopeLabel = getScheduleScopeLabel(userRole);

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Tài khoản của bạn không có quyền xem lịch làm việc. Vui lòng liên hệ
            quản trị viên nếu bạn cần truy cập.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Nhân viên", href: "/staffs" },
          { label: "Lịch làm" },
        ]}
        title="Lịch làm việc"
        actions={
          <div className="flex items-center gap-2">
            {scopeLabel && userRole !== "TENANT_OWNER" && (
              <Badge variant="outline" className="text-muted-foreground">
                {scopeLabel}
              </Badge>
            )}
            {isReadOnly && (
              <Badge
                variant="secondary"
                className="gap-1.5 text-muted-foreground"
              >
                <Eye className="size-3" />
                Chỉ xem
              </Badge>
            )}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href="/staffs/schedule/leave-requests">Đơn nghỉ phép</Link>
            </Button>
            <ScheduleButtonGroup />
          </div>
        }
      />

      <div className="min-h-[640px] rounded-xl border bg-background">
        <div className="p-4 lg:p-5">
          <ScheduleCalendar />
        </div>
      </div>
    </div>
  );
}
