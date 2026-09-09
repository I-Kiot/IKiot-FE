'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Edit3, CheckCircle2, ArrowUpRight, Ban, DollarSign,
  Lock, AlertCircle, Info, ChevronDown, CalendarDays, Coins, PenTool,
} from 'lucide-react'
import { usePayroll } from '../../_context/payroll-provider'
import { formatVND, STATUS_MAP } from '../../_constants/payroll.constants'
import type { Payslip, DeductionLine } from '@/types/payroll'

const formatDMY = (dateStr: string) => {
  if (!dateStr) return '-'
  try { return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr)) } catch { return dateStr }
}

export function PayslipsTable() {
  const {
    activePeriod,
    setActivePeriod,
    setActivePeriodId,
    setOpen,
    setCurrentRow,
    setCurrentPayslip,
    handleSubmitPeriod,
    handleApprovePeriod,
  } = usePayroll()

  const [expandedSlipId, setExpandedSlipId] = useState<string | null>(null)

  function handleToggleExpand(slipId: string) {
    setExpandedSlipId((prev) => (prev === slipId ? null : slipId))
  }

  if (!activePeriod) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/10 rounded-lg border">
        <span className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mb-3" />
        <p className="text-sm text-muted-foreground">Đang tải danh sách phiếu lương...</p>
      </div>
    )
  }

  const isDraft = activePeriod.status === 'DRAFT'
  const isUnderReview = activePeriod.status === 'REVIEW'
  const isApproved = activePeriod.status === 'APPROVED'
  const isPaid = activePeriod.status === 'PAID'
  const statusStyle = STATUS_MAP[activePeriod.status] || { label: activePeriod.status, className: '' }

  function handleBack() {
    setActivePeriod(null)
    setActivePeriodId(null)
  }

  function handleAdjust(slip: Payslip, e: React.MouseEvent) {
    e.stopPropagation()
    setCurrentRow(activePeriod)
    setCurrentPayslip(slip)
    // Open the detail dialog - manual adjustments are edited inline in DRAFT mode
    setOpen('viewPayslipDetail')
  }


  const payslips = activePeriod.payslips || []
  const periodStart = formatDMY(activePeriod.periodStart)
  const periodEnd = formatDMY(activePeriod.periodEnd)
  const totalCost = payslips.reduce((sum, p) => sum + p.netSalary, 0)

  // Calculations for summary footer row
  const sumBasePay = payslips.reduce((sum, s) => sum + (s.basePay ?? s.baseSalary ?? 0), 0)
  const sumWorkedBasePay = payslips.reduce((sum, s) => {
    const bp = s.basePay ?? s.baseSalary ?? 0
    const wd = s.totalWorkedDays ?? s.actualWorkingDays ?? 0
    const sd = s.standardWorkingDays ?? 26
    const paidLeavePay = s.paidLeavePay ?? 0
    const workedBasePay = Math.round((bp / sd) * wd)
    return sum + workedBasePay + paidLeavePay
  }, 0)
  const sumOvertimePay = payslips.reduce((sum, s) => sum + (s.overtimePay ?? 0), 0)

  const sumTotalAdditions = payslips.reduce((sum, s) => {
    const allowancesSum = (s.allowanceLines || []).reduce((sumA, a) => sumA + (a.amount || 0), 0)
    const positiveAdjustments = (s.manualAdjustments || []).filter(a => a.amount > 0).reduce((sumA, a) => sumA + a.amount, 0)
    return sum + allowancesSum + positiveAdjustments
  }, 0)

  const sumTotalDeductions = payslips.reduce((sum, s) => {
    const latePenalty = (s.deductionLines || []).filter(d => d.deductionType === 'LATE').reduce((sumD, d) => sumD + (d.amount || 0), 0) || (s.latePenalty ?? 0)
    const unpaidLeaveDeduction = s.unpaidLeaveDeduction ?? 0
    const otherDeductionLines = (s.deductionLines || []).filter(d => d.deductionType !== 'LATE').reduce((sumD, d) => sumD + (d.amount || 0), 0)
    const negativeAdjustments = Math.abs((s.manualAdjustments || []).filter(a => a.amount < 0).reduce((sumA, a) => sumA + a.amount, 0))
    return sum + latePenalty + unpaidLeaveDeduction + otherDeductionLines + negativeAdjustments
  }, 0)

  const sumNetSalary = payslips.reduce((sum, s) => sum + s.netSalary, 0)

  return (
    <div className="space-y-6">
      {/* Detail Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleBack} className="cursor-pointer size-8">
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Chi tiết kỳ lương: {periodStart} ➔ {periodEnd}
            </h2>
            <p className="text-xs text-muted-foreground">
              Tổng quan ngày công, làm thêm giờ và thu nhập thực tế.
            </p>
          </div>
        </div>

        {/* Action Controls - follow business rules */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${statusStyle.className} border font-medium px-3 py-1 rounded-full text-xs`}>
            {statusStyle.label}
          </Badge>

          {/* DRAFT: can submit if has at least 1 payslip */}
          {isDraft && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSubmitPeriod(activePeriod.id)}
              className="cursor-pointer"
              disabled={payslips.length === 0}
              title={payslips.length === 0 ? 'Phải có ít nhất một phiếu lương để gửi duyệt' : 'Gửi kỳ lương để phê duyệt'}
            >
              <ArrowUpRight className="mr-1.5 size-4" />
              Gửi yêu cầu duyệt
            </Button>
          )}

          {/* UNDER_REVIEW: return to draft (with reason) OR approve */}
          {isUnderReview && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentRow(activePeriod)
                  setOpen('returnDraft')
                }}
                className="cursor-pointer text-orange-600 border-orange-200 hover:bg-orange-50/50"
                title="Trả về bản nháp để sửa (bắt buộc nhập lý do)"
              >
                <Ban className="mr-1.5 size-4" />
                Trả về nháp
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleApprovePeriod(activePeriod.id)}
                className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                title="Phê duyệt - nhân viên sẽ nhận thông báo và xem được phiếu lương"
              >
                <CheckCircle2 className="mr-1.5 size-4" />
                Phê duyệt lương
              </Button>
            </>
          )}

          {/* APPROVED: mark as paid */}
          {isApproved && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setCurrentRow(activePeriod)
                setOpen('markPaid')
              }}
              className="cursor-pointer bg-green-600 hover:bg-green-700 text-white"
            >
              <DollarSign className="mr-1.5 size-4" />
              Xác nhận thanh toán
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner - context-aware hints */}
      {isDraft && (
        <div className="flex items-start gap-2 text-xs bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 rounded-lg px-3 py-2.5 text-blue-700 dark:text-blue-400">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Kỳ lương đang ở <strong>Bản nháp</strong>. Bấm vào biểu tượng <Edit3 className="inline size-3.5 text-primary mx-0.5" /> hoặc bấm thẳng vào dòng để thêm/sửa điều chỉnh thủ công và ghi chú cho từng phiếu lương. Nhân viên chưa xem được phiếu lương ở bước này.
          </span>
        </div>
      )}
      {isUnderReview && (
        <div className="flex items-start gap-2 text-xs bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/20 rounded-lg px-3 py-2.5 text-orange-700 dark:text-orange-400">
          <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Kỳ lương đang <strong>Chờ duyệt</strong>. Không thể sửa phiếu lương. Nếu cần chỉnh sửa, hãy bấm <strong>&quot;Trả về nháp&quot;</strong> (cần nhập lý do). Nhân viên chưa xem được phiếu lương ở bước này.
          </span>
        </div>
      )}
      {isApproved && (
        <div className="flex items-start gap-2 text-xs bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/20 rounded-lg px-3 py-2.5 text-blue-700 dark:text-blue-400">
          <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Kỳ lương đã <strong>Được duyệt</strong>. Nhân viên đã nhận thông báo và có thể xem phiếu lương của mình. Xác nhận thanh toán khi đã chuyển lương.
          </span>
        </div>
      )}
      {isPaid && (
        <div className="flex items-start gap-2 text-xs bg-green-50/60 dark:bg-green-950/20 border border-green-100 dark:border-green-900/20 rounded-lg px-3 py-2.5 text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Kỳ lương đã <strong>Thanh toán xong</strong>. Không thể thực hiện thêm hành động nào.
          </span>
        </div>
      )}

      {/* Summary Financial Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-900/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tổng chi phí thực nhận (Net)
          </p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 tabular-nums">
            {formatVND(totalCost)}
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-900/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Số lượng phiếu lương
          </p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {payslips.length} nhân viên
          </p>
        </div>
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-900/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Thời điểm tổng hợp
          </p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2.5">
            {activePeriod.createdAt ? new Date(activePeriod.createdAt).toLocaleString('vi-VN') : '-'}
          </p>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="rounded-md border bg-white dark:bg-slate-900/10 overflow-hidden">
        <Table>
          <TableHeader>
            {/* Header Row 1: Groups */}
            <TableRow className="bg-slate-50/50 dark:bg-slate-900/40 hover:bg-transparent border-b">
              <TableHead colSpan={1} className="font-bold text-slate-800 dark:text-slate-200">Thông tin nhân sự</TableHead>
              <TableHead colSpan={3} className="text-center font-bold bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-x border-slate-200 dark:border-slate-800">Thu nhập</TableHead>
              <TableHead colSpan={1} className="text-center font-bold bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-r border-slate-200 dark:border-slate-800">Khoản cộng</TableHead>
              <TableHead colSpan={1} className="text-center font-bold bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-r border-slate-200 dark:border-slate-800">Khoản khấu trừ</TableHead>
              <TableHead colSpan={1} className="text-right font-bold text-slate-800 dark:text-slate-200">Thực nhận</TableHead>
              <TableHead colSpan={1} className="text-right font-bold text-slate-800 dark:text-slate-200 pr-4">Thao tác</TableHead>
            </TableRow>
            {/* Header Row 2: Sub-headers */}
            <TableRow>
              <TableHead className="min-w-[150px]">Họ và tên</TableHead>
              <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold border-l border-slate-200 dark:border-slate-800">Lương cơ bản</TableHead>
              <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold">Lương ngày công</TableHead>
              <TableHead className="text-right bg-blue-50/50 dark:bg-blue-950/20 text-blue-800/90 dark:text-blue-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tăng ca</TableHead>
              <TableHead className="text-right bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800/90 dark:text-emerald-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tổng cộng thêm</TableHead>
              <TableHead className="text-right bg-rose-50/50 dark:bg-rose-950/20 text-rose-800/90 dark:text-rose-200/90 font-semibold border-r border-slate-200 dark:border-slate-800">Tổng giảm trừ</TableHead>
              <TableHead className="text-right font-bold">Thực nhận</TableHead>
              <TableHead className="w-[80px] text-right pr-4">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.map((slip: Payslip) => {
              const name = slip.userId?.profile
                ? `${slip.userId.profile.lastName} ${slip.userId.profile.firstName}`
                : slip.userId?.phoneNumber || 'Nhân viên'
              const phone = slip.userId?.phoneNumber || ''

              const basePay = slip.basePay ?? slip.baseSalary ?? 0
              const workedDays = slip.totalWorkedDays ?? slip.actualWorkingDays ?? 0
              const standardDays = slip.standardWorkingDays ?? 26
              const overtimePay = slip.overtimePay ?? 0
              const paidLeaveDays = slip.paidLeaveDays ?? 0
              const unpaidLeaveDays = slip.unpaidLeaveDays ?? 0
              const paidLeavePay = slip.paidLeavePay ?? 0
              const unpaidLeaveDeduction = slip.unpaidLeaveDeduction ?? 0
              const workedHours = slip.totalWorkedHours ?? slip.actualWorkingHours ?? 0
              const overtimeHours = slip.overtimeHours ?? 0
              const lateMinutes = slip.lateMinutes ?? 0
              const allowanceLines = slip.allowanceLines || []
              const deductionLines = slip.deductionLines || []

              const workedBasePay = Math.round((basePay / standardDays) * workedDays)
              const earningsFromWork = workedBasePay + paidLeavePay

              // Additions = allowancesSum + positiveAdjustments
              const allowancesSum = (slip.allowanceLines || []).reduce((sum, a) => sum + (a.amount || 0), 0)
              const positiveAdjustments = (slip.manualAdjustments || []).filter(a => a.amount > 0).reduce((sum, a) => sum + a.amount, 0)
              const totalAdditions = allowancesSum + positiveAdjustments

              // Deductions = latePenalty + unpaidLeaveDeduction + otherDeductionLines + negativeAdjustments
              const latePenalty = (slip.deductionLines || [])
                .filter((d: DeductionLine) => d.deductionType === 'LATE')
                .reduce((sum: number, d: DeductionLine) => sum + (d.amount || 0), 0) || (slip.latePenalty ?? 0)
              const otherDeductionLines = (slip.deductionLines || [])
                .filter((d: DeductionLine) => d.deductionType !== 'LATE')
                .reduce((sum: number, d: DeductionLine) => sum + (d.amount || 0), 0)
              const negativeAdjustments = Math.abs((slip.manualAdjustments || []).filter(a => a.amount < 0).reduce((sum, a) => sum + a.amount, 0))
              const totalDeductions = latePenalty + unpaidLeaveDeduction + otherDeductionLines + negativeAdjustments

              const isExpanded = expandedSlipId === slip.id

              return (
                <React.Fragment key={slip.id}>
                  <TableRow
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 align-middle cursor-pointer transition-colors border-b ${isExpanded ? 'bg-slate-50/60 dark:bg-slate-900/20' : ''
                      }`}
                    onClick={() => handleToggleExpand(slip.id)}
                  >
                    <TableCell>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{name}</div>
                      <div className="text-xs text-muted-foreground">{phone}</div>
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
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Edit only in DRAFT */}
                        {isDraft && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={(e) => handleAdjust(slip, e)}
                            title="Thêm/sửa điều chỉnh (chỉ khi Bản nháp)"
                          >
                            <Edit3 className="size-4" />
                          </Button>
                        )}

                        {/* Lock icon when editing not allowed */}
                        {!isDraft && !isPaid && (
                          <span title="Không thể sửa phiếu lương khi kỳ không còn ở trạng thái Bản nháp">
                            <Lock className="size-3.5 text-muted-foreground/40 mr-1" />
                          </span>
                        )}

                        {/* Expand Chevron */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          onClick={() => handleToggleExpand(slip.id)}
                          title="Xem chi tiết"
                        >
                          <ChevronDown className={`size-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-slate-50/20 dark:bg-slate-900/5 hover:bg-transparent">
                      <TableCell colSpan={8} className="p-0 border-t-0">
                        <div className="px-6 py-5 border-y border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 animate-in slide-in-from-top-2 duration-300">
                          {/* Inner container */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px] text-slate-700 dark:text-slate-300">
                            {/* Col 1: Time & Work Details */}
                            <div className="space-y-2 border-r border-slate-200/60 dark:border-slate-800/60 pr-4">
                              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <CalendarDays className="size-3.5 text-primary" />
                                Ngày công & Giờ làm
                              </span>
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Ngày công chuẩn:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{standardDays} ngày</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Đi làm thực tế:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{workedDays} ngày</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Giờ công tích lũy:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{workedHours} giờ</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Tăng ca (OT):</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{overtimeHours} giờ</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Đi muộn/về sớm:</span>
                                  <span className={`font-semibold ${lateMinutes > 0 ? 'text-red-500' : ''}`}>{lateMinutes} phút</span>
                                </div>
                              </div>
                            </div>

                            {/* Col 2: Allowances Break-down */}
                            <div className="space-y-2 border-r border-slate-200/60 dark:border-slate-800/60 pr-4">
                              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                <Coins className="size-3.5 text-blue-500" />
                                Lương & Phụ cấp
                              </span>
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Lương ngày công:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {formatVND(Math.round((basePay / standardDays) * workedDays))}
                                  </span>
                                </div>
                                {overtimePay > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lương làm thêm:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(overtimePay)}</span>
                                  </div>
                                )}
                                {paidLeaveDays > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phép hưởng lương:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(paidLeavePay)}</span>
                                  </div>
                                )}
                                {allowanceLines.map((line, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span className="text-muted-foreground truncate max-w-[120px]" title={line.name}>{line.name}:</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(line.amount)}</span>
                                  </div>
                                ))}
                                {allowanceLines.length === 0 && !overtimePay && !paidLeavePay && (
                                  <span className="text-slate-400 italic block pt-1 text-[12px]">Không có phụ cấp phụ thêm.</span>
                                )}
                              </div>
                            </div>

                            {/* Col 3: Deductions & Penalties */}
                            <div className="space-y-2 border-r border-slate-200/60 dark:border-slate-800/60 pr-4">
                              <span className="text-[12px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Ban className="size-3.5 text-red-500" />
                                Khấu trừ & Phạt
                              </span>
                              <div className="space-y-1.5 pt-1">
                                {latePenalty > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Phạt đi muộn:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(latePenalty)}</span>
                                  </div>
                                )}
                                {unpaidLeaveDays > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nghỉ không lương:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(unpaidLeaveDeduction)}</span>
                                  </div>
                                )}
                                {deductionLines
                                  .filter(d => d.deductionType !== 'LATE')
                                  .map((line, idx) => (
                                    <div key={idx} className="flex justify-between">
                                      <span className="text-muted-foreground truncate max-w-[120px]" title={line.name}>{line.name}:</span>
                                      <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(line.amount)}</span>
                                    </div>
                                  ))}
                                {latePenalty === 0 && unpaidLeaveDays === 0 && deductionLines.filter(d => d.deductionType !== 'LATE').length === 0 && (
                                  <span className="text-slate-400 italic block pt-1 text-[12px]">Không có khoản khấu trừ nào.</span>
                                )}
                              </div>
                            </div>

                            {/* Col 4: Manual Adjustments & Notes */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                  <PenTool className="size-3.5 text-violet-500" />
                                  Điều chỉnh & Ghi chú
                                </span>
                                {isDraft && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleAdjust(slip, e)}
                                    className="cursor-pointer h-5 text-[12px] px-1.5 text-primary hover:bg-primary/10 flex items-center gap-1"
                                  >
                                    <Edit3 className="size-3" />
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </div>
                              <div className="space-y-1.5 pt-1">
                                {(slip.manualAdjustments || []).map((line, idx) => {
                                  const isPos = line.amount >= 0
                                  return (
                                    <div key={idx} className="flex justify-between text-[13px]">
                                      <span className="text-muted-foreground truncate max-w-[120px]" title={line.name}>
                                        {line.name}:
                                      </span>
                                      <span className={`font-semibold ${isPos ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPos ? '+' : ''}{formatVND(line.amount)}
                                      </span>
                                    </div>
                                  )
                                })}
                                {(slip.manualAdjustments || []).length === 0 && (
                                  <span className="text-slate-400 italic block text-[12px]">Không có điều chỉnh thủ công.</span>
                                )}
                                {slip.note && (
                                  <div className="mt-2.5 p-2 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded text-[13px] text-amber-800 dark:text-amber-400">
                                    <strong className="block text-[12px] uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-0.5">
                                      Lời nhắn:
                                    </strong>
                                    {slip.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}

            {/* Summary Footer Row */}
            {payslips.length > 0 && (
              <TableRow className="bg-slate-100/50 dark:bg-slate-900/60 font-bold border-t-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100/60">
                <TableCell colSpan={1}>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Tổng cộng</div>
                  <div className="text-[10px] text-muted-foreground font-normal">{payslips.length} nhân sự</div>
                </TableCell>
                <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/25 border-l border-slate-200 dark:border-slate-800 tabular-nums text-slate-600 dark:text-slate-400">
                  {formatVND(sumBasePay)}
                </TableCell>
                <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/25 tabular-nums text-slate-800 dark:text-slate-200">
                  {formatVND(sumWorkedBasePay)}
                </TableCell>
                <TableCell className="text-right bg-blue-50/50 dark:bg-blue-950/25 border-r border-slate-200 dark:border-slate-800 tabular-nums text-green-600 dark:text-green-400">
                  {sumOvertimePay > 0 ? `+${formatVND(sumOvertimePay)}` : '-'}
                </TableCell>
                <TableCell className="text-right bg-emerald-50/50 dark:bg-emerald-950/25 border-r border-slate-200 dark:border-slate-800 tabular-nums text-green-600 dark:text-green-400">
                  {sumTotalAdditions > 0 ? `+${formatVND(sumTotalAdditions)}` : '-'}
                </TableCell>
                <TableCell className="text-right bg-rose-50/50 dark:bg-rose-950/25 border-r border-slate-200 dark:border-slate-800 tabular-nums text-red-600 dark:text-red-400">
                  {sumTotalDeductions > 0 ? `-${formatVND(sumTotalDeductions)}` : '-'}
                </TableCell>
                <TableCell className="text-right font-extrabold text-slate-900 dark:text-slate-50 tabular-nums text-base">
                  {formatVND(sumNetSalary)}
                </TableCell>
                <TableCell className="text-right pr-4" />
              </TableRow>
            )}
          </TableBody>
        </Table>

        {payslips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <AlertCircle className="size-8 mb-3 opacity-40" />
            <p className="text-sm">Chưa có phiếu lương nào trong kỳ này.</p>
          </div>
        )}
      </div>
    </div>
  )
}
