// [Table – Toolbar Promotion]
'use client'

import { type Table } from '@tanstack/react-table'
import { Funnel, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Promotion } from '@/types/promotion'
import { COLUMN_LABELS } from '../../_constants/promotion.constants'

type PromotionsToolbarProps = {
  table: Table<Promotion>
}

export function PromotionsToolbar({ table }: PromotionsToolbarProps) {
  const statusFilter = table.getColumn('status')?.getFilterValue() as string

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên chương trình..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="pl-9 h-9"
          />
        </div>

        <Select
          value={statusFilter || ''}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="cursor-pointer w-36 h-9 text-sm">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Đang chạy</SelectItem>
            <SelectItem value="INACTIVE">Đã tắt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="cursor-pointer h-9">
            <Funnel />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {COLUMN_LABELS[col.id] ?? col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
