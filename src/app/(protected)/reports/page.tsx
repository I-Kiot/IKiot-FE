import Link from "next/link";
import { Landmark, NotebookText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DashboardProvider } from "./components/dashboard-provider";
import { DashboardGrid } from "./components/dashboard-grid";

// Trang báo cáo: số liệu của kỳ dưới dạng bảng, mỗi tab một báo cáo (kết quả bán hàng, theo thời gian, hàng hóa,
// chi nhánh, nhân viên, khách hàng, đơn hàng, thu chi, tồn kho); biểu đồ phân tích nằm riêng ở tab cuối.
export default function ReportsPage() {
  return (
    <DashboardProvider>
      <div className="flex-1 space-y-6 px-4 lg:px-6">
        <PageHeader
          breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Báo cáo" }]}
          title="Báo cáo"
          description="Số liệu bán hàng, thu chi và tồn kho theo kỳ; mỗi bảng có trong file xuất Excel"
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
