"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import type {
  ProductionRequest,
  ProductionRequestLinePayload,
} from "@/types/order-flow";
import { lineKey, useProduction, type DraftLine } from "./production-provider";
import { ProductionProductPicker } from "./production-product-picker";

/** Each dialog's content mounts fresh on every opening (`key`), so its form starts from the props rather than being reset in an effect. */
export function ProductionDialogs() {
  const { dialog, setDialog } = useProduction();
  const [opening, setOpening] = useState(0);
  const [lastDialog, setLastDialog] = useState(dialog);
  if (dialog !== lastDialog) {
    setLastDialog(dialog);
    if (dialog) setOpening((n) => n + 1);
  }
  const close = () => setDialog(null);
  return (
    <>
      <Dialog
        open={dialog?.kind === "create" || dialog?.kind === "edit"}
        onOpenChange={(v) => !v && close()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          {dialog?.kind === "create" || dialog?.kind === "edit" ? (
            <RequestForm
              key={opening}
              request={dialog.kind === "edit" ? dialog.request : undefined}
              initialOnlyShort={
                dialog.kind === "create" ? dialog.onlyShort : undefined
              }
              onClose={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog?.kind === "receive"}
        onOpenChange={(v) => !v && close()}
      >
        <DialogContent className="sm:max-w-4xl">
          {dialog?.kind === "receive" ? (
            <ReceiveForm
              key={opening}
              request={dialog.request}
              onClose={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog?.kind === "closeShort"}
        onOpenChange={(v) => !v && close()}
      >
        <DialogContent className="sm:max-w-xl">
          {dialog?.kind === "closeShort" ? (
            <CloseShortForm
              key={opening}
              request={dialog.request}
              onClose={close}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

const toPayload = (line: DraftLine): ProductionRequestLinePayload => ({
  productItemId: line.productItemId,
  quantity: line.quantity,
  orderItemId: line.orderItemId,
  note: line.note,
});

// ─── Create / edit ──────────────────────────────────────────────────────────

function linesOf(request: ProductionRequest): DraftLine[] {
  return request.items.map((line) => ({
    productItemId: line.productItemId,
    quantity: line.quantity,
    orderItemId: line.orderItem?.id,
    note: line.note ?? undefined,
    label: `${line.sku ? `${line.sku} · ` : ""}${line.productName}${line.orderItem?.orderCode ? ` (đơn ${line.orderItem.orderCode})` : ""}`,
  }));
}

/** Create or edit (DRAFT) a request. Products are picked inside the dialog, from every SKU at the receiving location, with what needs ordering first. */
function RequestForm({
  request,
  initialOnlyShort,
  onClose,
}: {
  request?: ProductionRequest;
  initialOnlyShort?: boolean;
  onClose: () => void;
}) {
  const { workshops, locations, scopedLocationId, create, update } =
    useProduction();
  const sellable = locations.filter((l) => l.isSellable);
  const [supplierId, setSupplierId] = useState(request?.supplier.id ?? "");
  const [locationId, setLocationId] = useState(
    request?.location.id ?? scopedLocationId ?? "",
  );
  const [expectedReadyDate, setExpectedReadyDate] = useState(
    request?.expectedReadyDate?.slice(0, 10) ?? "",
  );
  const [note, setNote] = useState(request?.note ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() =>
    request ? linesOf(request) : [],
  );
  const [saving, setSaving] = useState(false);
  const picked = new Set(lines.map(lineKey));

  const togglePicked = (line: DraftLine) =>
    setLines((prev) =>
      prev.some((l) => lineKey(l) === lineKey(line))
        ? prev.filter((l) => lineKey(l) !== lineKey(line))
        : [...prev, line],
    );
  // The picker's numbers (and any custom piece's order line) belong to one location, so a
  // different receiving location starts the selection over.
  const changeLocation = (next: string) => {
    if (next !== locationId) setLines([]);
    setLocationId(next);
  };

  const valid =
    !!supplierId &&
    !!locationId &&
    lines.length > 0 &&
    lines.every((line) => line.quantity >= 1);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const payload = {
      supplierId,
      locationId,
      expectedReadyDate: expectedReadyDate || undefined,
      note: note.trim() || undefined,
      items: lines.map(toPayload),
    };
    const ok = request
      ? await update(request.id, payload)
      : await create(payload);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {request ? `Sửa ${request.code}` : "Tạo yêu cầu sản xuất"}
        </DialogTitle>
        <DialogDescription>
          Yêu cầu lưu ở trạng thái nháp. Liên hệ xưởng xong thì bấm “Đã gửi
          xưởng” - hệ thống không tự gửi.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            Xưởng <span className="text-destructive">*</span>
          </Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue
                placeholder={
                  workshops.length ? "Chọn xưởng" : "Chưa có xưởng nào"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {workshops.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.supplierName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {workshops.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Thêm nhà cung cấp loại “Xưởng sản xuất” ở Giao dịch → Nhà cung
              cấp.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>
            Giao về <span className="text-destructive">*</span>
          </Label>
          <Select value={locationId} onValueChange={changeLocation}>
            <SelectTrigger className="w-full cursor-pointer">
              <SelectValue placeholder="Chọn kho / chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              {sellable.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({l.type === "BRANCH" ? "Chi nhánh" : "Kho"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Ngày hẹn xong</Label>
          <Input
            type="date"
            value={expectedReadyDate}
            onChange={(e) => setExpectedReadyDate(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Ghi chú</Label>
          <Textarea
            rows={2}
            className="resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Chọn mặt hàng</Label>
        {locationId ? (
          <ProductionProductPicker
            locationId={locationId}
            picked={picked}
            onToggle={togglePicked}
            initialOnlyShort={initialOnlyShort}
          />
        ) : (
          <p className="rounded-md border p-4 text-sm text-muted-foreground">
            Chọn nơi nhận hàng trước để xem tồn kho và số cần sản xuất ở đó.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Mặt hàng đã chọn ({lines.length})</Label>
        <LinesEditor lines={lines} onChange={setLines} />
      </div>

      <DialogFooter>
        <Button variant="outline" className="cursor-pointer" onClick={onClose}>
          Đóng
        </Button>
        <Button
          className="cursor-pointer"
          disabled={!valid || saving}
          onClick={submit}
        >
          {request ? "Lưu" : "Tạo yêu cầu"}
        </Button>
      </DialogFooter>
    </>
  );
}

function LinesEditor({
  lines,
  onChange,
}: {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
}) {
  if (lines.length === 0) {
    return (
      <p className="rounded-md border p-4 text-sm text-muted-foreground">
        Chưa chọn mặt hàng nào. Tick ở danh sách phía trên; số đặt điền sẵn bằng
        số cần sản xuất, sửa được ở đây.
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mặt hàng</TableHead>
            <TableHead className="w-28 text-right">Số đặt</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={`${line.productItemId}-${line.orderItemId ?? ""}`}>
              <TableCell className="text-sm">{line.label}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={1}
                  className="h-8 text-right"
                  value={line.quantity}
                  onChange={(e) =>
                    onChange(
                      lines.map((l, i) =>
                        i === index
                          ? {
                              ...l,
                              quantity: Math.max(
                                0,
                                Math.floor(Number(e.target.value) || 0),
                              ),
                            }
                          : l,
                      ),
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 cursor-pointer"
                  onClick={() => onChange(lines.filter((_, i) => i !== index))}
                  aria-label="Bỏ dòng"
                >
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Receive the workshop's goods ───────────────────────────────────────────

interface ReceiveRow {
  received: number;
  defect: number;
  unitCost?: number;
}

function ReceiveForm({
  request,
  onClose,
}: {
  request: ProductionRequest;
  onClose: () => void;
}) {
  const { receive, locations } = useProduction();
  const [rows, setRows] = useState<Record<string, ReceiveRow>>(() =>
    Object.fromEntries(
      request.items.map((line) => [line.id, { received: 0, defect: 0 }]),
    ),
  );
  const [defectLocationId, setDefectLocationId] = useState("DEFAULT");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const damagedLocations = useMemo(
    () => locations.filter((l) => !l.isSellable),
    [locations],
  );
  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const line of request.items) {
      const row = rows[line.id];
      if (!row) continue;
      const remaining = line.quantity - line.receivedQuantity;
      if (row.received > remaining) out[line.id] = `Chỉ còn ${remaining}`;
      else if (row.defect > row.received) out[line.id] = "Số lỗi vượt số nhận";
    }
    return out;
  }, [rows, request]);
  const totalReceived = Object.values(rows).reduce(
    (sum, row) => sum + row.received,
    0,
  );
  const totalDefect = Object.values(rows).reduce(
    (sum, row) => sum + row.defect,
    0,
  );

  const set = (id: string, patch: Partial<ReceiveRow>) =>
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submit = async () => {
    if (totalReceived === 0 || Object.keys(errors).length) return;
    setSaving(true);
    const ok = await receive(request.id, {
      items: Object.entries(rows)
        .filter(([, row]) => row.received > 0)
        .map(([productionRequestItemId, row]) => ({
          productionRequestItemId,
          receivedQuantity: row.received,
          defectQuantity: row.defect || undefined,
          unitCost: row.unitCost,
        })),
      defectLocationId:
        totalDefect > 0 && defectLocationId !== "DEFAULT"
          ? defectLocationId
          : undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    if (ok) onClose();
  };

  const toInt = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nhận hàng xưởng · {request.code}</DialogTitle>
        <DialogDescription>
          Kiểm hàng thực tế rồi nhập số đã nhận lần này. Hàng đạt vào{" "}
          {request.location.name}, tồn kho tăng ngay. Hàng lỗi vào kho hàng
          hỏng, không bán được.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mặt hàng</TableHead>
              <TableHead className="text-right">Đã nhận / đặt</TableHead>
              <TableHead className="w-24 text-right">Nhận lần này</TableHead>
              <TableHead className="w-24 text-right">Trong đó lỗi</TableHead>
              <TableHead className="w-40 text-right">Giá xưởng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {request.items.map((line) => {
              const row = rows[line.id] ?? { received: 0, defect: 0 };
              const done = line.receivedQuantity >= line.quantity;
              return (
                <TableRow key={line.id}>
                  <TableCell className="text-sm">
                    {line.sku ? `${line.sku} · ` : ""}
                    {line.productName}
                    {errors[line.id] ? (
                      <div className="text-xs text-destructive">
                        {errors[line.id]}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {line.receivedQuantity}/{line.quantity}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-right"
                      disabled={done}
                      value={row.received}
                      onChange={(e) =>
                        set(line.id, { received: toInt(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-right"
                      disabled={done || row.received === 0}
                      value={row.defect}
                      onChange={(e) =>
                        set(line.id, { defect: toInt(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <MoneyInput
                      placeholder="Giá vốn SKU"
                      value={row.unitCost}
                      disabled={done || row.received === 0}
                      // Cleared = the SKU's cost price; 0 would book the workshop for nothing.
                      onChange={(value) =>
                        set(line.id, {
                          unitCost: value > 0 ? value : undefined,
                        })
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {totalDefect > 0 ? (
          <div className="space-y-2">
            <Label>Để hàng lỗi ở</Label>
            <Select
              value={defectLocationId}
              onValueChange={setDefectLocationId}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">
                  Kho hàng hỏng mặc định của nơi nhận
                </SelectItem>
                {damagedLocations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="space-y-2 sm:col-span-2">
          <Label>Ghi chú phiếu nhập</Label>
          <Textarea
            rows={2}
            className="resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" className="cursor-pointer" onClick={onClose}>
          Đóng
        </Button>
        <Button
          className="cursor-pointer"
          disabled={
            totalReceived === 0 || Object.keys(errors).length > 0 || saving
          }
          onClick={submit}
        >
          Nhập kho{" "}
          {totalReceived > 0
            ? `(${totalReceived - totalDefect} đạt${totalDefect ? `, ${totalDefect} lỗi` : ""})`
            : ""}
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Close short ────────────────────────────────────────────────────────────

/** The workshop will not make the rest: close the request, keep what arrived, stop waiting for the remainder. */
function CloseShortForm({
  request,
  onClose,
}: {
  request: ProductionRequest;
  onClose: () => void;
}) {
  const { closeShort } = useProduction();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const outstanding = request.items.filter(
    (line) => line.receivedQuantity < line.quantity,
  );

  const submit = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    const ok = await closeShort(request.id, reason.trim());
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Đóng {request.code}, bỏ phần còn lại</DialogTitle>
        <DialogDescription>
          Hàng đã nhận giữ nguyên. Phần chưa giao sẽ không còn tính là “đã đặt
          xưởng”, nên các mặt hàng này có thể hiện lại trong danh sách cần sản
          xuất để đặt xưởng khác. Không mở lại được.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-1 rounded-md border p-3 text-sm">
        {outstanding.map((line) => (
          <li key={line.id} className="flex justify-between gap-2">
            <span>
              {line.sku ? `${line.sku} · ` : ""}
              {line.productName}
            </span>
            <span className="tabular-nums text-muted-foreground">
              đã nhận {line.receivedQuantity}/{line.quantity} · bỏ{" "}
              <strong className="text-destructive">
                {line.quantity - line.receivedQuantity}
              </strong>
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <Label>
          Lý do <span className="text-destructive">*</span>
        </Label>
        <Textarea
          rows={3}
          className="resize-none"
          placeholder="VD: Xưởng ngừng sản xuất mẫu này"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" className="cursor-pointer" onClick={onClose}>
          Không đóng
        </Button>
        <Button
          variant="destructive"
          className="cursor-pointer"
          disabled={!reason.trim() || saving}
          onClick={submit}
        >
          Đóng yêu cầu
        </Button>
      </DialogFooter>
    </>
  );
}
