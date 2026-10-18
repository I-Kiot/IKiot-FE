/** Today as `YYYY-MM-DD` in the browser's calendar - what an `<input type="date">` holds and compares against. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * True when a `YYYY-MM-DD` value is before today. `min` on a date input only greys out the picker -
 * a typed or pasted date still goes through - so every promised-date field checks this as well.
 * ISO dates compare correctly as strings.
 */
export function isPastDate(value: string): boolean {
  return value.length >= 10 && value.slice(0, 10) < todayIso();
}

export const PAST_DATE_MESSAGE = "Ngày không được ở quá khứ.";
