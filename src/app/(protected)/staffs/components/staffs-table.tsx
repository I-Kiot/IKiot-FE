"use client";

import { Fragment, useState } from "react";
import {
  type ExpandedState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Funnel, Search } from "lucide-react";
import { parseLocationKey } from "@/lib/location-key";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import { getSessionRole } from "@/lib/auth";
import {
  canFilterStaffByBranch,
  canFilterStaffByWarehouse,
} from "@/components/sidebar/constants/role-permissions";
import { staffsColumns as columns } from "./staffs-columns";
import { StaffsEmpty } from "./staffs-empty";
import { StaffsExpandedPanel } from "./staffs-expanded-panel";
import { useStaffs } from "./staffs-provider";

const COLUMN_LABELS: Record<string, string> = {
  avatar: "Ảnh",
  fullName: "Nhân viên",
  phoneNumber: "Số điện thoại",
  role: "Vai trò",
  branchName: "Chi nhánh",
  joinedAt: "Ngày vào làm",
  status: "Trạng thái",
};

export function StaffsTable() {
  const {
    staffs,
    isInitialLoading,
    isFetching,
    total,
    totalPages,
    listQuery,
    keywordInput,
    setKeywordInput,
    roleOptions,
    branchOptions,
    warehouseOptions,
    locationKey,
    updateRoleFilter,
    updateStatusFilter,
    updateBranchFilter,
    updateWarehouseFilter,
    updatePage,
    updatePageSize,
  } = useStaffs();

  const userRole = getSessionRole();
  const showBranchFilter = canFilterStaffByBranch(userRole);
  const showWarehouseFilter = canFilterStaffByWarehouse(userRole);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // The global switcher wins over these manual filters (same precedence the
  // provider applies when fetching) - lock them and reflect the active scope
  // instead of showing a stale "Tất cả" while the list is actually filtered.
  const isLocationLocked = locationKey !== "all";
  const lockedLocation = parseLocationKey(locationKey);
  const lockedBranchId =
    lockedLocation?.locationType === "branch" ? lockedLocation.locationId : "all";
  const lockedWarehouseId =
    lockedLocation?.locationType === "warehouse" ? lockedLocation.locationId : "all";

  const table = useReactTable({
    data: staffs,
    columns,
    pageCount: totalPages,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    state: {
      columnVisibility,
      expanded,
      pagination: {
        pageIndex: listQuery.page - 1,
        pageSize: listQuery.limit,
      },
    },
  });

  const rangeStart =
    total === 0 ? 0 : (listQuery.page - 1) * listQuery.limit + 1;
  const rangeEnd = Math.min(listQuery.page * listQuery.limit, total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-48 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm tên, số điện thoại, email..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select
            value={listQuery.roleId}
            onValueChange={(value) =>
              updateRoleFilter(value as typeof listQuery.roleId)
            }
          >
            <SelectTrigger className="cursor-pointer w-48 h-9 text-sm">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={listQuery.status}
            onValueChange={(value) =>
              updateStatusFilter(value as typeof listQuery.status)
            }
          >
            <SelectTrigger className="cursor-pointer w-40 h-9 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
              <SelectItem value="INACTIVE">Ngừng làm việc</SelectItem>
              <SelectItem value="SUSPENDED">Tạm khóa</SelectItem>
            </SelectContent>
          </Select>

          {showBranchFilter && branchOptions.length > 0 && (
            <Select
              value={isLocationLocked ? lockedBranchId : listQuery.branchId}
              onValueChange={updateBranchFilter}
              disabled={isLocationLocked}
            >
              <SelectTrigger className="cursor-pointer w-44 h-9 text-sm">
                <SelectValue placeholder="Chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chi nhánh</SelectItem>
                {branchOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {showWarehouseFilter && warehouseOptions.length > 0 && (
            <Select
              value={isLocationLocked ? lockedWarehouseId : listQuery.warehouseId}
              onValueChange={updateWarehouseFilter}
              disabled={isLocationLocked}
            >
              <SelectTrigger className="cursor-pointer w-44 h-9 text-sm">
                <SelectValue placeholder="Kho hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả kho</SelectItem>
                {warehouseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="cursor-pointer h-9">
              <Funnel />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {COLUMN_LABELS[column.id] ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        className={cn(
          "rounded-md border relative transition-opacity",
          isFetching && staffs.length > 0 && "opacity-60",
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, rows) => (
                <Fragment key={row.id}>
                  <TableRow
                    onClick={() => row.toggleExpanded()}
                    className={cn(
                      "cursor-pointer",
                      index === rows.length - 1 && "border-b-0",
                      row.getIsExpanded() &&
                        "bg-primary/15 shadow-[inset_0_1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow
                    className={cn(
                      "border-transparent transition-colors duration-300 hover:bg-transparent",
                      row.getIsExpanded() &&
                        "shadow-[inset_0_-1px_0_hsl(var(--primary)/0.7),inset_1px_0_0_hsl(var(--primary)/0.7),inset_-1px_0_0_hsl(var(--primary)/0.7)]",
                    )}
                  >
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      className="p-0"
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
                          <StaffsExpandedPanel
                            staff={row.original}
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
                <TableCell colSpan={columns.length}>
                  <StaffsEmpty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label className="text-sm font-medium">Hiển thị</Label>
          <Select
            value={`${listQuery.limit}`}
            onValueChange={(value) => updatePageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer">
              <SelectValue placeholder={listQuery.limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden sm:block text-sm text-muted-foreground">
          {total === 0
            ? "Không có nhân viên"
            : `Hiển thị ${rangeStart}–${rangeEnd} / ${total} nhân viên`}
        </div>
        <div className="flex items-center space-x-2">
          <span className="hidden sm:block text-sm font-medium">
            Trang{" "}
            <strong>
              {listQuery.page} / {totalPages || 1}
            </strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(listQuery.page - 1)}
            disabled={listQuery.page <= 1 || isFetching}
            className="cursor-pointer"
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updatePage(listQuery.page + 1)}
            disabled={listQuery.page >= totalPages || isFetching}
            className="cursor-pointer"
          >
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
