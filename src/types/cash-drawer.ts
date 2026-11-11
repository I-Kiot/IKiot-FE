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

/** Một người có thể giữ két, cho ô chọn ở màn mở két và báo cáo cuối ca. BE chỉ trả tên, không trả hồ sơ. */
export interface CashierOption {
  id: string;
  fullName: string;
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
  /** Lúc chốt; null khi còn mở. Cùng `createdAt` là khoảng mà đối soát cộng dòng tiền. */
  closedAt?: string | null;
  /** Còn mở nhưng thuộc ngày giao dịch đã qua (quên chốt). Chỉ còn ghi END không bàn giao rồi chốt. */
  overdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Một két quá hạn, từ `GET /cash-drawer-sessions/overdue` - chỉ ngày, chi nhánh và người đang giữ, không có tiền. */
export interface OverdueCashDrawer {
  id: string;
  branchId: string;
  branch: CashDrawerBranchRef | null;
  businessDate: string;
  currentStaff: CashDrawerUserRef | null;
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
