'use client'

import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { usePayroll } from '../_context/payroll-provider'
import { formatPriceAmount, parsePriceAmount } from '../_constants/payroll.constants'

const PREDEFINED_ALLOWANCES = ['Phụ cấp ăn trưa', 'Phụ cấp trách nhiệm', 'Phụ cấp đi lại', 'Phụ cấp xăng xe']
const PREDEFINED_DEDUCTIONS = ['Đi muộn', 'Về sớm', 'Vi phạm nội quy']

// Sub-schemas
const allowanceItemSchema = z.object({
  name: z.string().min(1, 'Tên phụ cấp là bắt buộc'),
  enable: z.boolean(),
  amountType: z.enum(['FIXED_AMOUNT', 'PERCENTAGE']),
  amountValue: z.number().min(0, 'Mức phụ cấp không được âm'),
})

const deductionItemSchema = z.object({
  name: z.string().min(1, 'Tên khấu trừ là bắt buộc'),
  enable: z.boolean(),
  deductionType: z.enum(['LATE', 'EARLY_LEAVE', 'FIXED']),
  conditionType: z.enum(['BY_OCCURRENCE', 'BY_BLOCK']).optional(),
  blockMinutes: z.number().optional(),
  deductionValue: z.number().min(0, 'Mức phạt không được âm'),
})

// Main Detail Schema
const paysheetDetailSchema = z.object({
  name: z.string().min(1, 'Tên cấu hình lương là bắt buộc'),
  payType: z.enum(['FIXED', 'PAY_BY_SHIFT', 'STANDARD_WORKING_DAY']),
  amount: z.string().min(1, 'Mức lương định mức là bắt buộc'),

  // Overtime Group
  overtimeEnable: z.boolean(),
  overtimeNormalDay: z.number().min(1, 'Hệ số tối thiểu là 1'),
  overtimeWeekend: z.number().min(1, 'Hệ số tối thiểu là 1'),
  overtimePublicHoliday: z.number().min(1, 'Hệ số tối thiểu là 1'),

  // Allowances List
  allowancesEnable: z.boolean(),
  allowances: z.array(allowanceItemSchema),

  // Deductions List
  deductionsEnable: z.boolean(),
  deductions: z.array(deductionItemSchema),
})

type PaysheetDetailFormValues = z.infer<typeof paysheetDetailSchema>

const DEFAULT_PAYSHEET_VALUES: PaysheetDetailFormValues = {
  name: '',
  payType: 'FIXED',
  amount: '',
  overtimeEnable: false,
  overtimeNormalDay: 1.5,
  overtimeWeekend: 2.0,
  overtimePublicHoliday: 3.0,
  allowancesEnable: false,
  allowances: [],
  deductionsEnable: false,
  deductions: [],
}

