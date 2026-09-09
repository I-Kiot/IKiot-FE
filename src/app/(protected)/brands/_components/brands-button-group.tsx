// [Component – Button Group Brand]
'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          Thêm thương hiệu
        </Button>
      )}
    </div>
  )
}
