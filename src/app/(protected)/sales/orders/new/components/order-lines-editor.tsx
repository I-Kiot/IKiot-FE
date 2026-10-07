"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
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
import { productApi } from "@/lib/api/product";
import type { LocationType } from "@/types/location";
import type { OrderItemCustomization } from "@/types/order-flow";
import { CustomizationDialog, customizationSummary } from "../../shared/customization-dialog";
import { formatVND, lineTotal, stockLevel } from "../shared/order-totals";

export interface OrderLineDraft {
  /** Local key; the same SKU can be added twice with different agreed prices. */
  key: string;
  /** The existing order line this draft edits (D-7); absent for a line added in the form. */
  id?: string;
  productItemId: string;
  name: string;
  sku: string;
  retailPrice: number;
  /** On-shelf stock at the ship-from location when the line was added. */
  stock: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  /** D-2: made to the customer's measure - the line gets a SKU of its own on create (A-4). */
  customization?: OrderItemCustomization;
}

interface SkuOption {
  productItemId: string;
  name: string;
  sku: string;
  retailPrice: number;
  stock: number;
}

interface OrderLinesEditorProps {
  lines: OrderLineDraft[];
  onChange: (lines: OrderLineDraft[]) => void;
  /** Where the goods are expected to ship from; stock is read there. Empty until a branch is chosen. */
  stockLocation: { id: string; type: LocationType } | null;
  error?: string;
  /** Offer "Thông số riêng" per line - on create only (`PATCH /orders/:id` takes no specs). */
  allowCustomization?: boolean;
}


/** Product search + the lines of the order. Stock is shown per line and never blocks (contract §2: an order is taken even when the goods are not on the shelf). */
export function OrderLinesEditor({
  lines,
  onChange,
  stockLocation,
  error,
  allowCustomization = false,
}: OrderLinesEditorProps) {
  const [customizing, setCustomizing] = React.useState<string | null>(null);
  const customizingLine = lines.find((line) => line.key === customizing) ?? null;
  const [search, setSearch] = React.useState("");
  const keySeq = React.useRef(0);
  const term = search.trim();
  const locationKey = stockLocation ? `${stockLocation.type}:${stockLocation.id}` : "";
  const [found, setFound] = React.useState<{ key: string; items: SkuOption[] } | null>(null);
  const searchKey = `${term}|${locationKey}`;
  const wanted = term.length >= 2;
  const options = wanted && found?.key === searchKey ? found.items : [];
  const searching = wanted && found?.key !== searchKey;

  React.useEffect(() => {
    if (!wanted) return;
    let stale = false;
    const timer = setTimeout(() => {
      productApi
        .search({
          q: term,
          limit: 10,
          status: "ACTIVE",
          ...(stockLocation
            ? { locationId: stockLocation.id, locationType: stockLocation.type }
            : {}),
        })
        .then((res) => {
          if (stale) return;
          setFound({
            key: searchKey,
            items: res.data.flatMap((product) =>
              (product.items ?? []).map((item) => ({
                productItemId: item.id,
                name: product.name,
                sku: item.sku,
                retailPrice: item.retailPrice,
                stock: item.stock ?? 0,
              })),
            ),
          });
        })
        .catch(() => {
          if (!stale) setFound({ key: searchKey, items: [] });
        });
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
    // `stockLocation` is covered by `searchKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, term, searchKey]);

  const add = (option: SkuOption) => {
    const existing = lines.find(
      (line) =>
        line.productItemId === option.productItemId &&
        line.unitPrice === option.retailPrice &&
        !line.customization,
    );
    if (existing) {
      onChange(
        lines.map((line) =>
          line.key === existing.key ? { ...line, quantity: line.quantity + 1 } : line,
        ),
      );
    } else {
      onChange([
        ...lines,
        {
          key: `${option.productItemId}-${++keySeq.current}`,
          productItemId: option.productItemId,
          name: option.name,
          sku: option.sku,
          retailPrice: option.retailPrice,
          stock: option.stock,
          quantity: 1,
          unitPrice: option.retailPrice,
          discountAmount: 0,
        },
      ]);
    }
    setSearch("");
  };

  const patch = (key: string, change: Partial<OrderLineDraft>) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, ...change } : line)));

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Input
          placeholder="Tìm sản phẩm theo tên, mã hoặc SKU"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Tìm sản phẩm"
        />
        {searching && <p className="text-sm text-muted-foreground">Đang tìm...</p>}
        {options.length > 0 && (
          <ul className="max-h-64 divide-y overflow-auto rounded-md border">
            {options.map((option) => (
              <li key={option.productItemId}>
                <button
                  type="button"
                  onClick={() => add(option)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>
                    <span className="font-medium">{option.name}</span>
                    <span className="text-muted-foreground"> · {option.sku}</span>
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>Tồn {option.stock}</span>
                    <span>{formatVND(option.retailPrice)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {wanted && !searching && options.length === 0 && (
          <p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm nào.</p>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          Chưa có mặt hàng nào. Tìm sản phẩm ở trên để thêm vào đơn.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="w-28">Tồn kho</TableHead>
                <TableHead className="w-24 text-right">SL</TableHead>
                <TableHead className="w-36 text-right">Đơn giá</TableHead>
                <TableHead className="w-32 text-right">Giảm giá</TableHead>
                <TableHead className="w-32 text-right">Thành tiền</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const { level, missing } = stockLevel(line.stock, line.quantity);
                return (
                  <TableRow key={line.key}>
                    <TableCell>
                      <div className="font-medium">
                        {line.name}
                        {line.customization && (
                          <Badge variant="outline" className="ml-2">
                            Làm riêng
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{line.sku}</div>
                      {line.customization && (
                        <div className="text-xs text-muted-foreground">
                          {customizationSummary(line.customization)}
                        </div>
                      )}
                      {allowCustomization && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto px-0 text-xs"
                          onClick={() => setCustomizing(line.key)}
                        >
                          {line.customization ? "Sửa thông số riêng" : "Thông số riêng"}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {level === "ENOUGH" ? (
                        <Badge variant="success">Đủ hàng</Badge>
                      ) : level === "SHORT" ? (
                        <Badge variant="warning">Thiếu {missing}</Badge>
                      ) : (
                        <Badge variant="error">Hết hàng</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={1}
                        className="text-right"
                        aria-label={`Số lượng ${line.name}`}
                        value={line.quantity}
                        onChange={(event) =>
                          patch(line.key, {
                            quantity: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <MoneyInput
                        className="text-right"
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
                        className="text-right"
                        aria-label={`Giảm giá ${line.name}`}
                        value={line.discountAmount}
                        onChange={(discountAmount) => patch(line.key, { discountAmount })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatVND(lineTotal(line))}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Bỏ ${line.name}`}
                        onClick={() => onChange(lines.filter((item) => item.key !== line.key))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
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
