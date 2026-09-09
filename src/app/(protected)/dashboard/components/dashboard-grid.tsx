// [Dashboard – layout switch by active location]
'use client'

import { Warehouse } from 'lucide-react'
import { useDashboard } from './dashboard-provider'
import { MetricsOverview } from './metrics-overview'
import { SalesChart } from './sales-chart'
import { RevenueByStaff } from './recent-transactions'
import { TopProducts } from './top-products'
import { CashflowInventory } from './customer-insights'
import { RevenueBreakdown } from './revenue-breakdown'

export function DashboardGrid() {
  const { isWarehouse } = useDashboard()

  // A warehouse has no sales - show only the widgets that apply to it.
  if (isWarehouse) {
    return (
      <div className="@container/main space-y-6">
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

  return (
    <div className="@container/main space-y-6">
      {/* Top Row - Key Metrics */}
      <MetricsOverview />

      {/* Second Row - Charts in 6-6 columns */}
      <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
        <SalesChart />
        <RevenueBreakdown />
      </div>

      {/* Third Row - Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
        <RevenueByStaff />
        <TopProducts />
      </div>

      {/* Fourth Row - Cashflow & Inventory */}
      <CashflowInventory />
    </div>
  )
}
