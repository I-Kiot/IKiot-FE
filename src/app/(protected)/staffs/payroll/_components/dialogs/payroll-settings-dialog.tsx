'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { usePayroll } from '../../_context/payroll-provider'
import { payrollSettingsSchema, type PayrollSettingsFormValues } from '../../_types/payroll.types'
import { WEEKDAYS } from '../../_constants/payroll.constants'

type PayrollSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULT_SETTINGS: PayrollSettingsFormValues = {
  cycle: 'MONTHLY',
  approveAfterPeriodEndDays: 2,
  payAfterPeriodEndDays: 5,
  autoGenerate: false,
  standardWorkingDays: 26,
  standardWorkingHoursPerDay: 8,
  weekendDays: [0], // Default Sunday
  lateGraceMinutes: 15,
}

export function PayrollSettingsDialog({ open, onOpenChange }: PayrollSettingsDialogProps) {
  const { settings, handleUpdateSettings } = usePayroll()

  const form = useForm<PayrollSettingsFormValues>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  })

  const standardWorkingHoursPerDay = useWatch({ control: form.control, name: 'standardWorkingHoursPerDay' }) || 0
  const weekendDays = useWatch({ control: form.control, name: 'weekendDays' }) || []

  const workingDaysPerWeek = Math.max(0, 7 - (weekendDays.length || 0))
  const totalWeeklyHours = workingDaysPerWeek * standardWorkingHoursPerDay

  useEffect(() => {
    if (!open) return
    if (settings) {
      form.reset({
        cycle: settings.cycle || 'MONTHLY',
        approveAfterPeriodEndDays: settings.approveAfterPeriodEndDays ?? 2,
        payAfterPeriodEndDays: settings.payAfterPeriodEndDays ?? 5,
        autoGenerate: !!settings.autoGenerate,
        standardWorkingDays: settings.standardWorkingDays ?? 26,
        standardWorkingHoursPerDay: settings.standardWorkingHoursPerDay ?? 8,
        weekendDays: settings.weekendDays ?? [0],
        lateGraceMinutes: settings.lateGraceMinutes ?? 15,
      })
    } else {
      form.reset(DEFAULT_SETTINGS)
    }
  }, [open, settings, form])

  async function onSubmit(data: PayrollSettingsFormValues) {
    if (data.standardWorkingDays > 31) {
      toast.error(
        `Không thể lưu: Số ngày công chuẩn (${data.standardWorkingDays} ngày) không được vượt quá số ngày tối đa trong tháng (31 ngày).`
      )
      return
    }

    const workingDays = Math.max(0, 7 - (data.weekendDays?.length || 0))
    const weeklyHours = workingDays * (data.standardWorkingHoursPerDay || 0)

    if (data.standardWorkingHoursPerDay > 8) {
      toast.warning(
        `Cảnh báo: Số giờ công/ca chuẩn (${data.standardWorkingHoursPerDay} tiếng) đang vượt quá 8 tiếng, hệ thống vẫn lưu cấu hình này.`,
        { duration: 5000 }
      )
    }

    if (weeklyHours >= 48) {
      toast.warning(
        `Cảnh báo: Tổng số giờ làm việc trong tuần (${weeklyHours}h = ${workingDays} ngày × ${data.standardWorkingHoursPerDay}h) đang chạm/vượt ngưỡng 48 giờ/tuần.`,
        { duration: 5000 }
      )
    }

    const success = await handleUpdateSettings(data)
    if (success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cấu hình tính lương</DialogTitle>
          <DialogDescription>
            Kỳ lương được tính cố định từ ngày 1 đến ngày cuối tháng. Thiết lập ngày công chuẩn và chính sách đi muộn áp dụng cho toàn hệ thống.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chu kỳ lương</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Chọn chu kỳ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Hàng tháng (Monthly)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="standardWorkingDays"
                render={({ field }) => {
                  const isError = field.value > 31
                  return (
                    <FormItem className="group relative">
                      <FormLabel className={cn('transition-colors', isError && 'text-red-600 dark:text-red-400 font-semibold')}>
                        Ngày công chuẩn hàng tháng
                        {isError && <AlertTriangle className="inline size-3.5 ml-1 text-red-500" />}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className={cn(
                            'transition-colors',
                            isError && 'border-red-500 text-red-600 dark:text-red-400 font-semibold bg-red-50/20 dark:bg-red-950/20 focus-visible:ring-red-500/40'
                          )}
                        />
                      </FormControl>
                      {isError && (
                        <div className="hidden group-hover:block group-focus-within:block absolute z-30 top-full left-0 mt-1.5 w-full rounded-lg bg-red-50 dark:bg-red-950/95 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 p-2.5 text-xs shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="absolute -top-1.5 left-5 size-3 bg-red-50 dark:bg-red-950/95 border-t border-l border-red-200 dark:border-red-800 rotate-45" />
                          <div className="flex items-start gap-2 relative z-10">
                            <AlertTriangle className="size-4 shrink-0 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-semibold text-red-800 dark:text-red-300">Cảnh báo ngày công chuẩn</p>
                              <p className="mt-0.5 text-red-700 dark:text-red-400">
                                Ngày công chuẩn ({field.value} ngày) không được vượt quá 31 ngày (tối đa số ngày trong 1 tháng).
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="standardWorkingHoursPerDay"
                render={({ field }) => {
                  const isWarning = field.value > 8
                  return (
                    <FormItem className="group relative">
                      <FormLabel className={cn('transition-colors', isWarning && 'text-amber-600 dark:text-amber-400 font-semibold')}>
                        Số giờ làm việc / ca chuẩn
                        {isWarning && <AlertTriangle className="inline size-3.5 ml-1 text-amber-500" />}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className={cn(
                            'transition-colors',
                            isWarning && 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/20 dark:bg-amber-950/20 focus-visible:ring-amber-500/40'
                          )}
                        />
                      </FormControl>
                      {isWarning && (
                        <div className="hidden group-hover:block group-focus-within:block absolute z-30 top-full left-0 mt-1.5 w-full rounded-lg bg-amber-50 dark:bg-amber-950/95 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 p-2.5 text-xs shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="absolute -top-1.5 left-5 size-3 bg-amber-50 dark:bg-amber-950/95 border-t border-l border-amber-200 dark:border-amber-800 rotate-45" />
                          <div className="flex items-start gap-2 relative z-10">
                            <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                            <div>
                              <p className="font-semibold text-amber-800 dark:text-amber-300">Cảnh báo số giờ làm việc chuẩn</p>
                              <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">
                                Số giờ công/ca chuẩn ({field.value} tiếng) đang vượt quá 8 tiếng/ngày (vẫn cho phép lưu).
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lateGraceMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đi muộn cho phép (Phút)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoGenerate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-xs">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Tự động tạo kỳ lương</FormLabel>
                      <div className="text-xs text-muted-foreground">Tự chạy khi hết kỳ</div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="approveAfterPeriodEndDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian xét duyệt (Số ngày)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payAfterPeriodEndDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hạn trả lương sau kỳ (Số ngày)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Weekend days Selection */}
            <FormField
              control={form.control}
              name="weekendDays"
              render={() => (
                <FormItem className="space-y-2">
                  <FormLabel>Ngày nghỉ cuối tuần</FormLabel>
                  <div className="grid grid-cols-4 gap-2 border p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                    {WEEKDAYS.map((day) => (
                      <FormField
                        key={day.value}
                        control={form.control}
                        name="weekendDays"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(day.value)
                          return (
                            <FormItem
                              key={day.value}
                              className="flex flex-row items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, day.value])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== day.value)
                                        )
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm font-normal">{day.label}</span>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekly Working Hours Warning (>= 48h) */}
            {totalWeeklyHours >= 48 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Cảnh báo tổng số giờ làm việc theo tuần (≥ 48h)</p>
                  <p className="mt-0.5 text-amber-700/90 dark:text-amber-400">
                    Tổng số giờ làm việc trong tuần hiện tại là <strong>{totalWeeklyHours} giờ/tuần</strong> ({workingDaysPerWeek} ngày làm việc × {standardWorkingHoursPerDay}h/ca), đạt/vượt quá ngưỡng 48 giờ/tuần theo quy định của Bộ luật Lao động. Bạn vẫn có thể tiếp tục tạo/lưu cấu hình này.
                  </p>
                </div>
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
              <Button type="submit" className="cursor-pointer">
                <Save className="mr-2 size-4" />
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
