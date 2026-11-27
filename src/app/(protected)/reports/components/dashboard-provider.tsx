// [Context – Dữ liệu trang Báo cáo tổng hợp]
'use client'

import React, { useMemo, useState } from 'react'
import { useDashboardStats, type ReportPeriod } from '../hooks/use-dashboard-stats'
import { useReportPeriod } from '@/hooks/use-report-period'
import { useReportLocation, type ReportLocation } from '@/hooks/use-report-location'

type LocationOption = { value: string; label: string }

type DashboardContextType = ReturnType<typeof useDashboardStats> & {
  /** Kỳ đang xem (từ URL `?from=&to=`, mặc định 30 ngày gần nhất). */
  period: ReportPeriod
  setPeriod: (period: ReportPeriod) => void
  /** Nơi đang xem (dropdown trên trang, URL `?place=`): mọi bảng của trang theo nơi này. */
  location: ReportLocation
  branchOptions: LocationOption[]
  warehouseOptions: LocationOption[]
  /** Tab báo cáo đang mở: nút xuất Excel cần biết để xuất riêng báo cáo đó. */
  activeTab: string
  setActiveTab: (tab: string) => void
}

const DashboardContext = React.createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { period, setPeriod } = useReportPeriod()
  const location = useReportLocation()
  const stats = useDashboardStats(period, location.locationKey)
  const [activeTab, setActiveTab] = useState('result')

  // Dùng để đổi locationId của dòng sắp hết hàng thành tên chi nhánh/kho thực tế.
  const branchOptions = useMemo(() => location.branches.map((b) => ({ value: b.id, label: b.name })), [location.branches])
  const warehouseOptions = useMemo(
    () => location.warehouses.map((w) => ({ value: w.id, label: w.name })),
    [location.warehouses],
  )

  return (
    <DashboardContext.Provider
      value={{
        ...stats,
        period,
        setPeriod,
        location,
        branchOptions,
        warehouseOptions,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>')
  return ctx
}
