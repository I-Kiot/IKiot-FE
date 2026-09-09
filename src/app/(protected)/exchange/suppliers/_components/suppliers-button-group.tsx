// [Component – Button Group Supplier]
'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      {canDelete && selectedIds.length > 0 && (
        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen('deleteMany')}
        >
          <Trash2 className="mr-2 size-4" />
          Xóa {selectedIds.length} mục
        </Button>
      )}
      <Button variant="outline" size="sm" className="cursor-pointer">
        <Download className="mr-2 size-4" />
        Xuất file
      </Button>
      {canWrite && (
        <Button size="sm" className="cursor-pointer" onClick={() => setOpen('add')}>
          <Plus className="mr-2 size-4" />
          Thêm nhà cung cấp
        </Button>
      )}
    </div>
  )
}
