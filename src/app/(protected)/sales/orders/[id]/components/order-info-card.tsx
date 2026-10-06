import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FULFILLMENT_TYPE_LABELS,
  ORDER_CHANNEL_LABELS,
  type OrderDetail,
  type UserRef,
} from "@/types/order-flow";
import { formatDateTime, formatPlainDate } from "../../shared/order-display";

export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

function person(user: UserRef | null, at?: string | null): ReactNode {
  if (!user) return "-";
  return (
    <span className="flex flex-col items-end">
      <span>{user.name}</span>
      {at && <span className="text-xs text-muted-foreground">{formatDateTime(at)}</span>}
    </span>
  );
}

/** Who the order is for, who handles it, and who moved it along. */
export function OrderInfoCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin đơn</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow
          label="Khách hàng"
          value={
            <span className="flex flex-col items-end">
              <span className="font-medium">{order.customer?.name ?? "-"}</span>
              {order.customer?.phone && (
                <span className="text-xs text-muted-foreground">{order.customer.phone}</span>
              )}
            </span>
          }
        />
        <InfoRow label="Chi nhánh bán" value={order.branch?.name ?? "-"} />
        <InfoRow label="Nguồn đơn" value={ORDER_CHANNEL_LABELS[order.channel] ?? order.channel} />
        {order.channelOrderRef && <InfoRow label="Mã đơn sàn" value={order.channelOrderRef} />}
        <InfoRow
          label="Hình thức nhận"
          value={FULFILLMENT_TYPE_LABELS[order.fulfillmentType] ?? order.fulfillmentType}
        />
        <InfoRow label="Khách hẹn giao" value={formatPlainDate(order.requestedDeliveryDate)} />
        <div className="my-2 border-t" />
        <InfoRow label="Người phụ trách" value={person(order.assignee)} />
        <InfoRow label="Người tạo" value={person(order.createdBy, order.createdAt)} />
        <InfoRow label="Người xác nhận" value={person(order.confirmedBy, order.confirmedAt)} />
        {order.shippedBy && (
          <InfoRow label="Xác nhận xuất kho" value={person(order.shippedBy, order.shippedAt)} />
        )}
        {order.note && (
          <>
            <div className="my-2 border-t" />
            <InfoRow label="Ghi chú" value={order.note} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
