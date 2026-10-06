// [Constants – Supplier]
export const COLUMN_LABELS: Record<string, string> = {
  supplierName: 'Tên nhà cung cấp',
  type: 'Loại',
  contactName: 'Người liên hệ',
  phoneNumber: 'Số điện thoại',
  email: 'Email',
  creditLimit: 'Hạn mức tín dụng',
  outstandingDebt: 'Công nợ',
}

/** B-1: a supplier of finished goods, or a workshop that makes them to order. */
export const SUPPLIER_TYPE_LABELS = {
  GOODS: 'Nhà cung cấp hàng',
  WORKSHOP: 'Xưởng sản xuất',
} as const
