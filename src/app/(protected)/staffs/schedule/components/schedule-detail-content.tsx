"use client";

import type { ReactNode } from "react";
import { formatVietnamDateTime, formatVietnamWorkDate } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import {
  CalendarDays,
  Clock,
  Fingerprint,
  Hash,
  Lock,
  MapPin,
  Phone,
  Timer,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAttendanceDateTime,
  formatAttendanceLocation,
  formatWorkedMinutes,
  getAttendanceStatusDisplay,
  hasAttendanceLocation,
} from "@/app/(protected)/staffs/shared/attendance-status";
import { SCHEDULE_STATUS_MAP } from "@/app/(protected)/staffs/shared/schedule-status";
import {
  formatShiftTimeRange,
  isScheduleLocked,
} from "@/app/(protected)/staffs/shared/schedule-utils";
import type { ScheduleAssignee, WorkingSchedule } from "@/types/working-schedule";
import { cn } from "@/lib/utils";
import { ScheduleStaffAvatar } from "./schedule-staff-avatar";

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

const STATUS_ACCENT: Record<
  WorkingSchedule["status"],
  { gradient: string; ring: string }
> = {
  SCHEDULED: {
    gradient: "from-sky-500/20 via-sky-500/5 to-transparent",
    ring: "ring-sky-500/20",
  },
  COMPLETED: {
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    ring: "ring-emerald-500/20",
  },
  CANCELLED: {
    gradient: "from-muted via-muted/40 to-transparent",
    ring: "ring-border",
  },
};

