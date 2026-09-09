import Image from "next/image";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import {
  safeImageSrc,
  STATUS_MAP,
  STATUS_ORDER,
} from "../../_constants/product.constants";

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ChevronUp className="size-3" />
      ) : sorted === "desc" ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronsUpDown className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

export function getProductsColumns(
  brands: Brand[],
  categories: Category[],
  // Đang xem theo một chi nhánh/kho cụ thể? Lúc đó cột tồn kho phải nói cả hai con số:
  // tại đây (có thể là 0 vì chưa nhập về) và toàn chuỗi - để nhân viên biết cửa hàng CÓ
  // mặt hàng này mà đề nghị chuyển kho, thay vì tưởng là không bán.
  isLocationScoped = false,
): ColumnDef<Product>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Chọn tất cả"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Chọn dòng"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      id: "image",
      header: "Hình minh họa",
      cell: ({ row }) => {
        const thumbnail =
          row.original.images?.find((i) => i.isThumbnail) ??
          row.original.images?.[0];
        return (
          <div className="relative w-12 h-12">
            <Image
              fill
              src={safeImageSrc(thumbnail?.url)}
              alt={row.original.name}
              className="rounded-md border object-contain"
            />
          </div>
        );
      },
      size: 60,
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader label="Tên hàng hóa" column={column} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "brandId",
      accessorKey: "brandId",
      header: "Thương hiệu",
      cell: ({ row }) => {
        const brand = brands.find((b) => b.id === row.original.brandId);
        return brand ? (
          <Badge variant="secondary" className="text-xs">
            {brand.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      filterFn: (row, _columnId, value: string) =>
        row.original.brandId === value,
    },
    {
      id: "categoryId",
      accessorKey: "categoryId",
      header: "Danh mục",
      cell: ({ row }) => {
        const cat = categories.find((c) => c.id === row.original.categoryId);
        const name = cat?.name ?? row.original.categoryName;
        return name ? (
          <Badge variant="secondary" className="text-xs">
            {name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
      filterFn: (row, _columnId, value: string) =>
        row.original.categoryId === value,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as Product["status"];
        const { label, className } = STATUS_MAP[status];
        return (
          <Badge variant="secondary" className={className}>
            {label}
          </Badge>
        );
      },
      filterFn: (row, columnId, value: string) =>
        row.getValue(columnId) === value,
      sortingFn: (rowA, rowB) =>
        STATUS_ORDER[rowA.original.status] - STATUS_ORDER[rowB.original.status],
    },
    {
      id: "stock",
      accessorKey: "totalStock",
      header: ({ column }) => (
        <SortableHeader label="Tồn kho" column={column} />
      ),
      cell: ({ row }) => {
        const stock = row.original.totalStock ?? 0;
        const allLocations = row.original.totalStockAllLocations ?? stock;
        return (
          <div className="flex flex-col leading-tight">
            <span
              className={cn(
                "font-semibold tabular-nums",
                stock === 0
                  ? "text-destructive"
                  : stock < 10
                    ? "text-orange-500 dark:text-orange-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {stock}
            </span>
            {isLocationScoped && allLocations !== stock && (
              <span className="text-xs text-muted-foreground tabular-nums">
                Toàn chuỗi: {allLocations}
              </span>
            )}
          </div>
        );
      },
      filterFn: (row, _columnId, value: string) => {
        const stock = row.original.totalStock ?? 0;
        if (value === "out") return stock === 0;
        if (value === "low") return stock < 10;
        return true;
      },
    },
    {
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <ChevronRight
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            row.getIsExpanded() && "rotate-90",
          )}
        />
      ),
      size: 40,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
