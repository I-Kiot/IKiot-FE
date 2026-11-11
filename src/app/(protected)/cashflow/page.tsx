// [Page – Sổ thu chi (cashflow list)]
'use client'

import { PageHeader } from '@/components/page-header'
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  formatVND,
  PAYMENT_METHOD_LABELS,
} from '@/lib/stats-format'
import {
  useCashflow,
  type CashflowRange,
  type FlowTypeFilter,
  type FlowPrefixFilter,
  type CategoryFilter,
  type FundFilter,
} from './_hooks/use-cashflow'

const RANGE_LABELS: Record<CashflowRange, string> = {
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
  '90d': '90 ngày qua',
  '12m': '12 tháng qua',
}

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

export default function CashflowPage() {
  const { user } = useAuth()
  const canSeeSepay = allows(user?.role, 'cash_flows', 'read')
  const {
    summary,
    list,
    isLoading,
    range,
    setRange,
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
  } = useCashflow()

  const rows = list?.data ?? []
  const pagination = list?.pagination

  return (
    <div className="flex-1 space-y-6 px-6 pt-0">
      <PageHeader
        breadcrumbs={[{ label: 'Trang chủ', href: '/dashboard' }, { label: 'Sổ thu chi' }]}
        title="Sổ thu chi"
        description="Danh sách chi tiết các khoản tiền vào và tiền ra"
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
            <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tiền vào</CardTitle>
            <ArrowDownLeft className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatVND(summary?.income ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tiền ra</CardTitle>
            <ArrowUpRight className="size-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatVND(summary?.expense ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Số dư ròng</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                (summary?.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatVND(summary?.net ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={range} onValueChange={(v) => setRange(v as CashflowRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABELS) as CashflowRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Theo quỹ</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quỹ</TableHead>
                    <TableHead className="text-right">Tiền vào</TableHead>
                    <TableHead className="text-right">Tiền ra</TableHead>
                    <TableHead className="text-right">Ròng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(summary?.byFund ?? []).map((row) => (
                    <TableRow key={row.fund}>
                      <TableCell>
                        <Badge variant="secondary">{fundLabel(row.fund)}</Badge>
                        <span className="ml-2 text-xs text-muted-foreground">{row.count} giao dịch</span>
                      </TableCell>
                      <TableCell className="text-right text-green-600">{formatVND(row.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatVND(row.expense)}</TableCell>
                      <TableCell className={`text-right font-semibold ${row.net >= 0 ? '' : 'text-red-600'}`}>
                        {formatVND(row.net)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Theo hạng mục</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
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

      <Card>
        <CardContent className="p-0">
          <Table>
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
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isIncome ? 'success' : 'error'}>
                          {isIncome ? 'Tiền vào' : 'Tiền ra'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{categoryLabel(tx.category)}</TableCell>
                      <TableCell>
                        {tx.fund ? <Badge variant="secondary">{fundLabel(tx.fund)}</Badge> : '-'}
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
                          isIncome ? 'text-green-600' : 'text-red-600'
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
          </Table>
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
