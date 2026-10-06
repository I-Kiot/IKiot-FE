// [Domain – Types] Hành trình đơn hàng (P0-6, 2026-10-02).
//
// Mirror of Ikiot_BE/docs/api-contract-order-flow.md and the BE constants in
// src/common/constants/*-status.ts. Owned by Phase 0: change the contract first, then this
// file - never one without the other.

// ─── Shared ─────────────────────────────────────────────────────────────────

export interface UserRef {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface LocationRef {
  id: string;
  name: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PageQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Statuses (same strings as the BE constants) ────────────────────────────

// Order statuses per contract §2 (revised 2026-10-04): DRAFT, READY_TO_PACK and DELIVERED are
// gone; PICKED_UP and RECEIVED are new. Labels are the journey's own words.
export const ORDER_STATUSES = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PACKED",
  "PICKED_UP",
  "SHIPPING",
  "RECEIVED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  /** Legacy till state (awaiting SePay) until A-2 retires it. */
  "PENDING",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Xác nhận",
  PACKED: "Đóng đơn",
  PICKED_UP: "ĐVVC đã lấy hàng",
  SHIPPING: "Đang vận chuyển",
  RECEIVED: "Đã nhận hàng",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn",
  PENDING: "Chờ thanh toán",
};

/** A line has no stock-held states any more: whether its goods are there is `stockCheck`, not a status. */
export const ORDER_ITEM_STATUSES = [
  "PENDING",
  "SHIPPED",
  "CANCELLED",
  "RETURNED",
] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

export const ORDER_ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  PENDING: "Chờ xử lý",
  SHIPPED: "Đã xuất kho",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn",
};

/** The tag staff pick the next order to pack by (journey GĐ1 – Bước 3). */
export const ORDER_PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Gấp",
};

/** A line's stockCheck / an order's stockSummary (its worst line) - worked out when read, not held. */
export const STOCK_CHECK_STATUSES = ["ENOUGH", "PARTIAL", "OUT"] as const;
export type StockCheckStatus = (typeof STOCK_CHECK_STATUSES)[number];

export const STOCK_CHECK_STATUS_LABELS: Record<StockCheckStatus, string> = {
  ENOUGH: "Đủ hàng",
  PARTIAL: "Thiếu một phần",
  OUT: "Hết hàng",
};

/** Has the cash a shipper collected reached the owner? */
export const REMITTANCE_STATUSES = ["NOT_APPLICABLE", "PENDING", "RECEIVED"] as const;
export type RemittanceStatus = (typeof REMITTANCE_STATUSES)[number];

export const REMITTANCE_STATUS_LABELS: Record<RemittanceStatus, string> = {
  NOT_APPLICABLE: "Không áp dụng",
  PENDING: "Chờ nộp tiền",
  RECEIVED: "Đã nộp tiền",
};

export type CollectionMethod = "CASH" | "BANK_TRANSFER_QR" | "NONE";

export const COLLECTION_METHOD_LABELS: Record<CollectionMethod, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER_QR: "Chuyển khoản QR",
  NONE: "Không phải thu (đã cọc đủ)",
};

export type OrderLineType = "PRODUCT" | "COMBO" | "COMBO_COMPONENT" | "SERVICE";
export type OrderChannel = "MANUAL" | "SHOPEE";
export type FulfillmentType = "TAKEAWAY" | "STORE_PICKUP" | "HOME_DELIVERY";

export const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  TAKEAWAY: "Mang về",
  STORE_PICKUP: "Nhận tại cửa hàng",
  HOME_DELIVERY: "Giao tận nơi",
};

export type OrderPaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export const ORDER_PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PARTIALLY_PAID: "Đã cọc",
  PAID: "Đã thanh toán đủ",
  PARTIALLY_REFUNDED: "Hoàn tiền một phần",
  REFUNDED: "Đã hoàn tiền",
};

export type ProductionRequestStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

export const PRODUCTION_REQUEST_STATUS_LABELS: Record<ProductionRequestStatus, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi xưởng",
  PARTIALLY_RECEIVED: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
};

export type FulfillmentStatus =
  | "PENDING"
  | "PICKING"
  | "PICKED"
  | "PACKING"
  | "PACKED"
  | "HANDED_OVER"
  | "EXCEPTION"
  | "CANCELLED";

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  PENDING: "Chờ xử lý lấy hàng",
  PICKING: "Đang lấy hàng",
  PICKED: "Đã lấy đủ hàng",
  PACKING: "Đang đóng gói",
  PACKED: "Đã đóng gói xong",
  HANDED_OVER: "Đã bàn giao vận chuyển",
  EXCEPTION: "Có sự cố",
  CANCELLED: "Đã huỷ",
};

