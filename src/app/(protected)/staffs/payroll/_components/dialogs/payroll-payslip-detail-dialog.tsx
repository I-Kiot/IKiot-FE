'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar, User, Clock, AlertTriangle, Landmark,
  Plus, Trash2, Save, X,
} from 'lucide-react'
import { formatVND, STATUS_MAP } from '../../_constants/payroll.constants'
import { usePayroll } from '../../_context/payroll-provider'
import { payrollApi } from '@/lib/api/payroll'
import { toast } from 'sonner'
import type {
  Payslip,
  ManualAdjustment,
  AllowanceLine,
  DeductionLine,
  LeaveLine,
  LeaveDay,
  PeriodStatus,
} from '@/types/payroll'

type ManualAdjustmentDraft = {
  category: 'SALARY_ADVANCE' | 'TET_BONUS' | 'OTHER'
  name: string
  amount: string
  note: string
}

const EMPTY_ADJ: ManualAdjustmentDraft = {
  category: 'OTHER',
  name: '',
  amount: '',
  note: '',
}

const CATEGORY_LABELS: Record<string, string> = {
  SALARY_ADVANCE: 'Tạm ứng lương',
  TET_BONUS: 'Thưởng Tết',
  OTHER: 'Khác',
}

type PayrollPayslipDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPayslip: Payslip | null
  periodStatus?: string
  /** If provided, saving will call the real PATCH API */
  periodId?: string
  onSaved?: (updated: Payslip) => void
}

