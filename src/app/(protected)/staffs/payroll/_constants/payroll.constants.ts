// [Constants – Payroll]
import type { PeriodStatus } from '@/types/payroll'

export const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const formatPriceAmount = (value?: string | number | null): string => {
  if (value === undefined || value === null || value === '') return ''
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

export const parsePriceAmount = (value?: string): number => {
  if (!value?.trim()) return 0
  const digits = value.replace(/\D/g, '')
  return digits ? (Number(digits) || 0) : 0
}

export const STATUS_MAP: Record<
  PeriodStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Bản nháp',
    className: 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800',
  },
  REVIEW: {
    label: 'Chờ duyệt',
    className: 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800',
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  },
  PAID: {
    label: 'Đã trả lương',
    className: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
  },
}

export const WEEKDAYS = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' },
]

export const CYCLE_OPTIONS = [
  { value: 'MONTHLY', label: 'Hàng tháng' },
  { value: 'WEEKLY', label: 'Hàng tuần' },
]

export const ADJUSTMENT_TYPE_MAP = {
  BONUS: { label: 'Thưởng', className: 'text-green-600' },
  DEDUCTION: { label: 'Phạt/Khấu trừ', className: 'text-red-600' },
}
