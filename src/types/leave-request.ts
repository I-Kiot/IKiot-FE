export type LeaveRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "DELETED";

/** UI-only classification derived from paid/unpaid days (BE has no leaveType). */
export type LeaveRequestKind = "PAID" | "UNPAID" | "MIXED" | "PENDING";

export interface ApiLeaveRequest {
  id: string;
  tenantId?: string;
  userId:
    | string
    | {
        id?: string;
        email?: string;
        phoneNumber?: string;
        role?: string;
        profile?: { firstName?: string; lastName?: string };
        branchId?: { id?: string; name?: string } | string | null;
        warehouseId?: { id?: string; name?: string } | string | null;
      };
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  startDate: string;
  endDate: string;
  status: LeaveRequestStatus;
  reason: string;
  reviewNote?: string;
  handoverToUserId?:
    | string
    | { id?: string; profile?: { firstName?: string; lastName?: string } };
  approvedBy?:
    | string
    | { id?: string; profile?: { firstName?: string; lastName?: string } };
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  id: string;
  branchName: string;
  userId: string;
  staffName: string;
  requesterRole?: string;
  reason: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  paidLeaveDays?: number;
  unpaidLeaveDays?: number;
  kind: LeaveRequestKind;
  status: LeaveRequestStatus;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export interface LeaveListQuery {
  page: number;
  limit: number;
  status: LeaveRequestStatus | "all";
  search: string;
}

export interface LeaveRequestQueryParams {
  page?: number;
  limit?: number;
  status?: LeaveRequestStatus;
  branchId?: string;
  warehouseId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/** Calendar overlay from GET /leave-requests/me/per-day */
export interface LeaveRequestPerDay {
  id: string;
  date: string;
  status: LeaveRequestStatus;
  reason: string;
}

export interface LeaveRequestPerDayQueryParams {
  status?: LeaveRequestStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface LeaveRequestListApiResponse {
  success?: boolean;
  message?: string;
  data: ApiLeaveRequest[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LeaveRequestListResponse {
  data: LeaveRequest[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreatePersonalLeavePayload {
  startDate: string;
  endDate: string;
  reason: string;
  handoverToUserId?: string;
}

export interface CreateEmergencyLeavePayload {
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ApproveLeavePayload {
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  reviewNote?: string;
}

export interface LeaveBalance {
  annualLeaveDays: number;
  remainingDays: number;
  usedDays: number;
}

export interface HandoverPreview {
  requiresHandover: boolean;
  count: number;
  message?: string;
}

export type LeaveRequestUserContext = {
  role?: string | null;
};

export type LeaveStaffOption = {
  value: string;
  label: string;
  role?: string;
};
