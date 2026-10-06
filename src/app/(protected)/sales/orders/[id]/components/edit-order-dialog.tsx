"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { branchApi } from "@/lib/api/branch";
import { depositChangeOf, getApiErrorBody, type MoneyGap } from "@/lib/api/error-codes";
import { orderJourneyApi } from "@/lib/api/order-journey";
import type { LocationType } from "@/types/location";
import {
  FULFILLMENT_TYPE_LABELS,
  type OrderDetail,
  type UpdateOrderPayload,
} from "@/types/order-flow";
import {
  OrderLinesEditor,
  type OrderLineDraft,
} from "../../new/components/order-lines-editor";
import { formatVND } from "../../shared/order-display";

type Props = {
  order: OrderDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (order: OrderDetail) => void;
};

const JOURNEY_FULFILLMENT_TYPES = ["HOME_DELIVERY", "STORE_PICKUP"] as const;

/** The order's own lines as drafts: top-level only - a combo's components follow its quantity on the server. */
function draftsOf(order: OrderDetail): OrderLineDraft[] {
  return order.items
    .filter((line) => !line.parentItemId)
    .map((line) => ({
      key: line.id,
      id: line.id,
      productItemId: line.productItemId,
      name: line.productName ?? line.sku ?? "",
      sku: line.sku ?? "",
      retailPrice: line.listUnitPrice,
      stock: line.stockCheck?.stock ?? 0,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountAmount: line.discountAmount,
    }));
}

const linesKey = (lines: OrderLineDraft[]) =>
  JSON.stringify(
    lines.map((l) => [l.id ?? null, l.productItemId, l.quantity, l.unitPrice, l.discountAmount]),
  );

/**
 * D-7: edit a journey order before it ships (`PATCH /orders/:id`, A-8). Delivery details, fee and
 * note change until SHIPPING; the lines only while CONFIRMED - a packed order's goods are locked to
 * them (cancel and re-create to change goods). A deposit the edit would move off the money already
 * taken is refused (ORDER_DEPOSIT_CHANGED); the form offers to keep the amount taken.
 */
export function EditOrderDialog({ order, open, onOpenChange, onSaved }: Props) {
  const linesEditable = order.status === "CONFIRMED";
  const initialLines = React.useMemo(() => draftsOf(order), [order]);
  const [lines, setLines] = React.useState(initialLines);
  const [fulfillmentType, setFulfillmentType] = React.useState<string>(order.fulfillmentType);
  const [recipientName, setRecipientName] = React.useState(order.recipientName ?? "");
  const [recipientPhone, setRecipientPhone] = React.useState(order.recipientPhone ?? "");
  const [deliveryAddress, setDeliveryAddress] = React.useState(order.deliveryAddress ?? "");
  const [requestedDeliveryDate, setRequestedDeliveryDate] = React.useState(
    order.requestedDeliveryDate ?? "",
  );
  const [shippingFee, setShippingFee] = React.useState(String(order.shippingFee));
  const [note, setNote] = React.useState(order.note ?? "");
  const [stockLocation, setStockLocation] = React.useState<{
    id: string;
    type: LocationType;
  } | null>(null);
  const [depositGap, setDepositGap] = React.useState<MoneyGap | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Stock for lines added here is read where the branch ships from, as on create.
  React.useEffect(() => {
    if (!linesEditable) return;
    let stale = false;
    branchApi
      .getById(order.branch.id)
      .then((branch) => {
        if (stale) return;
        setStockLocation(
          branch.defaultFulfillmentLocationId
            ? { id: branch.defaultFulfillmentLocationId, type: "WAREHOUSE" }
            : { id: branch.id, type: "BRANCH" },
        );
      })
      .catch(() => {
        if (!stale) setStockLocation({ id: order.branch.id, type: "BRANCH" });
      });
    return () => {
      stale = true;
    };
  }, [linesEditable, order.branch.id]);

  const linesChanged = linesEditable && linesKey(lines) !== linesKey(initialLines);
  const fee = Number(shippingFee);
  const valid =
    Number.isFinite(fee) &&
    fee >= 0 &&
    (!linesChanged || (lines.length > 0 && lines.every((l) => l.quantity >= 1)));

  function payload(keepDeposit?: number): UpdateOrderPayload {
    return {
      fulfillmentType: fulfillmentType as UpdateOrderPayload["fulfillmentType"],
      recipientName: recipientName.trim() || undefined,
      recipientPhone: recipientPhone.trim() || undefined,
      deliveryAddress: deliveryAddress.trim() || undefined,
      requestedDeliveryDate: requestedDeliveryDate || undefined,
      shippingFee: Math.round(fee),
      note: note.trim() || undefined,
      // Lines are sent only when they changed: sending them reprices the order.
      ...(linesChanged
        ? {
            items: lines.map((line) => ({
              id: line.id,
              productItemId: line.productItemId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountAmount: line.discountAmount,
            })),
          }
        : {}),
      ...(keepDeposit !== undefined
        ? { deposit: { type: "AMOUNT" as const, value: keepDeposit, method: "CASH" as const } }
        : {}),
    };
  }

  async function save(keepDeposit?: number) {
    if (!valid) return;
    setSaving(true);
    try {
      const saved = await orderJourneyApi.update(order.id, payload(keepDeposit));
      toast.success("Đã lưu đơn hàng");
      onSaved(saved);
    } catch (error) {
      const gap = depositChangeOf(error);
      if (gap) {
        setDepositGap(gap);
      } else {
        toast.error(getApiErrorBody(error)?.message ?? "Không lưu được đơn hàng");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Sửa đơn {order.code}</DialogTitle>
          <DialogDescription>
            {linesEditable
              ? "Sửa được hàng, giao hàng và phí giao. Đổi hàng sẽ tính lại tổng tiền."
              : "Đơn đã đóng gói: hàng đã khoá theo các dòng nên không đổi được (muốn đổi hàng thì huỷ rồi tạo lại). Vẫn sửa được thông tin giao, phí giao và ghi chú."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          {linesEditable && (
            <div className="space-y-2">
              <Label>Hàng</Label>
              <OrderLinesEditor lines={lines} onChange={setLines} stockLocation={stockLocation} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Hình thức nhận</Label>
              <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOURNEY_FULFILLMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FULFILLMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Ngày khách hẹn giao</Label>
              <Input
                type="date"
                value={requestedDeliveryDate}
                onChange={(e) => setRequestedDeliveryDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Người nhận</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Số điện thoại người nhận</Label>
              <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Địa chỉ giao</Label>
              <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Phí giao hàng</Label>
              <Input
                type="number"
                min={0}
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ghi chú</Label>
              <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>

          {depositGap && (
            <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
              <p className="font-medium">Tiền cọc sẽ lệch với số đã thu</p>
              <p>
                Sau khi sửa, tiền cọc thành {formatVND(depositGap.amount)} nhưng khách đã đặt cọc{" "}
                {formatVND(depositGap.held)}. Hệ thống chưa ghi được khoản thu thêm hay trả bớt khi sửa
                đơn, nên chỉ lưu được nếu giữ nguyên tiền cọc đã thu.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDepositGap(null)}>
                  Thôi, sửa lại
                </Button>
                <Button size="sm" disabled={saving} onClick={() => save(depositGap.held)}>
                  Giữ cọc {formatVND(depositGap.held)} và lưu
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={() => save()} disabled={!valid || saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
