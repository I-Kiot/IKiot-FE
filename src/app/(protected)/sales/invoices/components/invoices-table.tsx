"use client";

import { Fragment, useState, useEffect } from "react";
import {
  type ColumnFiltersState,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Download, Funnel, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { invoiceApi } from "@/lib/api/invoice";
import { INVOICE_STATUSES, type InvoiceDto } from "@/types/invoice";
import { useAuthStore } from "@/store/auth-store";
import {
  type Invoice,
  invoicesColumns as columns,
  STATUS_MAP,
} from "./invoices-columns";
import { FULFILLMENT_TYPE_LABELS, type FulfillmentType } from "@/types/order-flow";
import { InvoicesExpandedPanel } from "./invoices-expanded-panel";

function mapInvoice(dto: InvoiceDto): Invoice {
  const lines = dto.lines.map((line) => {
    const gross = line.quantity * line.unitPrice;
    return {
      productItemId: line.orderItemId ?? line.id,
      productName: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      // The invoice stores each line net; what was knocked off is the difference.
      discountAmount: line.quantity > 0 ? Math.max(0, (gross - Math.abs(line.amount)) / line.quantity) : 0,
    };
  });

  return {
    id: dto.id,
    // PENDING invoices have no number yet; the order's code stands in so the row is still findable.
    invoiceCode: dto.invoiceNumber ?? dto.order.code,
    invoiceNumber: dto.invoiceNumber,
    type: dto.type,
    orderId: dto.order.id,
    orderCode: dto.order.code,
    reason: dto.reason,
    tenantId: "",
    branchId: dto.branch?.id ?? "",
    customerId: dto.customer.id,
    customer: {
      code: dto.customer.customerCode ?? "-",
      name: dto.customer.name,
      phone: dto.customer.phone || "-",
      gender: (dto.customer.gender as Invoice["customer"]["gender"]) || "OTHER",
      address: dto.customer.address || "-",
    },
    status: dto.status,
    kind: dto.kind,
    fulfillmentType: dto.order.fulfillmentType as FulfillmentType,
    userId: dto.seller?.id ?? "",
    seller: { name: dto.seller?.name ?? "-", email: "", role: "" },
    paymentMethod: (dto.order.paymentMethod as Invoice["paymentMethod"]) ?? null,
    grandTotal: dto.total,
    customerPay: dto.order.customerPay,
    change: dto.order.change,
    note: dto.order.note || "",
    items: lines,
    createdAt: dto.issuedAt ?? dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  // Filtered on the server, like the order list: the 100-row window then holds only what is asked for.
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentType | "all">("all");
  const [loading, setLoading] = useState(true);
  const locationKey = useAuthStore((state) => state.locationKey);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    let stale = false;
    setLoading(true);
    invoiceApi
      .getList({
        limit: 100,
        ...(fulfillmentFilter !== "all" ? { fulfillmentType: fulfillmentFilter } : {}),
      })
      .then((res) => {
        if (stale) return;
        setInvoices(res.data.map(mapInvoice));
      })
      .catch((err) => {
        console.error("Failed to fetch invoices:", err);
        if (!stale) toast.error("Không thể tải danh sách hóa đơn");
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [locationKey, fulfillmentFilter]);

  const COLUMN_LABELS: Record<string, string> = {
    invoiceCode: "Mã hóa đơn",
    createdAt: "Thời gian",
    "customer.code": "Mã khách hàng",
    "customer.name": "Khách hàng (tên)",
    "seller.name": "Người bán",
    grandTotal: "Tổng tiền hàng",
    customerPay: "Khách đã trả",
    paymentMethod: "Thanh toán",
    status: "Trạng thái",
    fulfillmentType: "Hình thức giao",
  };

  const customGlobalFilter = (row: any, columnId: string, filterValue: string) => {
    const invoice = row.original as Invoice;
    const val = filterValue.toLowerCase();
    return (
      invoice.invoiceCode.toLowerCase().includes(val) ||
      invoice.customer.name.toLowerCase().includes(val) ||
      invoice.customer.code.toLowerCase().includes(val) ||
      invoice.seller.name.toLowerCase().includes(val)
    );
  };

  const table = useReactTable({
    data: invoices,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    globalFilterFn: customGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      expanded,
    },
  });

  // An invoice named by `?id=` or by the global search's "open-item" event: drop a fulfilment filter
  // that would hide it, then expand its row once it has loaded.
  const [openId, setOpenId] = useState<string | null>(null);

  const requestOpen = (invoiceId: string) => {
    setOpenId(invoiceId);
    invoiceApi
      .getById(invoiceId)
      .then((dto) =>
        setFulfillmentFilter((current) =>
          current === "all" || current === dto.order.fulfillmentType ? current : "all",
        ),
      )
      .catch(() => setOpenId(null));
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const invoiceId = searchParams.get("id") || searchParams.get("invoiceId");
    if (invoiceId) requestOpen(invoiceId);
  }, []);

  useEffect(() => {
    const handleOpenItem = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.type === "/sales/invoices" && customEvent.detail?.id) {
        requestOpen(customEvent.detail.id);
      }
    };
    window.addEventListener("open-item", handleOpenItem);
    return () => window.removeEventListener("open-item", handleOpenItem);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const index = invoices.findIndex((inv) => inv.id === openId);
    if (index === -1) return;
    const pageSize = table.getState().pagination.pageSize || 10;
    table.setPageIndex(Math.floor(index / pageSize));
    // Wait for pagination re-render before setting expanded state
    const t = setTimeout(() => {
      setExpanded({ [openId]: true });
      setOpenId(null);
    }, 0);
    return () => clearTimeout(t);
  }, [invoices, openId, table]);

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelected = selectedRows.length > 0;

  const handleBulkDelete = () => {
    const selectedIds = selectedRows.map((r) => r.original.id);
    setInvoices((prev) => prev.filter((inv) => !selectedIds.includes(inv.id)));
    setRowSelection({});
    toast.success("Đã xóa các hóa đơn được chọn thành công.");
  };

  const handleBulkPrint = () => {
    toast.success(`Đang in ${selectedRows.length} hóa đơn`);
  };

  const handleBulkExport = () => {
    toast.success(`Đã xuất file thành công cho ${selectedRows.length} hóa đơn`);
  };

  const statusFilter = table.getColumn("status")?.getFilterValue() as string;
  const paymentMethodFilter = table.getColumn("paymentMethod")?.getFilterValue() as string;

  return (
    <div className="space-y-4">
      {/* Search + Filters + Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Filter Options */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã HĐ, tên, mã khách, người bán..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="pl-9 h-9 w-full"
            />
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full md:w-40 h-9 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {INVOICE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_MAP[value].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={paymentMethodFilter || "all"}
            onValueChange={(value) => {
              if (value === "all") {
                table.setColumnFilters((prev) =>
                  prev.filter((f) => f.id !== "paymentMethod")
                );
              } else {
                table.setColumnFilters((prev) => [
                  ...prev.filter((f) => f.id !== "paymentMethod"),
                  { id: "paymentMethod", value },
                ]);
              }
            }}
          >
            <SelectTrigger className="cursor-pointer w-full md:w-44 h-9 text-sm">
              <SelectValue placeholder="Phương thức thanh toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phương thức</SelectItem>
              <SelectItem value="CASH">Tiền mặt</SelectItem>
              <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
              <SelectItem value="MOMO">Ví MoMo</SelectItem>
              <SelectItem value="VNPAY">Ví VNPay</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={fulfillmentFilter}
            onValueChange={(value) => {
              setFulfillmentFilter(value as FulfillmentType | "all");
              // The selection belongs to rows that are about to be replaced.
              setRowSelection({});
              setExpanded({});
            }}
          >
            <SelectTrigger className="cursor-pointer w-full md:w-44 h-9 text-sm">
              <SelectValue placeholder="Hình thức giao" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hình thức giao</SelectItem>
              {(Object.keys(FULFILLMENT_TYPE_LABELS) as FulfillmentType[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {FULFILLMENT_TYPE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Side: Bulk Actions & Hide/Show Columns */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {hasSelected && (
            <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md p-1 animate-in slide-in-from-right-4 duration-200">
              <span className="text-xs font-semibold px-2 text-primary">
                {selectedRows.length} đã chọn
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer hover:bg-muted text-primary"
                onClick={handleBulkPrint}
              >
                <Printer className="size-3.5 mr-1" />
                In hóa đơn
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer hover:bg-muted text-green-600"
                onClick={handleBulkExport}
              >
                <Download className="size-3.5 mr-1" />
                Xuất file excel
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs cursor-pointer hover:bg-red-100 hover:text-red-600 text-red-500"
                onClick={handleBulkDelete}
              >
                <Trash2 className="size-3.5 mr-1" />
                Xóa hóa đơn
              </Button>
              <Separator orientation="vertical" className="h-6" />
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer h-9 px-3">
                <Funnel className="size-4 mr-2" />
                Hiển thị cột
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize text-xs"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {COLUMN_LABELS[col.id] ?? col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table grid */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={cIdx}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, rows) => (
                <Fragment key={row.id}>
                  {/* Master Data Row */}
                  <TableRow
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      "cursor-pointer transition-colors duration-200",
                      index === rows.length - 1 && "border-b-0",
                      row.getIsExpanded() &&
                        "bg-primary/5 hover:bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={
                          cell.column.id === "select"
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Expansion Detail Row (CSS Grid Smooth Height Animation) */}
                  <TableRow
                    className={cn(
                      "hover:bg-transparent transition-colors border-transparent",
                      row.getIsExpanded() &&
                        "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.2),inset_1px_0_0_hsl(var(--primary)/0.2),inset_-1px_0_0_hsl(var(--primary)/0.2)]",
                    )}
                  >
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      className="p-0 border-t-0"
                    >
                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-300 ease-in-out",
                          row.getIsExpanded()
                            ? "grid-rows-[1fr]"
                            : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <InvoicesExpandedPanel
                            invoice={row.original}
                            isExpanded={row.getIsExpanded()}
                            isLastRow={index === rows.length - 1}
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Không tìm thấy hóa đơn nào phù hợp.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">Hiển thị</Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-18 h-8 cursor-pointer text-xs">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground">
          Đã chọn {table.getFilteredSelectedRowModel().rows.length} /{" "}
          {table.getFilteredRowModel().rows.length} hóa đơn
        </div>

        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            Trang{" "}
            <strong className="text-foreground font-semibold">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {table.getPageCount()}
            </strong>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer h-8 px-2 text-xs"
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer h-8 px-2 text-xs"
            >
              Tiếp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
