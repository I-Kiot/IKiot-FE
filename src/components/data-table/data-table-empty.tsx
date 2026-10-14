"use client";

import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
  ClipboardList,
  Factory,
  FileText,
  FolderOpen,
  Inbox,
  Package,
  PackageCheck,
  PackageOpen,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  Ticket,
  Truck,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

type EmptyMessage = { icon: LucideIcon; title: string; description: string };

// Thông báo khi bảng rỗng, theo route của trang. Route con (vd. /staffs/holidays) phải nằm trong
// danh sách riêng vì tra theo tiền tố dài nhất. Không có trang admin nào ở đây.
const EMPTY_MESSAGES: Record<string, EmptyMessage> = {
  "/products": {
    icon: Package,
    title: "Không tìm thấy hàng hóa nào",
    description: "Thử thay đổi bộ lọc hoặc thêm hàng hóa mới",
  },
  "/categories": {
    icon: FolderOpen,
    title: "Không tìm thấy danh mục nào",
    description: "Thử thay đổi bộ lọc hoặc thêm danh mục mới",
  },
  "/brands": {
    icon: Tag,
    title: "Không tìm thấy thương hiệu nào",
    description: "Thử thay đổi bộ lọc hoặc thêm thương hiệu mới",
  },
  "/customers": {
    icon: Users,
    title: "Không tìm thấy khách hàng nào",
    description: "Thử thay đổi bộ lọc hoặc thêm khách hàng mới",
  },
  "/promotions": {
    icon: Ticket,
    title: "Không tìm thấy khuyến mãi nào",
    description: "Thử thay đổi bộ lọc hoặc thêm khuyến mãi mới",
  },
  "/exchange/suppliers": {
    icon: Truck,
    title: "Không tìm thấy nhà cung cấp nào",
    description: "Thử thay đổi bộ lọc hoặc thêm nhà cung cấp mới",
  },
  "/exchange/imports": {
    icon: PackageOpen,
    title: "Không có đơn nhập hàng",
    description: "Chưa có đơn nào phù hợp với bộ lọc hiện tại",
  },
  "/exchange/exports": {
    icon: ArrowLeftRight,
    title: "Không có yêu cầu chuyển kho",
    description: "Chưa có yêu cầu nào phù hợp với bộ lọc hiện tại",
  },
  "/exchange/adjustments": {
    icon: SlidersHorizontal,
    title: "Không có phiếu điều chỉnh",
    description: "Chưa có phiếu nào phù hợp với bộ lọc hiện tại",
  },
  "/exchange/production-list": {
    icon: ClipboardList,
    title: "Không có mặt hàng nào",
    description: "Chưa có mặt hàng nào phù hợp với bộ lọc hiện tại",
  },
  "/exchange/production-requests": {
    icon: Factory,
    title: "Chưa có yêu cầu sản xuất nào",
    description: "Chưa có yêu cầu nào phù hợp với bộ lọc hiện tại",
  },
  "/exchange/production-deliveries": {
    icon: Truck,
    title: "Không có phiếu giao nào",
    description: "Chưa có phiếu nào phù hợp với bộ lọc hiện tại",
  },
  "/sales/orders": {
    icon: ShoppingCart,
    title: "Không có đơn hàng",
    description: "Chưa có đơn nào phù hợp với bộ lọc hiện tại",
  },
  "/sales/invoices": {
    icon: FileText,
    title: "Không có hóa đơn",
    description: "Chưa có hóa đơn nào phù hợp với bộ lọc hiện tại",
  },
  "/order-returns": {
    icon: RotateCcw,
    title: "Chưa có đơn hoàn nào",
    description: "Chưa có đơn hoàn nào phù hợp với bộ lọc hiện tại",
  },
  "/fulfillments": {
    icon: PackageCheck,
    title: "Không có đơn nào chờ đóng gói",
    description: "Đơn đã xác nhận sẽ hiện ở đây để đóng gói",
  },
  "/shipments": {
    icon: Truck,
    title: "Không có đơn giao hàng",
    description: "Đơn đã đóng gói và các lần giao sẽ hiện ở đây",
  },
  "/staffs": {
    icon: UsersRound,
    title: "Không có nhân viên",
    description: "Chưa có nhân viên nào phù hợp với bộ lọc hiện tại",
  },
  "/staffs/holidays": {
    icon: CalendarDays,
    title: "Chưa có ngày lễ",
    description: "Chưa có ngày lễ nào phù hợp với bộ lọc hiện tại",
  },
  "/staffs/roles": {
    icon: ShieldCheck,
    title: "Không tìm thấy vai trò nào",
    description: "Thử đổi từ khoá tìm kiếm",
  },
  "/cashflow": {
    icon: Wallet,
    title: "Chưa có giao dịch nào",
    description: "Không có giao dịch nào trong khoảng thời gian này",
  },
};

const FALLBACK_MESSAGE: EmptyMessage = {
  icon: Inbox,
  title: "Không có dữ liệu",
  description: "Chưa có dòng nào phù hợp với bộ lọc hiện tại",
};

// Tra theo tiền tố dài nhất, để /staffs/holidays lấy câu của nó chứ không lấy của /staffs.
function emptyMessageFor(pathname: string): EmptyMessage {
  let bestRoute = "";
  for (const route of Object.keys(EMPTY_MESSAGES)) {
    const matches = pathname === route || pathname.startsWith(`${route}/`);
    if (matches && route.length > bestRoute.length) {
      bestRoute = route;
    }
  }
  if (bestRoute === "") return FALLBACK_MESSAGE;
  return EMPTY_MESSAGES[bestRoute];
}

type Props = {
  columnCount: number;
};

// Một dòng chiếm trọn bề ngang bảng, hiện icon + tiêu đề + mô tả theo route đang xem.
export function DataTableEmpty({ columnCount }: Props) {
  const pathname = usePathname();
  const { icon: Icon, title, description } = emptyMessageFor(pathname);

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columnCount}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="mb-4 size-12 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
