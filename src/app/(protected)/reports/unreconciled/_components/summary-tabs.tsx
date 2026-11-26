// Ô tóm tắt kiêm tab: mỗi lúc chỉ mở một danh sách (tóm tắt trước, chi tiết khi cần).
import { Banknote, CheckCircle2, Landmark, Scale, Undo2, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Unreconciled } from '@/lib/api/stats'
import { formatNumber, formatVND } from '@/lib/stats-format'
import { TONE_TEXT, TONE_TILE, type Tone } from '../../../dashboard/shared/tones'
import { AgeBadge, daysSince } from './shared'

export const SECTIONS = ['shipper', 'sepay', 'overpaid', 'held', 'balances'] as const
export type Section = (typeof SECTIONS)[number]

interface Kind {
  id: Section
  title: string
  amount: number
  count: number
  unit: string
  icon: LucideIcon
  tone: Tone
  oldestDays?: number | null
}

const maxDays = (dates: (string | null)[], asOf: string) =>
  dates.reduce<number | null>((max, iso) => {
    const d = daysSince(iso, asOf)
    return d !== null && (max === null || d > max) ? d : max
  }, null)

export function actionKinds(data: Unreconciled): Kind[] {
  return [
    {
      id: 'shipper',
      title: 'Shipper chưa nộp',
      amount: data.shipperCash.amount,
      count: data.shipperCash.orderCount,
      unit: 'đơn',
      icon: Wallet,
      tone: 'orange',
      oldestDays: maxDays(data.shipperCash.items.map((i) => i.oldestPaidAt), data.asOf),
    },
    {
      id: 'sepay',
      title: 'SePay chưa xử lý',
      amount: data.sepayExceptions.amount,
      count: data.sepayExceptions.count,
      unit: 'giao dịch',
      icon: Landmark,
      tone: 'blue',
      oldestDays: maxDays(data.sepayExceptions.items.map((i) => i.createdAt), data.asOf),
    },
    {
      id: 'overpaid',
      title: 'Thu dư cần hoàn',
      amount: data.overpaidOrders.amount,
      count: data.overpaidOrders.count,
      unit: 'đơn',
      icon: Banknote,
      tone: 'violet',
    },
    {
      id: 'held',
      title: 'Tiền giữ treo',
      amount: data.heldUndecided.amount,
      count: data.heldUndecided.count,
      unit: 'đơn',
      icon: Undo2,
      tone: 'amber',
      oldestDays: maxDays(data.heldUndecided.items.map((i) => i.closedAt), data.asOf),
    },
  ]
}

const TILE =
  'h-auto flex-col items-stretch justify-start gap-1.5 rounded-xl border bg-card px-4 py-3 text-left whitespace-normal shadow-xs ' +
  'hover:bg-muted/50 data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:ring-1 data-[state=active]:ring-primary data-[state=active]:font-normal'

function KindTile({ kind }: { kind: Kind }) {
  const Icon = kind.icon
  const clear = kind.count === 0
  return (
    <TabsTrigger value={kind.id} className={TILE}>
      <span className="flex items-center gap-3">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${clear ? TONE_TILE.emerald : TONE_TILE[kind.tone]}`}>
          {clear ? <CheckCircle2 className="size-4" aria-hidden /> : <Icon className="size-4" aria-hidden />}
        </span>
        <span className="text-sm font-medium text-muted-foreground">{kind.title}</span>
        {!clear && (
          <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white tabular-nums">
            {formatNumber(kind.count)}
          </span>
        )}
      </span>
      {clear ? (
        <span className={`text-xl font-semibold ${TONE_TEXT.emerald}`}>Đã khớp</span>
      ) : (
        <span className="truncate text-xl font-semibold text-foreground tabular-nums">{formatVND(kind.amount)}</span>
      )}
      <span className="flex min-h-5 flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {clear ? (
          'Không có khoản nào'
        ) : (
          <>
            <span className="tabular-nums">
              {formatNumber(kind.count)} {kind.unit}
            </span>
            {kind.oldestDays !== undefined && kind.oldestDays !== null && kind.oldestDays > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>cũ nhất</span>
                <AgeBadge days={kind.oldestDays} />
              </>
            )}
          </>
        )}
      </span>
    </TabsTrigger>
  )
}

export function SummaryTabs({ kinds }: { kinds: Kind[] }) {
  return (
    <TabsList aria-label="Loại tiền cần đối soát" className="grid h-auto w-full grid-cols-1 gap-3 border-0 bg-transparent p-0 sm:grid-cols-2 xl:grid-cols-5">
      {kinds.map((kind) => (
        <KindTile key={kind.id} kind={kind} />
      ))}
      <TabsTrigger value="balances" className={TILE}>
        <span className="flex items-center gap-3">
          <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${TONE_TILE.slate}`}>
            <Scale className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-medium text-muted-foreground">Số dư tham khảo</span>
        </span>
        <span className="text-xl font-semibold text-foreground">Ngoài két</span>
        <span className="min-h-5 text-xs text-muted-foreground">Quỹ chủ, quầy kho, ngân hàng chưa gắn đơn</span>
      </TabsTrigger>
    </TabsList>
  )
}
