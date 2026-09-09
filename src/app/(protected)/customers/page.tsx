// [Page – Customers]
import { PageHeader } from '@/components/page-header'
import { CustomersButtonGroup } from './_components/customers-button-group'
import { CustomersTable } from './_components/table/customers-table'

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'CRM' },
          { label: 'Khách hàng' },
        ]}
        title="Khách hàng"
        description="Quản lý danh sách khách hàng và lịch sử mua hàng"
        actions={<CustomersButtonGroup />}
      />
      <CustomersTable />
    </div>
  )
}
