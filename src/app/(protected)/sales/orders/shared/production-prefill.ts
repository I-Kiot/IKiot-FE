import type { DraftLine } from "@/app/(protected)/exchange/production-requests/components/production-request-form-dialog";
import type { OrderDetail, OrderDetailLine, OrderLine, OrderStatus } from "@/types/order-flow";

/** Dòng còn thiếu hàng trên kệ. */
function isShort(line: OrderLine): boolean {
  return line.stockCheck !== null && line.stockCheck.shortQuantity > 0;
}

/** Số còn đặt xưởng được cho dòng. */
export function orderableQuantity(line: OrderLine): number {
  return line.production?.orderableQuantity ?? 0;
}

export interface ProductionCoverage {
  /** Đơn có dòng thiếu làm được ở xưởng và mọi dòng đó đã được YCSX che đủ (gắn dòng hoặc đặt chung). */
  fullyCovered: boolean;
  /** Mỗi dòng đã che đủ một câu, vd. "Sofa A tại Showroom Thanh Xuân đã có YCSX000002". */
  messages: string[];
}

/** Mã các YCSX che dòng này: đặt chung (cùng địa điểm + SKU) và gắn riêng dòng, không trùng. */
function coveringCodesOf(line: OrderLine): string[] {
  const production = line.production;
  return [
    ...new Set([
      ...(production?.coveringRequests ?? []).map((request) => request.code),
      ...(production?.requests ?? []).map((request) => request.code),
    ]),
  ];
}

function coverageMessageOf(line: OrderDetailLine): string {
  const name = line.productName ?? line.sku ?? "Mặt hàng";
  const place = line.sourceLocation?.name ? ` tại ${line.sourceLocation.name}` : "";
  const codes = coveringCodesOf(line);
  return codes.length > 0
    ? `${name}${place} đã có ${codes.join(", ")}`
    : `${name}${place} đã đủ hàng cho các đơn đang chờ`;
}

/** Câu hiển thị khi nút "Tạo YCSX" bị khoá / báo ở danh sách. */
export function coveredMessage(messages: string[]): string {
  return messages.join("; ");
}

export function productionCoverageOf(order: { items: OrderDetailLine[] }): ProductionCoverage {
  const shortLines = order.items.filter((line) => isShort(line) && line.isManufacturable);
  return {
    fullyCovered: shortLines.length > 0 && shortLines.every((line) => orderableQuantity(line) === 0),
    messages: shortLines.filter((line) => orderableQuantity(line) === 0).map(coverageMessageOf),
  };
}

/** Đơn có hiện nút "Tạo YCSX" không. */
export function canCreateProductionFor(order: { status: OrderStatus; items: OrderLine[] }): boolean {
  return order.status === "CONFIRMED" && order.items.some(isShort);
}

export interface ProductionPrefill {
  /** Các dòng thiếu mà xưởng làm được. */
  lines: DraftLine[];
  /** Số dòng thiếu nhưng sản phẩm không sản xuất được - phải nhập từ nhà cung cấp. */
  notManufacturableCount: number;
  /** Dòng thiếu mà xưởng làm được nhưng bị bỏ qua vì đã có YCSX che (một câu cho mỗi dòng). */
  skipped: string[];
  /** Nơi nhận hàng điền sẵn. */
  locationId: string | undefined;
}

let prefillSeq = 0;

/** Điền sẵn form YCSX từ một đơn. */
export function productionPrefillOf(order: OrderDetail): ProductionPrefill {
  const lines: DraftLine[] = [];
  const sourceLocationIds = new Set<string | undefined>();
  const skipped: string[] = [];
  let notManufacturableCount = 0;
  for (const line of order.items.filter(isShort)) {
    if (!line.isManufacturable) {
      notManufacturableCount += 1;
      continue;
    }
    const orderable = orderableQuantity(line);
    if (orderable === 0) {
      skipped.push(coverageMessageOf(line));
      continue;
    }
    sourceLocationIds.add(line.sourceLocation?.id);
    lines.push({
      key: `order-prefill-${++prefillSeq}`,
      productItemId: line.productItemId,
      sku: line.sku,
      productName: line.productName ?? line.sku ?? "-",
      quantity: orderable,
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

  // Một kho duy nhất thì điền; nhiều kho hoặc có dòng chưa chọn kho (undefined) thì để người dùng chọn.
  let locationId: string | undefined;
  if (sourceLocationIds.size === 1) {
    locationId = [...sourceLocationIds][0];
  }

  return { lines, notManufacturableCount, skipped, locationId };
}
