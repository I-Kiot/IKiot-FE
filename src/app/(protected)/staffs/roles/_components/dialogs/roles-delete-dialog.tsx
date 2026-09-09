// [Dialog – Delete Role]
'use client'

import { useState } from 'react'
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
import type { Role } from '@/types/role'
import { useRoles } from '../../_context/roles-provider'

type RolesDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Role | null
}

export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RolesDeleteDialogProps) {
  const { handleDelete } = useRoles()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Backend từ chối xóa vai trò còn người giữ (409). Nút bị chặn sẵn ở đây để lời từ chối
  // không đến sau cú bấm, nhưng backend vẫn là chỗ quyết định - con số này đọc từ lần tải
  // danh sách gần nhất và có thể đã cũ.
  const inUse = (currentRow?.userCount ?? 0) > 0

  async function onConfirm() {
    if (!currentRow || isSubmitting) return
    setIsSubmitting(true)
    const success = await handleDelete(currentRow.id)
    setIsSubmitting(false)
    if (success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xóa vai trò</DialogTitle>
          <DialogDescription>
            {inUse ? (
              <>
                Vai trò{' '}
                <strong className="text-foreground">{currentRow?.name}</strong>{' '}
                đang được {currentRow?.userCount} tài khoản sử dụng. Hãy chuyển
                những tài khoản đó sang vai trò khác trước khi xóa.
              </>
            ) : (
              <>
                Bạn có chắc muốn xóa vai trò{' '}
                <strong className="text-foreground">{currentRow?.name}</strong>?
                Thao tác này không khôi phục được.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={isSubmitting || inUse}
            onClick={onConfirm}
          >
            <Trash2 className="mr-2 size-4" />
            {isSubmitting ? 'Đang xóa...' : 'Xóa vai trò'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
