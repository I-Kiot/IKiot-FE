// Hành trình đơn hàng (P0-6, 2026-10-02). Phản chiếu Ikiot_BE/docs/api-contract-order-flow.md
// và src/common/constants/*-status.ts: đổi hợp đồng trước, rồi mới đổi file này.


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


// Trạng thái đơn theo hợp đồng §2 (sửa 2026-10-04): đã bỏ DRAFT, READY_TO_PACK, DELIVERED; thêm PICKED_UP và RECEIVED. Nhãn là từ ngữ của hành trình.
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
  /** Trạng thái quầy cũ (chờ SePay), bỏ ở A-2. */
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

/** Dòng không còn trạng thái giữ hàng: có đủ hàng hay không nằm ở `stockCheck`, không phải status. */
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

/** Nhãn để nhân viên chọn đơn đóng gói tiếp theo (hành trình GĐ1 – Bước 3). */
export const ORDER_PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];

export const ORDER_PRIORITY_LABELS: Record<OrderPriority, string> = {
  NORMAL: "Bình thường",
  HIGH: "Cao",
  URGENT: "Gấp",
};

/** stockCheck của dòng / stockSummary của đơn (dòng xấu nhất): tính khi đọc, không lưu. */
export const STOCK_CHECK_STATUSES = ["ENOUGH", "PARTIAL", "OUT"] as const;
export type StockCheckStatus = (typeof STOCK_CHECK_STATUSES)[number];

export const STOCK_CHECK_STATUS_LABELS: Record<StockCheckStatus, string> = {
  ENOUGH: "Đủ hàng",
  PARTIAL: "Thiếu một phần",
  OUT: "Hết hàng",
};

/** Tiền shipper thu đã về tới chủ shop chưa? */
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

/** Phiếu giao của xưởng (2026-10-09): Chờ nhận → Đã nhận (nơi nhận xác nhận, tồn tăng) / Đã huỷ. */
export type ProductionDeliveryStatus = "PENDING" | "RECEIVED" | "CANCELLED";

export const PRODUCTION_DELIVERY_STATUS_LABELS: Record<ProductionDeliveryStatus, string> = {
  PENDING: "Chờ nhận",
  RECEIVED: "Đã nhận",
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
  CREATED: "Chờ shipper lấy hàng",
  PICKED_UP: "ĐVVC đã lấy hàng",
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

/** Hợp đồng §5. "Nhập lại kho / ghi hỏng" theo từng dòng (`condition`), không phải status. */
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


export interface OrderItemSpec {
  /** Thuộc tính của sản phẩm mà khách đổi; không có = thông số ghi tự do. */
  attributeId?: string | null;
  /** Giá trị của SKU mẫu (BE chụp lại khi lưu) - để hiện "Óc chó → Trắng". */
  baseValue?: string | null;
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
  /** Đối chiếu với tồn trên kệ; null với dòng COMBO / SERVICE và khi dòng đã xuất. */
  stockCheck: StockCheck | null;
}

/** Dòng như `GET /orders/:id` trả về: thêm nơi xuất hàng và thông số đặt riêng. */
export interface OrderDetailLine extends OrderLine {
  sourceLocation: LocationRef | null;
  customization: OrderItemCustomization | null;
}

export interface StockCheck {
  status: StockCheckStatus;
  /** Tồn trên kệ tại kho xuất của dòng (stock − locked). */
  stock: number;
  shortQuantity: number;
}

/** Khoản thu khi giao; null cho tới lúc đó. */
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
  driver: UserRef | null;
  createdBy: UserRef | null;
  confirmedBy: UserRef | null;
  confirmedAt: string | null;
  /** Ai xác nhận SHIPPING (trừ tồn), và lúc nào. */
  shippedBy: UserRef | null;
  shippedAt: string | null;
  fulfillmentType: FulfillmentType;
  /** Khách tới lấy, đã đóng gói, quá ngày hẹn lấy mà chưa tới. */
  pickupOverdue: boolean;
  subtotal: number;
  shippingFee: number;
  channelFee: number;
  vatTotal: number;
  discountType: "ORDER" | "PROMOTION" | null;
  discountValue: number;
  grandTotal: number;
  /** `percent` là null khi cọc được nhập theo số tiền. */
  deposit: { amount: number; percent: number | null } | null;
  /** grandTotal − deposit: số shipper thu khi giao; server tính. */
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
  /** Dòng cấp cao nhất; một combo tính một lần. */
  itemCount: number;
  /** stockCheck của dòng xấu nhất; null khi đã xuất hoặc không có dòng cần tồn. */
  stockSummary: StockCheckStatus | null;
  /** Danh sách vẫn giữ dòng của từng đơn (POS đọc từ cùng route). */
  items: OrderLine[];
  /** Trạng thái lần giao mới nhất; giao thất bại vẫn để đơn SHIPPING, nên trường này phân biệt được. */
  latestShipmentStatus: ShipmentStatus | null;
}

