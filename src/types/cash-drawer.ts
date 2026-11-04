export interface CashDrawerUserRef {
  id: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  phoneNumber?: string;
  email?: string;
}

export interface CashDrawerBranchRef {
  id: string;
  name: string;
}

export interface CashDrawerShiftLog {
  id?: string;
  type?: "START" | "END";
  staffId: string;
  staff?: CashDrawerUserRef | null;
  amount: number;
  nextStaffId?: string | null;
  nextStaff?: CashDrawerUserRef | null;
  note?: string;
  loggedAt: string;
}

export interface CashDrawerSession {
  id: string;
  tenantId: string;
  branchId: string;
  branch?: CashDrawerBranchRef | null;
  businessDate: string;
  status: "OPEN" | "CLOSED";
  openingAmount: number;
  openedById: string;
  openedBy?: CashDrawerUserRef | null;
  currentStaffId: string;
  currentStaff?: CashDrawerUserRef | null;
  shiftLogs: CashDrawerShiftLog[];
  finalLog?: {
    amount: number;
    managerId: string;
    manager?: CashDrawerUserRef | null;
    note?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenSessionPayload {
  branchId: string;
  openingAmount: number;
  staffId: string;
}

export interface ShiftLogPayload {
  /** `START` nhận két, `END` trả lại. Server mặc định `END`; chuỗi kiểm tra cần `START` trước nên FE phải gửi được nó. */
  type?: "START" | "END";
  amount: number;
  nextStaffId?: string;
  note?: string;
}

export interface FinalizeSessionPayload {
  finalAmount: number;
  note?: string;
}
