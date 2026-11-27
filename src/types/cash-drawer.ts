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

/** Người có thể giữ két. */
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
    /** Số chủ rút về khi chốt; null ở phiên chốt trước khi có tính năng này. */
    withdrawnAmount?: number | null;
    /** Phần để lại trong két làm tiền lẻ cho phiên sau. */
    keptAmount?: number;
  } | null;
  /** Lúc chốt; null khi còn mở. Cùng `createdAt` là khoảng mà đối soát cộng dòng tiền. */
  closedAt?: string | null;
  /** Còn mở nhưng thuộc ngày giao dịch đã qua (quên chốt). Chỉ còn ghi END không bàn giao rồi chốt. */
  overdue?: boolean;
  /** Số lần mở lại sau khi chốt nhầm, và lần gần nhất. */
  reopenCount?: number;
  lastReopenedAt?: string | null;
  lastReopenedBy?: CashDrawerUserRef | null;
  lastReopenReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Một két quá hạn. */
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
  /** `START` nhận két, `END` trả lại. */
  type?: "START" | "END";
  amount: number;
  nextStaffId?: string;
  note?: string;
}

export interface FinalizeSessionPayload {
  finalAmount: number;
  /** Số chủ rút về (chuyển quỹ Két → Chủ); phần còn lại để lại trong két. */
  withdrawAmount?: number;
  note?: string;
}

/** Tiền lẻ phiên trước để lại, `GET /cash-drawer-sessions/opening-hint`. */
export interface OpeningHint {
  branchId: string;
  keptAmount: number;
  previousSession: { id: string; businessDate: string; closedAt: string | null } | null;
}

/** Phần tổng của `GET /cash-drawer-sessions/:id/reconciliation` mà màn chốt két dùng. */
export interface CashDrawerReconciliation {
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  netCash: number;
  /** Số sổ: tiền đầu ca + thu − chi tiền mặt qua két trong phiên. */
  expectedClosing: number;
  countedClosing: number | null;
  variance: number | null;
  /** Theo từng đoạn giữa hai lần đếm: ai giữ két và lệch bao nhiêu. */
  segments?: CashSegment[];
  /** Khoản không phải tiền mặt trong phiên, chỉ để tham khảo. */
  nonCash?: { paymentMethod: string | null; flowType: "INCOME" | "EXPENSE"; amount: number; count: number }[];
}

/**
 * Một đoạn của chuỗi đếm: OPENING (mở két → người đầu nhận), SHIFT (một thu ngân giữ két),
 * GAP (giữa lúc trả và lúc người sau nhận), CLOSING (lần trả cuối → quản lý đếm chốt).
 */
export interface CashSegment {
  kind: "OPENING" | "SHIFT" | "GAP" | "CLOSING";
  staffId: string | null;
  staff?: CashDrawerUserRef | null;
  from: string | null;
  to: string | null;
  openingCount: number;
  closingCount: number | null;
  cashIn: number;
  cashOut: number;
  expected: number;
  variance: number | null;
  movementCount: number;
}

/** Một phiên trong báo cáo lịch sử két (`GET /cash-drawer-sessions/reconciliation`). */
export interface CashDrawerHistoryRow {
  sessionId: string;
  branchId: string;
  branch: CashDrawerBranchRef | null;
  businessDate: string;
  status: "OPEN" | "CLOSED";
  overdue: boolean;
  movementCount: number;
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  expectedClosing: number;
  countedClosing: number | null;
  variance: number | null;
  /** null khi còn mở, hoặc phiên chốt trước khi có tính năng rút tiền. */
  withdrawnAmount: number | null;
  keptAmount: number | null;
}

/** Tổng trên mọi phiên khớp bộ lọc, không chỉ trang đang xem. */
export interface CashDrawerHistoryTotals {
  sessions: number;
  openSessions: number;
  overdueSessions: number;
  sessionsWithVariance: number;
  totalVariance: number;
  /** Âm. */
  shortfall: number;
  shortfallSessions: number;
  overage: number;
  withdrawn: number;
}

export interface CashDrawerHistoryQuery {
  branchId?: string;
  fromDate?: string;
  toDate?: string;
  status?: "OPEN" | "CLOSED";
  varianceOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CashDrawerHistory {
  data: CashDrawerHistoryRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  totals: CashDrawerHistoryTotals;
}

/** Một thu ngân trong bảng "Theo thu ngân" (`GET /cash-drawer-sessions/reconciliation/by-cashier`). */
export interface CashierSummaryRow {
  staffId: string;
  staff: CashDrawerUserRef | null;
  /** Số ca giữ két. */
  shifts: number;
  /** Số ngày × chi nhánh có ca của người này. */
  sessions: number;
  /** Ca còn đang giữ, chưa đếm. */
  openShifts: number;
  cashIn: number;
  cashOut: number;
  /** Chênh lệch ròng các ca đã đếm: âm là thiếu. */
  variance: number;
  shortShifts: number;
  /** Âm. */
  shortfall: number;
  overShifts: number;
  overage: number;
}

/** Lệch ở đoạn không ai giữ két: không gán cho thu ngân nào. */
export interface UnattributedVariance {
  kind: "OPENING" | "GAP" | "CLOSING";
  count: number;
  variance: number;
}

export interface CashierReport {
  data: CashierSummaryRow[];
  unattributed: UnattributedVariance[];
}

/**
 * Két hôm nay của một chi nhánh (`GET /cash-drawer-sessions/today`). Mỗi chi nhánh một phiên một ngày, nên
 * CLOSED_TODAY nghĩa là hôm nay không mở két được nữa. `session` null khi người xem không được đọc phiên đó.
 */
export type CashDrawerToday =
  | { branchId: string; businessDate: string; state: "NOT_OPENED" }
  | {
      branchId: string;
      businessDate: string;
      state: "OPEN";
      sessionId: string;
      /** Két mở từ ngày trước chưa chốt. */
      overdue: boolean;
      holder: CashDrawerUserRef | null;
      session: CashDrawerSession | null;
    }
  | {
      branchId: string;
      businessDate: string;
      state: "CLOSED_TODAY";
      sessionId: string;
      closedAt: string | null;
      closedBy: CashDrawerUserRef | null;
      session: CashDrawerSession | null;
    };

