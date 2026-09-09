// [Table – Columns Promotion]
import { type ColumnDef } from '@tanstack/react-table'
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatDateTime } from '@/lib/utils'
import type { Promotion } from '@/types/promotion'
import { STATUS_MAP, DISCOUNT_TYPE_MAP, getPromotionDisplayStatus } from '../../_constants/promotion.constants'

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

export const promotionsColumns: ColumnDef<Promotion>[] = [
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
    accessorKey: 'promoName',
    header: ({ column }) => <SortableHeader label="Tên chương trình" column={column} />,
    cell: ({ row }) => {
      const promotion = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{promotion.promoName}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">
            {promotion.branchIds && promotion.branchIds.length > 0
              ? `Theo chi nhánh (${promotion.branchIds.length})`
              : 'Toàn hệ thống'}
          </span>
        </div>
      )
    },
  },
  {
    id: 'discount',
    header: 'Giảm giá',
    cell: ({ row }) => {
      const promotion = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium tabular-nums">
            {promotion.discountType === 'PERCENT'
              ? `${promotion.discountValue}%`
              : formatVND(promotion.discountValue)}
          </span>
          <span className="text-xs text-muted-foreground">
            {DISCOUNT_TYPE_MAP[promotion.discountType]}
          </span>
        </div>
      )
    },
  },
  {
    id: 'period',
    header: 'Thời gian',
    cell: ({ row }) => {
      const promotion = row.original
      return (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(promotion.startDate)} - {formatDateTime(promotion.endDate)}
        </span>
      )
    },
  },
  {
    id: 'usage',
    header: 'Đã sử dụng',
    cell: ({ row }) => {
      const promotion = row.original
      return (
        <span className="text-sm tabular-nums">
          {promotion.usedCount}
          {promotion.usageLimit != null ? ` / ${promotion.usageLimit}` : ''}
        </span>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const { label, className } = STATUS_MAP[getPromotionDisplayStatus(row.original)]
      return (
        <Badge variant="secondary" className={cn('text-xs', className)}>
          {label}
        </Badge>
      )
    },
    filterFn: (row, columnId, value: string) => row.getValue(columnId) === value,
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