export function PayrollPayslipDetailDialog({
  open,
  onOpenChange,
  currentPayslip,
  periodStatus,
  periodId,
  onSaved,
}: PayrollPayslipDetailDialogProps) {
  const { staffs } = usePayroll()

  // ─── Manual Adjustment State ──────────────────────────────────────────────
  const [adjustments, setAdjustments] = useState<ManualAdjustment[]>(currentPayslip?.manualAdjustments || [])
  const [newAdj, setNewAdj] = useState<ManualAdjustmentDraft>(EMPTY_ADJ)
  const [noteText, setNoteText] = useState<string>(currentPayslip?.note || '')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  if (!currentPayslip) return null

  const isDraft = (currentPayslip.status || periodStatus || 'DRAFT') === 'DRAFT'

  // ─── Resolve staff name ───────────────────────────────────────────────────
  const staffId = typeof currentPayslip.userId === 'string' ? currentPayslip.userId : currentPayslip.userId?.id
  const staff = staffs.find((s) => s.id === staffId)

  let name = 'Nhân viên'
  let email = staff?.email || ''

  if (currentPayslip.user) {
    if (currentPayslip.user.profile) {
      name = `${currentPayslip.user.profile.lastName || ''} ${currentPayslip.user.profile.firstName || ''}`.trim()
    } else {
      name = currentPayslip.user.phoneNumber || currentPayslip.user.email || 'Nhân viên'
    }
    email = currentPayslip.user.email || email
  } else if (staff) {
    name = `${staff.lastName || ''} ${staff.firstName || ''}`.trim()
    if (!name) {
      name = staff.phoneNumber || staff.email || 'Nhân viên'
    }
  }

  if (!name) name = 'Nhân viên'

  // ─── Safe field mapping ───────────────────────────────────────────────────
  const basePay = currentPayslip.basePay ?? currentPayslip.baseSalary ?? 0
  const overtimePay = currentPayslip.overtimePay ?? 0
  const grossSalary = currentPayslip.grossSalary ?? (basePay + overtimePay)
  const allowance = currentPayslip.allowance ?? 0
  const deduction = currentPayslip.deduction ?? 0
  const netSalary = currentPayslip.netSalary ?? 0

  const workedDays = currentPayslip.totalWorkedDays ?? currentPayslip.actualWorkingDays ?? 0
  const standardDays = currentPayslip.standardWorkingDays ?? 26
  const workedHours = currentPayslip.totalWorkedHours ?? currentPayslip.actualWorkingHours ?? 0

  // Leave fields
  const paidLeaveDays = currentPayslip.paidLeaveDays ?? 0
  const unpaidLeaveDays = currentPayslip.unpaidLeaveDays ?? 0
  const paidLeavePay = currentPayslip.paidLeavePay ?? 0
  const unpaidLeaveDeduction = currentPayslip.unpaidLeaveDeduction ?? 0
  const leaveLines: LeaveLine[] = currentPayslip.leaveLines || []
  const hasLeave = paidLeaveDays > 0 || unpaidLeaveDays > 0 || leaveLines.length > 0

  const rawStatus = (currentPayslip.status || periodStatus || 'DRAFT') as PeriodStatus
  const statusStyle = STATUS_MAP[rawStatus as 'DRAFT'] || { label: currentPayslip.status || 'Nháp', className: '' }

  const allowanceLines = currentPayslip.allowanceLines || []
  const deductionLines = currentPayslip.deductionLines || []

  const totalAdjustments = adjustments.reduce((sum: number, c: ManualAdjustment) => sum + (c.amount || 0), 0)

  function handleRemoveAdj(index: number) {
    setAdjustments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAddAdj() {
    const amount = parseFloat(newAdj.amount)
    if (!newAdj.name.trim()) {
      toast.error('Vui lòng nhập tên khoản điều chỉnh')
      return
    }
    if (isNaN(amount) || amount === 0) {
      toast.error('Số tiền không hợp lệ (không được bằng 0)')
      return
    }
    setAdjustments((prev) => [
      ...prev,
      { category: newAdj.category, name: newAdj.name.trim(), amount, note: newAdj.note.trim() },
    ])
    setNewAdj(EMPTY_ADJ)
    setShowAddForm(false)
  }

  async function handleSave() {
    if (!periodId || !currentPayslip || !currentPayslip.id) {
      toast.error('Không thể lưu: thiếu thông tin kỳ lương hoặc phiếu lương')
      return
    }
    setSaving(true)
    try {
      const updated = await payrollApi.updatePayslip(periodId, currentPayslip.id, {
        note: noteText || undefined,
        manualAdjustments: adjustments,
      })
      toast.success('Đã cập nhật phiếu lương')
      onSaved?.(updated)
      onOpenChange(false)
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-foreground border border-border">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Chi tiết phiếu lương
            </DialogTitle>
            <Badge variant="outline" className={`${statusStyle.className} border font-medium rounded-full`}>
              {statusStyle.label}
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground flex items-center gap-1.5 pt-1 text-xs">
            <User className="size-3.5" />
            <span>
              Nhân viên: <strong>{name}</strong> {email ? `(${email})` : ''}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Financial Highlights */}
        <div className="bg-muted/40 rounded-xl p-5 border border-dashed flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Thực nhận (Net)
            </p>
            <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1 tabular-nums">
              {formatVND(netSalary)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Kỳ lương</p>
              <p className="font-semibold mt-0.5 flex items-center gap-1 text-xs">
                <Calendar className="size-3.5 text-muted-foreground" />
                {currentPayslip.periodStart ? new Date(currentPayslip.periodStart).toLocaleDateString('vi-VN') : '-'}
                {' ➔ '}
                {currentPayslip.periodEnd ? new Date(currentPayslip.periodEnd).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Công thực tế</p>
              <p className="font-semibold mt-0.5 flex items-center gap-1 text-xs">
                <Clock className="size-3.5 text-muted-foreground" />
                {workedDays} / {standardDays} ngày ({workedHours.toFixed(1)} giờ)
              </p>
            </div>
          </div>
        </div>

        {/* Detailed breakdown list */}
        <div className="space-y-6 pt-2">
          {/* 1. Main Wages */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">1. Lương & Tăng ca</h3>
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="flex justify-between items-center p-3 border-b text-sm">
                <div>
                  <span className="text-muted-foreground">Lương chính (ngày công thực tế + nghỉ có phép)</span>
                  {paidLeavePay > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Trong đó nghỉ có phép: +{formatVND(paidLeavePay)} ({paidLeaveDays} ngày)
                    </p>
                  )}
                </div>
                <span className="font-semibold tabular-nums">{formatVND(basePay)}</span>
              </div>
              <div className="flex justify-between items-center p-3 border-b text-sm">
                <span className="text-muted-foreground">Lương làm thêm giờ (Overtime)</span>
                <span className="font-semibold text-orange-600 dark:text-orange-400 tabular-nums">
                  {overtimePay > 0 ? `+${formatVND(overtimePay)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/20 text-sm">
                <span className="font-semibold text-muted-foreground">Gross (trước phụ cấp & giảm trừ)</span>
                <span className="font-bold tabular-nums">{formatVND(grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* 2. Leave Breakdown */}
          {hasLeave && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  2. Nghỉ phép ({paidLeaveDays + unpaidLeaveDays} ngày)
                </h3>
                <div className="flex gap-3 text-sm">
                  {paidLeaveDays > 0 && (
                    <span className="text-green-600 font-bold tabular-nums">+{formatVND(paidLeavePay)}</span>
                  )}
                  {unpaidLeaveDays > 0 && (
                    <span className="text-muted-foreground text-xs font-semibold">
                      {unpaidLeaveDays} ngày không lương (không tính vào basePay)
                    </span>
                  )}
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden bg-background">
                {leaveLines.length === 0 ? (
                  <div className="p-3 text-sm text-center text-muted-foreground">
                    Nghỉ phép: {paidLeaveDays} ngày có lương, {unpaidLeaveDays} ngày không lương
                  </div>
                ) : (
                  leaveLines.map((ll: LeaveLine, li: number) => (
                    <div key={ll.leaveRequestId || li} className="p-3 border-b last:border-b-0">
                      <div className="flex justify-between items-start text-sm mb-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Đơn nghỉ #{li + 1}
                        </span>
                        <div className="text-right text-xs text-muted-foreground">
                          {ll.paidDays > 0 && <span className="text-green-600 font-semibold">{ll.paidDays} ng có phép (+{formatVND(ll.paidAmount)}) </span>}
                          {ll.unpaidDays > 0 && <span className="text-slate-500">{ll.unpaidDays} ng không lương</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {ll.dates?.map((d: LeaveDay, di: number) => (
                          <div key={di} className={`flex justify-between items-center text-[11px] px-2 py-1 rounded ${
                            d.ignoredBecauseAttended
                              ? 'bg-slate-50 dark:bg-slate-800/30 text-muted-foreground line-through'
                              : d.leaveType === 'PAID'
                              ? 'bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                              : 'bg-slate-50 dark:bg-slate-800/30 text-slate-500'
                          }`}>
                            <span>
                              {new Intl.DateTimeFormat('vi-VN').format(new Date(d.date))}
                              {d.dayFraction < 1 ? ` (${d.dayFraction * 100}%)` : ''}
                              {' - '}{d.leaveType === 'PAID' ? 'Có phép' : 'Không lương'}
                              {d.ignoredBecauseAttended && ' · Bỏ qua (có chấm công)'}
                            </span>
                            <span>{d.leaveType === 'PAID' && !d.ignoredBecauseAttended ? `+${formatVND(d.amount)}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary row: informational totals */}
              {(paidLeavePay > 0 || unpaidLeaveDeduction > 0) && (
                <div className="border rounded-lg bg-muted/20 px-3 py-2 text-xs flex flex-col gap-1">
                  {paidLeavePay > 0 && (
                    <div className="flex justify-between text-green-700 dark:text-green-400">
                      <span>✔ Nghỉ có phép → được cộng vào lương chính</span>
                      <span className="font-semibold tabular-nums">+{formatVND(paidLeavePay)}</span>
                    </div>
                  )}
                  {unpaidLeaveDeduction > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>ℹ️ Nghỉ không lương → ngày công không được tính vào basePay (tham khảo)</span>
                      <span className="font-semibold tabular-nums text-slate-400">−{formatVND(unpaidLeaveDeduction)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Allowances */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">3. Phụ cấp ({allowanceLines.length})</h3>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {allowance > 0 ? `+${formatVND(allowance)}` : '-'}
              </span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-background">
              {allowanceLines.length === 0 ? (
                <div className="p-3 text-sm text-center text-muted-foreground">Không có phụ cấp</div>
              ) : (
                allowanceLines.map((line: AllowanceLine, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0 text-sm">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{line.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {line.amountType === 'PERCENTAGE' ? `Tính theo tỷ lệ: ${line.amountValue}% lương cơ bản` : 'Cộng cố định'}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatVND(line.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Deductions */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">4. Các khoản giảm trừ ({deductionLines.length})</h3>
              <span className="text-sm font-bold text-destructive tabular-nums">
                {deduction > 0 ? `-${formatVND(deduction)}` : '-'}
              </span>
            </div>
            <div className="border rounded-lg overflow-hidden bg-background">
              {deductionLines.length === 0 ? (
                <div className="p-3 text-sm text-center text-muted-foreground">Không có giảm trừ</div>
              ) : (
                deductionLines.map((line: DeductionLine, index: number) => {
                  let conditionLabel = 'Khấu trừ cố định'
                  if (line.deductionType === 'LATE') {
                    conditionLabel = line.conditionType === 'BY_BLOCK'
                      ? `Về sớm (Trừ theo block ${line.blockMinutes} phút)`
                      : 'Đi muộn (Trừ theo số lần)'
                  } else if (line.deductionType === 'EARLY_LEAVE') {
                    conditionLabel = line.conditionType === 'BY_BLOCK'
                      ? `Về sớm (Trừ theo block ${line.blockMinutes} phút)`
                      : 'Về sớm (Trừ theo số lần)'
                  }

                  return (
                    <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0 text-sm">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{line.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {conditionLabel} | Vi phạm: {line.violationMinutes || 0} phút ({line.units || 0} lần)
                        </p>
                      </div>
                      <span className="font-semibold text-destructive tabular-nums">
                        -{formatVND(line.amount)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* 5. Manual Adjustments */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">5. Điều chỉnh bổ sung ({adjustments.length})</h3>
              <span className={`text-sm font-bold tabular-nums ${totalAdjustments > 0 ? 'text-green-600' : totalAdjustments < 0 ? 'text-destructive' : 'text-slate-400'}`}>
                {totalAdjustments > 0 ? `+${formatVND(totalAdjustments)}` : totalAdjustments < 0 ? `-${formatVND(Math.abs(totalAdjustments))}` : '-'}
              </span>
            </div>

            <div className="border rounded-lg overflow-hidden bg-background">
              {adjustments.length === 0 && !showAddForm ? (
                <div className="p-3 text-sm text-center text-muted-foreground">Không có điều chỉnh bổ sung</div>
              ) : (
                adjustments.map((line: ManualAdjustment, index: number) => (
                  <div key={index} className="flex justify-between items-center p-3 border-b last:border-b-0 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{line.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {CATEGORY_LABELS[line.category] || line.category}
                        {line.note ? ` · ${line.note}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-semibold tabular-nums ${line.amount > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {line.amount > 0 ? `+${formatVND(line.amount)}` : `-${formatVND(Math.abs(line.amount))}`}
                      </span>
                      {isDraft && (
                        <button
                          onClick={() => handleRemoveAdj(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Inline Add Form */}
              {isDraft && showAddForm && (
                <div className="p-3 border-t bg-muted/30 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Select
                        value={newAdj.category}
                        onValueChange={(v) => setNewAdj((p) => ({ ...p, category: v as 'OTHER' | 'SALARY_ADVANCE' | 'TET_BONUS' }))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Loại khoản" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OTHER">Khác</SelectItem>
                          <SelectItem value="SALARY_ADVANCE">Tạm ứng lương</SelectItem>
                          <SelectItem value="TET_BONUS">Thưởng Tết</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      className="h-8 text-xs col-span-2"
                      placeholder="Tên khoản điều chỉnh *"
                      value={newAdj.name}
                      onChange={(e) => setNewAdj((p) => ({ ...p, name: e.target.value }))}
                    />
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      placeholder="Số tiền (âm = trừ) *"
                      value={newAdj.amount}
                      onChange={(e) => setNewAdj((p) => ({ ...p, amount: e.target.value }))}
                    />
                    <Input
                      className="h-8 text-xs"
                      placeholder="Ghi chú (tuỳ chọn)"
                      value={newAdj.note}
                      onChange={(e) => setNewAdj((p) => ({ ...p, note: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 text-xs cursor-pointer" onClick={() => { setShowAddForm(false); setNewAdj(EMPTY_ADJ) }}>
                      <X className="size-3 mr-1" /> Huỷ
                    </Button>
                    <Button size="sm" className="h-7 text-xs cursor-pointer" onClick={handleAddAdj}>
                      <Plus className="size-3 mr-1" /> Thêm
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {isDraft && !showAddForm && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs border-dashed cursor-pointer"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="size-3.5 mr-1" /> Thêm điều chỉnh
              </Button>
            )}
          </div>

          {/* Note Section (editable in DRAFT) */}
          {isDraft ? (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Ghi chú chung</p>
              <Input
                className="text-xs h-8"
                placeholder="Ghi chú cho phiếu lương này (tuỳ chọn)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
          ) : currentPayslip.note ? (
            <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/10 rounded-lg p-3 text-xs flex gap-2">
              <AlertTriangle className="size-4 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-800 dark:text-orange-300">Ghi chú chung</p>
                <p className="text-orange-700 dark:text-orange-400 mt-0.5">{currentPayslip.note}</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Save footer for DRAFT mode */}
        {isDraft && periodId && currentPayslip.id && (
          <>
            <Separator />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button size="sm" className="cursor-pointer" disabled={saving} onClick={handleSave}>
                <Save className="size-3.5 mr-1.5" />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
