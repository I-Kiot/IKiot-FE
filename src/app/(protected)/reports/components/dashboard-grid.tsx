// [Báo cáo chi tiết – bố cục theo địa điểm đang chọn]
'use client'

import { Warehouse } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDashboard } from './dashboard-provider'
import { DashboardToolbar } from './dashboard-toolbar'
import { RevenueComparison } from './revenue-comparison'
import { RevenueByStaff } from './recent-transactions'
import { TopCustomers } from './top-customers'
import { BranchRevenue } from './branch-revenue'
import { OrderStatusChart } from './order-status-chart'
import { SalesHeatmap } from './sales-heatmap'
import { CashflowInventory } from './customer-insights'
import { RevenueBreakdown } from './revenue-breakdown'

export function DashboardGrid() {
  const { isWarehouse, revenueByBranch } = useDashboard()

  // A warehouse has no sales - show only the widgets that apply to it.
  if (isWarehouse) {
    return (
      <div className="@container/main space-y-6">
        <DashboardToolbar />
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
          <Warehouse className="mt-0.5 size-4 shrink-0" />
          <span>
            Bạn đang xem một <span className="font-medium text-foreground">kho</span>. Kho không phát
            sinh doanh thu bán hàng, nên chỉ hiển thị <span className="font-medium text-foreground">dòng tiền</span> (nhập
            hàng) và <span className="font-medium text-foreground">tồn kho</span>.
          </span>
        </div>
        <CashflowInventory />
      </div>
    )
  }

  const showBranches = (revenueByBranch?.branches.length ?? 0) > 1

  return (
    <div className="@container/main space-y-6">
      <DashboardToolbar />

      {/* Các mốc thời gian cố định (hôm nay, tuần, tháng...) - KPI và xu hướng theo kỳ đã nằm ở dashboard. */}
      <RevenueComparison />

      {/* Detail is split by question so no tab is a wall of cards. */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales" className="cursor-pointer">Bán hàng</TabsTrigger>
          <TabsTrigger value="operations" className="cursor-pointer">Vận hành</TabsTrigger>
          <TabsTrigger value="finance" className="cursor-pointer">Dòng tiền &amp; Tồn kho</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
            <RevenueBreakdown />
            {showBranches && <BranchRevenue />}
            <TopCustomers />
            <RevenueByStaff />
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
            <OrderStatusChart />
            <SalesHeatmap />
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <CashflowInventory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
