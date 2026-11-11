"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionButton } from "@/components/permission-button";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import {
  COLLECTION_METHOD_LABELS,
  ORDER_PAYMENT_STATUS_LABELS,
  REMITTANCE_STATUS_LABELS,
  type OrderDetail,
} from "@/types/order-flow";
import { formatDateTime, formatVND } from "../../shared/order-display";
import { isStorePickup } from "@/lib/order-pickup";
import { InfoRow } from "./order-info-card";
import { RefundExcessDialog } from "./refund-excess-dialog";
import { SettleHeldDialog } from "./settle-held-dialog";

/** The money: totals, deposit, what the shipper collects (journey GĐ1 – Bước 1, 7). Số đã thu / đã hoàn / còn phải thu lấy từ `paymentSummary` của server. */
export function OrderPaymentCard({
  order,
  onChanged,
}: {
  order: OrderDetail;
  /** Hoàn tiền trả dư trả về chính đơn: trang thay đơn ngay. */
  onChanged: (order: OrderDetail) => void;
}) {
  const { collection, paymentSummary: money } = order;
  const [refunding, setRefunding] = React.useState(false);
  const [settling, setSettling] = React.useState(false);
  const canRefund = allows(getSessionRole(), "returns", "inspect");
  const discount = order.discountValue;
  // Khách tới lấy trả tại quầy chứ không qua shipper.
  const pickup = isStorePickup(order);

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
        {/* Đơn đã huỷ vẫn có thể còn tiền đã thu / đã hoàn; chỉ ẩn "còn phải thu". */}
        <InfoRow label="Đã thu" value={formatVND(money.received)} />
        {money.refunded > 0 && <InfoRow label="Đã hoàn" value={`- ${formatVND(money.refunded)}`} />}
        {money.pendingRemittance > 0 && (
          <InfoRow
            label="Shipper đang giữ"
            value={<span className="text-amber-700 dark:text-amber-400">{formatVND(money.pendingRemittance)}</span>}
          />
        )}
        {order.status !== "CANCELLED" && (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-sm font-medium">
              {pickup ? "Còn phải thu khi khách lấy hàng" : "Còn phải thu"}
            </span>
            <span className="text-base font-semibold">{formatVND(money.due)}</span>
          </div>
        )}
        {money.overpaidBy > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Khách trả dư <strong>{formatVND(money.overpaidBy)}</strong> - cần hoàn lại phần dư.
            </span>
            <PermissionButton
              allowed={canRefund}
              permission="returns:inspect"
              variant="outline"
              size="sm"
              onClick={() => setRefunding(true)}
              className="cursor-pointer"
            >
              Hoàn tiền trả dư
            </PermissionButton>
          </div>
        )}

        {money.heldUndecided > 0 && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Shop đang giữ <strong>{formatVND(money.heldUndecided)}</strong> chưa quyết định - hoàn lại cho khách hoặc
              giữ lại làm thu nhập khác.
            </span>
            <PermissionButton
              allowed={canRefund}
              permission="returns:inspect"
              variant="outline"
              size="sm"
              onClick={() => setSettling(true)}
              className="cursor-pointer"
            >
              Quyết định
            </PermissionButton>
          </div>
        )}

        {collection && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-semibold">{pickup ? "Thu tiền tại quầy" : "Thu tiền khi giao"}</p>
            <InfoRow
              label="Hình thức"
              value={COLLECTION_METHOD_LABELS[collection.method] ?? collection.method}
            />
            {/* Đã cọc đủ: không thu thêm gì nên không hiện số tiền hay người thu. */}
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
      {refunding && (
        <RefundExcessDialog
          order={order}
          open
          onOpenChange={setRefunding}
          onRefunded={(updated) => {
            setRefunding(false);
            onChanged(updated);
          }}
        />
      )}
      {settling && (
        <SettleHeldDialog
          order={order}
          open
          onOpenChange={setSettling}
          onSettled={(updated) => {
            setSettling(false);
            onChanged(updated);
          }}
        />
      )}
    </Card>
  );
}
