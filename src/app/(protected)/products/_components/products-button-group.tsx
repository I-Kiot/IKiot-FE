'use client'

import { Copy, Download, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PermissionButton } from "@/components/permission-button";
import { useProducts } from '../_context/products-provider'
import { getCachedUser } from '@/lib/auth'
import { canCreateProduct, canDeleteProduct } from '@/components/sidebar/constants/role-permissions'
import { useState } from 'react'
import { copyRows } from '@/lib/clipboard-table'
import { productApi } from '@/lib/api/product'
import { productImportRows } from '../_constants/product-copy'
import { messageForCode } from '@/lib/api/error-codes'
import { blobErrorCode, saveBlob } from '@/lib/download-file'

export function ProductsButtonGroup() {
  const { setOpen, selectedIds, screen, products, brands, categories } = useProducts()
  const role = getCachedUser()?.role
  const canWrite = canCreateProduct(role)
  const canDelete = canDeleteProduct(role)

  const [copying, setCopying] = useState(false)
  const [exporting, setExporting] = useState(false)

  /** Xuất theo khuôn file mẫu nhập: hàng đã tích, không tích thì mọi hàng của màn này. */
  async function exportFile() {
    setExporting(true)
    try {
      const blob = await productApi.exportFile({
        ids: selectedIds.length > 0 ? selectedIds : undefined,
        productType: screen.listTypes,
      })
      saveBlob(blob, `hang-hoa-${new Date().toLocaleDateString('sv-SE')}.xlsx`)
      toast.success(
        selectedIds.length > 0 ? `Đã xuất ${selectedIds.length} ${screen.noun}` : `Đã xuất toàn bộ ${screen.noun}`,
      )
    } catch (error) {
      toast.error(messageForCode(await blobErrorCode(error)) ?? `Xuất file ${screen.noun} thất bại`)
    } finally {
      setExporting(false)
    }
  }

  /** Chép hàng hoá đã chọn theo cột file mẫu. */
  async function copySelected() {
    const selected = new Set(selectedIds)
    const chosen = products.filter((p) => selected.has(p.id))
    // Tạo Promise trước rồi đưa ngay cho clipboard: ClipboardItem phải được tạo trong chính lần click.
    const rows = Promise.all(chosen.map((p) => productApi.getById(p.id))).then((details) =>
      productImportRows(
        details.map((d) => ({ ...d, items: d.items ?? [] })),
        brands,
        categories,
      ),
    )
    setCopying(true)
    try {
      if (await copyRows(rows)) {
        const count = (await rows).length
        toast.success(`Đã sao chép ${count} phiên bản của ${chosen.length} hàng hóa theo mẫu nhập file`)
      } else {
        toast.error('Trình duyệt chặn sao chép. Hãy thử lại hoặc dùng "Xuất file".')
      }
    } catch {
      toast.error('Không tải được chi tiết hàng hóa để sao chép')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={copying}
          onClick={copySelected}
          title="Mỗi phiên bản một dòng, theo cột của file mẫu nhập hàng hóa"
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
      {screen.importFile && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={exporting}
          onClick={exportFile}
          title="Cùng cột với file mẫu nhập hàng hóa: sửa xong có thể nhập lại"
        >
          {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          {selectedIds.length > 0 ? `Xuất ${selectedIds.length} mục` : 'Xuất file'}
        </Button>
      )}
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
