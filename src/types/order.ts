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
  discountType?: "ORDER" | "PROMOTION" | null;
  discountValue?: number;
  appliedPromotions?: {
    promotionId: string;
    promoName: string;
    discountAmount: number;
    id?: string;
  }[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreateResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    qrUrl?: string;
  };
}
