'use client'

import { Plus, Trash2 } from 'lucide-react'
import { PermissionButton } from "@/components/permission-button";
import { getCachedUser } from '@/lib/auth'
import { canCreatePromotion, canDeletePromotion } from '@/components/sidebar/constants/role-permissions'
import { usePromotions } from '../_context/promotions-provider'

export function PromotionsButtonGroup() {
  const { setOpen, selectedIds } = usePromotions()
  const role = getCachedUser()?.role
  const canWrite = canCreatePromotion(role)
  const canDelete = canDeletePromotion(role)

  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <PermissionButton
          allowed={canDelete}
          permission="promotions:delete"
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen('deleteMany')}
        >
          <Trash2 className="mr-2 size-4" />
          Tắt {selectedIds.length} mục
        </PermissionButton>
      )}
      <PermissionButton
        allowed={canWrite}
        permission="promotions:create"
        size="sm"
        className="cursor-pointer"
        onClick={() => setOpen('add')}
      >
        <Plus className="mr-2 size-4" />
        Thêm khuyến mãi
      </PermissionButton>
    </div>
  )
}
