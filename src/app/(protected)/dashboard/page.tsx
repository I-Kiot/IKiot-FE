import { PageHeader } from "@/components/page-header";
import { QuickActions } from "./components/quick-actions";
import { DashboardProvider } from "./components/dashboard-provider";
import { DashboardGrid } from "./components/dashboard-grid";

export default function Dashboard2() {
  return (
    <DashboardProvider>
      <div className="flex-1 space-y-6 px-6 pt-0">
        <PageHeader
          breadcrumbs={[{ label: "Trang chủ" }]}
          title="Tổng quan kinh doanh"
          description="Theo dõi hiệu suất và các chỉ số kinh doanh theo thời gian thực"
          actions={<QuickActions />}
        />

        <DashboardGrid />
      </div>
    </DashboardProvider>
  );
}
