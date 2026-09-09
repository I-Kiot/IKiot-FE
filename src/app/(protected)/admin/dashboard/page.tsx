import { PageHeader } from "@/components/page-header";
import { AdminDashboardProvider } from "./components/admin-dashboard-provider";
import { MetricsOverview } from "./components/metrics-overview";
import { SalesChart } from "./components/sales-chart";
import { RecentTransactions } from "./components/recent-transactions";
import { TopTenants } from "./components/top-tenants";
import { TenantInsights } from "./components/tenant-insights";
import { QuickActions } from "./components/quick-actions";
import { RevenueBreakdown } from "./components/revenue-breakdown";

export default function Dashboard2() {
  return (
    <AdminDashboardProvider>
      <div className="flex-1 space-y-6 px-6 pt-0">
        <PageHeader
          breadcrumbs={[{ label: "Trang chủ" }]}
          title="Tổng quan nền tảng"
          description="Theo dõi cửa hàng, gói dịch vụ và doanh thu nền tảng theo thời gian thực"
          actions={<QuickActions />}
        />

        {/* Main Dashboard Grid */}
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
            <RecentTransactions />
            <TopTenants />
          </div>

          {/* Fourth Row - Tenant growth & subscription status */}
          <TenantInsights />
        </div>
      </div>
    </AdminDashboardProvider>
  );
}
