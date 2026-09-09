// [Table – Toolbar Category]
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
import type { Category } from '@/types/category'
import { COLUMN_LABELS } from '../../_constants/category.constants'

type CategoriesToolbarProps = {
  table: Table<Category>
}

export function CategoriesToolbar({ table }: CategoriesToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên danh mục..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="pl-9 h-9"
          />
        </div>
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
