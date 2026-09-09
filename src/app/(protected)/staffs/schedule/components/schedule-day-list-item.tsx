"use client";

import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAttendanceStatusDisplay } from "@/app/(protected)/staffs/shared/attendance-status";
import { SCHEDULE_STATUS_MAP } from "@/app/(protected)/staffs/shared/schedule-status";
import { formatShiftTimeRange } from "@/app/(protected)/staffs/shared/schedule-utils";
import type { CalendarScheduleEntry } from "@/app/(protected)/staffs/shared/schedule-utils";
import type { WorkingSchedule } from "@/types/working-schedule";
import { ScheduleStaffAvatar } from "./schedule-staff-avatar";

/** Hiển thị assignee-level trong day panel - mỗi entry là 1 người/1 ca. */
export function ScheduleDayListItem({
  entry,
  isActive,
  onSelect,
}: {
  entry: CalendarScheduleEntry;
  isActive?: boolean;
  onSelect: () => void;
}) {
  const { schedule, displayName, displayAvatarUrl, displayAttendance } = entry;
  const status = SCHEDULE_STATUS_MAP[schedule.status];
  const attendance = getAttendanceStatusDisplay(displayAttendance?.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "bg-card hover:bg-accent/50",
      )}
    >
      <ScheduleStaffAvatar
        name={displayName}
        avatarUrl={displayAvatarUrl}
        className="size-9 shrink-0"
        fallbackClassName="text-sm font-semibold text-primary bg-primary/10"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
            {status.label}
          </Badge>
          <Badge variant={attendance.variant} className="text-[10px] px-1.5 py-0">
            {attendance.label}
          </Badge>
          {schedule.scheduleType === "OVERTIME" && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Tăng ca
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          <span className="truncate">
            {schedule.shiftName !== "-" ? `${schedule.shiftName} · ` : ""}
            {formatShiftTimeRange(schedule.startTime, schedule.endTime)}
          </span>
        </div>
      </div>
    </button>
  );
}

/** Hiển thị schedule-level trong các view khác (1 card = 1 ca, có thể nhiều người). */
export function ScheduleGroupListItem({
  schedule,
  isActive,
  onSelect,
}: {
  schedule: WorkingSchedule;
  isActive?: boolean;
  onSelect: () => void;
}) {
  const status = SCHEDULE_STATUS_MAP[schedule.status];
  const assignees = schedule.assignees;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "bg-card hover:bg-accent/50",
      )}
    >
      {assignees.length <= 1 ? (
        <ScheduleStaffAvatar
          name={schedule.staffName}
          avatarUrl={schedule.staffAvatarUrl}
          className="size-9 shrink-0"
          fallbackClassName="text-sm font-semibold text-primary bg-primary/10"
        />
      ) : (
        <div className="relative h-9 w-9 shrink-0">
          {assignees.slice(0, 2).map((a, i) => (
            <div
              key={a.userId}
              className={cn(
                "absolute rounded-full border-2 border-background",
                i === 0 ? "top-0 left-0 z-10" : "bottom-0 right-0",
              )}
            >
              <ScheduleStaffAvatar
                name={a.staffName}
                avatarUrl={a.staffAvatarUrl}
                className="size-5"
                fallbackClassName="text-[9px] font-bold text-primary bg-primary/10"
              />
            </div>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">
            {schedule.shiftName !== "-" ? schedule.shiftName : "Ca làm việc"}
          </p>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 shrink-0">
            {status.label}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          <span>{formatShiftTimeRange(schedule.startTime, schedule.endTime)}</span>
          <span className="mx-1 opacity-40">·</span>
          <span className="truncate">
            {assignees.length > 1
              ? `${assignees.length} nhân viên`
              : schedule.staffName}
          </span>
        </div>
      </div>
    </button>
  );
}
