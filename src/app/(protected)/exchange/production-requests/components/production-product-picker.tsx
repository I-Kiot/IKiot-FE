"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { productionRequestApi } from "@/lib/api/production-request";
import type { ProductionListPage, ProductionListRow } from "@/types/order-flow";
import { lineKey, useProduction, type DraftLine } from "./production-provider";
import { customizationSummary, rowLabel } from "./production-format";

const PAGE_SIZE = 10;

/** A picked row as a request line: what is short, or 1 for a SKU ordered with nothing short. A custom piece is tied to its order line. */
export function lineOfRow(row: ProductionListRow): DraftLine {
  return {
    productItemId: row.productItemId,
    quantity: Math.max(1, row.shortQuantity),
    orderItemId: row.customOrderItemId ?? undefined,
    label: rowLabel(row),
  };
}

/**
 * Every producible SKU at the receiving location (`GET /production-list`), with "Cần sản xuất"
 * as a column and a filter - short ones first - so anything can be ordered, and what has to be
 * ordered is the first thing on screen.
 */
export function ProductionProductPicker({
  locationId,
  picked,
  onToggle,
  initialOnlyShort = false,
}: {
  locationId: string;
  picked: ReadonlySet<string>;
  onToggle: (line: DraftLine) => void;
  initialOnlyShort?: boolean;
}) {
  const { version } = useProduction();
  const [search, setSearch] = useState("");
  const [onlyShort, setOnlyShort] = useState(initialOnlyShort);
  const [page, setPage] = useState(1);
  const key = JSON.stringify({ locationId, search, onlyShort, page, version });
  const [state, setState] = useState<{
    key: string;
    page: ProductionListPage | null;
  }>({
    key: "",
    page: null,
  });

  useEffect(() => {
    let alive = true;
    const q = JSON.parse(key) as {
      locationId: string;
      search: string;
      onlyShort: boolean;
      page: number;
    };
    productionRequestApi
      .getProductionList({
        locationId: q.locationId,
        search: q.search.trim() || undefined,
        onlyShort: q.onlyShort,
        page: q.page,
        limit: PAGE_SIZE,
      })
      .then((result) => alive && setState({ key, page: result }))
      .catch(() => alive && setState({ key, page: null }));
    return () => {
      alive = false;
    };
  }, [key]);

  const loading = state.key !== key;
  const rows = state.page?.data ?? [];
  const totalPages = state.page?.pagination.totalPages ?? 1;
  const shortRows = state.page?.summary.shortRows ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm SKU, tên hàng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-9 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="picker-only-short"
            checked={onlyShort}
            onCheckedChange={(value) => {
              setOnlyShort(value);
              setPage(1);
            }}
          />
          <Label htmlFor="picker-only-short" className="cursor-pointer text-sm">
            Chỉ hàng cần sản xuất
          </Label>
          {shortRows > 0 ? (
            <Badge variant="destructive">{shortRows}</Badge>
          ) : null}
        </div>
      </div>

      <div className="max-h-72 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Mặt hàng</TableHead>
              <TableHead className="text-right">Tồn</TableHead>
              <TableHead className="text-right">Cần cho đơn</TableHead>
              <TableHead className="text-right">Đã đặt</TableHead>
              <TableHead className="text-right">Nháp</TableHead>
              <TableHead className="text-right">Cần SX</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {onlyShort
                    ? "Không có mặt hàng nào cần sản xuất ở nơi này."
                    : "Không tìm thấy mặt hàng."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const line = lineOfRow(row);
                const checked = picked.has(lineKey(line));
                const custom = customizationSummary(row);
                return (
                  <TableRow
                    key={row.key}
                    className="cursor-pointer"
                    onClick={() => onToggle(line)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggle(line)}
                        aria-label="Chọn mặt hàng"
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-1">{rowLabel(row)}</span>
                        {row.isCustom ? (
                          <Badge variant="secondary">Làm riêng</Badge>
                        ) : null}
                      </div>
                      {custom ? (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {custom}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.demandQuantity || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.onOrderQuantity || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.draftQuantity || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.shortQuantity > 0 ? (
                        <Badge variant="destructive" className="tabular-nums">
                          {row.shortQuantity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Cần SX = Cần cho đơn − Tồn − Đã đặt − Nháp</span>
        <div className="flex items-center gap-2">
          <span>
            Trang {page} / {totalPages || 1}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 cursor-pointer"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 cursor-pointer"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