function AssigneeAttendanceCard({ assignee }: { assignee: ScheduleAssignee }) {
  const attendanceStatus = getAttendanceStatusDisplay(assignee.attendance?.status);

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <ScheduleStaffAvatar
          name={assignee.staffName}
          avatarUrl={assignee.staffAvatarUrl}
          className="size-9"
          fallbackClassName="text-sm font-semibold"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{assignee.staffName}</p>
          <p className="text-xs text-muted-foreground">
            {assignee.staffPhone || "-"}
          </p>
        </div>
        <Badge variant={attendanceStatus.variant}>{attendanceStatus.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoItem
          icon={<Clock className="size-4" />}
          label="Check-in thực tế"
          value={formatAttendanceDateTime(assignee.attendance?.actualCheckinAt)}
        />
        <InfoItem
          icon={<Clock className="size-4" />}
          label="Check-out thực tế"
          value={formatAttendanceDateTime(assignee.attendance?.actualCheckoutAt)}
        />
        <InfoItem
          icon={<Timer className="size-4" />}
          label="Đi muộn"
          value={
            assignee.attendance?.lateMinutes != null
              ? `${assignee.attendance.lateMinutes} phút`
              : "-"
          }
        />
        <InfoItem
          icon={<Timer className="size-4" />}
          label="Giờ làm thực tế"
          value={formatWorkedMinutes(assignee.attendance?.workedMinutes)}
        />
        <InfoItem
          icon={<Timer className="size-4" />}
          label="Tăng ca"
          value={
            assignee.attendance?.overtimeMinute != null
              ? `${assignee.attendance.overtimeMinute} phút`
              : "-"
          }
        />
        {hasAttendanceLocation(assignee.attendance?.checkInLocation) && (
          <div className="col-span-2">
            <InfoItem
              icon={<MapPin className="size-4" />}
              label="Vị trí check-in"
              value={formatAttendanceLocation(assignee.attendance.checkInLocation)}
            />
          </div>
        )}
        {hasAttendanceLocation(assignee.attendance?.checkOutLocation) && (
          <div className="col-span-2">
            <InfoItem
              icon={<MapPin className="size-4" />}
              label="Vị trí check-out"
              value={formatAttendanceLocation(
                assignee.attendance.checkOutLocation,
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type ScheduleDetailContentProps = {
  data: WorkingSchedule;
  loading?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  readOnlyHint?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ScheduleDetailContent({
  data,
  loading = false,
  canEdit = false,
  canDelete = false,
  readOnlyHint,
  onEdit,
  onDelete,
}: ScheduleDetailContentProps) {
  const status = SCHEDULE_STATUS_MAP[data.status];
  const isLocked = isScheduleLocked(data.status);
  const shiftTime = formatShiftTimeRange(data.startTime, data.endTime);
  const accent = STATUS_ACCENT[data.status] ?? STATUS_ACCENT.SCHEDULED;
  const assignees = data.assignees.length > 0 ? data.assignees : [];

  if (loading) {
    return (
      <div className="px-5 py-5 space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          "border-b bg-gradient-to-br px-5 pt-5 pb-4",
          accent.gradient,
        )}
      >
        {assignees.length <= 1 ? (
          /* --- single assignee: avatar + tên --- */
          <div className="flex items-start gap-4">
            <ScheduleStaffAvatar
              name={data.staffName}
              avatarUrl={data.staffAvatarUrl}
              className={cn(
                "size-[3.25rem] shadow-sm ring-2 bg-background",
                accent.ring,
              )}
              fallbackClassName="text-base font-bold"
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="truncate text-lg font-semibold">
                {data.staffName}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {data.shiftName !== "-" ? data.shiftName : "Ca làm việc"}
                {" · "}
                {shiftTime}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant={data.scheduleType === "OVERTIME" ? "default" : "outline"}>
                  {data.scheduleType === "OVERTIME" ? "Tăng ca" : "Ca thường"}
                </Badge>
                {data.dayInfo?.isHoliday && (
                  <Badge variant="secondary">
                    {data.dayInfo.holidayName || "Ngày lễ"}
                  </Badge>
                )}
                {data.dayInfo?.isSunday && !data.dayInfo?.isHoliday && (
                  <Badge variant="secondary">Chủ nhật</Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* --- multi-assignee: shift là tiêu đề chính --- */
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">
                {data.shiftName !== "-" ? data.shiftName : "Ca làm việc"}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{shiftTime}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{assignees.length} nhân viên</Badge>
                <Badge variant={data.scheduleType === "OVERTIME" ? "default" : "outline"}>
                  {data.scheduleType === "OVERTIME" ? "Tăng ca" : "Ca thường"}
                </Badge>
                {data.dayInfo?.isHoliday && (
                  <Badge variant="secondary">
                    {data.dayInfo.holidayName || "Ngày lễ"}
                  </Badge>
                )}
                {data.dayInfo?.isSunday && !data.dayInfo?.isHoliday && (
                  <Badge variant="secondary">Chủ nhật</Badge>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {assignees.map((a) => (
                <div
                  key={a.userId}
                  className="flex items-center gap-1.5 rounded-full border bg-background/80 px-2 py-0.5 text-xs"
                >
                  <ScheduleStaffAvatar
                    name={a.staffName}
                    avatarUrl={a.staffAvatarUrl}
                    className="size-4"
                    fallbackClassName="text-[9px] font-bold"
                  />
                  <span className="font-medium">{a.staffName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <InfoItem
            icon={<CalendarDays className="size-4" />}
            label="Ngày làm"
            value={formatVietnamWorkDate(data.workDate)}
          />
          <InfoItem
            icon={<Clock className="size-4" />}
            label="Khung giờ ca"
            value={shiftTime}
          />
          <InfoItem
            icon={<Timer className="size-4" />}
            label="Loại ca"
            value={data.scheduleType === "OVERTIME" ? "Tăng ca" : "Ca thường"}
          />
          {data.dayInfo && (
            <InfoItem
              icon={<CalendarDays className="size-4" />}
              label="Loại ngày"
              value={
                data.dayInfo.isHoliday
                  ? data.dayInfo.holidayName || "Ngày lễ"
                  : data.dayInfo.isSunday
                    ? "Chủ nhật"
                    : "Ngày thường"
              }
            />
          )}
          {data.managedByName && (
            <InfoItem
              icon={<User className="size-4" />}
              label="Người phân ca"
              value={data.managedByName}
            />
          )}
          <InfoItem
            icon={<Phone className="size-4" />}
            label="Liên hệ"
            value={data.staffPhone || "-"}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Fingerprint className="size-4 text-primary" />
            Chấm công theo nhân viên
          </div>
          {assignees.map((assignee) => (
            <AssigneeAttendanceCard key={assignee.userId} assignee={assignee} />
          ))}
        </div>

        <div className="rounded-xl border bg-muted/20 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Thông tin hệ thống
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Ngày tạo</dt>
              <dd className="font-medium">
                {formatVietnamDateTime(data.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cập nhật</dt>
              <dd className="font-medium">
                {formatVietnamDateTime(data.updatedAt)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="size-3" />
                Mã lịch
              </dt>
              <dd className="font-mono font-medium">
                #{data.id.slice(-6).toUpperCase()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {(isLocked || canEdit || canDelete || readOnlyHint) && (
        <div className="border-t bg-muted/20 px-5 py-4">
          {isLocked ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              Lịch đã hoàn thành - không thể sửa hoặc xóa.
            </div>
          ) : readOnlyHint && !canEdit && !canDelete ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              <Lock className="size-4 shrink-0" />
              {readOnlyHint}
            </div>
          ) : (
            <div className="space-y-2">
              {canDelete && assignees.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Xóa sẽ gỡ toàn bộ ca cho {assignees.length} nhân viên trong
                  cùng lịch phân ca.
                </p>
              )}
              {canEdit && assignees.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Sửa ca sẽ áp dụng cho toàn bộ {assignees.length} nhân viên
                  trong cùng lịch phân ca.
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={onEdit}
                  >
                    <Pencil className="mr-2 size-4" />
                    Sửa ca
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Xóa ca làm
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
