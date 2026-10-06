import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CARRIER_TYPE_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  type OrderDetail,
} from "@/types/order-flow";
import { InfoRow } from "./order-info-card";

/** Where it goes, the shipments that took it there, and any returns. */
export function OrderDeliveryCard({ order }: { order: OrderDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Giao hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow label="Người nhận" value={order.recipientName ?? order.customer?.name ?? "-"} />
        <InfoRow label="SĐT nhận" value={order.recipientPhone ?? order.customer?.phone ?? "-"} />
        <InfoRow label="Địa chỉ" value={order.deliveryAddress ?? "-"} />

        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold">Lần giao ({order.shipments.length})</p>
          {order.shipments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa giao cho shipper / đơn vị vận chuyển.</p>
          ) : (
            order.shipments.map((shipment) => (
              <div key={shipment.id} className="space-y-1 rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {shipment.carrierType === "INTERNAL"
                      ? (shipment.driver?.name ?? CARRIER_TYPE_LABELS.INTERNAL)
                      : (shipment.carrierName ?? CARRIER_TYPE_LABELS.EXTERNAL)}
                  </span>
                  <Badge variant="outline">
                    {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
                  </Badge>
                </div>
                {shipment.trackingCode && (
                  <p className="text-xs text-muted-foreground">Mã vận đơn {shipment.trackingCode}</p>
                )}
              </div>
            ))
          )}
        </div>

        {order.returns.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-sm font-semibold">Hoàn hàng ({order.returns.length})</p>
            {order.returns.map((orderReturn) => (
              <div
                key={orderReturn.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
                <span className="font-mono">{orderReturn.code}</span>
                <Badge variant="secondary">
                  {ORDER_RETURN_STATUS_LABELS[orderReturn.status] ?? orderReturn.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
