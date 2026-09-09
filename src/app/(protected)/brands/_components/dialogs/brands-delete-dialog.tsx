// [Dialog – Delete Brand]
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
import type { Brand } from '@/types/brand'
import { useBrands } from '../../_context/brands-provider'

type BrandsDeleteDialogProps = {
  open: boolean
  mode: 'delete' | 'deleteMany'
  onOpenChange: (open: boolean) => void
  currentRow: Brand | null
  selectedIds: string[]
}

export function BrandsDeleteDialog({
  open,
  mode,
  onOpenChange,
  currentRow,
  selectedIds,
}: BrandsDeleteDialogProps) {
  const { handleDelete, handleDeleteMany } = useBrands()

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
          <DialogTitle>Xóa thương hiệu</DialogTitle>
          <DialogDescription>
            {isBulk ? (
              <>
                Bạn có chắc muốn xóa{' '}
                <strong className="text-foreground">{selectedIds.length} thương hiệu</strong> đã
                chọn? Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                Bạn có chắc muốn xóa thương hiệu{' '}
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
