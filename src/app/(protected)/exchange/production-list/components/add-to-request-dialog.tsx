"use client";

import * as React from "react";
import Link from "next/link";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type { ProductionListRow, ProductionRequest } from "@/types/order-flow";
import { formatDateTime } from "@/app/(protected)/exchange/production-requests/shared/production-display";
import { useProductionOptions } from "@/app/(protected)/exchange/production-requests/shared/use-production-options";

const NEW_REQUEST = "new";

type Props = {
  row: ProductionListRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (request: ProductionRequest) => void;
};

/**
 * B-6 "Thêm vào yêu cầu": put a row of the production list on a draft request of a workshop
 * delivering to the row's location (`POST /production-requests/:id/items`), or start a new one.
 * A custom row carries its order line - the workshop makes that piece for that order.
 */
export function AddToRequestDialog({ row, open, onOpenChange, onAdded }: Props) {
  const { workshops, locations, loading } = useProductionOptions();
  const [supplierId, setSupplierId] = React.useState("");
  const [locationId, setLocationId] = React.useState(row.location?.id ?? "");
  const [quantity, setQuantity] = React.useState(Math.max(1, row.shortQuantity));
  const [drafts, setDrafts] = React.useState<ProductionRequest[] | null>(null);
  const [target, setTarget] = React.useState(NEW_REQUEST);
  const [saving, setSaving] = React.useState(false);

  // The workshop's drafts delivering here - a line can only be added to one of those.
  React.useEffect(() => {
    if (!supplierId || !locationId) return;
    let stale = false;
    productionRequestApi
      .getList({ status: "DRAFT", supplierId, locationId, limit: 50 })
      .then((result) => {
        if (stale) return;
        setDrafts(result.data);
        setTarget(result.data[0]?.id ?? NEW_REQUEST);
      })
      .catch(() => {
        if (!stale) setDrafts([]);
      });
    return () => {
      stale = true;
    };
  }, [supplierId, locationId]);

  const valid = !!supplierId && !!locationId && Number.isInteger(quantity) && quantity >= 1;

  async function submit() {
    if (!valid) return;
    setSaving(true);
    const line = {
      productItemId: row.productItemId,
      quantity,
      orderItemId: row.customOrderItemId ?? undefined,
    };
    try {
      const saved =
        target === NEW_REQUEST
          ? await productionRequestApi.create({ supplierId, locationId, items: [line] })
          : await productionRequestApi.addItem(target, line);
      toast.success(`Đã thêm vào ${saved.code}`);
      onAdded(saved);
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không thêm được vào yêu cầu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm vào yêu cầu sản xuất</DialogTitle>
          <DialogDescription>
            {row.productName}
            {row.sku ? ` (${row.sku})` : ""}
            {row.shortQuantity > 0 ? ` · còn thiếu ${row.shortQuantity}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Xưởng</Label>
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

          {!row.location && (
            <div className="grid gap-2">
              <Label>Nơi nhận hàng</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn kho / chi nhánh" />
                </SelectTrigger>
                <SelectContent>
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
            <Label>Số lượng đặt</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.floor(Number(e.target.value)))}
            />
          </div>

          {supplierId && locationId && (
            <div className="grid gap-2">
              <Label>Thêm vào</Label>
              {drafts === null ? (
                <p className="text-sm text-muted-foreground">Đang tải...</p>
              ) : (
                <RadioGroup value={target} onValueChange={setTarget}>
                  {drafts.map((draft) => (
                    <label key={draft.id} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value={draft.id} />
                      {draft.code} · {draft.items.length} dòng · lập {formatDateTime(draft.createdAt)}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={NEW_REQUEST} />
                    Yêu cầu nháp mới
                  </label>
                </RadioGroup>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={!valid || saving || drafts === null}>
            {saving ? "Đang thêm..." : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
