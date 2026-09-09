'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Building,
  UserCheck,
  X,
} from 'lucide-react'
import { formatVND, STATUS_MAP } from '../../_constants/payroll.constants'
import type { Payslip, DeductionLine, PeriodStatus } from '@/types/payroll'
import { useAuthStore } from '@/store/auth-store'

type MyPayslipDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  payslip: Payslip | null
}

const formatDMY = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    return new Intl.DateTimeFormat('vi-VN').format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

export function MyPayslipDetailDialog({
  open,
  onOpenChange,
  payslip,
}: MyPayslipDetailDialogProps) {
  const { user } = useAuthStore()

  if (!payslip) return null

  // Resolve staff name & email from auth store
  const userProfile = user?.profile
  const name = userProfile
    ? `${userProfile.lastName || ''} ${userProfile.firstName || ''}`.trim()
    : user?.display_name || user?.full_name || 'Nhân viên'
  const email = user?.email || ''

  const role = user?.role || ''

  const basePay = payslip.basePay ?? payslip.baseSalary ?? 0
  const workedDays = payslip.totalWorkedDays ?? payslip.actualWorkingDays ?? 0
  const standardDays = payslip.standardWorkingDays ?? 26

  const workedHours = payslip.totalWorkedHours ?? payslip.actualWorkingHours ?? 0
  const overtimeHours = payslip.overtimeHours ?? 0
  const overtimePay = payslip.overtimePay ?? 0

  const paidLeaveDays = payslip.paidLeaveDays ?? 0
  const unpaidLeaveDays = payslip.unpaidLeaveDays ?? 0
  const paidLeavePay = payslip.paidLeavePay ?? 0
  const unpaidLeaveDeduction = payslip.unpaidLeaveDeduction ?? 0

  // Late penalties
  const latePenalty =
    (payslip.deductionLines || [])
      .filter((d: DeductionLine) => d.deductionType === 'LATE')
      .reduce((sum, d) => sum + (d.amount || 0), 0) || (payslip.latePenalty ?? 0)
  const lateMinutes = payslip.lateMinutes ?? 0

  // Other lines
  const allowanceLines = payslip.allowanceLines || []
  // Filter out LATE from deductions display since it is rendered separately
  const otherDeductions = (payslip.deductionLines || []).filter(
    (d: DeductionLine) => d.deductionType !== 'LATE'
  )
  const manualAdjustments = payslip.manualAdjustments || []

  // Period label
  const periodStart = formatDMY(payslip.periodStart)
  const periodEnd = formatDMY(payslip.periodEnd)

  const statusStyle = STATUS_MAP[(payslip.status || 'APPROVED') as PeriodStatus] || {
    label: payslip.status,
    className: 'bg-slate-100 text-slate-800 border-slate-200',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 border-0 bg-transparent shadow-none" showCloseButton={false}>
        {/* Receipt Container */}
        <div className="relative bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-2xl p-6 select-none">
          {/* Top Decorative Border (Dashed Ribbon) */}
          <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-violet-500 via-primary to-emerald-400" />

          {/* Custom Larger Close Button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Đóng"
          >
            <X className="size-6 shrink-0" />
          </button>

          <DialogHeader className="space-y-1.5 text-center mt-3">
            <div className="flex justify-center mb-1">
              <div className="p-2.5 bg-primary/10 rounded-full text-primary">
                <FileText className="size-6" />
              </div>
            </div>
            <DialogTitle className="text-lg font-black tracking-tight uppercase text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
              Chi tiết lương
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground">
              Chu kỳ: {periodStart} ➔ {periodEnd}
            </DialogDescription>
            <div className="flex justify-center mt-2">
              <Badge variant="outline" className={`${statusStyle.className} border font-bold px-3 py-0.5 rounded-full text-[10px]`}>
                {statusStyle.label}
              </Badge>
            </div>
          </DialogHeader>

          {/* Dashed separator */}
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-4" />

          {/* Employee Metadata */}
          <div className="grid grid-cols-2 gap-y-3.5 text-[13px] text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[12px] text-muted-foreground block uppercase font-medium">Nhân viên</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-self-end text-right">
              <div className="min-w-0">
                <span className="text-[12px] text-muted-foreground block uppercase font-medium">Vai trò</span>
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5 mt-0.5 font-bold uppercase">
                  {/* Vai trò do cửa hàng tự đặt tên, nên hiện đúng tên đó. Ba nhánh cũ
                      là ba role cố định của backend cũ, hai trong số đó không còn. */}
                  {role === 'TENANT_OWNER'
                    ? 'Chủ cửa hàng'
                    : user?.roleName || 'Nhân viên'}
                </Badge>
              </div>
            </div>
            {email && (
              <div className="col-span-2 flex items-center gap-2 border-t border-slate-50 dark:border-slate-800/40 pt-2.5">
                <Building className="size-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[12px] text-muted-foreground block uppercase font-medium">Email hệ thống</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">{email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dashed separator */}
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-4" />

          {/* Content sections */}
          <div className="space-y-4">
            {/* Core Time & Attendance Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50 border rounded-xl p-2.5">
              <div className="text-center border-r border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Ngày công</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                  {workedDays}<span className="text-[10px] font-normal text-muted-foreground">/{standardDays}</span>
                </span>
              </div>
              <div className="text-center border-r border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Giờ tích lũy</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 block mt-0.5">
                  {workedHours}<span className="text-[10px] font-normal text-muted-foreground">h</span>
                </span>
              </div>
              <div className="text-center">
                <span className="text-[9px] font-bold text-muted-foreground uppercase block">Đi muộn</span>
                <span className={`text-sm font-black block mt-0.5 ${lateMinutes > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                  {lateMinutes}<span className="text-[10px] font-normal text-muted-foreground">m</span>
                </span>
              </div>
            </div>

            {/* Financial Details (The Receipt Look) */}
            <div className="space-y-3.5">
              {/* Earning block */}
              <div>
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                  1. Thu nhập & Làm thêm
                </span>
                <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">Khung lương cơ bản</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatVND(basePay)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">Lương ngày công thực tế</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatVND(Math.round((basePay / standardDays) * workedDays))}
                    </span>
                  </div>
                  {overtimeHours > 0 && (
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-500 dark:text-slate-400">Tăng ca ({overtimeHours} giờ)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(overtimePay)}</span>
                    </div>
                  )}
                  {paidLeaveDays > 0 && (
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-500 dark:text-slate-400">Nghỉ phép hưởng lương ({paidLeaveDays} ngày)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(paidLeavePay)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Allowance block */}
              {allowanceLines.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                    2. Các khoản phụ cấp
                  </span>
                  <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                    {allowanceLines.map((line, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 dark:text-slate-400">{line.name}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatVND(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deductions block */}
              {(latePenalty > 0 || unpaidLeaveDays > 0 || otherDeductions.length > 0) && (
                <div>
                  <span className="text-[12px] font-bold text-red-400 dark:text-red-500 uppercase tracking-widest block mb-1.5">
                    3. Khoản giảm trừ & Phạt
                  </span>
                  <div className="space-y-2 border-l-2 border-red-100 dark:border-red-950/30 pl-3">
                    {latePenalty > 0 && (
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 dark:text-slate-400">Phạt đi muộn ({lateMinutes} phút)</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(latePenalty)}</span>
                      </div>
                    )}
                    {unpaidLeaveDays > 0 && (
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 dark:text-slate-400">Nghỉ không lương ({unpaidLeaveDays} ngày)</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(unpaidLeaveDeduction)}</span>
                      </div>
                    )}
                    {otherDeductions.map((line, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500 dark:text-slate-400">{line.name}</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">-{formatVND(line.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Adjustments block */}
              {manualAdjustments.length > 0 && (
                <div>
                  <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                    4. Thưởng & Điều chỉnh khác
                  </span>
                  <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-3">
                    {manualAdjustments.map((line, idx) => {
                      const isPositive = line.amount >= 0
                      return (
                        <div key={idx} className="flex justify-between items-center text-[13px]">
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={line.name}>
                            {line.name} {line.note ? `(${line.note})` : ''}
                          </span>
                          <span
                            className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatVND(line.amount)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Manager Note */}
            {payslip.note && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-[13px] text-amber-800 dark:text-amber-400 mt-2">
                <span className="font-bold block mb-0.5">Lời nhắn từ quản lý:</span>
                {payslip.note}
              </div>
            )}
          </div>

          {/* Dashed separator */}
          <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-800 my-4.5" />

          {/* Receipt Net Salary Card */}
          <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-xl p-4 flex justify-between items-center shadow-lg group">
            {/* Reflective Sheen Effect */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />

            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Thực Nhận (Net)</span>
              <span className="text-[9px] text-slate-400 block font-medium">Đã bao gồm tất cả các khoản giảm trừ</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 tabular-nums">
                {formatVND(payslip.netSalary)}
              </span>
            </div>
          </div>

          {/* Close Action */}
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-xs h-8 px-5 border-slate-200 hover:bg-slate-50 dark:border-slate-800 rounded-full"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
