// [Query – số liệu trang Báo cáo chi tiết]
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { locationFilter } from '@/lib/location-key'
import {
  statsApi,
  type RevenueByPaymentMethod,
  type RevenueByStaff,
  type Cashflow,
  type TopCustomers,
  type InventoryStats,
  type RevenueComparison,
  type OrdersByStatus,
  type RevenueByBranch,
  type SalesHeatmap,
} from '@/lib/api/stats'

export type DashboardRange = '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'this_year' | '12m'

export const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '90d', label: '90 ngày qua' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'this_year', label: 'Năm nay' },
  { value: '12m', label: '12 tháng qua' },
]

export type RevenueDateRange = {
  fromDate: string
  toDate: string
  groupBy: 'day' | 'month'
  /** The equal-length window right before. */
  previousFromDate: string
  previousToDate: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Today as `YYYY-MM-DD` in the shop's own timezone. */
function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00Z`)
}

function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Resolve a range option to concrete local dates, plus the window right before it of the same length. */
export function resolveDashboardRange(range: DashboardRange): RevenueDateRange {
  const today = todayLocal()
  const now = new Date(parseDay(today))
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()

  let from: number
  let to: number = parseDay(today)
  let groupBy: 'day' | 'month' = 'day'

  switch (range) {
    case '7d':
      from = to - 6 * DAY_MS
      break
    case '30d':
      from = to - 29 * DAY_MS
      break
    case '90d':
      from = to - 89 * DAY_MS
      break
    case 'this_month':
      from = Date.UTC(y, m, 1)
      break
    case 'last_month':
      from = Date.UTC(y, m - 1, 1)
      to = Date.UTC(y, m, 0)
      break
    case 'this_year':
      from = Date.UTC(y, 0, 1)
      groupBy = 'month'
      break
    case '12m':
      from = Date.UTC(y, m - 11, 1)
      groupBy = 'month'
      break
  }

  const days = Math.round((to - from) / DAY_MS) + 1
  const previousTo = from - DAY_MS
  const previousFrom = previousTo - (days - 1) * DAY_MS

  return {
    fromDate: formatDay(from),
    toDate: formatDay(to),
    groupBy,
    previousFromDate: formatDay(previousFrom),
    previousToDate: formatDay(previousTo),
  }
}

/** The report widgets degrade on their own: one failing endpoint blanks its widget, not the whole page. */
function optional<T>(request: Promise<T>): Promise<T | null> {
  return request.catch((err) => {
    console.error(err)
    return null
  })
}

/** Mọi số liệu của trang báo cáo, gắn với đúng bộ lọc đã sinh ra nó. */
interface ReportData {
  key: string
  revenueDateRange: RevenueDateRange | null
  revenueByPaymentMethod: RevenueByPaymentMethod | null
  revenueByStaff: RevenueByStaff | null
  revenueByBranch: RevenueByBranch | null
  ordersByStatus: OrdersByStatus | null
  salesHeatmap: SalesHeatmap | null
  topCustomers: TopCustomers | null
  cashflow: Cashflow | null
  inventory: InventoryStats | null
  comparison: RevenueComparison | null
}

const EMPTY_REPORT: Omit<ReportData, 'key'> = {
  revenueDateRange: null,
  revenueByPaymentMethod: null,
  revenueByStaff: null,
  revenueByBranch: null,
  ordersByStatus: null,
  salesHeatmap: null,
  topCustomers: null,
  cashflow: null,
  inventory: null,
  comparison: null,
}

/** Tải tất cả số liệu cho kỳ và địa điểm đang chọn. Kho không có doanh thu bán hàng, nên chỉ lấy dòng tiền và tồn kho. */
async function loadReport(
  key: string,
  range: DashboardRange,
  branchId: string | undefined,
  warehouseId: string | undefined,
  lowStockThreshold: number,
): Promise<ReportData> {
  const resolved = resolveDashboardRange(range)
  const { fromDate, toDate } = resolved

  if (warehouseId) {
    const [cashflow, inventory] = await Promise.all([
      statsApi.getCashflow({ fromDate, toDate, warehouseId }),
      statsApi.getInventory({ warehouseId, lowStockThreshold }),
    ])
    return { ...EMPTY_REPORT, key, cashflow, inventory }
  }

  const dateParams = { fromDate, toDate, branchId }
  const [
    revenueByPaymentMethod,
    revenueByStaff,
    revenueByBranch,
    ordersByStatus,
    salesHeatmap,
    topCustomers,
    cashflow,
    inventory,
    comparison,
  ] = await Promise.all([
    statsApi.getRevenueByPaymentMethod(dateParams),
    statsApi.getRevenueByStaff(dateParams),
    optional(statsApi.getRevenueByBranch(dateParams)),
    optional(statsApi.getOrdersByStatus(dateParams)),
    optional(statsApi.getSalesHeatmap(dateParams)),
    optional(statsApi.getTopCustomers({ ...dateParams, limit: 5 })),
    statsApi.getCashflow({ ...dateParams, flow: 'ORD' }),
    statsApi.getInventory({ branchId, lowStockThreshold }),
    optional(statsApi.getRevenueComparison({ branchId })),
  ])

  return {
    key,
    revenueDateRange: resolved,
    revenueByPaymentMethod,
    revenueByStaff,
    revenueByBranch,
    ordersByStatus,
    salesHeatmap,
    topCustomers,
    cashflow,
    inventory,
    comparison,
  }
}

export function useDashboardStats(range: DashboardRange) {
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)
  const isWarehouse = Boolean(warehouseId)

  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [reloadCount, setReloadCount] = useState(0)
  const [data, setData] = useState<ReportData | null>(null)

  // Khoá của bộ lọc hiện tại: câu trả lời nào mang khoá khác là của bộ lọc cũ.
  const key = useMemo(
    () => [range, branchId, warehouseId, lowStockThreshold, reloadCount].join('|'),
    [range, branchId, warehouseId, lowStockThreshold, reloadCount],
  )

  useEffect(() => {
    // Đổi kỳ / địa điểm nhanh hơn server trả lời: câu trả lời đến muộn của bộ lọc cũ bị bỏ,
    // không được ghi đè số liệu của bộ lọc mới.
    let cancelled = false
    loadReport(key, range, branchId, warehouseId, lowStockThreshold)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        toast.error('Tải dữ liệu thống kê thất bại')
        // Ghi một kết quả rỗng mang khoá hiện tại, để màn hình thôi "đang tải" thay vì quay mãi.
        setData({ ...EMPTY_REPORT, key })
      })
    return () => {
      cancelled = true
    }
  }, [key, range, branchId, warehouseId, lowStockThreshold])

  const refetch = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    revenueDateRange: data?.revenueDateRange ?? null,
    revenueByPaymentMethod: data?.revenueByPaymentMethod ?? null,
    revenueByStaff: data?.revenueByStaff ?? null,
    revenueByBranch: data?.revenueByBranch ?? null,
    ordersByStatus: data?.ordersByStatus ?? null,
    salesHeatmap: data?.salesHeatmap ?? null,
    topCustomers: data?.topCustomers ?? null,
    cashflow: data?.cashflow ?? null,
    inventory: data?.inventory ?? null,
    comparison: data?.comparison ?? null,
    // Đang tải khi số liệu đang hiện không phải của bộ lọc hiện tại.
    isLoading: data?.key !== key,
    isWarehouse,
    lowStockThreshold,
    setLowStockThreshold,
    refetch,
  }
}
