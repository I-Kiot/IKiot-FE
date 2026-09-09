// [Page – Admin Subscription Plans]
import { PageHeader } from "@/components/page-header";
import { PlansTable } from "./_components/plans-table";

export default function AdminSubscriptionsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Gói dịch vụ" },
        ]}
        title="Gói dịch vụ"
        description="Quản lý giá, giới hạn và nội dung hiển thị của các gói đăng ký. Thay đổi phản ánh ngay trên trang landing và trang thanh toán của tenant."
      />
      <PlansTable />
    </div>
  );
}
