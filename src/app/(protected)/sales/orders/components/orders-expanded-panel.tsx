import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FULFILLMENT_TYPE_LABELS,
  REMITTANCE_STATUS_LABELS,
  type OrderLine,
  type OrderListItem,
} from "@/types/order-flow";
import { formatVND, stockDisplay } from "../shared/order-display";

/** A combo line, then its components indented under it; plain lines as they come. */
function orderedLines(items: OrderLine[]): { line: OrderLine; depth: number }[] {
  const children = new Map<string, OrderLine[]>();
  for (const line of items) {
    if (line.parentItemId) {
      children.set(line.parentItemId, [...(children.get(line.parentItemId) ?? []), line]);
    }
  }
  return items
    .filter((line) => !line.parentItemId)
    .flatMap((line) => [
      { line, depth: 0 },
      ...(children.get(line.id) ?? []).map((child) => ({ line: child, depth: 1 })),
    ]);
}

function StockCell({ line }: { line: OrderLine }) {
  if (!line.stockCheck) return <span className="text-muted-foreground">-</span>;
  const display = stockDisplay(line.stockCheck.status);
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge variant={display.variant}>{display.label}</Badge>
      <span className="text-xs text-muted-foreground">
        Trên kệ {line.stockCheck.stock}
        {line.stockCheck.shortQuantity > 0 && ` · thiếu ${line.stockCheck.shortQuantity}`}
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

type OrdersExpandedPanelProps = {
  order: OrderListItem;
  isLastRow: boolean;
};

/** The lines of one order with their stock, and how it is delivered and paid - opened in place in the list. */
export function OrdersExpandedPanel({ order, isLastRow }: OrdersExpandedPanelProps) {
  const lines = orderedLines(order.items ?? []);

  return (
    <div className={cn("grid gap-6 p-4 lg:grid-cols-3", isLastRow && "pb-2")}>
      <div className="lg:col-span-2">
        <p className="mb-2 text-sm font-semibold">Sản phẩm ({order.itemCount})</p>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Sản phẩm</th>
                <th className="px-3 py-2 text-right font-medium">SL</th>
                <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                <th className="px-3 py-2 font-medium">Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ line, depth }) => (
                <tr key={line.id} className="border-t">
                  <td className={cn("px-3 py-2", depth > 0 && "pl-8")}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {line.productName ?? "-"}
                        {line.isCustom && (
                          <Badge variant="info" className="ml-2">
                            Thiết kế riêng
                          </Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {[line.sku, line.variantLabel].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{line.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {/* Combo components carry price 0; the combo line carries the price. */}
                    {line.lineType === "COMBO_COMPONENT" ? "-" : formatVND(line.lineTotal)}
                  </td>
                  <td className="px-3 py-2">
                    <StockCell line={line} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-2">
        <p className="mb-2 text-sm font-semibold">Giao hàng & thanh toán</p>
        <InfoRow
          label="Hình thức"
          value={FULFILLMENT_TYPE_LABELS[order.fulfillmentType] ?? order.fulfillmentType}
        />
        <InfoRow label="Người nhận" value={order.recipientName ?? order.customer?.name ?? "-"} />
        <InfoRow label="SĐT nhận" value={order.recipientPhone ?? order.customer?.phone ?? "-"} />
        <InfoRow label="Địa chỉ" value={order.deliveryAddress ?? "-"} />
        <InfoRow label="Tổng tiền" value={formatVND(order.grandTotal)} />
        <InfoRow
          label="Tiền cọc"
          value={
            order.deposit
              ? `${formatVND(order.deposit.amount)}${
                  order.deposit.percent !== null ? ` (${order.deposit.percent}%)` : ""
                }`
              : "-"
          }
        />
        <InfoRow label="Còn phải thu" value={<strong>{formatVND(order.amountDue)}</strong>} />
        {order.collection && (
          <InfoRow
            label="Tiền shipper thu"
            value={`${formatVND(order.collection.amount)} · ${
              REMITTANCE_STATUS_LABELS[order.collection.cashRemittanceStatus]
            }`}
          />
        )}
        {order.note && <InfoRow label="Ghi chú" value={order.note} />}
      </div>
    </div>
  );
}
