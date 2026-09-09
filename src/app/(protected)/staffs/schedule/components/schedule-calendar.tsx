"use client";

import { memo, useCallback, useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSessionRole } from "@/lib/auth";
import { canFilterScheduleByStaff } from "@/app/(protected)/staffs/shared/schedule-permissions";
import { getAttendanceStatusDisplay } from "@/app/(protected)/staffs/shared/attendance-status";
import { SCHEDULE_STATUS_MAP } from "@/app/(protected)/staffs/shared/schedule-status";
import { toHolidayDateKey } from "@/app/(protected)/staffs/shared/schedule-day-meta";
import {
  expandSchedulesForCalendar,
  formatShiftTimeRange,
  type CalendarScheduleEntry,
} from "@/app/(protected)/staffs/shared/schedule-utils";
import type { WorkingSchedule } from "@/types/working-schedule";
import type { LeaveRequestPerDay } from "@/types/leave-request";
import { ScheduleMonthPicker } from "./schedule-month-picker";
import { useSchedule } from "./schedule-provider";

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_VISIBLE_PER_DAY = 3;
const EMPTY_DAY_ENTRIES: CalendarScheduleEntry[] = [];
const EMPTY_LEAVE_DAYS: LeaveRequestPerDay[] = [];

function leaveChipLabel(item: LeaveRequestPerDay): string {
  return item.status === "PENDING" ? "Chờ duyệt nghỉ" : "Nghỉ phép";
}

function attendanceDotClass(status?: string): string {
  switch (status) {
    case "CHECKED_OUT":
      return "bg-emerald-500";
    case "CHECKED_IN":
      return "bg-sky-500";
    case "LATE":
      return "bg-amber-500";
    case "ABSENT":
      return "bg-red-500";
    default:
      return "bg-muted-foreground/40";
  }
}

function ScheduleDayChip({
  entry,
  isSelected,
  onClick,
}: {
  entry: CalendarScheduleEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { schedule, displayName, displayAttendance } = entry;
  const status = SCHEDULE_STATUS_MAP[schedule.status];
  const isOvertime = schedule.scheduleType === "OVERTIME";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full rounded px-1.5 py-0.5 text-left text-[11px] leading-tight truncate cursor-pointer",
        "border transition-colors hover:opacity-90 flex items-center gap-1",
        isSelected && "ring-2 ring-primary ring-offset-1",
        status.variant === "success" &&
          "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
        status.variant === "info" &&
          "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300",
        status.variant === "secondary" &&
          "bg-muted border-border text-muted-foreground",
        isOvertime && "border-amber-500/50",
      )}
      title={`${displayName} · ${schedule.shiftName}${isOvertime ? " · Tăng ca" : ""} · ${getAttendanceStatusDisplay(displayAttendance?.status).label}`}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          attendanceDotClass(displayAttendance?.status),
        )}
      />
      <span className="truncate">
        <span className="font-medium">{displayName}</span>
        <span className="opacity-75"> · {schedule.shiftName}</span>
      </span>
      {isOvertime && (
        <span className="ml-auto shrink-0 rounded bg-amber-500/20 px-1 text-[9px] font-semibold text-amber-700 dark:text-amber-300">
          TC
        </span>
      )}
    </button>
  );
}

function CurrentShiftBanner({ schedule }: { schedule: WorkingSchedule }) {
  const timeRange = formatShiftTimeRange(schedule.startTime, schedule.endTime);
  const isOvertime = schedule.scheduleType === "OVERTIME";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm">
      <span className="font-semibold text-sky-800 dark:text-sky-200">
        Ca hiện tại
      </span>
      <span className="text-muted-foreground">
        {schedule.shiftName !== "-" ? schedule.shiftName : "Ca làm"}
        {" · "}
        {timeRange}
        {isOvertime ? " · Tăng ca" : ""}
      </span>
      {schedule.dayInfo?.isHoliday && schedule.dayInfo.holidayName && (
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {schedule.dayInfo.holidayName}
        </span>
      )}
    </div>
  );
}

type CalendarDayCellProps = {
  dateKey: string;
  dayNumber: string;
  inMonth: boolean;
  today: boolean;
  isSunday: boolean;
  holidayName: string | null;
  leaveDays: LeaveRequestPerDay[];
  dayEntries: CalendarScheduleEntry[];
  isSelected: boolean;
  isLoading: boolean;
  selectedScheduleId: string | null;
  selectedAssigneeUserId: string | null;
  onOpenDay: (dateKey: string) => void;
  onSelectSchedule: (
    schedule: WorkingSchedule,
    dateKey: string,
    userId?: string | null,
  ) => void;
};

