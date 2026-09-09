'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Calculator,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePayroll } from '../../_context/payroll-provider'
import { periodCreateSchema, type PeriodCreateFormValues } from '../../_types/payroll.types'
import { payrollApi } from '@/lib/api/payroll'
import { formatVND } from '../../_constants/payroll.constants'
import type { Payslip, PreviewResult } from '@/types/payroll'
import { toast } from 'sonner'
import { PayrollPayslipDetailDialog } from './payroll-payslip-detail-dialog'
const vietnamDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// BE lưu instant UTC. Khi lấy ngày nghiệp vụ phải đổi instant về ngày Việt Nam;
// không được cắt `toISOString()` vì 00:00 Việt Nam là 17:00 UTC ngày hôm trước.
const toVietnamDateKey = (dateStr: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  const parts = vietnamDateFormatter.formatToParts(new Date(dateStr))
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return year && month && day ? `${year}-${month}-${day}` : dateStr
}

// Helper to format ISO date string to DD/MM/YYYY (Vietnam locale)
const formatDMY = (dateStr: string) => {
  if (!dateStr) return ''
  const match = toVietnamDateKey(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : dateStr
}
type PayrollPeriodDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_PERIOD: PeriodCreateFormValues = {
  payrollMonth: '',
  userIds: [],
}

function getPayrollPeriod(payrollMonth: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payrollMonth)) return null
  const [year, month] = payrollMonth.split('-').map(Number)
  const periodStart = new Date(Date.UTC(year, month - 1, 1))
  const nextPeriodStart = new Date(Date.UTC(year, month, 1))

  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: new Date(nextPeriodStart.getTime() - 1).toISOString().slice(0, 10),
  }
}

function getLatestCompletedPayrollMonth() {
  const vietnamNow = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const currentMonth = `${vietnamNow.getUTCFullYear()}-${String(vietnamNow.getUTCMonth() + 1).padStart(2, '0')}`
  const currentPeriod = getPayrollPeriod(currentMonth)
  const vietnamToday = vietnamNow.toISOString().slice(0, 10)
  if (currentPeriod && currentPeriod.periodEnd < vietnamToday) return currentMonth

  const previousMonth = new Date(
    Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth() - 1, 1)
  )
  return `${previousMonth.getUTCFullYear()}-${String(previousMonth.getUTCMonth() + 1).padStart(2, '0')}`
}

function formatPayrollMonth(payrollMonth: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(payrollMonth)) return 'Chọn tháng lương'
  const [year, month] = payrollMonth.split('-')

  return `Tháng ${month}/${year}`
}

