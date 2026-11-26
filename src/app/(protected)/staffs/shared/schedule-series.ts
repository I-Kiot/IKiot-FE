import { getApiErrorBody } from "@/lib/api/error-codes";
import type { ScheduleSeriesRef } from "@/types/working-schedule";
import { formatVietnamWorkDate } from "./vietnam-datetime";

/** Thứ trong tuần theo BE (0 = CN … 6 = T7), xếp theo thứ tự người Việt đọc: T2 → CN. */
export const WEEKDAY_OPTIONS = [
  { value: 1, label: "T2" },
  { value: 2, label: "T3" },
  { value: 3, label: "T4" },
  { value: 4, label: "T5" },
  { value: 5, label: "T6" },
  { value: 6, label: "T7" },
  { value: 0, label: "CN" },
] as const;

export const ALL_WEEKDAYS = WEEKDAY_OPTIONS.map((o) => o.value);
/** Mặc định T2 - T7: cửa hàng nội thất thường nghỉ Chủ nhật luân phiên. */
export const DEFAULT_SERIES_WEEKDAYS = [1, 2, 3, 4, 5, 6];

/** BE giới hạn một lịch lặp tối đa 366 ngày. */
export const MAX_SERIES_DAYS = 366;

const ORDER = WEEKDAY_OPTIONS.map((o) => o.value as number);
const LABEL = new Map<number, string>(
  WEEKDAY_OPTIONS.map((o) => [o.value, o.label]),
);

/** "Mọi ngày", "T2 - T6", "T2, T4, T6". */
export function formatSeriesWeekdays(weekdays: number[]): string {
  const sorted = [...new Set(weekdays)].sort(
    (a, b) => ORDER.indexOf(a) - ORDER.indexOf(b),
  );
  if (sorted.length === 7) return "Mọi ngày";
  if (sorted.length === 0) return "-";
  const positions = sorted.map((d) => ORDER.indexOf(d));
  const contiguous = positions.every((p, i) => i === 0 || p === positions[i - 1] + 1);
  if (contiguous && sorted.length >= 3) {
    return `${LABEL.get(sorted[0])} - ${LABEL.get(sorted[sorted.length - 1])}`;
  }
  return sorted.map((d) => LABEL.get(d)).join(", ");
}

export function formatSeriesRange(series: Pick<ScheduleSeriesRef, "startDate" | "endDate">): string {
  return `${formatVietnamWorkDate(series.startDate)} → ${formatVietnamWorkDate(series.endDate)}`;
}

export function formatSeriesSummary(series: ScheduleSeriesRef): string {
  return `${formatSeriesWeekdays(series.weekdays)} · ${formatSeriesRange(series)}`;
}

/** Số ngày lịch của khoảng, tính cả hai đầu (YYYY-MM-DD). */
export function seriesSpanDays(startDate: string, endDate: string): number {
  const ms = Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Các ngày (YYYY-MM-DD) trong khoảng rơi vào `weekdays`, cùng luật với BE `seriesDates`. */
export function countSeriesDays(
  startDate: string,
  endDate: string,
  weekdays: number[],
): number {
  if (!startDate || !endDate || startDate > endDate) return 0;
  const wanted = new Set(weekdays);
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${endDate}T00:00:00Z`);
  let count = 0;
  while (cursor <= last) {
    if (wanted.has(cursor.getUTCDay())) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

/** Ngày bị chồng ca BE trả trong `errors` (SCHEDULE_OVERLAP), để toast nói rõ ngày nào. */
export function overlapDatesOf(error: unknown): string[] {
  const body = getApiErrorBody(error) as { errors?: unknown } | undefined;
  if (!Array.isArray(body?.errors)) return [];
  return body.errors
    .map((item: unknown) =>
      typeof item === "object" && item !== null && "workDate" in item
        ? String((item as { workDate: unknown }).workDate)
        : null,
    )
    .filter((d): d is string => Boolean(d));
}
