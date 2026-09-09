'use client'

import { getCachedUser } from '@/lib/auth'
import { canViewPromotions } from '@/components/sidebar/constants/role-permissions'
import { PageHeader } from '@/components/page-header'
import { PromotionsButtonGroup } from './_components/promotions-button-group'
import { PromotionsTable } from './_components/table/promotions-table'

export default function PromotionsPage() {
  const canView = canViewPromotions(getCachedUser()?.role)

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Tài khoản của bạn không có quyền xem module khuyến mãi. Vui lòng liên hệ quản trị viên.
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
          { label: 'CRM' },
          { label: 'Khuyến mãi' },
        ]}
        title="Khuyến mãi"
        description="Quản lý các chương trình khuyến mãi và mã giảm giá"
        actions={<PromotionsButtonGroup />}
      />
      <PromotionsTable />
    </div>
  )
}
