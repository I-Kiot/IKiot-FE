"use client";

import * as React from "react";
import { CustomizationChips } from "@/app/(protected)/sales/orders/shared/customization-chips";
import { Minus, Plus, ShoppingCart, Trash2, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageAttachments } from "@/components/image-attachments";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { CustomizationDialog } from "../../shared/customization-dialog";
import { formatVND, lineTotal, stockLevel } from "../shared/order-totals";
import type { OrderLineDraft } from "./order-lines-editor";

interface OrderCartLinesProps {
  lines: OrderLineDraft[];
  onChange: (lines: OrderLineDraft[]) => void;
  error?: string;
}

/**
 * The lines of a manual order, one card per line. Same data as
 * `OrderLinesEditor` minus its search box (the form puts the shared `ProductSearch` above this),
 * and with "Thông số riêng" kept per line.
 */
export function OrderCartLines({
  lines,
  onChange,
  error,
}: OrderCartLinesProps) {
  const [customizing, setCustomizing] = React.useState<string | null>(null);
  const customizingLine =
    lines.find((line) => line.key === customizing) ?? null;

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
      {/* Mỗi dòng một thẻ (2026-10-16), không dùng bảng kiểu bán tại quầy: hàng làm riêng cần chỗ cho mọi thay đổi và
          ảnh, mà cột "Sản phẩm" của bảng bị ép hẹp khi mở sidebar. */}
      <ol className="flex flex-col gap-3">
        {lines.map((line, index) => {
          const { level, missing } = stockLevel(line.stock, line.quantity);
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
                    />
                  </div>
                  <div className="grid w-32 gap-1">
                    <span className="text-xs text-muted-foreground">
                      Giảm giá
                    </span>
                    <MoneyInput
                      className="h-8 text-right text-sm font-medium text-red-500 tabular-nums"
                      aria-label={`Giảm giá ${line.name}`}
                      value={line.discountAmount}
                      onChange={(discountAmount) =>
                        patch(line.key, { discountAmount })
                      }
                    />
                  </div>
                  <div className="grid min-w-32 gap-1 text-right">
                    <span className="text-xs text-muted-foreground">
                      Thành tiền
                    </span>
                    <span className="flex h-8 items-center justify-end text-sm font-semibold tabular-nums">
                      {formatVND(lineTotal(line))}
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
                <Button
                  type="button"
                  variant={line.customization ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 w-fit cursor-pointer gap-1.5 text-xs"
                  onClick={() => setCustomizing(line.key)}
                >
                  <Ruler className="size-3.5" />
                  {line.customization
                    ? "Sửa yêu cầu làm riêng"
                    : "Làm riêng theo yêu cầu"}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {customizingLine && (
        <CustomizationDialog
          open
          label={customizingLine.name}
          productItemId={customizingLine.productItemId}
          sku={customizingLine.sku}
          value={customizingLine.customization}
          onOpenChange={(open) => {
            if (!open) setCustomizing(null);
          }}
          onSave={(value) => {
            patch(customizingLine.key, { customization: value });
            setCustomizing(null);
          }}
        />
      )}
    </div>
  );
}
