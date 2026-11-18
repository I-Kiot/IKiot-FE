import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { OrderDetail, OrderLine, OrderStatus } from "@/types/order-flow";

/** Dòng còn thiếu hàng trên kệ. Dòng COMBO / SERVICE và dòng đã xuất có `stockCheck` null nên không bao giờ thiếu. */
function isShort(line: OrderLine): boolean {
  return line.stockCheck !== null && line.stockCheck.shortQuantity > 0;
}

/**
 * Đơn có hiện nút "Tạo YCSX" không: đã xác nhận và có dòng thiếu hàng.
 * Phải là CONFIRMED vì BE chỉ nhận gắn dòng YCSX với đơn từ CONFIRMED trở đi; đơn đã đóng gói thì hàng đã khoá nên không còn thiếu.
 */
export function canCreateProductionFor(order: { status: OrderStatus; items: OrderLine[] }): boolean {
  return order.status === "CONFIRMED" && order.items.some(isShort);
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
  const lines: DraftLine[] = [];
  let notManufacturableCount = 0;
  for (const line of order.items.filter(isShort)) {
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
