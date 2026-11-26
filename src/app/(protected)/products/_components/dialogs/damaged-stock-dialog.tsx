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
import { inventoryApi, type DamagedAction } from "@/lib/api/inventory";
import { getApiErrorBody, messageForCode } from "@/lib/api/error-codes";
import type { StockDetail } from "@/types/product";

/** Hàng dùng chung trên kệ, không gắn dòng đơn nào. */
const SHARED = "shared";

const COPY: Record<
  DamagedAction,
  { title: string; verb: string; done: string; hint: string }
> = {
  mark: {
    title: "Đánh dấu hàng hỏng",
    verb: "Đánh dấu hỏng",
    done: "Đã đánh dấu hỏng",
    hint: "Hàng hỏng vẫn nằm tại đây nhưng không tính vào tồn bán được, không bán hay đóng gói được.",
  },
  repair: {
    title: "Hàng hỏng đã sửa xong",
    verb: "Xác nhận sửa xong",
    done: "Đã đưa hàng sửa xong về lại tồn bán được",
    hint: "Hàng về lại kệ với giá vốn và ngày nhập cũ, bán được ngay.",
  },
  writeOff: {
    title: "Huỷ / thanh lý hàng hỏng",
    verb: "Huỷ hàng hỏng",
    done: "Đã huỷ hàng hỏng",
    hint: "Hàng rời khỏi sổ kho, không hoàn tác được.",
  },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DamagedAction;
  detail: StockDetail;
  /** SKU hoặc tên phiên bản, để hiện trong tiêu đề. */
  itemLabel: string;
  onDone: () => void;
};

/** Dialog cho ba thao tác hàng hỏng trên một dòng tồn. */
export function DamagedStockDialog({
  open,
  onOpenChange,
  action,
  detail,
  itemLabel,
  onDone,
}: Props) {
  const copy = COPY[action];
  const customUnits = detail.customUnits ?? [];
  const customTotal = customUnits.reduce((sum, unit) => sum + unit.quantity, 0);
  // Kệ gồm cả chiếc may riêng; phần dùng chung là ước lượng, BE kiểm lại chính xác.
  const sharedOnShelf = Math.max(0, (detail.shelf ?? detail.stock) - customTotal);

  const [source, setSource] = React.useState(SHARED);
  const [quantity, setQuantity] = React.useState("1");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSource(SHARED);
      setQuantity("1");
      setNote("");
    }
  }, [open]);

  const max =
    action === "mark"
      ? source === SHARED
        ? sharedOnShelf
        : (customUnits.find((unit) => unit.orderItemId === source)?.quantity ?? 0)
      : (detail.damagedQuantity ?? 0);
  const amount = Number(quantity);
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= max;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    try {
      await inventoryApi.changeDamaged(detail.inventoryId, action, {
        quantity: amount,
        orderItemId: action === "mark" && source !== SHARED ? source : undefined,
        note: note.trim() || undefined,
      });
      toast.success(`${copy.done}: ${amount} ${itemLabel} tại ${detail.location.name}`);
      onOpenChange(false);
      onDone();
    } catch (error) {
      const body = getApiErrorBody(error);
      toast.error(messageForCode(body?.code) ?? body?.message ?? "Không thực hiện được");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            {itemLabel} tại {detail.location.name}. {copy.hint}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {action === "mark" && customUnits.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="damaged-source">Chiếc nào bị hỏng</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="damaged-source" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SHARED}>
                    Hàng thường trên kệ ({sharedOnShelf})
                  </SelectItem>
                  {customUnits.map((unit) => (
                    <SelectItem key={unit.orderItemId} value={unit.orderItemId}>
                      Chiếc may riêng cho đơn {unit.orderCode || "?"} ({unit.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {source !== SHARED && (
                <p className="text-xs text-muted-foreground">
                  Đơn này sẽ hiện thiếu hàng cho tới khi chiếc này sửa xong; sửa xong thì chiếc đó
                  vẫn thuộc đơn này.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="damaged-quantity">Số lượng</Label>
            <Input
              id="damaged-quantity"
              type="number"
              inputMode="numeric"
              min={1}
              max={max}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground tabular-nums">
              {action === "mark" ? `Còn ${max} trên kệ` : `Đang có ${max} hàng hỏng`}
              {max === 0 && " - không có gì để xử lý"}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="damaged-note">Lý do / ghi chú</Label>
            <Textarea
              id="damaged-note"
              rows={2}
              placeholder={action === "mark" ? "VD: trầy mặt bàn, rách đệm" : undefined}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Hủy
          </Button>
          <Button
            variant={action === "writeOff" ? "destructive" : "default"}
            onClick={submit}
            disabled={!valid || saving}
          >
            {copy.verb}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
