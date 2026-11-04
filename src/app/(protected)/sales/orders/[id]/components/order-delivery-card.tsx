import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CARRIER_TYPE_LABELS,
  ORDER_RETURN_STATUS_LABELS,
  SHIPMENT_STATUS_LABELS,
  type OrderDetail,
} from "@/types/order-flow";
import { isStorePickup } from "@/lib/order-pickup";
import { InfoRow } from "./order-info-card";
import { formatPlainDate } from "../../shared/order-display";

/** Giao đến đâu, các lần giao đã đưa hàng tới, và các đơn trả (nếu có). */
export function OrderDeliveryCard({ order }: { order: OrderDetail }) {
  const pickup = isStorePickup(order);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{pickup ? "Nhận hàng tại cửa hàng" : "Giao hàng"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <InfoRow
          label={pickup ? "Người đến lấy" : "Người nhận"}
          value={order.recipientName ?? order.customer?.name ?? "-"}
        />
        <InfoRow label="SĐT nhận" value={order.recipientPhone ?? order.customer?.phone ?? "-"} />
        {pickup ? (
          <>
            <InfoRow label="Nơi lấy hàng" value={order.branch.name} />
            <InfoRow
              label="Ngày hẹn lấy"
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  {formatPlainDate(order.requestedDeliveryDate)}
                  {order.pickupOverdue && <Badge variant="error">Quá hạn lấy hàng</Badge>}
                </span>
              }
            />
          </>
        ) : (
          <InfoRow label="Địa chỉ" value={order.deliveryAddress ?? "-"} />
        )}

        {/* Khách tới lấy không có lần giao nào; chỉ hiện khi đơn cũ còn dữ liệu. */}
        <div className={pickup && order.shipments.length === 0 ? "hidden" : "space-y-2 pt-2"}>
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
