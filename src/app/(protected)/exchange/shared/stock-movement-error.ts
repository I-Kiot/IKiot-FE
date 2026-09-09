import { AxiosError } from "axios";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";

/**
 * Map thông báo BE (EN) → VN, đặc biệt rule importPrice ≤ retailPrice.
 *
 * Chỉ còn là đường lùi cho backend cũ: backend mới gửi `code`, và bảng
 * `ERROR_MESSAGES` là nơi tra câu chữ.
 */
function localizeStockMovementMessage(message: string): string {
  const importOverRetail = message.match(
    /Import price cannot be greater than retail price \(([\d.]+)\)(?: for product item (.+))?/i,
  );
  if (importOverRetail) {
    const retail = Number(importOverRetail[1]);
    const sku = importOverRetail[2]?.trim();
    const retailLabel = Number.isFinite(retail)
      ? new Intl.NumberFormat("vi-VN").format(retail)
      : importOverRetail[1];
    return sku
      ? `Giá nhập không được cao hơn giá bán (${retailLabel} đ) - SKU ${sku}`
      : `Giá nhập không được cao hơn giá bán (${retailLabel} đ)`;
  }

  if (/importPrice must be > 0/i.test(message)) {
    return "Giá nhập phải lớn hơn 0";
  }
  if (/Product item not found/i.test(message)) {
    return "Không tìm thấy hàng hóa";
  }

  return message;
}

export function getStockMovementErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const mapped = messageForCode(getApiErrorBody(error)?.code);
  if (mapped) return mapped;

  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;
    const message = data?.message ?? data?.error;
    if (typeof message === "string" && message.trim()) {
      return localizeStockMovementMessage(message.trim());
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return localizeStockMovementMessage(error.message.trim());
  }
  return fallback;
}