export function PayrollPeriodDialog({ open, onOpenChange }: PayrollPeriodDialogProps) {
  const { handleCreatePeriod, staffs, settings } = usePayroll()
  const [previewLoading, setPreviewLoading] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(() =>
    Number(getLatestCompletedPayrollMonth().slice(0, 4))
  )
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null)
  const [activePreviewSlip, setActivePreviewSlip] = useState<Payslip | null>(null)

  const form = useForm<PeriodCreateFormValues>({
    resolver: zodResolver(periodCreateSchema),
    defaultValues: DEFAULT_PERIOD,
  })

  const payrollMonth = useWatch({ control: form.control, name: 'payrollMonth' })
  const latestCompletedPayrollMonth = getLatestCompletedPayrollMonth()
  const selectedPeriod = getPayrollPeriod(payrollMonth)
  const isPreviewCurrent = Boolean(
    previewData &&
      selectedPeriod &&
      toVietnamDateKey(previewData.periodStart) === selectedPeriod.periodStart &&
      toVietnamDateKey(previewData.periodEnd) === selectedPeriod.periodEnd
  )

  useEffect(() => {
    if (!open) return
    form.reset({
      ...DEFAULT_PERIOD,
      payrollMonth: getLatestCompletedPayrollMonth(),
    })
    const resetPreviewId = window.setTimeout(() => setPreviewData(null), 0)
    return () => window.clearTimeout(resetPreviewId)
  }, [open, form])

  async function handlePreview() {
    const selectedMonth = form.getValues('payrollMonth')
    const previewPeriod = getPayrollPeriod(selectedMonth)
    if (!previewPeriod) {
      toast.error('Vui lòng chọn tháng lương')
      return
    }
    if (selectedMonth > latestCompletedPayrollMonth) {
      toast.error('Chỉ có thể tính lương sau khi kỳ lương đã kết thúc')
      return
    }

    setPreviewLoading(true)
    try {
      const res = await payrollApi.preview({
        periodStartDate: previewPeriod.periodStart,
        periodEndDate: previewPeriod.periodEnd,
      })
      setPreviewData(res)
      toast.success('Tính toán thử kỳ lương thành công')
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      toast.error(axiosError.response?.data?.message || 'Tính thử kỳ lương thất bại. Vui lòng kiểm tra lại cấu hình hoặc chấm công.')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function onSubmit(data: PeriodCreateFormValues) {
    if (data.payrollMonth > latestCompletedPayrollMonth) {
      toast.error('Chỉ có thể tạo bảng lương sau khi kỳ lương đã kết thúc')
      return
    }
    const success = await handleCreatePeriod(data)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo kỳ lương mới</DialogTitle>
          <DialogDescription>
            Chọn tháng lương. Khoảng tính lương được cố định theo cấu hình và chỉ có thể tạo sau khi kỳ đã kết thúc.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="payrollMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tháng lương</FormLabel>
                    <Popover
                      open={monthPickerOpen}
                      onOpenChange={(nextOpen) => {
                        setMonthPickerOpen(nextOpen)
                        if (nextOpen) {
                          const selectedMonth = /^\d{4}-\d{2}$/.test(field.value)
                            ? field.value
                            : latestCompletedPayrollMonth
                          setPickerYear(Number(selectedMonth.slice(0, 4)))
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarDays className="mr-2 size-4" />
                            {formatPayrollMonth(field.value)}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" align="start">
                        <div className="mb-3 flex items-center justify-between">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Năm trước"
                            onClick={() => setPickerYear((year) => year - 1)}
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <span className="text-sm font-semibold">Năm {pickerYear}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Năm sau"
                            disabled={
                              pickerYear >= Number(latestCompletedPayrollMonth.slice(0, 4))
                            }
                            onClick={() => setPickerYear((year) => year + 1)}
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {Array.from({ length: 12 }, (_, monthIndex) => {
                            const month = String(monthIndex + 1).padStart(2, '0')
                            const monthValue = `${pickerYear}-${month}`
                            const isSelected = field.value === monthValue
                            const isDisabled = monthValue > latestCompletedPayrollMonth

                            return (
                              <Button
                                key={monthValue}
                                type="button"
                                variant={isSelected ? 'default' : 'ghost'}
                                className="h-10"
                                disabled={isDisabled}
                                onClick={() => {
                                  field.onChange(monthValue)
                                  setMonthPickerOpen(false)
                                }}
                              >
                                Tháng {monthIndex + 1}
                              </Button>
                            )
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="text-sm font-medium">Khoảng tính lương cố định</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPeriod
                    ? `${formatDMY(selectedPeriod.periodStart)} → ${formatDMY(selectedPeriod.periodEnd)}`
                    : 'Chọn tháng lương để xem khoảng thời gian'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tính từ ngày 1 đến ngày cuối tháng
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full cursor-pointer flex items-center justify-center gap-2"
                onClick={handlePreview}
                disabled={previewLoading}
              >
                {previewLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Calculator className="size-4" />
                )}
                Xem trước tính toán (Preview Calculation)
              </Button>
            </div>

            {/* Preview Section */}
            {previewData && isPreviewCurrent && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/40 animate-in fade-in duration-300">
                {/* Period date header */}
                <p className="text-xs text-muted-foreground text-center">
                  Kỳ lương: <span className="font-semibold text-foreground">{formatDMY(previewData.periodStart)}</span>
                  {' → '}
                  <span className="font-semibold text-foreground">{formatDMY(previewData.periodEnd)}</span>
                </p>

                <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-dashed">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Tổng chi lương dự kiến (Net)
                    </p>
                    <p className="text-xl font-bold text-primary tabular-nums">
                      {formatVND(previewData.summary.totalNetSalary ?? previewData.summary.totalCost ?? 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Nhân viên (Tính / Tổng)
                    </p>
                    <p className="text-xl font-bold tabular-nums">
                      {previewData.summary.generatedCount} / {previewData.summary.totalEmployees}
                    </p>
                  </div>
                </div>

                <div className="border rounded-md max-h-60 overflow-y-auto bg-background">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-xs">
                      <TableRow>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead className="text-right">Lương chính</TableHead>
                        <TableHead className="text-right">Phụ cấp</TableHead>
                        <TableHead className="text-right">Tăng ca</TableHead>
                        <TableHead className="text-right">Giảm trừ</TableHead>
                        <TableHead className="text-center">Ngày công</TableHead>
                        <TableHead className="text-right font-medium">Lương thực nhận (Net)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.payslips.map((slip, idx) => {
                        const staffId = typeof slip.userId === 'string' ? slip.userId : slip.userId?.id
                        const staff = staffs.find((s) => s.id === staffId)

                        let name = 'Nhân viên'
                        let email = staff?.email || ''

                        if (slip.user) {
                          if (slip.user.profile) {
                            name = `${slip.user.profile.lastName || ''} ${slip.user.profile.firstName || ''}`.trim()
                          } else {
                            name = slip.user.phoneNumber || slip.user.email || 'Nhân viên'
                          }
                          email = slip.user.email || email
                        } else if (staff) {
                          name = `${staff.lastName || ''} ${staff.firstName || ''}`.trim()
                          if (!name) {
                            name = staff.phoneNumber || staff.email || 'Nhân viên'
                          }
                        }

                        if (!name) name = 'Nhân viên'

                        const rowKey = slip.id || (typeof slip.userId === 'string' ? slip.userId : slip.userId?.id) || `preview-slip-${idx}`

                        return (
                          <TableRow
                            key={rowKey}
                            className="cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/10"
                            onClick={() => setActivePreviewSlip(slip)}
                          >
                            <TableCell className="font-medium">
                              <div>
                                <p className="text-sm font-semibold">{name}</p>
                                {email && <p className="text-[10px] text-muted-foreground">{email}</p>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm">
                              {formatVND(slip.basePay ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-blue-600 dark:text-blue-400">
                              {formatVND(slip.allowance ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-orange-600 dark:text-orange-400">
                              {formatVND(slip.overtimePay ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-sm text-destructive">
                              {formatVND(slip.deduction ?? 0)}
                            </TableCell>
                            <TableCell className="text-center tabular-nums text-xs">
                              {slip.totalWorkedDays ?? 0} / {settings?.standardWorkingDays || 26} ngày
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600 dark:text-green-400 tabular-nums">
                              {formatVND(slip.netSalary ?? 0)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {previewData.skipped?.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">Bỏ qua không tính lương ({previewData.skipped.length}):</p>
                    <div className="bg-destructive/10 text-destructive text-xs rounded-lg p-2.5 space-y-1">
                      {previewData.skipped.map((skipItem: { userId: string; reason: string }, idx) => {
                        const skipStaff = staffs.find((s) => s.id === skipItem.userId)

                        let skipName = ''
                        if (skipStaff) {
                          const last = skipStaff.lastName || ''
                          const first = skipStaff.firstName || ''
                          skipName = `${last} ${first}`.trim()
                        }
                        if (!skipName) {
                          skipName = skipStaff?.email || skipStaff?.phoneNumber || 'Nhân viên'
                        }

                        return (
                          <div key={idx} className="flex justify-between">
                            <span className="font-semibold">{skipName}</span>
                            <span>{skipItem.reason}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={!isPreviewCurrent || previewLoading}
              >
                <Plus className="mr-2 size-4" />
                Xác nhận tạo (Lưu nháp)
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {activePreviewSlip && (
          <PayrollPayslipDetailDialog
            open={activePreviewSlip !== null}
            onOpenChange={(v) => {
              if (!v) setActivePreviewSlip(null)
            }}
            currentPayslip={activePreviewSlip}
            periodStatus="DRAFT"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
