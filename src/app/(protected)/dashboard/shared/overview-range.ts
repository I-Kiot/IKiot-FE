// Khoảng thời gian của dashboard tổng quan: hôm nay / 7 ngày / 30 ngày / tháng này / tuỳ chỉnh.
// Hàm thuần, không gọi API - mọi widget đọc cùng một kết quả nên không thể lệch kỳ với nhau.

import type { RevenueGroupBy } from "@/lib/api/stats";

export type OverviewPreset = "today" | "7d" | "30d" | "month";

export type OverviewRange =
  | { preset: OverviewPreset }
  | { preset: "custom"; from: string; to: string };

export const PRESET_OPTIONS: { value: OverviewPreset; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "month", label: "Tháng này" },
];

/** Kỳ đã quy ra ngày cụ thể, đủ cho mọi request của dashboard. */
export interface ResolvedRange {
  /** `YYYY-MM-DD`, ngày đầu kỳ. */
  fromDate: string;
  /**
   * Gửi cho BE làm `toDate`. Kỳ kết thúc hôm nay thì là thời điểm hiện tại (ISO), để
   * `/stats/overview` so với đúng khoảng đã trôi qua của kỳ trước (hôm nay đến 10h so với
   * hôm qua đến 10h), không phải với cả ngày hôm qua.
   */
  toParam: string;
  /** `YYYY-MM-DD`, ngày cuối kỳ - để vẽ trục biểu đồ. */
  toDate: string;
  groupBy: RevenueGroupBy;
  /** Kỳ liền trước cùng độ dài, theo ngày - biểu đồ vẽ chồng lên. */
  previousFromDate: string;
  previousToDate: string;
  /** Chữ hiển thị cho kỳ trước, ví dụ "hôm qua", "7 ngày trước". */
  previousLabel: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** Quá số ngày này thì biểu đồ gom theo tháng, không vẽ hàng trăm điểm. */
const MAX_DAILY_POINTS = 92;

/** Hôm nay theo giờ Việt Nam, dạng `YYYY-MM-DD`. */
export function todayLocal(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Số ngày lịch của kỳ, tính cả hai đầu. */
function daysInclusive(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS) + 1;
}

/** Ngày đầu kỳ của một lựa chọn có sẵn (kỳ luôn kết thúc hôm nay). */
function presetStart(preset: OverviewPreset, today: string): string {
  const todayMs = parseDay(today);
  if (preset === "today") return today;
  if (preset === "7d") return formatDay(todayMs - 6 * DAY_MS);
  if (preset === "30d") return formatDay(todayMs - 29 * DAY_MS);
  return `${today.slice(0, 7)}-01`;
}

function previousLabelOf(range: OverviewRange, days: number): string {
  if (range.preset === "today") return "hôm qua";
  // "Tháng này" cũng so với số ngày bằng nó ngay trước đó (BE `previousPeriod`), không phải cùng kỳ tháng trước.
  return `${days} ngày trước đó`;
}

function groupByFor(days: number): RevenueGroupBy {
  if (days === 1) return "hour";
  if (days > MAX_DAILY_POINTS) return "month";
  return "day";
}

export function resolveOverviewRange(range: OverviewRange, now: Date = new Date()): ResolvedRange {
  const today = todayLocal();
  const fromDate = range.preset === "custom" ? range.from : presetStart(range.preset, today);
  const toDate = range.preset === "custom" ? range.to : today;
  const days = daysInclusive(fromDate, toDate);
  const endsToday = toDate === today;

  const previousToMs = parseDay(fromDate) - DAY_MS;
  const previousFromMs = previousToMs - (days - 1) * DAY_MS;

  return {
    fromDate,
    toDate,
    toParam: endsToday ? now.toISOString() : toDate,
    groupBy: groupByFor(days),
    previousFromDate: formatDay(previousFromMs),
    previousToDate: formatDay(previousToMs),
    previousLabel: previousLabelOf(range, days),
  };
}

/** Khoá ổn định của một kỳ, để biết hai lần chọn có phải cùng một kỳ không. */
export function rangeKey(range: OverviewRange): string {
  return range.preset === "custom" ? `custom:${range.from}:${range.to}` : range.preset;
}

/**
 * Mọi mốc trên trục biểu đồ, kể cả mốc không có đơn (BE chỉ trả mốc có số liệu).
 * Giờ: `YYYY-MM-DDTHH` cho 24 giờ của ngày; ngày: `YYYY-MM-DD`; tháng: `YYYY-MM`.
 */
export function bucketsOf(fromDate: string, toDate: string, groupBy: RevenueGroupBy): string[] {
  const buckets: string[] = [];
  if (groupBy === "hour") {
    for (let hour = 0; hour < 24; hour++) {
      buckets.push(`${fromDate}T${String(hour).padStart(2, "0")}`);
    }
    return buckets;
  }
  if (groupBy === "month") {
    const start = new Date(parseDay(fromDate));
    const end = new Date(parseDay(toDate));
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor <= end) {
      buckets.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return buckets;
  }
  for (let ms = parseDay(fromDate); ms <= parseDay(toDate); ms += DAY_MS) {
    buckets.push(formatDay(ms));
  }
  return buckets;
}

/** Nhãn trục: `14h`, `15/10`, `T10/2026`. */
export function bucketLabel(bucket: string): string {
  if (bucket.includes("T")) return `${Number(bucket.slice(11, 13))}h`;
  if (/^\d{4}-\d{2}$/.test(bucket)) return `T${bucket.slice(5)}/${bucket.slice(0, 4)}`;
  return `${bucket.slice(8, 10)}/${bucket.slice(5, 7)}`;
}

/** `2026-10-15` → `15/10/2026`. */
export function formatDayVi(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`;
}
