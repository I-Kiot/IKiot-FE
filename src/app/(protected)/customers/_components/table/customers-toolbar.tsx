// [Table – Toolbar Customer]
'use client'

import { type Table } from '@tanstack/react-table'
import { CalendarIcon, Coins, Funnel, Search } from 'lucide-react'
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
import type { Customer } from '@/types/customer'
import { COLUMN_LABELS } from '../../_constants/customer.constants'

type CustomersToolbarProps = {
  table: Table<Customer>
  dateFrom: string
  dateTo: string
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  spendingFrom: string
  spendingTo: string
  onSpendingFromChange: (v: string) => void
  onSpendingToChange: (v: string) => void
}

export function CustomersToolbar({
  table,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  spendingFrom,
  spendingTo,
  onSpendingFromChange,
  onSpendingToChange,
}: CustomersToolbarProps) {
  const genderFilter = table.getColumn('gender')?.getFilterValue() as string

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm tên, SĐT, mã KH..."
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="pl-9 h-9"
          />
        </div>

        <Select
          value={genderFilter || ''}
          onValueChange={(value) =>
            table.getColumn('gender')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="cursor-pointer w-32 h-9 text-sm">
            <SelectValue placeholder="Giới tính" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="MALE">Nam</SelectItem>
            <SelectItem value="FEMALE">Nữ</SelectItem>
            <SelectItem value="OTHER">Khác</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="h-9 w-36 text-sm cursor-pointer"
            title="Từ ngày"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="h-9 w-36 text-sm cursor-pointer"
            title="Đến ngày"
          />
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 cursor-pointer text-xs"
              onClick={() => {
                onDateFromChange('')
                onDateToChange('')
              }}
            >
              Xóa
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Coins className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="number"
            placeholder="Chi tiêu từ"
            value={spendingFrom}
            onChange={(e) => onSpendingFromChange(e.target.value)}
            className="h-9 w-32 text-sm cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Tổng chi tiêu từ"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="Đến"
            value={spendingTo}
            onChange={(e) => onSpendingToChange(e.target.value)}
            className="h-9 w-32 text-sm cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Tổng chi tiêu đến"
          />
          {(spendingFrom || spendingTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-2 cursor-pointer text-xs"
              onClick={() => {
                onSpendingFromChange('')
                onSpendingToChange('')
              }}
            >
              Xóa
            </Button>
          )}
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
