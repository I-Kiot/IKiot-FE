// [Context – Dữ liệu Dashboard]
'use client'

import React, { useEffect, useState } from 'react'
import { useDashboardStats, type DashboardRange } from '../hooks/use-dashboard-stats'
import { branchApi } from '@/lib/api/branch'
import { warehouseApi } from '@/lib/api/warehouse'
import type { RevenueByStaffGroupBy } from '@/lib/api/stats'

type LocationOption = { value: string; label: string }

type DashboardContextType = ReturnType<typeof useDashboardStats> & {
  range: DashboardRange
  setRange: (range: DashboardRange) => void
  branchOptions: LocationOption[]
  warehouseOptions: LocationOption[]
  /** Tab báo cáo đang mở: nút xuất Excel cần biết để xuất riêng báo cáo đó. */
  activeTab: string
  setActiveTab: (tab: string) => void
  /** Cách tính người của báo cáo theo nhân viên; đặt ở đây để file xuất dùng đúng lựa chọn trên trang. */
  staffGroupBy: RevenueByStaffGroupBy
  setStaffGroupBy: (groupBy: RevenueByStaffGroupBy) => void
}

const DashboardContext = React.createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<DashboardRange>('30d')
  const stats = useDashboardStats(range)
  const [activeTab, setActiveTab] = useState('result')
  const [staffGroupBy, setStaffGroupBy] = useState<RevenueByStaffGroupBy>('assignee')
  const [branchOptions, setBranchOptions] = useState<LocationOption[]>([])
  const [warehouseOptions, setWarehouseOptions] = useState<LocationOption[]>([])

  // Dùng để đổi locationId của dòng sắp hết hàng thành tên chi nhánh/kho thực tế.
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
    <DashboardContext.Provider value={{
        ...stats,
        range,
        setRange,
        branchOptions,
        warehouseOptions,
        activeTab,
        setActiveTab,
        staffGroupBy,
        setStaffGroupBy,
      }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within <DashboardProvider>')
  return ctx
}
