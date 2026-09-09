// [Table – Columns Customer]
import { type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Customer } from '@/types/customer'
import { GENDER_MAP } from '../../_constants/customer.constants'
import { formatDateTime } from '@/lib/utils'

const formatVND = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

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

export const customersColumns: ColumnDef<Customer>[] = [
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
    accessorKey: 'customerCode',
    header: ({ column }) => <SortableHeader label="Mã KH" column={column} />,
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">{row.getValue('customerCode')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <SortableHeader label="Tên khách hàng" column={column} />,
    cell: ({ row }) => {
      const customer = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{customer.name}</span>
          <span className="text-xs text-muted-foreground">{customer.phone || '-'}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'gender',
    header: 'Giới tính',
    cell: ({ row }) => {
      const gender = row.getValue('gender') as Customer['gender']
      const { label, className } = GENDER_MAP[gender]
      return (
        <Badge variant="secondary" className={cn('text-xs', className)}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, columnId, value: string) => row.getValue(columnId) === value,
  },
  {
    accessorKey: 'address',
    header: 'Địa chỉ',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
        {row.getValue('address') || '-'}
      </span>
    ),
  },
  {
    id: 'totalSpending',
    header: ({ column }) => <SortableHeader label="Tổng chi tiêu" column={column} />,
    accessorFn: (row) =>
      row.orders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + o.grandTotal, 0),
    cell: ({ getValue }) => (
      <span className="tabular-nums font-medium text-primary">
        {formatVND(getValue() as number)}
      </span>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <SortableHeader label="Ngày tạo" column={column} />,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDateTime(row.getValue('createdAt'))}
      </span>
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