export type ShipmentStatus =
  | "CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  CREATED: "Đã tạo vận đơn",
  PICKED_UP: "DVVC đã nhận hàng",
  IN_TRANSIT: "Đang vận chuyển",
  OUT_FOR_DELIVERY: "Đang giao đến người nhận",
  DELIVERED: "Đã giao đến người nhận",
  FAILED: "Giao hàng thất bại",
  RETURNED: "Đã hoàn hàng",
  CANCELLED: "Đã huỷ",
};

export type CarrierType = "INTERNAL" | "EXTERNAL";

export const CARRIER_TYPE_LABELS: Record<CarrierType, string> = {
  INTERNAL: "Shipper / thợ của shop",
  EXTERNAL: "Đơn vị vận chuyển",
};

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  MANUAL: "Tạo tay",
  SHOPEE: "Shopee",
};

/** Contract §5. "Restocked / recorded as damaged" is per line (`condition`), not a status. */
export type OrderReturnStatus = "REQUESTED" | "INSPECTING" | "COMPLETED" | "CANCELLED";

export type OrderReturnReason = "CUSTOMER_RETURN" | "DELIVERY_FAILED";
export type ReturnCondition = "GOOD" | "DAMAGED";

export const ORDER_RETURN_STATUS_LABELS: Record<OrderReturnStatus, string> = {
  REQUESTED: "Yêu cầu hoàn",
  INSPECTING: "Đang kiểm tra hàng hoàn",
  COMPLETED: "Hoàn tất xử lý",
  CANCELLED: "Đã huỷ",
};

export const ORDER_RETURN_REASON_LABELS: Record<OrderReturnReason, string> = {
  CUSTOMER_RETURN: "Khách trả hàng",
  DELIVERY_FAILED: "Giao thất bại",
};

export const RETURN_CONDITION_LABELS: Record<ReturnCondition, string> = {
  GOOD: "Nguyên vẹn",
  DAMAGED: "Hỏng",
};
export type SupplierType = "GOODS" | "WORKSHOP";
export type ImportSource = "SUPPLIER" | "WORKSHOP";

// ─── Orders (track A BE / track D FE) ───────────────────────────────────────

export interface OrderItemSpec {
  name: string;
  value: string;
  unit?: string | null;
}

export interface OrderItemCustomization {
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  material?: string | null;
  color?: string | null;
  fabricCode?: string | null;
  note?: string | null;
  attachmentUrls: string[];
  specs: OrderItemSpec[];
}

export interface OrderLine {
  id: string;
  productItemId: string;
  productName: string | null;
  sku: string | null;
  variantLabel: string | null;
  status: OrderItemStatus;
  lineType: OrderLineType;
  parentItemId: string | null;
  quantity: number;
  listUnitPrice: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  returnedQuantity: number;
  isCustom: boolean;
  /** Read against on-shelf stock; null for COMBO / SERVICE lines and once the line has shipped. */
  stockCheck: StockCheck | null;
}

/** A line as `GET /orders/:id` returns it: plus where it ships from and its custom specs. */
export interface OrderDetailLine extends OrderLine {
  sourceLocation: LocationRef | null;
  customization: OrderItemCustomization | null;
}

export interface StockCheck {
  status: StockCheckStatus;
  /** On-shelf stock at the line's source location (stock − locked). */
  stock: number;
  shortQuantity: number;
}

/** What was collected on delivery; null until then. */
export interface OrderCollection {
  method: CollectionMethod;
  amount: number;
  collectedBy: UserRef | null;
  collectedAt: string | null;
  cashRemittanceStatus: RemittanceStatus;
  remittanceConfirmedBy: UserRef | null;
  remittanceConfirmedAt: string | null;
}

