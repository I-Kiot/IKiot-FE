export type PaySheetStatus = "ACTIVE" | "DELETED";

export type PaySheetPayType =
  | "PAY_BY_SHIFT"
  | "STANDARD_WORKING_DAY"
  | "FIXED";

export interface PaySheetBasicPay {
  payType: PaySheetPayType;
  amountPerShift?: number;
  salaryPerPeriod?: number;
  standardWorkingDaySalary?: number;
}

export interface PaySheetListItem {
  id: string;
  name: string;
  status?: PaySheetStatus;
  basicPay?: PaySheetBasicPay;
}

export interface PaySheetDetail extends PaySheetListItem {
  overtime?: unknown;
  bonuses?: unknown[];
  allowances?: unknown[];
  deductions?: unknown[];
}

export interface PaySheetOption {
  value: string;
  label: string;
  summary?: string;
}

export interface PaySheetListQueryParams {
  page?: number;
  limit?: number;
  name?: string;
}
