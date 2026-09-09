// [Page – Admin Transactions]
import { PageHeader } from "@/components/page-header";
import { TransactionsTable } from "./_components/table/transactions-table";

export default function AdminTransactionsPage() {
  return (
    <div className="flex flex-col gap-6 px-4  lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Giao dịch" },
        ]}
        title="Giao dịch gói cước"
        description="Theo dõi lịch sử thanh toán nâng cấp gói cước, gia hạn dịch vụ và các giao dịch của hệ thống."
      />
      <TransactionsTable />
    </div>
  );
}
