// [Page – Suppliers]
import { PageHeader } from "@/components/page-header";
import { SuppliersButtonGroup } from "./_components/suppliers-button-group";
import { SuppliersTable } from "./_components/table/suppliers-table";

export default function SuppliersPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/dashboard" },
          { label: "Giao dịch" },
          { label: "Nhà cung cấp" },
        ]}
        title="Nhà cung cấp"
        description="Quản lý danh sách nhà cung cấp và theo dõi công nợ"
        actions={<SuppliersButtonGroup />}
      />
      <SuppliersTable />
    </div>
  );
}
