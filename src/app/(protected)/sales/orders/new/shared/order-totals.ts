// [Totals – manual order form] The estimate the form shows while it is being filled. The server
// prices the order (`OrderPricingService`) and is the only authority: after create the detail page
// shows its figures. The rounding here mirrors it so the two agree to the đồng:
// each line is rounded before its discount comes off, the whole-order discount is capped at what
// the goods are worth, shipping is added on top.

export interface TotalsLine {
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export type DepositType = "NONE" | "AMOUNT" | "PERCENT";

export interface TotalsInput {
  lines: TotalsLine[];
  /** Whole-order discount, đồng. */
  orderDiscount: number;
  shippingFee: number;
  depositType: DepositType;
  /** đồng for AMOUNT, a percentage for PERCENT. */
  depositValue: number;
}

export interface Totals {
  goods: number;
  orderDiscount: number;
  shippingFee: number;
  grandTotal: number;
  /** What the customer hands over now. */
  depositAmount: number;
  /** The same sum as a percentage of the total (0 without a deposit). */
  depositPercent: number;
  amountDue: number;
  /** Why the deposit cannot be sent, or null. */
  depositError: string | null;
}

export const lineTotal = (line: TotalsLine): number =>
  Math.max(0, Math.round(line.quantity * line.unitPrice) - line.discountAmount);

export function computeTotals(input: TotalsInput): Totals {
  const goods = input.lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const orderDiscount = Math.min(Math.max(0, input.orderDiscount), goods);
  const shippingFee = Math.max(0, input.shippingFee);
  const grandTotal = Math.max(0, Math.round(goods - orderDiscount)) + shippingFee;

  let depositAmount = 0;
  let depositError: string | null = null;
  if (input.depositType === "PERCENT") {
    if (input.depositValue > 100) {
      depositError = "Tiền cọc theo % không được vượt quá 100%.";
    } else {
      depositAmount = Math.round((grandTotal * Math.max(0, input.depositValue)) / 100);
    }
  } else if (input.depositType === "AMOUNT") {
    depositAmount = Math.round(Math.max(0, input.depositValue));
    if (depositAmount > grandTotal) {
      depositError = "Tiền cọc không được vượt quá tổng tiền đơn hàng.";
    }
  }

  return {
    goods,
    orderDiscount,
    shippingFee,
    grandTotal,
    depositAmount,
    depositPercent: grandTotal > 0 ? Math.round((depositAmount / grandTotal) * 1000) / 10 : 0,
    amountDue: Math.max(0, grandTotal - depositAmount),
    depositError,
  };
}

export type StockLevel = "ENOUGH" | "SHORT" | "OUT";

/** Informational only: a manual order is never blocked for lack of stock (contract §2). */
export function stockLevel(stock: number, quantity: number): { level: StockLevel; missing: number } {
  if (stock <= 0) return { level: "OUT", missing: quantity };
  if (stock < quantity) return { level: "SHORT", missing: quantity - stock };
  return { level: "ENOUGH", missing: 0 };
}

export const formatVND = (value: number): string =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
