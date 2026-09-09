// [Domain – Types]
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'RETURNED';
export type OrderPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY' | 'SEPAY';

/**
 * One line of a new order. **The price is not on it.** `OrderService.priceLines` reads
 * `retailPrice` off the variant, so a `unitPrice` sent from the till was either redundant
 * or a lie; `CreateOrderDto` doesn't declare it and `whitelist: true` dropped it in
 * silence. Same for `productName`, which the server copies off the product.
 */
export interface OrderItemPayload {
  productItemId: string;
  quantity: number;
  /** A manual per-line discount. Ignored on a sale that carries `appliedPromotions`. */
  discountAmount?: number;
}

/**
 * The body of `POST /orders` - mirrors `CreateOrderDto`, which is narrower than it looks.
 *
 * `grandTotal` is **computed, never sent**: the old API stored whatever the client claimed,
 * so a crafted request could ring up a full basket for zero.
 *
 * `discountType` accepts **only `"ORDER"`** - the cashier's own whole-order discount.
 * A promotion sale is expressed by `appliedPromotions` alone, and the server prices it,
 * spreads it across the lines and records the total; sending `"PROMOTION"` is a 400.
 * The two are mutually exclusive, which is why they sit in a union here rather than as
 * three independent optional fields.
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
