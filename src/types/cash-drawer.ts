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
  /**
   * `START` takes the drawer, `END` hands it back. The server defaults to `END`, which is
   * why omitting it worked for the "báo cáo cuối ca" screen - but the sequence check wants
   * a `START` first, and there was no way to express one from here.
   */
  type?: "START" | "END";
  amount: number;
  nextStaffId?: string;
  note?: string;
}

export interface FinalizeSessionPayload {
  finalAmount: number;
  note?: string;
}
