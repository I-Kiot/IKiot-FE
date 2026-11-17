import type { OrderPriority } from "@/types/order-flow";

// Mức ưu tiên của đơn mới suy ra từ ngày khách hẹn giao / hẹn lấy, không để người bán chọn tay: càng gần ngày hẹn
// càng phải làm trước. Đơn không hẹn ngày là bình thường. Sau khi tạo đơn vẫn đổi tay được (PATCH /orders/:id/priority).

/** Hẹn trong hôm nay hoặc ngày mai (hoặc đã quá ngày) là gấp. */
export const URGENT_WITHIN_DAYS = 1;
/** Hẹn trong 3 ngày tới là cao. */
export const HIGH_WITHIN_DAYS = 3;

/** `daysUntil`: số ngày lịch từ hôm nay tới ngày hẹn (âm khi đã qua), null khi không hẹn. */
export function priorityForDaysUntil(daysUntil: number | null): OrderPriority {
  if (daysUntil === null) return "NORMAL";
  if (daysUntil <= URGENT_WITHIN_DAYS) return "URGENT";
  if (daysUntil <= HIGH_WITHIN_DAYS) return "HIGH";
  return "NORMAL";
}
