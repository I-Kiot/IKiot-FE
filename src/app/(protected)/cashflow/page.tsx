// [Page – Sổ thu chi (cashflow list)]
'use client'

import { PageHeader } from '@/components/page-header'
import { ExportExcelButton } from '@/components/export-excel-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Suspense } from 'react'
import { ReportDateRangeFilter } from '@/components/report-date-range-filter'
import { ReportLocationSelect } from '@/components/report-location-select'
import { useReportLocation } from '@/hooks/use-report-location'
import { useReportPeriod } from '@/hooks/use-report-period'
import type { ReportPeriod } from '../reports/hooks/use-dashboard-stats'

import Link from 'next/link'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet } from 'lucide-react'
import { allows } from '@/components/sidebar/constants/role-permissions'
import { useAuth } from '@/store/hooks/use-auth'
import { DataTableEmpty } from '@/components/data-table/data-table-empty'
import { DataTableLoading } from '@/components/data-table/data-table-loading'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import {
  CASHFLOW_CATEGORY_LABELS,
  CASHFLOW_FUND_LABELS,
  categoryLabel,
  fundLabel,
  isTransferCategory,
  formatVND,
  PAYMENT_METHOD_LABELS,
} from '@/lib/stats-format'
import {
  useCashflow,
  type FlowTypeFilter,
  type FlowPrefixFilter,
  type CategoryFilter,
  type FundFilter,
} from './_hooks/use-cashflow'

