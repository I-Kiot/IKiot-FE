'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  Calendar,
  Eye,
  TrendingUp,
  Receipt,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { payrollApi } from '@/lib/api/payroll'
import { formatVND, STATUS_MAP } from '../_constants/payroll.constants'
import { MyPayslipDetailDialog } from './_components/my-payslip-detail-dialog'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import type { Payslip } from '@/types/payroll'

const formatDMY = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export default function MyPayslipsPage() {
  const { user } = useAuthStore()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Details modal state
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const itemsPerPage = 10

  const userFullName = user?.profile
    ? `${user.profile.lastName || ''} ${user.profile.firstName || ''}`.trim()
    : user?.display_name || user?.full_name || 'Thành viên'

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setIsLoading(true)
    })
    payrollApi
      .getMyPayslips({ page: currentPage, limit: itemsPerPage })
      .then((res) => {
        if (!active) return
        setPayslips(res.data)
        setTotalCount(res.total)
        setTotalPages(res.totalPages)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        const msg = (error as Error)?.message || 'Không thể tải danh sách phiếu lương của bạn'
        toast.error(msg)
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [currentPage])

  // Calculate summary metrics
  const paidPayslips = payslips.filter((p) => p.status === 'PAID')
  const totalNet = paidPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0)
  const paidCount = paidPayslips.length
  const latestPayslip = payslips[0] // since sorted newest first

  function handleOpenDetails(slip: Payslip) {
    setSelectedPayslip(slip)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Premium Glassmorphic Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent p-6 shadow-sm backdrop-blur-md">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 size-40 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md">
                Thông tin cá nhân
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ShieldCheck className="size-3 text-green-500" /> Bảo mật 2 lớp
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-1.5">
              Xin chào, {userFullName}!
            </h1>
            <p className="text-xs text-muted-foreground">
              Tra cứu biên lai lương chi tiết và quá trình cống hiến của bạn tại chi nhánh.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 border rounded-xl shadow-xs text-center min-w-[120px]">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Quỹ lương nhận</span>
              <span className="text-sm font-bold text-primary block mt-0.5 tabular-nums">
                {formatVND(totalNet)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards with Glow Effects */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Net received */}
        <Card className="bg-white/70 dark:bg-slate-900/30 backdrop-blur-md shadow-xs border relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <TrendingUp className="size-24 text-emerald-500" />
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tổng thực nhận (Trang này)
            </CardTitle>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
              <Wallet className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">
              {formatVND(totalNet)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Tổng số tiền lương thực lãnh chuyển khoản trong trang hiện tại.
            </p>
          </CardContent>
        </Card>

        {/* Total Periods count */}
        <Card className="bg-white/70 dark:bg-slate-900/30 backdrop-blur-md shadow-xs border relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Receipt className="size-24 text-blue-500" />
          </div>
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 to-indigo-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Số kỳ lương đã nhận
            </CardTitle>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <Receipt className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {paidCount} kỳ lương
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Số tháng làm việc đã được ban quản trị tính lương và công bố.
            </p>
          </CardContent>
        </Card>

        {/* Latest Period Information (Digital Card Design) */}
        <Card className="relative overflow-hidden group border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md hover:-translate-y-1 transition-all duration-300">
          {/* Hologram card effect */}
          <div className="absolute -right-6 -bottom-6 size-24 rounded-full bg-violet-600/20 blur-xl group-hover:bg-violet-600/30 transition-all duration-500" />
          <div className="absolute top-4 right-4 p-1.5 bg-white/10 rounded-lg backdrop-blur-xs">
            <Sparkles className="size-4 text-amber-400" />
          </div>

          <CardHeader className="pb-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
              Phiếu lương mới nhất
            </span>
            <CardTitle className="text-md font-bold tracking-tight text-white mt-1 truncate">
              {latestPayslip
                ? `${formatDMY(latestPayslip.periodStart)} ➔ ${formatDMY(latestPayslip.periodEnd)}`
                : 'Chưa có dữ liệu'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {latestPayslip ? formatVND(latestPayslip.netSalary || 0) : '0 đ'}
            </div>
            <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/10 text-[10px] text-slate-400">
              <span>Trạng thái: {latestPayslip?.status === 'PAID' ? 'Đã nhận tiền' : 'Đã công bố'}</span>
              {latestPayslip && (
                <button
                  onClick={() => handleOpenDetails(latestPayslip)}
                  className="flex items-center gap-1 text-amber-400 hover:text-white font-bold transition-colors cursor-pointer"
                >
                  Xem nhanh <ArrowUpRight className="size-3" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payslips Table Card */}
      <Card className="bg-white/80 dark:bg-slate-900/10 backdrop-blur-md shadow-xs border overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-md font-bold text-slate-800 dark:text-slate-200">
                Lịch Sử Nhận Lương
              </CardTitle>
              <CardDescription className="text-xs">
                Danh sách chi tiết các phiếu lương đã được phê duyệt và chi trả thành công.
              </CardDescription>
            </div>
            <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Calendar className="size-4" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <span className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mb-3" />
              <p className="text-xs text-muted-foreground">Đang tải lịch sử phiếu lương bảo mật...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 border border-dashed rounded-lg my-6 bg-slate-50/30 dark:bg-slate-900/5">
              <Calendar className="size-10 text-muted-foreground mb-3" />
              <h3 className="text-sm font-semibold">Chưa có phiếu lương nào</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
                Khi quản lý phê duyệt hoặc hoàn thành chi trả lương cho kỳ, phiếu lương của bạn sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="rounded-xl border overflow-hidden shadow-xs bg-white dark:bg-slate-950/20">
                <Table>
                  <TableHeader>
                    {/* Header Row 1: Groups */}
                    <TableRow className="bg-slate-50/50 dark:bg-slate-900/40 hover:bg-transparent border-b">
                      <TableHead colSpan={1} className="font-bold text-slate-800 dark:text-slate-200">Chu kỳ lương</TableHead>
                      <TableHead colSpan={3} className="text-center font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-x border-slate-200 dark:border-slate-800">Thu nhập</TableHead>
                      <TableHead colSpan={1} className="text-center font-bold bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">Khoản cộng</TableHead>
                      <TableHead colSpan={1} className="text-center font-bold bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-r border-slate-200 dark:border-slate-800">Khoản khấu trừ</TableHead>
                      <TableHead colSpan={1} className="text-right font-bold text-slate-800 dark:text-slate-200">Thực nhận</TableHead>
                      <TableHead colSpan={1} className="text-center font-bold text-slate-800 dark:text-slate-200">Trạng thái</TableHead>
                      <TableHead colSpan={1} className="text-right font-bold text-slate-800 dark:text-slate-200 pr-4">Thao tác</TableHead>
                    </TableRow>
                    {/* Header Row 2: Sub-headers */}
                    <TableRow>
                      <TableHead className="min-w-[150px]">Thời gian</TableHead>
                      <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold border-l border-slate-200 dark:border-slate-800">Lương cơ bản</TableHead>
                      <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold">Lương ngày công</TableHead>
                      <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tăng ca</TableHead>
                      <TableHead className="text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800/90 dark:text-emerald-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tổng cộng thêm</TableHead>
                      <TableHead className="text-right bg-rose-50/50 dark:bg-rose-950/20 text-rose-800/90 dark:text-rose-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tổng giảm trừ</TableHead>
                      <TableHead className="text-right font-bold">Thực nhận</TableHead>
                      <TableHead className="text-center font-semibold">Trạng thái</TableHead>
                      <TableHead className="w-[80px] text-right pr-4">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((slip) => {
                      const statusStyle = STATUS_MAP[(slip.status || 'APPROVED') as 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAID'] || {
                        label: slip.status,
                        className: '',
                      }
                      const basePay = slip.basePay ?? slip.baseSalary ?? 0
                      const workedDays = slip.totalWorkedDays ?? slip.actualWorkingDays ?? 0
                      const standardDays = slip.standardWorkingDays ?? 26
                      const overtimePay = slip.overtimePay ?? 0
                      const paidLeaveDays = slip.paidLeaveDays ?? 0
                      const paidLeavePay = slip.paidLeavePay ?? 0
                      const unpaidLeaveDeduction = slip.unpaidLeaveDeduction ?? 0

                      const workedBasePay = Math.round((basePay / standardDays) * workedDays)
                      const earningsFromWork = workedBasePay + paidLeavePay

                      // Additions = allowancesSum + positiveAdjustments
                      const allowancesSum = (slip.allowanceLines || []).reduce((sum, a) => sum + (a.amount || 0), 0)
                      const positiveAdjustments = (slip.manualAdjustments || []).filter(a => a.amount > 0).reduce((sum, a) => sum + a.amount, 0)
                      const totalAdditions = allowancesSum + positiveAdjustments

                      // Deductions = latePenalty + unpaidLeaveDeduction + otherDeductionLines + negativeAdjustments
                      const latePenalty = (slip.deductionLines || [])
                        .filter((d) => d.deductionType === 'LATE')
                        .reduce((sum, d) => sum + (d.amount || 0), 0) || (slip.latePenalty ?? 0)
                      const otherDeductionLines = (slip.deductionLines || [])
                        .filter((d) => d.deductionType !== 'LATE')
                        .reduce((sum, d) => sum + (d.amount || 0), 0)
                      const negativeAdjustments = Math.abs((slip.manualAdjustments || []).filter(a => a.amount < 0).reduce((sum, a) => sum + a.amount, 0))
                      const totalDeductions = latePenalty + unpaidLeaveDeduction + otherDeductionLines + negativeAdjustments

                      return (
                        <TableRow
                          key={slip.id}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors group cursor-pointer border-b"
                          onClick={() => handleOpenDetails(slip)}
                        >
                          <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                            <div>{formatDMY(slip.periodStart)} ➔ {formatDMY(slip.periodEnd)}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Làm {workedDays}/{standardDays} ngày (Phép: {paidLeaveDays})
                            </div>
                          </TableCell>
                          <TableCell className="text-right bg-blue-50/30 dark:bg-blue-950/15 border-l border-slate-200 dark:border-slate-800 tabular-nums text-slate-600 dark:text-slate-400">
                            {formatVND(basePay)}
                          </TableCell>
                          <TableCell className="text-right bg-blue-50/30 dark:bg-blue-950/15 tabular-nums text-slate-700 dark:text-slate-300 font-medium">
                            {formatVND(earningsFromWork)}
                          </TableCell>
                          <TableCell className="text-right bg-blue-50/30 dark:bg-blue-950/15 border-r border-slate-200 dark:border-slate-800 tabular-nums text-green-600 dark:text-green-400">
                            {overtimePay > 0 ? `+${formatVND(overtimePay)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right bg-emerald-50/30 dark:bg-emerald-950/15 border-r border-slate-200 dark:border-slate-800 tabular-nums text-green-600 dark:text-green-400 font-semibold">
                            {totalAdditions > 0 ? `+${formatVND(totalAdditions)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right bg-rose-50/30 dark:bg-rose-950/15 border-r border-slate-200 dark:border-slate-800 tabular-nums text-red-600 dark:text-red-400 font-semibold">
                            {totalDeductions > 0 ? `-${formatVND(totalDeductions)}` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-800 dark:text-slate-100 tabular-nums text-base">
                            {formatVND(slip.netSalary)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`${statusStyle.className} border font-medium px-2.5 py-0.5 rounded-full text-[10px]`}>
                              {statusStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDetails(slip)}
                              className="h-8 w-8 text-slate-400 hover:text-primary group-hover:scale-110 transition-transform cursor-pointer"
                              title="Xem chi tiết biên lai"
                            >
                              <Eye className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <div className="text-[11px] text-muted-foreground mr-4">
                    Trang {currentPage} / {totalPages} (Tổng {totalCount} phiếu)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 cursor-pointer text-xs"
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 cursor-pointer text-xs"
                  >
                    Sau
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details modal */}
      <MyPayslipDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        payslip={selectedPayslip}
      />
    </div>
  )
}
