import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { OrderDetail, OrderDetailLine, OrderLine, OrderStatus } from "@/types/order-flow";

/** Dòng còn thiếu hàng trên kệ. Dòng COMBO / SERVICE và dòng đã xuất có `stockCheck` null nên không bao giờ thiếu. */
function isShort(line: OrderLine): boolean {
  return line.stockCheck !== null && line.stockCheck.shortQuantity > 0;
}

/** Phần thiếu chưa có YCSX nào đang chờ: số thiếu trên kệ trừ số còn chờ ở các YCSX mở (không âm). */
export function uncoveredQuantity(line: OrderLine): number {
  const short = line.stockCheck?.shortQuantity ?? 0;
  return Math.max(0, short - (line.production?.openQuantity ?? 0));
}

export interface ProductionCoverage {
  /** Đơn có dòng thiếu làm được ở xưởng và mọi dòng đó đã được YCSX mở che đủ. */
  fullyCovered: boolean;
  /** Mã các YCSX đang che phần thiếu của đơn (không trùng). */
  codes: string[];
}

/** Câu hiển thị khi nút "Tạo YCSX" bị khoá / báo ở danh sách. */
export function coveredMessage(codes: string[]): string {
  return `Đơn đã có ${codes.join(", ")} đủ cho phần thiếu`;
}

export function productionCoverageOf(order: { items: OrderDetailLine[] }): ProductionCoverage {
  const shortLines = order.items.filter((line) => isShort(line) && line.isManufacturable);
  const codes = [
    ...new Set(shortLines.flatMap((line) => (line.production?.requests ?? []).map((request) => request.code))),
  ];
  return {
    fullyCovered: shortLines.length > 0 && shortLines.every((line) => uncoveredQuantity(line) === 0),
    codes,
  };
}

/**
 * Đơn có hiện nút "Tạo YCSX" không: đã xác nhận và có dòng thiếu hàng.
 * Phải là CONFIRMED vì BE chỉ nhận gắn dòng YCSX với đơn từ CONFIRMED trở đi; đơn đã đóng gói thì hàng đã khoá nên không còn thiếu.
 */
export function canCreateProductionFor(order: { status: OrderStatus; items: OrderLine[] }): boolean {
  return order.status === "CONFIRMED" && order.items.some(isShort);
}

export interface ProductionPrefill {
  /** Dòng thiếu mà xưởng làm được, mỗi dòng gắn với dòng đơn của nó, số lượng = số thiếu chưa có YCSX che. */
  lines: DraftLine[];
  /** Số dòng thiếu nhưng sản phẩm không sản xuất được - phải nhập từ nhà cung cấp. */
  notManufacturableCount: number;
}

let prefillSeq = 0;

/**
 * Điền sẵn form YCSX từ một đơn: chỉ các dòng đang thiếu hàng trên kệ.
 * Số lượng là số thiếu đã trừ phần YCSX mở đang chờ (`production.openQuantity`); dòng đã được che đủ thì bỏ qua. Người dùng vẫn sửa được.
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
    const uncovered = uncoveredQuantity(line);
    if (uncovered === 0) continue;
    lines.push({
      key: `order-prefill-${++prefillSeq}`,
      productItemId: line.productItemId,
      sku: line.sku,
      productName: line.productName ?? line.sku ?? "-",
      quantity: uncovered,
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
