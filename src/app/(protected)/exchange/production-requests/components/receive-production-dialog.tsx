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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type { ProductionRequest } from "@/types/order-flow";
import { useProductionOptions } from "../shared/use-production-options";

const DEFAULT_DEFECT_LOCATION = "default";

type LineInput = { received: string; defect: string; unitCost: string };

type Props = {
  request: ProductionRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceived: (request: ProductionRequest) => void;
};

const toInt = (value: string) => (value.trim() === "" ? 0 : Math.floor(Number(value)));

/**
 * B-7: record what the workshop delivered (`POST /production-requests/:id/receive`, contract §3).
 * The only way workshop goods enter stock: good units go on sale at the request's location, defects
 * to its damaged-goods location; the workshop's payable is the good units × its price.
 */
export function ReceiveProductionDialog({ request, open, onOpenChange, onReceived }: Props) {
  const { locations } = useProductionOptions();
  const pending = request.items.filter((line) => line.receivedQuantity < line.quantity);
  const [inputs, setInputs] = React.useState<Record<string, LineInput>>(() =>
    Object.fromEntries(
      pending.map((line) => [line.id, { received: "", defect: "", unitCost: "" }]),
    ),
  );
  const [defectLocationId, setDefectLocationId] = React.useState(DEFAULT_DEFECT_LOCATION);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const set = (id: string, patch: Partial<LineInput>) =>
    setInputs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  /** Per line: why it cannot be sent as typed, or null. */
  const problems = pending.map((line) => {
    const input = inputs[line.id];
    const received = toInt(input.received);
    const defect = toInt(input.defect);
    const remaining = line.quantity - line.receivedQuantity;
    if (received < 0 || defect < 0) return "Số lượng không được âm";
    if (received > remaining) return `Còn ${remaining} chưa nhận`;
    if (defect > received) return "Số lỗi vượt số nhận";
    return null;
  });
  const anyReceived = pending.some((line) => toInt(inputs[line.id].received) > 0);
  const anyDefect = pending.some((line) => toInt(inputs[line.id].defect) > 0);
  const valid = anyReceived && problems.every((p) => p === null);

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      const updated = await productionRequestApi.receive(request.id, {
        items: pending
          .filter((line) => toInt(inputs[line.id].received) > 0)
          .map((line) => {
            const input = inputs[line.id];
            return {
              productionRequestItemId: line.id,
              receivedQuantity: toInt(input.received),
              defectQuantity: toInt(input.defect) || undefined,
              unitCost: input.unitCost.trim() === "" ? undefined : Number(input.unitCost),
            };
          }),
        defectLocationId:
          anyDefect && defectLocationId !== DEFAULT_DEFECT_LOCATION ? defectLocationId : undefined,
        note: note.trim() || undefined,
      });
      toast.success("Đã nhận hàng xưởng, tồn kho đã cập nhật");
      onReceived(updated);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không nhận được hàng");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nhận hàng xưởng - {request.code}</DialogTitle>
          <DialogDescription>
            Nhập số hàng {request.supplier.supplierName} giao lần này về {request.location.name}.
            Hàng đạt vào tồn bán được; hàng lỗi vào kho hàng hỏng. Bỏ trống giá xưởng thì dùng
            giá vốn của sản phẩm.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mặt hàng</TableHead>
                <TableHead className="text-right">Đã nhận / đặt</TableHead>
                <TableHead className="w-24 text-right">Nhận lần này</TableHead>
                <TableHead className="w-24 text-right">Trong đó lỗi</TableHead>
                <TableHead className="w-32 text-right">Giá xưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((line, index) => {
                const input = inputs[line.id];
                const remaining = line.quantity - line.receivedQuantity;
                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.sku ?? "-"}
                        {line.orderItem ? ` · đơn ${line.orderItem.orderCode ?? ""}` : ""}
                      </div>
                      {problems[index] && (
                        <div className="text-xs text-destructive">{problems[index]}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.receivedQuantity}/{line.quantity}
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-1 text-xs"
                        onClick={() => set(line.id, { received: String(remaining) })}
                      >
                        Nhận đủ
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={remaining}
                        className="h-8 text-right"
                        value={input.received}
                        onChange={(e) => set(line.id, { received: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-right"
                        value={input.defect}
                        onChange={(e) => set(line.id, { defect: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Giá vốn"
                        className="h-8 text-right"
                        value={input.unitCost}
                        onChange={(e) => set(line.id, { unitCost: e.target.value })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4">
          {anyDefect && (
            <div className="grid gap-2">
              <Label>Kho nhận hàng lỗi</Label>
              <Select value={defectLocationId} onValueChange={setDefectLocationId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_DEFECT_LOCATION}>
                    Mặc định (kho hàng hỏng của nơi nhận)
                  </SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label>Ghi chú</Label>
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Đang nhận..." : "Xác nhận nhận hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
