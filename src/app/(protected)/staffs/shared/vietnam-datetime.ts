/**
 * Đồng bộ với BE WorkingScheduleDateUtils - múi giờ Việt Nam (UTC+7).
 * BE lưu startAt/endAt dạng UTC nhưng biểu diễn giờ địa phương VN
 * (vd. 08:00 VN → 2026-07-01T01:00:00.000Z).
 */
export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";

/** YYYY-MM-DD theo giờ Việt Nam. */
export function getVietnamDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
  }).format(date);
}

/** HH:mm từ ISO timestamp, quy đổi sang giờ VN. */
export function extractVietnamTimeFromIso(iso?: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: VIETNAM_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** YYYY-MM-DD từ ISO timestamp, quy đổi sang ngày VN. */
export function extractVietnamDateFromIso(iso?: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIMEZONE,
  }).format(new Date(iso));
}

/**
 * workDate từ BE được neo ở UTC 00:00 cho ngày làm việc - lấy YYYY-MM-DD trực tiếp.
 * Nếu thiếu workDate, suy ra từ startAt theo giờ VN.
 */
export function resolveWorkDateText(
  workDate?: string | null,
  startAt?: string | null,
): string {
  if (workDate?.trim()) {
    return workDate.slice(0, 10);
  }
  if (startAt) {
    return extractVietnamDateFromIso(startAt);
  }
  return "";
}

/** Hiển thị ngày dd/MM/yyyy từ chuỗi YYYY-MM-DD (ngày làm việc, không lệch TZ). */
export function formatVietnamWorkDate(dateText?: string | null): string {
  const iso = dateText?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "-";

  const [year, month, day] = iso.split("-").map(Number);
  const utcAnchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(utcAnchor);
}

/** Hiển thị ngày giờ thực tế (check-in/out, createdAt...) theo giờ VN. */
export function formatVietnamDateTime(iso?: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: VIETNAM_TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "-";
  }
}
