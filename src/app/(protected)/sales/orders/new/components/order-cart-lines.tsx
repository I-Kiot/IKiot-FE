"use client";

import * as React from "react";
import { CustomizationChips } from "@/app/(protected)/sales/orders/shared/customization-chips";
import { ChevronDown, Minus, Plus, ShoppingCart, Trash2, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageAttachments } from "@/components/image-attachments";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { CustomizationDialog } from "../../shared/customization-dialog";
import { formatVND, lineTotal, stockLevel } from "../shared/order-totals";
import { cn } from "@/lib/utils";
import type { OrderItemCustomization } from "@/types/order-flow";
import type { MadeToOrderComponent } from "@/types/product";
import type { OrderLineDraft } from "./order-lines-editor";

/** Đang sửa thông số của dòng nào; `component` có giá trị = một món trong combo của dòng đó. */
type Customizing = { key: string; component?: MadeToOrderComponent };

/** Ghi / bỏ thông số của một món trong combo; mỗi món giữ thông số riêng, không gộp. */
function withComponent(
  line: OrderLineDraft,
  productItemId: string,
  customization: OrderItemCustomization | undefined,
) {
  const rest = (line.componentCustomizations ?? []).filter(
    (part) => part.productItemId !== productItemId,
  );
  return customization ? [...rest, { productItemId, customization }] : rest;
}

interface OrderCartLinesProps {
  lines: OrderLineDraft[];
  onChange: (lines: OrderLineDraft[]) => void;
  error?: string;
  /**
   * Giảm giá khuyến mãi phân bổ cho từng dòng (theo `key`), khi đơn đang áp khuyến mãi. Có giá trị thì đơn giá và giảm
   * giá dòng bị khoá: BE tự phân bổ khuyến mãi lên dòng và từ chối giá thoả thuận đi kèm khuyến mãi.
   */
  promotionDiscounts?: Record<string, number> | null;
}

