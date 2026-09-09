// [Context – Dashboard Data]
'use client'

import React, { useEffect, useState } from 'react'
import { useDashboardStats, type DashboardRange, type TopProductsSortBy, type RevenueDateRange } from '../hooks/use-dashboard-stats'
import { branchApi } from '@/lib/api/branch'
import { warehouseApi } from '@/lib/api/warehouse'
import type {
  StatsOverview,
  RevenueSeries,
  RevenueByPaymentMethod,
  RevenueByStaff,
  Cashflow,
  TopProducts,
  InventoryStats,
} from '@/lib/api/stats'

type LocationOption = { value: string; label: string }

type DashboardContextType = {
  overview: StatsOverview | null
  revenue: RevenueSeries | null
  revenueDateRange: RevenueDateRange | null
  revenueByPaymentMethod: RevenueByPaymentMethod | null
  revenueByStaff: RevenueByStaff | null
  cashflow: Cashflow | null
  topProducts: TopProducts | null
  inventory: InventoryStats | null
  isLoading: boolean
  isWarehouse: boolean
  range: DashboardRange
  setRange: (range: DashboardRange) => void
  topProductsSortBy: TopProductsSortBy
  setTopProductsSortBy: (sortBy: TopProductsSortBy) => void
  lowStockThreshold: number
  setLowStockThreshold: (threshold: number) => void
  refetch: () => void
  branchOptions: LocationOption[]
  warehouseOptions: LocationOption[]
}

const DashboardContext = React.createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<DashboardRange>('30d')
  const stats = useDashboardStats(range)
  const [branchOptions, setBranchOptions] = useState<LocationOption[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<LocationOption[]>([])

  // Used to resolve a low-stock row's locationId to its actual branch/warehouse name.
  useEffect(() => {
    branchApi
      .getList({ limit: 100 })
      .then((res) => setBranchOptions((res.data ?? []).map((b) => ({ value: b.id, label: b.name }))))
      .catch(() => setBranchOptions([]))
    warehouseApi
      .getList({ limit: 100 })
      .then((res) => setWarehouseOptions((res.data ?? []).map((w) => ({ value: w.id, label: w.name }))))
      .catch(() => setWarehouseOptions([]))
  }, [])

  return (
    <DashboardContext.Provider value={{ ...stats, range, setRange, branchOptions, warehouseOptions }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>')
  return ctx
}
