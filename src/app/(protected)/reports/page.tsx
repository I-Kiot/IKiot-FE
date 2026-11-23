import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { DashboardProvider } from "./components/dashboard-provider";
import { DashboardGrid } from "./components/dashboard-grid";

// Trang Báo cáo tổng hợp: số liệu của kỳ dưới dạng bảng, mỗi tab một báo cáo (kết quả bán hàng, theo thời gian, hàng hóa,
// khách hàng, đơn hàng, thu chi, tồn kho). Nhân viên, điểm bán, sổ doanh thu, đối soát tiền là các mục riêng trong menu Báo cáo;
// biểu đồ ở trang Thống kê. Bọc Suspense vì kỳ đọc từ URL (`useSearchParams`).
export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <DashboardProvider>
        <div className="flex-1 space-y-6 px-4 lg:px-6">
          <PageHeader
            breadcrumbs={[{ label: "Trang chủ", href: "/dashboard" }, { label: "Báo cáo" }, { label: "Tổng hợp" }]}
            title="Báo cáo tổng hợp"
            description="Số liệu bán hàng, thu chi và tồn kho theo kỳ; mỗi bảng có trong file xuất Excel"
          />

          <DashboardGrid />
        </div>
      </DashboardProvider>
    </Suspense>
  );
}
