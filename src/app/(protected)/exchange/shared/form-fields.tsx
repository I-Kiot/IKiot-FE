"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatMoneyVnd,
  parseImportPriceInput,
} from "@/app/(protected)/exchange/shared/movement-detail-validation";
import { safeImageSrc } from "@/app/(protected)/products/_constants/product.constants";
import type { StockMovementProductItemOption } from "@/types/stock-movement";

/* ─── atoms dùng chung dialog / expanded panel ─── */

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export function MoneyCell({ value }: { value: number }) {
  const text = formatMoneyVnd(value);
  return (
    <span className="block max-w-full truncate text-right tabular-nums" title={text}>
      {text}
    </span>
  );
}

export function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

export function DetailLineCard({
  index,
  onRemove,
  canRemove,
  children,
  className,
}: {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 space-y-3 overflow-hidden rounded-lg border bg-muted/20 p-3 sm:p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Dòng {index + 1}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 cursor-pointer text-destructive"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Xóa dòng"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

type MoneyInputProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    { value, onChange, placeholder = "0", className, disabled },
    ref,
  ) {
    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        className={cn("h-9 w-full text-sm tabular-nums tracking-tight", className)}
        value={
          Number.isFinite(value) && (value ?? 0) > 0
            ? value!.toLocaleString("vi-VN")
            : ""
        }
        onChange={(e) => {
          onChange(parseImportPriceInput(e.target.value));
        }}
      />
    );
  },
);

/* ─── Product picker ─── */

const PRODUCT_TRIGGER_CLASS =
  "!h-auto min-h-11 w-full min-w-0 items-start justify-between gap-2 overflow-hidden px-3 py-2.5 text-left text-sm !whitespace-normal " +
  "data-[size=default]:!h-auto data-[size=default]:min-h-11 " +
  "*:data-[slot=select-value]:!line-clamp-none *:data-[slot=select-value]:flex " +
  "*:data-[slot=select-value]:h-auto *:data-[slot=select-value]:w-full *:data-[slot=select-value]:min-w-0 " +
  "*:data-[slot=select-value]:max-w-full *:data-[slot=select-value]:items-start " +
  "*:data-[slot=select-value]:overflow-hidden *:data-[slot=select-value]:!whitespace-normal " +
  "[&>svg]:mt-1.5 [&>svg]:shrink-0";

const CHIP_MAX = 3;

export type ProductMetaMode = "stock" | "skuOnly" | "price";

function detailLabel(name: string, value: string) {
  return `${name}: ${value}`;
}

