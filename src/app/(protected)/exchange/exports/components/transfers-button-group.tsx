'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransfers } from './transfers-provider'

export function TransfersButtonGroup() {
  const { setOpen, labels } = useTransfers()
  return (
    <Button className="cursor-pointer" onClick={() => setOpen('create')}>
      <Plus className="mr-2 size-4" />
      {labels.createButton}
    </Button>
  )
}
