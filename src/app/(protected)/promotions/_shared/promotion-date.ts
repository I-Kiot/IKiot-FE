// [Utils – Promotion date/time]
// Đồng bộ với BE WorkingScheduleDateUtils (VIETNAM_TIMEZONE_OFFSET_MINUTES) - múi giờ
// Việt Nam cố định UTC+7 (không có DST). `<input type="date">` chỉ trả về ngày theo lịch
// địa phương của trình duyệt (vd. "2026-07-20"), không có thông tin timezone - nếu convert
// thẳng bằng `new Date(str).toISOString()` thì bị hiểu nhầm là UTC midnight, lệch tới 7 giờ
// so với giờ VN thực tế (khuyến mãi "bắt đầu hôm nay" sẽ chưa active cho tới 7h sáng UTC).
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
