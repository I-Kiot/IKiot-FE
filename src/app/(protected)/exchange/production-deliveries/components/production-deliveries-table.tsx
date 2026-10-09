"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allows } from "@/components/sidebar/constants/role-permissions";
import { getSessionRole } from "@/lib/auth";
import { getApiErrorBody } from "@/lib/api/error-codes";
import { productionDeliveryApi } from "@/lib/api/production-delivery";
import {
  PRODUCTION_DELIVERY_STATUS_LABELS,
  personName,
  type ProductionDelivery,
  type ProductionDeliveryStatus,
} from "@/types/order-flow";
import { CancelDeliveryDialog } from "../../production-requests/components/cancel-delivery-dialog";
import { deliveryStatusDisplay, formatDateTime } from "../../production-requests/shared/production-display";
import { ReceiveDeliveryDialog } from "./receive-delivery-dialog";

const PAGE_SIZE = 10;
const ALL = "ALL";

/** Phiếu xưởng giao (`GET /production-deliveries`): mặc định các phiếu chờ nhận ở nơi mình làm. */
export function ProductionDeliveriesTable() {
  const canReceive = allows(getSessionRole(), "production", "receive");
  // Thông báo "Xưởng giao hàng – chờ nhận" dẫn tới đây kèm ?status=PENDING; mặc định cũng là chờ nhận.
  const params = useSearchParams();

  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>(() => params.get("status") ?? "PENDING");
  const [search, setSearch] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [reloads, setReloads] = React.useState(0);
  const [receiving, setReceiving] = React.useState<ProductionDelivery | null>(null);
  const [refusing, setRefusing] = React.useState<ProductionDelivery | null>(null);
  const query = `${page}|${status}|${term}|${reloads}`;
  const [loaded, setLoaded] = React.useState<{
    query: string;
    rows: ProductionDelivery[];
    total: number;
  } | null>(null);
  const loading = loaded?.query !== query;
  const rows = loaded?.rows ?? [];
  const total = loaded?.total ?? 0;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let stale = false;
    productionDeliveryApi
      .getList({
        page,
        limit: PAGE_SIZE,
        ...(status !== ALL ? { status: status as ProductionDeliveryStatus } : {}),
        ...(term ? { search: term } : {}),
      })
      .then((result) => {
        if (!stale) setLoaded({ query, rows: result.data, total: result.pagination.total });
      })
      .catch((error) => {
        if (stale) return;
        toast.error(getApiErrorBody(error)?.message ?? "Không tải được phiếu giao");
        setLoaded({ query, rows: [], total: 0 });
      });
    return () => {
      stale = true;
    };
  }, [page, status, term, query]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reload = () => setReloads((n) => n + 1);

  async function refuse(reason: string) {
    if (!refusing) return;
    try {
      await productionDeliveryApi.cancel(refusing.id, reason);
      toast.success("Đã từ chối phiếu giao");
      setRefusing(null);
      reload();
    } catch (error) {
      toast.error(getApiErrorBody(error)?.message ?? "Không từ chối được phiếu giao");
      throw error;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Mã phiếu giao / mã yêu cầu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
            {(Object.keys(PRODUCTION_DELIVERY_STATUS_LABELS) as ProductionDeliveryStatus[]).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {PRODUCTION_DELIVERY_STATUS_LABELS[value]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Button variant="outline" className="ml-auto" onClick={reload}>
          Tải lại
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phiếu giao</TableHead>
              <TableHead>Yêu cầu</TableHead>
              <TableHead>Xưởng</TableHead>
              <TableHead>Nơi nhận</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Số giao</TableHead>
              <TableHead>Tạo lúc</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const display = deliveryStatusDisplay(row.status);
              const delivered = row.items.reduce((sum, line) => sum + line.quantity, 0);
              const counted = row.items.reduce((sum, line) => sum + (line.receivedQuantity ?? 0), 0);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.productionRequest.code}</TableCell>
                  <TableCell>{row.productionRequest.supplier.supplierName}</TableCell>
                  <TableCell>{row.productionRequest.location.name}</TableCell>
                  <TableCell>
                    <Badge variant={display.variant}>{display.label}</Badge>
                    {row.status === "CANCELLED" && row.cancelReason && (
                      <div className="mt-1 text-xs text-muted-foreground">{row.cancelReason}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.status === "RECEIVED" ? `${counted}/${delivered}` : delivered}
                  </TableCell>
                  <TableCell>
                    <div>{formatDateTime(row.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">{personName(row.createdBy)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    {row.status === "PENDING" && canReceive && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setReceiving(row)}>
                          Nhận hàng
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setRefusing(row)}>
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Không có phiếu giao nào
                </TableCell>
              </TableRow>
            )}
            {loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} phiếu · trang {page}/{pages}
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

      {receiving && (
        <ReceiveDeliveryDialog
          key={receiving.id}
          delivery={receiving}
          open
          onOpenChange={(open) => !open && setReceiving(null)}
          onReceived={() => {
            setReceiving(null);
            reload();
          }}
        />
      )}
      <CancelDeliveryDialog
        open={refusing !== null}
        onOpenChange={(open) => !open && setRefusing(null)}
        title={`Từ chối phiếu giao ${refusing?.code ?? ""}`}
        description="Sai hàng hoặc không có hàng. Phiếu chưa đụng tồn kho; xưởng sẽ được báo kèm lý do."
        confirmLabel="Từ chối"
        onConfirm={refuse}
      />
    </div>
  );
}
