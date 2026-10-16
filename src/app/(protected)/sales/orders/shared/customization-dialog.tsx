"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { AddProductAttribute } from "@/components/add-product-attribute";
import { ImageAttachments } from "@/components/image-attachments";
import { productApi } from "@/lib/api/product";
import { cn } from "@/lib/utils";
import type { OrderItemCustomization, OrderItemSpec } from "@/types/order-flow";

type Props = {
  /** What the line is, for the title. */
  label: string;
  /** The SKU the customer picked - its attributes are the starting point. */
  productItemId: string;
  sku?: string | null;
  value: OrderItemCustomization | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `undefined` = the line is no longer made to measure. */
  onSave: (value: OrderItemCustomization | undefined) => void;
};

type SpecDraft = { name: string; value: string; unit: string };
type AttributeDraft = { attributeId: string; name: string; unit: string | null; base: string; value: string };

const trimmed = (text: string | null | undefined) => (text ?? "").trim();

/** Một thay đổi thuộc tính đọc thành "Màu: Óc chó → Trắng". */
function specText(s: OrderItemSpec): string {
  const unit = s.unit ? ` ${s.unit}` : "";
  if (s.attributeId && s.baseValue && s.baseValue !== s.value) {
    return `${s.name}: ${s.baseValue} → ${s.value}${unit}`;
  }
  return `${s.name}: ${s.value}${unit}`;
}

/** The specs agreed with a customer, on one line ("Màu: Óc chó → Trắng · Dài: 181 cm"). */
export function customizationSummary(c: OrderItemCustomization | null | undefined): string {
  if (!c) return "";
  // Bản ghi cũ (trước 2026-10-16) còn các ô cố định - vẫn đọc được.
  const size = [c.lengthCm, c.widthCm, c.heightCm].filter((v) => v != null).join(" × ");
  return [size ? `${size} cm` : null, c.material, c.color, c.fabricCode, ...c.specs.map(specText)]
    .filter(Boolean)
    .join(" · ");
}

/** Các ô cố định của bản ghi cũ chuyển thành thông số tự do, để lưu lại không mất. */
function legacySpecs(c: OrderItemCustomization | undefined): SpecDraft[] {
  if (!c) return [];
  const rows: SpecDraft[] = [];
  const dim = (name: string, v?: number | null) => {
    if (v != null) rows.push({ name, value: String(v), unit: "cm" });
  };
  dim("Dài", c.lengthCm);
  dim("Rộng", c.widthCm);
  dim("Cao", c.heightCm);
  if (c.material) rows.push({ name: "Chất liệu", value: c.material, unit: "" });
  if (c.color) rows.push({ name: "Màu sắc", value: c.color, unit: "" });
  if (c.fabricCode) rows.push({ name: "Mã vải", value: c.fabricCode, unit: "" });
  return rows;
}

/**
 * D-2 (làm lại 2026-10-16): thông số khách đặt riêng cho một dòng, dựa trên **thuộc tính của sản phẩm** - mỗi thuộc
 * tính điền sẵn giá trị của SKU khách chọn, đổi ô nào thì ô đó là yêu cầu riêng (lưu kèm giá trị gốc). Thuộc tính
 * sản phẩm chưa có thì thêm ngay ở đây. Kèm thông số tự do, ghi chú và ảnh bản thiết kế cho xưởng. Lưu là dòng
 * thành hàng làm riêng: hệ thống tạo mã hàng riêng mang đúng các giá trị này (A-4).
 */
