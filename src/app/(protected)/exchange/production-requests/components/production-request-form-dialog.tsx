"use client";

import * as React from "react";
import { CustomizationChips } from "@/app/(protected)/sales/orders/shared/customization-chips";
import Link from "next/link";
import { Minus, PackagePlus, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { MovementProductSearch } from "@/app/(protected)/exchange/shared/movement-product-search";
import { productionRequestApi } from "@/lib/api/production-request";
import { getApiErrorBody } from "@/lib/api/error-codes";
import type {
  OrderItemSpec,
  ProductionRequest,
  SkuAttributeValue,
} from "@/types/order-flow";
import { ImageAttachments } from "@/components/image-attachments";
import {
  changedAttributes,
  loadLineVariant,
  priceToSend,
  ProductionLineVariant,
  type LineVariantDraft,
} from "./production-line-variant";
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
  /** Sản phẩm của SKU - để nạp danh sách thuộc tính. */
  productId?: string;
  /** Thuộc tính + giá đang sửa (dòng hàng tồn). Chưa nạp = undefined. */
  variant?: LineVariantDraft;
  /** Thuộc tính của SKU, chỉ để xem (dòng làm cho đơn hàng - không sửa ở đây). */
  fixedAttributes?: SkuAttributeValue[];
  /** Ảnh gửi xưởng của dòng (bản thiết kế, ảnh mẫu). */
  attachments?: string[];
  /** Thứ khách đặt riêng cho dòng đơn (chỉ để xem). */
  customization?: {
    note: string | null;
    attachmentUrls: string[];
    specs: OrderItemSpec[];
  } | null;
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
    productId: line.productId,
    fixedAttributes: line.attributes,
    attachments: line.attachmentUrls ?? [],
    customization: line.orderItem?.customization ?? null,
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
  const [supplierId, setSupplierId] = React.useState(
    request?.supplier.id ?? "",
  );
  const [locationId, setLocationId] = React.useState(
    request?.location.id ?? initialLocationId ?? "",
  );
  const [expectedReadyDate, setExpectedReadyDate] = React.useState(
    // The API sends an ISO instant; <input type="date"> only takes the calendar day.
    request?.expectedReadyDate?.slice(0, 10) ?? "",
  );
  const [note, setNote] = React.useState(request?.note ?? "");
  const [lines, setLines] = React.useState<DraftLine[]>(
    request ? linesOf(request) : (initialLines ?? []),
  );
  const [saving, setSaving] = React.useState(false);

  // A SKU may repeat only for different order lines (PRODUCTION_REQUEST_DUPLICATE_ITEM otherwise);
  // the search hides SKUs already on the request without an order line.
  const usedIds = React.useMemo(
    () =>
      new Set(lines.filter((l) => !l.orderItemId).map((l) => l.productItemId)),
    [lines],
  );

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  // Nạp thuộc tính + giá cho mọi dòng hàng tồn chưa có (dòng vừa thêm, hoặc dòng của nháp đang sửa).
  const pendingVariantKeys = lines
    .filter((line) => !line.orderItemId && line.productId && !line.variant)
    .map((line) => line.key)
    .join(",");
  React.useEffect(() => {
    if (!pendingVariantKeys) return;
    let cancelled = false;
    for (const line of lines) {
      if (line.orderItemId || !line.productId || line.variant) continue;
      loadLineVariant(line.productId, line.productItemId)
        .then((variant) => {
          if (!cancelled) updateLine(line.key, { variant });
        })
        .catch(() =>
          toast.error(
            `Không tải được thuộc tính của ${line.sku ?? line.productName}`,
          ),
        );
    }
    return () => {
      cancelled = true;
    };
    // Chỉ chạy lại khi tập dòng cần nạp đổi; `lines` đọc tại thời điểm đó là đủ.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVariantKeys]);

  const valid =
    !!supplierId &&
    !!locationId &&
    lines.length > 0 &&
    lines.every(
      (line) => Number.isInteger(line.quantity) && line.quantity >= 1,
    );

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
        attachmentUrls: line.attachments ?? [],
        // Dòng làm cho đơn hàng không đổi được thuộc tính / giá - BE từ chối.
        ...(line.orderItemId
          ? {}
          : {
              attributeValues: changedAttributes(line.variant),
              retailPrice: priceToSend(line.variant),
            }),
      })),
    };
    try {
      const saved = isEdit
        ? await productionRequestApi.update(request!.id, payload)
        : await productionRequestApi.create(payload);
      toast.success(
        isEdit ? "Đã lưu yêu cầu sản xuất" : `Đã tạo ${saved.code}`,
      );
      onSaved(saved);
    } catch (error) {
      toast.error(
        getApiErrorBody(error)?.message ?? "Không lưu được yêu cầu sản xuất",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalQuantity = lines.reduce(
    (sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0),
    0,
  );
  const setQuantity = (key: string, next: number) =>
    updateLine(key, { quantity: Math.max(1, Math.floor(next || 1)) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[94vh] flex-col gap-0 p-0 sm:max-w-[min(1200px,96vw)]">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>
            {isEdit ? `Sửa ${request!.code}` : "Tạo yêu cầu sản xuất"}
          </DialogTitle>
          <DialogDescription>
            Lập danh sách hàng đặt xưởng. Hệ thống không tự gửi cho xưởng - bấm
            &quot;Gửi xưởng&quot; sau khi đã liên hệ. Tồn kho chỉ tăng khi nhận
            hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* Thông tin chung */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label>
                Xưởng <span className="text-destructive">*</span>
              </Label>
              {!loading && workshops.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có xưởng nào. Thêm nhà cung cấp loại &quot;Xưởng sản
                  xuất&quot; ở{" "}
                  <Link href="/exchange/suppliers" className="underline">
                    Nhà cung cấp
                  </Link>
                  .
                </p>
              ) : (
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={loading ? "Đang tải..." : "Chọn xưởng"}
                    />
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
                  <SelectValue
                    placeholder={
                      loading ? "Đang tải..." : "Chọn kho / chi nhánh"
                    }
                  />
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
              <Label>Ghi chú chung</Label>
              <Input
                value={note}
                placeholder="VD: Ưu tiên làm trước Tết"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </section>

          {/* Mặt hàng */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">
                Mặt hàng đặt làm{" "}
                <span className="font-normal text-muted-foreground">
                  ({lines.length})
                </span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Đổi thuộc tính của dòng hàng tồn để làm bản khác - hệ thống tự
                dùng / tạo SKU đúng bộ thuộc tính khi lưu.
              </span>
            </div>
            <div className="sticky top-0 z-10 -mx-1 bg-background px-1 pb-1">
              <MovementProductSearch
                usedIds={usedIds}
                searchScope="catalog"
                onlyManufacturable
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
                      productId: item.productId,
                    },
                  ])
                }
              />
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
                <PackagePlus className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Chưa có mặt hàng nào</p>
                <p className="text-xs text-muted-foreground">
                  Tìm theo tên, mã hoặc SKU ở ô phía trên để thêm.
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-3">
                {lines.map((line, index) => (
                  <li key={line.key} className="rounded-lg border bg-card">
                    {/* Đầu thẻ: tên, loại dòng, số lượng, bỏ */}
                    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {line.productName}
                          </span>
                          {line.orderItemId ? (
                            <Badge variant="warning">
                              Làm cho đơn {line.orderCode ?? ""}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Hàng tồn</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {line.sku ?? "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Label className="mr-1 text-xs text-muted-foreground">
                          Số lượng
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          aria-label="Giảm"
                          disabled={line.quantity <= 1}
                          onClick={() =>
                            setQuantity(line.key, line.quantity - 1)
                          }
                        >
                          <Minus className="size-4" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          className="h-8 w-16 text-center"
                          value={line.quantity}
                          onChange={(e) =>
                            setQuantity(line.key, Number(e.target.value))
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-8"
                          aria-label="Tăng"
                          onClick={() =>
                            setQuantity(line.key, line.quantity + 1)
                          }
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label="Bỏ dòng"
                        onClick={() =>
                          setLines((prev) =>
                            prev.filter((l) => l.key !== line.key),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Thân thẻ: bản nào (thuộc tính, giá) | ảnh gửi xưởng */}
                    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                      <div className="min-w-0">
                        {line.orderItemId ? (
                          <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3 text-sm">
                            <span className="text-xs text-muted-foreground">
                              Theo yêu cầu của dòng đơn - không sửa ở đây
                            </span>
                            {line.customization ? (
                              <>
                                <span className="text-amber-600 dark:text-amber-400">Khách đặt riêng:</span>
                                <CustomizationChips customization={line.customization} />
                                {line.customization.note && (
                                  <span className="text-muted-foreground">
                                    Ghi chú: {line.customization.note}
                                  </span>
                                )}
                                {line.customization.attachmentUrls.length >
                                  0 && (
                                  <ImageAttachments
                                    value={line.customization.attachmentUrls}
                                    onChange={() => undefined}
                                    disabled
                                  />
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                {line.fixedAttributes
                                  ?.filter((a) => a.name && a.value)
                                  .map((a) => `${a.name}: ${a.value}`)
                                  .join(" · ") || "Bản chuẩn"}
                              </span>
                            )}
                          </div>
                        ) : line.variant ? (
                          <ProductionLineVariant
                            lineKey={line.key}
                            productId={line.productId}
                            variant={line.variant}
                            onChange={(variant) =>
                              updateLine(line.key, { variant })
                            }
                          />
                        ) : line.productId ? (
                          <p className="text-sm text-muted-foreground">
                            Đang tải thuộc tính...
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-medium">
                          Ảnh gửi xưởng (bản thiết kế, ảnh mẫu)
                        </span>
                        <ImageAttachments
                          value={line.attachments ?? []}
                          onChange={(attachments) =>
                            updateLine(line.key, { attachments })
                          }
                          label="Thêm ảnh"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {lines.length} mặt hàng · {totalQuantity} cái
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Huỷ
            </Button>
            <Button onClick={submit} disabled={!valid || saving}>
              {saving ? "Đang lưu..." : isEdit ? "Lưu" : "Tạo yêu cầu"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
