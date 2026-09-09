import {
  formatVietnamDateTime,
  formatVietnamWorkDate,
} from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { parseDateInput } from "@/app/(protected)/staffs/shared/staff-date-validation";

export function getStaffInitials(fullName?: string): string {
  return (
    fullName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "NV"
  );
}

/** YYYY-MM-DD từ chuỗi ngày bất kỳ. Dùng UTC noon để tránh lệch TZ khi tạo Date. */
function normalizeDateText(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const fromInput = parseDateInput(trimmed);
  if (fromInput) {
    const y = fromInput.getFullYear();
    const m = String(fromInput.getMonth() + 1).padStart(2, "0");
    const d = String(fromInput.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const dateOnly = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function formatStaffDate(value?: string): string {
  const dateText = normalizeDateText(value);
  if (!dateText) return "-";
  return formatVietnamWorkDate(dateText);
}

export function formatStaffDateTime(value?: string): string {
  return formatVietnamDateTime(value);
}

export function toDateInputValue(value?: string): string {
  const dateText = normalizeDateText(value);
  return dateText ?? "";
}
