"use client";

import { Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CartItem {
  productItemId: string;
  productCode: string;
  sku: string;
  barcode: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  imageUrl?: string;
}

interface CartItemsProps {
  items: CartItem[];
  onQuantityChange: (productItemId: string, quantity: number) => void;
  onUnitPriceChange: (productItemId: string, price: number) => void;
  onDiscountChange: (productItemId: string, discount: number) => void;
  onItemRemove: (productItemId: string) => void;
}

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export function CartItems({
  items,
  onQuantityChange,
  onUnitPriceChange,
  onDiscountChange,
  onItemRemove,
}: CartItemsProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 rounded-xl border border-dashed bg-card/40 shadow-xs text-center space-y-4 select-none">
        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
          <ShoppingCart className="size-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="text-lg font-bold text-foreground">Giỏ Hàng Đang Trống</h3>
          <p className="text-base text-muted-foreground leading-normal">
            Vui lòng nhập tên, mã sản phẩm hoặc quét mã vạch ở ô tìm kiếm phía trên để thêm sản phẩm vào đơn hàng.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12 text-center font-bold text-base">STT</TableHead>
            <TableHead className="font-bold text-base">Sản phẩm</TableHead>
            <TableHead className="w-32 text-center font-bold text-base">Số lượng</TableHead>
            <TableHead className="w-32 text-right font-bold text-base">Đơn giá</TableHead>
            <TableHead className="w-28 text-right font-bold text-base">Giảm giá</TableHead>
            <TableHead className="w-32 text-right font-bold text-base">Thành tiền</TableHead>
            <TableHead className="w-12 text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const rowTotal = item.quantity * (item.unitPrice - item.discountAmount);

            return (
              <TableRow key={item.productItemId} className="group hover:bg-muted/30 transition-colors duration-150">
                {/* Ordinal Index */}
                <TableCell className="text-center font-medium font-mono text-muted-foreground text-base">
                  {index + 1}
                </TableCell>

                {/* Product details */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-foreground">{item.name}</span>
                    <div className="flex gap-2 text-sm text-muted-foreground font-mono mt-0.5">
                      <span>{item.productCode}</span>
                      <span>|</span>
                      <span>SKU: {item.sku}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Quantity editor */}
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0 cursor-pointer"
                      onClick={() => onQuantityChange(item.productItemId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onQuantityChange(item.productItemId, isNaN(val) || val < 1 ? 1 : val);
                      }}
                      className="w-14 h-9 px-1 text-center font-bold text-base tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0 cursor-pointer"
                      onClick={() => onQuantityChange(item.productItemId, item.quantity + 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </TableCell>

                {/* Unit Price editor */}
                <TableCell>
                  <div className="flex justify-end">
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUnitPriceChange(item.productItemId, isNaN(val) || val < 0 ? 0 : val);
                      }}
                      className="w-28 h-9 text-right text-base font-bold tabular-nums px-1.5 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </TableCell>

                {/* Unit Discount editor */}
                <TableCell>
                  <div className="flex justify-end">
                    <Input
                      type="number"
                      value={item.discountAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const cleanVal = isNaN(val) || val < 0 ? 0 : val;
                        // Clamp discount amount to item unit price
                        onDiscountChange(
                          item.productItemId,
                          cleanVal > item.unitPrice ? item.unitPrice : cleanVal,
                        );
                      }}
                      className="w-24 h-9 text-right text-base font-bold text-red-500 tabular-nums px-1.5 focus-visible:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </TableCell>

                {/* Row Total */}
                <TableCell className="text-right font-bold text-lg tabular-nums text-foreground">
                  {formatVND(rowTotal)}
                </TableCell>

                {/* Delete button */}
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onItemRemove(item.productItemId)}
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
  );
}
