'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useCategories } from '../_context/categories-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateCategory, canDeleteCategory } from '@/components/sidebar/constants/role-permissions'

export function CategoriesButtonGroup() {
  const { setOpen, selectedIds } = useCategories()
  const role = getCachedUser()?.role
  const canWrite = canCreateCategory(role)
  const canDelete = canDeleteCategory(role)

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <PermissionButton
          allowed={canDelete}
          permission="categories:delete"
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
        permission="categories:create"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen('add')}
      >
        <Plus className="mr-2 size-4" />
        Thêm danh mục
      </PermissionButton>
    </div>
  )
}
