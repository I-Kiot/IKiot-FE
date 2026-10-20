"use client";

// Chi tiết một YCSX cho nhân viên xưởng: từng dòng đặt / đã nhận / đang chờ nhận / còn giao được,
// form tạo phiếu giao (giao thiếu được), và các phiếu đã tạo (rút lại phiếu còn chờ nhận).

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { workshopApi } from "@/lib/api/production-delivery";
import { personName, type ProductionRequest } from "@/types/order-flow";
import { CancelDeliveryDialog } from "../../exchange/production-requests/components/cancel-delivery-dialog";
import {
  deliverableQuantity,
  deliveryStatusDisplay,
  formatDate,
  formatDateTime,
  requestStatusDisplay,
} from "../../exchange/production-requests/shared/production-display";

type DetailState = { status: "loading" } | { status: "error" } | { status: "ready"; request: ProductionRequest };

interface Props {
  /** YCSX đang mở; `null` = đóng. Trang đặt `key` theo id nên mỗi lần mở là state mới. */
  requestId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

const toInt = (value: string) => (value.trim() === "" ? 0 : Math.floor(Number(value)));

export function WorkshopRequestSheet({ requestId, onClose, onChanged }: Props) {
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    workshopApi.getRequest(requestId).then(
      (request) => {
        if (!cancelled) setState({ status: "ready", request });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const request = state.status === "ready" ? state.request : null;
  const canDeliver = request?.status === "SENT" || request?.status === "PARTIALLY_RECEIVED";

  const problems = Object.fromEntries(
    (request?.items ?? []).map((line) => {
      const qty = toInt(inputs[line.id] ?? "");
      const room = deliverableQuantity(line);
      if (qty < 0) return [line.id, "Số lượng không được âm"];
      if (qty > room) return [line.id, `Chỉ còn giao được ${room}`];
      return [line.id, null];
    }),
  );
  const delivering = (request?.items ?? []).filter((line) => toInt(inputs[line.id] ?? "") > 0);
  const valid = delivering.length > 0 && Object.values(problems).every((p) => p === null);

  function applyUpdated(updated: ProductionRequest) {
    setState({ status: "ready", request: updated });
    setInputs({});
    setNote("");
    onChanged();
  }

  async function submit() {
    if (!request || !valid) return;
    setSaving(true);
    try {
      const updated = await workshopApi.createDelivery(request.id, {
        items: delivering.map((line) => ({
          productionRequestItemId: line.id,
          quantity: toInt(inputs[line.id]),
        })),
        note: note.trim() || undefined,
      });
      toast.success("Đã tạo phiếu giao - chờ nơi nhận kiểm hàng");
      applyUpdated(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không tạo được phiếu giao");
    } finally {
      setSaving(false);
    }
  }

  async function cancelDelivery(reason: string) {
    if (!request || !cancelId) return;
    try {
      await workshopApi.cancelDelivery(cancelId, reason);
      toast.success("Đã rút lại phiếu giao");
      setCancelId(null);
      applyUpdated(await workshopApi.getRequest(request.id));
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không rút lại được phiếu giao");
      throw error;
    }
  }

  return (
    <Sheet open={requestId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{request ? request.code : state.status === "error" ? "Không tải được" : "Đang tải..."}</SheetTitle>
          {request && (
            <SheetDescription>
              Giao về {request.location.name} · hẹn xong {formatDate(request.expectedReadyDate)}
            </SheetDescription>
          )}
        </SheetHeader>

        {request && (
          <div className="space-y-5 px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const badge = requestStatusDisplay(request.status, request.closedShort);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              })()}
              {request.note && <span className="text-sm text-muted-foreground">{request.note}</span>}
            </div>

            <div className="space-y-3">
              {request.items.map((line) => {
                const room = deliverableQuantity(line);
                return (
                  <div key={line.id} className="space-y-2 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.sku ?? "-"}
                        {line.orderItem?.orderCode ? ` · đơn ${line.orderItem.orderCode}` : ""}
                        {line.note ? ` · ${line.note}` : ""}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <div className="text-muted-foreground">Đặt</div>
                        <div className="text-base font-semibold tabular-nums">{line.quantity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Đã nhận</div>
                        <div className="text-base font-semibold tabular-nums">{line.receivedQuantity}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Chờ nhận</div>
                        <div className="text-base font-semibold tabular-nums text-amber-600">
                          {line.pendingDeliveryQuantity}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Còn giao</div>
                        <div className="text-base font-semibold tabular-nums">{room}</div>
                      </div>
                    </div>
                    {canDeliver && room > 0 && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={room}
                          placeholder="Giao lần này"
                          className="h-9"
                          value={inputs[line.id] ?? ""}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [line.id]: e.target.value }))}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInputs((prev) => ({ ...prev, [line.id]: String(room) }))}
                        >
                          Giao hết
                        </Button>
                      </div>
                    )}
                    {problems[line.id] && <div className="text-xs text-destructive">{problems[line.id]}</div>}
                  </div>
                );
              })}
            </div>

            {canDeliver && (
              <div className="space-y-2">
                <Label>Ghi chú phiếu giao</Label>
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                <Button className="w-full" onClick={submit} disabled={!valid || saving}>
                  {saving ? "Đang tạo..." : "Tạo phiếu giao"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Phiếu giao chưa nhập kho: nơi nhận kiểm hàng và xác nhận thì mới tính tồn và công nợ.
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Phiếu giao ({request.deliveries.length})</p>
              {request.deliveries.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có phiếu giao nào</p>
              )}
              {[...request.deliveries].reverse().map((delivery) => {
                const badge = deliveryStatusDisplay(delivery.status);
                const total = delivery.items.reduce((sum, item) => sum + item.quantity, 0);
                const counted = delivery.items.reduce((sum, item) => sum + (item.receivedQuantity ?? 0), 0);
                const defects = delivery.items.reduce((sum, item) => sum + (item.defectQuantity ?? 0), 0);
                return (
                  <div key={delivery.id} className="space-y-1 rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{delivery.code}</span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Giao {total} · {formatDateTime(delivery.createdAt)} · {personName(delivery.createdBy)}
                    </div>
                    {delivery.status === "RECEIVED" && (
                      <div>
                        Nơi nhận đếm {counted}
                        {defects > 0 ? `, trong đó ${defects} lỗi` : ""} · {formatDateTime(delivery.receivedAt)}
                      </div>
                    )}
                    {delivery.status === "CANCELLED" && delivery.cancelReason && (
                      <div className="text-muted-foreground">Lý do huỷ: {delivery.cancelReason}</div>
                    )}
                    {delivery.status === "PENDING" && (
                      <Button variant="outline" size="sm" onClick={() => setCancelId(delivery.id)}>
                        Rút lại phiếu
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <CancelDeliveryDialog
          open={cancelId !== null}
          onOpenChange={(open) => !open && setCancelId(null)}
          title="Rút lại phiếu giao"
          description="Phiếu chưa được nơi nhận xác nhận nên chưa đụng tồn kho. Số lượng của phiếu được trả lại để giao bằng phiếu khác."
          confirmLabel="Rút lại"
          onConfirm={cancelDelivery}
        />
      </SheetContent>
    </Sheet>
  );
}
