import type { OrderPriority } from "@/types/order-flow";

export const URGENT_WITHIN_DAYS = 1;
export const HIGH_WITHIN_DAYS = 3;

export function priorityForDaysUntil(daysUntil: number | null): OrderPriority {
  if (daysUntil === null) return "NORMAL";
  if (daysUntil <= URGENT_WITHIN_DAYS) return "URGENT";
  if (daysUntil <= HIGH_WITHIN_DAYS) return "HIGH";
  return "NORMAL";
}
