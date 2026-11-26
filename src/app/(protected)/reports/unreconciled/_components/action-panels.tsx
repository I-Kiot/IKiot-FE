// Bốn mục cần người xử lý trên màn Đối soát tiền.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PermissionButton } from '@/components/permission-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Unreconciled } from '@/lib/api/stats'
import { formatNumber, formatVND } from '@/lib/stats-format'
import { SEPAY_OUTCOME_LABELS, SEPAY_REJECT_REASON_LABELS } from '@/types/sepay-transaction'
import { useSorted } from '../_hooks/use-sorted'
import { AllClear, Panel, SortHead, WhenCell } from './shared'

const RowLink = ({ href, label }: { href: string; label: string }) => (
  <Button variant="outline" size="sm" asChild>
    <Link href={href}>{label}</Link>
  </Button>
)

const time = (iso: string | null) => (iso ? new Date(iso).getTime() : null)

export function ShipperCashPanel({ data }: { data: Unreconciled }) {
  const { sorted, sort, toggle } = useSorted(
    data.shipperCash.items,
    { oldest: (i) => time(i.oldestPaidAt), amount: (i) => i.amount, orders: (i) => i.orderCount },
    { key: 'oldest', dir: 'asc' },
  )
  return (
    <Panel
      title="Tiền mặt shipper đang giữ"
      description="Khách đã trả tiền mặt cho shipper nhưng tiền chưa về két hay quỹ nào"
      howTo="nhận tiền từ shipper, mở từng đơn đã giao rồi bấm Xác nhận nộp tiền với đúng số tiền."
      total={formatVND(data.shipperCash.amount)}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href="/shipments?tab=shipments&status=DELIVERED">
            Mở các lần giao đã giao
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      {sorted.length === 0 ? (
        <AllClear text="Shipper đã nộp hết tiền thu hộ." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipper</TableHead>
              <SortHead label="Số đơn" column="orders" sort={sort} onSort={toggle} align="right" />
              <SortHead label="Giữ từ" column="oldest" sort={sort} onSort={toggle} />
              <SortHead label="Số tiền" column="amount" sort={sort} onSort={toggle} align="right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item, index) => (
              <TableRow key={item.collectorId ?? index}>
                <TableCell className="font-medium">{item.collectorName ?? 'Không rõ'}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(item.orderCount)}</TableCell>
                <TableCell>
                  <WhenCell iso={item.oldestPaidAt} asOf={data.asOf} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatVND(item.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}

export function SepayPanel({ data, canHandle }: { data: Unreconciled; canHandle: boolean }) {
  const { sorted, sort, toggle } = useSorted(
    data.sepayExceptions.items,
    { time: (i) => time(i.createdAt), amount: (i) => i.amount },
    { key: 'time', dir: 'asc' },
  )
  const handle = (label: string, size: 'sm' | 'default' = 'sm') => (
    <PermissionButton allowed={canHandle} permission="cash_flows:read" variant="outline" size={size} asChild>
      <Link href="/cashflow/sepay">{label}</Link>
    </PermissionButton>
  )
  return (
    <Panel
      title="Giao dịch SePay chưa xử lý"
      description="Chuyển thiếu, bị từ chối, không gắn được đơn hoặc trả dư mà chưa có người xử lý"
      howTo="mở danh sách SePay, gắn giao dịch vào đúng đơn hoặc ghi nhận đã hoàn tiền cho khách."
      total={formatVND(data.sepayExceptions.amount)}
      action={handle('Mở danh sách SePay')}
    >
      {sorted.length === 0 ? (
        <AllClear text="Mọi giao dịch SePay đều đã gắn đơn hoặc đã xử lý." />
      ) : (
        <>
          {data.sepayExceptions.excessAmount > 0 && (
            <p className="text-xs text-muted-foreground">Trong đó trả dư: {formatVND(data.sepayExceptions.excessAmount)}</p>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kết quả</TableHead>
                <TableHead>Đơn</TableHead>
                <SortHead label="Thời gian" column="time" sort={sort} onSort={toggle} />
                <SortHead label="Số tiền" column="amount" sort={sort} onSort={toggle} align="right" />
                <TableHead className="w-0">
                  <span className="sr-only">Thao tác</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Badge variant="warning">
                      {SEPAY_OUTCOME_LABELS[item.outcome as keyof typeof SEPAY_OUTCOME_LABELS] ?? item.outcome}
                    </Badge>
                    {item.rejectReason && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {SEPAY_REJECT_REASON_LABELS[item.rejectReason as keyof typeof SEPAY_REJECT_REASON_LABELS] ?? item.rejectReason}
                      </p>
                    )}
                    {item.content && <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground" title={item.content}>{item.content}</p>}
                  </TableCell>
                  <TableCell>
                    {item.orderId ? (
                      <Link href={`/sales/orders/${item.orderId}`} className="text-primary hover:underline">
                        {item.orderCode ?? 'Xem đơn'}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Chưa gắn đơn</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <WhenCell iso={item.createdAt} asOf={data.asOf} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatVND(item.amount)}
                    {item.excessAmount > 0 && <p className="text-xs text-muted-foreground">dư {formatVND(item.excessAmount)}</p>}
                  </TableCell>
                  <TableCell>{handle('Xử lý')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.sepayExceptions.count > data.sepayExceptions.items.length && (
            <p className="text-xs text-muted-foreground">
              Chỉ hiện {formatNumber(data.sepayExceptions.items.length)}/{formatNumber(data.sepayExceptions.count)} giao dịch.
            </p>
          )}
        </>
      )}
    </Panel>
  )
}

export function OverpaidPanel({ data }: { data: Unreconciled }) {
  const { sorted, sort, toggle } = useSorted(
    data.overpaidOrders.items,
    { excess: (i) => i.overpaidBy, total: (i) => i.grandTotal },
    { key: 'excess', dir: 'desc' },
  )
  return (
    <Panel
      title="Đơn thu dư tiền"
      description="Khách đã trả nhiều hơn giá trị đơn"
      howTo="mở đơn, bấm Hoàn tiền dư và chọn tiền mặt hoặc chuyển khoản."
      total={formatVND(data.overpaidOrders.amount)}
    >
      {sorted.length === 0 ? (
        <AllClear text="Không có đơn nào thu dư." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đơn</TableHead>
              <SortHead label="Giá trị đơn" column="total" sort={sort} onSort={toggle} align="right" />
              <SortHead label="Thu dư" column="excess" sort={sort} onSort={toggle} align="right" />
              <TableHead className="w-0">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.orderId}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell className="text-right tabular-nums">{formatVND(item.grandTotal)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatVND(item.overpaidBy)}</TableCell>
                <TableCell>
                  <RowLink href={`/sales/orders/${item.orderId}`} label="Hoàn dư" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}

export function HeldPanel({ data }: { data: Unreconciled }) {
  const { sorted, sort, toggle } = useSorted(
    data.heldUndecided.items,
    { closed: (i) => time(i.closedAt), held: (i) => i.held },
    { key: 'closed', dir: 'asc' },
  )
  return (
    <Panel
      title="Tiền giữ treo chưa quyết định"
      description="Đơn đã trả hàng hoặc huỷ mà shop còn giữ tiền của khách"
      howTo="mở đơn và chọn hoàn lại cho khách, hoặc giữ lại (ghi vào thu nhập khác)."
      total={formatVND(data.heldUndecided.amount)}
    >
      {sorted.length === 0 ? (
        <AllClear text="Không có khoản tiền giữ treo nào." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đơn</TableHead>
              <SortHead label="Kết thúc" column="closed" sort={sort} onSort={toggle} />
              <SortHead label="Đang giữ" column="held" sort={sort} onSort={toggle} align="right" />
              <TableHead className="w-0">
                <span className="sr-only">Thao tác</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item) => (
              <TableRow key={item.orderId}>
                <TableCell>
                  <p className="font-medium">{item.code}</p>
                  <p className="text-xs text-muted-foreground">{item.status === 'CANCELLED' ? 'Đã huỷ' : 'Đã trả hàng'}</p>
                </TableCell>
                <TableCell>
                  <WhenCell iso={item.closedAt} asOf={data.asOf} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatVND(item.held)}</TableCell>
                <TableCell>
                  <RowLink href={`/sales/orders/${item.orderId}`} label="Quyết định" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  )
}
