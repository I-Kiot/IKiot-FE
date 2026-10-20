"use client";

import { AddProductAttribute } from "@/components/add-product-attribute";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { productApi } from "@/lib/api/product";
import { cn } from "@/lib/utils";

/** Một thuộc tính của dòng YCSX đang sửa: giá trị gốc của SKU và giá trị muốn làm. */
export interface AttributeDraft {
  attributeId: string;
  name: string;
  unit: string | null;
  base: string;
  value: string;
}

/** Phần "bản nào, giá bao nhiêu" của một dòng YCSX. */
export interface LineVariantDraft {
  attrs: AttributeDraft[];
  basePrice: number;
  /** Ô giá, điền sẵn giá SKU; chỉ sửa được khi `updatePrice`. */
  price: string;
  updatePrice: boolean;
}

/** Thuộc tính của sản phẩm + giá trị và giá của SKU, để dựng phần sửa của một dòng. */
export async function loadLineVariant(
  productId: string,
  productItemId: string,
): Promise<LineVariantDraft> {
  const product = await productApi.getById(productId);
  const item = product.items.find((row) => row.id === productItemId);
  const valueOf = new Map(
    (item?.productDetails ?? [])
      .filter((detail) => detail.attributeId)
      .map((detail) => [detail.attributeId as string, detail.value]),
  );
  return {
    attrs: (product.attributes ?? [])
      .filter((attr) => attr.id)
      .map((attr) => {
        const base = valueOf.get(attr.id as string) ?? "";
        return { attributeId: attr.id as string, name: attr.name, unit: attr.unit ?? null, base, value: base };
      }),
    basePrice: item?.retailPrice ?? 0,
    price: String(item?.retailPrice ?? 0),
    updatePrice: false,
  };
}

/** Thuộc tính đã đổi so với SKU (bỏ dòng để trống - BE không nhận giá trị rỗng). */
export function changedAttributes(variant: LineVariantDraft | undefined) {
  if (!variant) return [];
  return variant.attrs
    .filter((attr) => attr.value.trim() && attr.value.trim() !== attr.base.trim())
    .map((attr) => ({ attributeId: attr.attributeId, value: attr.value.trim() }));
}

/** Giá gửi lên: chỉ khi đã tick "Cập nhật giá mới" và nhập số hợp lệ. */
export function priceToSend(variant: LineVariantDraft | undefined): number | undefined {
  if (!variant?.updatePrice) return undefined;
  const n = Number(variant.price);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const formatMoney = (n: number) => n.toLocaleString("vi-VN");

type Props = {
  lineKey: string;
  /** Sản phẩm của dòng - cho nút "Thêm thuộc tính". */
  productId?: string;
  variant: LineVariantDraft;
  onChange: (variant: LineVariantDraft) => void;
};

/**
 * Sửa thuộc tính và giá của một dòng YCSX (2026-10-16). Đổi thuộc tính → khi lưu, BE chuyển dòng sang SKU đúng bộ
 * thuộc tính đó (dùng lại SKU có sẵn hoặc tạo SKU mới sao chép SKU này). Giá điền sẵn giá SKU và chỉ mở khi tick
 * "Cập nhật giá mới" - giá đó áp vào SKU kết quả, nên phải là quyết định có chủ đích.
 */
export function ProductionLineVariant({ lineKey, productId, variant, onChange }: Props) {
  const changed = changedAttributes(variant).length > 0;
  const setAttr = (attributeId: string, value: string) =>
    onChange({
      ...variant,
      attrs: variant.attrs.map((attr) => (attr.attributeId === attributeId ? { ...attr, value } : attr)),
    });

  return (
    <div className="flex flex-col gap-3 rounded-md bg-muted/40 p-3">
      {productId && (
        <AddProductAttribute
          productId={productId}
          onAdded={(attr) =>
            onChange({
              ...variant,
              attrs: variant.attrs.some((a) => a.attributeId === attr.id)
                ? variant.attrs
                : [
                    ...variant.attrs,
                    { attributeId: attr.id as string, name: attr.name, unit: attr.unit ?? null, base: "", value: "" },
                  ],
            })
          }
        />
      )}
      {variant.attrs.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Sản phẩm chưa có thuộc tính - bấm &quot;Thêm thuộc tính&quot; để đặt xưởng làm bản khác.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variant.attrs.map((attr) => {
            const id = `${lineKey}-attr-${attr.attributeId}`;
            const isChanged = attr.value.trim() !== attr.base.trim() && attr.value.trim() !== "";
            return (
              <div key={attr.attributeId} className="grid gap-1">
                <Label htmlFor={id} className="text-xs">
                  {attr.name}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={id}
                    className={cn("h-8", isChanged && "border-amber-500 focus-visible:ring-amber-500/40")}
                    value={attr.value}
                    placeholder={attr.base || "Chưa có"}
                    onChange={(e) => setAttr(attr.attributeId, e.target.value)}
                  />
                  {attr.unit && <span className="shrink-0 text-sm text-muted-foreground">{attr.unit}</span>}
                </div>
                {isChanged && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Gốc: {attr.base || "trống"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor={`${lineKey}-price`} className="text-xs">
            Giá bán {changed ? "của SKU mới" : "của SKU"} (đ)
          </Label>
          <MoneyInput
            id={`${lineKey}-price`}
            className="h-8 w-40 text-right"
            disabled={!variant.updatePrice}
            value={Number(variant.price) || 0}
            onChange={(next) => onChange({ ...variant, price: next > 0 ? String(next) : "" })}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-1.5 text-sm">
          <Checkbox
            checked={variant.updatePrice}
            onCheckedChange={(checked) =>
              onChange({
                ...variant,
                updatePrice: checked === true,
                // Bỏ tick thì trả ô giá về giá cũ, để không ai tưởng giá vừa gõ đã được lưu.
                price: checked === true ? variant.price : String(variant.basePrice),
              })
            }
          />
          Cập nhật giá mới
        </label>
        <span className="pb-1.5 text-xs text-muted-foreground">
          Giá hiện tại: {formatMoney(variant.basePrice)} đ
        </span>
      </div>

      {changed && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Đã đổi thuộc tính: khi lưu sẽ dùng SKU đúng bộ thuộc tính này nếu đã có, chưa có thì tạo SKU mới (sao chép
          giá vốn, kích thước, kiện, ảnh, nhà cung cấp từ SKU gốc).
        </p>
      )}
    </div>
  );
}
