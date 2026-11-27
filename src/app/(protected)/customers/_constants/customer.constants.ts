import type { CustomerGender, CustomerOrderPaymentMethod } from '@/types/customer'

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

export const PAYMENT_LABEL: Record<CustomerOrderPaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
  SEPAY: 'SePay',
}

export const COLUMN_LABELS: Record<string, string> = {
  customerCode: 'Mã KH',
  name: 'Tên khách hàng',
  gender: 'Giới tính',
  address: 'Địa chỉ',
  totalSpending: 'Tổng chi tiêu',
  createdAt: 'Ngày tạo',
}