const FLOW_LABELS: Record<FlowPrefixFilter, string> = {
  ALL: 'Tất cả nguồn',
  ORD: 'Bán hàng',
  SUP: 'Nhà cung cấp',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Bọc Suspense vì kỳ và nơi đọc từ URL (`useSearchParams`). */
export default function CashflowPage() {
  return (
    <Suspense fallback={null}>
      <Cashflow />
    </Suspense>
  )
}

function Cashflow() {
  const { user } = useAuth()
  const { period, setPeriod: setPeriodParam } = useReportPeriod()
  const location = useReportLocation()
  const canSeeSepay = allows(user?.role, 'cash_flows', 'read')
  const {
    summary,
    list,
    isLoading,
    flowType,
    setFlowType,
    flow,
    setFlow,
    category,
    setCategory,
    fund,
    setFund,
    page,
    setPage,
    pageSize,
    setPageSize,
    refetch,
    exportFile,
  } = useCashflow({
    fromDate: period.fromDate,
    toDate: period.toDate,
    branchId: location.branchId,
    warehouseId: location.warehouseId,
  })

  // Đổi kỳ hay nơi xem thì về trang đầu.
  const setPeriod = (value: ReportPeriod) => {
    setPeriodParam(value)
    setPage(1)
  }
  const setLocationKey = (key: string) => {
    location.setLocationKey(key)
    setPage(1)
  }

  const rows = list?.data ?? []
  const pagination = list?.pagination

  return (
    <div className="flex-1 space-y-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', href: '/dashboard' },
          { label: 'Báo cáo', href: '/reports' },
          { label: 'Sổ thu chi' },
        ]}
        title="Sổ thu chi"
        description="Tiền thực vào và ra theo ngày phát sinh, theo quỹ (két, quỹ chủ, ngân hàng); khác Sổ doanh thu ghi theo ngày đơn hoàn thành"
        actions={
          <div className="flex gap-2">
            {canSeeSepay && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/cashflow/sepay">
                  <AlertTriangle className="size-4" />
                  Giao dịch SePay cần xử lý
                </Link>
              </Button>
            )}
            <ExportExcelButton load={exportFile} filename={`so-thu-chi_${period.fromDate}_${period.toDate}.xlsx`} />
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Tiền vào</CardTitle>
            <ArrowDownLeft className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold leading-tight tabular-nums text-green-600">
              {formatVND(summary?.income ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Tiền ra</CardTitle>
            <ArrowUpRight className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold leading-tight tabular-nums text-red-600">
              {formatVND(summary?.expense ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Số dư ròng</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold leading-tight tabular-nums ${
                (summary?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatVND(summary?.net ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <ReportLocationSelect location={{ ...location, setLocationKey }} />
        <ReportDateRangeFilter period={period} onChange={setPeriod} />

        <Select value={flowType} onValueChange={(v) => setFlowType(v as FlowTypeFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại</SelectItem>
            <SelectItem value="INCOME">Tiền vào</SelectItem>
            <SelectItem value="EXPENSE">Tiền ra</SelectItem>
          </SelectContent>
        </Select>

        <Select value={flow} onValueChange={(v) => setFlow(v as FlowPrefixFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FLOW_LABELS) as FlowPrefixFilter[]).map((f) => (
              <SelectItem key={f} value={f}>
                {FLOW_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả hạng mục</SelectItem>
            {Object.entries(CASHFLOW_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fund} onValueChange={(v) => setFund(v as FundFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả quỹ</SelectItem>
            {Object.entries(CASHFLOW_FUND_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {((summary?.byFund?.length ?? 0) > 0 || (summary?.byCategory?.length ?? 0) > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0 overflow-hidden pt-4 pb-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Theo quỹ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Cột đầu / cuối thụt 24px cho thẳng với tiêu đề card. */}
              <Table className="[&>*>tr>:first-child]:pl-6 [&>*>tr>:last-child]:pr-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Quỹ</TableHead>
                    <TableHead className="text-right">Tiền vào</TableHead>
                    <TableHead className="text-right">Tiền ra</TableHead>
                    <TableHead className="text-right" title="Tiền chuyển giữa các quỹ của shop (chủ đưa vào két, rút két về chủ)">
                      Chuyển quỹ
                    </TableHead>
                    <TableHead className="text-right" title="Số dư quỹ tăng / giảm trong kỳ, tính cả chuyển quỹ">
                      Thay đổi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byFund ?? []).map((row) => (
                    <TableRow key={row.fund}>
                      <TableCell>
                        <span className="font-medium">{fundLabel(row.fund)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{row.count} giao dịch</span>
                      </TableCell>
                      <TableCell className="text-right text-green-600">{formatVND(row.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatVND(row.expense)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(() => {
                          const moved = (row.transferIn ?? 0) - (row.transferOut ?? 0)
                          if (moved === 0) return '-'
                          return `${moved > 0 ? '+' : '−'}${formatVND(Math.abs(moved))}`
                        })()}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${row.net >= 0 ? '' : 'text-red-600'}`}>
                        {formatVND(row.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="gap-0 overflow-hidden pt-4 pb-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Theo hạng mục</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Cột đầu / cuối thụt 24px cho thẳng với tiêu đề card. */}
              <Table className="[&>*>tr>:first-child]:pl-6 [&>*>tr>:last-child]:pr-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Hạng mục</TableHead>
                    <TableHead>Quỹ</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byCategory ?? []).map((row) => (
                    <TableRow key={`${row.category}-${row.fund}-${row.flowType}`}>
                      <TableCell>
                        {categoryLabel(row.category)}
                        <span className="ml-2 text-xs text-muted-foreground">{row.count} giao dịch</span>
                      </TableCell>
                      <TableCell className="text-sm">{fundLabel(row.fund)}</TableCell>
                      <TableCell
                        className={`text-right font-semibold whitespace-nowrap ${
                          row.flowType === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {row.flowType === 'INCOME' ? '+' : '−'}
                        {formatVND(row.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <CardContent className="p-0">
          {/* Khung cuộn riêng để đầu bảng và dòng Tổng luôn thấy. */}
          <div className="max-h-[70vh] overflow-auto">
          <table className="w-full caption-bottom text-sm [&>*>tr>:first-child]:pl-6 [&>*>tr>:last-child]:pr-6 [&>thead>tr>th]:sticky [&>thead>tr>th]:top-0 [&>thead>tr>th]:z-20 [&>thead>tr>th]:border-b [&>thead>tr>th]:bg-muted">
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Hạng mục</TableHead>
                <TableHead>Quỹ</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Mã tham chiếu</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 && <DataTableLoading columnCount={9} />}
              {!isLoading && rows.length === 0 && <DataTableEmpty columnCount={9} />}
              {rows.length > 0 && (
                rows.map((tx) => {
                  const isIncome = tx.flowType === 'INCOME'
                  // Chuyển quỹ chỉ đổi chỗ tiền, không tô màu thu / chi.
                  const isTransfer = isTransferCategory(tx.category)
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell
                        className={`font-medium ${
                          isTransfer ? 'text-muted-foreground' : isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isTransfer ? 'Chuyển quỹ' : isIncome ? 'Tiền vào' : 'Tiền ra'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{categoryLabel(tx.category)}</TableCell>
                      <TableCell>
                        {tx.fund ? fundLabel(tx.fund) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate">
                        {tx.description || tx.supplierName || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.paymentReference || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.locationName ? (
                          <span className="inline-flex items-center gap-1.5">
                            {tx.locationName}
                            {tx.locationType === 'WAREHOUSE' && (
                              <Badge variant="secondary" className="text-[10px]">
                                Kho
                              </Badge>
                            )}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {tx.paymentMethod
                          ? PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod
                          : '-'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold whitespace-nowrap ${
                          isTransfer ? 'text-muted-foreground' : isIncome ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatVND(tx.amount)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
            {summary && rows.length > 0 && (
              <TableFooter className="border-t-0 bg-transparent">
                <TableRow className="font-semibold hover:bg-transparent [&>td]:sticky [&>td]:bottom-0 [&>td]:z-20 [&>td]:h-10 [&>td]:border-t [&>td]:bg-muted [&>td]:py-0">
                  <TableCell colSpan={8}>
                    Tổng (toàn bộ lọc):{' '}
                    <span className="text-green-600">+{formatVND(summary.income)}</span>
                    {' · '}
                    <span className="text-red-600">−{formatVND(summary.expense)}</span>
                    {(summary.transferred ?? 0) > 0 && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        (không tính {formatVND(summary.transferred)} chuyển quỹ)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={`text-right whitespace-nowrap ${summary.net >= 0 ? '' : 'text-red-600'}`}>
                    {formatVND(summary.net)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </table>
          </div>
        </CardContent>
      </Card>

      {/* Luôn hiện (chân trang cố định), kể cả khi chưa có giao dịch nào. */}
      <DataTablePagination
        page={page}
        pageCount={pagination?.totalPages ?? 1}
        pageSize={pageSize}
        total={pagination?.total ?? 0}
        unit="giao dịch"
        disabled={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