/** Dòng hàng của đơn tay. */
export function OrderCartLines({
  lines,
  onChange,
  error,
  promotionDiscounts = null,
}: OrderCartLinesProps) {
  const locked = promotionDiscounts !== null;
  const discountOf = (line: OrderLineDraft) =>
    locked ? (promotionDiscounts[line.key] ?? 0) : line.discountAmount;
  const [customizing, setCustomizing] = React.useState<Customizing | null>(null);
  const customizingLine =
    lines.find((line) => line.key === customizing?.key) ?? null;
  const customizingPart = customizing?.component;
  // Dòng combo đang mở danh sách món làm riêng.
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const patch = (key: string, change: Partial<OrderLineDraft>) =>
    onChange(
      lines.map((line) => (line.key === key ? { ...line, ...change } : line)),
    );

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed text-center space-y-2 select-none">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShoppingCart className="size-5" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-foreground">
            Đơn hàng chưa có mặt hàng
          </h3>
          <p className="text-xs text-muted-foreground">
            Nhập tên, mã sản phẩm hoặc quét mã vạch ở ô tìm kiếm phía trên để
            thêm sản phẩm vào đơn.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mỗi dòng một thẻ, không dùng bảng: hàng làm riêng cần chỗ cho mọi thay đổi và ảnh. */}
      <ol className="flex flex-col gap-3">
        {lines.map((line, index) => {
          const { level, missing } = stockLevel(line.stock, line.quantity);
          // Chỉ combo có `madeToOrderComponents` (tìm kiếm chỉ trả trường này cho combo).
          const parts = line.madeToOrderComponents;
          const customizedParts = line.componentCustomizations ?? [];
          return (
            <li
              key={line.key}
              className="group rounded-lg border bg-card shadow-xs"
            >
              <div className="grid gap-2 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {line.name}
                      </span>
                      {line.customization && (
                        <Badge variant="outline">Làm riêng</Badge>
                      )}
                      {customizedParts.length > 0 && (
                        <Badge variant="outline">
                          Làm riêng {customizedParts.length} món
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
                      <span>SKU: {line.sku}</span>
                      {/* Làm riêng = SKU mới, chưa có trên kệ nào: luôn phải đặt xưởng, tồn của SKU mẫu không liên quan. */}
                      {line.customization ? (
                        <Badge variant="warning">Cần đặt xưởng</Badge>
                      ) : level === "ENOUGH" ? (
                        <Badge variant="success">Đủ hàng</Badge>
                      ) : level === "SHORT" ? (
                        <Badge variant="warning">Thiếu {missing}</Badge>
                      ) : (
                        <Badge variant="error">Hết hàng</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 md:justify-end">
                  <div className="grid gap-1">
                    <span className="text-xs text-muted-foreground">
                      Số lượng
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0 cursor-pointer"
                        aria-label={`Giảm số lượng ${line.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() =>
                          patch(line.key, { quantity: line.quantity - 1 })
                        }
                      >
                        <Minus className="size-4" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        aria-label={`Số lượng ${line.name}`}
                        value={line.quantity}
                        onChange={(event) =>
                          patch(line.key, {
                            quantity: Math.max(
                              1,
                              Math.floor(Number(event.target.value) || 1),
                            ),
                          })
                        }
                        className="h-8 w-12 px-1 text-center text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0 cursor-pointer"
                        aria-label={`Tăng số lượng ${line.name}`}
                        onClick={() =>
                          patch(line.key, { quantity: line.quantity + 1 })
                        }
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid w-36 gap-1">
                    <span className="text-xs text-muted-foreground">
                      Đơn giá
                    </span>
                    <MoneyInput
                      className="h-8 text-right text-sm font-medium tabular-nums"
                      aria-label={`Đơn giá ${line.name}`}
                      value={line.unitPrice}
                      onChange={(unitPrice) => patch(line.key, { unitPrice })}
                      disabled={locked}
                      title={locked ? "Đơn đang áp khuyến mãi: bán theo giá niêm yết" : undefined}
                    />
                  </div>
                  <div className="grid w-32 gap-1">
                    <span className="text-xs text-muted-foreground">
                      {locked ? "Khuyến mãi" : "Giảm giá"}
                    </span>
                    <MoneyInput
                      className="h-8 text-right text-sm font-medium text-red-500 tabular-nums"
                      aria-label={`Giảm giá ${line.name}`}
                      value={discountOf(line)}
                      onChange={(discountAmount) =>
                        patch(line.key, { discountAmount })
                      }
                      disabled={locked}
                      title={locked ? "Khuyến mãi tự phân bổ lên dòng" : undefined}
                    />
                  </div>
                  <div className="grid min-w-32 gap-1 text-right">
                    <span className="text-xs text-muted-foreground">
                      Thành tiền
                    </span>
                    <span className="flex h-8 items-center justify-end text-sm font-semibold tabular-nums">
                      {formatVND(
                        lineTotal({ ...line, discountAmount: discountOf(line) }),
                      )}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Bỏ ${line.name}`}
                    onClick={() =>
                      onChange(lines.filter((item) => item.key !== line.key))
                    }
                    className="size-8 cursor-pointer rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="size-4.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t px-3 py-2.5">
                {line.unitPrice !== line.retailPrice && (
                  <span className="text-xs text-muted-foreground">
                    Giá niêm yết {formatVND(line.retailPrice)}
                  </span>
                )}
                {line.customization && (
                  <>
                    {/* Liệt kê hết các thay đổi - người bán phải đọc được đủ trước khi tạo đơn. */}
                    <CustomizationChips customization={line.customization} />
                    {line.customization.note && (
                      <span className="text-xs text-muted-foreground">
                        Ghi chú cho xưởng: {line.customization.note}
                      </span>
                    )}
                    {line.customization.attachmentUrls.length > 0 && (
                      <ImageAttachments
                        value={line.customization.attachmentUrls}
                        onChange={() => undefined}
                        disabled
                      />
                    )}
                  </>
                )}
                {/* Hàng làm riêng luôn phải đặt xưởng, nên chỉ sản phẩm bật "Có thể sản xuất" mới có nút. */}
                {parts ? (
                  // Combo: làm riêng từng món bên trong, mỗi món một bộ thông số. Không món nào làm riêng được thì không có nút.
                  parts.length > 0 && (
                    <>
                      <Button
                        type="button"
                        variant={customizedParts.length > 0 ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 w-fit cursor-pointer gap-1.5 text-xs"
                        aria-expanded={expanded.has(line.key)}
                        onClick={() => toggle(line.key)}
                      >
                        <Ruler className="size-3.5" />
                        {customizedParts.length > 0
                          ? `Làm riêng ${customizedParts.length}/${parts.length} món`
                          : "Làm riêng theo yêu cầu"}
                        <ChevronDown
                          className={cn(
                            "size-3.5 transition-transform",
                            expanded.has(line.key) && "rotate-180",
                          )}
                        />
                      </Button>
                      {expanded.has(line.key) && (
                        <ul className="divide-y rounded-md border">
                          {parts.map((part) => {
                            const done = customizedParts.find(
                              (entry) => entry.productItemId === part.productItemId,
                            );
                            return (
                              <li
                                key={part.productItemId}
                                className="flex flex-col gap-1.5 px-3 py-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-medium">
                                        {part.productName}
                                      </span>
                                      {done && (
                                        <Badge variant="warning">Cần đặt xưởng</Badge>
                                      )}
                                    </div>
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {part.sku ? `SKU: ${part.sku} · ` : ""}
                                      {part.quantity * line.quantity} chiếc
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant={done ? "secondary" : "outline"}
                                    size="sm"
                                    className="h-7 cursor-pointer gap-1.5 text-xs"
                                    onClick={() =>
                                      setCustomizing({ key: line.key, component: part })
                                    }
                                  >
                                    <Ruler className="size-3.5" />
                                    {done ? "Sửa yêu cầu" : "Làm riêng"}
                                  </Button>
                                </div>
                                {done && (
                                  <>
                                    <CustomizationChips customization={done.customization} />
                                    {done.customization.note && (
                                      <span className="text-xs text-muted-foreground">
                                        Ghi chú cho xưởng: {done.customization.note}
                                      </span>
                                    )}
                                  </>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </>
                  )
                ) : (
                  line.isManufacturable && (
                  <Button
                    type="button"
                    variant={line.customization ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 w-fit cursor-pointer gap-1.5 text-xs"
                    onClick={() => setCustomizing({ key: line.key })}
                  >
                    <Ruler className="size-3.5" />
                    {line.customization
                      ? "Sửa yêu cầu làm riêng"
                      : "Làm riêng theo yêu cầu"}
                  </Button>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {customizingLine && (
        <CustomizationDialog
          open
          label={
            customizingPart
              ? `${customizingPart.productName} (trong ${customizingLine.name})`
              : customizingLine.name
          }
          productItemId={customizingPart?.productItemId ?? customizingLine.productItemId}
          sku={customizingPart ? customizingPart.sku : customizingLine.sku}
          value={
            customizingPart
              ? customizingLine.componentCustomizations?.find(
                  (entry) => entry.productItemId === customizingPart.productItemId,
                )?.customization
              : customizingLine.customization
          }
          onOpenChange={(open) => {
            if (!open) setCustomizing(null);
          }}
          onSave={(value) => {
            patch(
              customizingLine.key,
              customizingPart
                ? {
                    componentCustomizations: withComponent(
                      customizingLine,
                      customizingPart.productItemId,
                      value,
                    ),
                  }
                : { customization: value },
            );
            setCustomizing(null);
          }}
        />
      )}
    </div>
  );
}
