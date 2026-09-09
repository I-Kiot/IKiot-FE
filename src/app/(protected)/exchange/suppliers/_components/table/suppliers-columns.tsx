// [Table – Columns Supplier]
import { type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Supplier } from '@/types/supplier'

function SortableHeader({
  label,
  column,
}: {
  label: string
  column: {
    getIsSorted: () => false | 'asc' | 'desc'
    toggleSorting: (desc?: boolean) => void
  }
}) {
  const sorted = column.getIsSorted()
  return (
    <button
      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
      onClick={() => column.toggleSorting(sorted === 'asc')}
    >
      {label}
      {sorted === 'asc' ? (
        <ChevronUp className="size-3" />
      ) : sorted === 'desc' ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 text-muted-foreground" />
      )}
    </button>
  )
}

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + ' ₫'
}

export const suppliersColumns: ColumnDef<Supplier>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center px-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn dòng"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: 'supplierName',
    header: ({ column }) => <SortableHeader label="Tên nhà cung cấp" column={column} />,
    cell: ({ row }) => (
      <span className="font-medium line-clamp-1 max-w-52">{row.getValue('supplierName')}</span>
    ),
  },
  {
    accessorKey: 'contactName',
    header: 'Người liên hệ',
    cell: ({ row }) => (
      <span className="text-sm">{row.getValue('contactName') || '-'}</span>
    ),
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Số điện thoại',
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.getValue('phoneNumber') || '-'}</span>
    ),
  },
  {
    accessorKey: 'outstandingDebt',
    header: ({ column }) => <SortableHeader label="Công nợ" column={column} />,
    cell: ({ row }) => {
      const debt = row.getValue('outstandingDebt') as number
      return (
        <span
          className={cn(
            'tabular-nums text-sm font-medium',
            debt > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground',
          )}
        >
          {formatVND(debt)}
        </span>
      )
    },
    // Bộ lọc "Có công nợ" tương ứng tham số hasDebt của backend
    filterFn: (row, columnId, value: string) => {
      if (value !== 'hasDebt') return true
      return (row.getValue(columnId) as number) > 0
    },
  },
  {
    accessorKey: 'creditLimit',
    header: ({ column }) => <SortableHeader label="Hạn mức" column={column} />,
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">{formatVND(row.getValue('creditLimit') as number)}</span>
    ),
  },
  {
    id: 'expand',
    header: '',
    cell: ({ row }) => (
      <ChevronRight
        className={cn(
          'size-4 text-muted-foreground transition-transform duration-200',
          row.getIsExpanded() && 'rotate-90',
        )}
      />
    ),
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
]
