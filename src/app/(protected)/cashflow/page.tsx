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
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw, Wallet } from 'lucide-react'
import { formatVND, PAYMENT_METHOD_LABELS } from '../dashboard/shared/format'
import {
  useCashflow,
  type CashflowRange,
  type FlowTypeFilter,
  type FlowPrefixFilter,
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
  PAYR: 'Lương',
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
    page,
    setPage,
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
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      {/* Summary cards */}
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

      {/* Filters */}
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
      </div>

      {/* Transactions table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Mã tham chiếu</TableHead>
                <TableHead>Địa điểm</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Đang tải…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Chưa có giao dịch nào trong khoảng thời gian này
                  </TableCell>
                </TableRow>
              ) : (
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
                            {tx.locationType === 'warehouse' && (
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

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {pagination.page}/{pagination.totalPages} · Tổng {pagination.total} giao dịch
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
            >
              <ChevronLeft className="size-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages || isLoading}
            >
              Sau
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
