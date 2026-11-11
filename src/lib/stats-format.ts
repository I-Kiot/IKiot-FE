export const formatVND = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const formatCompactVND = (value: number): string =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

export const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(value)

export const formatPercent = (value: number | null): string => {
  if (value === null) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value}%`
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
  SEPAY: 'SePay',
  UNKNOWN: 'Chưa xác định',
}

// Backend chỉ trả bucket có đơn (sparse). Điền đủ khoảng fromDate..toDate để biểu đồ vẫn có mốc
// cho mọi ngày/tháng kể cả khi bucket không có dữ liệu.
export function generateDateBuckets(fromDate: string, toDate: string, groupBy: 'day' | 'month'): string[] {
  const buckets: string[] = []
  const start = new Date(`${fromDate}T00:00:00Z`)
  const end = new Date(`${toDate}T00:00:00Z`)

  if (groupBy === 'month') {
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
    const endCursor = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))
    while (cursor <= endCursor) {
      buckets.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`)
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
    return buckets
  }

  const cursor = new Date(start)
  while (cursor <= end) {
    buckets.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return buckets
}

export const paymentMethodLabel = (method: string | null | undefined): string =>
  (method && PAYMENT_METHOD_LABELS[method]) || method || 'Chưa xác định'

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  PACKED: 'Đã đóng gói',
  PICKED_UP: 'Đã bàn giao',
  SHIPPING: 'Đang giao',
  RECEIVED: 'Đã nhận hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
  DRAFT: 'Nháp',
  READY_TO_PACK: 'Sẵn sàng đóng gói',
  DELIVERED: 'Đã giao',
}

export const COMPARISON_LABELS: Record<string, { title: string; current: string; previous: string }> = {
  today: { title: 'Hôm nay', current: 'Hôm nay', previous: 'Hôm qua' },
  week: { title: 'Tuần này', current: 'Tuần này', previous: 'Tuần trước' },
  month: { title: 'Tháng này', current: 'Tháng này', previous: 'Tháng trước' },
  quarter: { title: 'Quý này', current: 'Quý này', previous: 'Quý trước' },
  year: { title: 'Năm nay', current: 'Năm nay', previous: 'Năm ngoái' },
}

/** `2026-10-15` -> `15/10`; bucket tháng `2026-10` -> `T10/2026`. */
export function formatBucket(bucket: string | undefined): string {
  if (!bucket) return ''
  if (/^\d{4}-\d{2}$/.test(bucket)) return `T${bucket.slice(5)}/${bucket.slice(0, 4)}`
  return `${bucket.slice(8, 10)}/${bucket.slice(5, 7)}`
}

/** `2026-10-15` -> `15/10/2026`. */
export function formatDayVi(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`
}

/** Thời điểm ISO hiển thị dạng `dd/MM` theo múi giờ Việt Nam. */
export function formatInstantShort(iso: string): string {
  const day = new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`
}

/** Hạng mục dòng tiền (cột category của sổ thu chi). */
export const CASHFLOW_CATEGORY_LABELS: Record<string, string> = {
  ORDER_PAYMENT: 'Thu tiền đơn hàng',
  ORDER_REFUND: 'Hoàn tiền đơn hàng',
  SALE_CHANGE: 'Tiền thối cho khách',
  SUPPLIER_PAYMENT: 'Trả nhà cung cấp',
  UNALLOCATED_RECEIPT: 'Tiền về chưa gắn đơn',
  UNALLOCATED_REFUND: 'Hoàn tiền chưa gắn đơn',
}

export const CASHFLOW_FUND_LABELS: Record<string, string> = {
  DRAWER: 'Két',
  OWNER: 'Quỹ chủ',
  BANK: 'Ngân hàng',
}

export const categoryLabel = (category: string | null | undefined): string =>
  (category && CASHFLOW_CATEGORY_LABELS[category]) || category || '-'

export const fundLabel = (fund: string | null | undefined): string =>
  (fund && CASHFLOW_FUND_LABELS[fund]) || fund || '-'

/** Loại bút toán trong sổ doanh thu. */
export const JOURNAL_ENTRY_TYPE_LABELS: Record<string, string> = {
  SALE: 'Bán hàng',
  RETURN: 'Trả hàng',
  OTHER_INCOME: 'Thu nhập khác',
}

/** Nguồn ghi sổ; giá trị lạ hiện nguyên mã. */
export const JOURNAL_SOURCE_LABELS: Record<string, string> = {
  POS_SALE: 'Bán tại quầy',
  POS_PAY_OFFLINE: 'Thanh toán tại quầy',
  SEPAY_WEBHOOK: 'Chuyển khoản SePay',
  DELIVERY: 'Giao hàng',
  REMITTANCE: 'Shipper nộp tiền',
  PICKUP_HAND_OVER: 'Khách nhận tại kho',
  RETURN_INSPECTION: 'Kiểm hàng trả',
  POS_RETURN: 'Trả hàng tại quầy',
  ORDER_CANCEL: 'Huỷ đơn (giữ tiền)',
  POS_CANCEL: 'Huỷ đơn quầy (giữ tiền)',
  RETURN_KEPT: 'Trả hàng (giữ tiền)',
}

/** Cho cột giá trị có thể âm: số âm tô đỏ, số dương giữ màu mặc định. */
export const negativeClass = (value: number): string => (value < 0 ? 'text-red-600 dark:text-red-400' : '')
