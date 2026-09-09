// [Page – Admin Users]
import { PageHeader } from "@/components/page-header";
import { UsersTable } from "./_components/table/users-table";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Người dùng" },
        ]}
        title="Người dùng & Cửa hàng"
        description="Quản lý thông tin tài khoản người dùng, cấu hình cửa hàng (Tenant) và theo dõi lịch sử giao dịch trên hệ thống."
      />
      <UsersTable />
    </div>
  );
}
