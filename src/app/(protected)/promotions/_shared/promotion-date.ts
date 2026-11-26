// Giờ VN cố định UTC+7.
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
