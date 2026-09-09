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
  type InventoryStats,
} from '@/lib/api/stats'

export type DashboardRange = '7d' | '30d' | '90d' | '12m'

const RANGE_DAYS: Record<DashboardRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

function toDateOnly(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
}

export type TopProductsSortBy = 'quantity' | 'revenue'

export type RevenueDateRange = { fromDate: string; toDate: string; groupBy: 'day' | 'month' }

export function useDashboardStats(range: DashboardRange) {
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)
  const isWarehouse = Boolean(warehouseId)

  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [revenue, setRevenue] = useState<RevenueSeries | null>(null)
  const [revenueDateRange, setRevenueDateRange] = useState<RevenueDateRange | null>(null)
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState<RevenueByPaymentMethod | null>(null)
  const [revenueByStaff, setRevenueByStaff] = useState<RevenueByStaff | null>(null)
  const [cashflow, setCashflow] = useState<Cashflow | null>(null)
  const [topProducts, setTopProducts] = useState<TopProducts | null>(null)
  const [inventory, setInventory] = useState<InventoryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [topProductsSortBy, setTopProductsSortBy] = useState<TopProductsSortBy>('revenue')
  const [lowStockThreshold, setLowStockThreshold] = useState(10)

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const toDate = new Date()
      const fromDate = new Date(toDate.getTime() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000)
      const fromDateStr = toDateOnly(fromDate)
      const toDateStr = toDateOnly(toDate)

      // A warehouse has no sales/orders, so the order-based widgets don't apply.
      // Only cashflow (imports) and inventory are meaningful - fetch just those
      // and clear the rest so the UI can hide the sales sections.
      if (isWarehouse) {
        const [cashflowRes, inventoryRes] = await Promise.all([
          statsApi.getCashflow({ fromDate: fromDateStr, toDate: toDateStr, warehouseId }),
          statsApi.getInventory({ warehouseId, lowStockThreshold }),
        ])

        setOverview(null)
        setRevenue(null)
        setRevenueDateRange(null)
        setRevenueByPaymentMethod(null)
        setRevenueByStaff(null)
        setTopProducts(null)
        setCashflow(cashflowRes)
        setInventory(inventoryRes)
        return
      }

      const dateParams = { fromDate: fromDateStr, toDate: toDateStr, branchId }
      const groupBy = range === '12m' ? ('month' as const) : ('day' as const)

      const [overviewRes, revenueRes, paymentRes, staffRes, cashflowRes, topProductsRes, inventoryRes] =
        await Promise.all([
          statsApi.getOverview(dateParams),
          statsApi.getRevenue({ ...dateParams, groupBy }),
          statsApi.getRevenueByPaymentMethod(dateParams),
          statsApi.getRevenueByStaff(dateParams),
          statsApi.getCashflow({ ...dateParams, flow: 'ORD' }),
          statsApi.getTopProducts({ ...dateParams, sortBy: topProductsSortBy, limit: 5 }),
          statsApi.getInventory({ branchId, lowStockThreshold }),
        ])

      setOverview(overviewRes)
      setRevenue(revenueRes)
      setRevenueDateRange({ fromDate: fromDateStr, toDate: toDateStr, groupBy })
      setRevenueByPaymentMethod(paymentRes)
      setRevenueByStaff(staffRes)
      setCashflow(cashflowRes)
      setTopProducts(topProductsRes)
      setInventory(inventoryRes)
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
    revenueDateRange,
    revenueByPaymentMethod,
    revenueByStaff,
    cashflow,
    topProducts,
    inventory,
    isLoading,
    isWarehouse,
    topProductsSortBy,
    setTopProductsSortBy,
    lowStockThreshold,
    setLowStockThreshold,
    refetch: fetchAll,
  }
}
