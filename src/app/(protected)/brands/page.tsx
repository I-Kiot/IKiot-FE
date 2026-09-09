'use client'

import { getCachedUser } from '@/lib/auth'
import { canViewBrands } from '@/components/sidebar/constants/role-permissions'
import { PageHeader } from '@/components/page-header'
import { BrandsButtonGroup } from './_components/brands-button-group'
import { BrandsTable } from './_components/table/brands-table'

export default function BrandsPage() {
  const canView = canViewBrands(getCachedUser()?.role)

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Tài khoản của bạn không có quyền xem module thương hiệu. Vui lòng liên hệ quản trị viên.
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
          { label: 'Thương hiệu' },
        ]}
        title="Thương hiệu"
        description="Quản lý thương hiệu và nhà sản xuất hàng hóa"
        actions={<BrandsButtonGroup />}
      />
      <BrandsTable />
    </div>
  )
}
