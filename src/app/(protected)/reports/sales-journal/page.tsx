// [Page – Sổ doanh thu] Từng bút toán ghi nhận doanh thu: bán hàng, trả hàng, thu nhập khác. Số trên báo cáo cộng từ đây.
'use client'

import { Fragment, useCallback, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataTableEmpty } from '@/components/data-table/data-table-empty'
import { DataTableLoading } from '@/components/data-table/data-table-loading'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { locationFilter } from '@/lib/location-key'
import { statsApi, type SalesJournalEntryType } from '@/lib/api/stats'
import {
  formatDayVi,
  formatNumber,
  formatVND,
  JOURNAL_ENTRY_TYPE_LABELS,
  JOURNAL_SOURCE_LABELS,
  negativeClass,
} from '@/lib/stats-format'
import { useAuthStore } from '@/store/auth-store'
import { useAsyncData } from '../../dashboard/hooks/use-async-data'
import { RANGE_OPTIONS, resolveDashboardRange, type DashboardRange } from '../hooks/use-dashboard-stats'

type TypeFilter = 'ALL' | SalesJournalEntryType

const TYPE_VARIANT: Record<SalesJournalEntryType, 'success' | 'error' | 'secondary'> = {
  SALE: 'success',
  RETURN: 'error',
  OTHER_INCOME: 'secondary',
}

const DEFAULT_PAGE_SIZE = 20

