"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
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
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type { ProductionRequest } from "@/types/order-flow";
import { todayIso } from "../shared/production-display";
import { useProductionOptions } from "../shared/use-production-options";

/** One line being edited. `orderItemId` ties it to the order line it is made for (a custom piece always has one). */
export interface DraftLine {
  key: string;
  productItemId: string;
  sku: string | null;
  productName: string;
  quantity: number;
  orderItemId?: string;
  orderCode?: string | null;
  note?: string;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing a DRAFT; omitted = a new request. */
  request?: ProductionRequest | null;
  /** Prefill for a new request (from the production list). */
  initialLocationId?: string;
  initialLines?: DraftLine[];
  onSaved: (request: ProductionRequest) => void;
};

let lineSeq = 0;
const nextKey = () => `line-${++lineSeq}`;

function linesOf(request: ProductionRequest): DraftLine[] {
  return request.items.map((line) => ({
    key: nextKey(),
    productItemId: line.productItemId,
    sku: line.sku,
    productName: line.productName,
    quantity: line.quantity,
    orderItemId: line.orderItem?.id,
    orderCode: line.orderItem?.orderCode,
    note: line.note ?? undefined,
  }));
}

/** B-6: create a production request, or edit one still in DRAFT (contract §3). Mounted only while open, so each opening starts from its own state. */
export function ProductionRequestFormDialog({
  open,
  onOpenChange,
  request,
  initialLocationId,
  initialLines,
  onSaved,
}: Props) {
  const isEdit = !!request;
  const { workshops, locations, loading } = useProductionOptions();
  const [supplierId, setSupplierId] = React.useState(request?.supplier.id ?? "");
  const [locationId, setLocationId] = React.useState(
    request?.location.id ?? initialLocationId ?? "",
  );
  const [expectedReadyDate, setExpectedReadyDate] = React.useState(
    request?.expectedReadyDate ?? "",
  );
  const [note, setNote] = React.useState(request?.note ?? "");
  const [lines, setLines] = React.useState<DraftLine[]>(
    request ? linesOf(request) : (initialLines ?? []),
  );
  const [saving, setSaving] = React.useState(false);

  // A SKU may repeat only for different order lines (PRODUCTION_REQUEST_DUPLICATE_ITEM otherwise);
  // the search hides SKUs already on the request without an order line.
  const usedIds = React.useMemo(
    () => new Set(lines.filter((l) => !l.orderItemId).map((l) => l.productItemId)),
    [lines],
  );

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const valid =
    !!supplierId &&
    !!locationId &&
    lines.length > 0 &&
    lines.every((line) => Number.isInteger(line.quantity) && line.quantity >= 1);

  async function submit() {
    if (!valid) return;
    setSaving(true);
    const payload = {
      supplierId,
      locationId,
      expectedReadyDate: expectedReadyDate || undefined,
      note: note.trim() || undefined,
      items: lines.map((line) => ({
        productItemId: line.productItemId,
        quantity: line.quantity,
        orderItemId: line.orderItemId,
        note: line.note?.trim() || undefined,
      })),
    };
    try {
      const saved = isEdit
        ? await productionRequestApi.update(request!.id, payload)
        : await productionRequestApi.create(payload);
      toast.success(isEdit ? "Đã lưu yêu cầu sản xuất" : `Đã tạo ${saved.code}`);
      onSaved(saved);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không lưu được yêu cầu sản xuất");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Sửa ${request!.code}` : "Tạo yêu cầu sản xuất"}
          </DialogTitle>
          <DialogDescription>
            Lập danh sách hàng đặt xưởng. Hệ thống không tự gửi cho xưởng - bấm &quot;Gửi
            xưởng&quot; sau khi đã liên hệ. Tồn kho chỉ tăng khi nhận hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>
              Xưởng <span className="text-destructive">*</span>
            </Label>
            {!loading && workshops.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có xưởng nào. Thêm nhà cung cấp loại &quot;Xưởng sản xuất&quot; ở{" "}
                <Link href="/exchange/suppliers" className="underline">
                  Nhà cung cấp
                </Link>
                .
              </p>
            ) : (
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loading ? "Đang tải..." : "Chọn xưởng"} />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-2">
            <Label>
              Nơi nhận hàng <span className="text-destructive">*</span>
            </Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Đang tải..." : "Chọn kho / chi nhánh"} />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                    {l.type === "BRANCH" ? " (chi nhánh)" : " (kho)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Ngày xưởng hẹn xong</Label>
            <Input
              type="date"
              min={todayIso()}
              value={expectedReadyDate}
              onChange={(e) => setExpectedReadyDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Ghi chú</Label>
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Mặt hàng đặt làm</Label>
          <MovementProductSearch
            usedIds={usedIds}
            searchScope="catalog"
            metaMode="skuOnly"
            placeholder="Thêm hàng: tìm theo tên, mã, SKU..."
            onPick={(item) =>
              setLines((prev) => [
                ...prev,
                {
                  key: nextKey(),
                  productItemId: item.id,
                  sku: item.sku,
                  productName: item.name,
                  quantity: 1,
                },
              ])
            }
          />
          <div className="max-h-72 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mặt hàng</TableHead>
                  <TableHead>Cho đơn</TableHead>
                  <TableHead className="w-28 text-right">Số lượng</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line) => (
                  <TableRow key={line.key}>
                    <TableCell>
                      <div className="font-medium">{line.productName}</div>
                      <div className="text-xs text-muted-foreground">{line.sku ?? "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{line.orderCode ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        className="h-8 text-right"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.key, { quantity: Math.floor(Number(e.target.value)) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Bỏ dòng"
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.key !== line.key))
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {lines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                      Chưa có mặt hàng nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving ? "Đang lưu..." : isEdit ? "Lưu" : "Tạo yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
