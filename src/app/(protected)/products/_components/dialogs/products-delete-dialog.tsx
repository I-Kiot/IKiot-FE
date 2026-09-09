// [Dialog – Delete Product]
'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Product } from '@/types/product'
import { useProducts } from '../../_context/products-provider'

type ProductsDeleteDialogProps = {
  open: boolean
  mode: 'delete' | 'deleteMany'
  onOpenChange: (open: boolean) => void
  currentRow: Product | null
  selectedIds: string[]
}

export function ProductsDeleteDialog({
  open,
  mode,
  onOpenChange,
  currentRow,
  selectedIds,
}: ProductsDeleteDialogProps) {
  const { handleDelete, handleDeleteMany } = useProducts()

  async function onConfirm() {
    const success =
      mode === 'deleteMany'
        ? await handleDeleteMany(selectedIds)
        : currentRow
          ? await handleDelete(currentRow.id)
          : false
    if (success) onOpenChange(false)
  }

  const isBulk = mode === 'deleteMany'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa hàng hóa</DialogTitle>
          <DialogDescription>
            {isBulk ? (
              <>
                Bạn có chắc muốn xóa{' '}
                <strong className="text-foreground">{selectedIds.length} hàng hóa</strong> đã chọn?{' '}
                Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                Bạn có chắc muốn xóa{' '}
                <strong className="text-foreground">{currentRow?.name ?? ''}</strong>? Hành động
                này không thể hoàn tác.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="cursor-pointer">
            <Trash2 className="mr-2 size-4" />
            {isBulk ? `Xóa ${selectedIds.length} mục` : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
