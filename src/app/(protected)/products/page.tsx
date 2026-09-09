'use client'

import { getCachedUser } from '@/lib/auth'
import { canViewProducts } from '@/components/sidebar/constants/role-permissions'
import { PageHeader } from '@/components/page-header'
import { ProductsButtonGroup } from './_components/products-button-group'
import { ProductsTable } from './_components/table/products-table'

export default function ProductsPage() {
  const canView = canViewProducts(getCachedUser()?.role)

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Tài khoản của bạn không có quyền xem module hàng hóa. Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Quản lý bán hàng' },
          { label: 'Danh sách' },
        ]}
        title="Hàng hóa"
        description="Quản lý danh sách hàng hóa, giá bán và tồn kho"
        actions={<ProductsButtonGroup />}
      />
      <ProductsTable />
    </div>
  )
}
