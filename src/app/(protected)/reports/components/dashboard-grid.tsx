// [Báo cáo chi tiết – bố cục theo địa điểm đang chọn]
'use client'

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
  const { revenueByBranch } = useDashboard()

  const showBranches = (revenueByBranch?.branches.length ?? 0) > 1

  return (
    <div className="@container/main space-y-6">
      <DashboardToolbar />

      {/* Các mốc thời gian cố định (hôm nay, tuần, tháng...) - KPI và xu hướng theo kỳ đã nằm ở dashboard. */}
      <RevenueComparison />

      {/* Tách chi tiết theo từng câu hỏi để mỗi tab không chỉ toàn thẻ. */}
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
