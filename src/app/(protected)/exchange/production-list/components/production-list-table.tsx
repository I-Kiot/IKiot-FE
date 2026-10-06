"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { productionRequestApi } from "@/lib/api/production-request";
import { stockMovementApi } from "@/lib/api/stock-movement";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { cn } from "@/lib/utils";
import {
  ORDER_PRIORITY_LABELS,
  ORDER_STATUS_LABELS,
  personName,
  type ProductionListRow,
} from "@/types/order-flow";
import type { StockMovementLocationOption } from "@/types/stock-movement";
import {
  formatDate,
  requestStatusDisplay,
} from "@/app/(protected)/exchange/production-requests/shared/production-display";
import { AddToRequestDialog } from "./add-to-request-dialog";

const PAGE_SIZE = 20;
const ALL = "ALL";

/** A custom row's agreed specs on one line ("181 × 90 cm · Gỗ óc chó · V-102"). */
function specsSummary(row: ProductionListRow): string | null {
  const c = row.customization;
  if (!c) return null;
  const size = [c.lengthCm, c.widthCm, c.heightCm].filter((v) => v != null).join(" × ");
  return [size ? `${size} cm` : null, c.material, c.color, c.fabricCode]
    .filter(Boolean)
    .join(" · ");
}

/**
 * B-6: what has to be made (`GET /production-list`, contract §3) - one row per (location, SKU),
 * worked out when read: demand of orders not yet shipped, against stock, what the workshops are
 * making and what is still on a draft. A notification links here with `locationId` / `productItemId`.
 */
