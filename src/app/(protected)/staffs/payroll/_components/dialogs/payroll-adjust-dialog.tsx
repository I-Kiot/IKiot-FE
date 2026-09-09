'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Save } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { usePayroll } from '../../_context/payroll-provider'
import { payslipAdjustSchema, type PayslipAdjustFormValues } from '../../_types/payroll.types'
import { formatPriceAmount } from '../../_constants/payroll.constants'
import type { Payslip, PayrollPeriod } from '@/types/payroll'

type PayrollAdjustDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: PayrollPeriod | null
  currentPayslip?: Payslip | null
}

const DEFAULT_ADJUSTMENT: PayslipAdjustFormValues = {
  note: '',
  manualCosts: [],
}

export function PayrollAdjustDialog({ open, onOpenChange, currentRow, currentPayslip }: PayrollAdjustDialogProps) {
  const { handleAdjustPayslip } = usePayroll()

  const form = useForm<PayslipAdjustFormValues>({
    resolver: zodResolver(payslipAdjustSchema),
    defaultValues: DEFAULT_ADJUSTMENT,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'manualCosts',
  })

  useEffect(() => {
    if (!open) return
    if (currentPayslip) {
      form.reset({
        note: currentPayslip.note || '',
        manualCosts: (currentPayslip.manualAdjustments || []).map((c) => ({
          type: c.amount < 0 ? 'DEDUCTION' as const : 'BONUS' as const,
          name: c.name,
          amount: formatPriceAmount(Math.abs(c.amount)),
        })),
      })
    } else {
      form.reset(DEFAULT_ADJUSTMENT)
    }
  }, [open, currentPayslip, form])

  async function onSubmit(data: PayslipAdjustFormValues) {
    if (!currentRow || !currentPayslip) return
    const success = await handleAdjustPayslip(currentRow.id, currentPayslip.id, data)
    if (success) {
      onOpenChange(false)
    }
  }

  const staffName = currentPayslip?.userId?.profile
    ? `${currentPayslip.userId.profile.lastName} ${currentPayslip.userId.profile.firstName}`
    : currentPayslip?.userId?.phoneNumber || 'Nhân viên'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Điều chỉnh phiếu lương</DialogTitle>
          <DialogDescription>
            Thêm các khoản phụ cấp, tiền thưởng hoặc khấu trừ phạt cho nhân viên <strong>{staffName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú phiếu lương</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Thưởng hoàn thành xuất sắc KPI tháng..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Khoản điều chỉnh bổ sung</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-7 text-xs"
                  onClick={() => append({ type: 'BONUS', name: '', amount: '' })}
                >
                  <Plus className="mr-1 size-3.5" />
                  Thêm khoản điều chỉnh
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-6 border border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-xs text-muted-foreground">Chưa có khoản cộng/trừ bổ sung nào.</p>
                </div>
              )}

              <div className="space-y-2">
                {fields.map((fieldItem, index) => (
                  <div key={fieldItem.id} className="flex gap-2 items-start border p-3 rounded-lg relative bg-slate-50/20 dark:bg-slate-900/5">
                    <FormField
                      control={form.control}
                      name={`manualCosts.${index}.type`}
                      render={({ field }) => (
                        <FormItem className="w-1/4">
                          <FormLabel className="text-xs">Loại</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="cursor-pointer h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="BONUS">Thưởng (+)</SelectItem>
                              <SelectItem value="DEDUCTION">Khấu trừ (-)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`manualCosts.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs">Tên khoản</FormLabel>
                          <FormControl>
                            <Input placeholder="VD: Thưởng chuyên cần" className="h-9" {...field} />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`manualCosts.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel className="text-xs">Số tiền (đ)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0"
                              className="h-9 tabular-nums"
                              value={field.value}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '')
                                field.onChange(digits ? formatPriceAmount(digits) : '')
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 cursor-pointer self-end h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

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
                Lưu điều chỉnh
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
