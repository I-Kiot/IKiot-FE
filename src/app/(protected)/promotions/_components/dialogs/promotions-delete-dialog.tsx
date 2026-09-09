// [Dialog – Delete Promotion]
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
import type { Promotion } from '@/types/promotion'
import { usePromotions } from '../../_context/promotions-provider'

type PromotionsDeleteDialogProps = {
  open: boolean
  mode: 'delete' | 'deleteMany'
  onOpenChange: (open: boolean) => void
  currentRow: Promotion | null
  selectedIds: string[]
}

export function PromotionsDeleteDialog({
  open,
  mode,
  onOpenChange,
  currentRow,
  selectedIds,
}: PromotionsDeleteDialogProps) {
  const { handleDelete, handleDeleteMany } = usePromotions()

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
          <DialogTitle>Tắt khuyến mãi</DialogTitle>
          <DialogDescription>
            {isBulk ? (
              <>
                Bạn có chắc muốn tắt{' '}
                <strong className="text-foreground">{selectedIds.length} khuyến mãi</strong> đã
                chọn? Chương trình sẽ ngừng áp dụng nhưng vẫn được lưu lại.
              </>
            ) : (
              <>
                Bạn có chắc muốn tắt khuyến mãi{' '}
                <strong className="text-foreground">{currentRow?.promoName ?? ''}</strong>?
                Chương trình sẽ ngừng áp dụng nhưng vẫn được lưu lại.
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
            {isBulk ? `Tắt ${selectedIds.length} mục` : 'Tắt khuyến mãi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
