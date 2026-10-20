// [Utils – Dashboard Formatters]
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
}

// Backend returns only buckets that have orders (sparse). Fill the full
// fromDate..toDate range so the chart still shows every date/month mark
// even when a bucket has no data.
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

/** `2026-10-15` -> `15/10`; a month bucket `2026-10` -> `T10/2026`. */
export function formatBucket(bucket: string | undefined): string {
  if (!bucket) return ''
  if (/^\d{4}-\d{2}$/.test(bucket)) return `T${bucket.slice(5)}/${bucket.slice(0, 4)}`
  return `${bucket.slice(8, 10)}/${bucket.slice(5, 7)}`
}

/** `2026-10-15` -> `15/10/2026`. */
export function formatDayVi(day: string): string {
  return `${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`
}

/** An ISO instant as a local-calendar `dd/MM`. */
export function formatInstantShort(iso: string): string {
  const day = new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`
}
