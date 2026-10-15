// [Query – Dashboard Stats]
'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { locationFilter } from '@/lib/location-key'
import {
  statsApi,
  type StatsOverview,
  type RevenueSeries,
  type RevenueByPaymentMethod,
  type RevenueByStaff,
  type Cashflow,
  type TopProducts,
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

export type TopProductsSortBy = 'quantity' | 'revenue'

export type RevenueDateRange = {
  fromDate: string
  toDate: string
  groupBy: 'day' | 'month'
  /** The equal-length window right before, which the trend chart overlays. */
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

/** The report widgets added after the core dashboard degrade on their own: one failing endpoint blanks its widget, not the whole page. */
function optional<T>(request: Promise<T>): Promise<T | null> {
  return request.catch((err) => {
    console.error(err)
    return null
  })
}

export function useDashboardStats(range: DashboardRange) {
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)
  const isWarehouse = Boolean(warehouseId)

  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [revenue, setRevenue] = useState<RevenueSeries | null>(null)
  const [previousRevenue, setPreviousRevenue] = useState<RevenueSeries | null>(null)
  const [revenueDateRange, setRevenueDateRange] = useState<RevenueDateRange | null>(null)
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<RevenueByPaymentMethod | null>(null)
  const [revenueByStaff, setRevenueByStaff] = useState<RevenueByStaff | null>(null)
  const [revenueByBranch, setRevenueByBranch] = useState<RevenueByBranch | null>(null)
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus | null>(null)
  const [salesHeatmap, setSalesHeatmap] = useState<SalesHeatmap | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomers | null>(null)
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [topProducts, setTopProducts] = useState<TopProducts | null>(null)
  const [inventory, setInventory] = useState<InventoryStats | null>(null)
  const [comparison, setComparison] = useState<RevenueComparison | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [topProductsSortBy, setTopProductsSortBy] = useState<TopProductsSortBy>('revenue')
  const [lowStockThreshold, setLowStockThreshold] = useState(10)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const resolved = resolveDashboardRange(range)
      const { fromDate, toDate, groupBy, previousFromDate, previousToDate } = resolved

      // A warehouse has no sales/orders, so the order-based widgets don't apply.
      // Only cashflow (imports) and inventory are meaningful - fetch just those
      // and clear the rest so the UI can hide the sales sections.
      if (isWarehouse) {
        const [cashflowRes, inventoryRes] = await Promise.all([
          statsApi.getCashflow({ fromDate, toDate, warehouseId }),
          statsApi.getInventory({ warehouseId, lowStockThreshold }),
        ])

        setOverview(null)
        setRevenue(null)
        setPreviousRevenue(null)
        setRevenueDateRange(null)
        setRevenueByPaymentMethod(null)
        setRevenueByStaff(null)
        setRevenueByBranch(null)
        setOrdersByStatus(null)
        setSalesHeatmap(null)
        setTopCustomers(null)
        setTopProducts(null)
        setComparison(null)
        setCashflow(cashflowRes)
        setInventory(inventoryRes)
        return
      }

      const dateParams = { fromDate, toDate, branchId }

      const [
        overviewRes,
        revenueRes,
        previousRevenueRes,
        paymentRes,
        staffRes,
        branchRes,
        statusRes,
        heatmapRes,
        customersRes,
        cashflowRes,
        topProductsRes,
        inventoryRes,
        comparisonRes,
      ] = await Promise.all([
        statsApi.getOverview(dateParams),
        statsApi.getRevenue({ ...dateParams, groupBy }),
        statsApi.getRevenue({ fromDate: previousFromDate, toDate: previousToDate, branchId, groupBy }),
        statsApi.getRevenueByPaymentMethod(dateParams),
        statsApi.getRevenueByStaff(dateParams),
        optional(statsApi.getRevenueByBranch(dateParams)),
        optional(statsApi.getOrdersByStatus(dateParams)),
        optional(statsApi.getSalesHeatmap(dateParams)),
        optional(statsApi.getTopCustomers({ ...dateParams, limit: 5 })),
        statsApi.getCashflow({ ...dateParams, flow: 'ORD' }),
        statsApi.getTopProducts({ ...dateParams, sortBy: topProductsSortBy, limit: 5 }),
        statsApi.getInventory({ branchId, lowStockThreshold }),
        optional(statsApi.getRevenueComparison({ branchId })),
      ])

      setOverview(overviewRes)
      setRevenue(revenueRes)
      setPreviousRevenue(previousRevenueRes)
      setRevenueDateRange(resolved)
      setRevenueByPaymentMethod(paymentRes)
      setRevenueByStaff(staffRes)
      setRevenueByBranch(branchRes)
      setOrdersByStatus(statusRes)
      setSalesHeatmap(heatmapRes)
      setTopCustomers(customersRes)
      setCashflow(cashflowRes)
      setTopProducts(topProductsRes)
      setInventory(inventoryRes)
      setComparison(comparisonRes)
    } catch (err) {
      console.error(err)
      toast.error('Tải dữ liệu thống kê thất bại')
    } finally {
      setIsLoading(false)
    }
  }, [range, branchId, warehouseId, isWarehouse, topProductsSortBy, lowStockThreshold])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    overview,
    revenue,
    previousRevenue,
    revenueDateRange,
    revenueByPaymentMethod,
    revenueByStaff,
    revenueByBranch,
    ordersByStatus,
    salesHeatmap,
    topCustomers,
    cashflow,
    topProducts,
    inventory,
    comparison,
    isLoading,
    isWarehouse,
    topProductsSortBy,
    setTopProductsSortBy,
    lowStockThreshold,
    setLowStockThreshold,
    refetch: fetchAll,
  }
}
