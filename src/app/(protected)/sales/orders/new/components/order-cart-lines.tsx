"use client";

import * as React from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoneyInput } from "@/app/(protected)/exchange/shared/form-fields";
import { CustomizationDialog, customizationSummary } from "../../shared/customization-dialog";
import { formatVND, lineTotal, stockLevel } from "../shared/order-totals";
import type { OrderLineDraft } from "./order-lines-editor";

interface OrderCartLinesProps {
  lines: OrderLineDraft[];
  onChange: (lines: OrderLineDraft[]) => void;
  error?: string;
}

/**
 * The lines of a manual order, drawn like the cart of the direct sale (check-out). Same data as
 * `OrderLinesEditor` minus its search box (the form puts the shared `ProductSearch` above this),
 * and with "Thông số riêng" kept per line.
 */
export function OrderCartLines({ lines, onChange, error }: OrderCartLinesProps) {
  const [customizing, setCustomizing] = React.useState<string | null>(null);
  const customizingLine = lines.find((line) => line.key === customizing) ?? null;

  const patch = (key: string, change: Partial<OrderLineDraft>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...change } : line)));

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border border-dashed bg-card/40 shadow-xs text-center space-y-4 select-none">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <ShoppingCart className="size-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-foreground">Đơn hàng chưa có mặt hàng</h3>
          <p className="text-base text-muted-foreground leading-normal">
            Nhập tên, mã sản phẩm hoặc quét mã vạch ở ô tìm kiếm phía trên để thêm sản phẩm vào đơn.
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center font-bold text-base">STT</TableHead>
              <TableHead className="font-bold text-base">Sản phẩm</TableHead>
              <TableHead className="w-32 text-center font-bold text-base">Số lượng</TableHead>
              <TableHead className="w-36 text-right font-bold text-base">Đơn giá</TableHead>
              <TableHead className="w-32 text-right font-bold text-base">Giảm giá</TableHead>
              <TableHead className="w-32 text-right font-bold text-base">Thành tiền</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => {
              const { level, missing } = stockLevel(line.stock, line.quantity);
              return (
                <TableRow key={line.key} className="group hover:bg-muted/30 transition-colors duration-150">
                  <TableCell className="text-center font-medium font-mono text-muted-foreground text-base">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-foreground">
                        {line.name}
                        {line.customization && (
                          <Badge variant="outline" className="ml-2">
                            Làm riêng
                          </Badge>
                        )}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground font-mono mt-0.5">
                        <span>SKU: {line.sku}</span>
                        {level === "ENOUGH" ? (
                          <Badge variant="success">Đủ hàng</Badge>
                        ) : level === "SHORT" ? (
                          <Badge variant="warning">Thiếu {missing}</Badge>
                        ) : (
                          <Badge variant="error">Hết hàng</Badge>
                        )}
                      </div>
                      {line.customization && (
                        <span className="text-xs text-muted-foreground">
                          {customizationSummary(line.customization)}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto w-fit px-0 text-xs"
                        onClick={() => setCustomizing(line.key)}
                      >
                        {line.customization ? "Sửa thông số riêng" : "Thông số riêng"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0 cursor-pointer"
                        aria-label={`Giảm số lượng ${line.name}`}
                        disabled={line.quantity <= 1}
                        onClick={() => patch(line.key, { quantity: line.quantity - 1 })}
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
                            quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                          })
                        }
                        className="w-14 h-9 px-1 text-center font-bold text-base tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0 cursor-pointer"
                        aria-label={`Tăng số lượng ${line.name}`}
                        onClick={() => patch(line.key, { quantity: line.quantity + 1 })}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MoneyInput
                      className="h-9 text-right text-base font-bold tabular-nums"
                      aria-label={`Đơn giá ${line.name}`}
                      value={line.unitPrice}
                      onChange={(unitPrice) => patch(line.key, { unitPrice })}
                    />
                    {line.unitPrice !== line.retailPrice && (
                      <div className="mt-1 text-right text-xs text-muted-foreground">
                        Giá niêm yết {formatVND(line.retailPrice)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <MoneyInput
                      className="h-9 text-right text-base font-bold text-red-500 tabular-nums"
                      aria-label={`Giảm giá ${line.name}`}
                      value={line.discountAmount}
                      onChange={(discountAmount) => patch(line.key, { discountAmount })}
                    />
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg tabular-nums text-foreground">
                    {formatVND(lineTotal(line))}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Bỏ ${line.name}`}
                      onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                      className="size-9 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-full opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-4.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {customizingLine && (
        <CustomizationDialog
          open
          label={customizingLine.name}
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
