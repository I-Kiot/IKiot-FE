/** Hôm nay dạng `YYYY-MM-DD` theo lịch trình duyệt, đúng giá trị mà `<input type="date">` giữ và so sánh. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * True khi giá trị `YYYY-MM-DD` trước hôm nay. `min` của input date chỉ làm mờ picker, ngày gõ tay
 * hoặc dán vẫn lọt, nên mọi field ngày hứa hẹn đều phải kiểm tra thêm. ISO so sánh đúng theo chuỗi.
 */
export function isPastDate(value: string): boolean {
  return value.length >= 10 && value.slice(0, 10) < todayIso();
}

export const PAST_DATE_MESSAGE = "Ngày không được ở quá khứ.";
