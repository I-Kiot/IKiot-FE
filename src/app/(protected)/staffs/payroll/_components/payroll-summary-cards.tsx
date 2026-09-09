'use client'

import { CreditCard, Landmark, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePayroll } from '../_context/payroll-provider'
import { formatVND } from '../_constants/payroll.constants'

export function PayrollSummaryCards() {
  const { periods } = usePayroll()

  // Calculate sum metrics
  const totalPaid = periods
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.totalCost || 0), 0)

  const totalPendingApprove = periods
    .filter((p) => p.status === 'REVIEW')
    .reduce((sum, p) => sum + (p.totalCost || 0), 0)

  const draftPeriodsCount = periods.filter((p) => p.status === 'DRAFT').length
  const latestPeriod = periods[0] // Since periods are sorted newest first

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Paid Card */}
      <Card className="bg-white dark:bg-slate-900/10 shadow-xs border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Landmark className="size-24 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Đã thanh toán
          </CardTitle>
          <Landmark className="size-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {formatVND(totalPaid)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tổng ngân sách đã chi cho tất cả các kỳ lương.
          </p>
        </CardContent>
      </Card>

      {/* Pending Review Card */}
      <Card className="bg-white dark:bg-slate-900/10 shadow-xs border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <Receipt className="size-24 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chờ phê duyệt (Kỳ này)
          </CardTitle>
          <Receipt className="size-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {formatVND(totalPendingApprove)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Các kỳ lương đang trong trạng thái chờ quản lý duyệt.
          </p>
        </CardContent>
      </Card>

      {/* Latest Period Info */}
      <Card className="bg-white dark:bg-slate-900/10 shadow-xs border relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
          <CreditCard className="size-24 text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Kỳ lương nháp chưa duyệt
          </CardTitle>
          <CreditCard className="size-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {draftPeriodsCount} kỳ nháp
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {latestPeriod
              ? `Kỳ gần nhất: ${latestPeriod.periodStart} đến ${latestPeriod.periodEnd}`
              : 'Chưa có kỳ lương nháp'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