export function CustomizationDialog({ label, productItemId, sku, value, open, onOpenChange, onSave }: Props) {
  const [productId, setProductId] = React.useState<string | null>(null);
  const [attrs, setAttrs] = React.useState<AttributeDraft[] | null>(null);
  const [note, setNote] = React.useState(value?.note ?? "");
  const [attachments, setAttachments] = React.useState<string[]>(value?.attachmentUrls ?? []);
  const [specs, setSpecs] = React.useState<SpecDraft[]>(() => [
    ...legacySpecs(value),
    ...(value?.specs ?? [])
      .filter((s) => !s.attributeId)
      .map((s) => ({ name: s.name, value: s.value, unit: s.unit ?? "" })),
  ]);

  // Thuộc tính của sản phẩm + giá trị của SKU: dòng giỏ hàng chỉ biết SKU, nên tra sản phẩm qua danh sách SKU.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await productApi.listItems({ search: sku ?? undefined, limit: 50 });
      const pid = rows.find((row) => row.id === productItemId)?.productId;
      if (!pid) throw new Error("not found");
      const product = await productApi.getById(pid);
      const item = product.items.find((row) => row.id === productItemId);
      const baseOf = new Map(
        (item?.productDetails ?? []).filter((d) => d.attributeId).map((d) => [d.attributeId as string, d.value]),
      );
      const chosen = new Map(
        (value?.specs ?? []).filter((s) => s.attributeId).map((s) => [s.attributeId as string, s]),
      );
      if (cancelled) return;
      setProductId(pid);
      setAttrs(
        (product.attributes ?? [])
          .filter((a) => a.id)
          .map((a) => {
            const id = a.id as string;
            // Dòng đã làm riêng thì SKU hiện tại là SKU custom - giá trị gốc lấy từ lần lưu trước.
            const base = chosen.get(id)?.baseValue ?? baseOf.get(id) ?? "";
            return { attributeId: id, name: a.name, unit: a.unit ?? null, base, value: chosen.get(id)?.value ?? base };
          }),
      );
    })().catch(() => {
      if (!cancelled) {
        setAttrs([]);
        toast.error("Không tải được thuộc tính của hàng hoá");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [productItemId, sku, value]);

  const changed = (attrs ?? []).filter((a) => trimmed(a.value) && trimmed(a.value) !== trimmed(a.base));
  const built: OrderItemCustomization = {
    note: note.trim() || undefined,
    attachmentUrls: attachments,
    specs: [
      ...changed.map((a) => ({
        attributeId: a.attributeId,
        baseValue: a.base || null,
        name: a.name,
        value: trimmed(a.value),
        unit: a.unit,
      })),
      ...specs
        .filter((s) => s.name.trim() && s.value.trim())
        .map((s) => ({ name: s.name.trim(), value: s.value.trim(), unit: s.unit.trim() || undefined })),
    ],
  };
  const empty = built.specs.length === 0 && !built.note && attachments.length === 0;
  const halfSpec = specs.some((s) => !!s.name.trim() !== !!s.value.trim());

  const patchSpec = (index: number, change: Partial<SpecDraft>) =>
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, ...change } : s)));
  const setAttrValue = (attributeId: string, next: string) =>
    setAttrs((prev) => prev?.map((a) => (a.attributeId === attributeId ? { ...a, value: next } : a)) ?? prev);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thông số làm riêng - {label}</DialogTitle>
          <DialogDescription>
            Sửa thuộc tính nào khách muốn khác mẫu - ô đổi sẽ được đánh dấu. Lưu xong dòng này thành hàng làm theo yêu
            cầu: hệ thống tạo một mã hàng riêng mang đúng các giá trị này để xưởng làm.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Thuộc tính của hàng hoá</Label>
              {productId && (
                <AddProductAttribute
                  productId={productId}
                  onAdded={(a) =>
                    setAttrs((prev) =>
                      prev?.some((x) => x.attributeId === a.id)
                        ? prev
                        : [...(prev ?? []), { attributeId: a.id as string, name: a.name, unit: a.unit ?? null, base: "", value: "" }],
                    )
                  }
                />
              )}
            </div>
            {attrs === null ? (
              <p className="text-sm text-muted-foreground">Đang tải thuộc tính...</p>
            ) : attrs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Hàng hoá chưa có thuộc tính nào - bấm &quot;Thêm thuộc tính&quot; để thêm, hoặc ghi ở thông số khác.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {attrs.map((a) => {
                  const isChanged = trimmed(a.value) !== "" && trimmed(a.value) !== trimmed(a.base);
                  const id = `custom-attr-${a.attributeId}`;
                  return (
                    <div key={a.attributeId} className="grid gap-1">
                      <Label htmlFor={id} className="text-xs">
                        {a.name}
                      </Label>
                      {/* Đơn vị đứng ngoài ô: giá trị chỉ là con số / chữ, không gõ lại "cm". */}
                      <div className="flex items-center gap-2">
                        <Input
                          id={id}
                          value={a.value}
                          placeholder={a.base || "Chưa có"}
                          className={cn(isChanged && "border-amber-500")}
                          onChange={(e) => setAttrValue(a.attributeId, e.target.value)}
                        />
                        {a.unit && <span className="shrink-0 text-sm text-muted-foreground">{a.unit}</span>}
                      </div>
                      <span className={cn("text-xs", isChanged ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                        {isChanged ? `Mẫu: ${a.base || "trống"} → khách đổi` : `Theo mẫu${a.base ? "" : " (mẫu chưa có giá trị)"}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Thông số khác (ngoài thuộc tính)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSpecs((prev) => [...prev, { name: "", value: "", unit: "" }])}
              >
                <Plus className="size-4" />
                Thêm
              </Button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_5rem_2rem] gap-2">
                <Input
                  placeholder="Tên (vd. Cao lưng tựa)"
                  value={spec.name}
                  onChange={(e) => patchSpec(index, { name: e.target.value })}
                />
                <Input placeholder="Giá trị" value={spec.value} onChange={(e) => patchSpec(index, { value: e.target.value })} />
                <Input placeholder="Đơn vị" value={spec.unit} onChange={(e) => patchSpec(index, { unit: e.target.value })} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Bỏ thông số"
                  onClick={() => setSpecs((prev) => prev.filter((_, i) => i !== index))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {halfSpec && <p className="text-xs text-destructive">Mỗi thông số cần cả tên và giá trị.</p>}
          </div>

          <div className="grid gap-2">
            <Label>Ảnh bản thiết kế / ảnh mẫu</Label>
            <ImageAttachments value={attachments} onChange={setAttachments} label="Thêm ảnh" />
          </div>

          <div className="grid gap-1">
            <Label>Ghi chú cho xưởng</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onSave(undefined)}>
              Bỏ làm riêng
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="button" disabled={empty || halfSpec || attrs === null} onClick={() => onSave(built)}>
              Lưu thông số
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
