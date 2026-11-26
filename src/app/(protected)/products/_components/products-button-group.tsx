'use client'

import { Copy, Download, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useProducts } from '../_context/products-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateProduct, canDeleteProduct } from '@/components/sidebar/constants/role-permissions'
import { copyTable, type TableCell } from '@/lib/clipboard-table'
import { parseLocationKey } from '@/lib/location-key'
import { useAuthStore } from '@/store/auth-store'
import { STATUS_MAP } from '../_constants/product.constants'

export function ProductsButtonGroup() {
  const { setOpen, selectedIds, screen, products, brands, categories } = useProducts()
  const locationKey = useAuthStore((s) => s.locationKey)
  const role = getCachedUser()?.role
  const canWrite = canCreateProduct(role)
  const canDelete = canDeleteProduct(role)

  /** Chép các dòng đã tích, theo thứ tự trong danh sách, dán thẳng vào Excel. Cột tồn theo nơi đang xem. */
  async function copySelected() {
    const selected = new Set(selectedIds)
    const rows = products.filter((p) => selected.has(p.id))
    const showChain = screen.showChainStock && parseLocationKey(locationKey) !== null
    const header = ['Tên hàng hóa', 'Thương hiệu', 'Danh mục', 'Trạng thái']
    if (screen.showStock) {
      header.push('Tồn kho', 'Hàng hỏng')
      if (showChain) header.push('Tồn toàn chuỗi')
    }
    const body = rows.map((p) => {
      const row: TableCell[] = [
        p.name,
        brands.find((b) => b.id === p.brandId)?.name ?? '',
        categories.find((c) => c.id === p.categoryId)?.name ?? p.categoryName ?? '',
        STATUS_MAP[p.status]?.label ?? p.status,
      ]
      if (screen.showStock) {
        row.push(p.totalStock ?? 0, p.damagedStock ?? 0)
        if (showChain) row.push(p.totalStockAllLocations ?? p.totalStock ?? 0)
      }
      return row
    })
    if (await copyTable(header, body)) {
      toast.success(`Đã sao chép ${rows.length} dòng, dán vào Excel là ra bảng`)
    } else {
      toast.error('Trình duyệt chặn sao chép. Hãy thử lại hoặc dùng "Xuất file".')
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={copySelected}
        >
          <Copy className="mr-2 size-4" />
          Sao chép {selectedIds.length} mục
        </Button>
      )}
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
