import type { ScheduleDayInfo } from "@/types/working-schedule";

/** YYYY-MM-DD từ holiday.date / workDate (BE neo UTC 00:00). */
export function toHolidayDateKey(dateValue?: string | null): string {
  if (!dateValue) return "";
  return dateValue.slice(0, 10);
}

type HolidayNameSource = {
  date: string;
  name: string;
  isActive?: boolean;
};

type ScheduleHolidaySource = {
  workDate: string;
  dayInfo?: ScheduleDayInfo | null;
};

/**
 * YYYY-MM-DD → tên lễ.
 * Ưu tiên /holidays; khi trống mới lấy dayInfo từ schedule.
 */
export function buildHolidayNamesByDate(
  holidays: HolidayNameSource[],
  schedules: ScheduleHolidaySource[] = [],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const holiday of holidays) {
    if (holiday.isActive === false) continue;
    const key = toHolidayDateKey(holiday.date);
    const name = holiday.name?.trim();
    if (key && name) map.set(key, name);
  }

  if (map.size > 0 || schedules.length === 0) return map;

  for (const schedule of schedules) {
    const name = schedule.dayInfo?.holidayName?.trim();
    if (!schedule.dayInfo?.isHoliday || !name) continue;
    const key = toHolidayDateKey(schedule.workDate);
    if (key && !map.has(key)) map.set(key, name);
  }

  return map;
}
