'use client'

import { Download, Plus, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useProducts } from '../_context/products-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateProduct, canDeleteProduct } from '@/components/sidebar/constants/role-permissions'

export function ProductsButtonGroup() {
  const { setOpen, selectedIds, screen } = useProducts()
  const role = getCachedUser()?.role
  const canWrite = canCreateProduct(role)
  const canDelete = canDeleteProduct(role)

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <PermissionButton
          allowed={canDelete}
          permission="products:delete"
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
      {screen.importFile && (
        <PermissionButton
          allowed={canWrite}
          permission="products:create"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen('import')}
        >
          <Upload className="mr-2 size-4" />
          Nhập file
        </PermissionButton>
      )}
      <PermissionButton
        allowed={canWrite}
        permission="products:create"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen('add')}
      >
        <Plus className="mr-2 size-4" />
        Thêm {screen.noun}
      </PermissionButton>
    </div>
  )
}
