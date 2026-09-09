'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImports } from './imports-provider'

export function ImportsButtonGroup() {
  const { setOpen } = useImports()

  return (
    <Button className="cursor-pointer" onClick={() => setOpen('create')}>
      <Plus className="mr-2 size-4" />
      Tạo đơn nhập hàng
    </Button>
  )
}