export default function SalesJournalPage() {
  const locationKey = useAuthStore((state) => state.locationKey)
  const { branchId, warehouseId } = locationFilter(locationKey)
  const place = branchId ?? warehouseId

  const [range, setRangeState] = useState<DashboardRange>('30d')
  const [entryType, setEntryTypeState] = useState<TypeFilter>('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE)
  const [reloadKey, setReloadKey] = useState(0)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Đổi bộ lọc bất kỳ sẽ về trang đầu.
  const setRange = (value: DashboardRange) => {
    setRangeState(value)
    setPage(1)
  }
  const setEntryType = (value: TypeFilter) => {
    setEntryTypeState(value)
    setPage(1)
  }
  const setPageSize = (value: number) => {
    setPageSizeState(value)
    setPage(1)
  }

  const load = useCallback(() => {
    const { fromDate, toDate } = resolveDashboardRange(range)
    return statsApi.getSalesJournal({
      fromDate,
      toDate,
      branchId: place,
      entryType: entryType === 'ALL' ? undefined : entryType,
      page,
      limit: pageSize,
    })
  }, [range, entryType, place, page, pageSize])
  const { data: list, isLoading, failed } = useAsyncData(load, reloadKey)

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const rows = list?.data ?? []
  const totals = list?.totals
  const pagination = list?.pagination

  const summary: { label: string; value: number; hint?: string }[] = [
    { label: 'Doanh thu thuần', value: totals?.totalAmount ?? 0, hint: 'Tiền hàng + phí vận chuyển + thu nhập khác, đã trừ trả hàng' },
    { label: 'Tiền hàng', value: totals?.goodsAmount ?? 0 },
    { label: 'Phí vận chuyển thu khách', value: totals?.shippingAmount ?? 0 },
    { label: 'Thu nhập khác', value: totals?.otherIncomeAmount ?? 0, hint: 'Tiền giữ lại khi huỷ hoặc trả hàng' },
    { label: 'Giá vốn', value: totals?.cogsAmount ?? 0 },
    { label: 'Phí vận chuyển thực', value: totals?.shippingCost ?? 0 },
    { label: 'Phí sàn', value: totals?.channelFee ?? 0 },
  ]

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Báo cáo', href: '/reports' },
          { label: 'Sổ doanh thu' },
        ]}
        title="Sổ doanh thu"
        description="Doanh thu ghi theo ngày đơn hoàn thành; hàng trả ghi âm vào ngày trả. Đơn cũ trước khi có sổ không nằm ở đây"
        actions={
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {summary.map((item) => (
          <Card key={item.label} className="gap-1 px-4 py-3" title={item.hint}>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p className={`truncate text-lg font-semibold tabular-nums ${negativeClass(item.value)}`}>{formatVND(item.value)}</p>
          </Card>
        ))}
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">Tổng cộng trên toàn bộ bộ lọc, không chỉ trang đang xem.</p>

      <div className="flex flex-wrap gap-3">
        <Select value={range} onValueChange={(v) => setRange(v as DashboardRange)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={entryType} onValueChange={(v) => setEntryType(v as TypeFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            {Object.entries(JOURNAL_ENTRY_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Ngày</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Chi nhánh</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead className="text-right">Tiền hàng</TableHead>
                <TableHead className="text-right">Vận chuyển</TableHead>
                <TableHead className="text-right">Thu nhập khác</TableHead>
                <TableHead className="text-right">Tổng</TableHead>
                <TableHead className="text-right">Giá vốn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 && <DataTableLoading columnCount={11} />}
              {failed && (
                <TableRow>
                  <TableCell colSpan={11} className="py-8 text-center text-sm text-muted-foreground">
                    Không tải được sổ doanh thu. Bấm làm mới để thử lại.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !failed && rows.length === 0 && <DataTableEmpty columnCount={11} />}
              {rows.map((entry) => {
                const open = expanded.has(entry.id)
                return (
                  <Fragment key={entry.id}>
                    <TableRow className="cursor-pointer" onClick={() => toggle(entry.id)}>
                      <TableCell>
                        {entry.lines.length > 0 &&
                          (open ? (
                            <ChevronDown className="size-4" aria-label="Thu gọn" />
                          ) : (
                            <ChevronRight className="size-4" aria-label="Xem dòng hàng" />
                          ))}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDayVi(entry.businessDate)}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_VARIANT[entry.entryType] ?? 'secondary'}>
                          {JOURNAL_ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Link href={`/sales/orders/${entry.orderId}`} className="font-medium text-primary hover:underline">
                          {entry.orderCode ?? 'Xem đơn'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">{entry.branchName ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {JOURNAL_SOURCE_LABELS[entry.source] ?? entry.source}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${negativeClass(entry.goodsAmount)}`}>
                        {formatVND(entry.goodsAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(entry.shippingAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatVND(entry.otherIncomeAmount)}</TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums ${negativeClass(entry.totalAmount)}`}>
                        {formatVND(entry.totalAmount)}
                      </TableCell>
                      <TableCell className={`text-right tabular-nums ${negativeClass(entry.cogsAmount)}`}>
                        {formatVND(entry.cogsAmount)}
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell />
                        <TableCell colSpan={10} className="py-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">Số lượng</TableHead>
                                <TableHead className="text-right">Thành tiền</TableHead>
                                <TableHead className="text-right">Giá vốn</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell>{line.productName ?? '-'}</TableCell>
                                  <TableCell className="text-muted-foreground">{line.sku ?? '-'}</TableCell>
                                  <TableCell className={`text-right tabular-nums ${negativeClass(line.quantity)}`}>
                                    {formatNumber(line.quantity)}
                                  </TableCell>
                                  <TableCell className={`text-right tabular-nums ${negativeClass(line.amount)}`}>
                                    {formatVND(line.amount)}
                                  </TableCell>
                                  <TableCell className={`text-right tabular-nums ${negativeClass(line.cogs)}`}>
                                    {formatVND(line.cogs)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {(entry.shippingCost > 0 || entry.channelFee > 0) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Chi phí của đơn: vận chuyển thực {formatVND(entry.shippingCost)} · phí sàn {formatVND(entry.channelFee)}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DataTablePagination
        page={page}
        pageCount={pagination?.totalPages ?? 1}
        pageSize={pageSize}
        total={pagination?.total ?? 0}
        unit="bút toán"
        disabled={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
