// [Component – Button Group Customer]
'use client'

import { Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCustomers } from '../_context/customers-provider'

export function CustomersButtonGroup() {
  const { setOpen, selectedIds } = useCustomers()
  return (
    <div className="flex shrink-0 items-center gap-2">
      {selectedIds.length > 0 && (
        <Button
          variant="destructive"
          size="sm"
          className="cursor-pointer"
          onClick={() => setOpen('deleteMany')}
        >
          <Trash2 className="mr-2 size-4" />
          Xóa {selectedIds.length} mục
        </Button>
      )}
      <Button variant="outline" size="sm" className="cursor-pointer">
        <Download className="mr-2 size-4" />
        Xuất file
      </Button>
      <Button size="sm" className="cursor-pointer" onClick={() => setOpen('add')}>
        <Plus className="mr-2 size-4" />
        Thêm khách hàng
      </Button>
    </div>
  )
}
