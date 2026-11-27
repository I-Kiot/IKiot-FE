// Mảnh dùng chung của màn Đối soát tiền.
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableHead } from '@/components/ui/table'
import { formatNumber } from '@/lib/stats-format'
import { TONE_TEXT, TONE_TILE } from '../../../dashboard/shared/tones'
import type { SortDir } from '../_hooks/use-sorted'

export const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
      })
    : '-'

const DAY_MS = 24 * 60 * 60 * 1000

/** Số ngày trọn tính tới lúc chụp số liệu (`asOf`), để cả trang cùng một mốc. */
export const daysSince = (iso: string | null, asOf: string) =>
  iso ? Math.max(0, Math.floor((new Date(asOf).getTime() - new Date(iso).getTime()) / DAY_MS)) : null

/** Chờ từ 1 ngày nhấn vàng, từ 3 ngày nhấn đỏ; luôn có chữ nên không phụ thuộc màu. */
export function AgeBadge({ days }: { days: number | null }) {
  if (days === null) return null
  if (days === 0) return <span className="text-xs text-muted-foreground">Hôm nay</span>
  return <Badge variant={days >= 3 ? 'error' : 'warning'}>{formatNumber(days)} ngày</Badge>
}

/** Ngày giờ + số ngày chờ trong một ô bảng. */
export function WhenCell({ iso, asOf }: { iso: string | null; asOf: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">{formatDateTime(iso)}</span>
      <AgeBadge days={daysSince(iso, asOf)} />
    </div>
  )
}

/** Tiêu đề cột bấm để sắp xếp; `aria-sort` báo chiều đang sắp. */
export function SortHead<K extends string>({
  label,
  column,
  sort,
  onSort,
  align = 'left',
}: {
  label: string
  column: K
  sort: { key: K; dir: SortDir }
  onSort: (key: K) => void
  align?: 'left' | 'right'
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead
      className={align === 'right' ? 'text-right' : undefined}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${align === 'right' ? 'flex-row-reverse' : ''} ${active ? 'text-foreground' : ''}`}
      >
        {label}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </TableHead>
  )
}

/** Khung một mục: tiêu đề, cách xử lý, nút đi tới nơi xử lý, nội dung. */
export function Panel({
  title,
  description,
  howTo,
  total,
  action,
  children,
}: {
  title: string
  description: string
  howTo?: string
  total?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {total && <p className="text-lg font-semibold tabular-nums">{total}</p>}
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {howTo && (
          <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="font-medium text-foreground">Cách xử lý: </span>
              {howTo}
            </span>
          </p>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

/** Không còn khoản nào: nói rõ là đã khớp, không để một bảng trống. */
export function AllClear({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className={`flex size-10 items-center justify-center rounded-full ${TONE_TILE.emerald}`}>
        <CheckCircle2 className="size-5" aria-hidden />
      </span>
      <p className={`font-medium ${TONE_TEXT.emerald}`}>Đã khớp</p>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

export const Empty = ({ text }: { text: string }) => <p className="py-2 text-sm text-muted-foreground">{text}</p>