export function PaysheetDetail() {
  const {
    activePaysheetId,
    setActivePaysheetId,
    paysheets,
    handleAddPaysheet,
    handleEditPaysheet,
  } = usePayroll()

  const isEdit = activePaysheetId !== 'new'
  const sheet = isEdit ? paysheets.find((p) => p.id === activePaysheetId) : null

  const form = useForm<PaysheetDetailFormValues>({
    resolver: zodResolver(paysheetDetailSchema),
    defaultValues: DEFAULT_PAYSHEET_VALUES,
  })

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({
    control: form.control,
    name: 'allowances',
  })

  const {
    fields: deductionFields,
    append: appendDeduction,
    remove: removeDeduction,
  } = useFieldArray({
    control: form.control,
    name: 'deductions',
  })

  // Load values on edit
  useEffect(() => {
    if (isEdit && sheet) {
      const payType = sheet.basicPay?.payType || 'FIXED'
      let amountVal = 0
      if (payType === 'FIXED') {
        amountVal = sheet.basicPay?.salaryPerPeriod || 0
      } else if (payType === 'PAY_BY_SHIFT') {
        amountVal = sheet.basicPay?.amountPerShift || 0
      } else if (payType === 'STANDARD_WORKING_DAY') {
        amountVal = sheet.basicPay?.standardWorkingDaySalary || 0
      }

      form.reset({
        name: sheet.name || '',
        payType: payType,
        amount: formatPriceAmount(amountVal),
        overtimeEnable: !!sheet.overtime,
        overtimeNormalDay: sheet.overtime?.normalDay ?? 1.5,
        overtimeWeekend: sheet.overtime?.weekend ?? 2.0,
        overtimePublicHoliday: sheet.overtime?.publicHoliday ?? 3.0,
        allowancesEnable: Array.isArray(sheet.allowances) && sheet.allowances.length > 0,
        allowances: (sheet.allowances || []).map((a) => ({
          name: a.name || '',
          enable: a.enable ?? true,
          amountType: a.amountType || 'FIXED_AMOUNT',
          amountValue: a.amountValue || 0,
        })),
        deductionsEnable: Array.isArray(sheet.deductions) && sheet.deductions.length > 0,
        deductions: (sheet.deductions || []).map((d) => ({
          name: d.name || '',
          enable: d.enable ?? true,
          deductionType: d.deductionType || 'LATE',
          conditionType: d.conditionType || 'BY_OCCURRENCE',
          blockMinutes: d.blockMinutes ?? 15,
          deductionValue: d.deductionValue || 0,
        })),
      })
    } else {
      form.reset(DEFAULT_PAYSHEET_VALUES)
    }
  }, [isEdit, sheet, form])

  async function onSubmit(data: PaysheetDetailFormValues) {
    const numericAmount = parsePriceAmount(data.amount)

    // Prepare basicPay
    const basicPay: {
      payType: 'PAY_BY_SHIFT' | 'STANDARD_WORKING_DAY' | 'FIXED'
      salaryPerPeriod?: number
      amountPerShift?: number
      standardWorkingDaySalary?: number
    } = { payType: data.payType }
    if (data.payType === 'FIXED') {
      basicPay.salaryPerPeriod = numericAmount
    } else if (data.payType === 'PAY_BY_SHIFT') {
      basicPay.amountPerShift = numericAmount
    } else if (data.payType === 'STANDARD_WORKING_DAY') {
      basicPay.standardWorkingDaySalary = numericAmount
    }

    // Prepare overtime
    const overtime = data.overtimeEnable
      ? {
        normalDay: data.overtimeNormalDay,
        weekend: data.overtimeWeekend,
        publicHoliday: data.overtimePublicHoliday,
      }
      : undefined

    // Prepare allowances & deductions
    const allowances = data.allowancesEnable ? data.allowances : []
    const deductions = data.deductionsEnable ? data.deductions : []

    const payload = {
      name: data.name,
      basicPay,
      overtime,
      allowances,
      deductions,
    }

    const success = isEdit && sheet
      ? await handleEditPaysheet(sheet.id, payload)
      : await handleAddPaysheet(payload)

    if (success) {
      setActivePaysheetId(null)
    }
  }

  const selectedPayType = form.watch('payType')
  const watchOvertimeEnable = form.watch('overtimeEnable')
  const watchAllowancesEnable = form.watch('allowancesEnable')
  const watchDeductionsEnable = form.watch('deductionsEnable')

  let amountSuffix = '/ kì'
  let amountHelper = 'Mức lương cố định trả cho mỗi kỳ lương tính công.'
  if (selectedPayType === 'PAY_BY_SHIFT') {
    amountSuffix = '/ ca'
    amountHelper = 'Lương tính cho mỗi ca làm việc hoàn thành thực tế.'
  } else if (selectedPayType === 'STANDARD_WORKING_DAY') {
    amountSuffix = '/ ngày công'
    amountHelper = 'Lương tính theo ngày công chuẩn áp dụng.'
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setActivePaysheetId(null)}
            className="cursor-pointer size-8"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? 'Chi tiết cấu hình: ' + (sheet?.name || '') : 'Thiết lập khung lương mới'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Thiết lập lương chính, làm thêm giờ, phụ cấp và các quy định giảm trừ phạt.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card 1: Lương chính */}
          <div className="rounded-xl border bg-card text-card-foreground p-6 space-y-6 shadow-xs">
            <h3 className="text-md font-bold text-foreground">Lương chính</h3>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên cấu hình lương <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Lương cố định Quản lý chi nhánh - Nguyễn Trí" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hình thức chi trả <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Chọn loại lương" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FIXED">Lương cố định (Fixed)</SelectItem>
                        <SelectItem value="PAY_BY_SHIFT">Tính theo ca làm việc (Shift)</SelectItem>
                        <SelectItem value="STANDARD_WORKING_DAY">Theo ngày công chuẩn (Working Day)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mức lương định mức <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          inputMode="numeric"
                          placeholder="0"
                          className="tabular-nums pr-24"
                          value={field.value}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '')
                            field.onChange(digits ? formatPriceAmount(digits) : '')
                          }}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-semibold">
                          {amountSuffix}
                        </span>
                      </div>
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {amountHelper}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Overtime Sub-section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-sm font-semibold">Lương làm thêm giờ (Overtime)</FormLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hệ số lương nhân thêm khi nhân viên làm ngoài ca.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="overtimeEnable"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {watchOvertimeEnable && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="overtimeNormalDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ngày thường</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : parseFloat(val))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overtimeWeekend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ngày nghỉ cuối tuần</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : parseFloat(val))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overtimePublicHoliday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Ngày lễ tết</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val === '' ? 0 : parseFloat(val))
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Phụ cấp */}
          <div className="rounded-xl border bg-card text-card-foreground p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-foreground">Phụ cấp</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Thiết lập các khoản hỗ trợ làm việc như ăn trưa, đi lại, trách nhiệm...
                </p>
              </div>
              <FormField
                control={form.control}
                name="allowancesEnable"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {watchAllowancesEnable && (
              <div className="space-y-4">
                {allowanceFields.length === 0 && (
                  <div className="text-center py-8 border border-dashed rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Chưa cấu hình khoản phụ cấp nào.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {allowanceFields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="flex flex-wrap gap-3 items-end border p-4 rounded-lg bg-muted/20 relative">
                      <FormField
                        control={form.control}
                        name={`allowances.${index}.name`}
                        render={({ field }) => {
                          const isCustom = field.value !== '' && !PREDEFINED_ALLOWANCES.includes(field.value)
                          return (
                            <FormItem className="flex-1 min-w-[200px]">
                              <FormLabel className="text-xs">Tên phụ cấp</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  if (val === 'Khác') {
                                    field.onChange('')
                                  } else {
                                    field.onChange(val)
                                  }
                                }}
                                value={PREDEFINED_ALLOWANCES.includes(field.value) ? field.value : 'Khác'}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Chọn loại phụ cấp" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Phụ cấp ăn trưa">Phụ cấp ăn trưa</SelectItem>
                                  <SelectItem value="Phụ cấp trách nhiệm">Phụ cấp trách nhiệm</SelectItem>
                                  <SelectItem value="Phụ cấp đi lại">Phụ cấp đi lại</SelectItem>
                                  <SelectItem value="Phụ cấp xăng xe">Phụ cấp xăng xe</SelectItem>
                                  <SelectItem value="Khác">Khác...</SelectItem>
                                </SelectContent>
                              </Select>
                              {(isCustom || field.value === '') && (
                                <Input
                                  placeholder="Nhập tên phụ cấp khác"
                                  className="h-9 mt-2"
                                  {...field}
                                />
                              )}
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`allowances.${index}.amountType`}
                        render={({ field }) => (
                          <FormItem className="w-1/4 min-w-[120px]">
                            <FormLabel className="text-xs">Loại phụ cấp</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FIXED_AMOUNT">Cố định (đ)</SelectItem>
                                <SelectItem value="PERCENTAGE">Phần trăm (%)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`allowances.${index}.amountValue`}
                        render={({ field }) => {
                          return (
                            <FormItem className="w-1/4 min-w-[120px]">
                              <FormLabel className="text-xs">Mức hỗ trợ</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-9 tabular-nums"
                                  placeholder="0"
                                  value={field.value === 0 ? '' : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    field.onChange(val === '' ? 0 : Number(val))
                                  }}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )
                        }}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 cursor-pointer h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAllowance(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => appendAllowance({ name: 'Phụ cấp ăn trưa', enable: true, amountType: 'FIXED_AMOUNT', amountValue: 30000 })}
                >
                  <Plus className="mr-1.5 size-4" /> Thêm phụ cấp
                </Button>
              </div>
            )}
          </div>

          {/* Card 3: Giảm trừ */}
          <div className="rounded-xl border bg-card text-card-foreground p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold text-foreground">Giảm trừ & Phạt</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Các quy tắc phạt khi đi muộn, về sớm hoặc vi phạm nội quy.
                </p>
              </div>
              <FormField
                control={form.control}
                name="deductionsEnable"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            {watchDeductionsEnable && (
              <div className="space-y-4">
                {deductionFields.length === 0 && (
                  <div className="text-center py-8 border border-dashed rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Chưa cấu hình khoản giảm trừ nào.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {deductionFields.map((fieldItem, index) => {
                    const deductionType = form.watch(`deductions.${index}.deductionType`)
                    const conditionType = form.watch(`deductions.${index}.conditionType`)

                    return (
                      <div key={fieldItem.id} className="flex flex-wrap gap-3 items-end border p-4 rounded-lg bg-muted/20 relative">
                        <FormField
                          control={form.control}
                          name={`deductions.${index}.name`}
                          render={({ field }) => {
                            const isCustom = field.value !== '' && !PREDEFINED_DEDUCTIONS.includes(field.value)
                            return (
                              <FormItem className="flex-1 min-w-[150px]">
                                <FormLabel className="text-xs">Tên giảm trừ</FormLabel>
                                <Select
                                  onValueChange={(val) => {
                                    if (val === 'Khác') {
                                      field.onChange('')
                                      form.setValue(`deductions.${index}.deductionType`, 'FIXED')
                                    } else {
                                      field.onChange(val)
                                      if (val === 'Đi muộn') {
                                        form.setValue(`deductions.${index}.deductionType`, 'LATE')
                                        form.setValue(`deductions.${index}.conditionType`, 'BY_OCCURRENCE')
                                      } else if (val === 'Về sớm') {
                                        form.setValue(`deductions.${index}.deductionType`, 'EARLY_LEAVE')
                                        form.setValue(`deductions.${index}.conditionType`, 'BY_OCCURRENCE')
                                      } else {
                                        form.setValue(`deductions.${index}.deductionType`, 'FIXED')
                                      }
                                    }
                                  }}
                                  value={PREDEFINED_DEDUCTIONS.includes(field.value) ? field.value : 'Khác'}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Chọn loại giảm trừ" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Đi muộn">Đi muộn</SelectItem>
                                    <SelectItem value="Về sớm">Về sớm</SelectItem>
                                    <SelectItem value="Vi phạm nội quy">Vi phạm nội quy</SelectItem>
                                    <SelectItem value="Khác">Khác...</SelectItem>
                                  </SelectContent>
                                </Select>
                                {(isCustom || field.value === '') && (
                                  <Input
                                    placeholder="Nhập tên giảm trừ khác"
                                    className="h-9 mt-2"
                                    {...field}
                                  />
                                )}
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )
                          }}
                        />

                        <FormField
                          control={form.control}
                          name={`deductions.${index}.deductionType`}
                          render={({ field }) => (
                            <FormItem className="w-[160px]">
                              <FormLabel className="text-xs">Loại giảm trừ</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val)
                                  if (val === 'LATE') {
                                    form.setValue(`deductions.${index}.name`, 'Đi muộn')
                                    form.setValue(`deductions.${index}.conditionType`, 'BY_OCCURRENCE')
                                  } else if (val === 'EARLY_LEAVE') {
                                    form.setValue(`deductions.${index}.name`, 'Về sớm')
                                    form.setValue(`deductions.${index}.conditionType`, 'BY_OCCURRENCE')
                                  } else if (val === 'FIXED') {
                                    const currentName = form.getValues(`deductions.${index}.name`)
                                    if (currentName === 'Đi muộn' || currentName === 'Về sớm') {
                                      form.setValue(`deductions.${index}.name`, 'Vi phạm nội quy')
                                    }
                                  }
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="LATE">Đi muộn</SelectItem>
                                  <SelectItem value="EARLY_LEAVE">Về sớm</SelectItem>
                                  <SelectItem value="FIXED">Cố định</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />

                        {deductionType !== 'FIXED' && (
                          <FormField
                            control={form.control}
                            name={`deductions.${index}.conditionType`}
                            render={({ field }) => (
                              <FormItem className="w-[150px]">
                                <FormLabel className="text-xs">Cách tính phạt</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'BY_OCCURRENCE'}>
                                  <FormControl>
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="BY_OCCURRENCE">Theo số lần</SelectItem>
                                    <SelectItem value="BY_BLOCK">Theo block phút</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        )}

                        {deductionType !== 'FIXED' && conditionType === 'BY_BLOCK' && (
                          <FormField
                            control={form.control}
                            name={`deductions.${index}.blockMinutes`}
                            render={({ field }) => (
                              <FormItem className="w-[100px]">
                                <FormLabel className="text-xs">Mốc block (Phút)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    className="h-9"
                                    placeholder="15"
                                    value={field.value === 0 ? '' : field.value}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      field.onChange(val === '' ? 0 : Number(val))
                                    }}
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name={`deductions.${index}.deductionValue`}
                          render={({ field }) => (
                            <FormItem className="w-[120px]">
                              <FormLabel className="text-xs">Khoản giảm trừ (đ)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="h-9 tabular-nums"
                                  placeholder="0"
                                  value={field.value === 0 ? '' : field.value}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    field.onChange(val === '' ? 0 : Number(val))
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
                          className="shrink-0 cursor-pointer h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDeduction(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => appendDeduction({ name: 'Đi muộn', enable: true, deductionType: 'LATE', conditionType: 'BY_OCCURRENCE', deductionValue: 20000 })}
                >
                  <Plus className="mr-1.5 size-4" /> Thêm giảm trừ
                </Button>
              </div>
            )}
          </div>

          {/* Fixed Bottom Action Panel */}
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background py-3 px-6 flex justify-end gap-3 z-50 shadow-md">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivePaysheetId(null)}
              className="cursor-pointer sm:px-6"
            >
              Hủy bỏ / Bỏ qua
            </Button>
            <Button type="submit" className="cursor-pointer sm:px-6 bg-primary text-primary-foreground hover:bg-primary/95">
              <Save className="mr-2 size-4" />
              Lưu cấu hình lương
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
