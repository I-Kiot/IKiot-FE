// [Constants – Customer]
import type { CustomerGender, CustomerOrderStatus, CustomerOrderPaymentMethod } from '@/types/customer'

export const GENDER_MAP: Record<CustomerGender, { label: string; className: string }> = {
  MALE: {
    label: 'Nam',
    className: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  FEMALE: {
    label: 'Nữ',
    className: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',
  },
  OTHER: {
    label: 'Khác',
    className: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
}

export const ORDER_STATUS_MAP: Record<CustomerOrderStatus, { label: string; className: string }> = {
  COMPLETED: {
    label: 'Hoàn thành',
    className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  },
  PENDING: {
    label: 'Đang xử lý',
    className: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  },
  RETURNED: {
    label: 'Trả hàng',
    className: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',
  },
}

export const PAYMENT_LABEL: Record<CustomerOrderPaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
}

export const COLUMN_LABELS: Record<string, string> = {
  customerCode: 'Mã KH',
  name: 'Tên khách hàng',
  gender: 'Giới tính',
  address: 'Địa chỉ',
  totalSpending: 'Tổng chi tiêu',
  createdAt: 'Ngày tạo',
}
