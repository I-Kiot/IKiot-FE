// [Domain – Types] Invoices (BE `invoices/`): one SALE invoice per order - PENDING until the order is
// COMPLETED, then ISSUED - and an ADJUSTMENT (negative total) for goods returned afterwards.
import type { FulfillmentType } from "@/types/order-flow";

export const INVOICE_STATUSES = ["PENDING", "ISSUED", "CANCELLED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceType = "SALE" | "ADJUSTMENT";

/** COUNTER = rung up at the till (order `fulfillmentType` TAKEAWAY); ORDERED = an order taken to be fulfilled later. */
export type InvoiceKind = "COUNTER" | "ORDERED";

export interface InvoiceLineDto {
  id: string;
  orderItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  /** Net of the line's discount; negative on an ADJUSTMENT. */
  amount: number;
  position: number;
}

export interface InvoiceDto {
  id: string;
  /** Null until ISSUED. */
  invoiceNumber: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  kind: InvoiceKind;
  originalInvoiceId: string | null;
  reason: string | null;
  subtotal: number;
  vatAmount: number;
  total: number;
  buyerName: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    code: string;
    status: string;
    fulfillmentType: string;
    paymentMethod: string | null;
    paymentStatus: string;
    customerPay: number | null;
    change: number | null;
    note: string | null;
  };
  branch: { id: string; name: string } | null;
  customer: {
    id: string;
    customerCode: string | null;
    name: string;
    phone: string | null;
    gender: string | null;
    address: string | null;
  };
  seller: { id: string; name: string; phoneNumber: string } | null;
  lines: InvoiceLineDto[];
}

export interface InvoiceQuery {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  type?: InvoiceType;
  kind?: InvoiceKind;
  fulfillmentType?: FulfillmentType;
  branchId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}
