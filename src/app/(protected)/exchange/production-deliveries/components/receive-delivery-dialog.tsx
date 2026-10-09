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
import { getApiErrorBody } from "@/lib/api/error-codes";
import { productionDeliveryApi } from "@/lib/api/production-delivery";
import type { ProductionDelivery } from "@/types/order-flow";
import { useProductionOptions } from "../../production-requests/shared/use-production-options";

const DEFAULT_DEFECT_LOCATION = "default";

type LineInput = { received: string; defect: string; unitCost: string };

type Props = {
  delivery: ProductionDelivery;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReceived: () => void;
};

const toInt = (value: string) => (value.trim() === "" ? 0 : Math.floor(Number(value)));

/**
 * Nơi nhận kiểm hàng của một phiếu giao xưởng và xác nhận (`POST /production-deliveries/:id/receive`).
 * Đây là lúc tồn kho tăng: hàng đạt vào tồn bán được, hàng lỗi vào kho hàng hỏng, ghi công nợ xưởng.
 * Số nhận điền sẵn bằng số xưởng ghi, không được vượt.
 */
export function ReceiveDeliveryDialog({ delivery, open, onOpenChange, onReceived }: Props) {
  const { locations } = useProductionOptions();
  const [inputs, setInputs] = React.useState<Record<string, LineInput>>(() =>
    Object.fromEntries(
      delivery.items.map((line) => [
        line.productionRequestItemId,
        { received: String(line.quantity), defect: "", unitCost: "" },
      ]),
    ),
  );
  const [defectLocationId, setDefectLocationId] = React.useState(DEFAULT_DEFECT_LOCATION);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const set = (id: string, patch: Partial<LineInput>) =>
    setInputs((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const problems = delivery.items.map((line) => {
    const input = inputs[line.productionRequestItemId];
    const received = toInt(input.received);
    const defect = toInt(input.defect);
    if (received < 0 || defect < 0) return "Số lượng không được âm";
    if (received > line.quantity) return `Xưởng chỉ ghi giao ${line.quantity}`;
    if (defect > received) return "Số lỗi vượt số nhận";
    return null;
  });
  const anyReceived = delivery.items.some(
    (line) => toInt(inputs[line.productionRequestItemId].received) > 0,
  );
  const anyDefect = delivery.items.some(
    (line) => toInt(inputs[line.productionRequestItemId].defect) > 0,
  );
  const valid = anyReceived && problems.every((p) => p === null);

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      await productionDeliveryApi.receive(delivery.id, {
        items: delivery.items
          .filter((line) => toInt(inputs[line.productionRequestItemId].received) > 0)
          .map((line) => {
            const input = inputs[line.productionRequestItemId];
            return {
              productionRequestItemId: line.productionRequestItemId,
              receivedQuantity: toInt(input.received),
              defectQuantity: toInt(input.defect) || undefined,
              unitCost: input.unitCost.trim() === "" ? undefined : Number(input.unitCost),
            };
          }),
        defectLocationId:
          anyDefect && defectLocationId !== DEFAULT_DEFECT_LOCATION ? defectLocationId : undefined,
        note: note.trim() || undefined,
      });
      toast.success("Đã nhận phiếu giao, tồn kho đã cập nhật");
      onReceived();
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không nhận được phiếu giao");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Nhận phiếu giao {delivery.code} - {delivery.productionRequest.code}
          </DialogTitle>
          <DialogDescription>
            Kiểm hàng {delivery.productionRequest.supplier.supplierName} giao về{" "}
            {delivery.productionRequest.location.name} và nhập số thực nhận. Hàng đạt vào tồn bán
            được; hàng lỗi vào kho hàng hỏng. Bỏ trống giá xưởng thì dùng giá vốn của sản phẩm.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mặt hàng</TableHead>
                <TableHead className="text-right">Xưởng ghi</TableHead>
                <TableHead className="w-24 text-right">Thực nhận</TableHead>
                <TableHead className="w-24 text-right">Trong đó lỗi</TableHead>
                <TableHead className="w-32 text-right">Giá xưởng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.items.map((line, index) => {
                const input = inputs[line.productionRequestItemId];
                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {line.sku ?? "-"} · đã nhận {line.totalReceivedQuantity}/{line.orderedQuantity}
                      </div>
                      {problems[index] && (
                        <div className="text-xs text-destructive">{problems[index]}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{line.quantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={line.quantity}
                        className="h-8 text-right"
                        value={input.received}
                        onChange={(e) =>
                          set(line.productionRequestItemId, { received: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 text-right"
                        value={input.defect}
                        onChange={(e) => set(line.productionRequestItemId, { defect: e.target.value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Giá vốn"
                        className="h-8 text-right"
                        value={input.unitCost}
                        onChange={(e) =>
                          set(line.productionRequestItemId, { unitCost: e.target.value })
                        }
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
            Đóng
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Đang nhận..." : "Xác nhận nhận hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