export interface OrderListItem {
  id: string;
  code: string;
  status: OrderStatus;
  channel: OrderChannel;
  priority: OrderPriority;
  branch: LocationRef;
  customer: { id: string; name: string; phone: string | null };
  assignee: UserRef | null;
  createdBy: UserRef | null;
  confirmedBy: UserRef | null;
  confirmedAt: string | null;
  /** Who confirmed SHIPPING (the stock deduction), and when. */
  shippedBy: UserRef | null;
  shippedAt: string | null;
  fulfillmentType: FulfillmentType;
  subtotal: number;
  shippingFee: number;
  channelFee: number;
  vatTotal: number;
  discountType: "ORDER" | "PROMOTION" | null;
  discountValue: number;
  grandTotal: number;
  /** `percent` is null when the deposit was typed as an amount. */
  deposit: { amount: number; percent: number | null } | null;
  /** grandTotal − deposit: what the shipper collects on delivery. Server-computed. */
  amountDue: number;
  collection: OrderCollection | null;
  paymentStatus: OrderPaymentStatus;
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
  /** `YYYY-MM-DD`. */
  requestedDeliveryDate: string | null;
  shipByDate: string | null;
  channelOrderRef: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  /** Top-level lines - a combo counts once. */
  itemCount: number;
  /** The worst line's stockCheck; null once shipped or with no stock-carrying lines. */
  stockSummary: StockCheckStatus | null;
  /** The list keeps each order's lines (POS reads them off the same route). */
  items: OrderLine[];
}

export interface OrderDetail extends Omit<OrderListItem, "items" | "itemCount" | "stockSummary"> {
  items: OrderDetailLine[];
  shipments: {
    id: string;
    status: ShipmentStatus;
    carrierType: CarrierType;
    carrierName: string | null;
    trackingCode: string | null;
    driver: UserRef | null;
  }[];
  returns: { id: string; code: string; status: OrderReturnStatus }[];
}

export const ORDER_SORTS = ["createdAt", "requestedDeliveryDate", "priority"] as const;
/** Each has one fixed direction: newest first, soonest delivery first, most urgent first. */
export type OrderSort = (typeof ORDER_SORTS)[number];

export interface OrderJourneyQuery extends PageQuery {
  status?: OrderStatus;
  channel?: OrderChannel;
  assigneeId?: string;
  branchId?: string;
  priority?: OrderPriority;
  stockSummary?: StockCheckStatus;
  cashRemittanceStatus?: RemittanceStatus;
  /** Creation-date window, ISO. */
  from?: string;
  to?: string;
  sort?: OrderSort;
}

export interface CreateOrderLinePayload {
  productItemId: string;
  quantity: number;
  /** Agreed price; omit for the catalogue price. */
  unitPrice?: number;
  discountAmount?: number;
  sourceLocationId?: string;
  /** Present → a custom (made-to-order) line. */
  customization?: OrderItemCustomization;
}

export interface CreateOrderJourneyPayload {
  branchId: string;
  customerId?: string;
  customer?: { name: string; phone?: string; address?: string };
  /** Required: the person in charge is picked on the form (ORDER_ASSIGNEE_REQUIRED / _INVALID). */
  assigneeId: string;
  /** The journey's two kinds only; TAKEAWAY is the till's. */
  fulfillmentType: "STORE_PICKUP" | "HOME_DELIVERY";
  priority?: OrderPriority;
  items: CreateOrderLinePayload[];
  shippingFee?: number;
  discountType?: "ORDER";
  discountValue?: number;
  appliedPromotions?: { promotionId: string }[];
  /** Money taken now. `value` is đồng for AMOUNT, a percentage (0 < value ≤ 100) for PERCENT. */
  deposit?: { type: "AMOUNT" | "PERCENT"; value: number; method: "CASH" | "BANK_TRANSFER" };
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
  note?: string;
}

/** `PATCH /orders/:id` (A-8) takes the same fields as create. */
export type UpdateDraftOrderPayload = CreateOrderJourneyPayload;

export interface ConfirmOrderPayload {
  assigneeId?: string;
  sourceLocationId?: string;
  lines?: { orderItemId: string; sourceLocationId: string }[];
}

// ─── Production requests & imports (track B) ────────────────────────────────

export interface ProductionRequestLine {
  id: string;
  productItemId: string;
  sku: string | null;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  note: string | null;
  orderItem: { id: string; orderId: string; orderCode: string | null; isCustom: boolean } | null;
}

export interface ProductionRequest {
  id: string;
  code: string;
  status: ProductionRequestStatus;
  supplier: { id: string; supplierName: string; phoneNumber: string | null };
  location: LocationRef & { type: "BRANCH" | "WAREHOUSE" };
  expectedReadyDate: string | null;
  sentAt: string | null;
  note: string | null;
  createdBy: UserRef | null;
  statusUpdatedBy: UserRef | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProductionRequestLine[];
}

