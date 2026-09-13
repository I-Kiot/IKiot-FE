// [Constants – Promotion]
import type { Promotion, PromotionStatus, DiscountType, ApplicableRuleType } from '@/types/promotion'

export type PromotionDisplayStatus = PromotionStatus | 'SCHEDULED' | 'EXPIRED'

export const STATUS_MAP: Record<PromotionDisplayStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang chạy',
    className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  SCHEDULED: {
    label: 'Chưa hiệu lực',
    className: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  },
  INACTIVE: {
    label: 'Đã tắt',
    className: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20',
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
}

/** Trạng thái hiển thị: `status` lưu ở BE chỉ là bật/tắt, còn hiệu lực thực tế tính theo ngày. */
export function getPromotionDisplayStatus(
  promotion: Pick<Promotion, 'status' | 'startDate' | 'endDate'>,
  now: Date = new Date(),
): PromotionDisplayStatus {
  if (promotion.status !== 'ACTIVE') return promotion.status
  if (new Date(promotion.endDate) < now) return 'EXPIRED'
  if (new Date(promotion.startDate) > now) return 'SCHEDULED'
  return 'ACTIVE'
}

export const DISCOUNT_TYPE_MAP: Record<DiscountType, string> = {
  PERCENT: 'Giảm theo %',
  FIXED_AMOUNT: 'Giảm số tiền cố định',
}

export const APPLICABLE_RULE_LABEL: Record<ApplicableRuleType, string> = {
  all: 'Toàn bộ sản phẩm',
  category: 'Theo danh mục',
  product: 'Theo sản phẩm',
}

export const COLUMN_LABELS: Record<string, string> = {
  promoName: 'Tên chương trình',
  discountType: 'Loại giảm giá',
  branchId: 'Chi nhánh',
  startDate: 'Ngày bắt đầu',
  endDate: 'Ngày kết thúc',
  status: 'Trạng thái',
  usedCount: 'Đã sử dụng',
}
