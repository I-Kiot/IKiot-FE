"use client";

import * as React from "react";
import { PAST_DATE_MESSAGE, isPastDate, todayIso } from "@/lib/date-input";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
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
import { useLineStockAt } from "../../shared/use-line-stock-at";
import type { LocationType } from "@/types/location";
import {
  FULFILLMENT_TYPE_LABELS,
  type OrderDetail,
  type SourceLocation,
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

/** Dòng của đơn dưới dạng nháp, chỉ dòng cấp trên; thành phần combo do server tính theo số lượng combo. */
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
 * D-7: sửa đơn tạo tay trước khi giao (`PATCH /orders/:id`, A-8). Thông tin giao, phí và ghi chú sửa được tới SHIPPING;
 * dòng hàng chỉ sửa khi CONFIRMED (đơn đã đóng gói thì hàng bị khoá, muốn đổi thì huỷ rồi tạo lại). Đổi cọc làm lệch số tiền đã thu
 * sẽ bị từ chối (ORDER_DEPOSIT_CHANGED); form cho phép giữ nguyên số đã thu.
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
  const [branchSource, setBranchSource] = React.useState<{
    id: string;
    type: LocationType;
  } | null>(null);
  const [depositGap, setDepositGap] = React.useState<MoneyGap | null>(null);
  const [saving, setSaving] = React.useState(false);

  // Đơn chỉ đóng gói được khi xuất từ một nơi, nên dòng thêm mới theo nguồn hàng của các dòng đang có.
  const existingSource = order.items.find((line) => line.sourceLocation)?.sourceLocation ?? null;
  const hasSource = existingSource !== null;
  // Tồn của dòng thêm mới đọc tại nguồn hàng của đơn; đơn chưa có nguồn thì tại kho xuất của chi nhánh, như khi tạo đơn.
  const [sourceOptions, setSourceOptions] = React.useState<SourceLocation[]>([]);
  const [pickedSourceId, setPickedSourceId] = React.useState<string | null>(null);
  const picked = sourceOptions.find((location) => location.id === pickedSourceId);
  const current = picked ?? existingSource;
  const stockLocation = current ? { id: current.id, type: current.type } : branchSource;
  // Đóng gói xong hàng đã khoá tại nơi cũ nên chỉ đổi được khi còn CONFIRMED.
  const sourceChanged = picked !== undefined && picked.id !== existingSource?.id;

  useLineStockAt(stockLocation, lines, setLines);

  React.useEffect(() => {
    if (!linesEditable) return;
    let stale = false;
    orderJourneyApi
      .sourceLocations()
      .then((locations) => {
        if (!stale) setSourceOptions(locations);
      })
      .catch(() => {
        // Không tải được thì giữ nguồn hàng hiện tại.
      });
    return () => {
      stale = true;
    };
  }, [linesEditable]);

  React.useEffect(() => {
    if (!linesEditable || hasSource) return;
    let stale = false;
    branchApi
      .getById(order.branch.id)
      .then((branch) => {
        if (stale) return;
        setBranchSource(
          branch.defaultFulfillmentLocationId
            ? { id: branch.defaultFulfillmentLocationId, type: "WAREHOUSE" }
            : { id: branch.id, type: "BRANCH" },
        );
      })
      .catch(() => {
        if (!stale) setBranchSource({ id: order.branch.id, type: "BRANCH" });
      });
    return () => {
      stale = true;
    };
  }, [linesEditable, hasSource, order.branch.id]);

  const linesChanged = linesEditable && linesKey(lines) !== linesKey(initialLines);
  const pickup = fulfillmentType === "STORE_PICKUP";
  // Chuyển giữa khách tới lấy và giao tận nơi chỉ khi chưa có ai mang hàng đi (BE: ORDER_FULFILLMENT_TYPE_LOCKED).
  const hasOpenShipment = order.shipments.some(
    (shipment) => !["DELIVERED", "FAILED", "RETURNED", "CANCELLED"].includes(shipment.status),
  );
  // Đã thu tại quầy (PAID mà tổng trừ cọc vẫn > 0) thì đổi sang giao tận nơi sẽ thu lần nữa (BE: ORDER_PICKUP_ALREADY_COLLECTED).
  const collectedAtCounter =
    order.fulfillmentType === "STORE_PICKUP" && order.paymentStatus === "PAID" && order.amountDue > 0;
  const shippedOff = !(order.status === "CONFIRMED" || (order.status === "PACKED" && !hasOpenShipment));
  const typeLocked = shippedOff || collectedAtCounter;
  const fee = pickup ? 0 : Number(shippingFee);
  // Chỉ kiểm tra ngày khi người dùng đổi ngày: đơn đã quá ngày hẹn vẫn phải sửa được các trường khác.
  const dateError =
    requestedDeliveryDate !== (order.requestedDeliveryDate ?? "") && isPastDate(requestedDeliveryDate)
      ? PAST_DATE_MESSAGE
      : undefined;
  const valid =
    !dateError &&
    Number.isFinite(fee) &&
    fee >= 0 &&
    (!linesChanged || (lines.length > 0 && lines.every((l) => l.quantity >= 1)));

  function payload(keepDeposit?: number): UpdateOrderPayload {
    return {
      fulfillmentType: fulfillmentType as UpdateOrderPayload["fulfillmentType"],
      recipientName: recipientName.trim() || undefined,
      recipientPhone: recipientPhone.trim() || undefined,
      deliveryAddress: pickup ? undefined : deliveryAddress.trim() || undefined,
      requestedDeliveryDate: requestedDeliveryDate || undefined,
      shippingFee: Math.round(fee),
      note: note.trim() || undefined,
      ...(sourceChanged ? { sourceLocationId: picked.id } : {}),
      // Chỉ gửi dòng khi có thay đổi: gửi dòng là server tính lại giá đơn.
      ...(linesChanged
        ? {
            items: lines.map((line) => ({
              id: line.id,
              productItemId: line.productItemId,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountAmount: line.discountAmount,
              ...(!line.id && current ? { sourceLocationId: current.id } : {}),
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
          {(linesEditable || existingSource) && (
            <div className="grid gap-2">
              <Label>Nguồn hàng</Label>
              <Select
                value={stockLocation?.id ?? ""}
                onValueChange={setPickedSourceId}
                disabled={!linesEditable || sourceOptions.length === 0}
              >
                <SelectTrigger className="w-full" aria-label="Nguồn hàng">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(sourceOptions.length > 0 ? sourceOptions : existingSource ? [existingSource] : []).map(
                    (location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {linesEditable
                  ? "Cả đơn xuất từ một nơi, đổi được tới trước khi đóng gói. Yêu cầu sản xuất đang mở vẫn giao về nơi cũ."
                  : "Đơn đã đóng gói nên không đổi được nguồn hàng."}
              </p>
            </div>
          )}

          {linesEditable && (
            <div className="space-y-2">
              <Label>Hàng</Label>
              <OrderLinesEditor lines={lines} onChange={setLines} stockLocation={stockLocation} />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Hình thức nhận</Label>
              <Select value={fulfillmentType} onValueChange={setFulfillmentType} disabled={typeLocked}>
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
              {typeLocked && (
                <p className="text-xs text-muted-foreground">
                  {collectedAtCounter
                    ? "Đơn đã thu tiền tại quầy nên không đổi được hình thức nhận."
                    : "Đơn đã giao cho vận chuyển nên không đổi được hình thức nhận."}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>{pickup ? "Ngày khách hẹn lấy hàng" : "Ngày khách hẹn giao"}</Label>
              <Input
                type="date"
                min={todayIso()}
                value={requestedDeliveryDate}
                onChange={(e) => setRequestedDeliveryDate(e.target.value)}
              />
              {dateError && <p className="text-xs text-destructive">{dateError}</p>}
            </div>
            <div className="grid gap-2">
              <Label>{pickup ? "Người đến lấy hàng" : "Người nhận"}</Label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{pickup ? "SĐT người đến lấy" : "Số điện thoại người nhận"}</Label>
              <Input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
            </div>
            {!pickup && (
              <>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Địa chỉ giao</Label>
                  <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Phí giao hàng</Label>
                  <MoneyInput
                    value={Number(shippingFee) || 0}
                    onChange={(next) => setShippingFee(String(next))}
                  />
                </div>
              </>
            )}
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
