/** Hôm nay dạng `YYYY-MM-DD` theo lịch trình duyệt. */
export function todayIso(): string {
  return addDaysIso(0);
}

/** `YYYY-MM-DD` của hôm nay cộng `days` ngày (âm là lùi lại), theo lịch trình duyệt. */
export function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ngày `YYYY-MM-DD` có trước hôm nay không. */
export function isPastDate(value: string): boolean {
  return value.length >= 10 && value.slice(0, 10) < todayIso();
}

export const PAST_DATE_MESSAGE = "Ngày không được ở quá khứ.";
