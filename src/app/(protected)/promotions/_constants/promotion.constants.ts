// [Constants – Promotion]
import type { Promotion, PromotionStatus, DiscountType, ApplicableRuleType } from '@/types/promotion'

export type PromotionDisplayStatus = PromotionStatus | 'EXPIRED'

export const STATUS_MAP: Record<PromotionDisplayStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Đang chạy',
    className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
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

export function getPromotionDisplayStatus(promotion: Promotion): PromotionDisplayStatus {
  if (promotion.status === 'ACTIVE' && new Date(promotion.endDate) < new Date()) {
    return 'EXPIRED'
  }
  return promotion.status
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