export function ProductionListTable() {
  const params = useSearchParams();
  const canOrder =
    allows(getSessionRole(), "production_requests", "create") ||
    allows(getSessionRole(), "production_requests", "update");

  const [locations, setLocations] = React.useState<StockMovementLocationOption[]>([]);
  const [locationId, setLocationId] = React.useState(params.get("locationId") ?? ALL);
  const [productItemId, setProductItemId] = React.useState(params.get("productItemId"));
  const [onlyShort, setOnlyShort] = React.useState(!params.get("productItemId"));
  const [hasOpenRequest, setHasOpenRequest] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [reloads, setReloads] = React.useState(0);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState<ProductionListRow | null>(null);

  const query = [page, locationId, productItemId, onlyShort, hasOpenRequest, term, reloads].join("|");
  const [loaded, setLoaded] = React.useState<{
    query: string;
    rows: ProductionListRow[];
    total: number;
    shortRows: number;
  } | null>(null);
  const loading = loaded?.query !== query;
  const rows = loaded?.rows ?? [];
  const total = loaded?.total ?? 0;

  React.useEffect(() => {
    stockMovementApi
      .getLocationOptions()
      .then(setLocations)
      .catch(() => setLocations([]));
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let stale = false;
    productionRequestApi
      .getProductionList({
        page,
        limit: PAGE_SIZE,
        ...(locationId !== ALL ? { locationId } : {}),
        ...(productItemId ? { productItemId } : {}),
        ...(term ? { search: term } : {}),
        onlyShort,
        hasOpenRequest: hasOpenRequest || undefined,
      })
      .then((result) => {
        if (stale) return;
        setLoaded({
          query,
          rows: result.data,
          total: result.pagination.total,
          shortRows: result.summary.shortRows,
        });
      })
      .catch((error) => {
        if (stale) return;
        toast.error(getApiErrorBody(error)?.message ?? "Không tải được danh sách cần sản xuất");
        setLoaded({ query, rows: [], total: 0, shortRows: 0 });
      });
    return () => {
      stale = true;
    };
  }, [page, locationId, productItemId, onlyShort, hasOpenRequest, term, query]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resetPage = () => setPage(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Tên hàng, SKU"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={locationId}
          onValueChange={(value) => {
            setLocationId(value);
            resetPage();
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi kho / chi nhánh</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="only-short"
            checked={onlyShort}
            onCheckedChange={(checked) => {
              setOnlyShort(checked);
              resetPage();
            }}
          />
          <Label htmlFor="only-short">Chỉ hàng còn thiếu</Label>
          {loaded && (
            <Badge variant={loaded.shortRows > 0 ? "error" : "secondary"}>{loaded.shortRows}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="has-open"
            checked={hasOpenRequest}
            onCheckedChange={(checked) => {
              setHasOpenRequest(checked);
              resetPage();
            }}
          />
          <Label htmlFor="has-open">Có yêu cầu đang mở</Label>
        </div>
        {productItemId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setProductItemId(null);
              resetPage();
            }}
          >
            Đang xem một mặt hàng
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Mặt hàng</TableHead>
              <TableHead>Nơi xuất</TableHead>
              <TableHead className="text-right">Tồn</TableHead>
              <TableHead className="text-right">Đơn cần</TableHead>
              <TableHead className="text-right">Đã đặt xưởng</TableHead>
              <TableHead className="text-right">Nháp</TableHead>
              <TableHead className="text-right">Còn thiếu</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isOpen = expanded === row.key;
              const specs = specsSummary(row);
              return (
                <React.Fragment key={row.key}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : row.key)}
                  >
                    <TableCell>
                      <ChevronRight
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isOpen && "rotate-90",
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {row.productName}
                        {row.isCustom && (
                          <Badge variant="outline" className="ml-2">
                            Làm riêng
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[row.sku, row.variantLabel].filter(Boolean).join(" · ") || "-"}
                      </div>
                      {specs && <div className="text-xs text-muted-foreground">{specs}</div>}
                    </TableCell>
                    <TableCell>{row.location?.name ?? "Chưa chọn kho"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.stock}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.demandQuantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.onOrderQuantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.draftQuantity}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold tabular-nums",
                        row.shortQuantity > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {row.shortQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {canOrder && (
                        <Button
                          size="sm"
                          variant={row.shortQuantity > 0 ? "default" : "outline"}
                          onClick={(event) => {
                            event.stopPropagation();
                            setAdding(row);
                          }}
                        >
                          Thêm vào yêu cầu
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell />
                      <TableCell colSpan={8}>
                        <div className="grid gap-4 py-2 lg:grid-cols-2">
                          <div>
                            <div className="mb-1 text-sm font-medium">
                              Đơn đang chờ ({row.orders.length})
                            </div>
                            {row.orders.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Không có đơn nào chờ</p>
                            ) : (
                              <ul className="space-y-1 text-sm">
                                {row.orders.map((order) => (
                                  <li key={order.orderItemId} className="flex flex-wrap gap-x-2">
                                    <Link
                                      href={`/sales/orders/${order.orderId}`}
                                      className="font-medium underline"
                                    >
                                      {order.orderCode}
                                    </Link>
                                    <span>× {order.quantity}</span>
                                    <span className="text-muted-foreground">
                                      {ORDER_PRIORITY_LABELS[order.priority] ?? order.priority} ·{" "}
                                      {ORDER_STATUS_LABELS[order.status] ?? order.status} · hẹn{" "}
                                      {formatDate(order.requestedDeliveryDate)}
                                      {order.assignee ? ` · ${personName(order.assignee)}` : ""}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <div className="mb-1 text-sm font-medium">
                              Yêu cầu sản xuất đang mở ({row.requests.length})
                            </div>
                            {row.requests.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Chưa đặt xưởng</p>
                            ) : (
                              <ul className="space-y-1 text-sm">
                                {row.requests.map((request) => {
                                  const display = requestStatusDisplay(request.status);
                                  return (
                                    <li key={request.id} className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium">{request.code}</span>
                                      <Badge variant={display.variant}>{display.label}</Badge>
                                      <span className="text-muted-foreground">
                                        {request.supplierName} · {request.receivedQuantity}/
                                        {request.quantity} · hẹn {formatDate(request.expectedReadyDate)}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  {onlyShort ? "Không có mặt hàng nào đang thiếu" : "Không có mặt hàng nào"}
                </TableCell>
              </TableRow>
            )}
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} dòng · trang {page}/{pages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      </div>

      {adding && (
        <AddToRequestDialog
          open
          row={adding}
          onOpenChange={(open) => {
            if (!open) setAdding(null);
          }}
          onAdded={() => {
            setAdding(null);
            setReloads((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
