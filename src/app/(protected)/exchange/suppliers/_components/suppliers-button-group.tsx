'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useSuppliers } from '../_context/suppliers-provider'
import { getCachedUser } from '@/lib/auth'
import {
  canCreateSupplier,
  canDeleteSupplier,
} from '@/components/sidebar/constants/role-permissions'

export function SuppliersButtonGroup() {
  const { setOpen, selectedIds } = useSuppliers()
  const role = getCachedUser()?.role
  const canWrite = canCreateSupplier(role)
  const canDelete = canDeleteSupplier(role)

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <PermissionButton
          allowed={canDelete}
          permission="suppliers:delete"
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
        permission="suppliers:create"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen('add')}
      >
        <Plus className="mr-2 size-4" />
        Thêm nhà cung cấp
      </PermissionButton>
    </div>
  )
}
