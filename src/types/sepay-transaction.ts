// Sổ giao dịch SePay của shop: `GET /sepay-transactions` (cash_flows:read), `POST /sepay-transactions/:id/resolve` (cash_flows:update).

export type SepayOutcome = "SETTLED" | "SETTLED_LATE" | "SETTLED_PARTIAL" | "REJECTED" | "UNMATCHED";

export const SEPAY_OUTCOME_LABELS: Record<SepayOutcome, string> = {
  SETTLED: "Đã chốt",
  SETTLED_LATE: "Đã chốt (QR hết hạn)",
  SETTLED_PARTIAL: "Chuyển thiếu",
  REJECTED: "Không chốt được",
  UNMATCHED: "Không gắn được đơn",
};

/** Lý do không chốt được. Mã lạ hiện nguyên mã. */
export const SEPAY_REJECT_REASON_LABELS: Record<string, string> = {
  ORDER_CANCELLED: "Đơn đã bị huỷ",
  ALREADY_PAID: "Đơn đã thu đủ",
  PAYMENT_SUPERSEDED: "Khoản thu đã bị huỷ hoặc thay bằng mã khác",
  ORDER_NOT_WAITING: "Đơn không còn chờ khoản này",
  NO_REFERENCE: "Nội dung chuyển khoản không có mã đơn",
  UNKNOWN_REFERENCE: "Mã đơn không khớp khoản nào của shop",
  UNKNOWN_TENANT: "Tài khoản nhận không thuộc shop nào",
};

export type SepayResolution = "REFUNDED_MANUALLY" | "MATCHED_MANUALLY" | "IGNORED";

export const SEPAY_RESOLUTION_LABELS: Record<SepayResolution, string> = {
  REFUNDED_MANUALLY: "Đã hoàn tiền cho khách",
  MATCHED_MANUALLY: "Đã đối chiếu với đơn",
  IGNORED: "Bỏ qua",
};

export interface SepayTransaction {
  id: string;
  /** BE có thể thêm kết cục mới: chịu được giá trị lạ. */
  outcome: SepayOutcome | string;
  rejectReason: string | null;
  amount: number;
  /** Khách trả dư so với số còn phải thu (0 nếu không dư). */
  excessAmount: number;
  paymentReference: string | null;
  content: string | null;
  sepayTransactionId: string | null;
  order: { id: string; code: string } | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: {
    id: string;
    phoneNumber: string;
    profile?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
  resolution: SepayResolution | string | null;
  resolutionNote: string | null;
}

export interface SepayTransactionQuery {
  outcome?: string;
  /** Chỉ những dòng còn việc phải làm. */
  unresolved?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}
