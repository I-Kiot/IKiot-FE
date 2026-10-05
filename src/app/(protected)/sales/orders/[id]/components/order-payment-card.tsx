import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COLLECTION_METHOD_LABELS,
  ORDER_PAYMENT_STATUS_LABELS,
  REMITTANCE_STATUS_LABELS,
  type OrderDetail,
} from "@/types/order-flow";
import { formatDateTime, formatVND } from "../../shared/order-display";
import { InfoRow } from "./order-info-card";

/** The money: totals, deposit, what the shipper collects (journey GĐ1 – Bước 1, 7). */
export function OrderPaymentCard({ order }: { order: OrderDetail }) {
  const { collection } = order;
  const discount = order.discountValue;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Thanh toán</CardTitle>
        <Badge variant={order.paymentStatus === "PAID" ? "success" : "outline"}>
          {ORDER_PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow label="Tiền hàng" value={formatVND(order.subtotal)} />
        {discount > 0 && <InfoRow label="Giảm giá" value={`- ${formatVND(discount)}`} />}
        {order.shippingFee > 0 && <InfoRow label="Phí giao hàng" value={formatVND(order.shippingFee)} />}
        {order.vatTotal > 0 && <InfoRow label="VAT" value={formatVND(order.vatTotal)} />}
        <InfoRow label="Tổng tiền" value={<strong>{formatVND(order.grandTotal)}</strong>} />
        <InfoRow
          label="Tiền cọc"
          value={
            order.deposit
              ? `${formatVND(order.deposit.amount)}${
                  order.deposit.percent !== null ? ` (${order.deposit.percent}%)` : ""
                }`
              : "Không cọc"
          }
        />
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">Còn phải thu khi giao</span>
          <span className="text-base font-semibold">{formatVND(order.amountDue)}</span>
        </div>

        {collection && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-semibold">Thu tiền khi giao</p>
            <InfoRow
              label="Hình thức"
              value={COLLECTION_METHOD_LABELS[collection.method] ?? collection.method}
            />
            {/* Fully deposited: nothing was collected, so there is no amount or collector to show. */}
            {collection.method !== "NONE" && (
              <>
                <InfoRow label="Số tiền" value={formatVND(collection.amount)} />
                <InfoRow
                  label="Người thu"
                  value={
                    collection.collectedBy
                      ? `${collection.collectedBy.name} · ${formatDateTime(collection.collectedAt)}`
                      : "-"
                  }
                />
              </>
            )}
            {collection.cashRemittanceStatus !== "NOT_APPLICABLE" && (
              <InfoRow
                label="Nộp lại cho chủ"
                value={
                  <Badge
                    variant={collection.cashRemittanceStatus === "RECEIVED" ? "success" : "warning"}
                  >
                    {REMITTANCE_STATUS_LABELS[collection.cashRemittanceStatus]}
                  </Badge>
                }
              />
            )}
            {collection.remittanceConfirmedBy && (
              <InfoRow
                label="Chủ xác nhận"
                value={`${collection.remittanceConfirmedBy.name} · ${formatDateTime(
                  collection.remittanceConfirmedAt,
                )}`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