export interface ProductionRequestQuery extends PageQuery {
  status?: ProductionRequestStatus;
  supplierId?: string;
  locationId?: string;
}

export interface ProductionRequestLinePayload {
  productItemId: string;
  quantity: number;
  orderItemId?: string;
  note?: string;
}

export interface CreateProductionRequestPayload {
  supplierId: string;
  locationId: string;
  expectedReadyDate?: string;
  note?: string;
  items: ProductionRequestLinePayload[];
}

export interface UpdateProductionRequestStatusPayload {
  status: "SENT" | "COMPLETED" | "CANCELLED";
  note?: string;
}

export interface Shortage {
  locationId: string;
  locationName: string;
  productItemId: string;
  sku: string | null;
  productName: string;
  available: number;
  waitingQuantity: number;
  onOrderQuantity: number;
  shortQuantity: number;
}

// ─── Fulfillment & delivery (track C) ───────────────────────────────────────

export interface FulfillmentLine {
  id: string;
  orderItemId: string;
  productName: string | null;
  sku: string | null;
  quantity: number;
  qtyPicked: number;
  qtyPacked: number;
  packagesRequired: number;
}

export interface FulfillmentPackage {
  id: string;
  code: string;
  productPackageId: string | null;
  weightKg: number | null;
  photoUrls: string[];
  packedBy: UserRef | null;
  packedAt: string;
}

export interface Fulfillment {
  id: string;
  status: FulfillmentStatus;
  order: {
    id: string;
    code: string | null;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;
    customerName: string;
    assigneeId: string | null;
  };
  location: LocationRef;
  assignee: UserRef | null;
  verifiedBy: UserRef | null;
  verifiedAt: string | null;
  dueDate: string | null;
  pickStartedAt: string | null;
  pickedAt: string | null;
  packStartedAt: string | null;
  packedAt: string | null;
  handedOverAt: string | null;
  exceptionNote: string | null;
  createdAt: string;
  items: FulfillmentLine[];
  packages: FulfillmentPackage[];
}

export interface FulfillmentQuery extends PageQuery {
  status?: FulfillmentStatus;
  locationId?: string;
  assigneeId?: string;
}

export interface UpdateFulfillmentItemsPayload {
  items: { orderItemId: string; qtyPicked?: number; qtyPacked?: number; pickedFromId?: string }[];
}

export interface AddFulfillmentPackagePayload {
  productPackageId?: string;
  weightKg?: number;
  photoUrls: string[];
}

/**
 * Đơn chờ đóng gói - đúng phần `GET /orders?status=CONFIRMED` trả về mà màn Đóng hàng đọc.
 * Khai báo hẹp riêng thay vì dùng `OrderListItem`, vì type đó đang lệch response thật của BE.
 */
export interface PackableOrder {
  id: string;
  code: string;
  createdAt: string;
  branch: LocationRef;
  customer: { id: string; name: string; phone: string | null };
  items: { id: string; productName: string | null; sku: string | null; quantity: number }[];
}

/** Kết quả `POST /orders/:id/pack` - phần màn hình cần (BE trả cả Fulfillment kèm items). */
export interface PackResult {
  id: string;
  packages: { id: string; code: string }[];
}

/** Một người trong payload của BE: `{ id, phoneNumber, profile }` (`withNestedProfile`). */
export interface PersonRef {
  id: string;
  phoneNumber: string;
  profile: { firstName: string | null; lastName: string | null; avatarUrl: string | null };
}

/** Tên hiển thị: "Họ Tên", không có thì số điện thoại. */
export function personName(person: PersonRef | null | undefined): string {
  if (!person) return "";
  const name = `${person.profile?.lastName ?? ""} ${person.profile?.firstName ?? ""}`.trim();
  return name || person.phoneNumber;
}

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  source: "MANUAL" | "CARRIER";
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  createdBy: PersonRef | null;
  occurredAt: string;
}

/** Một dòng của `GET /shipments` – không kèm nhật trình. */
export interface ShipmentSummary {
  id: string;
  status: ShipmentStatus;
  carrierType: CarrierType;
  carrierName: string | null;
  trackingCode: string | null;
  order: { id: string; code: string; status: OrderStatus; customerName: string; amountDue: number };
  fulfillmentId: string;
  driver: PersonRef | null;
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
  scheduledDate: string | null;
  scheduledSlot: string | null;
  deliveredAt: string | null;
  requiresInstallation: boolean;
  installedAt: string | null;
  proofPhotoUrls: string[];
  shippingCost: number | null;
  note: string | null;
  createdAt: string;
}

