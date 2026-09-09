// [Component – Roles actions]
'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRoles } from '../_context/roles-provider'

export function RolesButtonGroup() {
  const { setOpen } = useRoles()

  return (
    <Button className="cursor-pointer" onClick={() => setOpen('add')}>
      <Plus className="mr-2 size-4" />
      Thêm vai trò
    </Button>
  )
}