export function ProductDetailsChips({
  details,
  maxVisible = CHIP_MAX,
}: {
  details?: Array<{ name: string; value: string }>;
  maxVisible?: number;
}) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const cleaned = (details ?? []).filter(
    (d) => d.name?.trim() && d.value?.trim(),
  );

  if (!cleaned.length) return null;

  const visible = cleaned.slice(0, maxVisible);
  const rest = cleaned.length - visible.length;

  return (
    <span className="flex min-w-0 max-w-full flex-nowrap items-center gap-1 overflow-hidden">
      {visible.map((d, idx) => {
        const label = detailLabel(d.name, d.value);
        return (
          <Badge
            key={`${d.name}-${d.value}-${idx}`}
            variant="outline"
            className="h-5 min-w-0 max-w-[7.5rem] shrink truncate px-1.5 text-[10px] font-normal"
            title={label}
          >
            {label}
          </Badge>
        );
      })}
      {rest > 0 ? (
        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 shrink-0 cursor-pointer items-center rounded-full bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              aria-label={`Xem thêm ${rest} thuộc tính`}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              +{rest}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="z-[100] w-72 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Tất cả thuộc tính ({cleaned.length})
            </p>
            <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
              {cleaned.map((d, idx) => {
                const label = detailLabel(d.name, d.value);
                return (
                  <Badge
                    key={`${d.name}-${d.value}-${idx}`}
                    variant="outline"
                    className="max-w-full whitespace-normal break-words px-1.5 py-0.5 text-[10px] font-normal"
                    title={label}
                  >
                    {label}
                  </Badge>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </span>
  );
}

/** Hiển thị SP dạng tóm tắt (ảnh + tên + chip + SKU) - dùng trên phiếu xem/sửa. */
export function ProductSummary({
  product,
  name,
  sku,
  metaMode = "skuOnly",
}: {
  product?: StockMovementProductItemOption;
  name?: string;
  sku?: string;
  metaMode?: ProductMetaMode;
}) {
  const resolvedName = product?.name || name || "-";
  const resolvedSku = product?.sku || sku || "";

  return (
    <div className="flex min-w-0 items-start gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safeImageSrc(product?.imageUrl)}
        alt=""
        className="size-9 shrink-0 rounded-md border object-cover bg-muted"
        loading="lazy"
      />
      <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
        <div className="truncate text-sm font-medium leading-snug">
          {resolvedName}
        </div>
        {metaMode === "price" ? (
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {resolvedSku ? <span className="truncate">SKU: {resolvedSku}</span> : null}
            {typeof product?.retailPrice === "number" ? (
              <span className="shrink-0">
                Giá bán: {formatMoneyVnd(product.retailPrice)}
              </span>
            ) : null}
          </div>
        ) : metaMode === "stock" ? (
          <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {resolvedSku ? <span className="truncate">SKU: {resolvedSku}</span> : null}
            {typeof product?.stock === "number" ? (
              <span>Tồn: {product.stock.toLocaleString("vi-VN")}</span>
            ) : null}
          </div>
        ) : resolvedSku ? (
          <div className="truncate text-xs text-muted-foreground">
            SKU: {resolvedSku}
          </div>
        ) : null}
        <ProductDetailsChips details={product?.productDetails} />
      </div>
    </div>
  );
}

function ProductMeta({
  product,
  mode,
}: {
  product: StockMovementProductItemOption;
  mode: ProductMetaMode;
}) {
  const sku = product.sku ? (
    <span className="truncate">SKU: {product.sku}</span>
  ) : null;

  if (mode === "price") {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground leading-snug">
        {sku}
        {typeof product.retailPrice === "number" ? (
          <span className="shrink-0">
            Giá bán: {formatMoneyVnd(product.retailPrice)}
          </span>
        ) : null}
      </span>
    );
  }

  if (mode === "stock") {
    return (
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground leading-snug">
        {sku}
        {typeof product.stock === "number" ? (
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-normal"
          >
            Tồn: {product.stock.toLocaleString("vi-VN")}
          </Badge>
        ) : null}
      </span>
    );
  }

  if (!product.sku) return null;
  return (
    <span className="min-w-0 truncate text-xs text-muted-foreground leading-snug">
      SKU: {product.sku}
      {typeof product.stock === "number"
        ? ` · Tồn: ${product.stock.toLocaleString("vi-VN")}`
        : ""}
    </span>
  );
}

const ProductOptionLabel = React.memo(function ProductOptionLabel({
  product,
  mode,
}: {
  product: StockMovementProductItemOption;
  mode: ProductMetaMode;
}) {
  return (
    <span className="flex w-full min-w-0 max-w-full items-start gap-2.5 overflow-hidden text-left">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={safeImageSrc(product.imageUrl)}
        alt=""
        className="size-9 shrink-0 rounded-md border object-cover bg-muted"
        loading="lazy"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-medium leading-snug">{product.name}</span>
        <ProductMeta product={product} mode={mode} />
      </span>
    </span>
  );
});

function resolveSelectedProduct(
  products: StockMovementProductItemOption[],
  value: string,
  displayProduct?: StockMovementProductItemOption,
) {
  return (
    products.find((p) => p.id === value) ??
    (displayProduct?.id === value ? displayProduct : undefined)
  );
}

function ProductSelect({
  products,
  value,
  onValueChange,
  placeholder = "Chọn hàng hóa",
  metaMode = "skuOnly",
  className,
  disabled,
  displayProduct,
}: {
  products: StockMovementProductItemOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  metaMode?: ProductMetaMode;
  className?: string;
  disabled?: boolean;
  displayProduct?: StockMovementProductItemOption;
}) {
  const resolvedDisplay = displayProduct
    ? displayProduct
    : value && !products.some((p) => p.id === value)
      ? ({
          id: value,
          name: "Đang tải...",
          sku: "",
        } satisfies StockMovementProductItemOption)
      : undefined;

  const selected = resolveSelectedProduct(products, value, resolvedDisplay);
  const orphan =
    !!resolvedDisplay &&
    resolvedDisplay.id === value &&
    !products.some((p) => p.id === resolvedDisplay.id);

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(PRODUCT_TRIGGER_CLASS, className)}>
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <ProductOptionLabel product={selected} mode={metaMode} />
          ) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]"
      >
        {orphan && resolvedDisplay ? (
          <SelectItem value={resolvedDisplay.id} className="py-2.5" disabled>
            <ProductOptionLabel product={resolvedDisplay} mode={metaMode} />
          </SelectItem>
        ) : null}
        {products.length === 0 && !orphan ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">
            Không có hàng hóa
          </div>
        ) : (
          products.map((p) => (
            <SelectItem
              key={p.id}
              value={p.id}
              className="items-start overflow-hidden py-2.5"
            >
              <ProductOptionLabel product={p} mode={metaMode} />
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

/** Select + chip thuộc tính (ngoài Select để +N bấm được). */
export function ProductPickerField({
  products,
  value,
  onValueChange,
  placeholder = "Chọn hàng hóa",
  metaMode = "skuOnly",
  className,
  disabled,
  displayProduct,
}: {
  products: StockMovementProductItemOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  metaMode?: ProductMetaMode;
  className?: string;
  disabled?: boolean;
  displayProduct?: StockMovementProductItemOption;
}) {
  const selected = resolveSelectedProduct(products, value, displayProduct);

  return (
    <div className={cn("min-w-0 space-y-1.5 overflow-hidden", className)}>
      <ProductSelect
        products={products}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        metaMode={metaMode}
        disabled={disabled}
        displayProduct={displayProduct}
      />
      <ProductDetailsChips details={selected?.productDetails} />
    </div>
  );
}
