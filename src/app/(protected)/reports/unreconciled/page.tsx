// [Page – Đối soát tiền] Tình trạng tại thời điểm xem (không theo kỳ): tiền còn nằm ngoài sổ két / ngân hàng, cần người xử lý.
'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { JournalGapNotice } from '@/components/journal-gap-notice'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { allows } from '@/components/sidebar/constants/role-permissions'
import { useAuth } from '@/store/hooks/use-auth'
import { useAuthStore } from '@/store/auth-store'
import { locationFilter } from '@/lib/location-key'
import { statsApi } from '@/lib/api/stats'
import { SEPAY_OUTCOME_LABELS, SEPAY_REJECT_REASON_LABELS } from '@/types/sepay-transaction'
import { categoryLabel, formatNumber, formatVND, negativeClass } from '@/lib/stats-format'
import { useAsyncData } from '../../dashboard/hooks/use-async-data'

const formatDateTime = (iso: string | null) =>
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

function Section({
  title,
  description,
  total,
  children,
}: {
  title: string
  description: string
  total?: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {total && <p className="shrink-0 text-lg font-semibold tabular-nums">{total}</p>}
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  )
}

const Empty = ({ text }: { text: string }) => <p className="py-2 text-sm text-muted-foreground">{text}</p>

export default function UnreconciledPage() {
  const { user } = useAuth()
  const canSeeSepay = allows(user?.role, 'cash_flows', 'read')
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)
  const place = branchId ?? warehouseId
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(() => statsApi.getUnreconciled({ branchId: place }), [place])
  const { data, isLoading, failed } = useAsyncData(load, reloadKey)

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Báo cáo', href: '/reports' },
          { label: 'Đối soát tiền' },
        ]}
        title="Đối soát tiền"
        description={
          data
            ? `Tình trạng lúc ${formatDateTime(data.asOf)}${data.scope === 'BRANCH' ? ' · chỉ chi nhánh đang chọn' : ' · toàn cửa hàng'}`
            : 'Tiền còn nằm ngoài sổ két và ngân hàng, cần người xử lý'
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      {!data && isLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}
      {failed && <Card className="p-6 text-sm text-muted-foreground">Không tải được số liệu đối soát. Bấm làm mới để thử lại.</Card>}

      {data && (
        <div className={`space-y-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
          <JournalGapNotice
            ordersWithoutJournal={data.journalCoverage.ordersWithoutJournal}
            firstJournalAt={data.journalCoverage.firstJournalAt}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Section
              title="Tiền mặt shipper đang giữ"
              description="Khách đã trả tiền mặt cho shipper nhưng chưa nộp về, chưa vào két hay quỹ nào"
              total={formatVND(data.shipperCash.amount)}
            >
              {data.shipperCash.items.length === 0 ? (
                <Empty text="Không có khoản nào đang chờ nộp." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shipper</TableHead>
                      <TableHead className="text-right">Số đơn</TableHead>
                      <TableHead>Cũ nhất</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.shipperCash.items.map((item, index) => (
                      <TableRow key={item.collectorId ?? index}>
                        <TableCell>{item.collectorName ?? 'Không rõ'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(item.orderCount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(item.oldestPaidAt)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatVND(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section
              title="Giao dịch SePay chưa xử lý"
              description="Chuyển thiếu, bị từ chối, không gắn được đơn hoặc trả dư mà chưa có người xử lý"
              total={`${formatNumber(data.sepayExceptions.count)} dòng · ${formatVND(data.sepayExceptions.amount)}`}
            >
              {data.sepayExceptions.excessAmount > 0 && (
                <p className="text-xs text-muted-foreground">Trong đó trả dư: {formatVND(data.sepayExceptions.excessAmount)}</p>
              )}
              {data.sepayExceptions.items.length === 0 ? (
                <Empty text="Không có giao dịch nào cần xử lý." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Đơn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sepayExceptions.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="warning">{SEPAY_OUTCOME_LABELS[item.outcome as keyof typeof SEPAY_OUTCOME_LABELS] ?? item.outcome}</Badge>
                          {item.rejectReason && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {SEPAY_REJECT_REASON_LABELS[item.rejectReason as keyof typeof SEPAY_REJECT_REASON_LABELS] ?? item.rejectReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.orderId ? (
                            <Link href={`/sales/orders/${item.orderId}`} className="text-primary hover:underline">
                              {item.orderCode ?? 'Xem đơn'}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatVND(item.amount)}
                          {item.excessAmount > 0 && <p className="text-xs text-muted-foreground">dư {formatVND(item.excessAmount)}</p>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {data.sepayExceptions.count > data.sepayExceptions.items.length && (
                <p className="text-xs text-muted-foreground">Chỉ hiện {data.sepayExceptions.items.length} dòng đầu.</p>
              )}
              {canSeeSepay && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/cashflow/sepay">Mở danh sách giao dịch SePay để xử lý</Link>
                </Button>
              )}
            </Section>

            <Section
              title="Đơn thu dư tiền"
              description="Khách đã trả nhiều hơn giá trị đơn - cần hoàn phần dư"
              total={`${formatNumber(data.overpaidOrders.count)} đơn · ${formatVND(data.overpaidOrders.amount)}`}
            >
              {data.overpaidOrders.items.length === 0 ? (
                <Empty text="Không có đơn nào thu dư." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Đơn</TableHead>
                      <TableHead className="text-right">Giá trị đơn</TableHead>
                      <TableHead className="text-right">Thu dư</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.overpaidOrders.items.map((item) => (
                      <TableRow key={item.orderId}>
                        <TableCell>
                          <Link href={`/sales/orders/${item.orderId}`} className="font-medium text-primary hover:underline">
                            {item.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatVND(item.grandTotal)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatVND(item.overpaidBy)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section
              title="Tiền giữ treo chưa quyết định"
              description="Đơn đã trả hàng / huỷ mà shop còn giữ tiền của khách - mở đơn để hoàn lại hoặc giữ lại (ghi thu nhập khác)"
              total={`${formatNumber(data.heldUndecided.count)} đơn · ${formatVND(data.heldUndecided.amount)}`}
            >
              {data.heldUndecided.items.length === 0 ? (
                <Empty text="Không có khoản tiền giữ treo nào." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Đơn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Kết thúc lúc</TableHead>
                      <TableHead className="text-right">Tiền đang giữ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.heldUndecided.items.map((item) => (
                      <TableRow key={item.orderId}>
                        <TableCell>
                          <Link href={`/sales/orders/${item.orderId}`} className="font-medium text-primary hover:underline">
                            {item.code}
                          </Link>
                        </TableCell>
                        <TableCell>{item.status === 'CANCELLED' ? 'Đã huỷ' : 'Đã trả hàng'}</TableCell>
                        <TableCell>{formatDateTime(item.closedAt)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatVND(item.held)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            {data.unallocatedBank && (
              <Section
                title="Tiền về ngân hàng chưa gắn đơn"
                description="Tiền khách chuyển khoản vào tài khoản của shop nhưng chưa gắn được đơn nào (đã trừ phần hoàn)"
                total={formatVND(data.unallocatedBank.net)}
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Tiền về</p>
                    <p className="font-semibold tabular-nums">{formatVND(data.unallocatedBank.receipts)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Đã hoàn</p>
                    <p className="font-semibold tabular-nums">{formatVND(data.unallocatedBank.refunds)}</p>
                  </div>
                </div>
              </Section>
            )}

            <Section
              title="Quỹ chủ"
              description="Tiền shipper nộp thẳng cho chủ và khoản chi tiền mặt trả nhà cung cấp - không đi qua két chi nhánh"
              total={formatVND(data.ownerFund.balance)}
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Tiền vào</p>
                  <p className="font-semibold tabular-nums text-green-600">{formatVND(data.ownerFund.income)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Tiền ra</p>
                  <p className="font-semibold tabular-nums text-red-600">{formatVND(data.ownerFund.expense)}</p>
                </div>
              </div>
              {data.ownerFund.byCategory.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {data.ownerFund.byCategory.map((row) => (
                    <li key={`${row.category}-${row.flowType}`} className="flex justify-between gap-3">
                      <span>
                        {categoryLabel(row.category)} <span className="text-xs text-muted-foreground">({row.count})</span>
                      </span>
                      <span className={`tabular-nums ${row.flowType === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {row.flowType === 'INCOME' ? '+' : '−'}
                        {formatVND(row.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section
              title="Tiền mặt tại quầy kho"
              description="Khách tới kho nhận hàng và trả tiền mặt tại quầy. Kho không có két nên khoản này không nằm trong đối soát két nào"
              total={formatVND(data.warehouseCounterCash.net)}
            >
              {data.warehouseCounterCash.items.length === 0 ? (
                <Empty text="Chưa có tiền mặt thu tại quầy kho." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kho</TableHead>
                      <TableHead className="text-right">Thu</TableHead>
                      <TableHead className="text-right">Chi</TableHead>
                      <TableHead className="text-right">Ròng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.warehouseCounterCash.items.map((item) => (
                      <TableRow key={item.locationId}>
                        <TableCell>{item.locationName ?? 'Kho'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatVND(item.income)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatVND(item.expense)}</TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${negativeClass(item.net)}`}>{formatVND(item.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>

            <Section
              title="Hoàn tiền mặt trừ vào két chi nhánh"
              description="Đơn thu tiền qua shipper hoặc quầy kho nhưng hoàn bằng tiền mặt từ két chi nhánh: két sẽ hụt đúng bằng số này khi đối soát"
              total={`${formatNumber(data.cashRefundsAgainstDrawer.count)} lần · ${formatVND(data.cashRefundsAgainstDrawer.amount)}`}
            >
              {data.cashRefundsAgainstDrawer.items.length === 0 ? (
                <Empty text="Không có khoản hoàn nào như vậy." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nơi đặt két</TableHead>
                      <TableHead className="text-right">Số lần</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cashRefundsAgainstDrawer.items.map((item) => (
                      <TableRow key={item.locationId}>
                        <TableCell>{item.locationName ?? 'Chi nhánh'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(item.count)}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatVND(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Section>
          </div>
        </div>
      )}
    </div>
  )
}
