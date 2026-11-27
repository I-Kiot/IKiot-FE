// [Query – số liệu trang Báo cáo tổng hợp]
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { locationFilter } from '@/lib/location-key'
import {
  statsApi,
  type RevenueByPaymentMethod,
  type StatsOverview,
  type Cashflow,
  type TopCustomers,
  type InventoryStats,
  type OrdersByStatus,
  type RevenueSeries,
  type TopProducts,
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
  /** Khoảng cùng độ dài ngay trước đó. */
  previousFromDate: string
  previousToDate: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Hôm nay dạng `YYYY-MM-DD` theo múi giờ của cửa hàng. */
function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00Z`)
}

function formatDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Quy một lựa chọn kỳ ra ngày cụ thể, kèm khoảng cùng độ dài ngay trước đó. */
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

/** Kỳ báo cáo do người dùng chọn: hai ngày `YYYY-MM-DD` (giờ VN), tính cả hai đầu. */
export interface ReportPeriod {
  fromDate: string
  toDate: string
}

/** Kỳ dài nhất: một năm. */
export const MAX_PERIOD_DAYS = 366

/** Kỳ dài hơn ngưỡng này thì bảng/biểu đồ theo thời gian gom theo tháng thay vì theo ngày. */
const MONTHLY_AFTER_DAYS = 92

/** Số ngày của kỳ, tính cả hai đầu. */
export function periodDays({ fromDate, toDate }: ReportPeriod): number {
  return Math.round((parseDay(toDate) - parseDay(fromDate)) / DAY_MS) + 1
}

/** Kỳ của một lựa chọn nhanh (7 ngày qua, tháng này...). */
export function presetPeriod(range: DashboardRange): ReportPeriod {
  const { fromDate, toDate } = resolveDashboardRange(range)
  return { fromDate, toDate }
}

/** Mặc định của mọi trang báo cáo: 30 ngày gần nhất, tính cả hôm nay. */
export function defaultPeriod(): ReportPeriod {
  return presetPeriod('30d')
}

/** Lựa chọn nhanh trùng đúng kỳ đang xem (để tô sáng), không trùng thì `null`. */
export function matchPreset(period: ReportPeriod): DashboardRange | null {
  const hit = RANGE_OPTIONS.find((option) => {
    const p = presetPeriod(option.value)
    return p.fromDate === period.fromDate && p.toDate === period.toDate
  })
  return hit?.value ?? null
}

/** Kỳ tuỳ ý -> ngày cụ thể, cách gom theo thời gian và khoảng cùng độ dài ngay trước đó. */
export function resolvePeriod(period: ReportPeriod): RevenueDateRange {
  const days = periodDays(period)
  const from = parseDay(period.fromDate)
  const previousTo = from - DAY_MS
  const previousFrom = previousTo - (days - 1) * DAY_MS
  return {
    fromDate: period.fromDate,
    toDate: period.toDate,
    groupBy: days > MONTHLY_AFTER_DAYS ? 'month' : 'day',
    previousFromDate: formatDay(previousFrom),
    previousToDate: formatDay(previousTo),
  }
}

/** Số dòng tối đa của bảng xếp hạng (hàng hóa, khách hàng): giới hạn của API khách hàng. */
const TOP_ROWS = 50

/** Widget báo cáo tự xử lý lỗi: một endpoint lỗi chỉ làm trống đúng widget đó, không cả trang. */
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
  ordersByStatus: OrdersByStatus | null
  topCustomers: TopCustomers | null
  cashflow: Cashflow | null
  inventory: InventoryStats | null
  overview: StatsOverview | null
  /** Cùng chỉ tiêu của khoảng cùng độ dài ngay trước kỳ đang xem. */
  previousOverview: StatsOverview | null
  revenueSeries: RevenueSeries | null
  topProducts: TopProducts | null
}

const EMPTY_REPORT: Omit<ReportData, 'key'> = {
  revenueDateRange: null,
  revenueByPaymentMethod: null,
  ordersByStatus: null,
  topCustomers: null,
  cashflow: null,
  inventory: null,
  overview: null,
  previousOverview: null,
  revenueSeries: null,
  topProducts: null,
}

/** Tải số liệu cho kỳ và địa điểm đang chọn. */
async function loadReport(
  key: string,
  period: ReportPeriod,
  branchId: string | undefined,
  warehouseId: string | undefined,
  lowStockThreshold: number,
): Promise<ReportData> {
  const resolved = resolvePeriod(period)
  const { fromDate, toDate } = resolved

  // Lọc đơn theo nơi đang xem.
  const place = branchId ?? warehouseId
  const dateParams = { fromDate, toDate, branchId: place }
  const [
    revenueByPaymentMethod,
    ordersByStatus,
    topCustomers,
    cashflow,
    inventory,
    overview,
    previousOverview,
    revenueSeries,
    topProducts,
  ] = await Promise.all([
    statsApi.getRevenueByPaymentMethod(dateParams),
    optional(statsApi.getOrdersByStatus(dateParams)),
    optional(statsApi.getTopCustomers({ ...dateParams, limit: TOP_ROWS })),
    warehouseId
      ? statsApi.getCashflow({ fromDate, toDate, warehouseId })
      : statsApi.getCashflow({ ...dateParams, flow: 'ORD' }),
    warehouseId
      ? statsApi.getInventory({ warehouseId, lowStockThreshold })
      : statsApi.getInventory({ branchId, lowStockThreshold }),
    optional(statsApi.getOverview(dateParams)),
    optional(
      statsApi.getOverview({
        fromDate: resolved.previousFromDate,
        toDate: resolved.previousToDate,
        branchId: place,
      }),
    ),
    optional(statsApi.getRevenue({ ...dateParams, groupBy: resolved.groupBy })),
    optional(statsApi.getTopProducts({ ...dateParams, sortBy: 'revenue', limit: TOP_ROWS })),
  ])

  return {
    key,
    revenueDateRange: resolved,
    revenueByPaymentMethod,
    ordersByStatus,
    topCustomers,
    cashflow,
    inventory,
    overview,
    previousOverview,
    revenueSeries,
    topProducts,
  }
}

/** Nơi chọn trên trang. */
export function useDashboardStats(period: ReportPeriod, locationKey: string) {
  const { branchId, warehouseId } = locationFilter(locationKey)
  const isWarehouse = Boolean(warehouseId)

  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [reloadCount, setReloadCount] = useState(0)
  const [data, setData] = useState<ReportData | null>(null)

  // Khoá của bộ lọc hiện tại: câu trả lời nào mang khoá khác là của bộ lọc cũ.
  const key = useMemo(
    () => [period.fromDate, period.toDate, branchId, warehouseId, lowStockThreshold, reloadCount].join('|'),
    [period.fromDate, period.toDate, branchId, warehouseId, lowStockThreshold, reloadCount],
  )

  useEffect(() => {
    // Bỏ kết quả của bộ lọc cũ.
    let cancelled = false
    loadReport(key, period, branchId, warehouseId, lowStockThreshold)
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
    // `period` đổi thì `key` đổi; đọc qua `key` để effect không chạy lại vì object kỳ mới mà cùng ngày.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const refetch = useCallback(() => setReloadCount((count) => count + 1), [])

  return {
    revenueDateRange: data?.revenueDateRange ?? null,
    revenueByPaymentMethod: data?.revenueByPaymentMethod ?? null,
    ordersByStatus: data?.ordersByStatus ?? null,
    topCustomers: data?.topCustomers ?? null,
    cashflow: data?.cashflow ?? null,
    inventory: data?.inventory ?? null,
    overview: data?.overview ?? null,
    previousOverview: data?.previousOverview ?? null,
    revenueSeries: data?.revenueSeries ?? null,
    topProducts: data?.topProducts ?? null,
    // Đang tải khi số liệu đang hiện không phải của bộ lọc hiện tại.
    isLoading: data?.key !== key,
    isWarehouse,
    /** Địa điểm đang xem (chi nhánh hoặc kho): dùng cho widget tự tải số liệu của mình. */
    place: branchId ?? warehouseId,
    lowStockThreshold,
    setLowStockThreshold,
    refetch,
  }
}
