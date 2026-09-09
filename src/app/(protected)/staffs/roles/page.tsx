// [Page – Roles]
'use client'

import { PageHeader } from '@/components/page-header'
import { canManageRoles } from '@/components/sidebar/constants/role-permissions'
import { getCachedUser } from '@/lib/auth'
import { RolesButtonGroup } from './_components/roles-button-group'
import { RolesTable } from './_components/table/roles-table'

export default function RolesPage() {
  // Backend gác các route này bằng OwnerOrAdminGuard - cố ý **không** đi qua chính danh
  // mục quyền, để không một vai trò tự tạo nào, dù rộng đến đâu, tự cấp cho mình quyền sửa
  // phân quyền. Gate ở đây phản chiếu đúng luật đó.
  const canView = canManageRoles(getCachedUser()?.role)

  if (!canView) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Không có quyền truy cập</h2>
          <p className="text-muted-foreground mt-2 max-w-md text-sm">
            Chỉ chủ cửa hàng mới quản lý được vai trò và phân quyền.
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
          { label: 'Nhân viên', href: '/staffs' },
          { label: 'Phân quyền' },
        ]}
        title="Vai trò & phân quyền"
        description="Tạo vai trò của riêng cửa hàng và chọn những gì mỗi vai trò được làm"
        actions={<RolesButtonGroup />}
      />
      <RolesTable />
    </div>
  )
}
