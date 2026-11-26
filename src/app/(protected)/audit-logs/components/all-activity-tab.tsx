"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ActorCell } from "./actor-cell";
import { formatVietnamDateTime } from "@/app/(protected)/staffs/shared/vietnam-datetime";
import { listTenantAuditLogs, type AuditLog } from "@/lib/api/audit";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ALL = "all";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  DELETE: "Xóa",
  LOGIN: "Đăng nhập",
};

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  UPDATE: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  DELETE: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  LOGIN: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

// Tên đối tượng do hệ thống ghi bằng tiếng Anh; đối tượng chưa có trong bảng này hiện nguyên tên gốc.
const RESOURCE_LABELS: Record<string, string> = {
  Orders: "Đơn hàng",
  "Order-returns": "Đổi trả",
  Customers: "Khách hàng",
  Products: "Sản phẩm",
  Categories: "Danh mục",
  Brands: "Thương hiệu",
  Warehouses: "Kho hàng",
  Branches: "Chi nhánh",
  Locations: "Địa điểm",
  Shipments: "Giao hàng",
  Fulfillments: "Đóng gói",
  Suppliers: "Nhà cung cấp",
  Promotions: "Khuyến mãi",
  Users: "Nhân viên",
  Roles: "Phân quyền",
  Tickets: "Phản ánh",
  "Stock-movements": "Phiếu kho",
  "Cash-flows": "Thu chi",
  "Cash-drawer-sessions": "Ca két tiền",
};

const resourceLabel = (resource?: string | null) =>
  resource ? (RESOURCE_LABELS[resource] ?? resource) : "";

const detailText = (log: AuditLog) =>
  log.resource && RESOURCE_LABELS[log.resource]
    ? (log.details ?? "").replace(log.resource, RESOURCE_LABELS[log.resource].toLowerCase())
    : (log.details ?? "");

export function AllActivityTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [userQuery, setUserQuery] = useState("");
  const [actionFilter, setActionFilter] = useState(ALL);
  const [resourceFilter, setResourceFilter] = useState(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    listTenantAuditLogs({
      user: userQuery || undefined,
      action: actionFilter === ALL ? undefined : actionFilter,
      resource: resourceFilter === ALL ? undefined : resourceFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: currentPage,
      limit: pageSize,
    })
      .then((res) => {
        if (res.success) {
          setLogs(res.data);
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.total);
        }
      })
      .catch(() => toast.error("Không thể tải lịch sử hành động"))
      .finally(() => setLoading(false));
  }, [userQuery, actionFilter, resourceFilter, startDate, endDate, currentPage, pageSize]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchLogs, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchLogs]);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Người thực hiện</Label>
          <Input
            placeholder="Tên hoặc email..."
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              resetPage();
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Thao tác</Label>
          <Select
            value={actionFilter}
            onValueChange={(value) => {
              setActionFilter(value);
              resetPage();
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả thao tác</SelectItem>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Đối tượng</Label>
          <Select
            value={resourceFilter}
            onValueChange={(value) => {
              setResourceFilter(value);
              resetPage();
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả đối tượng</SelectItem>
              {Object.entries(RESOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Từ ngày - Đến ngày</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="Từ ngày"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                resetPage();
              }}
              className="h-9 text-xs"
            />
            <Input
              type="date"
              aria-label="Đến ngày"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                resetPage();
              }}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[170px] text-sm font-semibold">Thời gian</TableHead>
              <TableHead className="w-[240px] text-sm font-semibold">Người thực hiện</TableHead>
              <TableHead className="w-[110px] text-sm font-semibold">Thao tác</TableHead>
              <TableHead className="w-[150px] text-sm font-semibold">Đối tượng</TableHead>
              <TableHead className="text-sm font-semibold">Chi tiết</TableHead>
              <TableHead className="w-[130px] text-sm font-semibold">Địa chỉ IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-muted-foreground">Đang tải lịch sử...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  Không có hành động nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-muted-foreground">
                    {formatVietnamDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ActorCell actor={log.actor} fallbackName={log.userName} fallbackRole={log.userRole} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={ACTION_STYLES[log.action] ?? "border-zinc-500/30 bg-zinc-500/10 text-zinc-600"}
                    >
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {resourceLabel(log.resource) || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate text-sm" title={detailText(log)}>
                    {detailText(log)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalItems > 0 && (
        <DataTablePagination
          page={currentPage}
          pageCount={totalPages}
          pageSize={pageSize}
          total={totalItems}
          unit="hành động"
          disabled={loading}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            resetPage();
          }}
        />
      )}
    </div>
  );
}