const CalendarDayCell = memo(function CalendarDayCell({
  dateKey,
  dayNumber,
  inMonth,
  today,
  isSunday,
  holidayName,
  leaveDays,
  dayEntries,
  isSelected,
  isLoading,
  selectedScheduleId,
  selectedAssigneeUserId,
  onOpenDay,
  onSelectSchedule,
}: CalendarDayCellProps) {
  const visible = dayEntries.slice(0, MAX_VISIBLE_PER_DAY);
  const hiddenCount = dayEntries.length - visible.length;
  const primaryLeave = leaveDays[0] ?? null;
  const canOpen =
    dayEntries.length > 0 || Boolean(holidayName) || leaveDays.length > 0;

  return (
    <div
      onClick={() => {
        if (canOpen) onOpenDay(dateKey);
      }}
      className={cn(
        "min-h-[110px] border-b border-r p-1.5 flex flex-col gap-1",
        !inMonth && "bg-muted/20",
        today && "bg-primary/5",
        holidayName && "bg-amber-500/5",
        primaryLeave && !holidayName && "bg-violet-500/5",
        isSunday && !holidayName && !primaryLeave && "bg-rose-500/5",
        isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/30",
        canOpen && "cursor-pointer hover:bg-muted/30 transition-colors",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <span
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
              today && "bg-primary text-primary-foreground",
              !inMonth && "text-muted-foreground",
            )}
          >
            {dayNumber}
          </span>
          {isSunday && !holidayName && (
            <span className="rounded bg-rose-500/15 px-1 py-0.5 text-[9px] font-medium text-rose-700 dark:text-rose-300">
              CN
            </span>
          )}
        </div>
        {dayEntries.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDay(dateKey);
            }}
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
            title="Xem tất cả ca trong ngày"
          >
            {dayEntries.length} ca
          </button>
        )}
      </div>

      {holidayName && (
        <p
          className="w-full shrink-0 whitespace-normal break-words rounded bg-amber-500/20 px-1 py-0.5 text-left text-[10px] font-semibold leading-tight text-amber-950 dark:text-amber-100"
          title={holidayName}
        >
          {holidayName}
        </p>
      )}

      {primaryLeave && (
        <p
          className={cn(
            "w-full shrink-0 whitespace-normal break-words rounded px-1 py-0.5 text-left text-[10px] font-semibold leading-tight",
            primaryLeave.status === "PENDING"
              ? "bg-orange-500/20 text-orange-900 dark:text-orange-100"
              : "bg-violet-500/20 text-violet-950 dark:text-violet-100",
          )}
          title={primaryLeave.reason || leaveChipLabel(primaryLeave)}
        >
          {leaveChipLabel(primaryLeave)}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-5 w-full" />
      ) : (
        <div className="flex flex-col gap-0.5 flex-1">
          {visible.map((entry) => (
            <ScheduleDayChip
              key={entry.chipKey}
              entry={entry}
              isSelected={
                selectedScheduleId === entry.schedule.id &&
                selectedAssigneeUserId === (entry.assignee?.userId ?? null)
              }
              onClick={() =>
                onSelectSchedule(
                  entry.schedule,
                  dateKey,
                  entry.assignee?.userId,
                )
              }
            />
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              className="w-full rounded px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 cursor-pointer text-left transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDay(dateKey);
              }}
            >
              +{hiddenCount} ca khác
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export function ScheduleCalendar() {
  const {
    schedules,
    isInitialLoading,
    isFetching,
    calendarMonth,
    setSelectedSchedule,
    setSelectedAssigneeUserId,
    setSelectedDayDate,
    selectedSchedule,
    selectedAssigneeUserId,
    selectedDayDate,
    staffOptions,
    filters,
    updateStatusFilter,
    updateUserFilter,
    currentSchedule,
    holidaysByDate,
    leaveByDate,
  } = useSchedule();

  const [search, setKeyword] = useState("");
  const canFilterStaff = useMemo(
    () => canFilterScheduleByStaff(getSessionRole()),
    [],
  );

  const filteredSchedules = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return schedules;
    return schedules.filter(
      (s) =>
        s.staffName.toLowerCase().includes(kw) ||
        s.shiftName.toLowerCase().includes(kw) ||
        s.staffPhone.includes(kw) ||
        s.assignees.some(
          (a) =>
            a.staffName.toLowerCase().includes(kw) ||
            a.staffPhone.includes(kw),
        ),
    );
  }, [schedules, search]);

  const calendarEntries = useMemo(
    () => expandSchedulesForCalendar(filteredSchedules, filters.userId),
    [filteredSchedules, filters.userId],
  );

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarScheduleEntry[]>();
    for (const entry of calendarEntries) {
      const key = toHolidayDateKey(entry.schedule.workDate);
      const list = map.get(key);
      if (list) list.push(entry);
      else map.set(key, [entry]);
    }
    for (const [key, list] of map) {
      list.sort((a, b) => {
        const timeCmp = a.schedule.startTime.localeCompare(b.schedule.startTime);
        if (timeCmp !== 0) return timeCmp;
        return a.displayName.localeCompare(b.displayName, "vi");
      });
      map.set(key, list);
    }
    return map;
  }, [calendarEntries]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [calendarMonth]);

  const isLoading = isInitialLoading || isFetching;

  const openDayPanel = useCallback(
    (dateKey: string) => {
      setSelectedDayDate(dateKey);
      setSelectedSchedule(null);
      setSelectedAssigneeUserId(null);
    },
    [setSelectedDayDate, setSelectedSchedule, setSelectedAssigneeUserId],
  );

  const selectSchedule = useCallback(
    (schedule: WorkingSchedule, dateKey: string, userId?: string | null) => {
      setSelectedDayDate(dateKey);
      setSelectedAssigneeUserId(userId ?? null);
      setSelectedSchedule(schedule);
    },
    [setSelectedDayDate, setSelectedAssigneeUserId, setSelectedSchedule],
  );

  return (
    <div className="space-y-4">
      {currentSchedule && <CurrentShiftBanner schedule={currentSchedule} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ScheduleMonthPicker disabled={isLoading} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm nhân viên, ca..."
              value={search}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {canFilterStaff && staffOptions.length > 0 && (
            <Select value={filters.userId} onValueChange={updateUserFilter}>
              <SelectTrigger className="cursor-pointer w-44 h-9 text-sm">
                <SelectValue placeholder="Nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {staffOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.status}
            onValueChange={(value) =>
              updateStatusFilter(value as typeof filters.status)
            }
          >
            <SelectTrigger className="cursor-pointer w-36 h-9 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="SCHEDULED">Đã phân ca</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="CANCELLED">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Chú thích:</span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-medium text-amber-800 dark:text-amber-200">
            Lễ
          </span>
          Ngày lễ
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded bg-violet-500/20 px-1 py-0.5 text-[9px] font-medium text-violet-800 dark:text-violet-200">
            Nghỉ
          </span>
          Nghỉ phép
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded bg-orange-500/20 px-1 py-0.5 text-[9px] font-medium text-orange-800 dark:text-orange-200">
            Chờ
          </span>
          Chờ duyệt nghỉ
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-muted-foreground/40" /> Chưa
          chấm
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-sky-500" /> Check-in
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500" /> Check-out
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-orange-500" /> Muộn
        </span>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            return (
              <CalendarDayCell
                key={dateKey}
                dateKey={dateKey}
                dayNumber={format(day, "d")}
                inMonth={isSameMonth(day, calendarMonth)}
                today={isToday(day)}
                isSunday={day.getDay() === 0}
                holidayName={holidaysByDate.get(dateKey) ?? null}
                leaveDays={leaveByDate.get(dateKey) ?? EMPTY_LEAVE_DAYS}
                dayEntries={entriesByDate.get(dateKey) ?? EMPTY_DAY_ENTRIES}
                isSelected={selectedDayDate === dateKey}
                isLoading={isLoading}
                selectedScheduleId={selectedSchedule?.id ?? null}
                selectedAssigneeUserId={selectedAssigneeUserId}
                onOpenDay={openDayPanel}
                onSelectSchedule={selectSchedule}
              />
            );
          })}
        </div>
      </div>

      {!isLoading && filteredSchedules.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Không có lịch làm việc trong tháng này.
        </p>
      )}
    </div>
  );
}
