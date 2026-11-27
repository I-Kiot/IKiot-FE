'use client'

import { Plus } from 'lucide-react'
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { useTransfers } from './transfers-provider'

export function TransfersButtonGroup() {
  const { setOpen, labels } = useTransfers()
  return (
    <PermissionButton
      allowed={allows(getSessionRole(), "stock_movement", "create")}
      permission="stock_movement:create"
      className="cursor-pointer"
      onClick={() => setOpen('create')}
    >
      <Plus className="mr-2 size-4" />
      {labels.createButton}
    </PermissionButton>
  )
}
