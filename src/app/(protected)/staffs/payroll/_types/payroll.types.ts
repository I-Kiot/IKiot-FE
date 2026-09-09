// [UI Types – Payroll]
import { z } from 'zod'

export type PayrollDialogType =
  | 'addPeriod'
  | 'editSettings'
  | 'addPaysheet'
  | 'editPaysheet'
  | 'adjustPayslip'
  | 'returnDraft'
  | 'markPaid'
  | 'viewPayslipDetail'

export const payrollSettingsSchema = z.object({
  cycle: z.string().min(1, 'Chu kỳ lương là bắt buộc'),
  approveAfterPeriodEndDays: z.number().min(0, 'Số ngày duyệt không được âm'),
  payAfterPeriodEndDays: z.number().min(0, 'Số ngày thanh toán không được âm'),
  autoGenerate: z.boolean(),
  standardWorkingDays: z
    .number()
    .min(0, 'Số ngày công chuẩn không được âm')
    .max(31, 'Số ngày công chuẩn không được vượt quá 31 ngày (ngày tối đa trong tháng)'),
  standardWorkingHoursPerDay: z.number().min(0, 'Số giờ làm việc/ngày không được âm'),
  weekendDays: z.array(z.number()),
  lateGraceMinutes: z.number().min(0, 'Thời gian đi muộn cho phép không được âm'),
})

export type PayrollSettingsFormValues = z.infer<typeof payrollSettingsSchema>

export const paysheetSchema = z.object({
  name: z.string().min(1, 'Tên cấu hình lương là bắt buộc'),
  payType: z.enum(['FIXED', 'PAY_BY_SHIFT', 'STANDARD_WORKING_DAY']),
  amount: z.string().min(1, 'Mức lương định mức là bắt buộc'),
})

export type PaysheetFormValues = z.infer<typeof paysheetSchema>

export const periodCreateSchema = z.object({
  payrollMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Tháng lương không hợp lệ'),
  userIds: z.array(z.string()).optional(),
})

export type PeriodCreateFormValues = z.infer<typeof periodCreateSchema>

export const manualCostSchema = z.object({
  type: z.enum(['BONUS', 'DEDUCTION']),
  name: z.string().min(1, 'Tên khoản điều chỉnh là bắt buộc'),
  amount: z.string().min(1, 'Số tiền là bắt buộc'),
})

export type ManualCostFormValues = z.infer<typeof manualCostSchema>

export const payslipAdjustSchema = z.object({
  note: z.string().optional(),
  manualCosts: z.array(manualCostSchema),
})

export type PayslipAdjustFormValues = z.infer<typeof payslipAdjustSchema>
