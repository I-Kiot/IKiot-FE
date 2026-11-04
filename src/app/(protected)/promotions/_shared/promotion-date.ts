// Đồng bộ BE (VIETNAM_TIMEZONE_OFFSET_MINUTES): giờ VN cố định UTC+7. `<input type="date">` chỉ trả ngày lịch địa phương, không có timezone;
// `new Date(str).toISOString()` sẽ hiểu là UTC midnight, lệch 7 giờ so với giờ VN.
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

/** "YYYY-MM-DD" (ngày VN) -> ISO UTC tại 00:00:00.000 giờ VN của ngày đó. */
export function vnStartOfDayToIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - VN_OFFSET_MS).toISOString()
}

/** "YYYY-MM-DD" (ngày VN) -> ISO UTC tại 23:59:59.999 giờ VN của ngày đó (hết ngày). */
export function vnEndOfDayToIso(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - VN_OFFSET_MS).toISOString()
}

/** ISO UTC -> "YYYY-MM-DD" theo ngày VN (để đổ vào `<input type="date">` khi sửa). */
export function isoToVNDateInput(iso?: string): string {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}
