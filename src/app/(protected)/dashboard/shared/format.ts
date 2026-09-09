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
