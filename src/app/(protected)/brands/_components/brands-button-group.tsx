'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useBrands } from '../_context/brands-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateBrand, canDeleteBrand } from '@/components/sidebar/constants/role-permissions'

export function BrandsButtonGroup() {
  const { setOpen, selectedIds } = useBrands()
  const role = getCachedUser()?.role
  const canWrite = canCreateBrand(role)
  const canDelete = canDeleteBrand(role)

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <PermissionButton
          allowed={canDelete}
          permission="brands:delete"
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen('deleteMany')}
        >
          <Trash2 className="mr-2 size-4" />
          Xóa {selectedIds.length} mục
        </PermissionButton>
      )}
      <Button variant="outline" size="sm" className="cursor-pointer">
        <Download className="mr-2 size-4" />
        Xuất file
      </Button>
      <PermissionButton
        allowed={canWrite}
        permission="brands:create"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen('add')}
      >
        <Plus className="mr-2 size-4" />
        Thêm thương hiệu
      </PermissionButton>
    </div>
  )
}
