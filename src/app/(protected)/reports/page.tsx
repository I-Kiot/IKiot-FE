import Link from "next/link";
import { Landmark, NotebookText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DashboardProvider } from "./components/dashboard-provider";
import { DashboardGrid } from "./components/dashboard-grid";

// Trang báo cáo chi tiết: các phân tích sâu tách khỏi dashboard tổng quan (2026-10-20) -
// so sánh mốc thời gian, cơ cấu doanh thu, chi nhánh, khách hàng, nhân viên, khung giờ bán,
// phễu trạng thái đơn, dòng tiền và tồn kho.
export default function ReportsPage() {
  return (
    <DashboardProvider>
      <div className="flex-1 space-y-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Báo cáo" }]}
          title="Báo cáo chi tiết"
          description="Phân tích doanh thu thuần, khách hàng, nhân viên, dòng tiền và tồn kho theo kỳ"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/sales-journal">
                  <NotebookText className="size-4" />
                  Sổ doanh thu
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reports/unreconciled">
                  <Landmark className="size-4" />
                  Đối soát tiền
                </Link>
              </Button>
            </div>
          }
        />

        <DashboardGrid />
      </div>
    </DashboardProvider>
  );
}
