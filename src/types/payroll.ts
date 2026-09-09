// [Domain – Types]
export type PayrollCycle = 'MONTHLY' | 'WEEKLY' | string;
export type PeriodStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PAID';
export type AdjustmentType = 'BONUS' | 'DEDUCTION';

export interface PayrollSettings {
  id?: string;
  cycle: PayrollCycle;
  approveAfterPeriodEndDays: number;
  payAfterPeriodEndDays: number;
  autoGenerate: boolean;
  standardWorkingDays: number;
  standardWorkingHoursPerDay: number;
  weekendDays: number[];
  lateGraceMinutes: number;
}

export interface PaySheet {
  id: string;
  tenantId?: string;
  createdBy?: string;
  name: string;
  status?: string;
  basicPay: {
    payType: 'PAY_BY_SHIFT' | 'STANDARD_WORKING_DAY' | 'FIXED';
    amountPerShift?: number;
    salaryPerPeriod?: number;
    standardWorkingDaySalary?: number;
    rates?: {
      weekend?: number;
      publicHoliday?: number;
    };
  };
  overtime?: {
    normalDay?: number;
    weekend?: number;
    publicHoliday?: number;
  };
  allowances?: {
    name: string;
    enable: boolean;
    amountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
    amountValue: number;
  }[];
  deductions?: {
    name: string;
    enable: boolean;
    deductionType: 'LATE' | 'EARLY_LEAVE' | 'FIXED';
    conditionType?: 'BY_OCCURRENCE' | 'BY_BLOCK';
    blockMinutes?: number;
    deductionValue: number;
  }[];
  bonuses?: unknown[];
  createdAt?: string;
  updatedAt?: string;
}

export type PaySheetCreatePayload = Omit<PaySheet, 'id' | 'createdAt' | 'updatedAt'>;
export type PaySheetUpdatePayload = Partial<PaySheetCreatePayload>;

export interface ManualAdjustment {
  id?: string;
  category: 'SALARY_ADVANCE' | 'TET_BONUS' | 'OTHER';
  name: string;
  amount: number;
  note?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface LeaveDay {
  date: string;
  leaveType: 'PAID' | 'UNPAID';
  dayFraction: number;
  amount: number;
  ignoredBecauseAttended: boolean;
}

export interface LeaveLine {
  leaveRequestId: string;
  paidDays: number;
  unpaidDays: number;
  paidAmount: number;
  deductedAmount: number;
  dates: LeaveDay[];
}

export interface AllowanceLine {
  name: string;
  amountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  amountValue: number;
  amount: number;
}

export interface DeductionLine {
  name: string;
  deductionType: 'LATE' | 'EARLY_LEAVE' | 'FIXED';
  conditionType?: 'BY_OCCURRENCE' | 'BY_BLOCK';
  blockMinutes?: number;
  violationMinutes?: number;
  units?: number;
  amount: number;
}

export interface Payslip {
  id: string;
  paySheetId?: string;
  payrollPeriodId?: string;
  periodStart?: string;
  periodEnd?: string;
  userId: {
    id: string;
    phoneNumber: string;
    role: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
    };
  };
  // Worked time
  baseSalary?: number;
  basePay?: number;
  standardWorkingDays?: number;
  actualWorkingDays?: number;
  totalWorkedDays?: number;
  standardWorkingHours?: number;
  actualWorkingHours?: number;
  totalWorkedHours?: number;
  lateMinutes?: number;
  latePenalty?: number;
  overtimeHours?: number;
  overtimePay?: number;
  // Leave
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  paidLeavePay?: number;
  unpaidLeaveDeduction?: number;
  leaveLines?: LeaveLine[];
  // Pay summary
  grossSalary?: number;
  allowance?: number;
  allowanceLines?: AllowanceLine[];
  bonus?: number;
  deduction?: number;
  deductionLines?: DeductionLine[];
  netSalary: number;
  // Editable in DRAFT
  note?: string;
  manualAdjustments?: ManualAdjustment[];
  status?: string;
  // Preview-only embedded user info
  user?: {
    profile?: {
      firstName?: string;
      lastName?: string;
    };
    email?: string;
    phoneNumber?: string;
  };
}

export interface PayrollPeriod {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PeriodStatus;
  payslips: Payslip[];
  totalCost?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PeriodCreatePayload {
  payrollMonth: string;
  userIds?: string[];
}

/**
 * `POST /payroll/preview` takes the explicit range - `PreviewPayrollDto` is
 * `{ periodStartDate, periodEndDate, userIds }`.
 *
 * `payrollMonth` used to sit here too, under a comment about staying compatible "while the
 * new BE rolls out to Render". That rollout is done and the key has never been read: it is
 * `POST /payroll/periods` (`GeneratePayrollDto`) that takes a month.
 */
export interface PreviewPayload {
  periodStartDate: string;
  periodEndDate: string;
  userIds?: string[];
}

export interface PreviewResult {
  periodStart: string;
  periodEnd: string;
  payslips: Payslip[];
  skipped: { userId: string; reason: string }[];
  summary: {
    totalEmployees: number;
    generatedCount: number;
    skippedCount: number;
    totalBasePay: number;
    totalOvertimePay: number;
    totalGrossSalary: number;
    totalNetSalary: number;
    totalCost?: number;
  };
}

export interface PayrollPeriodQueryParams {
  page?: number;
  limit?: number;
  status?: PeriodStatus;
}
