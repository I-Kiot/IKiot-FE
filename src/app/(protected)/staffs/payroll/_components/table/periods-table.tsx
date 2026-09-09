'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle2, ArrowUpRight, Ban, DollarSign, Calendar } from 'lucide-react'
import { usePayroll } from '../../_context/payroll-provider'
import { formatVND, STATUS_MAP } from '../../_constants/payroll.constants'

const formatDMY = (dateStr: string) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function PeriodsTable() {
  const {
    periods,
    setOpen,
    setCurrentRow,
    setActivePeriodId,
    fetchPeriodDetails,
    handleSubmitPeriod,
    handleApprovePeriod,
  } = usePayroll()

  if (periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-white dark:bg-slate-900/10">
        <Calendar className="size-10 text-muted-foreground mb-4" />
        <h3 className="text-md font-semibold">Chưa có kỳ lương nào được tạo</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Tạo kỳ lương mới để tổng hợp ngày công và tính lương cho nhân viên.
        </p>
      </div>
    )
  }

  async function handleViewDetails(id: string) {
    setActivePeriodId(id)
    await fetchPeriodDetails(id)
  }

  return (
    <div className="rounded-md border bg-white dark:bg-slate-900/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chu kỳ lương (Thời gian)</TableHead>
            <TableHead className="text-right">Tổng chi dự kiến</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right pr-6">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((p) => {
            const statusStyle = STATUS_MAP[p.status] || { label: p.status, className: '' }
            return (
              <TableRow key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                <TableCell className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatDMY(p.periodStart)} ➔ {formatDMY(p.periodEnd)}
                </TableCell>
                <TableCell className="text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatVND(p.totalCost || 0)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={`${statusStyle.className} border font-medium px-2 py-0.5 rounded-full`}>
                    {statusStyle.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(p.id)}
                      className="cursor-pointer h-8 text-xs flex items-center gap-1 hover:bg-slate-100 hover:text-slate-800"
                      title="Xem chi tiết"
                    >
                      <Eye className="size-3.5" />
                      Chi tiết
                    </Button>

                    {/* Contextual actions */}
                    {p.status === 'DRAFT' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSubmitPeriod(p.id)}
                        className="cursor-pointer h-8 text-xs flex items-center gap-1"
                      >
                        <ArrowUpRight className="size-3.5" />
                        Gửi duyệt
                      </Button>
                    )}

                    {p.status === 'REVIEW' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentRow(p)
                            setOpen('returnDraft')
                          }}
                          className="cursor-pointer h-8 text-xs flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50/50 hover:text-orange-700"
                        >
                          <Ban className="size-3.5" />
                          Trả nháp
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprovePeriod(p.id)}
                          className="cursor-pointer h-8 text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Phê duyệt
                        </Button>
                      </>
                    )}

                    {p.status === 'APPROVED' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setCurrentRow(p)
                          setOpen('markPaid')
                        }}
                        className="cursor-pointer h-8 text-xs flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <DollarSign className="size-3.5" />
                        Thanh toán
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
