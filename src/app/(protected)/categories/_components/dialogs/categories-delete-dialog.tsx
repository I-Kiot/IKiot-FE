// [Dialog – Delete Category]
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
import type { Category } from '@/types/category'
import { useCategories } from '../../_context/categories-provider'

type CategoriesDeleteDialogProps = {
  open: boolean
  mode: 'delete' | 'deleteMany'
  onOpenChange: (open: boolean) => void
  currentRow: Category | null
  selectedIds: string[]
}

export function CategoriesDeleteDialog({
  open,
  mode,
  onOpenChange,
  currentRow,
  selectedIds,
}: CategoriesDeleteDialogProps) {
  const { handleDelete, handleDeleteMany } = useCategories()

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
          <DialogTitle>Xóa danh mục</DialogTitle>
          <DialogDescription>
            {isBulk ? (
              <>
                Bạn có chắc muốn xóa{' '}
                <strong className="text-foreground">{selectedIds.length} danh mục</strong> đã chọn?{' '}
                Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                Bạn có chắc muốn xóa danh mục{' '}
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