/** Đơn còn SHIPPING mà lần giao mới nhất thất bại, đang chờ phiếu hoàn. */
export function isDeliveryFailed(order: {
  status: OrderStatus;
  latestShipmentStatus: ShipmentStatus | null;
}): boolean {
  return order.status === "SHIPPING" && order.latestShipmentStatus === "FAILED";
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
/** Mỗi kiểu có một chiều cố định: mới nhất trước, giao sớm nhất trước, gấp nhất trước. */
export type OrderSort = (typeof ORDER_SORTS)[number];

/** Đơn chưa xuất cần được chú ý (bộ lọc `attention` của BE). */
export type OrderAttention = "SHORT" | "DUE_SOON" | "PICKUP_OVERDUE";

/** `GET /orders/alerts`. */
export interface OrderAlerts {
  /** Đơn có dòng thiếu một phần hoặc hết trên kệ. */
  short: number;
  /** Đơn có ngày giao hẹn là hôm nay, trong `dueSoonDays` ngày tới, hoặc đã qua. */
  dueSoon: number;
  /** Đơn khách tới lấy đã đóng gói mà quá ngày hẹn lấy: cần liên hệ khách. */
  pickupOverdue: number;
  dueSoonDays: number;
}

export interface OrderJourneyQuery extends PageQuery {
  attention?: OrderAttention;
  status?: OrderStatus;
  channel?: OrderChannel;
  assigneeId?: string;
  branchId?: string;
  priority?: OrderPriority;
  /** Lọc theo hình thức giao, vd `STORE_PICKUP` cho đơn chờ khách lấy. */
  fulfillmentType?: FulfillmentType;
  stockSummary?: StockCheckStatus;
  cashRemittanceStatus?: RemittanceStatus;
  /** Khoảng ngày tạo đơn, ISO. */
  from?: string;
  to?: string;
  sort?: OrderSort;
  /** Bỏ đơn quầy (`TAKEAWAY`). POS dùng chung `GET /orders` nên BE chỉ bỏ khi được yêu cầu; mọi màn hành trình đều gửi `true`. */
  excludePos?: boolean;
}

/** `POST /orders/:id/pickup/collect`: số tiền do server tính, client chỉ chọn cách thu. */
export type PickupCollectMethod = Exclude<CollectionMethod, "NONE">;

export interface PickupCollectPayload {
  method: PickupCollectMethod;
  note?: string;
}

/** Khoản QR đang chờ tiền về của đơn khách tới lấy. */
export interface PickupQrPayment {
  reference: string;
  amount: number;
  status: string;
  qrUrl: string;
}

export interface PickupCollectResult {
  /** Null khi thu tiền mặt (đã ghi luôn). */
  payment: PickupQrPayment | null;
}

export type RefundMethod = "CASH" | "BANK_TRANSFER";

/** `POST /orders/:id/cancel`. Đơn đang giữ tiền thì bắt buộc `refundAmount`: 0 là shop giữ lại toàn bộ. */
export interface CancelOrderPayload {
  reason?: string;
  refundAmount?: number;
  refundMethod?: RefundMethod;
}

export interface CancelOrderResult {
  refund: { held: number; refunded: number; kept: number } | null;
  /** Yêu cầu sản xuất của các dòng còn mở: huỷ đơn không đụng tới, người dùng tự xử lý. */
  openProductionRequests: { id: string }[];
}

/** `POST /orders/:id/pickup/hand-over`: giao hàng cho khách tại quầy. */
export interface PickupHandOverPayload {
  receiverName?: string;
  note?: string;
}

export interface CreateOrderLinePayload {
  productItemId: string;
  quantity: number;
  /** Giá đã thoả thuận; bỏ trống thì dùng giá niêm yết. */
  unitPrice?: number;
  discountAmount?: number;
  sourceLocationId?: string;
  /** Có giá trị → dòng đặt riêng (sản xuất theo yêu cầu). */
  customization?: OrderItemCustomization;
}

export interface CreateOrderJourneyPayload {
  branchId: string;
  customerId?: string;
  customer?: { name: string; phone?: string; address?: string };
  /** Bắt buộc: người phụ trách chọn trên form (ORDER_ASSIGNEE_REQUIRED / _INVALID). */
  assigneeId: string;
  /** Chỉ hai loại của hành trình; TAKEAWAY là của quầy. */
  fulfillmentType: "STORE_PICKUP" | "HOME_DELIVERY";
  priority?: OrderPriority;
  items: CreateOrderLinePayload[];
  shippingFee?: number;
  discountType?: "ORDER";
  discountValue?: number;
  appliedPromotions?: { promotionId: string }[];
  /** Tiền thu ngay. `value` là đồng với AMOUNT, là phần trăm (0 < value ≤ 100) với PERCENT. */
  deposit?: { type: "AMOUNT" | "PERCENT"; value: number; method: "CASH" | "BANK_TRANSFER" };
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  requestedDeliveryDate?: string;
  note?: string;
}

/** Dòng của `PATCH /orders/:id` (A-8): có `id` = đổi tại chỗ (cùng sản phẩm), không có = dòng mới; dòng vắng mặt bị xoá. Thông số đi qua `setCustomization`. */
export interface UpdateOrderLinePayload extends Omit<CreateOrderLinePayload, "customization"> {
  id?: string;
}

/** `PATCH /orders/:id` (A-8): các trường như create trừ chi nhánh, đều tuỳ chọn. `items` là toàn bộ danh sách mới, chỉ khi CONFIRMED. `discountType: null` xoá chiết khấu nhập tay. */
export interface UpdateOrderPayload
  extends Partial<Omit<CreateOrderJourneyPayload, "branchId" | "items" | "discountType">> {
  items?: UpdateOrderLinePayload[];
  discountType?: "ORDER" | null;
}

/** @deprecated Sửa A-8 không còn là sửa nháp; dùng `UpdateOrderPayload`. */
export type UpdateDraftOrderPayload = UpdateOrderPayload;

/** `ORDER_DEPOSIT_CHANGED` (409): sửa sẽ làm cọc lệch khỏi số tiền đã thu. */
export interface DepositChange {
  held: number;
  amount: number;
  difference: number;
}

/** `POST /orders/:id/confirm-remittance` (A-10): số tiền chủ shop đã đếm từ shipper, toàn bộ. */
export interface ConfirmRemittancePayload {
  amount: number;
  note?: string;
}

export interface ConfirmOrderPayload {
  assigneeId?: string;
  sourceLocationId?: string;
  lines?: { orderItemId: string; sourceLocationId: string }[];
}


/** Giá trị một thuộc tính của SKU (Màu: Óc chó). `attributeId` null = dòng ghi tự do. */
export interface SkuAttributeValue {
  attributeId: string | null;
  name: string | null;
  value: string | null;
}

export interface ProductionRequestLine {
  id: string;
  productItemId: string;
  productId: string;
  sku: string | null;
  productName: string;
  retailPrice: number;
  /** Thuộc tính của SKU - xưởng làm đúng bộ này. */
  attributes: SkuAttributeValue[];
  imageUrl: string | null;
  quantity: number;
  receivedQuantity: number;
  /** Xưởng đã báo giao (phiếu Chờ nhận) nhưng nơi nhận chưa đếm. */
  pendingDeliveryQuantity: number;
  note: string | null;
  /** Ảnh gửi xưởng của dòng này (bản thiết kế, ảnh mẫu). */
  attachmentUrls: string[];
  /** Dòng đơn mà chi tiết này sản xuất cho; luôn có với hàng đặt riêng. */
  orderItem: {
    id: string;
    orderId: string;
    orderCode: string | null;
    isCustom: boolean;
    /** Thứ khách đặt riêng cho dòng đơn: đổi gì so với mẫu, ảnh, ghi chú. */
    customization: { note: string | null; attachmentUrls: string[]; specs: OrderItemSpec[] } | null;
  } | null;
}

/** Một lần nhận theo YCSX: phiếu nhập XƯỞNG tương ứng (`/stock-movements`). */
export interface ProductionReceipt {
  stockMovementId: string;
  receivedAt: string | null;
  receivedBy: PersonRef | null;
}

/** `GET /production-requests/:id` (hợp đồng §3). Người đi kèm `profile` lồng nhau. */
export interface ProductionRequest {
  id: string;
  code: string;
  status: ProductionRequestStatus;
  supplier: { id: string; supplierName: string; phoneNumber: string | null };
  location: LocationRef & { type: "BRANCH" | "WAREHOUSE" };
  expectedReadyDate: string | null;
  sentAt: string | null;
  note: string | null;
  /** COMPLETED mà có dòng chưa giao đủ: đóng thiếu bằng tay. */
  closedShort: boolean;
  createdBy: PersonRef | null;
  statusUpdatedBy: PersonRef | null;
  statusUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ProductionRequestLine[];
  receipts: ProductionReceipt[];
  /** Phiếu giao của xưởng theo YCSX này, cũ trước. */
  deliveries: ProductionDeliverySummary[];
}

/** Một phiếu giao trong `ProductionRequest.deliveries`. */
export interface ProductionDeliverySummary {
  id: string;
  code: string;
  status: ProductionDeliveryStatus;
  note: string | null;
  createdAt: string;
  createdBy: PersonRef | null;
  receivedAt: string | null;
  receivedBy: PersonRef | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  stockMovementId: string | null;
  items: {
    productionRequestItemId: string;
    quantity: number;
    receivedQuantity: number | null;
    defectQuantity: number | null;
  }[];
}

/** `GET /production-deliveries` · `/workshop/deliveries`: một phiếu giao kèm YCSX của nó. */
export interface ProductionDelivery {
  id: string;
  code: string;
  status: ProductionDeliveryStatus;
  note: string | null;
  productionRequestId: string;
  productionRequest: {
    id: string;
    code: string;
    status: ProductionRequestStatus;
    expectedReadyDate: string | null;
    supplier: { id: string; supplierName: string };
    location: LocationRef & { type: "BRANCH" | "WAREHOUSE" };
  };
  createdAt: string;
  createdBy: PersonRef;
  receivedAt: string | null;
  receivedBy: PersonRef | null;
  cancelledAt: string | null;
  cancelledBy: PersonRef | null;
  cancelReason: string | null;
  stockMovementId: string | null;
  items: {
    id: string;
    productionRequestItemId: string;
    productItemId: string;
    sku: string | null;
    productName: string;
    /** Số xưởng ghi là giao. */
    quantity: number;
    receivedQuantity: number | null;
    defectQuantity: number | null;
    orderedQuantity: number;
    /** Tổng đã nhận của dòng YCSX (mọi lần). */
    totalReceivedQuantity: number;
  }[];
}

export interface ProductionDeliveryQuery extends PageQuery {
  status?: ProductionDeliveryStatus;
  locationId?: string;
  productionRequestId?: string;
}

export interface WorkshopProductionRequestQuery extends PageQuery {
  status?: Exclude<ProductionRequestStatus, "DRAFT">;
  locationId?: string;
}

export interface CreateProductionDeliveryPayload {
  items: { productionRequestItemId: string; quantity: number }[];
  note?: string;
}

export interface ProductionRequestQuery extends PageQuery {
  status?: ProductionRequestStatus;
  supplierId?: string;
  locationId?: string;
  /** YCSX có dòng cho SKU này. */
  productItemId?: string;
}

export interface ProductionRequestLinePayload {
  productItemId: string;
  quantity: number;
  orderItemId?: string;
  note?: string;
  /** Thuộc tính đổi so với SKU: dòng chuyển sang SKU đúng bộ đó (có sẵn, hoặc BE tạo mới). */
  attributeValues?: { attributeId: string; value: string }[];
  /** Chỉ gửi khi tick "Cập nhật giá mới": giá bán của SKU kết quả. */
  retailPrice?: number;
  /** Ảnh gửi xưởng, đã tải qua POST /uploads. */
  attachmentUrls?: string[];
}

export interface CreateProductionRequestPayload {
  supplierId: string;
  locationId: string;
  /** `YYYY-MM-DD`. */
  expectedReadyDate?: string;
  note?: string;
  items: ProductionRequestLinePayload[];
}

/** SENT = đã gọi xưởng; CANCELLED chỉ khi chưa nhận gì; COMPLETED bằng tay = đóng YCSX giao thiếu (bắt buộc `note`). */
export interface UpdateProductionRequestStatusPayload {
  status: "SENT" | "COMPLETED" | "CANCELLED";
  note?: string;
}

/** `POST /production-requests/:id/receive` (B-5): số nhận lần này. Hàng tốt mở lot tại địa điểm YCSX; hàng lỗi sang kho hàng hỏng của địa điểm đó. */
export interface ReceiveProductionPayload {
  items: {
    productionRequestItemId: string;
    /** Nhận lần này, kể cả hàng lỗi. */
    receivedQuantity: number;
    defectQuantity?: number;
    /** Giá xưởng cho mỗi đơn vị; để trống = giá vốn của SKU. */
    unitCost?: number;
  }[];
  /** Mặc định là kho hàng hỏng của địa điểm nhận. */
  defectLocationId?: string;
  note?: string;
}

/** Một dòng danh sách sản xuất (`GET /production-list`): cặp (địa điểm, SKU), tính khi đọc. */
export interface ProductionListRow {
  key: string;
  location: (LocationRef & { type: "BRANCH" | "WAREHOUSE" }) | null;
  productItemId: string;
  sku: string | null;
  productName: string;
  variantLabel: string | null;
  /** false = chỉ nhập từ nhà cung cấp, không đặt xưởng được. */
  isManufacturable: boolean;
  isCustom: boolean;
  /** Dòng đơn mà hàng đặt riêng này sản xuất cho. */
  customOrderItemId: string | null;
  customization: OrderItemCustomization | null;
  stock: number;
  demandQuantity: number;
  /** Đã gửi xưởng, chưa giao. */
  onOrderQuantity: number;
  /** Trên YCSX nháp, chưa gửi. */
  draftQuantity: number;
  /** Vẫn thiếu và chưa đặt gì. */
  shortQuantity: number;
  orders: {
    orderId: string;
    orderCode: string;
    orderItemId: string;
    quantity: number;
    priority: OrderPriority;
    requestedDeliveryDate: string | null;
    assignee: PersonRef | null;
    status: OrderStatus;
  }[];
  requests: {
    id: string;
    code: string;
    status: ProductionRequestStatus;
    supplierName: string;
    quantity: number;
    receivedQuantity: number;
    expectedReadyDate: string | null;
  }[];
}

export interface ProductionListQuery extends PageQuery {
  locationId?: string;
  /** Một SKU; thông báo thiếu hàng trỏ về đây. */
  productItemId?: string;
  /** Chỉ dòng còn thiếu sau tồn kho và mọi YCSX đang mở. */
  onlyShort?: boolean;
  /** Chỉ dòng còn YCSX đang mở. */
  hasOpenRequest?: boolean;
}

/** Phân trang như mọi danh sách, kèm số dòng cần đặt hàng bất kể bộ lọc. */
export interface ProductionListPage extends Paginated<ProductionListRow> {
  summary: { shortRows: number };
}


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

/** Khoản shipper đã thu / đang chờ thu ở một lần giao (`GET /shipments/mine/history`). */
export interface ShipmentCollection {
  method: string;
  amount: number;
  /** PAID = đã thu; PENDING = QR đã tạo, chờ tiền về. */
  status: string;
}

/** Một dòng lịch sử giao của tôi. */
export interface ShipmentHistoryItem extends ShipmentSummary {
  collection: ShipmentCollection | null;
}

/** Số liệu các thẻ trên tab lịch sử; chịu khoảng ngày nhưng không chịu bộ lọc trạng thái / tìm kiếm. */
export interface ShipmentHistorySummary {
  /** Cần giao: mọi lần giao chưa kết thúc, không phụ thuộc khoảng ngày. */
  active: number;
  delivered: number;
  failed: number;
  returned: number;
  cancelled: number;
  collectedTotal: number;
}

export interface ShipmentHistoryQuery extends PageQuery {
  /** `ACTIVE` = cần giao (chưa kết thúc). */
  status?: ShipmentStatus | "ACTIVE";
  /** `YYYY-MM-DD`, theo ngày giao (giờ Việt Nam). */
  from?: string;
  to?: string;
}

export interface ShipmentHistoryPage extends Paginated<ShipmentHistoryItem> {
  summary: ShipmentHistorySummary;
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
  /** `YYYY-MM-DD`; đơn đã có ngày hẹn thì dialog giao hàng dùng luôn, không cho chọn lại. */
  requestedDeliveryDate: string | null;
  /** Phí giao hàng đã nhập khi tạo đơn; ghi lại thành `shippingCost` của lần giao. */
  shippingFee: number;
  /** Shipper của lần giao mới nhất. Đơn còn PACKED mà đã có shipper = đã gán, đang chờ shipper tới lấy hàng. */
  driver: UserRef | null;
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
  /** Đơn mới khách đặt để mua lại hàng (GĐ2 – 3B). */
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
