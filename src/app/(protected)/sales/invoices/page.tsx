import { PageHeader } from "@/components/page-header";
import { InvoicesTable } from "./components/invoices-table";

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Đơn hàng" },
          { label: "Hóa đơn" },
        ]}
        title="Quản lý Hóa đơn"
        description="Xem chi tiết, tìm kiếm và xuất dữ liệu hóa đơn bán hàng"
      />
      <InvoicesTable />
    </div>
  );
}
