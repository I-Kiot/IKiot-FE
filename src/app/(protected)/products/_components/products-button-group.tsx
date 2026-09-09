'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProducts } from '../_context/products-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateProduct, canDeleteProduct } from '@/components/sidebar/constants/role-permissions'

export function ProductsButtonGroup() {
  const { setOpen, selectedIds } = useProducts()
  const role = getCachedUser()?.role
  const canWrite = canCreateProduct(role)
  const canDelete = canDeleteProduct(role)

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
          Thêm hàng hóa
        </Button>
      )}
    </div>
  )
}