/** `GET /shipments/:id` và kết quả mọi thao tác ghi – kèm nhật trình. */
export interface Shipment extends ShipmentSummary {
  events: ShipmentEvent[];
  /** Khoản thu QR lúc giao (nếu đã chọn QR), để mở lại mã QR; `null` khi không có. */
  payment: ShipmentQrPayment | null;
}

export interface ShipmentQuery extends PageQuery {
  status?: ShipmentStatus;
  carrierType?: CarrierType;
  driverId?: string;
  /** `YYYY-MM-DD`, trọn ngày theo giờ Việt Nam. */
  from?: string;
  to?: string;
}

/** Body `POST /shipments` – "ĐVVC đã lấy hàng" cho một đơn đã đóng gói. */
export interface CreateShipmentPayload {
  orderId: string;
  carrierType: CarrierType;
  carrierName?: string;
  trackingCode?: string;
  driverId?: string;
  scheduledDate?: string;
  scheduledSlot?: string;
  requiresInstallation?: boolean;
  shippingCost?: number;
  note?: string;
}

/** Nhật trình chỉ mang "Đang đi giao" (chốt 2026-10-06). */
export interface ShipmentEventPayload {
  status: "OUT_FOR_DELIVERY";
  note?: string;
  latitude?: number;
  longitude?: number;
}

/** Một người chọn được làm shipper (`GET /shipments/drivers`). */
export interface DriverOption extends PersonRef {
  systemRole: string;
  isAssignee: boolean;
}

/** Đơn chờ giao cho vận chuyển – phần `GET /orders?status=PACKED` mà màn Giao hàng đọc. */
export interface HandOverReadyOrder {
  id: string;
  code: string;
  createdAt: string;
  branch: LocationRef;
  customer: { id: string; name: string; phone: string | null };
  recipientName: string | null;
  recipientPhone: string | null;
  deliveryAddress: string | null;
}

/** Cách shipper thu số còn phải thu khi giao: tiền mặt, chuyển khoản QR, hoặc không còn gì phải thu (đã cọc đủ). */
export type DeliveryCollectionMethod = "CASH" | "BANK_TRANSFER_QR" | "NONE";

/** Body `POST /shipments/:id/deliver` – giao thành công. Chỉ thu đủ 100%: `collectedAmount` phải bằng số còn phải thu. */
export interface DeliverShipmentPayload {
  /** Ảnh bằng chứng (URL từ `POST /uploads`), ít nhất 1 ảnh. */
  proofPhotoUrls: string[];
  paymentMethod: DeliveryCollectionMethod;
  collectedAmount: number;
  note?: string;
  latitude?: number;
  longitude?: number;
}

/** Khoản thu QR lúc giao trên lần giao: `qrUrl` chỉ có khi còn chờ tiền về. */
export interface ShipmentQrPayment {
  reference: string;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  qrUrl: string | null;
}

// ─── Returns (track D) ──────────────────────────────────────────────────────

export interface OrderReturnLine {
  id: string;
  orderItemId: string;
  productName: string | null;
  sku: string | null;
  quantity: number;
  condition: ReturnCondition | null;
  location: LocationRef | null;
  note: string | null;
}

export interface OrderReturn {
  id: string;
  code: string;
  status: OrderReturnStatus;
  reason: OrderReturnReason;
  order: { id: string; code: string | null; customerName: string; assigneeId: string | null };
  shipmentId: string | null;
  note: string | null;
  /** The new order a customer placed to buy the goods again (GĐ2 – 3B). */
  replacementOrder: { id: string; code: string | null } | null;
  createdBy: UserRef | null;
  receivedBy: UserRef | null;
  receivedAt: string | null;
  inspectedBy: UserRef | null;
  inspectedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  items: OrderReturnLine[];
}

export interface OrderReturnQuery extends PageQuery {
  status?: OrderReturnStatus;
  orderId?: string;
}

export interface CreateOrderReturnPayload {
  orderId: string;
  reason: OrderReturnReason;
  shipmentId?: string;
  note?: string;
  items: { orderItemId: string; quantity: number; note?: string }[];
}

export interface InspectOrderReturnPayload {
  items: { orderItemId: string; condition: ReturnCondition; locationId?: string }[];
}
