import type {
  AttendanceDetail,
  ScheduleAssignee,
  ScheduleStatus,
  WorkingSchedule,
} from "@/types/working-schedule";
import { extractVietnamTimeFromIso } from "@/app/(protected)/staffs/shared/vietnam-datetime";

export function isScheduleLocked(status: ScheduleStatus): boolean {
  return status === "COMPLETED";
}

export function isDeletedScheduleStatus(status?: string): boolean {
  return status === "DELETED";
}

export function isOvernightShift(startTime: string, endTime: string): boolean {
  return Boolean(startTime && endTime && startTime >= endTime);
}

/** @deprecated Dùng extractVietnamTimeFromIso - BE lưu giờ VN, không phải UTC wall clock. */
export function extractUtcTimeFromIso(iso?: string): string {
  return extractVietnamTimeFromIso(iso);
}

export function formatShiftTimeRange(startTime: string, endTime: string): string {
  const range = `${startTime} - ${endTime}`;
  return isOvernightShift(startTime, endTime) ? `${range} (qua đêm)` : range;
}

export function sortSchedulesForDay(
  schedules: WorkingSchedule[],
): WorkingSchedule[] {
  return [...schedules].sort((a, b) => {
    const timeCmp = a.startTime.localeCompare(b.startTime);
    if (timeCmp !== 0) return timeCmp;
    return a.staffName.localeCompare(b.staffName, "vi");
  });
}

export type CalendarScheduleEntry = {
  schedule: WorkingSchedule;
  assignee: ScheduleAssignee | null;
  chipKey: string;
  displayName: string;
  displayAvatarUrl?: string | null;
  displayAttendance: AttendanceDetail;
};

/** Giữ một assignee khi mở chi tiết từ chip / day list (fallback nếu API lỗi). */
export function filterScheduleToAssignee(
  schedule: WorkingSchedule,
  userId: string,
): WorkingSchedule {
  const assignee = schedule.assignees.find((a) => a.userId === userId);
  if (!assignee) return schedule;

  return {
    ...schedule,
    assignees: [assignee],
    staffName: assignee.staffName,
    staffAvatarUrl: assignee.staffAvatarUrl,
    staffPhone: assignee.staffPhone,
    attendance: assignee.attendance,
  };
}

/** Tách mỗi assignee thành một chip trên lịch - tiện filter và đọc lịch nhiều người/ca. */
export function expandSchedulesForCalendar(
  schedules: WorkingSchedule[],
  filterUserId: string = "all",
): CalendarScheduleEntry[] {
  const entries: CalendarScheduleEntry[] = [];

  for (const schedule of schedules) {
    if (schedule.assignees.length === 0) {
      if (filterUserId !== "all") continue;
      entries.push({
        schedule,
        assignee: null,
        chipKey: schedule.id,
        displayName: schedule.staffName,
        displayAvatarUrl: schedule.staffAvatarUrl,
        displayAttendance: schedule.attendance,
      });
      continue;
    }

    for (const assignee of schedule.assignees) {
      if (filterUserId !== "all" && assignee.userId !== filterUserId) {
        continue;
      }

      entries.push({
        schedule,
        assignee,
        chipKey: `${schedule.id}-${assignee.userId}`,
        displayName: assignee.staffName,
        displayAvatarUrl: assignee.staffAvatarUrl,
        displayAttendance: assignee.attendance,
      });
    }
  }

  return entries;
}
