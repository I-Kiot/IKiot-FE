export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
export type OrderPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'SEPAY';

/** Một dòng của đơn mới. **Không có giá:** server lấy `retailPrice` từ biến thể; `unitPrice` gửi từ quầy bị `whitelist` bỏ im lặng. `productName` cũng do server điền. */
export interface OrderItemPayload {
  productItemId: string;
  quantity: number;
  /** Chiết khấu nhập tay cho dòng; bỏ qua khi đơn có `appliedPromotions`. */
  discountAmount?: number;
}

/**
 * Body của `POST /orders` (hẹp hơn vẻ ngoài). `grandTotal` do server tính, không gửi.
 * `discountType` chỉ nhận `"ORDER"` (chiết khấu cả đơn của thu ngân); khuyến mãi đi qua `appliedPromotions`, gửi `"PROMOTION"` là 400. Hai cách loại trừ nhau nên là union.
 */
export type OrderCreatePayload = {
  customerId?: string;
  branchId: string;
  paymentMethod: OrderPaymentMethod;
  items: OrderItemPayload[];
  customerPay?: number;
  note?: string;
} & (
  | { discountType: "ORDER"; discountValue: number; appliedPromotions?: never }
  | { appliedPromotions: { promotionId: string }[]; discountType?: never; discountValue?: never }
  | { discountType?: never; discountValue?: never; appliedPromotions?: never }
);

export interface OrderItem {
  productItemId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  id: string;
}

export type PaymentKind = 'DEPOSIT' | 'BALANCE' | 'FULL' | 'REFUND' | 'CHANGE';
export type PaymentRecordStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED';

/** Một khoản tiền của đơn (sổ Payment). Quầy trả mảng này trong `order.payments[]`. */
export interface OrderPayment {
  id: string;
  kind: PaymentKind;
  status: PaymentRecordStatus;
  method: string;
  /** Tiền thực nhận (khoản QR chuyển thiếu thì nhỏ hơn `requestedAmount`). */
  amount: number;
  /** Số tiền mã QR đã yêu cầu; null với khoản không qua QR. */
  requestedAmount: number | null;
  paymentReference?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  remittanceNote?: string | null;
  createdAt?: string;
}

/** Số đã thu / còn phải thu của đơn quầy, tính từ `payments[]` (cùng quy tắc với BE: thu trừ hoàn trừ thối). */
export function posPaymentTotals(order: { grandTotal: number; payments?: OrderPayment[] }): {
  paid: number;
  due: number;
} {
  let paid = 0;
  for (const p of order.payments ?? []) {
    if (p.status !== 'PAID') continue;
    if (p.kind === 'REFUND' || p.kind === 'CHANGE') paid -= p.amount;
    else paid += p.amount;
  }
  paid = Math.max(0, paid);
  return { paid, due: Math.max(0, order.grandTotal - paid) };
}

export interface Order {
  id: string;
  tenantId: string;
  branchId: string;
  customerId: string;
  status: OrderStatus;
  userId: string;
  paymentMethod: OrderPaymentMethod;
  paymentReference?: string;
  sepayTransactionId?: number;
  grandTotal: number;
  customerPay?: number;
  change?: number;
  note?: string;
  items: OrderItem[];
  /** Các khoản tiền của đơn; chỉ có ở phản hồi của quầy (POS). */
  payments?: OrderPayment[];
  discountType?: "ORDER" | "PROMOTION" | null;
  discountValue?: number;
  appliedPromotions?: {
    promotionId: string;
    promoName: string;
    discountAmount: number;
    id?: string;
  }[] | null;
  /** Lúc đơn hoàn thành (null khi chưa hoàn thành). */
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreateResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    /** Null khi không thu QR, hoặc mã đã hết hạn. Không bao giờ vẽ <img> khi null. */
    qrUrl?: string | null;
    /** Hạn mã QR do server tính (nguồn sự thật cho đồng hồ đếm ngược). */
    qrExpiresAt?: string | null;
  };
}

/** `POST /orders/pos/:id/qr`: mã QR cho số còn phải thu của đơn quầy. */
export interface PosQrResponse {
  order: Order;
  qrUrl: string | null;
  qrExpiresAt: string | null;
  /** Số tiền mã yêu cầu = số còn phải thu. */
  amount: number;
}

/** Payload của socket `order:paid` (room tenant). `partial` = khách chuyển thiếu, đơn chưa hoàn thành. */
export interface OrderPaidEvent {
  orderId?: string;
  status?: string;
  paidAmount?: number;
  paymentMethod?: string;
  partial?: boolean;
  due?: number;
  paymentStatus?: string;
}

/** Hoàn tiền khi huỷ đơn quầy đã giữ tiền. */
export interface CancelPosSaleOptions {
  reason?: string;
  /** 0 = shop giữ hết. Bắt buộc khi đơn đang giữ tiền. */
  refundAmount?: number;
  refundMethod?: 'CASH' | 'BANK_TRANSFER';
}
