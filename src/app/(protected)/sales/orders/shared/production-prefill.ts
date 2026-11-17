import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { OrderDetail, OrderListItem } from "@/types/order-flow";

/**
 * Trạng thái đơn mà dòng YCSX gắn được vào dòng đơn - bản sao của `UNSHIPPED_ORDER_STATUSES` bên BE
 * (`common/constants/order-status.ts`). Ngoài các trạng thái này, BE trả PRODUCTION_REQUEST_ORDER_ITEM_INVALID.
 */
const PRODUCTION_LINKABLE_STATUSES: readonly string[] = ["CONFIRMED", "PACKED", "PICKED_UP"];

/** Đơn có hiện nút "Tạo YCSX" không: chưa giao và không phải bán tại quầy - cùng điều kiện BE nhận gắn dòng đơn. */
export function canCreateProductionFor(order: Pick<OrderListItem, "status" | "fulfillmentType">): boolean {
  return PRODUCTION_LINKABLE_STATUSES.includes(order.status) && order.fulfillmentType !== "TAKEAWAY";
}

export interface ProductionPrefill {
  /** Dòng thiếu mà xưởng làm được, mỗi dòng gắn với dòng đơn của nó, số lượng = số thiếu. */
  lines: DraftLine[];
  /** Số dòng thiếu nhưng sản phẩm không sản xuất được - phải nhập từ nhà cung cấp. */
  notManufacturableCount: number;
}

let prefillSeq = 0;

/**
 * Điền sẵn form YCSX từ một đơn: chỉ các dòng đang thiếu hàng trên kệ.
 * Số lượng là số thiếu thô, chưa trừ hàng xưởng đang làm hay đang nằm trong YCSX nháp - người dùng tự sửa.
 * Nơi nhận hàng không điền sẵn, để người dùng chọn.
 */
export function productionPrefillOf(order: OrderDetail): ProductionPrefill {
  // `stockCheck` chỉ có ở dòng cần tồn (không có ở COMBO / SERVICE, có ở thành phần combo).
  const shortLines = order.items.filter(
    (line) => line.status === "PENDING" && line.stockCheck !== null && line.stockCheck.shortQuantity > 0,
  );

  const lines: DraftLine[] = [];
  let notManufacturableCount = 0;
  for (const line of shortLines) {
    if (!line.isManufacturable) {
      notManufacturableCount += 1;
      continue;
    }
    lines.push({
      key: `order-prefill-${++prefillSeq}`,
      productItemId: line.productItemId,
      sku: line.sku,
      productName: line.productName ?? line.sku ?? "-",
      quantity: line.stockCheck?.shortQuantity ?? 1,
      orderItemId: line.id,
      orderCode: order.code,
      attachments: [],
      customization: line.customization
        ? {
            note: line.customization.note ?? null,
            attachmentUrls: line.customization.attachmentUrls,
            specs: line.customization.specs,
          }
        : null,
    });
  }

  return { lines, notManufacturableCount };
}
