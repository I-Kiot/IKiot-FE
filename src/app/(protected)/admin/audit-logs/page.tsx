"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { listAuditLogs, type AuditLog } from "@/lib/api/audit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [userQuery, setUserQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    listAuditLogs({
      user: userQuery || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
      resource: resourceFilter || undefined,
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
      .catch((err) => {
        console.error(err);
        toast.error("Không thể tải nhật ký hoạt động!");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    userQuery,
    actionFilter,
    resourceFilter,
    startDate,
    endDate,
    currentPage,
    pageSize,
  ]);

  // Debounce text filters (user query + resource) by 400ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLogs();
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchLogs]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30";
      case "UPDATE":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30";
      case "DELETE":
        return "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30";
      case "LOGIN":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin/dashboard" },
          { label: "Nhật ký hệ thống" },
        ]}
        title="Nhật ký hoạt động (Audit Log)"
        description="Lưu giữ toàn bộ thao tác thay đổi, thêm, xóa thông tin của các quản trị viên cấp cao trên hệ thống."
      />

      {/* Toolbar / Filters - reactive, no buttons needed */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Người thực hiện</Label>
          <Input
            placeholder="Tên hoặc Email..."
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Thao tác</Label>
          <Select
            value={actionFilter}
            onValueChange={(val) => {
              setActionFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Tất cả thao tác" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thao tác</SelectItem>
              <SelectItem value="CREATE">Tạo mới (CREATE)</SelectItem>
              <SelectItem value="UPDATE">Cập nhật (UPDATE)</SelectItem>
              <SelectItem value="DELETE">Xóa (DELETE)</SelectItem>
              <SelectItem value="LOGIN">Đăng nhập (LOGIN)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Đối tượng</Label>
          <Input
            placeholder="Ví dụ: Tenant A, Ticket..."
            value={resourceFilter}
            onChange={(e) => {
              setResourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Từ ngày - Đến ngày</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-semibold text-sm w-[180px]">
                Thời gian
              </TableHead>
              <TableHead className="font-semibold text-sm">
                Người thực hiện
              </TableHead>
              <TableHead className="font-semibold text-sm w-[100px]">
                Thao tác
              </TableHead>
              <TableHead className="font-semibold text-sm w-[200px]">
                Đối tượng tác động
              </TableHead>
              <TableHead className="font-semibold text-sm">
                Chi tiết hoạt động
              </TableHead>
              <TableHead className="font-semibold text-sm w-[130px]">
                Địa chỉ IP
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-xs text-muted-foreground">
                      Đang tải dữ liệu nhật ký...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  Không tìm thấy hoạt động nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {log.userName || "N/A"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.userEmail || ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getActionBadgeColor(log.action)}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {log.resource || (
                      <span className="text-muted-foreground font-normal italic">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="text-sm max-w-[300px] truncate"
                    title={log.details}
                  >
                    {log.details}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.ipAddress || "127.0.0.1"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="page-size" className="text-sm font-medium">
              Hiển thị
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger
                className="w-20 cursor-pointer h-8 text-xs"
                id="page-size"
              >
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[15, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground ml-2">
              Tổng số: {totalItems}
            </span>
          </div>

          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 text-sm">
              <p className="font-medium text-xs text-muted-foreground">Trang</p>
              <strong className="text-xs">
                {currentPage} / {totalPages}
              </strong>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="cursor-pointer h-8 text-xs"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="cursor-pointer h-8 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
